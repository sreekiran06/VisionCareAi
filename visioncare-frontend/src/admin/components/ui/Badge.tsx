import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'purple';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  danger:  'bg-rose-500/20 text-rose-400 border-rose-500/30',
  info:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
  muted:   'bg-slate-500/20 text-slate-400 border-slate-500/30',
  purple:  'bg-violet-500/20 text-violet-400 border-violet-500/30',
};

const dotMap: Record<BadgeVariant, string> = {
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger:  'bg-rose-400',
  info:    'bg-blue-400',
  muted:   'bg-slate-400',
  purple:  'bg-violet-400',
};

export const Badge: React.FC<BadgeProps> = ({ variant, children, dot = false, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold
      border ${variantMap[variant]} ${className}`}
  >
    {dot && (
      <span className={`w-1.5 h-1.5 rounded-full ${dotMap[variant]} ${variant === 'success' ? 'animate-pulse' : ''}`} />
    )}
    {children}
  </span>
);

// Convenience helpers
export const statusVariant = (status: string): BadgeVariant => {
  const m: Record<string, BadgeVariant> = {
    active: 'success', online: 'success', healthy: 'success', resolved: 'success',
    offline: 'warning', suspended: 'warning', acknowledged: 'info', degraded: 'warning',
    disconnected: 'danger', critical: 'danger', pending: 'muted',
    super_admin: 'purple', hospital_admin: 'info', doctor: 'info', nurse: 'success',
    basic: 'muted', professional: 'info', enterprise: 'purple',
  };
  return m[status?.toLowerCase()] ?? 'muted';
};

export const severityVariant = (severity: string): BadgeVariant => {
  const m: Record<string, BadgeVariant> = {
    critical: 'danger', high: 'warning', medium: 'info', low: 'muted',
  };
  return m[severity?.toLowerCase()] ?? 'muted';
};
