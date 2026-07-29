'use server';

import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { ACCESS_COOKIE } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
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
 *
 * Deux écritures, et l'ordre compte. Le cookie d'abord : c'est lui qui
 * pilote le rendu, et il doit être posé même si la personne n'est pas
 * connectée. Le compte ensuite, au mieux — son échec ne doit pas priver
 * quelqu'un de son thème sur cet appareil.
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

  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return;

  const session = verifyToken(token);
  if (!session) return;

  try {
    await prisma.user.update({
      where: { id: session.id },
      data: { themePreference: theme },
    });
  } catch {
    // Le thème est déjà appliqué et déjà persistant sur cet appareil. Une
    // base indisponible ne justifie pas de faire échouer la bascule.
  }
}
