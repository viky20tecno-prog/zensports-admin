import { formatDate } from '@/lib/utils';
import type { AuditEvent } from '@/types/club';

const ACTION_META: Record<string, { label: string; color: string }> = {
  CLUB_PLAN_CHANGED:     { label: 'Plan cambiado',       color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  CLUB_TRIAL_EXTENDED:   { label: 'Trial extendido',     color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  CLUB_SUSPENDED:        { label: 'Club suspendido',     color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  CLUB_UNLOCKED:         { label: 'Club reactivado',     color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  CLUB_MODULES_UPDATED:  { label: 'Módulos actualizados',color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  CLUB_IMPERSONATED:     { label: 'Acceso impersonado',  color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  CLUB_CONFIG_EDITED:    { label: 'Config editada',      color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
};

interface Props { events: AuditEvent[] }

export function AuditTab({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 py-16 text-center text-gray-600 text-sm">
        No hay eventos de auditoría para este club
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map(ev => {
        const meta = ACTION_META[ev.action] ?? { label: ev.action, color: 'bg-white/5 text-gray-400 border-white/10' };
        return (
          <div key={ev.id} className="flex gap-4 rounded-xl border border-white/8 bg-white/2 p-4">
            <div className="shrink-0 pt-0.5">
              <span className={`text-xs font-medium px-2 py-1 rounded-md border ${meta.color}`}>
                {meta.label}
              </span>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-300 truncate">{ev.admin_email}</span>
                <span className="text-xs text-gray-600 shrink-0">{formatDate(ev.created_at)}</span>
              </div>
              {(ev.before_state || ev.after_state) && (
                <div className="flex gap-3 text-xs text-gray-600 font-mono flex-wrap">
                  {ev.before_state && (
                    <span className="bg-red-500/5 border border-red-500/10 rounded px-2 py-0.5">
                      antes: {JSON.stringify(ev.before_state)}
                    </span>
                  )}
                  {ev.after_state && (
                    <span className="bg-green-500/5 border border-green-500/10 rounded px-2 py-0.5">
                      después: {JSON.stringify(ev.after_state)}
                    </span>
                  )}
                </div>
              )}
              {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                <p className="text-xs text-gray-700 font-mono">
                  {JSON.stringify(ev.metadata)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
