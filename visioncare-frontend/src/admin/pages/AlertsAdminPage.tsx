import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Clock, Filter, Download, Search } from 'lucide-react';
import { DataTable } from '../components/ui/DataTable';
import { Badge, statusVariant, severityVariant } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import { useToast } from '../hooks/useToast';
import { ToastStack } from '../components/ui/Toast';
import { alertsAdminApi } from '../services/adminApi';
import type { AdminAlert } from '../types/admin.types';

const PAGE_SIZE = 15;

export const AlertsAdminPage: React.FC = () => {
  const [alerts, setAlerts]       = useState<AdminAlert[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [search, setSearch]       = useState('');
  const [severity, setSeverity]   = useState('');
  const [status, setStatus]       = useState('');

  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await alertsAdminApi.list({
        search: search || undefined,
        severity: severity || undefined,
        status: status || undefined,
        skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE,
      });
      setAlerts(data);
      setTotal(data.length < PAGE_SIZE ? (page - 1) * PAGE_SIZE + data.length : page * PAGE_SIZE + 1);
    } catch { toast.error('Failed to load alerts'); }
    finally { setLoading(false); }
  }, [search, severity, status, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const acknowledge = async (id: string) => {
    try { await alertsAdminApi.acknowledge(id); toast.success('Alert acknowledged'); load(); }
    catch { toast.error('Failed to acknowledge'); }
  };

  const resolve = async (id: string) => {
    try { await alertsAdminApi.resolve(id); toast.success('Alert resolved'); load(); }
    catch { toast.error('Failed to resolve'); }
  };

  const exportCsv = async () => {
    try {
      const { data } = await alertsAdminApi.exportCsv({ severity: severity || undefined, status: status || undefined });
      const url = URL.createObjectURL(new Blob([data as BlobPart], { type: 'text/csv' }));
      const a = document.createElement('a'); a.href = url; a.download = 'alerts.csv'; a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch { toast.error('Export failed'); }
  };

  const fmt = (s: string) => new Date(s).toLocaleString();

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  const columns = [
    { key: 'created_at', header: 'Time', render: (a: AdminAlert) => (
      <span className="text-xs font-mono text-slate-400">{fmt(a.created_at)}</span>
    )},
    { key: 'patient_name',   header: 'Patient',  render: (a: AdminAlert) => a.patient_name  ?? '—' },
    { key: 'hospital_name',  header: 'Hospital', render: (a: AdminAlert) => a.hospital_name ?? '—' },
    { key: 'ward',           header: 'Ward',     render: (a: AdminAlert) => a.ward           ?? '—' },
    { key: 'alert_type',     header: 'Alert Type', render: (a: AdminAlert) => (
      <span className="px-2 py-0.5 rounded-md bg-white/5 text-xs font-medium text-slate-200">{a.alert_type.replace(/_/g,' ')}</span>
    )},
    { key: 'severity', header: 'Severity', render: (a: AdminAlert) => <Badge variant={severityVariant(a.severity)}>{a.severity}</Badge> },
    { key: 'status',   header: 'Status',   render: (a: AdminAlert) => <Badge variant={statusVariant(a.status)} dot>{a.status}</Badge>  },
    { key: 'assigned_nurse_name', header: 'Nurse', render: (a: AdminAlert) => a.assigned_nurse_name ?? '—' },
    { key: 'actions', header: 'Actions', render: (a: AdminAlert) => (
      <div className="flex items-center gap-1">
        {a.status === 'pending' && (
          <button onClick={() => acknowledge(a.id)} title="Acknowledge"
            className="p-1.5 rounded-lg hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 transition-colors">
            <Clock size={14} />
          </button>
        )}
        {a.status !== 'resolved' && (
          <button onClick={() => resolve(a.id)} title="Resolve"
            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 transition-colors">
            <CheckCircle size={14} />
          </button>
        )}
      </div>
    )},
  ];

  const critical = alerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Alert Management</h1>
          {critical > 0 && (
            <p className="text-sm text-rose-400 flex items-center gap-1 mt-0.5">
              <AlertTriangle size={14} /> {critical} critical alert{critical > 1 ? 's' : ''} require attention
            </p>
          )}
        </div>
        <button onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition-colors">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="search" placeholder="Search…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
        </div>
        {[
          { label: 'Severity', value: severity, onChange: setSeverity, options: ['low','medium','high','critical'] },
          { label: 'Status',   value: status,   onChange: setStatus,   options: ['pending','acknowledged','resolved'] },
        ].map(({ label, value, onChange, options }) => (
          <select key={label} value={value} onChange={(e) => { onChange(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
            <option value="">All {label}</option>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
      </div>

      <div className="rounded-2xl bg-white/3 border border-white/10 overflow-hidden">
        <DataTable columns={columns} data={alerts} keyExtractor={(a) => a.id} loading={loading} emptyMessage="No alerts found" />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>

      <ToastStack toasts={toast.toasts} dismiss={toast.dismiss} />
    </div>
  );
};
