import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { loginLimiter } from '@/lib/rate-limit';
import { normalizeEmail } from '@/lib/validation';
import { authSuccess, clientIp, errorResponse, isSameOrigin, jsonError } from '../_shared';

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return jsonError('Origine non autorisée', 403);
  }

  try {
    const body = (await req.json()) as { email?: string; password?: string };

    if (typeof body.email !== 'string' || typeof body.password !== 'string') {
      return jsonError('Email et mot de passe requis', 400);
    }

    const ip = clientIp(req);
    const email = normalizeEmail(body.email);

    // Deux quotas : par adresse (balayage de comptes) et par compte vise
    // (attaque repartie sur plusieurs adresses contre un compte precis).
    for (const key of [ip, `compte:${email}`]) {
      const { allowed, retryAfterMs } = loginLimiter.check(key);
      if (!allowed) {
        const minutes = Math.max(1, Math.ceil(retryAfterMs / 60_000));
        return jsonError(`Trop de tentatives. Réessayez dans ${minutes} minute(s).`, 429);
      }
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Message identique dans les deux cas : distinguer « compte inconnu » de
    // « mot de passe faux » permettrait d'enumerer les comptes existants.
    if (!user) {
      return jsonError('Email ou mot de passe incorrect', 401);
    }

    const isValid = await verifyPassword(body.password, user.password);
    if (!isValid) {
      return jsonError('Email ou mot de passe incorrect', 401);
    }

    return await authSuccess(
      { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
      req.headers.get('user-agent') ?? undefined,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
