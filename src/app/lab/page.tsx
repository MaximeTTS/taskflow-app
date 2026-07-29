'use client';

import { notFound } from 'next/navigation';
import { Surface } from '@/components/glass/Surface';
import { Button, IconButton } from '@/components/glass/Button';
import { Field } from '@/components/glass/Field';

/**
 * Atelier du système de design.
 *
 * Page de travail, jamais servie en production : elle sert à juger les
 * matières et les mouvements côte à côte avant de les répandre dans
 * l'application.
 */

const STATUTS = [
  { label: 'À faire', color: 'var(--color-mute)' },
  { label: 'En cours', color: 'var(--color-azure)' },
  { label: 'En revue', color: 'var(--color-amber)' },
  { label: 'Terminé', color: 'var(--color-aqua)' },
  { label: 'Annulé', color: '#4a5570' },
];

const PALETTE = [
  { nom: 'void', hex: '#04070E', role: 'le sol' },
  { nom: 'deep', hex: '#080D18', role: 'creux' },
  { nom: 'tide', hex: '#101828', role: 'surfaces' },
  { nom: 'aqua', hex: '#4FE0D5', role: 'accent · terminé' },
  { nom: 'rose', hex: '#FF6B9D', role: 'dispersion · urgent' },
  { nom: 'amber', hex: '#FFB454', role: 'revue · haute' },
  { nom: 'azure', hex: '#5EA8FF', role: 'en cours · moyenne' },
  { nom: 'frost', hex: '#EAF0FA', role: 'texte' },
];

export default function LabPage() {
  // Ceinture et bretelles : la page n'existe pas hors développement.
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-16">
        <p className="tf-eyebrow mb-4">Atelier · système de design</p>
        <h1 className="tf-display text-[clamp(2.6rem,7vw,4.6rem)] mb-5">
          <span className="tf-mask">
            <span>Abysse</span>
          </span>
          <span className="tf-mask">
            <span style={{ color: 'var(--color-aqua)', animationDelay: '0.12s' }}>dichroïque</span>
          </span>
        </h1>
        <p className="max-w-lg text-[15px]" style={{ color: 'var(--color-haze)' }}>
          Le verre ne peint pas, il réfracte. Les arêtes portent une dispersion
          chromatique — cyan d&apos;un côté, rose de l&apos;autre — comme la lumière qui
          traverse un bord épais.
        </p>
      </header>

      {/* ── Matières ─────────────────────────────────────────────── */}
      <Section titre="Matières" numero="01">
        <div className="grid gap-5 sm:grid-cols-3 tf-cascade">
          <Surface radius="lg" specular className="p-6">
            <p className="tf-eyebrow mb-2">Simple</p>
            <p className="text-[13.5px]" style={{ color: 'var(--color-haze)' }}>
              Flou, teinte, arête dichroïque. Le socle de tout le reste.
            </p>
          </Surface>

          <Surface radius="lg" raised specular className="p-6">
            <p className="tf-eyebrow mb-2">Soulevée</p>
            <p className="text-[13.5px]" style={{ color: 'var(--color-haze)' }}>
              Teinte plus dense. Pour ce qui passe au premier plan.
            </p>
          </Surface>

          <Surface radius="lg" panel distort specular lift="lg" className="p-6">
            <p className="tf-eyebrow mb-2">Distordue</p>
            <p className="text-[13.5px]" style={{ color: 'var(--color-haze)' }}>
              Réfraction SVG active. Passe la souris pour voir le reflet.
            </p>
          </Surface>
        </div>
      </Section>

      {/* ── Boutons ──────────────────────────────────────────────── */}
      <Section titre="Boutons" numero="02">
        <Surface radius="lg" panel className="p-8">
          <div className="flex flex-wrap items-center gap-3 mb-7">
            <Button variant="primary" size="lg">
              Créer un projet
            </Button>
            <Button variant="glass" size="lg">
              Parcourir
            </Button>
            <Button variant="ghost" size="lg">
              Annuler
            </Button>
            <Button variant="danger" size="lg">
              Supprimer
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-7">
            <Button variant="primary" size="md">
              Taille moyenne
            </Button>
            <Button variant="glass" size="sm">
              Petite
            </Button>
            <Button variant="primary" loading>
              Enregistrement
            </Button>
            <Button variant="primary" disabled>
              Indisponible
            </Button>
            <IconButton label="Ajouter">+</IconButton>
          </div>

          <p className="text-[13px]" style={{ color: 'var(--color-mute)' }}>
            Au survol : le reflet suit le curseur, une arête lumineuse balaie la
            surface, l&apos;élément se soulève d&apos;un pixel. À l&apos;appui il s&apos;enfonce.
          </p>
        </Surface>
      </Section>

      {/* ── Saisie ───────────────────────────────────────────────── */}
      <Section titre="Saisie" numero="03">
        <Surface radius="lg" panel className="p-8">
          <div className="grid gap-5 sm:grid-cols-2 max-w-2xl">
            <Field label="Adresse email" type="email" placeholder="vous@exemple.com" />
            <Field label="Nom du projet" placeholder="Refonte du site" />
            <Field
              label="Mot de passe"
              type="password"
              placeholder="••••••••••"
              hint="10 caractères minimum."
            />
            <Field
              label="Échéance"
              placeholder="14 août 2026"
              error="Cette date est déjà passée."
            />
          </div>
        </Surface>
      </Section>

      {/* ── Statuts ──────────────────────────────────────────────── */}
      <Section titre="Statuts et priorités" numero="04">
        <Surface radius="lg" panel className="p-8">
          <div className="flex flex-wrap gap-2.5 mb-6">
            {STATUTS.map((s) => (
              <span key={s.label} className="tf-pill" style={{ color: s.color }}>
                <span className="tf-dot" />
                {s.label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {[
              { label: 'Basse', color: 'var(--color-mute)' },
              { label: 'Moyenne', color: 'var(--color-azure)' },
              { label: 'Haute', color: 'var(--color-amber)' },
              { label: 'Urgente', color: 'var(--color-rose)' },
            ].map((p) => (
              <span key={p.label} className="tf-pill" style={{ color: p.color }}>
                {p.label}
              </span>
            ))}
          </div>
        </Surface>
      </Section>

      {/* ── Typographie ──────────────────────────────────────────── */}
      <Section titre="Typographie" numero="05">
        <Surface radius="lg" panel className="p-8">
          <p className="tf-eyebrow mb-3">Bricolage Grotesque · affichage</p>
          <p className="tf-display text-5xl mb-2">Sprint 24</p>
          <p className="tf-display text-3xl mb-8" style={{ color: 'var(--color-haze)' }}>
            Douze tâches en cours
          </p>

          <p className="tf-eyebrow mb-3">Instrument Sans · texte courant</p>
          <p className="max-w-xl mb-8 text-[15px]" style={{ color: 'var(--color-haze)' }}>
            Le corps de texte reste à quinze pixels avec une interligne de 1,55.
            Sur du verre, le contraste chute : une police à grande hauteur d&apos;x
            reste lisible là où une linéale étroite décrocherait.
          </p>

          <p className="tf-eyebrow mb-3">JetBrains Mono · données</p>
          <p className="tf-num text-2xl">
            68<span style={{ color: 'var(--color-mute)' }}>%</span> · 14/08/2026
          </p>
        </Surface>
      </Section>

      {/* ── Palette ──────────────────────────────────────────────── */}
      <Section titre="Palette" numero="06">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PALETTE.map((c) => (
            <Surface key={c.nom} radius="md" lift="none" className="overflow-hidden">
              <div style={{ background: c.hex, height: 56 }} />
              <div className="p-3">
                <p className="tf-num text-[12px]">{c.hex}</p>
                <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--color-mute)' }}>
                  {c.nom} — {c.role}
                </p>
              </div>
            </Surface>
          ))}
        </div>
      </Section>
    </main>
  );
}

function Section({
  titre,
  numero,
  children,
}: {
  titre: string;
  numero: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14">
      {/* La numérotation encode une progression réelle : du matériau brut
          vers son application. Elle n'est pas décorative. */}
      <div className="flex items-baseline gap-3 mb-5">
        <span className="tf-num text-[12px]" style={{ color: 'var(--color-aqua)' }}>
          {numero}
        </span>
        <h2 className="tf-display text-xl">{titre}</h2>
        <span className="flex-1 h-px" style={{ background: 'var(--rim)' }} />
      </div>
      {children}
    </section>
  );
}
