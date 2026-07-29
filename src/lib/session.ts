import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { REFRESH_MAX_AGE } from '@/lib/cookies';

/**
 * Sessions de rafraichissement.
 *
 * Le jeton remis au client est une valeur aleatoire opaque, pas un JWT : il
 * n'a de sens que par sa presence en base, ce qui permet de le revoquer.
 * Seule son empreinte SHA-256 est stockee, sur le meme principe qu'un mot de
 * passe — une lecture de la base ne donne pas de session utilisable.
 *
 * SHA-256 sans sel suffit ici, contrairement aux mots de passe : le jeton
 * fait 256 bits d'entropie, il n'est donc pas devinable par force brute.
 */

const TOKEN_BYTES = 32;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export type IssuedSession = {
  /** Valeur a poser dans le cookie. Non recuperable ensuite. */
  token: string;
  expiresAt: Date;
};

export async function createSession(userId: string, userAgent?: string): Promise<IssuedSession> {
  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE * 1000);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      userAgent: userAgent?.slice(0, 255),
    },
  });

  return { token, expiresAt };
}

/**
 * Verifie un jeton de rafraichissement et rend l'utilisateur associe.
 * Rend `null` si le jeton est inconnu, expire, ou l'utilisateur supprime.
 */
export async function resolveSession(
  token: string,
): Promise<{ sessionId: string; userId: string; email: string } | null> {
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    // Nettoyage opportuniste : une session expiree n'a plus a exister.
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return { sessionId: session.id, userId: session.user.id, email: session.user.email };
}

/**
 * Remplace une session par une nouvelle (rotation).
 *
 * Un jeton de rafraichissement ne sert qu'une fois : s'il est rejoue apres
 * rotation, il ne correspond plus a rien et l'acces est refuse. Une copie
 * volee cesse donc de fonctionner des que le titulaire legitime se
 * rafraichit.
 */
export async function rotateSession(
  sessionId: string,
  userId: string,
  userAgent?: string,
): Promise<IssuedSession> {
  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE * 1000);

  await prisma.$transaction([
    prisma.session.delete({ where: { id: sessionId } }),
    prisma.session.create({
      data: {
        tokenHash: hashToken(token),
        userId,
        expiresAt,
        userAgent: userAgent?.slice(0, 255),
      },
    }),
  ]);

  return { token, expiresAt };
}

/** Deconnexion : la session cesse d'exister cote serveur. */
export async function revokeSession(token: string): Promise<void> {
  if (!token) return;
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

/** Deconnecte toutes les sessions d'un compte (changement de mot de passe). */
export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

/** Purge des sessions expirees, appelable periodiquement. */
export async function purgeExpiredSessions(): Promise<number> {
  const { count } = await prisma.session.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  return count;
}

/**
 * Comparaison a temps constant, pour les cas ou l'on compare deux valeurs
 * secretes de meme longueur sans passer par la base.
 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
