import Image from 'next/image';

/**
 * Avatar.
 *
 * Sans photo, la couleur est dérivée du nom : deux personnes différentes
 * gardent deux teintes différentes d'un écran à l'autre, ce qui aide à les
 * reconnaître dans une liste bien plus qu'un gris uniforme.
 *
 * La teinte est contrainte aux cyans-bleus-violets de la palette : un
 * hasard non borné produirait des rouges et des ambres qui entreraient en
 * conflit avec les couleurs de priorité.
 */

function hueFromName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  // 170°–290° : cyan → bleu → violet. Le rouge et l'ambre restent réservés
  // aux priorités et aux statuts.
  return 170 + (Math.abs(hash) % 120);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

type Props = {
  name: string;
  avatar?: string | null;
  size?: number;
  /** Point de présence. */
  online?: boolean;
};

export function Avatar({ name, avatar, size = 34, online = false }: Props) {
  const hue = hueFromName(name);

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, boxShadow: 'var(--shadow-1)' }}
    >
      {avatar ? (
        <Image
          src={avatar}
          alt=""
          width={size}
          height={size}
          sizes={`${size}px`}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center rounded-full"
          style={{
            background: `linear-gradient(150deg, hsl(${hue} 62% 52%) 0%, hsl(${(hue + 34) % 360} 58% 40%) 100%)`,
            color: '#fff',
            fontWeight: 600,
            fontSize: size * 0.38,
            letterSpacing: '-0.02em',
          }}
        >
          {initials(name)}
        </span>
      )}

      {online && (
        <span
          className="absolute rounded-full"
          style={{
            width: Math.max(8, size * 0.26),
            height: Math.max(8, size * 0.26),
            right: -1,
            bottom: -1,
            background: 'var(--success)',
            // L'anneau reprend la couleur du fond : la pastille se détache
            // quel que soit le thème, sans valeur écrite en dur.
            boxShadow: '0 0 0 2px var(--bg-canvas)',
          }}
        />
      )}
    </span>
  );
}

/** Pile d'avatars superposés, pour les membres d'un projet. */
export function AvatarStack({
  people,
  max = 4,
  size = 28,
}: {
  people: { name: string; avatar?: string | null }[];
  max?: number;
  size?: number;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;

  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        <span key={`${p.name}-${i}`} style={{ marginLeft: i === 0 ? 0 : -size * 0.29 }}>
          <Avatar name={p.name} avatar={p.avatar} size={size} />
        </span>
      ))}
      {rest > 0 && (
        <span
          className="tf-num inline-flex items-center justify-center rounded-full"
          style={{
            marginLeft: -size * 0.29,
            width: size,
            height: size,
            fontSize: size * 0.34,
            background: 'var(--surface-2)',
            color: 'var(--text-2)',
            boxShadow: '0 0 0 1px var(--border)',
          }}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
