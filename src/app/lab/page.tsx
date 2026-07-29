'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import { Surface } from '@/components/ui/Surface';
import { Button, IconButton } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Select, Textarea } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Icon } from '@/components/ui/Icon';
import { Avatar, AvatarStack } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { PRIORITY, STATUS, PriorityPill, StatusPill, RolePill } from '@/components/ui/Pill';
import type { Priority, TaskStatus } from '@/components/ui/Pill';

/**
 * Atelier du système de design.
 *
 * Page de travail, jamais servie en production : elle sert à juger les
 * composants côte à côte, dans les deux thèmes, avant de les répandre dans
 * l'application. C'est l'écran de contrôle des lots suivants.
 */

const ROLES = [
  { nom: '--bg-canvas', role: 'le fond de page' },
  { nom: '--surface-1', role: 'cartes, panneaux' },
  { nom: '--surface-2', role: 'creux, survols' },
  { nom: '--text-1', role: 'texte principal' },
  { nom: '--text-2', role: 'texte secondaire' },
  { nom: '--text-3', role: 'métadonnées' },
  { nom: '--border', role: 'séparateurs' },
  { nom: '--accent', role: 'aplats, états actifs' },
  { nom: '--accent-text', role: 'liens, texte accentué' },
  { nom: '--accent-2', role: 'second accent' },
  { nom: '--danger', role: 'urgent, destructif' },
  { nom: '--warning', role: 'priorité haute' },
];

const ECHELLE = [11, 12.5, 13, 15, 18, 22, 30, 44];

const RAYONS = [
  { nom: '--r-1', px: 8, usage: 'champs, boutons' },
  { nom: '--r-2', px: 12, usage: 'cartes' },
  { nom: '--r-3', px: 16, usage: 'colonnes, panneaux' },
  { nom: '--r-4', px: 24, usage: 'modales' },
];

function Section({
  titre,
  note,
  children,
}: {
  titre: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="tf-display text-[18px]">{titre}</h2>
        {note && (
          <p className="mt-1 max-w-2xl text-[13px]" style={{ color: 'var(--text-2)' }}>
            {note}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function LabPage() {
  // Ceinture et bretelles : la page n'existe pas hors développement.
  if (process.env.NODE_ENV === 'production') notFound();

  const [ouverte, setOuverte] = useState(false);
  const [texte, setTexte] = useState('');

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10 flex items-start justify-between gap-6">
        <div>
          <p className="tf-eyebrow mb-2">Atelier</p>
          <h1 className="tf-display text-[30px]">Système TaskFlow</h1>
          <p className="mt-2 max-w-lg text-[14px]" style={{ color: 'var(--text-2)' }}>
            Tout doit tenir dans les deux thèmes. Bascule, et cherche ce qui casse.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Section titre="Rôles de couleur" note="Les composants ne lisent que ces noms, jamais un hex.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((r) => (
            <div
              key={r.nom}
              className="flex items-center gap-3 rounded-[var(--r-1)] p-2.5"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
            >
              <span
                className="h-9 w-9 shrink-0 rounded-[var(--r-1)]"
                style={{ background: `var(${r.nom})`, border: '1px solid var(--border-strong)' }}
              />
              <div className="min-w-0">
                <p className="truncate text-[11.5px]">{r.nom}</p>
                <p className="truncate text-[11.5px]" style={{ color: 'var(--text-3)' }}>
                  {r.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        titre="Typographie"
        note="Inter partout. Space Grotesk sur les titres, les noms de colonne et les chiffres — nulle part ailleurs."
      >
        <Surface radius="xl" className="p-6">
          {ECHELLE.map((t) => (
            <div
              key={t}
              className="flex items-baseline gap-4 border-b py-2 last:border-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="tf-num w-14 shrink-0 text-[11px]" style={{ color: 'var(--text-3)' }}>
                {t}px
              </span>
              <span className={t >= 22 ? 'tf-display' : ''} style={{ fontSize: t }}>
                Refonte 2026
              </span>
            </div>
          ))}
        </Surface>
      </Section>

      <Section titre="Rayons et ombres">
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          {RAYONS.map((r) => (
            <div key={r.nom} className="text-center">
              <div
                className="mb-2 h-20"
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: `var(${r.nom})`,
                }}
              />
              <p className="text-[11.5px]">{r.px}px</p>
              <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                {r.usage}
              </p>
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {(['sm', 'md', 'lg'] as const).map((l, i) => (
            <Surface key={l} radius="lg" lift={l} className="p-5 text-center text-[12.5px]">
              ombre {i + 1}
            </Surface>
          ))}
        </div>
      </Section>

      <Section
        titre="Boutons"
        note="Le halo au clic part du point exact du clic. Rien ne bouge sans interaction."
      >
        <Surface radius="xl" className="flex flex-wrap items-center gap-3 p-6">
          <Button variant="primary">Nouvelle tâche</Button>
          <Button variant="neutral">Filtrer</Button>
          <Button variant="ghost">Annuler</Button>
          <Button variant="danger">Supprimer</Button>
          <Button variant="primary" loading>
            Enregistrement
          </Button>
          <Button variant="primary" disabled>
            Indisponible
          </Button>
          <Button variant="neutral" size="sm">
            Petit
          </Button>
          <Button variant="neutral" size="lg">
            Grand
          </Button>
          <IconButton label="Ajouter">
            <Icon.Plus size={16} />
          </IconButton>
        </Surface>
      </Section>

      <Section titre="Champs">
        <Surface radius="xl" className="grid gap-4 p-6 sm:grid-cols-2">
          <Field label="Titre" placeholder="Migrer les jetons de couleur" />
          <Field
            label="Email"
            type="email"
            placeholder="nom@exemple.fr"
            hint="Sert aussi d'identifiant."
          />
          <Field
            label="Champ en erreur"
            defaultValue="ab"
            error="Ce titre doit faire 3 caractères au minimum."
          />
          <Select
            label="Priorité"
            options={Object.entries(PRIORITY).map(([value, p]) => ({ value, label: p.label }))}
          />
          <Textarea
            label="Description"
            className="sm:col-span-2"
            placeholder="Ce que la tâche recouvre…"
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
          />
        </Surface>
      </Section>

      <Section
        titre="Statuts, priorités, rôles"
        note="Chaque pastille porte un mot : la couleur seule ne suffit pas."
      >
        <Surface radius="xl" className="flex flex-wrap items-center gap-2.5 p-6">
          {(Object.keys(STATUS) as TaskStatus[]).map((s) => (
            <StatusPill key={s} status={s} />
          ))}
          {(Object.keys(PRIORITY) as Priority[]).map((p) => (
            <PriorityPill key={p} priority={p} />
          ))}
          {['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].map((r) => (
            <RolePill key={r} role={r} />
          ))}
        </Surface>
      </Section>

      <Section titre="Personnes">
        <Surface radius="xl" className="flex flex-wrap items-center gap-6 p-6">
          <Avatar name="Maxime Lefebvre" size={40} online />
          <Avatar name="Rachid Kaci" size={40} />
          <Avatar name="Anne Duval" size={32} />
          <AvatarStack
            people={[
              { name: 'Maxime Lefebvre' },
              { name: 'Rachid Kaci' },
              { name: 'Anne Duval' },
              { name: 'Sofia Marchetti' },
              { name: 'Tom Bernard' },
              { name: 'Lina Ferrand' },
            ]}
          />
        </Surface>
      </Section>

      <Section
        titre="Colonne et cartes"
        note="Le nom, puis le filet sous toute la largeur. Le compteur est un chiffre nu à droite. La barre de 3 px porte la priorité."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <div className="tf-col-head">
              <span className="tf-col-name">En cours</span>
              <span className="tf-col-count">3</span>
            </div>
            <div className="flex flex-col gap-2.5">
              <article className="tf-card" style={{ '--prio': 'var(--danger)' } as React.CSSProperties}>
                <p className="text-[13px] font-medium">Panneau de personnalisation des fonds</p>
                <div
                  className="mt-2.5 flex items-center gap-2 text-[11px]"
                  style={{ color: 'var(--text-3)' }}
                >
                  <PriorityPill priority="URGENT" />
                  <span style={{ color: 'var(--danger-text)' }}>Hier</span>
                  <span className="ml-auto">
                    <Avatar name="Rachid Kaci" size={20} />
                  </span>
                </div>
              </article>
              <article
                className="tf-card"
                style={{ '--prio': 'var(--warning)' } as React.CSSProperties}
              >
                <p className="text-[13px] font-medium">Refonte du header global</p>
                <div
                  className="mt-2.5 flex items-center gap-2 text-[11px]"
                  style={{ color: 'var(--text-3)' }}
                >
                  <PriorityPill priority="HIGH" />
                  <span>5 août</span>
                  <span className="ml-auto">
                    <Avatar name="Maxime Lefebvre" size={20} />
                  </span>
                </div>
              </article>
            </div>
          </div>

          <div>
            <div className="tf-col-head">
              <span className="tf-col-name">Chargement</span>
              <span className="tf-col-count">—</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {[0, 1].map((i) => (
                <div key={i} className="tf-surface p-3.5">
                  <div className="tf-skel mb-2 h-3.5 w-4/5" />
                  <div className="tf-skel mb-3 h-3.5 w-3/5" />
                  <div className="tf-skel h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section
        titre="Messages"
        note="Une erreur dit ce qui s'est passé et comment en sortir. Jamais d'excuse, jamais de vague."
      >
        <div className="flex flex-col gap-3">
          <Alert tone="danger">
            Ce projet porte déjà une tâche de ce nom. Choisissez-en un autre.
          </Alert>
          <Alert tone="success">Les modifications sont enregistrées.</Alert>
          <Alert tone="info">Les invitations partent dès que le projet a un nom.</Alert>
        </div>
      </Section>

      <Section titre="Modale">
        <Button variant="neutral" onClick={() => setOuverte(true)}>
          Ouvrir la modale
        </Button>
        <Modal
          open={ouverte}
          onClose={() => setOuverte(false)}
          title="Supprimer le projet"
          subtitle="Cette action retire aussi les 18 tâches qu'il contient."
          footer={
            <>
              <Button variant="ghost" onClick={() => setOuverte(false)}>
                Annuler
              </Button>
              <Button variant="danger" onClick={() => setOuverte(false)}>
                Supprimer
              </Button>
            </>
          }
        >
          <p className="text-[14px]" style={{ color: 'var(--text-2)' }}>
            Les membres perdront l&apos;accès immédiatement. Rien n&apos;est récupérable ensuite.
          </p>
        </Modal>
      </Section>
    </main>
  );
}
