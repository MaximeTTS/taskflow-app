'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

/**
 * Garde d'authentification des pages privees.
 *
 * Les jetons etant `httpOnly`, le client ne peut plus deduire son etat de
 * connexion en lisant `localStorage` : il doit interroger le serveur. D'ou
 * l'etat `isLoading`, pendant lequel la page ne doit rien afficher de
 * definitif — sans quoi elle renverrait vers /login a chaque rechargement,
 * le temps que la verification aboutisse.
 */
export function useRequireAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, hydrate } = useAuthStore();

  useEffect(() => {
    if (isLoading) void hydrate();
  }, [isLoading, hydrate]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  return { user, isAuthenticated, isLoading };
}
