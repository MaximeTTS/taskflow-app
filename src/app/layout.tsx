import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import { ApolloClientProvider } from '@/components/providers/apollo-provider';
import { GlassFilters } from '@/components/glass/GlassFilters';
import { Ground } from '@/components/glass/Ground';
import './globals.css';

/**
 * Bricolage Grotesque en affichage : variable, avec un axe optique qui lui
 * permet de rester dense en gros titres sans devenir illisible.
 */
const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  display: 'swap',
  axes: ['opsz'],
});

/** Instrument Sans en texte courant : grande hauteur d'x, donc lisible
    malgré la baisse de contraste que provoque le verre. */
const instrument = Instrument_Sans({
  variable: '--font-instrument',
  subsets: ['latin'],
  display: 'swap',
});

/** Mono pour les chiffres, les dates et les étiquettes techniques. */
const mono = JetBrains_Mono({
  variable: '--font-tf-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TaskFlow',
  description: 'Gestionnaire de projets collaboratif',
};

export const viewport = {
  themeColor: '#04070e',
};

/**
 * Lire `headers()` bascule tout l'arbre en rendu dynamique, et c'est
 * délibéré : la CSP porte un nonce régénéré à chaque requête (voir
 * src/proxy.ts), or une page pré-rendue au build embarque un HTML figé,
 * donc sans nonce. Le navigateur bloquerait alors les scripts que Next
 * injecte lui-même et l'application ne démarrerait pas.
 *
 * Le coût est réel — plus de pré-rendu statique — mais il ne se discute
 * pas : sans cela, la politique de sécurité et le HTML servi se
 * contredisent.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await headers();

  return (
    // Les variables de police vont sur <html>, pas sur <body> : le bloc
    // @theme de Tailwind résout `--font-display` au niveau de :root, où une
    // variable déclarée sur body n'est pas visible.
    <html lang="fr" className={`${bricolage.variable} ${instrument.variable} ${mono.variable}`}>
      <body>
        {/* Les filtres de réfraction sont référencés par le CSS : un seul
            exemplaire dans le document suffit. */}
        <GlassFilters />
        <Ground />
        <ApolloClientProvider>
          <div className="relative z-[1]">{children}</div>
        </ApolloClientProvider>
      </body>
    </html>
  );
}
