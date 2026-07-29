import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/cookies';

/**
 * Garde de premier niveau sur les pages privees.
 *
 * Elle ne verifie pas la signature du jeton — le middleware s'execute sur le
 * runtime Edge, ou `jsonwebtoken` n'est pas disponible — mais seulement la
 * presence d'un cookie de session. C'est suffisant pour son role : eviter
 * qu'un visiteur non connecte voie s'afficher une coquille de page avant que
 * le client ne le redirige.
 *
 * La verification qui fait autorite reste cote serveur, dans le contexte
 * GraphQL et les routes /api/auth. Ce middleware n'est pas une barriere de
 * securite et ne doit jamais etre traite comme telle.
 */
const PROTECTED_PREFIXES = ['/dashboard', '/profile'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) return NextResponse.next();

  // Le cookie d'acces expire au bout de 15 minutes ; la presence du cookie de
  // rafraichissement suffit donc a laisser passer, le client renouvellera.
  const hasSession =
    req.cookies.has(ACCESS_COOKIE) || req.cookies.has(REFRESH_COOKIE);

  if (hasSession) return NextResponse.next();

  const loginUrl = new URL('/login', req.url);
  // Permet de revenir sur la page demandee apres connexion.
  loginUrl.searchParams.set('suivant', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};
