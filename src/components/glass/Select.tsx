'use client';

import { useId } from 'react';
import type { SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Icon } from './Icon';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: { value: string; label: string }[];
};

/**
 * Liste déroulante.
 *
 * S'appuie sur le `<select>` natif plutôt que sur une liste reconstruite :
 * on hérite gratuitement de la navigation clavier, de la recherche par
 * frappe et du sélecteur natif sur mobile. Seule la flèche est remplacée,
 * celle du système ne s'accordant pas au verre.
 */
export function Select({ label, options, className = '', id, ...rest }: SelectProps) {
  const generated = useId();
  const selectId = id ?? generated;

  return (
    <div className={className}>
      {label && (
        <label className="tf-label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <div className="tf-field g" style={{ borderRadius: 'var(--r-md)' }}>
        <span className="g-refract" />
        <span className="g-tint" />
        <span className="g-rim" />
        <select id={selectId} className="tf-input tf-select" {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="tf-select-arrow" aria-hidden="true">
          <Icon.Chevron size={15} />
        </span>
      </div>
    </div>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string };

export function Textarea({ label, className = '', id, rows = 4, ...rest }: TextareaProps) {
  const generated = useId();
  const areaId = id ?? generated;

  return (
    <div className={className}>
      {label && (
        <label className="tf-label" htmlFor={areaId}>
          {label}
        </label>
      )}
      <div className="tf-field g" style={{ borderRadius: 'var(--r-md)' }}>
        <span className="g-refract" />
        <span className="g-tint" />
        <span className="g-rim" />
        <textarea id={areaId} rows={rows} className="tf-input tf-textarea" {...rest} />
      </div>
    </div>
  );
}
