import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Geist, Geist_Mono } from 'next/font/google';
import { ApolloClientProvider } from '@/components/providers/apollo-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TaskFlow',
  description: 'Gestionnaire de projets collaboratif',
};

/**
 * Lire `headers()` bascule tout l'arbre en rendu dynamique, et c'est
 * delibere.
 *
 * La CSP porte un nonce regenere a chaque requete (voir src/proxy.ts). Or une
 * page pre-rendue au build embarque un HTML fige, donc sans nonce — et comme
 * la politique contient `'strict-dynamic'`, la presence d'un nonce y annule
 * `'self'`. Resultat observe en production : les 17 balises `<script>` de la
 * page d'accueil etaient servies sans nonce, le navigateur les bloquait toutes,
 * React ne demarrait jamais et l'ecran restait vide.
 *
 * En rendu dynamique, Next lit `x-nonce` sur la requete et l'appose lui-meme
 * sur les scripts qu'il injecte. Le cout est reel — plus de pre-rendu statique
 * — mais il ne se discute pas : sans cela, la politique de securite et le HTML
 * servi se contredisent.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await headers();

  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ApolloClientProvider>{children}</ApolloClientProvider>
      </body>
    </html>
  );
}
