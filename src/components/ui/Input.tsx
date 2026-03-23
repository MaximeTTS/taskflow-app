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
        {label && <label className="text-sm font-medium text-[#8888aa]">{label}</label>}
        <input
          ref={ref}
          className={`
            w-full bg-[#16161f] border rounded-lg px-4 py-2.5
            text-sm text-[#f0f0ff] placeholder-[#55556a]
            outline-none transition-all duration-150
            ${
              error
                ? 'border-red-500/50 focus:border-red-500'
                : 'border-[#2a2a3a] focus:border-indigo-500'
            }
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-[#55556a]">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
