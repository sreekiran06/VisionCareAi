import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Camera, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { Badge, statusVariant } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Pagination } from '../components/ui/Pagination';
import { useToast } from '../hooks/useToast';
import { ToastStack } from '../components/ui/Toast';
import { camerasApi } from '../services/adminApi';
import type { Camera as CameraType, CameraCreate } from '../types/admin.types';

const emptyForm: CameraCreate = { hospital_id: '', ward: '', bed_number: '', ip_address: '', patient_id: '', patient_name: '' };
const PAGE_SIZE = 12;

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'online')       return <Wifi size={14} className="text-emerald-400" />;
  if (status === 'offline')      return <WifiOff size={14} className="text-amber-400" />;
  return <AlertCircle size={14} className="text-rose-400" />;
};

export const CamerasPage: React.FC = () => {
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState<'table' | 'grid'>('table');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CameraType | null>(null);
  const [form, setForm] = useState<CameraCreate>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CameraType | null>(null);

  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await camerasApi.list({ status: statusFilter || undefined, skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE });
      setCameras(data);
      setTotal(data.length < PAGE_SIZE ? (page - 1) * PAGE_SIZE + data.length : page * PAGE_SIZE + 1);
    } catch { toast.error('Failed to load cameras'); }
    finally { setLoading(false); }
  }, [statusFilter, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      if (editing) { await camerasApi.update(editing.id, form); toast.success('Camera updated'); }
      else         { await camerasApi.create(form);             toast.success('Camera added'); }
      setShowForm(false); load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const doRestart = async (cam: CameraType) => {
    try { await camerasApi.restart(cam.id); toast.success('Restart initiated'); load(); }
    catch { toast.error('Restart failed'); }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try { await camerasApi.delete(deleteTarget.id); toast.success('Camera removed'); load(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleteTarget(null); }
  };

  const f = (k: keyof CameraCreate, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const columns = [
    { key: 'id',       header: 'Camera ID', render: (c: CameraType) => <span className="font-mono text-xs text-slate-400">{c.id.slice(0, 8)}…</span> },
    { key: 'hospital', header: 'Hospital',  render: (c: CameraType) => c.hospital_id },
    { key: 'ward',     header: 'Ward'    },
    { key: 'bed_number', header: 'Bed'   },
    { key: 'patient_name', header: 'Patient', render: (c: CameraType) => c.patient_name ?? '—' },
    { key: 'ip_address',   header: 'IP',       render: (c: CameraType) => <span className="font-mono text-xs">{c.ip_address ?? '—'}</span> },
    { key: 'status', header: 'Status', render: (c: CameraType) => (
      <div className="flex items-center gap-1.5">
        <StatusIcon status={c.status} />
        <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
      </div>
    )},
    { key: 'fps',             header: 'FPS',     render: (c: CameraType) => `${c.fps.toFixed(1)}` },
    { key: 'network_latency', header: 'Latency', render: (c: CameraType) => `${c.network_latency.toFixed(0)}ms` },
    { key: 'health_status',   header: 'Health',  render: (c: CameraType) => <Badge variant={statusVariant(c.health_status)}>{c.health_status}</Badge> },
    { key: 'actions', header: 'Actions', render: (c: CameraType) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setEditing(c); setForm({ ...c, patient_id: c.patient_id ?? '', patient_name: c.patient_name ?? '' }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-blue-400 transition-colors"><Pencil size={14} /></button>
        <button onClick={() => doRestart(c)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-amber-400 transition-colors"><RefreshCw size={14} /></button>
        <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  // Summary counts
  const online  = cameras.filter((c) => c.status === 'online').length;
  const offline = cameras.filter((c) => c.status === 'offline').length;
  const disc    = cameras.filter((c) => c.status === 'disconnected').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Camera Management</h1>
          <div className="flex gap-4 mt-1 text-sm">
            <span className="text-emerald-400">● {online} Online</span>
            <span className="text-amber-400">● {offline} Offline</span>
            <span className="text-rose-400">● {disc} Disconnected</span>
          </div>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
          <Plus size={16} /> Add Camera
        </button>
      </div>

      <div className="flex gap-3">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
          <option value="">All Statuses</option>
          {['online','offline','disconnected'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex rounded-xl border border-white/10 overflow-hidden">
          {(['table','grid'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-medium transition-colors
                ${view === v ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>{v}</button>
          ))}
        </div>
      </div>

      {view === 'table' ? (
        <div className="rounded-2xl bg-white/3 border border-white/10 overflow-hidden">
          <DataTable columns={columns} data={cameras} keyExtractor={(c) => c.id} loading={loading} emptyMessage="No cameras found" />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />
          )) : cameras.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white/3 border border-white/10 p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <Camera size={18} className="text-slate-400" />
                <Badge variant={statusVariant(c.status)} dot>{c.status}</Badge>
              </div>
              <p className="font-semibold text-white text-sm truncate">Ward: {c.ward} | Bed: {c.bed_number}</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{c.patient_name ?? 'No patient'}</p>
              <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs text-slate-500">
                <span>{c.fps.toFixed(1)} fps</span>
                <span>{c.network_latency.toFixed(0)} ms</span>
              </div>
              <div className="flex gap-1 mt-2">
                <button onClick={() => doRestart(c)} className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/10 text-amber-400 text-xs transition-colors">Restart</button>
                <button onClick={() => setDeleteTarget(c)} className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 text-rose-400 text-xs transition-colors">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Camera' : 'Add Camera'} size="md"
        footer={<>
          <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm transition-colors">Cancel</button>
          <button onClick={save} disabled={saving} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : editing ? 'Update' : 'Add'}
          </button>
        </>}
      >
        <div className="space-y-4">
          {(['hospital_id','ward','bed_number','ip_address','patient_id','patient_name'] as const).map((k) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{k.replace(/_/g,' ')}</label>
              <input value={form[k] ?? ''} onChange={(e) => f(k, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
            </div>
          ))}
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} danger title="Remove Camera"
        message={`Remove camera in Ward ${deleteTarget?.ward}, Bed ${deleteTarget?.bed_number}?`} confirmLabel="Remove"
        onConfirm={doDelete} onCancel={() => setDeleteTarget(null)} />

      <ToastStack toasts={toast.toasts} dismiss={toast.dismiss} />
    </div>
  );
};
