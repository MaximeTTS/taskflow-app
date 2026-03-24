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

  // Lock body scroll when modal is open
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="bg-[#16161f] border border-[#2a2a3a] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — always visible */}
        <div className="flex items-center justify-between p-4 sm:p-6 pb-0 sm:pb-0 shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-[#f0f0ff] pr-4">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#55556a] hover:text-[#f0f0ff] transition-colors text-2xl leading-none p-1 -mr-1"
          >
            ×
          </button>
        </div>
        {/* Content — scrollable */}
        <div className="p-4 sm:p-6 pt-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
