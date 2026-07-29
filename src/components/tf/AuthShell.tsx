'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TfBackground } from './Backgrounds';
import { BrandMark, Wordmark, ThemeToggle } from './atoms';
import { spring } from './motion';

type Props = {
  title: string;
  subtitle: string;
  altPrompt: string;
  altLabel: string;
  altHref: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, altPrompt, altLabel, altHref, children }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ color: 'var(--tf-text)' }}>
      <TfBackground />

      {/* Minimal nav */}
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 sm:px-6 pt-6">
        <Link href="/" className="tf-pill flex items-center gap-2.5 rounded-full pl-2 pr-4 h-12">
          <BrandMark size={32} />
          <Wordmark size={15} />
        </Link>
        <div className="tf-pill flex items-center gap-1 rounded-full pl-4 pr-1.5 h-12">
          <span className="hidden sm:inline text-[13px] mr-1.5" style={{ color: 'var(--tf-text-muted)' }}>
            {altPrompt}
          </span>
          <Link
            href={altHref}
            className="px-3.5 h-9 inline-flex items-center rounded-full text-[13px] font-semibold"
            style={{ background: 'var(--tf-soft)', color: 'var(--tf-text)' }}
          >
            {altLabel}
          </Link>
          <ThemeToggle size={36} />
        </div>
      </div>

      {/* Card */}
      <div className="relative z-[2] flex items-center justify-center px-4 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={spring}
          className="tf-blur w-full max-w-md p-8 sm:p-9"
          style={{
            borderRadius: 'calc(32px * var(--tf-radius-scale, 1))',
            background: 'var(--tf-modal-bg)',
            border: '1px solid var(--tf-card-border)',
            boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          <h1 className="text-[30px] font-bold" style={{ letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          <p className="mt-1.5 mb-6 text-sm" style={{ color: 'var(--tf-text-muted)' }}>
            {subtitle}
          </p>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
