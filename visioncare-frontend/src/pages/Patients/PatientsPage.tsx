import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { patientsApi } from "../../services/api";
import { Patient } from "../../types";
import { Users, Search, Video, Settings, TrendingUp, Trash2, RefreshCw, UserPlus } from "lucide-react";
import { ConditionBadge } from "../../components/UI/Badge";

export const PatientsPage: React.FC = () => {
  const [patients,  setPatients]  = useState<Patient[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [search,    setSearch]    = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await patientsApi.list();
      setPatients(res.data ?? []);
      setError(null);
    } catch {
      setError("Failed to load patients. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDischarge = async (id: string) => {
    if (!window.confirm("Discharge this patient? This cannot be undone.")) return;
    try {
      await patientsApi.discharge(id);
      load();
    } catch {
      setError("Failed to discharge patient.");
    }
  };

  const filtered = patients.filter((p) =>
    search === "" ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    (p.bed_number ?? p.bedNumber)?.toLowerCase().includes(search.toLowerCase()) ||
    (p.ward_id ?? p.wardId)?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">Patients</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{patients.length} total registered patients</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="btn-secondary"><RefreshCw size={15} /></button>
          <Link to="/add-patient" className="btn-primary">
            <UserPlus size={15} />
            Add Patient
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, bed, or ward…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {["Patient ID", "Name", "Age", "Bed / Room", "Ward", "Condition", "Status", "Actions"].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="table-cell">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <Users size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-slate-400 text-sm">
                      {search ? "No patients match your search." : "No patients registered yet."}
                    </p>
                    {!search && (
                      <Link to="/add-patient" className="mt-2 inline-block text-brand-500 hover:underline text-sm font-medium">
                        Register first patient →
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="table-cell">
                      <span className="font-mono text-xs text-slate-400">{p.id?.substring(0, 8)}…</span>
                    </td>
                    <td className="table-cell font-semibold text-slate-900 dark:text-slate-100">{p.name}</td>
                    <td className="table-cell">{p.age}</td>
                    <td className="table-cell">
                      <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {p.bed_number ?? p.bedNumber ?? "—"}
                      </span>
                    </td>
                    <td className="table-cell text-slate-500">{p.ward_id ?? p.wardId}</td>
                    <td className="table-cell">
                      <ConditionBadge condition={p.condition} />
                    </td>
                    <td className="table-cell">
                      {(p.is_active ?? p.isActive) ? (
                        <span className="badge bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-500">Inactive</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/patients/${p.id}/monitor`}
                          target="_blank"
                          title="Open camera"
                          className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
                        >
                          <Video size={13} />
                        </Link>
                        <Link
                          to={`/patients/${p.id}/calibration`}
                          title="Calibrate"
                          className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
                        >
                          <Settings size={13} />
                        </Link>
                        <Link
                          to={`/patients/${p.id}/setup-mappings`}
                          title="Gesture mappings"
                          className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                        >
                          <TrendingUp size={13} />
                        </Link>
                        <button
                          onClick={() => handleDischarge(p.id)}
                          title="Discharge patient"
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400">
            <span>Showing {filtered.length} of {patients.length} patients</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientsPage;
