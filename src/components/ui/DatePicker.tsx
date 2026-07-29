'use client';

// Plus besoin de useState !
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';

type Props = {
  value: string | null;
  onChange: (date: string | null) => void;
  placeholder?: string;
};

export function DatePicker({ value, onChange, placeholder = 'Choisir une date' }: Props) {
  const selected = value
    ? (() => {
        // Gère les timestamps numériques (venant de la DB via GraphQL)
        const num = Number(value);
        if (!isNaN(num) && num > 1000000000000) {
          const d = new Date(num);
          return isNaN(d.getTime()) ? null : d;
        }
        // Gère les strings ISO ou YYYY-MM-DD
        const str = value.includes('T') ? (value.split('T')[0] ?? value) : value;
        const [y, m, d] = str.split('-').map(Number);
        if (!y || !m || !d) return null;
        const date = new Date(y, m - 1, d);
        return isNaN(date.getTime()) ? null : date;
      })()
    : null;
  const formatted = selected
    ? selected.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
      <div className="taskflow-datepicker">
        <ReactDatePicker
          selected={selected}
          onChange={(date: Date | null) => {
            if (!date) {
              onChange(null);
              return;
            }
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            onChange(`${y}-${m}-${d}`);
          }}
          dateFormat="dd/MM/yyyy"
          locale={fr}
          minDate={new Date('2000-01-01')}
          maxDate={new Date('2099-12-31')}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          popperPlacement="bottom" /* ICI : Centre le calendrier en dessous */
          /* En passant directement la balise HTML 'button' ici, le composant gère 
             automatiquement l'ouverture, la fermeture et la détection du clic */
          customInput={
            <button
              type="button"
              className="flex items-center gap-2 px-3.5 py-2.5 w-full rounded-xl text-sm text-left transition-colors"
              style={{
                background: 'var(--tf-input-bg)',
                border: '1px solid var(--tf-input-border)',
                color: 'var(--tf-text)',
              }}
            >
              <svg
                className="w-4 h-4 shrink-0"
                style={{ color: 'var(--tf-text-muted)' }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>

              <span style={{ color: formatted ? 'var(--tf-text)' : 'var(--tf-text-faint)' }}>
                {formatted ?? placeholder}
              </span>

              {value && (
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(null);
                  }}
                  className="ml-auto hover:text-red-400 transition-colors text-lg leading-none cursor-pointer px-2"
                  style={{ color: 'var(--tf-text-faint)' }}
                >
                  ×
                </span>
              )}
            </button>
          }
        />
      </div>
  );
}
