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
    <div className="tf-cascade flex flex-col gap-3.5">
      {POINTS.map((p) => (
        <Surface key={p.titre} radius="lg" specular className="p-5">
          <div className="flex gap-4">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
              style={{
                background: 'rgba(79,224,213,0.11)',
                color: 'var(--color-aqua)',
                boxShadow: 'inset 0 0 0 1px rgba(79,224,213,0.22)',
              }}
            >
              {p.icon}
            </span>
            <div>
              <p className="mb-1 text-[14px] font-semibold tracking-[-0.01em]">{p.titre}</p>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-haze)' }}>
                {p.texte}
              </p>
            </div>
          </div>
        </Surface>
      ))}
    </div>
  );
}
