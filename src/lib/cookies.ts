import { isProduction } from '@/lib/env';

/**
 * Cookies d'authentification.
 *
 * Les jetons ne transitent plus par `localStorage` : tout script injecte dans
 * la page pouvait les y lire et les exfiltrer. En `httpOnly`, ils restent
 * inaccessibles au JavaScript et ne sont poses que par le serveur.
 */

export const ACCESS_COOKIE = 'tf_access';
export const REFRESH_COOKIE = 'tf_refresh';

/** Duree de vie de l'acces : courte, car non revocable une fois emis. */
export const ACCESS_MAX_AGE = 15 * 60; // 15 min

/** Duree de vie du rafraichissement : longue, mais revocable en base. */
export const REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // 30 jours

type CookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  maxAge: number;
};

/**
 * `sameSite: 'lax'` est la protection CSRF principale : le navigateur
 * n'attache pas ces cookies a une requete POST venue d'un autre site.
 */
function base(maxAge: number, path: string): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path,
    maxAge,
  };
}

export function accessCookieOptions(): CookieOptions {
  return base(ACCESS_MAX_AGE, '/');
}

/**
 * Portee racine, et non `/api/auth`.
 *
 * Le limiter aux routes d'authentification reduisait un peu sa surface, mais
 * le middleware — qui s'execute sur les pages — ne le voyait alors pas : passe
 * 15 minutes, le cookie d'acces expire et une navigation vers /dashboard
 * renvoyait vers la connexion alors que la session etait valable.
 *
 * La protection reelle ne venait pas du chemin : elle vient de `httpOnly`
 * (inaccessible au JavaScript) et de `sameSite: 'lax'` (non transmis lors
 * d'une requete inter-sites).
 */
export function refreshCookieOptions(): CookieOptions {
  return base(REFRESH_MAX_AGE, '/');
}

/** Options d'effacement : meme chemin, duree nulle. */
export function clearedAccessOptions(): CookieOptions {
  return base(0, '/');
}

export function clearedRefreshOptions(): CookieOptions {
  return base(0, '/');
}
