import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '@/types/context';

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret';

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

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
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
