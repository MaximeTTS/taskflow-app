'use client';

import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  /** Message d'erreur. Sa présence marque le champ comme invalide. */
  error?: string;
  /** Aide affichée sous le champ, indépendante de l'erreur. */
  hint?: ReactNode;
};

/**
 * Champ de saisie en verre.
 *
 * Le libellé est toujours rendu et lié au champ : les libellés flottants
 * font joli mais disparaissent au moment où l'utilisateur en a besoin,
 * c'est-à-dire quand le champ est rempli et qu'il relit sa saisie.
 */
export function Field({ label, error, hint, className = '', id, ...rest }: Props) {
  const generated = useId();
  const inputId = id ?? generated;
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={className}>
      {label && (
        <label className="tf-label" htmlFor={inputId}>
          {label}
        </label>
      )}

      <div className="tf-field g" style={{ borderRadius: 'var(--r-md)' }}>
        <span className="g-refract" />
        <span className="g-tint" />
        <span className="g-rim" />
        <input
          id={inputId}
          className="tf-input"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
      </div>

      {error && (
        <p id={`${inputId}-err`} className="mt-1.5 text-[12.5px]" style={{ color: 'var(--color-rose)' }}>
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-[12.5px]" style={{ color: 'var(--color-mute)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}
