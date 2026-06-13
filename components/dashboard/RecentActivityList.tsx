'use client';
import { useState } from 'react';
import { formatRelative } from '@/lib/utils';
import { TrendingUp, Settings, Filter } from 'lucide-react';

interface AuditEntry {
  id: string;
  admin_email: string;
  action: string;
  entity_id: string | null;
  created_at: string;
}

const ACTION_LABEL: Record<string, string> = {
  ADMIN_LOGIN:           'Inicio de sesión',
  CLUB_PLAN_CHANGED:     'Plan cambiado',
  CLUB_TRIAL_EXTENDED:   'Trial extendido',
  CLUB_SUSPENDED:        'Club suspendido',
  CLUB_UNLOCKED:         'Club desbloqueado',
  CLUB_MODULES_UPDATED:  'Módulos actualizados',
  CLUB_IMPERSONATED:     'Impersonación',
  ADMIN_USER_CREATED:    'Admin creado',
  ADMIN_USER_UPDATED:    'Admin actualizado',
  CLUB_CREATED:          'Club creado',
  CLUB_DELETED:          'Club eliminado',
  CLUB_NOTES_UPDATED:    'Notas actualizadas',
  CLUB_CONTACT_UPDATED:  'Contacto actualizado',
};

const ACTION_COLOR: Record<string, string> = {
  ADMIN_LOGIN:           'bg-indigo-500/20 text-indigo-400',
  CLUB_PLAN_CHANGED:     'bg-green-500/20 text-green-400',
  CLUB_TRIAL_EXTENDED:   'bg-yellow-500/20 text-yellow-400',
  CLUB_SUSPENDED:        'bg-red-500/20 text-red-400',
  CLUB_UNLOCKED:         'bg-green-500/20 text-green-400',
  CLUB_MODULES_UPDATED:  'bg-blue-500/20 text-blue-400',
  CLUB_IMPERSONATED:     'bg-purple-500/20 text-purple-400',
  ADMIN_USER_CREATED:    'bg-indigo-500/20 text-indigo-400',
  ADMIN_USER_UPDATED:    'bg-indigo-500/20 text-indigo-400',
  CLUB_CREATED:          'bg-green-500/20 text-green-400',
  CLUB_DELETED:          'bg-red-500/20 text-red-400',
  CLUB_NOTES_UPDATED:    'bg-gray-500/20 text-gray-400',
  CLUB_CONTACT_UPDATED:  'bg-blue-500/20 text-blue-400',
};

const BUSINESS_EVENTS = new Set([
  'CLUB_PLAN_CHANGED', 'CLUB_CREATED', 'CLUB_DELETED', 'CLUB_SUSPENDED',
  'CLUB_UNLOCKED', 'CLUB_TRIAL_EXTENDED',
]);

const SYSTEM_EVENTS = new Set([
  'ADMIN_LOGIN', 'CLUB_MODULES_UPDATED', 'CLUB_IMPERSONATED',
  'ADMIN_USER_CREATED', 'ADMIN_USER_UPDATED', 'CLUB_NOTES_UPDATED', 'CLUB_CONTACT_UPDATED',
]);

type FilterType = 'all' | 'negocio' | 'sistema';

export function RecentActivityList({ entries }: { entries: AuditEntry[] }) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = entries.filter(e => {
    if (filter === 'negocio') return BUSINESS_EVENTS.has(e.action);
    if (filter === 'sistema') return SYSTEM_EVENTS.has(e.action);
    return true;
  });

  const tabs: { id: FilterType; label: string }[] = [
    { id: 'all',      label: 'Todo' },
    { id: 'negocio',  label: 'Negocio' },
    { id: 'sistema',  label: 'Sistema' },
  ];

  if (!entries.length) {
    return (
      <div className="glass rounded-2xl p-5 h-40 flex items-center justify-center">
        <span className="text-sm text-gray-600">Sin actividad reciente</span>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      {/* Header + filter */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" />
          Actividad Reciente
        </p>
        <div className="flex gap-0.5 p-0.5 bg-white/4 rounded-lg border border-white/5">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all ${
                filter === t.id
                  ? 'bg-white/12 text-white'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-1.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-700 text-center py-4">Sin entradas en esta categoría</p>
        ) : (
          filtered.map(entry => {
            const isBusiness = BUSINESS_EVENTS.has(entry.action);
            return (
              <div
                key={entry.id}
                className={`flex items-start gap-3 px-3 py-2 rounded-xl transition-colors ${
                  isBusiness
                    ? 'bg-white/3 border border-white/5 hover:bg-white/5'
                    : 'hover:bg-white/2'
                }`}
              >
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5 shrink-0 ${ACTION_COLOR[entry.action] || 'bg-gray-500/20 text-gray-400'}`}>
                  {ACTION_LABEL[entry.action] || entry.action}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate">
                    {entry.admin_email}
                    {entry.entity_id && <span className="text-gray-600"> · {entry.entity_id}</span>}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  {isBusiness && <TrendingUp className="w-2.5 h-2.5 text-gray-700" />}
                  {!isBusiness && <Settings className="w-2.5 h-2.5 text-gray-800" />}
                  <span className="text-[10px] text-gray-600 whitespace-nowrap">{formatRelative(entry.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
