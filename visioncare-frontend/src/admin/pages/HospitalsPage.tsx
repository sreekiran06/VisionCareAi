import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Building2 } from 'lucide-react';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { Badge, statusVariant } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Pagination } from '../components/ui/Pagination';
import { useToast } from '../hooks/useToast';
import { ToastStack } from '../components/ui/Toast';
import { hospitalsApi } from '../services/adminApi';
import type { Hospital, HospitalCreate, LicenseType, HospitalStatus, SubscriptionStatus } from '../types/admin.types';

const empty: HospitalCreate = {
  name: '', address: '', contact_person: '', phone: '', email: '',
  license_type: 'basic', subscription_status: 'active',
  subscription_expiry: '', max_cameras: 10, status: 'active',
};

const PAGE_SIZE = 10;

export const HospitalsPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);

  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<Hospital | null>(null);
  const [form, setForm]           = useState<HospitalCreate>(empty);
  const [saving, setSaving]       = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Hospital | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await hospitalsApi.list({ search: search || undefined, skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE });
      setHospitals(data);
      setTotal(data.length < PAGE_SIZE ? (page - 1) * PAGE_SIZE + data.length : page * PAGE_SIZE + 1);
    } catch { toast.error('Failed to load hospitals'); }
    finally { setLoading(false); }
  }, [search, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(empty); setShowForm(true); };
  const openEdit   = (h: Hospital) => { setEditing(h); setForm({ ...h }); setShowForm(true); };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) { await hospitalsApi.update(editing.id, form); toast.success('Hospital updated'); }
      else         { await hospitalsApi.create(form);             toast.success('Hospital created'); }
      setShowForm(false); load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try { await hospitalsApi.delete(deleteTarget.id); toast.success('Hospital deleted'); load(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleteTarget(null); }
  };

  const toggleStatus = async (h: Hospital) => {
    try { await hospitalsApi.toggle(h.id); toast.success('Status updated'); load(); }
    catch { toast.error('Toggle failed'); }
  };

  const f = (k: keyof HospitalCreate, v: string | number) => setForm((p) => ({ ...p, [k]: v }));

  const columns = [
    { key: 'name',       header: 'Hospital',       render: (h: Hospital) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Building2 size={14} className="text-blue-400" />
        </div>
        <div>
          <p className="font-semibold text-white text-sm">{h.name}</p>
          <p className="text-xs text-slate-500">{h.email}</p>
        </div>
      </div>
    )},
    { key: 'contact_person', header: 'Contact' },
    { key: 'phone',          header: 'Phone' },
    { key: 'license_type',   header: 'License',   render: (h: Hospital) => <Badge variant={statusVariant(h.license_type)}>{h.license_type}</Badge> },
    { key: 'subscription_status', header: 'Subscription', render: (h: Hospital) => <Badge variant={statusVariant(h.subscription_status)} dot>{h.subscription_status}</Badge> },
    { key: 'current_cameras',    header: 'Cameras', render: (h: Hospital) => `${h.current_cameras}/${h.max_cameras}` },
    { key: 'current_patients',   header: 'Patients' },
    { key: 'status',  header: 'Status', render: (h: Hospital) => <Badge variant={statusVariant(h.status)} dot>{h.status}</Badge> },
    { key: 'actions', header: 'Actions', render: (h: Hospital) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(h)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-blue-400 transition-colors"><Pencil size={14} /></button>
        <button onClick={() => toggleStatus(h)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-amber-400 transition-colors">
          {h.status === 'active' ? <ToggleRight size={16} className="text-emerald-400" /> : <ToggleLeft size={16} />}
        </button>
        <button onClick={() => setDeleteTarget(h)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Hospital Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} hospitals registered</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
          <Plus size={16} /> Add Hospital
        </button>
      </div>

      {/* Search */}
      <input
        type="search" placeholder="Search hospitals…" value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
          text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
      />

      {/* Table */}
      <div className="rounded-2xl bg-white/3 border border-white/10 overflow-hidden">
        <DataTable columns={columns} data={hospitals} keyExtractor={(h) => h.id} loading={loading} emptyMessage="No hospitals found" />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>

      {/* Form modal */}
      <Modal
        open={showForm} onClose={() => setShowForm(false)}
        title={editing ? 'Edit Hospital' : 'Add Hospital'}
        size="lg"
        footer={<>
          <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm transition-colors">Cancel</button>
          <button onClick={save} disabled={saving} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
          </button>
        </>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Hospital Name *', key: 'name',           type: 'text'  },
            { label: 'Address',         key: 'address',        type: 'text'  },
            { label: 'Contact Person',  key: 'contact_person', type: 'text'  },
            { label: 'Phone',           key: 'phone',          type: 'text'  },
            { label: 'Email',           key: 'email',          type: 'email' },
            { label: 'Max Cameras',     key: 'max_cameras',    type: 'number'},
            { label: 'Subscription Expiry', key: 'subscription_expiry', type: 'date' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{label}</label>
              <input
                type={type}
                value={String((form as unknown as Record<string, unknown>)[key] ?? '')}
                onChange={(e) => f(key as keyof HospitalCreate, type === 'number' ? Number(e.target.value) : e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200
                  focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
          ))}
          {[
            { label: 'License Type', key: 'license_type', options: ['basic','professional','enterprise'] },
            { label: 'Subscription', key: 'subscription_status', options: ['active','expired','suspended'] },
            { label: 'Status',       key: 'status',              options: ['active','suspended'] },
          ].map(({ label, key, options }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{label}</label>
              <select
                value={String((form as unknown as Record<string, unknown>)[key] ?? '')}
                onChange={(e) => f(key as keyof HospitalCreate, e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200
                  focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              >
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} danger
        title="Delete Hospital"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={doDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ToastStack toasts={toast.toasts} dismiss={toast.dismiss} />
    </div>
  );
};
