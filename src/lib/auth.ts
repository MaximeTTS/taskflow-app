import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '@/types/context';
import { getJwtSecret } from '@/lib/env';

// ============================================
// MOTS DE PASSE
// ============================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ============================================
// JWT
// ============================================

/**
 * Durée de vie courte : le jeton n'est plus stocké côté client de façon
 * révocable, une fenêtre réduite limite l'impact d'une fuite.
 */
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1 h

export function generateToken(payload: JwtPayload): string {
  // Le secret est lu à chaque appel, jamais figé au chargement du module :
  // cela laisse `getJwtSecret()` lever au bon moment plutôt qu'au premier
  // import, et rend la valeur remplaçable dans les tests.
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    // `jwt.verify` peut rendre une chaîne pour un jeton dont la charge utile
    // n'est pas un objet JSON. On refuse ce cas plutôt que de le transtyper.
    if (typeof decoded === 'string' || decoded === null) return null;
    const { id, email } = decoded as Record<string, unknown>;
    if (typeof id !== 'string' || typeof email !== 'string') return null;
    return { id, email };
  } catch {
    return null;
  }
}

// ============================================
// EXTRACTION DU TOKEN DEPUIS LES HEADERS
// ============================================

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;

  // Le header ressemble à : "Bearer eyJhbGci..."
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1] ?? null;
}
