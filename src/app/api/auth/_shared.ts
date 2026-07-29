import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateToken } from '@/lib/auth';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
  clearedAccessOptions,
  clearedRefreshOptions,
} from '@/lib/cookies';
import { createSession, rotateSession } from '@/lib/session';
import { ValidationError } from '@/lib/validation';
import { isProduction } from '@/lib/env';

export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
};

/** Adresse du client, cle du limiteur de debit. Voir lib/apollo-server.ts. */
export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * Refuse les requetes dont l'origine n'est pas le site lui-meme.
 *
 * `sameSite: 'lax'` empeche deja le navigateur d'attacher les cookies a une
 * requete POST inter-sites ; ce controle est une seconde barriere, utile face
 * aux navigateurs anciens et aux redirections inattendues.
 */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  // Une requete sans Origin ne vient pas d'une page web (outil en ligne de
  // commande, test) : on ne la traite pas comme une tentative inter-sites.
  if (!origin) return true;

  try {
    const originHost = new URL(origin).host;
    const requestHost = req.headers.get('host');
    return Boolean(requestHost) && originHost === requestHost;
  } catch {
    return false;
  }
}

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Traduit une exception en reponse HTTP.
 * Les erreurs de validation sont destinees a l'utilisateur ; le reste est
 * masque en production pour ne pas exposer Prisma.
 */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    return jsonError(error.message, 400);
  }

  if (error instanceof Error) {
    if (error.message.startsWith('Trop de tentatives')) {
      return jsonError(error.message, 429);
    }
    if (!isProduction) {
      return jsonError(error.message, 400);
    }
  }

  console.error('[auth]', error);
  return jsonError('Une erreur est survenue', 500);
}

/** Pose les deux cookies d'authentification sur une reponse. */
export function setAuthCookies(
  response: NextResponse,
  user: { id: string; email: string },
  refreshToken: string,
): NextResponse {
  const accessToken = generateToken({ id: user.id, email: user.email });
  response.cookies.set(ACCESS_COOKIE, accessToken, accessCookieOptions());
  response.cookies.set(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return response;
}

/** Reponse d'authentification reussie : l'utilisateur, jamais les jetons. */
export async function authSuccess(
  user: PublicUser,
  userAgent: string | undefined,
  existingSessionId?: string,
): Promise<NextResponse> {
  const { token } = existingSessionId
    ? await rotateSession(existingSessionId, user.id, userAgent)
    : await createSession(user.id, userAgent);

  const response = NextResponse.json({ user });
  return setAuthCookies(response, user, token);
}

/** Efface les cookies d'authentification. */
export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.set(ACCESS_COOKIE, '', clearedAccessOptions());
  response.cookies.set(REFRESH_COOKIE, '', clearedRefreshOptions());
  return response;
}
