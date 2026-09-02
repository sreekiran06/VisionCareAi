import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useWebSocket } from "../../hooks/useWebSocket";
import { detectionsApi, patientsApi } from "../../services/api";
import {
  NurseSocketMessage,
  PatientRequest,
  RequestStatus,
  WardStats,
} from "../../types";
import {
  Users,
  Activity,
  Bell,
  CheckCircle,
  Clock,
  Video,
  AlertTriangle,
  Eye,
  TrendingUp,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  RefreshCw,
  ExternalLink,
  Settings,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { StatCard } from "../UI/StatCard";
import { NeedBadge, StatusBadge, GestureBadge, ConnectionBadge } from "../UI/Badge";

interface NurseDashboardProps {
  wardId: string;
  nurseId: string;
  nurseName?: string;
}

const WS_BASE_URL = process.env.REACT_APP_WS_URL ?? "ws://localhost:8001";

function mapDetectionToRequest(raw: any): PatientRequest {
  return {
    id:              raw.id,
    patientId:       raw.patient_id,
    patientName:     raw.patient_name,
    bedNumber:       raw.bed_number,
    need:            raw.need_type ?? raw.need,
    gestureType:     raw.gesture_type,
    confidence:      raw.confidence,
    timestamp:       new Date(raw.timestamp ?? raw.created_at),
    status:          (raw.status ?? "pending") as RequestStatus,
    acknowledgedBy:  raw.acknowledged_by,
    responseTimeMs:  raw.response_time_ms,
  };
}

// Deterministic mock timeline data (7 data points)
const TIMELINE_DATA = [
  { time: "08:00", detections: 4,  alerts: 1 },
  { time: "10:00", detections: 7,  alerts: 2 },
  { time: "12:00", detections: 12, alerts: 3 },
  { time: "14:00", detections: 8,  alerts: 1 },
  { time: "16:00", detections: 15, alerts: 4 },
  { time: "18:00", detections: 10, alerts: 2 },
  { time: "Now",   detections: 6,  alerts: 1 },
];

const GESTURE_PIE_DATA = [
  { name: "Sustained Close", value: 38, color: "#0ea5e9" },
  { name: "Blink",           value: 25, color: "#10b981" },
  { name: "Yawn",            value: 20, color: "#f59e0b" },
  { name: "Head Tilt",       value: 17, color: "#8b5cf6" },
];

const getRiskLevel = (need: string | undefined, confidence: number) => {
  if (need === "emergency" || need === "pain") return "critical";
  if (confidence > 0.85) return "high";
  if (confidence > 0.65) return "medium";
  return "low";
};

const RISK_COLORS: Record<string, string> = {
  critical: "text-rose-600 dark:text-rose-400 font-bold",
  high:     "text-orange-600 dark:text-orange-400",
  medium:   "text-amber-600 dark:text-amber-400",
  low:      "text-emerald-600 dark:text-emerald-400",
};

export const NurseDashboard: React.FC<NurseDashboardProps> = ({
  wardId,
  nurseId,
  nurseName = "Nurse",
}) => {
  const [requests,    setRequests]    = useState<PatientRequest[]>([]);
  const [patients,    setPatients]    = useState<any[]>([]);
  const [soundEnabled,setSoundEnabled]= useState(true);
  const [loadError,   setLoadError]   = useState<string | null>(null);
  const [now,         setNow]         = useState(new Date());
  const [refreshing,  setRefreshing]  = useState(false);

  const { lastMessage, connectionStatus } = useWebSocket(
    `${WS_BASE_URL}/ws/nurse/${wardId}`
  );

  const loadAll = async (showSpin = false) => {
    if (showSpin) setRefreshing(true);
    try {
      const [pendingRes, recentRes, patientsRes] = await Promise.all([
        detectionsApi.listActive(wardId),
        detectionsApi.listRecent(wardId, 20),
        patientsApi.list(wardId),
      ]);
      const pending = (pendingRes.data  ?? []).map(mapDetectionToRequest);
      const recent  = (recentRes.data   ?? []).map(mapDetectionToRequest);
      const merged  = new Map<string, PatientRequest>();
      [...recent, ...pending].forEach((r) => merged.set(r.id, r));
      setRequests(Array.from(merged.values()));
      setPatients(patientsRes.data ?? []);
      setLoadError(null);
    } catch {
      setLoadError("Couldn't load data. Check the backend connection.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { loadAll(); }, [wardId]);      // eslint-disable-line

  // Live WebSocket updates
  useEffect(() => {
    if (!lastMessage) return;
    let data: NurseSocketMessage;
    try { data = JSON.parse(lastMessage.data); } catch { return; }
    if (data.type === "new_request") {
      const incoming = mapDetectionToRequest(data);
      setRequests((prev) => prev.some((r) => r.id === incoming.id) ? prev : [incoming, ...prev]);
    }
    if (data.type === "request_updated") {
      const updated = mapDetectionToRequest(data);
      setRequests((prev) => prev.map((r) => r.id === updated.id ? { ...r, ...updated } : r));
    }
  }, [lastMessage]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  const handleAcknowledge = async (requestId: string, status: RequestStatus) => {
    setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status } : r));
    try { await detectionsApi.acknowledge(requestId, nurseId, status); }
    catch { setLoadError("Failed to save that update. It may not be recorded."); }
  };

  const pendingRequests = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);

  const historyRequests = useMemo(() =>
    requests
      .filter((r) => r.status !== "pending")
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20),
    [requests]
  );

  const stats: WardStats = useMemo(() => {
    const today = new Date();
    const completedToday = requests.filter(
      (r) => r.status === "completed" && r.timestamp.toDateString() === today.toDateString()
    );
    const responseTimes = completedToday.map((r) => r.responseTimeMs).filter((v): v is number => typeof v === "number");
    const avgResponseMinutes = responseTimes.length
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 60000
      : 0;
    return {
      activePatients:       new Set(requests.map((r) => r.patientId)).size,
      pendingRequests:      pendingRequests.length,
      completedToday:       completedToday.length,
      avgResponseMinutes,
    };
  }, [requests, pendingRequests.length]);

  const avgEAR = 0.28;
  const avgMAR = 0.41;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Ward {wardId} · {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionBadge status={connectionStatus} />
          <button
            onClick={() => setSoundEnabled((s) => !s)}
            title={soundEnabled ? "Mute alerts" : "Unmute alerts"}
            className="btn-ghost"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            onClick={() => loadAll(true)}
            disabled={refreshing}
            className="btn-secondary gap-2"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {loadError && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-400 text-sm animate-slide-up">
          <AlertTriangle size={16} className="shrink-0" />
          {loadError}
        </div>
      )}

      {/* ── Urgent Alert Banner ── */}
      {pendingRequests.some((r) => r.need === "emergency" || r.need === "pain") && (
        <div className="flex items-center gap-3 p-4 bg-rose-500 text-white rounded-2xl shadow-glow-coral animate-slide-up">
          <span className="w-3 h-3 rounded-full bg-white animate-pulse-ring" />
          <p className="font-semibold">
            ⚠️ URGENT — {pendingRequests.filter((r) => r.need === "emergency" || r.need === "pain").length} critical request(s) require immediate attention!
          </p>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        <div className="xl:col-span-1">
          <StatCard
            label="Total Patients"
            value={patients.length}
            icon={<Users size={18} className="text-brand-600" />}
            iconBg="bg-brand-100 dark:bg-brand-900/30"
            accent="border-brand-400"
          />
        </div>
        <div className="xl:col-span-1">
          <StatCard
            label="Monitoring"
            value={patients.filter((p) => p.is_active).length}
            icon={<Video size={18} className="text-violet-600" />}
            iconBg="bg-violet-100 dark:bg-violet-900/30"
            accent="border-violet-400"
            subtitle="Active cameras"
          />
        </div>
        <div className="xl:col-span-1">
          <StatCard
            label="Pending"
            value={stats.pendingRequests}
            icon={<Bell size={18} className="text-amber-600" />}
            iconBg="bg-amber-100 dark:bg-amber-900/30"
            accent="border-amber-400"
          />
        </div>
        <div className="xl:col-span-1">
          <StatCard
            label="Critical Alerts"
            value={pendingRequests.filter((r) => r.need === "emergency" || r.need === "pain").length}
            icon={<AlertTriangle size={18} className="text-rose-600" />}
            iconBg="bg-rose-100 dark:bg-rose-900/30"
            accent="border-rose-500"
          />
        </div>
        <div className="xl:col-span-1">
          <StatCard
            label="Completed Today"
            value={stats.completedToday}
            icon={<CheckCircle size={18} className="text-emerald-600" />}
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            accent="border-emerald-400"
          />
        </div>
        <div className="xl:col-span-1">
          <StatCard
            label="Avg Response"
            value={stats.avgResponseMinutes > 0 ? `${stats.avgResponseMinutes.toFixed(1)}m` : "—"}
            icon={<Clock size={18} className="text-signal-teal" />}
            iconBg="bg-signal-mist dark:bg-signal-teal/10"
            accent="border-signal-teal"
          />
        </div>
        <div className="xl:col-span-1">
          <StatCard
            label="Avg EAR"
            value={avgEAR.toFixed(2)}
            icon={<Eye size={18} className="text-brand-500" />}
            iconBg="bg-brand-50 dark:bg-brand-900/20"
            subtitle="Eye Aspect Ratio"
          />
        </div>
        <div className="xl:col-span-1">
          <StatCard
            label="Avg MAR"
            value={avgMAR.toFixed(2)}
            icon={<Activity size={18} className="text-violet-500" />}
            iconBg="bg-violet-50 dark:bg-violet-900/20"
            subtitle="Mouth Aspect Ratio"
          />
        </div>
      </div>

      {/* ── Two-column layout: Live Monitoring + Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Monitoring Table */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                {pendingRequests.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse-ring" />
                )}
                <h2 className="section-title">Live Monitoring</h2>
              </div>
              <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                {requests.length} records
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    {["Patient", "Room", "Need / Gesture", "Confidence", "Risk", "Status", "Time", "Action"].map((h) => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                        <Activity size={24} className="mx-auto mb-2 opacity-40" />
                        No activity yet — real-time updates will appear here
                      </td>
                    </tr>
                  ) : (
                    requests.slice(0, 10).map((r) => {
                      const risk = getRiskLevel(r.need, r.confidence);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="table-cell font-medium text-slate-900 dark:text-slate-100">{r.patientName}</td>
                          <td className="table-cell">
                            <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              Bed {r.bedNumber}
                            </span>
                          </td>
                          <td className="table-cell">
                            {r.need && <NeedBadge need={r.need} size="sm" />}
                            {r.gestureType && (
                              <div className="mt-1">
                                <GestureBadge gesture={r.gestureType} />
                              </div>
                            )}
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-brand-500 transition-all"
                                  style={{ width: `${Math.round(r.confidence * 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono text-slate-500">{Math.round(r.confidence * 100)}%</span>
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className={`text-xs font-semibold uppercase tracking-wide ${RISK_COLORS[risk]}`}>
                              {risk}
                            </span>
                          </td>
                          <td className="table-cell"><StatusBadge status={r.status} /></td>
                          <td className="table-cell text-xs text-slate-400">
                            {r.timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </td>
                          <td className="table-cell">
                            {r.status === "pending" && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleAcknowledge(r.id, "acknowledged")}
                                  className="px-2 py-1 text-xs font-semibold bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
                                >
                                  ACK
                                </button>
                                <button
                                  onClick={() => handleAcknowledge(r.id, "completed")}
                                  className="px-2 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                                >
                                  Done
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Alerts Panel */}
        <div className="lg:col-span-1">
          <div className="card h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="section-title">Recent Alerts</h2>
              {pendingRequests.length > 0 && (
                <span className="badge bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  {pendingRequests.length} pending
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
              {pendingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm">
                  <CheckCircle size={24} className="mb-2 text-emerald-400" />
                  All clear — no pending alerts
                </div>
              ) : (
                pendingRequests.map((r) => {
                  const urgent = r.need === "emergency" || r.need === "pain";
                  return (
                    <div
                      key={r.id}
                      className={`px-5 py-4 animate-slide-up ${urgent ? "bg-rose-50/50 dark:bg-rose-900/10" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{r.patientName}</p>
                          <p className="text-xs text-slate-400">Bed {r.bedNumber}</p>
                        </div>
                        {urgent && <AlertTriangle size={16} className="text-rose-500 shrink-0 animate-pulse" />}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <NeedBadge need={r.need} size="sm" />
                        {r.gestureType && <GestureBadge gesture={r.gestureType} confidence={r.confidence} />}
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        {r.timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAcknowledge(r.id, "acknowledged")}
                          className="flex-1 py-1.5 text-xs font-semibold bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => handleAcknowledge(r.id, "false_positive")}
                          className="px-2 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection Timeline */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Detection Timeline</h2>
            <span className="text-xs text-slate-400">Today</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={TIMELINE_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="detGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="alrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Area type="monotone" dataKey="detections" stroke="#0ea5e9" strokeWidth={2} fill="url(#detGrad)" name="Detections" />
              <Area type="monotone" dataKey="alerts"     stroke="#f43f5e" strokeWidth={2} fill="url(#alrGrad)" name="Alerts"     />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Gesture Distribution Pie */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Gesture Distribution</h2>
            <span className="text-xs text-slate-400">Live data</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={GESTURE_PIE_DATA}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {GESTURE_PIE_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, fontSize: 12 }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v: string) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Patients Grid ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="section-title">Monitored Patients</h2>
          <Link to="/add-patient" className="btn-primary text-sm">
            + Add Patient
          </Link>
        </div>
        {patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-sm">
            <Users size={32} className="mb-3 opacity-30" />
            <p>No patients registered yet.</p>
            <Link to="/add-patient" className="mt-3 text-brand-500 hover:underline text-sm font-medium">
              Register a patient →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
            {patients.map((p) => (
              <div key={p.id} className="border border-slate-100 dark:border-slate-700 rounded-2xl p-4 hover:shadow-card-hover hover:border-brand-200 dark:hover:border-brand-800 transition-all duration-200 bg-white dark:bg-slate-800">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-display font-bold text-slate-900 dark:text-slate-100 text-base">Bed {p.bed_number}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{p.name}</p>
                  </div>
                  <span className="badge bg-signal-mist dark:bg-signal-teal/10 text-signal-teal border border-signal-teal/30 capitalize">
                    {p.condition?.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">Age {p.age} · Ward {p.ward_id}</p>
                <div className="space-y-2">
                  <Link
                    to={`/patients/${p.id}/monitor`}
                    target="_blank"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-brand-500 to-signal-teal text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Video size={13} /> Open Camera <ExternalLink size={12} />
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to={`/patients/${p.id}/calibration`}
                      className="flex items-center justify-center gap-1 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <Settings size={12} /> Calibrate
                    </Link>
                    <Link
                      to={`/patients/${p.id}/setup-mappings`}
                      className="flex items-center justify-center gap-1 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <TrendingUp size={12} /> Mappings
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Activity History Table ── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="section-title">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {["Bed", "Patient", "Need", "Time", "Status"].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {historyRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">No activity yet today.</td>
                </tr>
              ) : (
                historyRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="table-cell font-mono text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded m-2">{r.bedNumber}</td>
                    <td className="table-cell font-medium text-slate-900 dark:text-slate-100">{r.patientName}</td>
                    <td className="table-cell"><NeedBadge need={r.need} size="sm" /></td>
                    <td className="table-cell text-xs text-slate-400">
                      {r.timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </td>
                    <td className="table-cell"><StatusBadge status={r.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;
