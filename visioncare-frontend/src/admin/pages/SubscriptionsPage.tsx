import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Badge, statusVariant } from '../components/ui/Badge';
import { hospitalsApi } from '../services/adminApi';
import type { Hospital } from '../types/admin.types';

const planConfig = {
  basic:        { color: 'border-slate-500/30 from-slate-800/60 to-slate-900/60', badge: 'muted',   icon: '⭐' },
  professional: { color: 'border-blue-500/30 from-blue-900/40 to-slate-900/60',   badge: 'info',    icon: '🚀' },
  enterprise:   { color: 'border-violet-500/30 from-violet-900/40 to-slate-900/60', badge: 'purple', icon: '💎' },
};

const daysUntil = (expiry?: string) => {
  if (!expiry) return null;
  const diff = new Date(expiry).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const SubscriptionsPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    hospitalsApi.list({ limit: 100 }).then(({ data }) => setHospitals(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />)}
    </div>
  );

  const summary = {
    basic:        hospitals.filter((h) => h.license_type === 'basic').length,
    professional: hospitals.filter((h) => h.license_type === 'professional').length,
    enterprise:   hospitals.filter((h) => h.license_type === 'enterprise').length,
    expiringSoon: hospitals.filter((h) => { const d = daysUntil(h.subscription_expiry); return d !== null && d <= 30 && d > 0; }).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Subscription Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Hospital license and subscription overview</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Basic',          value: summary.basic,        color: 'text-slate-400', icon: '⭐' },
          { label: 'Professional',   value: summary.professional, color: 'text-blue-400',  icon: '🚀' },
          { label: 'Enterprise',     value: summary.enterprise,   color: 'text-violet-400',icon: '💎' },
          { label: 'Expiring ≤30d',  value: summary.expiringSoon, color: 'text-amber-400', icon: '⚠️' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="rounded-2xl bg-white/3 border border-white/10 p-4 flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Hospital Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hospitals.map((h) => {
          const plan = planConfig[h.license_type] ?? planConfig.basic;
          const days = daysUntil(h.subscription_expiry);
          const isExpired = h.subscription_status === 'expired' || (days !== null && days <= 0);
          const isWarn    = days !== null && days > 0 && days <= 30;

          return (
            <div key={h.id}
              className={`rounded-2xl border bg-gradient-to-br ${plan.color} backdrop-blur-sm p-5
                hover:-translate-y-0.5 transition-all duration-300`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-display font-semibold text-white">{h.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{h.email ?? 'No email'}</p>
                </div>
                <span className="text-xl">{plan.icon}</span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan</span>
                  <Badge variant={statusVariant(h.license_type)}>{h.license_type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <Badge variant={statusVariant(h.subscription_status)} dot>{h.subscription_status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cameras</span>
                  <span className="text-slate-300">{h.current_cameras}/{h.max_cameras}</span>
                </div>
                {h.subscription_expiry && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expiry</span>
                    <span className={`text-xs font-medium ${isExpired ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-slate-400'}`}>
                      {h.subscription_expiry} {days !== null && `(${days > 0 ? `${days}d left` : 'Expired'})`}
                    </span>
                  </div>
                )}
              </div>

              {isExpired && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle size={12} /> Subscription expired — renewal required
                </div>
              )}
              {isWarn && !isExpired && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <Clock size={12} /> Expiring soon — {days} days remaining
                </div>
              )}
              {!isExpired && !isWarn && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                  <CheckCircle size={12} /> Active subscription
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hospitals.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hospitals registered yet</p>
        </div>
      )}
    </div>
  );
};
