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
import { Reveal, Rise } from '@/components/motion/Reveal';
import { ScrollText } from '@/components/motion/ScrollText';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { StackCard, StackSection } from '@/components/motion/StackSection';
import { StairsMenu } from '@/components/motion/StairsMenu';
import { TiltCard } from '@/components/motion/TiltCard';

/**
 * Page d'accueil.
 *
 * Le parti pris tient en une phrase : la page se comporte comme un tableau.
 * Le contenu arrive en cartes, s'empile et se pose, parce que le geste
 * caractéristique du produit est une carte qui traverse une colonne.
 *
 * Deux disciplines tiennent la mise en page, et elles ont été apprises en
 * cassant les deux :
 *
 *  1. **Aucune animation ne déplace un élément de grille.** Une parallaxe par
 *     colonne détruit l'alignement — c'est la grille qui gagne, toujours.
 *  2. **Aucun masque autour d'un bloc qui se soulève.** `Reveal` impose
 *     `overflow: hidden` et rognait le survol des cartes : les blocs passent
 *     par `Rise`, le masque est réservé au texte.
 *
 * L'échelle typographique part du mobile : les minimums des `clamp()` sont
 * lisibles à 375 px, et c'est le maximum qui s'ouvre sur grand écran.
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

/**
 * Deux tâches par colonne, sans exception.
 *
 * Un tableau réel est déséquilibré, mais une vitrine qui l'imite donne
 * quatre colonnes de hauteurs différentes et la grille paraît cassée. Le
 * compteur, lui, dit le vrai volume.
 */
const COLONNES: { nom: string; total: number; taches: Tache[] }[] = [
  {
    nom: 'À faire',
    total: 5,
    taches: [
      {
        titre: 'Migrer les jetons de couleur vers la couche sémantique',
        prio: 'MEDIUM',
        echeance: '2 août',
        qui: 'Maxime Lefebvre',
      },
      {
        titre: 'Écrire les tests du sélecteur de thème',
        prio: 'LOW',
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
        prio: 'URGENT',
        echeance: 'Hier',
        qui: 'Rachid Kaci',
        retard: true,
      },
      {
        titre: 'Reprendre le header global',
        prio: 'HIGH',
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
        prio: 'MEDIUM',
        echeance: "Aujourd'hui",
        qui: 'Anne Duval',
      },
      {
        titre: 'Limiter la profondeur des requêtes GraphQL',
        prio: 'HIGH',
        echeance: '6 août',
        qui: 'Rachid Kaci',
      },
    ],
  },
  {
    nom: 'Terminé',
    total: 8,
    taches: [
      {
        titre: 'Cookies httpOnly et sessions révocables',
        prio: 'LOW',
        echeance: '28 juillet',
        qui: 'Rachid Kaci',
      },
      {
        titre: 'Compresser les vidéos de fond',
        prio: 'LOW',
        echeance: '26 juillet',
        qui: 'Anne Duval',
      },
    ],
  },
];

const PRIO_COULEUR: Record<Priority, string> = {
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
  { valeur: 4, suffixe: '', libelle: 'rôles vérifiés côté serveur' },
  { valeur: 100, suffixe: ' %', libelle: 'des mutations passent par les permissions' },
];

/** Une seule largeur de contenu et un seul rembourrage pour toute la page. */
const SHELL = 'mx-auto w-full max-w-6xl px-5 sm:px-8';

export default function LandingPage() {
  return (
    <div>
      {/* ═══ En-tête ═══════════════════════════════════════════════ */}
      <header className="tf-glass sticky top-0 z-40" style={{ borderInline: 0, borderTop: 0 }}>
        <div className={`${SHELL} flex h-[60px] items-center gap-4`}>
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Mark size={26} />
            <span className="text-[14.5px] font-semibold tracking-[-0.02em]">TaskFlow</span>
          </Link>

          <nav className="ml-6 hidden flex-1 items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="tf-nav-item">
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Un seul jeu d'actions par palier, jamais deux qui se
              chevauchent : sous lg, tout passe par le menu. */}
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="tf-nav-item hidden lg:inline-flex">
              Connexion
            </Link>
            <Link href="/register" className="hidden lg:block">
              <Button variant="primary" size="sm">
                Commencer
              </Button>
            </Link>
            <span className="lg:hidden">
              <StairsMenu
                links={[
                  ...NAV,
                  { label: 'Connexion', href: '/login' },
                  { label: 'Créer un compte', href: '/register' },
                ]}
              />
            </span>
          </div>
        </div>
      </header>

      <main>
        {/* ═══ Héros ═══════════════════════════════════════════════ */}
        <section className={`${SHELL} pt-16 pb-20 sm:pt-24 sm:pb-28`}>
          <Reveal as="p" className="mb-6 sm:mb-8">
            <span className="tf-eyebrow">Kanban collaboratif · Next.js · GraphQL · Prisma</span>
          </Reveal>

          <SplitHeading className="tf-display max-w-4xl text-[clamp(2.1rem,7vw,5.25rem)]">
            Le tableau qui dit la vérité sur le sprint.
          </SplitHeading>

          <div className="mt-8 grid gap-8 sm:mt-12 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
            <Reveal as="p" delay={0.45}>
              <span
                className="block max-w-lg text-[15px] leading-relaxed sm:text-[16.5px]"
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

        {/* ═══ Bandeau ═════════════════════════════════════════════ */}
        <section
          className="py-6 sm:py-8"
          style={{ borderBlock: '1px solid var(--border)' }}
          aria-label="Extrait du backlog"
        >
          <Marquee speed={34}>
            {BACKLOG.map((t, i) => (
              <span key={t} className={`tf-marquee-item${i % 2 === 1 ? ' tf-marquee-ghost' : ''}`}>
                <i />
                {t}
              </span>
            ))}
          </Marquee>
        </section>

        {/* ═══ Le tableau ══════════════════════════════════════════
            Rendu par les mêmes classes que l'application. Quatre
            colonnes de même hauteur, aucune animation qui déplace la
            grille — seuls les enfants bougent, dans leur case. */}
        <section id="tableau" className={`${SHELL} scroll-mt-20 py-20 sm:py-28`}>
          <div className="mb-10 grid gap-6 sm:mb-14 lg:grid-cols-[1fr_18rem] lg:items-end lg:gap-12">
            <div>
              <Reveal as="p" className="mb-3">
                <span className="tf-eyebrow">Le tableau</span>
              </Reveal>
              <SplitHeading
                as="h2"
                onScroll
                className="tf-display text-[clamp(1.6rem,4vw,2.75rem)]"
              >
                Quatre colonnes. Rien à interpréter.
              </SplitHeading>
            </div>
            <Reveal as="p">
              <span className="block text-[13.5px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
                Survole une carte : l’arête gauche s’épaissit sur la priorité qu’elle porte déjà.
              </span>
            </Reveal>
          </div>

          <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {COLONNES.map((col, ci) => (
              <div key={col.nom} className="flex flex-col">
                <Rise delay={ci * 0.06}>
                  <div className="tf-col-head">
                    <span className="tf-col-name">{col.nom}</span>
                    <span className="tf-col-count">{col.total}</span>
                  </div>
                </Rise>

                <div className="flex flex-1 flex-col gap-2.5">
                  {col.taches.map((t, ti) => (
                    <Rise key={t.titre} delay={ci * 0.06 + ti * 0.05}>
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
                              style={{ color: t.retard ? 'var(--danger-text)' : 'var(--text-3)' }}
                            >
                              {t.echeance}
                            </span>
                            <span className="ml-auto">
                              <Avatar name={t.qui} size={20} />
                            </span>
                          </div>
                        </article>
                      </TiltCard>
                    </Rise>
                  ))}

                  <Rise delay={ci * 0.06 + 0.14} className="mt-auto pt-1">
                    <span className="tf-add-ghost" aria-hidden="true">
                      + Ajouter une tâche
                    </span>
                  </Rise>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ Manifeste ═══════════════════════════════════════════ */}
        <section className={`${SHELL} py-20 sm:py-28`}>
          <div className="mx-auto max-w-3xl">
            <ScrollText className="tf-display text-[clamp(1.25rem,3vw,2.1rem)] leading-[1.34]">
              La plupart des tableaux mentent par omission. Une carte reste dans « en cours »
              pendant trois semaines et personne ne le voit, parce que rien ne le dit. Ici la
              priorité est portée par une arête, le retard passe au rouge, et le compteur de
              colonne ne s’arrondit pas. On ne rend pas le travail plus joli — on le rend lisible.
            </ScrollText>
          </div>
        </section>

        {/* ═══ Promesses ═══════════════════════════════════════════ */}
        <section id="promesses" className={`${SHELL} scroll-mt-20`}>
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 sm:mb-14">
              <Reveal as="p" className="mb-3">
                <span className="tf-eyebrow">Ce que ça fait</span>
              </Reveal>
              <SplitHeading
                as="h2"
                onScroll
                className="tf-display text-[clamp(1.6rem,4vw,2.75rem)]"
              >
                Trois promesses, trois fonctions qui existent.
              </SplitHeading>
            </div>

            <StackSection className="pb-16 md:pb-[26vh]">
              {PROMESSES.map((p, i) => (
                <StackCard key={p.numero} index={i} className="pb-5">
                  <div
                    className="tf-surface tf-lift-3 p-6 sm:p-9"
                    style={{ borderRadius: 'var(--r-3)' }}
                  >
                    <div className="mb-5 flex items-center gap-4">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center"
                        style={{
                          borderRadius: 'var(--r-1)',
                          background: 'color-mix(in oklab, var(--accent) 14%, transparent)',
                          color: 'var(--accent-text)',
                        }}
                      >
                        {p.icone}
                      </span>
                      {/* Le numéro est de l'information : trois promesses
                          ordonnées, du socle vers la surface. */}
                      <span className="tf-num text-[13px]" style={{ color: 'var(--text-3)' }}>
                        {p.numero}
                      </span>
                    </div>

                    <h3 className="tf-display mb-3 text-[clamp(1.25rem,2.6vw,1.75rem)]">
                      {p.titre}
                    </h3>
                    <p className="text-[14.5px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
                      {p.texte}
                    </p>
                  </div>
                </StackCard>
              ))}
            </StackSection>
          </div>
        </section>

        {/* ═══ Chiffres ════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20" style={{ borderBlock: '1px solid var(--border)' }}>
          <div className={`${SHELL} grid gap-10 sm:grid-cols-3 sm:gap-8`}>
            {CHIFFRES.map((c) => (
              <div key={c.libelle}>
                <p className="tf-display mb-2 text-[clamp(2.1rem,5vw,3.25rem)]">
                  <Counter to={c.valeur} suffix={c.suffixe} />
                </p>
                <Reveal as="p">
                  <span className="block text-[13.5px]" style={{ color: 'var(--text-2)' }}>
                    {c.libelle}
                  </span>
                </Reveal>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ Appel final ═════════════════════════════════════════
            Pleine largeur et opaque : c'est cette section qui recouvre
            le pied de page puis le libère en remontant. Une version
            précédente la centrait en `max-w-4xl`, donc le pied
            dépassait de chaque côté pendant tout le scroll. */}
        <section
          className="relative z-[1] w-full py-24 text-center sm:py-32"
          style={{ background: 'var(--bg-canvas)' }}
        >
          <div className={`${SHELL} max-w-3xl`}>
            <SplitHeading
              as="h2"
              onScroll
              className="tf-display text-[clamp(1.9rem,5.5vw,3.75rem)]"
            >
              Ouvre un tableau. Déplace une carte.
            </SplitHeading>

            <Reveal as="p" className="mt-6">
              <span
                className="mx-auto block max-w-md text-[15px] leading-relaxed"
                style={{ color: 'var(--text-2)' }}
              >
                Le compte est gratuit et le premier projet prend une minute.
              </span>
            </Reveal>

            <div className="mt-9 flex justify-center">
              <Magnetic strength={0.5} radius={28}>
                <Link href="/register">
                  <Button variant="primary" size="lg">
                    Créer un compte
                    <Icon.Arrow size={16} />
                  </Button>
                </Link>
              </Magnetic>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ Pied ══════════════════════════════════════════════════
          Collé en bas et derrière : la section précédente glisse
          par-dessus en remontant, donc le pied se dévoile au lieu
          d'arriver. `sticky` suffit — le navigateur le fait mieux
          qu'un ScrollTrigger. */}
      <footer
        className="sticky bottom-0 z-0"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-1)' }}
      >
        <div className={`${SHELL} flex flex-wrap items-center gap-x-8 gap-y-4 py-8 sm:py-10`}>
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

          <p className="w-full text-[12.5px] sm:ml-auto sm:w-auto" style={{ color: 'var(--text-3)' }}>
            Projet personnel, code ouvert.
          </p>
        </div>
      </footer>
    </div>
  );
}
