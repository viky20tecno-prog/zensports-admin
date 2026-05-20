'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, ShieldCheck, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { AdminRole } from '@/types/admin';

const ROLES: AdminRole[] = ['super_admin', 'comercial', 'soporte', 'finanzas', 'ops'];
const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  comercial:   'Comercial',
  soporte:     'Soporte',
  finanzas:    'Finanzas',
  ops:         'Operaciones',
};
const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  comercial:   'bg-green-500/15 text-green-300 border-green-500/25',
  soporte:     'bg-blue-500/15 text-blue-300 border-blue-500/25',
  finanzas:    'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
  ops:         'bg-purple-500/15 text-purple-300 border-purple-500/25',
};

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

interface NewUserForm {
  email: string;
  name: string;
  role: AdminRole;
  password: string;
}

const EMPTY_FORM: NewUserForm = { email: '', name: '', role: 'soporte', password: '' };

export function AdminUsersPanel({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState<NewUserForm>(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin-users');
    const json = await res.json();
    setUsers(json.users || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch('/api/admin-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error || 'Error al crear'); return; }
    setShowForm(false);
    setForm(EMPTY_FORM);
    load();
  }

  async function toggleActive(user: AdminUser) {
    setToggling(user.id);
    await fetch(`/api/admin-users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !user.is_active }),
    });
    setToggling(null);
    load();
  }

  async function changeRole(user: AdminUser, role: AdminRole) {
    await fetch(`/api/admin-users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    load();
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{users.length} administradores</p>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Nuevo admin
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate}
          className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
          <h3 className="text-sm font-medium text-indigo-300">Nuevo administrador</h3>
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Nombre" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="h-8 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-gray-600 px-3 focus:outline-none focus:border-indigo-500/40" />
            <input required type="email" placeholder="Email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="h-8 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-gray-600 px-3 focus:outline-none focus:border-indigo-500/40" />
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as AdminRole }))}
              className="h-8 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-300 px-3 focus:outline-none focus:border-indigo-500/40">
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            <input required type="password" placeholder="Contraseña temporal" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="h-8 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-gray-600 px-3 focus:outline-none focus:border-indigo-500/40" />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowForm(false); setError(''); }}
              className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors">
              {saving && <Loader2 className="w-3 h-3 animate-spin" />} Crear
            </button>
          </div>
        </form>
      )}

      {/* Users table */}
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/3 border-b border-white/8">
            <tr>
              {['Admin', 'Rol', 'Último acceso', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-600 text-sm">Cargando...</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className={`transition-colors ${user.is_active ? 'hover:bg-white/3' : 'opacity-50'}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                      {user.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium flex items-center gap-1">
                        {user.name}
                        {user.id === currentUserId && (
                          <span title="Tú"><ShieldCheck className="w-3 h-3 text-indigo-400" /></span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {user.id === currentUserId ? (
                    <span className={`text-xs font-medium px-2 py-1 rounded-md border ${ROLE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  ) : (
                    <select value={user.role}
                      onChange={e => changeRole(user, e.target.value as AdminRole)}
                      className="text-xs rounded-md border border-white/10 bg-white/5 text-gray-300 px-2 py-1 focus:outline-none focus:border-indigo-500/40">
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {user.last_login_at ? formatDate(user.last_login_at) : 'Nunca'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    user.is_active ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-500'
                  }`}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.id !== currentUserId && (
                    <button onClick={() => toggleActive(user)} disabled={toggling === user.id}
                      title={user.is_active ? 'Desactivar acceso' : 'Reactivar acceso'}
                      className="text-gray-500 hover:text-gray-200 transition-colors disabled:opacity-40">
                      {toggling === user.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : user.is_active
                          ? <ToggleRight className="w-5 h-5 text-green-400" />
                          : <ToggleLeft className="w-5 h-5" />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
