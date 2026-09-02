import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Activity,
  AlertCircle,
  Eye,
  Clock,
  ThumbsUp,
  Sliders,
} from "lucide-react";
import { StatCard } from "../../components/UI/StatCard";

// Mock data for hospital dashboard analytics
const WEEKLY_ALERTS_DATA = [
  { day: "Mon", critical: 2, warning: 5, resolved: 7 },
  { day: "Tue", critical: 4, warning: 8, resolved: 11 },
  { day: "Wed", critical: 1, warning: 3, resolved: 4 },
  { day: "Thu", critical: 5, warning: 9, resolved: 13 },
  { day: "Fri", critical: 3, warning: 6, resolved: 8 },
  { day: "Sat", critical: 2, warning: 4, resolved: 6 },
  { day: "Sun", critical: 1, warning: 2, resolved: 3 },
];

const GESTURE_ACCURACY_DATA = [
  { gesture: "Blink", count: 120, accuracy: 99.1 },
  { gesture: "Sustained Close", count: 85, accuracy: 96.5 },
  { gesture: "Yawn", count: 42, accuracy: 98.2 },
  { gesture: "Head Tilt", count: 35, accuracy: 94.8 },
  { gesture: "Mouth Open", count: 68, accuracy: 97.4 },
];

const MONITORING_HOURS_DATA = [
  { hour: "00:00", active: 8 },
  { hour: "04:00", active: 8 },
  { hour: "08:00", active: 12 },
  { hour: "12:00", active: 15 },
  { hour: "16:00", active: 14 },
  { hour: "20:00", active: 10 },
];

const EAR_MAR_TREND_DATA = [
  { sec: "0s", ear: 0.28, mar: 0.18 },
  { sec: "5s", ear: 0.29, mar: 0.17 },
  { sec: "10s", ear: 0.12, mar: 0.19 }, // Blink
  { sec: "15s", ear: 0.28, mar: 0.18 },
  { sec: "20s", ear: 0.27, mar: 0.65 }, // Yawn
  { sec: "25s", ear: 0.29, mar: 0.20 },
  { sec: "30s", ear: 0.28, mar: 0.17 },
];

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e"];

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6 animate-fade-in text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Comprehensive reports and monitoring telemetry</p>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Detections"
          value="350"
          icon={<Activity size={18} className="text-brand-600" />}
          iconBg="bg-brand-100 dark:bg-brand-900/30"
          accent="border-brand-400"
          trend={{ value: 12.4, positive: true }}
          subtitle="Past 7 days"
        />
        <StatCard
          label="Critical Alerts Escalated"
          value="18"
          icon={<AlertCircle size={18} className="text-rose-600" />}
          iconBg="bg-rose-100 dark:bg-rose-900/30"
          accent="border-rose-500"
          trend={{ value: -5.2, positive: false }}
          subtitle="Email & SMS alerts sent"
        />
        <StatCard
          label="Avg Response Time"
          value="45s"
          icon={<Clock size={18} className="text-signal-teal" />}
          iconBg="bg-signal-mist dark:bg-signal-teal/10"
          accent="border-signal-teal"
          trend={{ value: 18.5, positive: true }}
          subtitle="-10 seconds from last week"
        />
        <StatCard
          label="Alert Classification Accuracy"
          value="97.2%"
          icon={<ThumbsUp size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          accent="border-emerald-400"
          trend={{ value: 0.8, positive: true }}
          subtitle="Determined by nurse feedback"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Alert Distribution */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-500" />
              Weekly Alert Frequency
            </h2>
            <span className="text-xs text-slate-400">By Severity & Type</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={WEEKLY_ALERTS_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, fontSize: 12, color: "#fff" }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} formatter={(value: string) => <span className="text-xs text-slate-500 capitalize">{value}</span>} />
              <Bar dataKey="critical" fill="#f43f5e" name="Critical" radius={[4, 4, 0, 0]} />
              <Bar dataKey="warning" fill="#f59e0b" name="Warning" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" fill="#10b981" name="Resolved" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Accuracy breakdown */}
        <div className="card p-5 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h2 className="section-title mb-5 flex items-center gap-2">
              <Sliders size={18} className="text-violet-500" />
              Gesture Accuracy Breakdown
            </h2>
            <div className="space-y-4">
              {GESTURE_ACCURACY_DATA.map((item, index) => (
                <div key={item.gesture} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">{item.gesture}</span>
                    <span className="text-slate-900 dark:text-slate-100">{item.accuracy}% ({item.count} samples)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.accuracy}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time metrics streaming trend simulator */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title flex items-center gap-2">
              <Eye size={18} className="text-signal-teal" />
              EAR / MAR Trend Tracking
            </h2>
            <span className="text-xs text-slate-400">Sample Stream (30s)</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={EAR_MAR_TREND_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
              <XAxis dataKey="sec" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, fontSize: 12, color: "#fff" }}
              />
              <Legend verticalAlign="top" height={36} iconType="line" iconSize={12} formatter={(value: string) => <span className="text-xs text-slate-500 uppercase">{value}</span>} />
              <Line type="monotone" dataKey="ear" stroke="#0ea5e9" strokeWidth={2} activeDot={{ r: 6 }} name="Eye Aspect Ratio (EAR)" />
              <Line type="monotone" dataKey="mar" stroke="#8b5cf6" strokeWidth={2} name="Mouth Aspect Ratio (MAR)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monitoring hours timeline */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-500" />
              Active Monitoring Statistics
            </h2>
            <span className="text-xs text-slate-400">Total Patient Monitoring Hours</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MONITORING_HOURS_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="monitoringHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, fontSize: 12, color: "#fff" }}
              />
              <Area type="monotone" dataKey="active" stroke="#10b981" strokeWidth={2} fill="url(#monitoringHours)" name="Active Monitored Beds" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
