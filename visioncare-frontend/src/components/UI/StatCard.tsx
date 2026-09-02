import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  trend?: { value: number; positive?: boolean } | null;
  subtitle?: string;
  accent?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  iconBg,
  trend,
  subtitle,
  accent,
}) => {
  return (
    <div
      className={`
        card p-5 flex flex-col gap-3 hover:shadow-card-hover transition-all duration-300 animate-slide-up
        ${accent ? `border-l-4 ${accent}` : ""}
      `}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {trend != null && (
          <span
            className={`
              text-xs font-semibold px-2 py-0.5 rounded-full
              ${trend.positive !== false && trend.value >= 0
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
              }
            `}
          >
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100 leading-tight">
          {value}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{label}</p>
        {subtitle && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
