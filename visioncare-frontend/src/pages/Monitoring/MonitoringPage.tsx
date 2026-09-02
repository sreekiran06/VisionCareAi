import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { patientsApi } from "../../services/api";
import { Patient } from "../../types";
import { Video, RefreshCw, Users, AlertCircle, Play, Eye } from "lucide-react";
import { ConditionBadge } from "../../components/UI/Badge";

export const MonitoringPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await patientsApi.list();
      setPatients(res.data ?? []);
      setError(null);
    } catch {
      setError("Failed to load patients for monitoring. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const activePatients = patients.filter((p) => p.is_active ?? p.isActive);

  return (
    <div className="p-6 space-y-6 animate-fade-in text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Live Monitoring</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage and view active patient cameras</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-4">
              <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      ) : activePatients.length === 0 ? (
        <div className="card p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Video size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold">No Active Monitoring Sessions</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              To begin live gesture tracking, select a registered patient and click "Open Bedside Camera".
            </p>
          </div>
          <div className="pt-2">
            <Link to="/patients" className="btn-primary">
              <Users size={16} />
              View Patients list
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePatients.map((p) => (
            <div
              key={p.id}
              className="card overflow-hidden group hover:shadow-card-hover hover:border-brand-300 dark:hover:border-brand-800 transition-all duration-200"
            >
              {/* Simulated Feed / Thumbnail */}
              <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                <Video size={36} className="text-slate-800 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Link
                    to={`/patients/${p.id}/monitor`}
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-glow transition-all active:scale-95"
                  >
                    <Play size={12} fill="white" />
                    Open Live Feed
                  </Link>
                </div>
                <div className="absolute top-3 left-3 bg-slate-900/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ONLINE
                </div>
                <span className="absolute bottom-3 right-3 font-mono text-[10px] text-white/70 bg-slate-900/50 px-1.5 rounded">
                  Bed {p.bed_number ?? p.bedNumber}
                </span>
              </div>

              {/* Patient Info */}
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-base">{p.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Age {p.age} · Ward {p.ward_id ?? p.wardId}
                    </p>
                  </div>
                  <ConditionBadge condition={p.condition} />
                </div>

                <div className="flex gap-2 pt-2">
                  <Link
                    to={`/patients/${p.id}/calibration`}
                    className="flex-1 text-center py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Calibrate
                  </Link>
                  <Link
                    to={`/patients/${p.id}/setup-mappings`}
                    className="flex-1 text-center py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Mappings
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonitoringPage;
