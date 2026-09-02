import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter } from 'lucide-react';
import { DataTable } from '../components/ui/DataTable';
import { Badge, statusVariant } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import { useToast } from '../hooks/useToast';
import { ToastStack } from '../components/ui/Toast';
import { auditApi } from '../services/adminApi';
import type { AuditLog } from '../types/admin.types';

const PAGE_SIZE = 20;

const ACTION_ICONS: Record<string, string> = {
  user_login:          '🔐',
  patient_added:       '🏥',
  patient_deleted:     '🗑️',
  patient_discharged:  '✅',
  camera_added:        '📷',
  camera_removed:      '❌',
  camera_restarted:    '🔄',
  alert_generated:     '🚨',
  alert_acknowledged:  '👁️',
  alert_resolved:      '✔️',
  hospital_created:    '🏨',
  hospital_deleted:    '🗑️',
  hospital_updated:    '✏️',
  user_created:        '👤',
  user_deleted:        '👤',
  user_activated:      '✅',
  user_deactivated:    '🚫',
  password_reset:      '🔑',
  role_changed:        '👑',
};

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs]         = useState<AuditLog[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [search, setSearch]     = useState('');
  const [action, setAction]     = useState('');
  const [entityType, setEntity] = useState('');

  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await auditApi.list({
        search: search || undefined,
        action: action || undefined,
        entity_type: entityType || undefined,
        skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE,
      });
      setLogs(data);
      setTotal(data.length < PAGE_SIZE ? (page - 1) * PAGE_SIZE + data.length : page * PAGE_SIZE + 1);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  }, [search, action, entityType, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const fmt = (s: string) => new Date(s).toLocaleString();

  const columns = [
    { key: 'created_at', header: 'Timestamp', render: (l: AuditLog) => (
      <span className="font-mono text-xs text-slate-400">{fmt(l.created_at)}</span>
    )},
    { key: 'user_name', header: 'User', render: (l: AuditLog) => (
      <div>
        <p className="text-sm font-medium text-slate-200">{l.user_name ?? '—'}</p>
        <p className="text-xs text-slate-500">{l.user_email ?? ''}</p>
      </div>
    )},
    { key: 'action', header: 'Action', render: (l: AuditLog) => (
      <div className="flex items-center gap-2">
        <span className="text-base">{ACTION_ICONS[l.action] ?? '📋'}</span>
        <span className="text-sm text-slate-200 font-medium">{l.action.replace(/_/g, ' ')}</span>
      </div>
    )},
    { key: 'entity_type', header: 'Entity',  render: (l: AuditLog) => l.entity_type ? <Badge variant="muted">{l.entity_type}</Badge> : <span className="text-slate-600">—</span> },
    { key: 'entity_id',   header: 'Entity ID', render: (l: AuditLog) => <span className="font-mono text-xs text-slate-500">{l.entity_id ? l.entity_id.slice(0, 12) + '…' : '—'}</span> },
    { key: 'ip_address',  header: 'IP',        render: (l: AuditLog) => <span className="font-mono text-xs text-slate-500">{l.ip_address ?? '—'}</span> },
    { key: 'detail',      header: 'Detail',    render: (l: AuditLog) => (
      l.detail && Object.keys(l.detail).length > 0
        ? <span className="text-xs text-slate-500 truncate max-w-xs block">{JSON.stringify(l.detail)}</span>
        : <span className="text-slate-700">—</span>
    )},
  ];

  const ENTITY_TYPES = ['user','patient','camera','alert','hospital'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-0.5">Immutable record of every system action</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="search" placeholder="Search user, action…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
        </div>
        <input placeholder="Filter by action…" value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
        <select value={entityType} onChange={(e) => { setEntity(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
          <option value="">All Entities</option>
          {ENTITY_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="rounded-2xl bg-white/3 border border-white/10 overflow-hidden">
        <DataTable columns={columns} data={logs} keyExtractor={(l) => l.id} loading={loading} emptyMessage="No audit logs found" />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>

      <ToastStack toasts={toast.toasts} dismiss={toast.dismiss} />
    </div>
  );
};
