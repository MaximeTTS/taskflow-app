'use client';

import { type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof HTMLMotionProps<'button'>> &
  Omit<HTMLMotionProps<'button'>, 'children'> & {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    children?: ReactNode;
  };

const sizes: Record<Size, string> = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-sm',
};

const variantStyle: Record<Variant, CSSProperties> = {
  primary: {
    background: 'var(--tf-accent)',
    color: 'var(--tf-accent-text)',
    border: '1px solid transparent',
    boxShadow: '0 6px 16px -8px rgba(0,0,0,0.35)',
  },
  secondary: {
    background: 'var(--tf-pill-bg)',
    color: 'var(--tf-text)',
    border: '1px solid var(--tf-pill-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--tf-text-muted)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'rgba(239,68,68,0.12)',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.3)',
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  style,
  ...props
}: ButtonProps) {
  const isGlass = variant === 'secondary';
  const isDisabled = disabled ?? loading;
  return (
    <motion.button
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { y: -1.5, scale: 1.015 }}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className={`
        inline-flex items-center justify-center gap-2
        font-semibold rounded-full
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isGlass ? 'tf-blur' : ''}
        ${sizes[size]}
        ${className}
      `}
      style={{ ...variantStyle[variant], ...style }}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      {children}
    </motion.button>
  );
}
