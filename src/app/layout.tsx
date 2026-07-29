import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { Inter, Space_Grotesk } from 'next/font/google';
import { ApolloClientProvider } from '@/components/providers/apollo-provider';
import { THEME_COLOR, readThemeChoice } from '@/lib/theme';
import './globals.css';

/** Inter en texte courant : grande hauteur d'x, donc lisible en petit corps. */
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

/**
 * Space Grotesk sur trois usages seulement — titres de page, noms de
 * colonne, chiffres. C'est cette restriction qui l'empêche de devenir
 * décorative. Ses chiffres tabulaires évitent que les compteurs fassent
 * bouger la mise en page en changeant de valeur.
 */
const grotesk = Space_Grotesk({
  variable: '--font-grotesk',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TaskFlow',
  description: 'Gestionnaire de projets collaboratif',
};

/**
 * Sans choix explicite, le serveur ne peut pas connaître le réglage
 * système : on rend les deux couleurs sous leur `media` et le navigateur
 * tranche. Avec un choix, une seule valeur suffit.
 */
export async function generateViewport(): Promise<Viewport> {
  const choice = await readThemeChoice();

  if (choice) return { themeColor: THEME_COLOR[choice] };

  return {
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: THEME_COLOR.light },
      { media: '(prefers-color-scheme: dark)', color: THEME_COLOR.dark },
    ],
  };
}

/**
 * Lire `headers()` bascule tout l'arbre en rendu dynamique, et c'est
 * délibéré : la CSP porte un nonce régénéré à chaque requête (voir
 * src/proxy.ts), or une page pré-rendue au build embarque un HTML figé,
 * donc sans nonce. Le navigateur bloquerait alors les scripts que Next
 * injecte lui-même et l'application ne démarrerait pas.
 *
 * Ce rendu dynamique paie ici une seconde fois : il permet de lire le
 * cookie de thème et d'écrire `data-theme` directement dans le HTML.
 * Aucun script anti-flash n'est nécessaire — ce qui tombe bien, puisque
 * `script-src` n'accepte pas `unsafe-inline`.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await headers();
  const theme = await readThemeChoice();

  return (
    // Les variables de police vont sur <html>, pas sur <body> : le bloc
    // @theme de Tailwind résout `--font-sans` au niveau de :root, où une
    // variable déclarée sur body n'est pas visible.
    //
    // Sans choix explicite, aucun attribut n'est posé : les rôles restent
    // sous le contrôle de `prefers-color-scheme`, en CSS pur.
    <html
      lang="fr"
      data-theme={theme ?? undefined}
      className={`${inter.variable} ${grotesk.variable}`}
    >
      <body>
        <ApolloClientProvider>{children}</ApolloClientProvider>
      </body>
    </html>
  );
}
