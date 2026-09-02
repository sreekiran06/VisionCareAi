import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { analyticsApi } from '../services/adminApi';
import type { AnalyticsData } from '../types/admin.types';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#f43f5e','#8b5cf6','#1C9E9E','#fb7185','#34d399'];

const ChartCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="rounded-2xl bg-white/3 border border-white/10 p-5">
    <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
    {subtitle && <p className="text-xs text-slate-500 mb-3">{subtitle}</p>}
    <div className="mt-3">{children}</div>
  </div>
);

const ttStyle = { backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, color: '#cbd5e1' };

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.get().then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />
      ))}
    </div>
  );

  if (!data) return <div className="text-slate-500 text-center py-20">Failed to load analytics</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">System-wide performance insights</p>
      </div>

      {/* False alert rate */}
      <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <span className="text-2xl font-bold text-amber-400">{data.false_alert_pct}%</span>
        <div>
          <p className="text-sm font-semibold text-amber-300">False Alert Rate</p>
          <p className="text-xs text-slate-500">Across all hospitals this period</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Alerts */}
        <ChartCard title="Daily Alerts" subtitle="Last 7 days">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.daily_alerts}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={ttStyle} />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Alerts" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Weekly Alerts */}
        <ChartCard title="Weekly Alerts" subtitle="Last 8 weeks">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.weekly_alerts}>
              <defs>
                <linearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={ttStyle} />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#weekGrad)" name="Alerts" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Monthly Alerts */}
        <ChartCard title="Monthly Alerts" subtitle="Last 6 months">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.monthly_alerts}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={ttStyle} />
              <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} name="Alerts" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Patient Distribution */}
        <ChartCard title="Patient Distribution" subtitle="By condition">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.patient_distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {data.patient_distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={ttStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Hospital Distribution */}
        <ChartCard title="Hospital Distribution" subtitle="Patients per hospital">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.hospital_distribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} width={100} />
              <Tooltip contentStyle={ttStyle} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Patients">
                {data.hospital_distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Camera Status */}
        <ChartCard title="Camera Status" subtitle="Online / Offline / Disconnected">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.camera_status} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                {data.camera_status.map((entry, i) => <Cell key={i} fill={entry.color ?? COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={ttStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Alert Types */}
        <ChartCard title="Most Frequent Alert Types">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.alert_types}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={ttStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Count">
                {data.alert_types.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Response Time */}
        <ChartCard title="Avg Alert Response Time" subtitle="Minutes per week">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.avg_response_time}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={ttStyle} />
              <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} name="Minutes" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};
