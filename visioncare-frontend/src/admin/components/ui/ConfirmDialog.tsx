import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl animate-scale-in p-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto
          ${danger ? 'bg-rose-500/20' : 'bg-amber-500/20'}`}>
          <AlertTriangle size={22} className={danger ? 'text-rose-400' : 'text-amber-400'} />
        </div>
        <h3 className="text-lg font-display font-semibold text-white text-center mb-2">{title}</h3>
        <p className="text-sm text-slate-400 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300
              hover:bg-white/5 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95
              ${danger
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-amber-600 hover:bg-amber-500 text-white'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
