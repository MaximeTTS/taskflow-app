import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Mark } from '@/components/ui/AppShell';
import { Avatar } from '@/components/ui/Avatar';
import { PriorityPill } from '@/components/ui/Pill';
import type { Priority } from '@/components/ui/Pill';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Counter } from '@/components/motion/Counter';
import { Magnetic } from '@/components/motion/Magnetic';
import { Marquee } from '@/components/motion/Marquee';
import { Parallax } from '@/components/motion/Parallax';
import { Reveal } from '@/components/motion/Reveal';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { StackCard, StackSection } from '@/components/motion/StackSection';
import { TiltCard } from '@/components/motion/TiltCard';

/**
 * Page d'accueil.
 *
 * Le parti pris tient en une phrase : la page se comporte comme un tableau.
 * Le contenu arrive en cartes qui voyagent, s'empilent et se posent, parce
 * que le geste caractéristique du produit est une carte qui traverse une
 * colonne. Chaque effet est dérivé de ce vocabulaire — aucun n'est plaqué.
 *
 * Les liens pointent tous vers quelque chose qui existe.
 */

const NAV = [
  { label: 'Le tableau', href: '#tableau' },
  { label: 'Ce que ça fait', href: '#promesses' },
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'À propos', href: '/a-propos' },
];

/** Le bandeau : de vrais intitulés de tâches, pas des mots-clés. */
const BACKLOG = [
  'Migrer les jetons de couleur',
  'Purger les sessions expirées',
  'Écrire les tests du sélecteur',
  'Compresser les vidéos de fond',
  'Reprendre le header global',
  'Journaliser les changements de rôle',
];

type Tache = {
  titre: string;
  prio: Priority;
  echeance: string;
  qui: string;
  /** Échéance dépassée : la date passe au rouge. */
  retard?: boolean;
};

const COLONNES: { nom: string; total: number; taches: Tache[] }[] = [
  {
    nom: 'À faire',
    total: 5,
    taches: [
      {
        titre: 'Migrer les jetons de couleur vers la couche sémantique',
        prio: 'MEDIUM' as const,
        echeance: '2 août',
        qui: 'Maxime Lefebvre',
      },
      {
        titre: 'Écrire les tests du sélecteur de thème',
        prio: 'LOW' as const,
        echeance: '4 août',
        qui: 'Anne Duval',
      },
    ],
  },
  {
    nom: 'En cours',
    total: 3,
    taches: [
      {
        titre: 'Panneau de personnalisation des fonds',
        prio: 'URGENT' as const,
        echeance: 'Hier',
        qui: 'Rachid Kaci',
        retard: true,
      },
      {
        titre: 'Reprendre le header global',
        prio: 'HIGH' as const,
        echeance: '5 août',
        qui: 'Maxime Lefebvre',
      },
    ],
  },
  {
    nom: 'En revue',
    total: 2,
    taches: [
      {
        titre: 'Purger les sessions expirées',
        prio: 'MEDIUM' as const,
        echeance: "Aujourd'hui",
        qui: 'Anne Duval',
      },
    ],
  },
  {
    nom: 'Terminé',
    total: 8,
    taches: [
      {
        titre: 'Cookies httpOnly et sessions révocables',
        prio: 'LOW' as const,
        echeance: '28 juillet',
        qui: 'Rachid Kaci',
      },
    ],
  },
];

const PRIO_COULEUR: Record<string, string> = {
  URGENT: 'var(--danger)',
  HIGH: 'var(--warning)',
  MEDIUM: 'var(--accent-2)',
  LOW: 'var(--text-3)',
};

/** Trois promesses, chacune adossée à une fonction réellement implémentée. */
const PROMESSES = [
  {
    numero: '01',
    titre: 'Les rôles sont appliqués côté serveur',
    texte:
      'Propriétaire, admin, membre, lecture. La vérification ne vit pas dans le bouton qu’on peut masquer, elle vit dans le résolveur qu’on ne peut pas contourner. Un lecteur qui forge une requête se fait refuser comme un lecteur.',
    icone: <Icon.Shield size={20} />,
  },
  {
    numero: '02',
    titre: 'Chaque déplacement est enregistré',
    texte:
      'Une carte qu’on déplace change d’état en base, pas seulement à l’écran. Qui a changé quoi et quand se relit ensuite — y compris après la suppression du projet, parce qu’un journal qui disparaît avec ce qu’il décrit ne sert à rien.',
    icone: <Icon.Layers size={20} />,
  },
  {
    numero: '03',
    titre: 'L’avancement se lit sans ouvrir une tâche',
    texte:
      'La barre à gauche de chaque carte porte la priorité, le compteur de colonne dit le volume, l’échéance dépassée passe au rouge. Le tableau répond avant qu’on ait cliqué.',
    icone: <Icon.Board size={20} />,
  },
];

const CHIFFRES = [
  { valeur: 231, suffixe: '', libelle: 'tests automatisés au vert' },
  { valeur: 4, suffixe: '', libelle: 'rôles distincts, vérifiés côté serveur' },
  { valeur: 100, suffixe: ' %', libelle: 'des mutations passent par les permissions' },
];

export default function LandingPage() {
  return (
    <div>
      {/* ═══ En-tête ═══════════════════════════════════════════════ */}
      <header className="tf-glass sticky top-0 z-40" style={{ borderInline: 0, borderTop: 0 }}>
        <div className="mx-auto flex h-[60px] max-w-6xl items-center gap-4 px-5 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Mark size={26} />
            <span className="text-[14.5px] font-semibold tracking-[-0.02em]">TaskFlow</span>
          </Link>

          <nav className="ml-6 hidden flex-1 items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="tf-nav-item">
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="tf-nav-item hidden sm:inline-flex">
              Connexion
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                Commencer
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ═══ Héros ═══════════════════════════════════════════════
            L'échelle typographique porte tout. Le titre se dévoile
            caractère par caractère, de sous sa propre ligne. */}
        <section className="mx-auto max-w-6xl px-5 pt-[13vh] pb-[12vh] sm:px-8">
          <Reveal as="p" className="mb-8">
            <span className="tf-eyebrow">Kanban collaboratif · Next.js · GraphQL · Prisma</span>
          </Reveal>

          <SplitHeading className="tf-display max-w-4xl text-[clamp(2.9rem,9vw,6.5rem)]">
            Le tableau qui dit la vérité sur le sprint.
          </SplitHeading>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <Reveal as="p" delay={0.5}>
              <span
                className="block max-w-lg text-[16.5px] leading-relaxed"
                style={{ color: 'var(--text-2)' }}
              >
                Pas un mur de post-its qu’il faut interpréter. Un tableau où chaque déplacement
                change l’état en base, où les permissions tiennent, et où l’on voit ce qui bloque
                sans ouvrir une seule tâche.
              </span>
            </Reveal>

            <div className="flex flex-wrap items-center gap-2">
              <Magnetic>
                <Link href="/register">
                  <Button variant="primary" size="lg">
                    Créer un compte
                    <Icon.Arrow size={16} />
                  </Button>
                </Link>
              </Magnetic>
              <Magnetic>
                <Link href="/login">
                  <Button variant="ghost" size="lg">
                    Se connecter
                  </Button>
                </Link>
              </Magnetic>
            </div>
          </div>
        </section>

        {/* ═══ Bandeau ═════════════════════════════════════════════
            Le backlog en ticker. Plein et contour alternés pour donner
            du rythme sans ajouter de couleur. */}
        <section
          className="py-8"
          style={{ borderBlock: '1px solid var(--border)' }}
          aria-label="Extrait du backlog"
        >
          <Marquee speed={34}>
            {BACKLOG.map((t, i) => (
              <span
                key={t}
                className={`tf-marquee-item${i % 2 === 1 ? ' tf-marquee-ghost' : ''}`}
              >
                <i />
                {t}
              </span>
            ))}
          </Marquee>
        </section>

        {/* ═══ Le tableau ══════════════════════════════════════════
            Rendu par les mêmes classes que l'application. Ce qu'on
            montre est ce qu'on livre. */}
        <section id="tableau" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-[12vh] sm:px-8">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal as="p" className="mb-3">
                <span className="tf-eyebrow">Le tableau</span>
              </Reveal>
              <SplitHeading
                as="h2"
                onScroll
                className="tf-display max-w-2xl text-[clamp(1.9rem,4.6vw,3.2rem)]"
              >
                Quatre colonnes. Rien à interpréter.
              </SplitHeading>
            </div>
            <Reveal as="p">
              <span className="max-w-xs text-[13.5px]" style={{ color: 'var(--text-2)' }}>
                Survole une carte : l’arête gauche s’épaissit sur la priorité qu’elle porte déjà.
              </span>
            </Reveal>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {COLONNES.map((col, ci) => (
              <Parallax key={col.nom} amount={ci % 2 === 0 ? 5 : -5}>
                <div>
                  <Reveal as="div" delay={ci * 0.08}>
                    <div className="tf-col-head">
                      <span className="tf-col-name">{col.nom}</span>
                      <span className="tf-col-count">{col.total}</span>
                    </div>
                  </Reveal>

                  <div className="flex flex-col gap-2.5">
                    {col.taches.map((t, ti) => (
                      <Reveal key={t.titre} as="div" delay={ci * 0.08 + ti * 0.06}>
                        <TiltCard>
                          <article
                            className="tf-card"
                            style={{ '--prio': PRIO_COULEUR[t.prio] } as React.CSSProperties}
                          >
                            <p className="text-[13px] font-medium leading-snug">{t.titre}</p>
                            <div className="mt-3 flex items-center gap-2">
                              <PriorityPill priority={t.prio} />
                              <span
                                className="text-[11px]"
                                style={{
                                  color: t.retard ? 'var(--danger-text)' : 'var(--text-3)',
                                }}
                              >
                                {t.echeance}
                              </span>
                              <span className="ml-auto">
                                <Avatar name={t.qui} size={20} />
                              </span>
                            </div>
                          </article>
                        </TiltCard>
                      </Reveal>
                    ))}

                    <button className="tf-add-ghost" type="button" tabIndex={-1} aria-hidden="true">
                      + Ajouter une tâche
                    </button>
                  </div>
                </div>
              </Parallax>
            ))}
          </div>
        </section>

        {/* ═══ Promesses ═══════════════════════════════════════════
            Les cartes s'empilent en collant : une colonne qui se
            remplit, appliquée à la page. */}
        <section id="promesses" className="mx-auto max-w-4xl scroll-mt-20 px-5 sm:px-8">
          <div className="mb-14">
            <Reveal as="p" className="mb-3">
              <span className="tf-eyebrow">Ce que ça fait</span>
            </Reveal>
            <SplitHeading
              as="h2"
              onScroll
              className="tf-display max-w-2xl text-[clamp(1.9rem,4.6vw,3.2rem)]"
            >
              Trois promesses, trois fonctions qui existent.
            </SplitHeading>
          </div>

          <StackSection className="pb-[30vh]">
            {PROMESSES.map((p, i) => (
              <StackCard key={p.numero} index={i} className="pb-6">
                <div
                  className="tf-surface tf-lift-3 p-8 sm:p-11"
                  style={{ borderRadius: 'var(--r-3)' }}
                >
                  <div className="mb-6 flex items-center gap-4">
                    <span
                      className="flex h-11 w-11 items-center justify-center"
                      style={{
                        borderRadius: 'var(--r-1)',
                        background: 'color-mix(in oklab, var(--accent) 14%, transparent)',
                        color: 'var(--accent-text)',
                      }}
                    >
                      {p.icone}
                    </span>
                    {/* Le numéro est de l'information : ce sont trois
                        promesses ordonnées, du socle vers la surface. */}
                    <span className="tf-num text-[13px]" style={{ color: 'var(--text-3)' }}>
                      {p.numero}
                    </span>
                  </div>

                  <h3 className="tf-display mb-4 text-[clamp(1.4rem,3vw,2rem)]">{p.titre}</h3>
                  <p
                    className="max-w-xl text-[15px] leading-relaxed"
                    style={{ color: 'var(--text-2)' }}
                  >
                    {p.texte}
                  </p>
                </div>
              </StackCard>
            ))}
          </StackSection>
        </section>

        {/* ═══ Chiffres ════════════════════════════════════════════ */}
        <section
          className="py-[10vh]"
          style={{ borderBlock: '1px solid var(--border)' }}
        >
          <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:grid-cols-3 sm:px-8">
            {CHIFFRES.map((c) => (
              <div key={c.libelle}>
                <p className="tf-display mb-2 text-[clamp(2.4rem,6vw,3.6rem)]">
                  <Counter to={c.valeur} suffix={c.suffixe} />
                </p>
                <Reveal as="p">
                  <span className="text-[13.5px]" style={{ color: 'var(--text-2)' }}>
                    {c.libelle}
                  </span>
                </Reveal>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ Appel final ═════════════════════════════════════════ */}
        <section className="mx-auto max-w-4xl px-5 py-[16vh] text-center sm:px-8">
          <SplitHeading
            as="h2"
            onScroll
            className="tf-display mx-auto max-w-3xl text-[clamp(2.2rem,6.5vw,4.4rem)]"
          >
            Ouvre un tableau. Déplace une carte.
          </SplitHeading>

          <Reveal as="p" className="mt-7">
            <span
              className="mx-auto block max-w-md text-[15.5px] leading-relaxed"
              style={{ color: 'var(--text-2)' }}
            >
              Le compte est gratuit et le premier projet prend une minute.
            </span>
          </Reveal>

          <div className="mt-10 flex justify-center">
            <Magnetic strength={0.5} radius={28}>
              <Link href="/register">
                <Button variant="primary" size="lg">
                  Créer un compte
                  <Icon.Arrow size={16} />
                </Button>
              </Link>
            </Magnetic>
          </div>
        </section>
      </main>

      {/* ═══ Pied ══════════════════════════════════════════════════ */}
      <footer style={{ borderTop: '1px solid var(--border)' }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-5 py-10 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Mark size={24} />
            <span className="text-[13.5px] font-semibold tracking-[-0.02em]">TaskFlow</span>
          </Link>

          <nav className="flex flex-wrap items-center gap-5 text-[13px]">
            <Link href="/tarifs" className="tf-link">
              Tarifs
            </Link>
            <Link href="/a-propos" className="tf-link">
              À propos
            </Link>
            <Link href="/login" className="tf-link">
              Connexion
            </Link>
          </nav>

          <p className="ml-auto text-[12.5px]" style={{ color: 'var(--text-3)' }}>
            Projet personnel, code ouvert.
          </p>
        </div>
      </footer>
    </div>
  );
}
