'use client';

import { useEffect } from 'react';

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl w-full max-w-md p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[#f0f0ff]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#55556a] hover:text-[#f0f0ff] transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
