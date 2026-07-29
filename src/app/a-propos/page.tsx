import type { Metadata } from 'next';
import Link from 'next/link';
import { Surface } from '@/components/glass/Surface';
import { Button } from '@/components/glass/Button';
import { Mark } from '@/components/glass/AppShell';

export const metadata: Metadata = {
  title: 'À propos — TaskFlow',
  description: 'Ce qu’est TaskFlow, et comment c’est construit.',
};

/**
 * Page à propos.
 *
 * Le sujet est le projet lui-même et ses choix techniques, pas une histoire
 * d'entreprise inventée. C'est ce qui est vrai, et c'est ce qui intéresse
 * quelqu'un qui découvre un projet de portfolio.
 */

const PILE = [
  { quoi: 'Next.js 16', pourquoi: 'App Router, routes serveur, rendu et API dans un seul projet.' },
  { quoi: 'GraphQL + Apollo', pourquoi: 'Un seul point d’entrée, typé de bout en bout.' },
  { quoi: 'Prisma + PostgreSQL', pourquoi: 'Migrations versionnées, requêtes typées.' },
  { quoi: 'TypeScript strict', pourquoi: 'Aucun any toléré dans le code applicatif.' },
  { quoi: 'Tailwind v4', pourquoi: 'Les jetons du design vivent dans le CSS, pas dans un thème JS.' },
  { quoi: 'Jest', pourquoi: 'Tests unitaires sur les permissions, la validation, le rate limiting.' },
];

const CHOIX = [
  {
    titre: 'Les jetons ne touchent jamais le JavaScript',
    texte:
      'La session vit dans deux cookies httpOnly. Le jeton de rafraîchissement est une valeur opaque dont seule l’empreinte est stockée, et il tourne à chaque usage : une copie volée cesse de fonctionner dès que le titulaire légitime se rafraîchit.',
  },
  {
    titre: 'Les permissions sont vérifiées à chaque requête',
    texte:
      'Un rôle n’est jamais déduit du client. Un admin ne peut attribuer qu’un rôle strictement inférieur au sien, ce qui rend l’auto-promotion impossible par construction.',
  },
  {
    titre: 'Le verre est une matière, pas un effet',
    texte:
      'La réfraction, la dispersion sur les arêtes et le reflet qui suit le curseur décrivent tous une propriété réelle du verre épais. La palette en découle : le cyan des arêtes, le magenta de la dispersion.',
  },
];

export default function AProposPage() {
  return (
    <div className="min-h-dvh px-5 py-6 sm:px-8">
      <header className="mx-auto flex max-w-4xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Mark size={30} />
          <span className="text-[15px] font-semibold tracking-[-0.02em]">TaskFlow</span>
        </Link>
        <Link href="/register">
          <Button variant="primary" size="sm">
            Commencer
          </Button>
        </Link>
      </header>

      <main className="mx-auto max-w-3xl pt-[10vh] pb-24">
        <p className="tf-eyebrow mb-6">À propos</p>
        <h1 className="tf-display mb-6 text-[clamp(2.2rem,6vw,3.6rem)]">
          <span className="tf-mask">
            <span>Un outil de gestion,</span>
          </span>
          <span className="tf-mask">
            <span style={{ animationDelay: '0.1s', color: 'var(--color-aqua)' }}>
              construit pour de vrai.
            </span>
          </span>
        </h1>

        <p className="mb-14 max-w-xl text-[16px] leading-relaxed" style={{ color: 'var(--color-haze)' }}>
          TaskFlow est un projet personnel de Maxime Turquet. L’objectif n’était pas de
          concurrencer les outils existants, mais de construire une application complète
          en allant au bout de chaque sujet : l’authentification, les permissions, les
          performances de base de données et le design.
        </p>

        <section className="mb-14">
          <h2 className="tf-display mb-6 text-[1.4rem]">Les choix qui comptent</h2>
          <div className="tf-cascade flex flex-col gap-3.5">
            {CHOIX.map((c) => (
              <Surface key={c.titre} radius="lg" specular className="p-6">
                <h3 className="mb-2 text-[15px] font-semibold tracking-[-0.015em]">{c.titre}</h3>
                <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--color-haze)' }}>
                  {c.texte}
                </p>
              </Surface>
            ))}
          </div>
        </section>

        <section>
          <h2 className="tf-display mb-6 text-[1.4rem]">La pile</h2>
          <Surface radius="xl" panel className="overflow-hidden">
            <ul>
              {PILE.map((p, i) => (
                <li
                  key={p.quoi}
                  className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-baseline sm:gap-6"
                  style={{ borderTop: i === 0 ? undefined : '1px solid var(--rim)' }}
                >
                  <span className="tf-num w-44 shrink-0 text-[13px]">{p.quoi}</span>
                  <span className="text-[13.5px]" style={{ color: 'var(--color-haze)' }}>
                    {p.pourquoi}
                  </span>
                </li>
              ))}
            </ul>
          </Surface>
        </section>
      </main>
    </div>
  );
}
