import { cookies } from 'next/headers';
import { THEME_COOKIE, isTheme } from './theme';
import type { ThemeChoice } from './theme';

/** Lit le choix explicite de l'utilisateur, s'il en a fait un. */
export async function readThemeChoice(): Promise<ThemeChoice> {
  const store = await cookies();
  const raw = store.get(THEME_COOKIE)?.value;
  return isTheme(raw) ? raw : null;
}
