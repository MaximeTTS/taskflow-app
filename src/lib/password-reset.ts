import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';

/**
 * Jetons de réinitialisation de mot de passe.
 *
 * Mêmes principes que les sessions : valeur aléatoire opaque de 256 bits,
 * dont seule l'empreinte SHA-256 est stockée. Une lecture de la base ne
 * permet donc pas de forger un lien valide.
 *
 * Durée volontairement courte : un lien de réinitialisation est un
 * équivalent temporaire du mot de passe.
 */

const TOKEN_BYTES = 32;
export const RESET_TTL_MINUTES = 30;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Émet un jeton pour ce compte.
 *
 * Les jetons précédents encore valables sont invalidés : demander un nouveau
 * lien doit rendre l'ancien inopérant, sans quoi un lien intercepté reste
 * utilisable.
 */
export async function issueResetToken(userId: string): Promise<string> {
  const token = randomBytes(TOKEN_BYTES).toString('base64url');

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: {
        tokenHash: hashToken(token),
        userId,
        expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000),
      },
    }),
  ]);

  return token;
}

/** Compte visé par un jeton, tel qu'il sert à juger le nouveau mot de passe. */
export type ResetTarget = {
  userId: string;
  email: string;
  name: string | null;
};

/**
 * Lit un jeton sans le consommer.
 *
 * Existe pour une raison précise : le contrôle de robustesse du nouveau mot de
 * passe a besoin de l'email et du nom du compte, et il doit avoir lieu *avant*
 * la consommation — sinon un mot de passe refusé brûlerait le lien et
 * obligerait à en redemander un.
 *
 * Ne révèle rien : l'appelant ne connaît le compte que s'il détient déjà un
 * jeton valide, c'est-à-dire s'il a accès à la boîte mail.
 */
export async function resolveResetToken(token: string): Promise<ResetTarget | null> {
  if (!token) return null;

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!record || record.usedAt !== null || record.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  return { userId: record.user.id, email: record.user.email, name: record.user.name };
}

/**
 * Consomme un jeton et rend le compte concerné.
 *
 * Rend `null` si le jeton est inconnu, expiré ou déjà utilisé — les trois cas
 * sont indistinguables côté appelant, pour ne rien révéler.
 */
export async function consumeResetToken(token: string): Promise<{ userId: string } | null> {
  if (!token) return null;

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!record || record.usedAt !== null || record.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  // Marqué consommé avant tout usage : deux requêtes simultanées avec le
  // même lien ne doivent pas réinitialiser deux fois. `usedAt: null` dans la
  // clause rend l'opération atomique.
  const { count } = await prisma.passwordResetToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  if (count === 0) return null;

  return { userId: record.userId };
}

/** Purge des jetons expirés ou consommés, appelable périodiquement. */
export async function purgeResetTokens(): Promise<number> {
  const { count } = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lte: new Date() } }, { usedAt: { not: null } }],
    },
  });
  return count;
}
