import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  pulse?: boolean;
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'teal';
}

const colorMap = {
  blue:    { bg: 'from-blue-500/20 to-blue-600/10',    icon: 'bg-blue-500/20 text-blue-400',    glow: 'shadow-blue-500/10'   },
  emerald: { bg: 'from-emerald-500/20 to-emerald-600/10', icon: 'bg-emerald-500/20 text-emerald-400', glow: 'shadow-emerald-500/10' },
  amber:   { bg: 'from-amber-500/20 to-amber-600/10',  icon: 'bg-amber-500/20 text-amber-400',  glow: 'shadow-amber-500/10'  },
  rose:    { bg: 'from-rose-500/20 to-rose-600/10',    icon: 'bg-rose-500/20 text-rose-400',    glow: 'shadow-rose-500/10'   },
  violet:  { bg: 'from-violet-500/20 to-violet-600/10',icon: 'bg-violet-500/20 text-violet-400',glow: 'shadow-violet-500/10' },
  teal:    { bg: 'from-teal-500/20 to-teal-600/10',    icon: 'bg-teal-500/20 text-teal-400',   glow: 'shadow-teal-500/10'   },
};

export const StatCard: React.FC<StatCardProps> = ({
  title, value, subtitle, icon, trend, trendValue, className = '', pulse = false,
  color = 'blue',
}) => {
  const c = colorMap[color];
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 dark:border-white/5
        bg-gradient-to-br ${c.bg} backdrop-blur-sm
        shadow-lg ${c.glow} hover:shadow-xl
        transition-all duration-300 hover:-translate-y-0.5 group ${className}`}
    >
      {/* Background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      <div className="relative p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${c.icon} ${pulse ? 'animate-pulse' : ''}`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full
              ${trend === 'up'      ? 'bg-emerald-500/20 text-emerald-400' :
                trend === 'down'    ? 'bg-rose-500/20 text-rose-400' :
                                      'bg-slate-500/20 text-slate-400'}`}>
              {trend === 'up'   ? <TrendingUp  size={12} /> :
               trend === 'down' ? <TrendingDown size={12} /> :
                                  <Minus size={12} />}
              {trendValue}
            </div>
          )}
        </div>

        <div className="mt-1">
          <p className="text-2xl font-display font-bold text-white tracking-tight">{value}</p>
          <p className="text-sm font-medium text-slate-300 mt-0.5">{title}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};
