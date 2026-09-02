import React, { useEffect, useState } from "react";
import { detectionsApi } from "../../services/api";
import { PatientRequest } from "../../types";
import { Activity, Search, Download, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { NeedBadge, StatusBadge, GestureBadge } from "../../components/UI/Badge";

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

const PAGE_SIZE = 15;

export const DetectionsPage: React.FC = () => {
  const [records,  setRecords]  = useState<PatientRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("all");
  const [page,     setPage]     = useState(1);

  useEffect(() => {
    setLoading(true);
    detectionsApi.listRecent("", 100)
      .then((res) => { setRecords((res.data ?? []).map(mapRaw)); setError(null); })
      .catch(() => setError("Failed to load detections. Check backend connection."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = records.filter((r) => {
    const matchSearch = search === "" || r.patientName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === "all" || r.status === status;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    const header = ["Date", "Time", "Patient", "Bed", "Gesture", "Need", "Confidence", "Status"].join(",");
    const rows   = filtered.map((r) =>
      [
        r.timestamp.toLocaleDateString(),
        r.timestamp.toLocaleTimeString(),
        r.patientName,
        r.bedNumber,
        r.gestureType ?? "",
        r.need,
        Math.round(r.confidence * 100) + "%",
        r.status,
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `detections-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">Detection Records</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{filtered.length} total records</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary">
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-400 text-sm">{error}</div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search patient name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400" />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="select-field min-w-36"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="false_positive">False Positive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {["Date", "Time", "Patient", "Bed", "Gesture", "Need", "Confidence", "Alert Status"].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="table-cell"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <Activity size={28} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-slate-400 text-sm">No detection records found.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="table-cell text-xs text-slate-500">{r.timestamp.toLocaleDateString()}</td>
                    <td className="table-cell text-xs font-mono text-slate-500">
                      {r.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="table-cell font-semibold text-slate-900 dark:text-slate-100">{r.patientName}</td>
                    <td className="table-cell">
                      <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{r.bedNumber}</span>
                    </td>
                    <td className="table-cell">
                      {r.gestureType ? <GestureBadge gesture={r.gestureType} /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="table-cell">
                      {r.need ? <NeedBadge need={r.need} size="sm" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.round(r.confidence * 100)}%` }} />
                        </div>
                        <span className="text-xs font-mono text-slate-500">{Math.round(r.confidence * 100)}%</span>
                      </div>
                    </td>
                    <td className="table-cell"><StatusBadge status={r.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Page {page} of {totalPages} · {filtered.length} records
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost p-1.5 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page - 2 + i;
                if (pg > totalPages) return null;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      pg === page
                        ? "bg-brand-500 text-white"
                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-ghost p-1.5 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetectionsPage;
