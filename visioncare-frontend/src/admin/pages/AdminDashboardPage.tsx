import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Users, Camera, UserRound, Bell, AlertTriangle,
  Wifi, WifiOff, Activity, Cpu, MemoryStick, CheckCircle2, Clock,
  RefreshCw, Target,
} from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { adminStatsApi } from '../services/adminApi';
import type { DashboardStats } from '../types/admin.types';
import { useAdminWebSocket } from '../hooks/useAdminWebSocket';

const REFRESH_MS = 15_000;

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats]     = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await adminStatsApi.get();
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Stats fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchStats]);

  // WebSocket patches live metrics
  useAdminWebSocket({
    onMessage: (event) => {
      if (event.type === 'system_health' && stats) {
        setStats((prev) => prev ? {
          ...prev,
          cpu_usage:    event.payload.cpu_usage    as number ?? prev.cpu_usage,
          memory_usage: event.payload.memory_usage as number ?? prev.memory_usage,
        } : prev);
      }
    },
  });

  const s = stats;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10
            text-sm text-slate-300 hover:bg-white/10 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Hospitals"        value={loading ? '—' : s?.total_hospitals ?? 0}        icon={<Building2 size={20} />}   color="blue"    />
        <StatCard title="Active Patients"  value={loading ? '—' : s?.total_active_patients ?? 0}  icon={<UserRound size={20} />}   color="emerald" />
        <StatCard title="Total Cameras"    value={loading ? '—' : s?.total_cameras ?? 0}           icon={<Camera size={20} />}     color="violet"  />
        <StatCard title="Nurses"           value={loading ? '—' : s?.total_nurses ?? 0}            icon={<Users size={20} />}      color="teal"    />
        <StatCard title="Doctors"          value={loading ? '—' : s?.total_doctors ?? 0}           icon={<Users size={20} />}      color="blue"    />
      </div>

      {/* Alert KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Today's Alerts"
          value={loading ? '—' : s?.total_alerts_today ?? 0}
          icon={<Bell size={20} />}
          color="amber"
          trend="up" trendValue="+12%"
        />
        <StatCard
          title="Critical Alerts"
          value={loading ? '—' : s?.critical_alerts ?? 0}
          icon={<AlertTriangle size={20} />}
          color="rose"
          pulse={!loading && (s?.critical_alerts ?? 0) > 0}
        />
        <StatCard
          title="Online Cameras"
          value={loading ? '—' : s?.online_cameras ?? 0}
          subtitle={`${s?.offline_cameras ?? 0} offline`}
          icon={<Wifi size={20} />}
          color="emerald"
          trend="neutral"
        />
        <StatCard
          title="WebSocket Conn."
          value={loading ? '—' : s?.websocket_connections ?? 0}
          icon={<Activity size={20} />}
          color="teal"
        />
      </div>

      {/* System + Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="col-span-1 rounded-2xl bg-white/3 border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={16} className="text-blue-400" />
            <span className="text-sm font-semibold text-slate-300">CPU Usage</span>
          </div>
          <div className="relative w-24 h-24 mx-auto">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none"
                stroke="#3b82f6" strokeWidth="3"
                strokeDasharray={`${s?.cpu_usage ?? 0} ${100 - (s?.cpu_usage ?? 0)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-white">{loading ? '—' : `${Math.round(s?.cpu_usage ?? 0)}%`}</span>
            </div>
          </div>
        </div>

        {/* Memory */}
        <div className="col-span-1 rounded-2xl bg-white/3 border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <MemoryStick size={16} className="text-violet-400" />
            <span className="text-sm font-semibold text-slate-300">Memory Usage</span>
          </div>
          <div className="relative w-24 h-24 mx-auto">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none"
                stroke="#8b5cf6" strokeWidth="3"
                strokeDasharray={`${s?.memory_usage ?? 0} ${100 - (s?.memory_usage ?? 0)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-white">{loading ? '—' : `${Math.round(s?.memory_usage ?? 0)}%`}</span>
            </div>
          </div>
        </div>

        {/* Server Status */}
        <div className="col-span-1 rounded-2xl bg-white/3 border border-white/10 p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-sm font-semibold text-slate-300">Server Status</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Backend API</span>
              <span className="text-emerald-400 font-medium">● Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Database</span>
              <span className="text-emerald-400 font-medium">● Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">WebSocket</span>
              <span className="text-emerald-400 font-medium">● Active</span>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="col-span-1 rounded-2xl bg-white/3 border border-white/10 p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-teal-400" />
            <span className="text-sm font-semibold text-slate-300">Performance</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Detection Acc.</span>
              <span className="text-teal-400 font-semibold">{s?.detection_accuracy ?? 97.3}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Avg Response</span>
              <span className="text-amber-400 font-semibold">{s?.alert_response_time ?? 2.4} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Offline Cameras</span>
              <span className={`font-semibold ${(s?.offline_cameras ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {s?.offline_cameras ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
