'use client';

import { useEffect } from 'react';
import { IconButton, Icon } from '@/components/tf/atoms';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="tf-overlay tf-blur fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'var(--tf-overlay-bg)' }}
      onClick={onClose}
    >
      <div
        className="tf-modal tf-blur w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden"
        style={{
          background: 'var(--tf-modal-bg)',
          border: '1px solid var(--tf-card-border)',
          borderRadius: 'calc(28px * var(--tf-radius-scale, 1))',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
          color: 'var(--tf-text)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 sm:p-6 pb-0 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold pr-4" style={{ letterSpacing: '-0.02em' }}>
            {title}
          </h2>
          <IconButton size={32} onClick={onClose} title="Fermer">
            <Icon.Close />
          </IconButton>
        </div>
        <div className="p-5 sm:p-6 pt-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
