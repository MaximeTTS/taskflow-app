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
