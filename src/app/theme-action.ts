'use server';

import { cookies } from 'next/headers';
import { THEME_COOKIE, THEME_MAX_AGE, isTheme } from '@/lib/theme';

/**
 * Enregistre le choix d'apparence.
 *
 * Une action serveur plutôt qu'une route : elle n'a pas besoin d'être
 * appelable de l'extérieur, et la CSP à nonce rend tout script inline
 * coûteux — autant ne pas en ajouter un pour écrire un cookie.
 *
 * La bascule côté client pose déjà `data-theme` sur `<html>` avant
 * d'appeler cette action : l'utilisateur voit le changement immédiatement,
 * et cet appel ne fait que le rendre durable.
 */
export async function setThemeCookie(theme: string): Promise<void> {
  if (!isTheme(theme)) return;

  const store = await cookies();
  store.set(THEME_COOKIE, theme, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: THEME_MAX_AGE,
  });
}
