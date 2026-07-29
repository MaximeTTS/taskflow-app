import Image from 'next/image';

/**
 * Avatar.
 *
 * Sans photo, la couleur est dérivée du nom : deux personnes différentes
 * gardent deux teintes différentes d'un écran à l'autre, ce qui aide à les
 * reconnaître dans une liste bien plus qu'un gris uniforme.
 *
 * La teinte est contrainte aux bleus-verts-violets de la palette : un
 * hasard non borné produirait des rouges et des jaunes qui entreraient en
 * conflit avec les couleurs de statut.
 */

function hueFromName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  // 160°–290° : cyan → bleu → violet. Le rose et l'ambre restent réservés
  // aux priorités et aux statuts.
  return 160 + (Math.abs(hash) % 130);
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
  /** Point vert de présence. */
  online?: boolean;
};

export function Avatar({ name, avatar, size = 34, online = false }: Props) {
  const hue = hueFromName(name);

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        // L'anneau détache l'avatar du verre sur lequel il repose.
        boxShadow: '0 0 0 1px rgba(255,255,255,0.14), 0 2px 8px rgba(0,0,0,0.45)',
      }}
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
            background: `linear-gradient(150deg, hsl(${hue} 62% 52%) 0%, hsl(${(hue + 34) % 360} 58% 38%) 100%)`,
            color: '#fff',
            fontFamily: 'var(--font-body)',
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
            background: 'var(--color-aqua)',
            boxShadow: '0 0 0 2px var(--color-void)',
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
        <span key={`${p.name}-${i}`} style={{ marginLeft: i === 0 ? 0 : -size * 0.32 }}>
          <Avatar name={p.name} avatar={p.avatar} size={size} />
        </span>
      ))}
      {rest > 0 && (
        <span
          className="tf-num inline-flex items-center justify-center rounded-full"
          style={{
            marginLeft: -size * 0.32,
            width: size,
            height: size,
            fontSize: size * 0.34,
            background: 'rgba(160,190,235,0.12)',
            color: 'var(--color-haze)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.12)',
          }}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
