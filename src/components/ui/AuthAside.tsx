import { Surface } from './Surface';
import { Icon } from './Icon';

/**
 * Colonne d'appoint des pages de connexion.
 *
 * Trois affirmations vérifiables sur ce que fait le produit, pas des
 * promesses commerciales. Chacune correspond à une fonction réellement
 * implémentée — sinon elle n'a rien à faire ici.
 */
const POINTS = [
  {
    icon: <Icon.Board size={17} />,
    titre: 'Un tableau par projet',
    texte: 'Quatre colonnes, glisser-déposer, et l’état du sprint se lit d’un coup d’œil.',
  },
  {
    icon: <Icon.Shield size={17} />,
    titre: 'Des rôles qui tiennent',
    texte: 'Propriétaire, admin, membre, lecture. Les permissions sont vérifiées côté serveur.',
  },
  {
    icon: <Icon.Users size={17} />,
    titre: 'À plusieurs',
    texte: 'Invitez par email, assignez les tâches, suivez qui avance sur quoi.',
  },
];

export function AuthAside() {
  return (
    <div className="flex flex-col gap-3">
      {POINTS.map((p) => (
        <Surface key={p.titre} radius="lg" className="p-5">
          <div className="flex gap-4">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center"
              style={{
                borderRadius: 'var(--r-1)',
                background: 'color-mix(in oklab, var(--accent) 14%, transparent)',
                color: 'var(--accent-text)',
              }}
            >
              {p.icon}
            </span>
            <div>
              <p className="mb-1 text-[14px] font-semibold tracking-[-0.01em]">{p.titre}</p>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
                {p.texte}
              </p>
            </div>
          </div>
        </Surface>
      ))}
    </div>
  );
}
