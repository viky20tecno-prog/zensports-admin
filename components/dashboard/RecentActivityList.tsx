import { formatRelative } from '@/lib/utils';

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
};

export function RecentActivityList({ entries }: { entries: AuditEntry[] }) {
  if (!entries.length) {
    return (
      <div className="glass rounded-2xl p-5 h-64 flex items-center justify-center">
        <span className="text-sm text-gray-600">Sin actividad reciente</span>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Actividad Reciente</p>
      <div className="space-y-3">
        {entries.map(entry => (
          <div key={entry.id} className="flex items-start gap-3">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5 ${ACTION_COLOR[entry.action] || 'bg-gray-500/20 text-gray-400'}`}>
              {ACTION_LABEL[entry.action] || entry.action}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 truncate">
                {entry.admin_email}{entry.entity_id ? ` · ${entry.entity_id}` : ''}
              </p>
            </div>
            <span className="text-[10px] text-gray-600 whitespace-nowrap">{formatRelative(entry.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
