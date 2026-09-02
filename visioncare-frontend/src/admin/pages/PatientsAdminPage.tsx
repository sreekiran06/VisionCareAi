import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, LogOut } from 'lucide-react';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Pagination } from '../components/ui/Pagination';
import { useToast } from '../hooks/useToast';
import { ToastStack } from '../components/ui/Toast';
import { patientsAdminApi } from '../services/adminApi';
import type { AdminPatient } from '../types/admin.types';

const CONDITIONS = ['stroke','als','paralysis','post_surgery','elderly','other'];
const PAGE_SIZE  = 12;

const emptyForm = {
  name: '', age: 30, bed_number: '', ward_id: '', hospital_id: '',
  condition: 'elderly', notes: '',
};

export const PatientsAdminPage: React.FC = () => {
  const [patients, setPatients] = useState<AdminPatient[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [search, setSearch]     = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<AdminPatient | null>(null);
  const [form, setForm]         = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminPatient | null>(null);

  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await patientsAdminApi.list({ search: search || undefined, skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE });
      setPatients(data);
      setTotal(data.length < PAGE_SIZE ? (page - 1) * PAGE_SIZE + data.length : page * PAGE_SIZE + 1);
    } catch { toast.error('Failed to load patients'); }
    finally { setLoading(false); }
  }, [search, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      if (editing) { await patientsAdminApi.update(editing.id, form as Partial<AdminPatient>); toast.success('Patient updated'); }
      else         { await patientsAdminApi.create(form as Partial<AdminPatient>);              toast.success('Patient added'); }
      setShowForm(false); load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try { await patientsAdminApi.delete(deleteTarget.id); toast.success('Patient removed'); load(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleteTarget(null); }
  };

  const doDischarge = async (p: AdminPatient) => {
    try { await patientsAdminApi.discharge(p.id); toast.success(`${p.name} discharged`); load(); }
    catch { toast.error('Discharge failed'); }
  };

  const f = (k: string, v: string | number) => setForm((prev) => ({ ...prev, [k]: v }));

  const columns = [
    { key: 'name', header: 'Patient', render: (p: AdminPatient) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
          {p.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-white text-sm">{p.name}</p>
          <p className="text-xs text-slate-500">Age {p.age}</p>
        </div>
      </div>
    )},
    { key: 'ward_id',     header: 'Ward'     },
    { key: 'bed_number',  header: 'Bed'      },
    { key: 'hospital_id', header: 'Hospital' },
    { key: 'condition',   header: 'Condition', render: (p: AdminPatient) => (
      <span className="px-2 py-0.5 bg-white/5 rounded-lg text-xs text-slate-300">{p.condition}</span>
    )},
    { key: 'is_active', header: 'Status', render: (p: AdminPatient) => (
      <Badge variant={p.is_active ? 'success' : 'muted'} dot>{p.is_active ? 'Active' : 'Discharged'}</Badge>
    )},
    { key: 'created_at', header: 'Admitted', render: (p: AdminPatient) => new Date(p.created_at).toLocaleDateString() },
    { key: 'actions',    header: 'Actions',  render: (p: AdminPatient) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setEditing(p); setForm({ name: p.name, age: p.age, bed_number: p.bed_number, ward_id: p.ward_id, hospital_id: p.hospital_id, condition: p.condition, notes: p.notes ?? '' }); setShowForm(true); }}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-blue-400 transition-colors"><Pencil size={14} /></button>
        {p.is_active && (
          <button onClick={() => doDischarge(p)} title="Discharge"
            className="p-1.5 rounded-lg hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 transition-colors"><LogOut size={14} /></button>
        )}
        <button onClick={() => setDeleteTarget(p)}
          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Patient Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Admin view across all hospitals</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
          <Plus size={16} /> Add Patient
        </button>
      </div>

      <input type="search" placeholder="Search patients…" value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50" />

      <div className="rounded-2xl bg-white/3 border border-white/10 overflow-hidden">
        <DataTable columns={columns} data={patients} keyExtractor={(p) => p.id} loading={loading} emptyMessage="No patients found" />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Patient' : 'Add Patient'} size="lg"
        footer={<>
          <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm transition-colors">Cancel</button>
          <button onClick={save} disabled={saving} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : editing ? 'Update' : 'Add'}
          </button>
        </>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[['name','Name *','text'],['age','Age','number'],['bed_number','Bed Number','text'],
            ['ward_id','Ward ID','text'],['hospital_id','Hospital ID','text']].map(([k,l,t]) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{l}</label>
              <input type={t} value={String((form as Record<string,unknown>)[k] ?? '')}
                onChange={(e) => f(k, t === 'number' ? Number(e.target.value) : e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Condition</label>
            <select value={form.condition} onChange={(e) => f('condition', e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
              {CONDITIONS.map((c) => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => f('notes', e.target.value)} rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} danger title="Remove Patient"
        message={`Remove patient "${deleteTarget?.name}" permanently?`} confirmLabel="Remove"
        onConfirm={doDelete} onCancel={() => setDeleteTarget(null)} />

      <ToastStack toasts={toast.toasts} dismiss={toast.dismiss} />
    </div>
  );
};
