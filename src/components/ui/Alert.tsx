import type { ReactNode } from 'react';

type Tone = 'danger' | 'success' | 'info';

const TONES: Record<Tone, { color: string; role: 'alert' | 'status' }> = {
  // `role="alert"` interrompt le lecteur d'écran : réservé aux erreurs, qui
  // bloquent la personne. Une confirmation utilise `status`, plus poli.
  danger: { color: 'var(--danger-text)', role: 'alert' },
  success: { color: 'var(--success-text)', role: 'status' },
  info: { color: 'var(--info-text)', role: 'status' },
};

/** Message court sous un formulaire. Jamais un ton d'excuse, jamais vague. */
export function Alert({ tone = 'info', children }: { tone?: Tone; children: ReactNode }) {
  const t = TONES[tone];

  return (
    <div
      role={t.role}
      className="tf-in rounded-[var(--r-1)] px-4 py-3 text-[13.5px]"
      style={{
        color: t.color,
        background: `color-mix(in oklab, ${t.color} 11%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${t.color} 28%, transparent)`,
      }}
    >
      {children}
    </div>
  );
}
