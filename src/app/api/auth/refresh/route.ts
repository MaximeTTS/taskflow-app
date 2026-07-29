import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { REFRESH_COOKIE } from '@/lib/cookies';
import { resolveSession } from '@/lib/session';
import { authSuccess, clearAuthCookies, errorResponse, isSameOrigin, jsonError } from '../_shared';

/**
 * Renouvelle l'acces a partir du cookie de rafraichissement.
 *
 * La session est tournee a chaque appel : le jeton precedent cesse d'etre
 * valable, donc une copie volee ne fonctionne plus des que le titulaire
 * legitime se rafraichit.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return jsonError('Origine non autorisée', 403);
  }

  try {
    const token = req.cookies.get(REFRESH_COOKIE)?.value;

    if (!token) {
      return jsonError('Session expirée', 401);
    }

    const session = await resolveSession(token);

    if (!session) {
      // Jeton inconnu ou expire : on efface les cookies pour que le client
      // cesse de reessayer avec une session morte.
      return clearAuthCookies(NextResponse.json({ error: 'Session expirée' }, { status: 401 }));
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, avatar: true },
    });

    if (!user) {
      return clearAuthCookies(NextResponse.json({ error: 'Session expirée' }, { status: 401 }));
    }

    return await authSuccess(user, req.headers.get('user-agent') ?? undefined, session.sessionId);
  } catch (error) {
    return errorResponse(error);
  }
}
