import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, RotateCcw, UserCheck, UserX } from 'lucide-react';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { Badge, statusVariant } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Pagination } from '../components/ui/Pagination';
import { useToast } from '../hooks/useToast';
import { ToastStack } from '../components/ui/Toast';
import { usersApi } from '../services/adminApi';
import type { AdminUser, AdminUserCreate, UserRole } from '../types/admin.types';

const emptyForm: AdminUserCreate = {
  email: '', password: '', name: '', role: 'nurse', ward_id: 'ICU-1',
  hospital_id: '', phone: '',
};

const PAGE_SIZE = 10;
const ROLES: UserRole[] = ['super_admin', 'hospital_admin', 'doctor', 'nurse'];

export const UsersPage: React.FC = () => {
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRole]   = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<AdminUser | null>(null);
  const [form, setForm]         = useState<AdminUserCreate>(emptyForm);
  const [saving, setSaving]     = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [resetTarget, setResetTarget]   = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword]   = useState('');

  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await usersApi.list({
        search: search || undefined, role: roleFilter || undefined,
        skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE,
      });
      setUsers(data);
      setTotal(data.length < PAGE_SIZE ? (page - 1) * PAGE_SIZE + data.length : page * PAGE_SIZE + 1);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [search, roleFilter, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      if (editing) { await usersApi.update(editing.id, form); toast.success('User updated'); }
      else         { await usersApi.create(form);             toast.success('User created'); }
      setShowForm(false); load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try { await usersApi.delete(deleteTarget.id); toast.success('User deleted'); load(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleteTarget(null); }
  };

  const doResetPassword = async () => {
    if (!resetTarget || !newPassword) return;
    try { await usersApi.resetPassword(resetTarget.id, newPassword); toast.success('Password reset'); }
    catch { toast.error('Reset failed'); }
    finally { setResetTarget(null); setNewPassword(''); }
  };

  const toggleActive = async (u: AdminUser) => {
    try { await usersApi.toggleActive(u.id); toast.success('Status updated'); load(); }
    catch { toast.error('Toggle failed'); }
  };

  const f = (k: keyof AdminUserCreate, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const columns = [
    { key: 'name', header: 'User', render: (u: AdminUser) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
          {u.name[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-white text-sm">{u.name}</p>
          <p className="text-xs text-slate-500">{u.email}</p>
        </div>
      </div>
    )},
    { key: 'role',       header: 'Role',     render: (u: AdminUser) => <Badge variant={statusVariant(u.role)}>{u.role.replace('_', ' ')}</Badge> },
    { key: 'ward_id',    header: 'Ward'   },
    { key: 'hospital_id',header: 'Hospital', render: (u: AdminUser) => u.hospital_id ?? '—' },
    { key: 'phone',      header: 'Phone',    render: (u: AdminUser) => u.phone ?? '—' },
    { key: 'is_active',  header: 'Status',   render: (u: AdminUser) => <Badge variant={u.is_active ? 'success' : 'muted'} dot>{u.is_active ? 'Active' : 'Inactive'}</Badge> },
    { key: 'actions',    header: 'Actions',  render: (u: AdminUser) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setEditing(u); setForm({ ...u, password: '' }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-blue-400 transition-colors"><Pencil size={14} /></button>
        <button onClick={() => setResetTarget(u)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-amber-400 transition-colors"><RotateCcw size={14} /></button>
        <button onClick={() => toggleActive(u)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-teal-400 transition-colors">
          {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
        </button>
        <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Role-based access control</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="flex gap-3">
        <input type="search" placeholder="Search users…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 max-w-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
        <select value={roleFilter} onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
      </div>

      <div className="rounded-2xl bg-white/3 border border-white/10 overflow-hidden">
        <DataTable columns={columns} data={users} keyExtractor={(u) => u.id} loading={loading} emptyMessage="No users found" />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>

      {/* User Form */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit User' : 'Add User'} size="md"
        footer={<>
          <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm transition-colors">Cancel</button>
          <button onClick={save} disabled={saving} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
          </button>
        </>}
      >
        <div className="space-y-4">
          {(['name','email'] as const).map((k) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{k}</label>
              <input value={form[k]} onChange={(e) => f(k, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
            </div>
          ))}
          {!editing && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={(e) => f('password', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Role</label>
            <select value={form.role} onChange={(e) => f('role', e.target.value as UserRole)}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
              {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
          </div>
          {(['ward_id','hospital_id','phone'] as const).map((k) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{k.replace('_',' ')}</label>
              <input value={form[k] ?? ''} onChange={(e) => f(k, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
            </div>
          ))}
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title="Reset Password" size="sm"
        footer={<>
          <button onClick={() => setResetTarget(null)} className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm transition-colors">Cancel</button>
          <button onClick={doResetPassword} className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors">Reset</button>
        </>}
      >
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} danger title="Delete User"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`} confirmLabel="Delete"
        onConfirm={doDelete} onCancel={() => setDeleteTarget(null)} />

      <ToastStack toasts={toast.toasts} dismiss={toast.dismiss} />
    </div>
  );
};
