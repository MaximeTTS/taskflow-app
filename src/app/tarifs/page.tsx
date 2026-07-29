import type { Metadata } from 'next';
import Link from 'next/link';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Mark } from '@/components/ui/AppShell';

export const metadata: Metadata = {
  title: 'Tarifs — TaskFlow',
  description: 'TaskFlow est gratuit et open source.',
};

/**
 * Page tarifs.
 *
 * Une seule offre, parce qu'il n'y en a qu'une. Inventer trois paliers avec
 * des limites arbitraires ferait joli mais mentirait sur le produit : rien
 * dans le code ne compte les projets ni ne restreint les membres.
 */

const INCLUS = [
  'Projets et tâches sans limite',
  'Membres sans limite, avec quatre rôles',
  'Tableau kanban et glisser-déposer',
  'Images jointes aux tâches',
  'Échéances et priorités',
  'Sessions révocables, permissions vérifiées au serveur',
];

const PAS_ENCORE = [
  'Réinitialisation du mot de passe par email',
  'Notifications',
  'Export des données',
];

export default function TarifsPage() {
  return (
    <div className="min-h-dvh px-5 py-6 sm:px-8">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
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

      <main className="mx-auto max-w-3xl pt-[10vh] pb-24 text-center">
        <p className="tf-eyebrow mb-6">Tarifs</p>
        <h1 className="tf-display mb-5 text-[clamp(2.2rem,6vw,3.6rem)]">
          <span >
            <span>C’est gratuit.</span>
          </span>
        </h1>
        <p className="mx-auto mb-12 max-w-lg text-[16px]" style={{ color: 'var(--text-2)' }}>
          TaskFlow est un projet personnel, ouvert et sans modèle économique. Pas de
          palier payant à venir, pas de fonction bridée pour vous pousser à l’achat.
        </p>

        <Surface radius="xl" lift="lg" className="p-8 text-left sm:p-10">
          <div className="mb-8 flex items-end gap-3">
            <span className="tf-display text-[3.4rem] leading-none">0 €</span>
            <span className="pb-2 text-[14px]" style={{ color: 'var(--text-3)' }}>
              pour toujours
            </span>
          </div>

          <ul className="mb-8 grid gap-3 sm:grid-cols-2">
            {INCLUS.map((i) => (
              <li key={i} className="flex items-start gap-2.5 text-[14px]">
                <span className="mt-0.5 shrink-0" style={{ color: 'var(--accent-text)' }}>
                  <Icon.Check size={16} />
                </span>
                {i}
              </li>
            ))}
          </ul>

          <Link href="/register">
            <Button variant="primary" size="lg" block>
              Créer un compte
              <Icon.Arrow size={16} />
            </Button>
          </Link>
        </Surface>

        {/* Dire ce qui manque vaut mieux que le laisser découvrir. */}
        <div className="mt-10 text-left">
          <p className="tf-eyebrow mb-4">Ce qui n’existe pas encore</p>
          <ul className="flex flex-wrap gap-2.5">
            {PAS_ENCORE.map((p) => (
              <li key={p} className="tf-pill" style={{ color: 'var(--text-3)' }}>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
