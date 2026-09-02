import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../../types/admin.types';

interface ToastProps {
  toasts: ToastMessage[];
  dismiss: (id: string) => void;
}

const config = {
  success: { icon: CheckCircle,    bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-400', iconColor: 'text-emerald-400' },
  error:   { icon: XCircle,        bg: 'bg-rose-500/20 border-rose-500/40',       text: 'text-rose-400',    iconColor: 'text-rose-400'    },
  warning: { icon: AlertTriangle,  bg: 'bg-amber-500/20 border-amber-500/40',     text: 'text-amber-400',   iconColor: 'text-amber-400'   },
  info:    { icon: Info,           bg: 'bg-blue-500/20 border-blue-500/40',       text: 'text-blue-400',    iconColor: 'text-blue-400'    },
};

export const ToastStack: React.FC<ToastProps> = ({ toasts, dismiss }) => (
  <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
    {toasts.map((t) => {
      const c = config[t.type];
      const Icon = c.icon;
      return (
        <div
          key={t.id}
          className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md
            ${c.bg} shadow-xl animate-slide-in`}
        >
          <Icon size={18} className={`mt-0.5 shrink-0 ${c.iconColor}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${c.text}`}>{t.title}</p>
            {t.message && <p className="text-xs text-slate-400 mt-0.5">{t.message}</p>}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 p-0.5 rounded text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      );
    })}
  </div>
);
