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
    <>
      <style>{`
        /* Permet au bouton de prendre toute la largeur */
        .taskflow-datepicker { width: 100%; display: block; }
        .taskflow-datepicker .react-datepicker-wrapper { display: block; width: 100%; }
        .taskflow-datepicker .react-datepicker__input-container { display: block; width: 100%; }

        /* Le reste de tes styles originaux (identiques) */
        .taskflow-datepicker .react-datepicker {
          background: #16161f;
          border: 1px solid #2a2a3a;
          border-radius: 12px;
          font-family: inherit;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .taskflow-datepicker .react-datepicker__header {
          background: #111118;
          border-bottom: 1px solid #2a2a3a;
          padding: 12px 0 8px;
        }
        .taskflow-datepicker .react-datepicker__current-month {
          color: #f0f0ff;
          font-size: 14px;
          font-weight: 600;
          text-transform: capitalize;
        }
        .taskflow-datepicker .react-datepicker__day-name {
          color: #55556a;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          width: 32px;
          line-height: 32px;
        }
        .taskflow-datepicker .react-datepicker__day {
          color: #8888aa;
          width: 32px;
          line-height: 32px;
          border-radius: 8px;
          font-size: 13px;
          margin: 1px;
          transition: all 0.15s;
        }
        .taskflow-datepicker .react-datepicker__day:hover {
          background: #2a2a3a;
          color: #f0f0ff;
        }
        .taskflow-datepicker .react-datepicker__day--selected {
          background: #6366f1 !important;
          color: #fff !important;
          font-weight: 600;
        }
        .taskflow-datepicker .react-datepicker__day--today {
          color: #6366f1;
          font-weight: 600;
        }
        .taskflow-datepicker .react-datepicker__day--outside-month {
          color: #2a2a3a;
        }
        .taskflow-datepicker .react-datepicker__navigation-icon::before {
          border-color: #8888aa;
        }
        .taskflow-datepicker .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: #f0f0ff;
        }
        .taskflow-datepicker .react-datepicker__triangle { display: none; }
        .taskflow-datepicker .react-datepicker__month-select,
        .taskflow-datepicker .react-datepicker__year-select {
          background: #2a2a3a;
          color: #f0f0ff;
          border: 1px solid #3a3a50;
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 13px;
          outline: none;
          cursor: pointer;
        }
        .taskflow-datepicker .react-datepicker__month-dropdown-container,
        .taskflow-datepicker .react-datepicker__year-dropdown-container {
          margin: 0 4px;
        }
        .taskflow-datepicker .react-datepicker-popper {
          z-index: 9999;
        }
      `}</style>

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
              className="flex items-center gap-2 px-4 py-3 w-full bg-[#16161f] border border-[#2a2a3a] rounded-lg text-sm text-left hover:border-indigo-500 transition-colors"
            >
              <svg
                className="w-4 h-4 text-[#8888aa] shrink-0"
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

              {/* Le placeholder de base est exactement comme avant */}
              <span className={formatted ? 'text-[#f0f0ff]' : 'text-[#55556a]'}>
                {formatted ?? placeholder}
              </span>

              {value && (
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Évite d'ouvrir le calendrier quand on clique sur la croix
                    onChange(null);
                  }}
                  className="ml-auto text-[#55556a] hover:text-red-400 transition-colors text-lg leading-none cursor-pointer px-2"
                >
                  ×
                </span>
              )}
            </button>
          }
        />
      </div>
    </>
  );
}
