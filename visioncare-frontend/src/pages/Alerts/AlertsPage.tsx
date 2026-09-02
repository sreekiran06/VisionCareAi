import React, { useEffect, useMemo, useState } from "react";
import { detectionsApi } from "../../services/api";
import { PatientRequest } from "../../types";
import { Bell, AlertTriangle, CheckCircle, Clock, Filter, Search, Wifi } from "lucide-react";
import { NeedBadge, StatusBadge, GestureBadge, RiskBadge } from "../../components/UI/Badge";

function mapRaw(raw: any): PatientRequest {
  return {
    id:             raw.id,
    patientId:      raw.patient_id,
    patientName:    raw.patient_name,
    bedNumber:      raw.bed_number,
    need:           raw.need_type ?? raw.need,
    gestureType:    raw.gesture_type,
    confidence:     raw.confidence,
    timestamp:      new Date(raw.timestamp ?? raw.created_at),
    status:         raw.status ?? "pending",
    acknowledgedBy: raw.acknowledged_by,
    responseTimeMs: raw.response_time_ms,
  };
}

export const AlertsPage: React.FC = () => {
  const [records,  setRecords]  = useState<PatientRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [search,   setSearch]   = useState("");
  const [severity, setSeverity] = useState("all");

  useEffect(() => {
    setLoading(true);
    detectionsApi.listRecent("", 100)
      .then((res) => { setRecords((res.data ?? []).map(mapRaw)); setError(null); })
      .catch(() => setError("Failed to load alerts. Check backend connection."))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    critical:  records.filter((r) => (r.need === "emergency" || r.need === "pain") && r.status === "pending").length,
    warning:   records.filter((r) => r.status === "pending" && r.need !== "emergency" && r.need !== "pain").length,
    resolved:  records.filter((r) => r.status === "completed").length,
    pending:   records.filter((r) => r.status === "pending").length,
  }), [records]);

  const getRisk = (r: PatientRequest): "critical" | "high" | "medium" | "low" => {
    if (r.need === "emergency" || r.need === "pain") return "critical";
    if (r.confidence > 0.85) return "high";
    if (r.confidence > 0.65) return "medium";
    return "low";
  };

  const filtered = records.filter((r) => {
    const matchSearch   = search === "" || r.patientName?.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severity === "all"
      || (severity === "critical" && (r.need === "emergency" || r.need === "pain"))
      || (severity === "warning"  && r.need !== "emergency" && r.need !== "pain")
      || (severity === "resolved" && r.status === "completed")
      || (severity === "pending"  && r.status === "pending");
    return matchSearch && matchSeverity;
  });

  const summaryCards = [
    { label: "Critical",  value: stats.critical, icon: <AlertTriangle size={20} />, color: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400", iconBg: "bg-rose-100 dark:bg-rose-900/30" },
    { label: "Warning",   value: stats.warning,  icon: <Bell size={20} />,          color: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400", iconBg: "bg-amber-100 dark:bg-amber-900/30" },
    { label: "Resolved",  value: stats.resolved, icon: <CheckCircle size={20} />,   color: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-900/30" },
    { label: "Pending",   value: stats.pending,  icon: <Clock size={20} />,         color: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400",   iconBg: "bg-slate-100 dark:bg-slate-700" },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">Alerts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Alert management and response tracking</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-400 text-sm">{error}</div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <div
            key={c.label}
            onClick={() => setSeverity(c.label.toLowerCase())}
            className={`card border p-5 cursor-pointer transition-all duration-200 hover:shadow-card-hover ${c.color} ${severity === c.label.toLowerCase() ? "ring-2 ring-offset-2 ring-brand-400 dark:ring-offset-slate-950" : ""}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.iconBg}`}>
              {c.icon}
            </div>
            <p className="text-2xl font-display font-bold">{c.value}</p>
            <p className="text-sm font-medium mt-0.5">{c.label} Alerts</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search patient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400" />
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="select-field min-w-36">
            <option value="all">All Alerts</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="resolved">Resolved</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <button onClick={() => setSeverity("all")} className="btn-ghost text-xs">
          Clear filters
        </button>
      </div>

      {/* Alerts Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {["Patient", "Bed", "Alert Type", "Gesture", "Severity", "Confidence", "Time", "Notified", "Status"].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 9 }).map((__, j) => (
                    <td key={j} className="table-cell"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <Bell size={28} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-slate-400 text-sm">No alerts found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const risk = getRisk(r);
                  return (
                    <tr key={r.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${risk === "critical" ? "bg-rose-50/30 dark:bg-rose-900/5" : ""}`}>
                      <td className="table-cell font-semibold text-slate-900 dark:text-slate-100">{r.patientName}</td>
                      <td className="table-cell">
                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{r.bedNumber}</span>
                      </td>
                      <td className="table-cell">{r.need && <NeedBadge need={r.need} size="sm" />}</td>
                      <td className="table-cell">
                        {r.gestureType ? <GestureBadge gesture={r.gestureType} /> : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="table-cell"><RiskBadge risk={risk} /></td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.round(r.confidence * 100)}%` }} />
                          </div>
                          <span className="text-xs font-mono text-slate-500">{Math.round(r.confidence * 100)}%</span>
                        </div>
                      </td>
                      <td className="table-cell text-xs text-slate-400">
                        {r.timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </td>
                      <td className="table-cell">
                        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <Wifi size={12} /> WebSocket
                        </span>
                      </td>
                      <td className="table-cell"><StatusBadge status={r.status} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;
