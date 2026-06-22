'use client';
import { useState, useCallback, useEffect } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';

const ACTION_STYLES: Record<string, string> = {
  CLUB_PLAN_CHANGED:      'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  CLUB_TRIAL_EXTENDED:    'bg-blue-500/15 text-blue-300 border-blue-500/25',
  CLUB_SUSPENDED:         'bg-red-500/15 text-red-300 border-red-500/25',
  CLUB_UNLOCKED:          'bg-green-500/15 text-green-300 border-green-500/25',
  CLUB_MODULES_UPDATED:   'bg-purple-500/15 text-purple-300 border-purple-500/25',
  CLUB_IMPERSONATED:      'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
  IMPERSONATE:            'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
  ADMIN_USER_CREATED:     'bg-teal-500/15 text-teal-300 border-teal-500/25',
  ADMIN_USER_UPDATED:     'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  ADMIN_LOGIN:            'bg-gray-500/15 text-gray-400 border-gray-500/25',
  BILLING_RECORDED:       'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  RESET_PASSWORD_SENT:    'bg-orange-500/15 text-orange-300 border-orange-500/25',
  CHANGE_EMAIL:           'bg-sky-500/15 text-sky-300 border-sky-500/25',
  PAYMENT_REMINDER_SENT:  'bg-pink-500/15 text-pink-300 border-pink-500/25',
  CLUB_DELETED:           'bg-red-700/15 text-red-400 border-red-700/25',
  DEMO_SEEDED:            'bg-violet-500/15 text-violet-300 border-violet-500/25',
};

const ACTION_LABELS: Record<string, string> = {
  CLUB_PLAN_CHANGED:      'Plan cambiado',
  CLUB_TRIAL_EXTENDED:    'Trial extendido',
  CLUB_SUSPENDED:         'Club suspendido',
  CLUB_UNLOCKED:          'Club reactivado',
  CLUB_MODULES_UPDATED:   'Módulos actualizados',
  CLUB_IMPERSONATED:      'Impersonación',
  IMPERSONATE:            'Impersonación',
  ADMIN_USER_CREATED:     'Admin creado',
  ADMIN_USER_UPDATED:     'Admin actualizado',
  ADMIN_LOGIN:            'Login admin',
  BILLING_RECORDED:       'Pago registrado',
  RESET_PASSWORD_SENT:    'Contraseña restablecida',
  CHANGE_EMAIL:           'Email cambiado',
  PAYMENT_REMINDER_SENT:  'Recordatorio enviado',
  CLUB_DELETED:           'Club eliminado',
  DEMO_SEEDED:            'Demo sembrado',
};

const ALL_ACTIONS = Object.keys(ACTION_LABELS);

interface Log {
  id: string;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  created_at: string;
}

export function AuditLogsTable() {
  const [logs, setLogs]           = useState<Log[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [actionFilter, setAction] = useState('');
  const [emailFilter, setEmail]   = useState('');
  const [clubFilter, setClub]     = useState('');

  const fetch_ = useCallback(async (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (actionFilter) params.set('action', actionFilter);
    if (emailFilter)  params.set('admin_email', emailFilter);
    if (clubFilter)   params.set('entity_id', clubFilter);
    const res  = await fetch(`/api/audit-logs?${params}`);
    const json = await res.json();
    setLogs(json.logs || []);
    setTotal(json.total || 0);
    setLoading(false);
  }, [page, actionFilter, emailFilter, clubFilter]);

  useEffect(() => { fetch_(1); setPage(1); }, [actionFilter, emailFilter, clubFilter]);
  useEffect(() => { fetch_(page); }, [page]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <Input placeholder="Club o slug..." value={clubFilter}
            onChange={e => setClub(e.target.value)}
            className="pl-8 h-8 bg-white/5 border-white/10 text-white placeholder:text-gray-600 text-sm" />
        </div>
        <div className="relative min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <Input placeholder="Admin email..." value={emailFilter}
            onChange={e => setEmail(e.target.value)}
            className="pl-8 h-8 bg-white/5 border-white/10 text-white placeholder:text-gray-600 text-sm" />
        </div>
        <select
          value={actionFilter}
          onChange={e => setAction(e.target.value)}
          className="h-8 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-300 px-3 focus:outline-none focus:border-indigo-500/40"
        >
          <option value="">Todas las acciones</option>
          {ALL_ACTIONS.map(a => (
            <option key={a} value={a}>{ACTION_LABELS[a]}</option>
          ))}
        </select>
        <button onClick={() => fetch_(page)}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <span className="text-xs text-gray-600 ml-auto">{total} eventos</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/8 overflow-x-auto">
        <table className="w-full min-w-[500px] text-sm">
          <thead className="bg-white/3 border-b border-white/8">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Admin</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Club</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Cambio</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-600 text-sm">
                  {loading ? 'Cargando...' : 'No hay eventos que coincidan con el filtro'}
                </td>
              </tr>
            ) : logs.map(log => {
              const style = ACTION_STYLES[log.action] ?? 'bg-gray-500/15 text-gray-400 border-gray-500/25';
              const label = ACTION_LABELS[log.action] ?? log.action;
              return (
                <tr key={log.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-md border whitespace-nowrap ${style}`}>{label}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-[140px] truncate hidden md:table-cell">{log.admin_email}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs font-mono">{log.entity_id ?? '—'}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex flex-col gap-1 text-xs font-mono max-w-[200px]">
                      {log.before_state && (
                        <span className="text-red-400/70 truncate" title={JSON.stringify(log.before_state)}>
                          - {JSON.stringify(log.before_state)}
                        </span>
                      )}
                      {log.after_state && (
                        <span className="text-green-400/70 truncate" title={JSON.stringify(log.after_state)}>
                          + {JSON.stringify(log.after_state)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{formatDate(log.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="h-7 w-7 flex items-center justify-center rounded border border-white/10 hover:bg-white/5 disabled:opacity-30">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="h-7 w-7 flex items-center justify-center rounded border border-white/10 hover:bg-white/5 disabled:opacity-30">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
