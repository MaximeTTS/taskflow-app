import { type InputHTMLAttributes, forwardRef } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium" style={{ color: 'var(--tf-text-muted)' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-xl px-3.5 py-2.5
            text-sm outline-none transition-all duration-150
            placeholder:opacity-50
            focus:ring-2 focus:ring-[color:var(--tf-accent)]/30
            ${className}
          `}
          style={{
            background: 'var(--tf-input-bg)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'var(--tf-input-border)'}`,
            color: 'var(--tf-text)',
          }}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && (
          <p className="text-xs" style={{ color: 'var(--tf-text-faint)' }}>
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
