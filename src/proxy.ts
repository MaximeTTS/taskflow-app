import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/cookies';

/**
 * Politique de sécurité du contenu et garde des pages privées.
 *
 * Nommée `proxy` et non `middleware` : Next.js 16 a renommé la convention.
 */

const PROTECTED_PREFIXES = ['/dashboard', '/profile'];

/**
 * Construit la CSP de la requête autour d'un nonce à usage unique.
 *
 * `script-src` n'accepte plus `'unsafe-inline'` : un script injecté dans la
 * page ne s'exécutera pas s'il ne porte pas le nonce du moment, que
 * l'attaquant ne peut pas deviner. `'strict-dynamic'` autorise les scripts
 * chargés par un script déjà approuvé, ce dont Next.js a besoin pour ses
 * fragments.
 *
 * `style-src` conserve `'unsafe-inline'`, et c'est délibéré : sans lui, le
 * navigateur bloque aussi les attributs `style="…"`, sur lesquels repose tout
 * le système de verre. Le risque n'est pas du même ordre — une injection de
 * style peut défigurer une page, pas exécuter de code.
 */
function buildCsp(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    // Cloudinary sert les avatars et les images de tâches.
    "img-src 'self' data: blob: https://res.cloudinary.com",
    "media-src 'self'",
    "font-src 'self' data:",
    // `ws:` est indispensable au rechargement à chaud de Turbopack.
    `connect-src 'self' https://api.cloudinary.com${isDev ? ' ws: wss:' : ''}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isDev = process.env.NODE_ENV === 'development';

  // ── Garde des pages privées ──────────────────────────────────────
  //
  // Ne vérifie pas la signature du jeton — ce code s'exécute sur le runtime
  // Edge, où `jsonwebtoken` n'est pas disponible — mais seulement la
  // présence d'un cookie de session. C'est suffisant pour son rôle : éviter
  // qu'un visiteur non connecté voie s'afficher une coquille de page.
  //
  // La vérification qui fait autorité reste côté serveur, dans le contexte
  // GraphQL et les routes d'authentification. Ce garde n'est pas une
  // barrière de sécurité et ne doit jamais être traité comme telle.
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !req.cookies.has(ACCESS_COOKIE) && !req.cookies.has(REFRESH_COOKIE)) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('suivant', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Nonce ────────────────────────────────────────────────────────
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const csp = buildCsp(nonce, isDev);

  // Next.js lit `x-nonce` pendant le rendu pour l'apposer sur les scripts
  // qu'il injecte lui-même.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  /**
   * Toutes les pages, mais ni les routes d'API ni les fichiers statiques :
   * une CSP n'a pas de sens sur une réponse JSON ou un fichier JavaScript,
   * et générer un nonce pour chacun serait du travail perdu.
   *
   * Les requêtes de préchargement du routeur sont exclues : elles
   * réutiliseraient une réponse dont le nonce ne correspondrait plus à la
   * page finalement affichée.
   */
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|videos).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
