import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the confirm button for keyboard accessibility
      setTimeout(() => confirmRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  const colors = {
    danger: {
      icon: 'bg-red-50',
      iconColor: 'text-red-500',
      btn: 'bg-red-500 hover:bg-red-600',
    },
    warning: {
      icon: 'bg-amber-50',
      iconColor: 'text-amber-500',
      btn: 'bg-amber-500 hover:bg-amber-600',
    },
    info: {
      icon: 'bg-pink-50',
      iconColor: 'text-pink-500',
      btn: 'bg-pink-500 hover:bg-pink-600',
    },
  }[variant];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.icon}`}
            >
              <AlertTriangle className={`w-5 h-5 ${colors.iconColor}`} />
            </div>
            <h3 className="font-bold text-gray-900 text-base">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <p className="px-6 py-3 text-sm text-gray-500 leading-relaxed">{message}</p>

        {/* Actions */}
        <div className="flex flex-col gap-2 px-6 pb-6 pt-2">
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`w-full py-3 rounded-xl text-white font-bold text-sm transition-all active:scale-95 shadow-sm ${colors.btn}`}
            style={{ 
              color: '#ffffff',
              backgroundColor: variant === 'danger' ? '#ef4444' : variant === 'warning' ? '#f59e0b' : '#ec4899'
            }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
