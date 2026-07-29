import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { REFRESH_COOKIE } from '@/lib/cookies';
import { revokeSession } from '@/lib/session';
import { clearAuthCookies, isSameOrigin, jsonError } from '../_shared';

/**
 * Deconnexion.
 *
 * La session est supprimee en base, pas seulement oubliee cote client : la
 * version precedente se contentait d'effacer le localStorage, un jeton copie
 * restait donc valable jusqu'a son expiration.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return jsonError('Origine non autorisée', 403);
  }

  const token = req.cookies.get(REFRESH_COOKIE)?.value;

  if (token) {
    // Un echec de suppression ne doit pas empecher la deconnexion du client.
    await revokeSession(token).catch((error) => console.error('[auth] logout', error));
  }

  return clearAuthCookies(NextResponse.json({ ok: true }));
}
