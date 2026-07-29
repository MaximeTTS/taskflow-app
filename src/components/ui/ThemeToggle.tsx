'use client';

import { useSyncExternalStore, useTransition } from 'react';
import { setThemeCookie } from '@/app/theme-action';
import type { Theme } from '@/lib/theme';
import { Icon } from './Icon';

/**
 * Le thème effectif est un état externe à React : il vit sur `<html>`, et
 * peut aussi changer sans nous quand le système bascule. `useSyncExternalStore`
 * est fait pour exactement ça — le lire dans un effet obligerait à un
 * `setState` en cascade, et à un rendu de plus à chaque montage.
 */
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', onChange);
  return () => {
    listeners.delete(onChange);
    mq.removeEventListener('change', onChange);
  };
}

function getSnapshot(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === 'light' || explicit === 'dark') return explicit;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Au rendu serveur, le thème effectif est indécidable tant qu'aucun choix
 * n'a été fait : il dépend de `prefers-color-scheme`, que seul le navigateur
 * voit. On renvoie `null`, et le bouton reste neutre jusqu'à l'hydratation.
 */
function getServerSnapshot(): Theme | null {
  return null;
}

/**
 * Bascule clair / sombre.
 *
 * L'attribut est posé sur `<html>` avant l'appel serveur : le changement
 * est instantané, et l'action ne fait que le rendre durable.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [, startTransition] = useTransition();

  const next: Theme = theme === 'dark' ? 'light' : 'dark';

  function toggle() {
    document.documentElement.dataset.theme = next;
    notify();
    startTransition(() => {
      void setThemeCookie(next);
    });
  }

  // Avant hydratation le libellé reste générique : annoncer « passer en
  // sombre » alors qu'on ignore l'état courant serait un mensonge pour qui
  // navigue au lecteur d'écran.
  const label = theme ? `Passer au thème ${next === 'dark' ? 'sombre' : 'clair'}` : 'Changer de thème';

  return (
    <button
      type="button"
      onClick={toggle}
      className={`tf-btn tf-btn-ghost tf-icon-btn ${className}`}
      style={{ width: 36, height: 36 }}
      aria-label={label}
      title={label}
    >
      {theme === 'dark' ? <Icon.Sun size={16} /> : <Icon.Moon size={16} />}
    </button>
  );
}
