import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';

/**
 * Jetons de confirmation d'adresse email.
 *
 * Mêmes principes que les sessions et la réinitialisation : valeur aléatoire
 * opaque de 256 bits, dont seule l'empreinte SHA-256 est stockée.
 *
 * Durée plus longue que pour une réinitialisation (24 h contre 30 min) : un
 * lien de confirmation ne donne pas accès au compte, il atteste seulement que
 * la boîte mail répond. Le risque à le laisser vivre est faible, et l'ouvrir
 * le lendemain matin est un comportement parfaitement normal.
 *
 * L'adresse visée est stockée avec le jeton, et c'est ce qui permet à ce même
 * mécanisme de servir au changement d'adresse : la nouvelle n'est appliquée au
 * compte qu'à l'ouverture du lien.
 */

const TOKEN_BYTES = 32;
export const VERIFICATION_TTL_HOURS = 24;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Émet un jeton pour ce compte et cette adresse.
 *
 * Les jetons précédents du même compte sont invalidés : demander un nouveau
 * lien doit rendre l'ancien inopérant. C'est ce qui empêche un changement
 * d'adresse abandonné de rester confirmable des heures plus tard.
 */
export async function issueVerificationToken(userId: string, email: string): Promise<string> {
  const token = randomBytes(TOKEN_BYTES).toString('base64url');

  await prisma.$transaction([
    prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.emailVerificationToken.create({
      data: {
        tokenHash: hashToken(token),
        userId,
        email,
        expiresAt: new Date(Date.now() + VERIFICATION_TTL_HOURS * 60 * 60 * 1000),
      },
    }),
  ]);

  return token;
}

export type VerificationResult = {
  userId: string;
  email: string;
  /** L'adresse confirmée diffère-t-elle de celle que portait le compte ? */
  changed: boolean;
};

/**
 * Consomme un jeton, applique l'adresse au compte et le marque vérifié.
 *
 * Rend `null` si le jeton est inconnu, expiré ou déjà utilisé — les trois cas
 * sont indistinguables côté appelant.
 *
 * Le tout dans une transaction : marquer le jeton consommé sans appliquer
 * l'adresse laisserait un compte définitivement non vérifié avec un lien
 * inutilisable.
 */
export async function consumeVerificationToken(token: string): Promise<VerificationResult | null> {
  if (!token) return null;

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!record || record.usedAt !== null || record.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  const changed = record.user.email !== record.email;

  try {
    await prisma.$transaction(async (tx) => {
      // `usedAt: null` dans la clause rend l'opération atomique : deux
      // requêtes simultanées avec le même lien ne peuvent pas la franchir
      // toutes les deux.
      const { count } = await tx.emailVerificationToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      if (count === 0) throw new JetonDejaConsomme();

      await tx.user.update({
        where: { id: record.userId },
        data: { email: record.email, emailVerifiedAt: new Date() },
      });
    });
  } catch (error) {
    if (error instanceof JetonDejaConsomme) return null;

    // Cas réel : l'adresse a été prise par quelqu'un d'autre entre l'émission
    // du lien et son ouverture. La contrainte d'unicité fait échouer la
    // transaction, et le jeton n'est pas consommé — l'utilisateur peut
    // recommencer avec une autre adresse.
    console.error('[verification] application impossible', error);
    return null;
  }

  return { userId: record.userId, email: record.email, changed };
}

/** Signale une course perdue, sans polluer le journal d'erreurs. */
class JetonDejaConsomme extends Error {}

/** Purge des jetons expirés ou consommés, appelable périodiquement. */
export async function purgeVerificationTokens(): Promise<number> {
  const { count } = await prisma.emailVerificationToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lte: new Date() } }, { usedAt: { not: null } }],
    },
  });
  return count;
}
