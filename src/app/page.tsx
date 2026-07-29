import Link from 'next/link';
import { Surface } from '@/components/glass/Surface';
import { Button } from '@/components/glass/Button';
import { Icon } from '@/components/glass/Icon';
import { Mark } from '@/components/glass/AppShell';
import { StatusPill, PriorityPill } from '@/components/glass/Pill';
import { Avatar } from '@/components/glass/Avatar';

/**
 * Page d'accueil.
 *
 * Le héros n'est pas une promesse, c'est le produit : un vrai tableau, avec
 * de vraies colonnes et de vraies pastilles, rendues par les mêmes
 * composants que l'application. Ce qu'on montre est ce qu'on livre.
 *
 * Les liens de navigation pointent tous vers quelque chose qui existe. La
 * version précédente affichait « Tarifs » et « Rejoint par 200+ équipes »
 * sans rien derrière.
 */

const NAV = [
  { label: 'Le tableau', href: '#tableau' },
  { label: 'Les rôles', href: '#roles' },
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'À propos', href: '/a-propos' },
];

const COLONNES = [
  {
    statut: 'TODO' as const,
    taches: [
      { titre: 'Maquettes de la v2', priorite: 'MEDIUM' as const, qui: 'Léa Bertin' },
      { titre: 'Recherche utilisateur', priorite: 'LOW' as const, qui: 'Sam Roche' },
    ],
  },
  {
    statut: 'IN_PROGRESS' as const,
    taches: [{ titre: 'API GraphQL', priorite: 'URGENT' as const, qui: 'Maxime Turquet' }],
  },
  {
    statut: 'IN_REVIEW' as const,
    taches: [{ titre: 'Page de profil', priorite: 'MEDIUM' as const, qui: 'Gaby Neveu' }],
  },
  {
    statut: 'DONE' as const,
    taches: [{ titre: 'Sessions httpOnly', priorite: 'HIGH' as const, qui: 'Maxime Turquet' }],
  },
];

const CAPACITES = [
  {
    icon: <Icon.Layers size={19} />,
    titre: 'Le glisser-déposer qui ne triche pas',
    texte:
      'Une tâche déplacée change de statut en base immédiatement. Pas d’état local qui diverge, pas de rafraîchissement à faire.',
  },
  {
    icon: <Icon.Shield size={19} />,
    titre: 'Des permissions vérifiées au serveur',
    texte:
      'Quatre rôles, contrôlés à chaque requête. Un admin ne peut pas se promouvoir propriétaire, un lecteur ne peut rien modifier.',
  },
  {
    icon: <Icon.Image size={19} />,
    titre: 'Des captures dans les tâches',
    texte:
      'Joignez des images à une tâche. Elles sont validées, redimensionnées et servies au bon format.',
  },
  {
    icon: <Icon.Clock size={19} />,
    titre: 'Des échéances lisibles',
    texte:
      'Une date qui approche se signale d’elle-même sur la carte, sans qu’on ait à ouvrir la tâche.',
  },
];

const ROLES = [
  { nom: 'Propriétaire', peut: 'Tout, y compris supprimer le projet.' },
  { nom: 'Admin', peut: 'Gérer les membres et le projet, sans pouvoir se promouvoir.' },
  { nom: 'Membre', peut: 'Créer, modifier et déplacer des tâches.' },
  { nom: 'Lecture', peut: 'Consulter le tableau, sans rien changer.' },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
        <Surface as="nav" radius="full" panel className="mx-auto max-w-5xl">
          <div className="flex h-[58px] items-center gap-2 pl-3.5 pr-2.5">
            <Link href="/" className="flex shrink-0 items-center gap-2.5">
              <Mark size={30} />
              <span className="text-[15px] font-semibold tracking-[-0.02em]">TaskFlow</span>
            </Link>

            <nav className="ml-4 hidden flex-1 items-center gap-0.5 md:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="tf-nav-item">
                  {n.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2">
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
        </Surface>
      </header>

      <main>
        {/* ── Héros ────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 pt-[11vh] pb-24 text-center sm:px-8">
          <p className="tf-eyebrow tf-in mb-7">Gestion de projet · Next.js · GraphQL · Prisma</p>

          <h1 className="tf-display mx-auto mb-7 max-w-4xl text-[clamp(2.7rem,8vw,5.4rem)]">
            <span className="tf-mask">
              <span>Le tableau qui dit</span>
            </span>
            <span className="tf-mask">
              <span style={{ animationDelay: '0.1s' }}>
                la <em style={{ color: 'var(--color-aqua)' }}>vérité</em> sur le sprint.
              </span>
            </span>
          </h1>

          <p
            className="tf-in mx-auto mb-10 max-w-xl text-[16.5px] leading-relaxed"
            style={{ color: 'var(--color-haze)', animationDelay: '0.28s' }}
          >
            Un kanban collaboratif où chaque déplacement compte vraiment, où les rôles sont
            appliqués côté serveur, et où l’avancement se lit sans ouvrir une seule tâche.
          </p>

          <div
            className="tf-in flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: '0.36s' }}
          >
            <Link href="/register">
              <Button variant="primary" size="lg">
                Créer un compte
                <Icon.Arrow size={16} />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="glass" size="lg">
                Se connecter
              </Button>
            </Link>
          </div>
        </section>

        {/* ── Le tableau, en vrai ──────────────────────────────── */}
        <section id="tableau" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-28 sm:px-8">
          <Surface radius="xl" panel distort lift="lg" className="p-4 sm:p-6">
            <div className="mb-5 flex items-center gap-2.5 px-1">
              <span className="flex gap-1.5" aria-hidden="true">
                <Dot color="#ff6b6b" />
                <Dot color="#ffb454" />
                <Dot color="#4fe0d5" />
              </span>
              <p className="tf-eyebrow">Refonte du site — Sprint 24</p>
              <span className="tf-num ml-auto text-[12px]" style={{ color: 'var(--color-mute)' }}>
                5 tâches · 1 terminée
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {COLONNES.map((col) => (
                <div key={col.statut} className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between px-1 pb-1">
                    <StatusPill status={col.statut} />
                    <span className="tf-num text-[11px]" style={{ color: 'var(--color-mute)' }}>
                      {col.taches.length}
                    </span>
                  </div>

                  {col.taches.map((t) => (
                    <Surface key={t.titre} radius="md" raised lift="md" specular className="p-3.5">
                      <p className="mb-2.5 text-[13.5px] font-medium leading-snug">{t.titre}</p>
                      <div className="flex items-center justify-between gap-2">
                        <PriorityPill priority={t.priorite} />
                        <Avatar name={t.qui} size={22} />
                      </div>
                    </Surface>
                  ))}
                </div>
              ))}
            </div>
          </Surface>
        </section>

        {/* ── Capacités ────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 pb-28 sm:px-8">
          <SectionTitle numero="01">Ce que ça fait</SectionTitle>

          <div className="grid gap-4 sm:grid-cols-2">
            {CAPACITES.map((c) => (
              <Surface key={c.titre} radius="lg" specular className="p-6">
                <span
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[11px]"
                  style={{
                    background: 'rgba(79,224,213,0.1)',
                    color: 'var(--color-aqua)',
                    boxShadow: 'inset 0 0 0 1px rgba(79,224,213,0.22)',
                  }}
                >
                  {c.icon}
                </span>
                <h3 className="mb-2 text-[15.5px] font-semibold tracking-[-0.015em]">{c.titre}</h3>
                <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--color-haze)' }}>
                  {c.texte}
                </p>
              </Surface>
            ))}
          </div>
        </section>

        {/* ── Rôles ────────────────────────────────────────────── */}
        <section id="roles" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-28 sm:px-8">
          <SectionTitle numero="02">Qui peut quoi</SectionTitle>

          <Surface radius="xl" panel className="overflow-hidden">
            <ul>
              {ROLES.map((r, i) => (
                <li
                  key={r.nom}
                  className="flex flex-col gap-1 px-6 py-5 sm:flex-row sm:items-center sm:gap-8"
                  style={{ borderTop: i === 0 ? undefined : '1px solid var(--rim)' }}
                >
                  <span className="w-36 shrink-0 text-[14.5px] font-semibold">{r.nom}</span>
                  <span className="text-[13.5px]" style={{ color: 'var(--color-haze)' }}>
                    {r.peut}
                  </span>
                </li>
              ))}
            </ul>
          </Surface>
        </section>

        {/* ── Appel final ──────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-5 pb-32 text-center sm:px-8">
          <h2 className="tf-display mb-5 text-[clamp(1.9rem,5vw,3rem)]">
            Ouvrez votre premier tableau.
          </h2>
          <p className="mx-auto mb-8 max-w-md text-[15px]" style={{ color: 'var(--color-haze)' }}>
            Gratuit, sans carte bancaire.
          </p>
          <Link href="/register">
            <Button variant="primary" size="lg">
              Créer un compte
              <Icon.Arrow size={16} />
            </Button>
          </Link>
        </section>
      </main>

      <footer className="px-5 pb-10 sm:px-8">
        <div
          className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 pt-8 sm:flex-row"
          style={{ borderTop: '1px solid var(--rim)' }}
        >
          <div className="flex items-center gap-2.5">
            <Mark size={24} />
            <span className="text-[13.5px]" style={{ color: 'var(--color-haze)' }}>
              TaskFlow
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-5 text-[13px]">
            <Link href="/tarifs" className="tf-link" style={{ color: 'var(--color-haze)' }}>
              Tarifs
            </Link>
            <Link href="/a-propos" className="tf-link" style={{ color: 'var(--color-haze)' }}>
              À propos
            </Link>
            <Link href="/login" className="tf-link" style={{ color: 'var(--color-haze)' }}>
              Connexion
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** Titre de section. La numérotation suit une progression réelle. */
function SectionTitle({ numero, children }: { numero: string; children: React.ReactNode }) {
  return (
    <div className="mb-10 flex items-baseline gap-3">
      <span className="tf-num text-[12px]" style={{ color: 'var(--color-aqua)' }}>
        {numero}
      </span>
      <h2 className="tf-display text-[clamp(1.5rem,3.4vw,2.2rem)]">{children}</h2>
      <span className="h-px flex-1" style={{ background: 'var(--rim)' }} />
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="h-2.5 w-2.5 rounded-full" style={{ background: color, opacity: 0.7 }} />;
}
