import type { ReactNode } from 'react';

type Tone = 'danger' | 'success' | 'info';

const TONES: Record<Tone, { color: string; role: 'alert' | 'status' }> = {
  // `role="alert"` interrompt le lecteur d'écran : réservé aux erreurs, qui
  // bloquent la personne. Une confirmation utilise `status`, plus poli.
  danger: { color: 'var(--color-rose)', role: 'alert' },
  success: { color: 'var(--color-aqua)', role: 'status' },
  info: { color: 'var(--color-azure)', role: 'status' },
};

/** Message court sous un formulaire. Jamais un ton d'excuse, jamais vague. */
export function Alert({ tone = 'info', children }: { tone?: Tone; children: ReactNode }) {
  const t = TONES[tone];

  return (
    <div
      role={t.role}
      className="tf-in rounded-[var(--r-md)] px-4 py-3 text-[13.5px]"
      style={{
        color: t.color,
        background: `color-mix(in oklab, ${t.color} 11%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${t.color} 30%, transparent)`,
      }}
    >
      {children}
    </div>
  );
}
