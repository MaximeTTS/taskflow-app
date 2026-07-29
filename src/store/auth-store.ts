import { create } from 'zustand';
import { apolloClient } from '@/lib/apollo-client';

export type User = {
  id: string;
  email: string;
  name: string | null;
  avatar?: string | null;
};

type AuthStore = {
  user: User | null;
  isAuthenticated: boolean;
  /** Vrai tant que la session n'a pas ete verifiee aupres du serveur. */
  isLoading: boolean;

  setUser: (user: User) => void;
  logout: () => Promise<void>;
  /** Rehydrate la session depuis le cookie, avec rafraichissement si besoin. */
  hydrate: () => Promise<void>;
};

/**
 * Le jeton n'est plus stocke ici, ni nulle part cote client : il vit dans un
 * cookie `httpOnly` que le JavaScript ne peut pas lire. Ce store ne conserve
 * que l'identite affichable, rechargee depuis /api/auth/me.
 */
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user: User) => set({ user, isAuthenticated: true, isLoading: false }),

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      // La session serveur peut deja etre morte ; on nettoie le client quoi
      // qu'il arrive.
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
    await apolloClient.clearStore().catch(() => {});
  },

  hydrate: async () => {
    async function fetchMe(): Promise<User | null> {
      const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (!response.ok) return null;
      const data = (await response.json()) as { user: User | null };
      return data.user;
    }

    try {
      let user = await fetchMe();

      // Acces expire mais session encore valable : on renouvelle puis on
      // redemande, plutot que de renvoyer l'utilisateur vers la connexion.
      if (!user) {
        const refreshed = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'same-origin',
        });
        if (refreshed.ok) {
          user = await fetchMe();
        }
      }

      set({ user, isAuthenticated: Boolean(user), isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
