import { create } from 'zustand';

type User = {
  id: string;
  email: string;
  name: string | null;
  avatar?: string | null;
};

type AuthStore = {
  user: User | null;
  isAuthenticated: boolean;
  /** `false` tant que la session n'a pas ete verifiee aupres du serveur. */
  ready: boolean;
  setUser: (user: User) => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
};

/**
 * Session cote client.
 *
 * Il n'y a plus de jeton ici, et c'est le coeur du changement : l'acces et le
 * rafraichissement vivent dans des cookies `httpOnly` que le JavaScript de la
 * page ne peut pas lire. Un jeton en `localStorage` etait lisible par le
 * moindre script tiers ou extension — c'est precisement ce que la refonte de
 * l'authentification a ferme.
 *
 * Ce store ne garde donc que l'identite affichable, et il l'obtient du
 * serveur. `ready` distingue « pas connecte » de « pas encore verifie » :
 * sans lui, chaque page protegee redirigerait vers la connexion pendant le
 * premier rendu, avant meme d'avoir demande.
 */
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  ready: false,

  setUser: (user: User) => set({ user, isAuthenticated: true, ready: true }),

  hydrate: async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (!response.ok) {
        set({ user: null, isAuthenticated: false, ready: true });
        return;
      }
      const data = (await response.json()) as { user: User };
      set({ user: data.user, isAuthenticated: true, ready: true });
    } catch {
      set({ user: null, isAuthenticated: false, ready: true });
    }
  },

  logout: async () => {
    // La deconnexion passe par le serveur : lui seul peut effacer un cookie
    // `httpOnly`, et lui seul peut revoquer la session en base.
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } finally {
      set({ user: null, isAuthenticated: false, ready: true });
    }
  },
}));
