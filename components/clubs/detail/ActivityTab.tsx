'use client';
import { formatDate } from '@/lib/utils';
import type { ActivityLog } from '@/types/club';

const ACTION_META: Record<string, { label: string; color: string; icon: string }> = {
  JUGADOR_EDITADO:         { label: 'Jugador editado',       color: 'bg-blue-500/15 text-blue-300 border-blue-500/25',    icon: '✏️' },
  JUGADOR_ELIMINADO:       { label: 'Jugador eliminado',     color: 'bg-red-500/15 text-red-300 border-red-500/25',       icon: '🗑️' },
  PAGO_REGISTRADO:         { label: 'Pago registrado',       color: 'bg-green-500/15 text-green-300 border-green-500/25', icon: '💰' },
  TORNEO_INSCRIPCION:      { label: 'Inscripción torneo',    color: 'bg-purple-500/15 text-purple-300 border-purple-500/25', icon: '🏆' },
  TORNEO_PAGO_ACTUALIZADO: { label: 'Pago torneo',           color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25', icon: '🏆' },
  UNIFORME_PEDIDO:         { label: 'Pedido uniforme',       color: 'bg-orange-500/15 text-orange-300 border-orange-500/25', icon: '👕' },
  UNIFORME_ACTUALIZADO:    { label: 'Uniforme actualizado',  color: 'bg-amber-500/15 text-amber-300 border-amber-500/25',  icon: '👕' },
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN:      'Admin',
  ENTRENADOR: 'Entrenador',
  TESORERO:   'Tesorero',
  DIRECTIVO:  'Directivo',
};

interface Props { logs: ActivityLog[] }

export function ActivityTab({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 py-16 text-center text-gray-600 text-sm">
        Sin actividad registrada aún. Las acciones del club aparecerán aquí.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map(log => {
        const meta = ACTION_META[log.action] ?? { label: log.action, color: 'bg-white/5 text-gray-400 border-white/10', icon: '•' };
        const roleLabel = log.user_role ? (ROLE_LABEL[log.user_role] ?? log.user_role) : null;
        return (
          <div key={log.id} className="flex gap-4 rounded-xl border border-white/8 bg-white/2 p-4">
            <div className="shrink-0 pt-0.5">
              <span className={`text-xs font-medium px-2 py-1 rounded-md border ${meta.color}`}>
                {meta.icon} {meta.label}
              </span>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-gray-300 truncate">{log.user_name || log.user_email}</span>
                  {roleLabel && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/8 text-gray-500 border border-white/10 shrink-0">{roleLabel}</span>
                  )}
                  {log.user_name && (
                    <span className="text-xs text-gray-600 truncate hidden sm:block">{log.user_email}</span>
                  )}
                </div>
                <span className="text-xs text-gray-600 shrink-0">{formatDate(log.created_at)}</span>
              </div>
              {log.entity_label && (
                <p className="text-xs text-gray-500">
                  {log.entity_type && <span className="text-gray-700 capitalize">{log.entity_type}: </span>}
                  <span className="text-gray-400">{log.entity_label}</span>
                </p>
              )}
              {log.details && Object.keys(log.details).length > 0 && (
                <p className="text-[11px] text-gray-700 font-mono bg-white/3 rounded px-2 py-1 border border-white/5 truncate">
                  {JSON.stringify(log.details)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
