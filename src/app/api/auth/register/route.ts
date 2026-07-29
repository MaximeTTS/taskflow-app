import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { registerLimiter } from '@/lib/rate-limit';
import {
  assertLength,
  assertValidEmail,
  assertValidPassword,
  normalizeEmail,
  LIMITS,
} from '@/lib/validation';
import { authSuccess, clientIp, errorResponse, isSameOrigin, jsonError } from '../_shared';

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return jsonError('Origine non autorisée', 403);
  }

  try {
    const body = (await req.json()) as { email?: string; password?: string; name?: string };

    if (typeof body.email !== 'string' || typeof body.password !== 'string') {
      return jsonError('Email et mot de passe requis', 400);
    }

    const { allowed, retryAfterMs } = registerLimiter.check(clientIp(req));
    if (!allowed) {
      const minutes = Math.max(1, Math.ceil(retryAfterMs / 60_000));
      return jsonError(`Trop de tentatives. Réessayez dans ${minutes} minute(s).`, 429);
    }

    assertValidEmail(body.email);
    assertValidPassword(body.password);
    assertLength(body.name, 'nom', LIMITS.userName);

    const email = normalizeEmail(body.email);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError('Un compte existe déjà avec cet email', 409);
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: body.name?.trim() || null,
        password: await hashPassword(body.password),
      },
    });

    return await authSuccess(
      { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
      req.headers.get('user-agent') ?? undefined,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
