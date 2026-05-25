import Link from 'next/link';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';

export interface AlertClub {
  slug: string;
  nombre: string;
  trial_ends_at: string;
  days_left: number;
}

interface Props {
  expiringSoon: AlertClub[];  // ≤7 días
  expired: AlertClub[];       // ya venció
}

export function ExpirationAlerts({ expiringSoon, expired }: Props) {
  const total = expiringSoon.length + expired.length;
  if (total === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-400" />
        Alertas de vencimiento
        <span className="ml-1 text-xs font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 rounded-full px-2 py-0.5">
          {total}
        </span>
      </h3>

      <div className="space-y-2">
        {/* Expiring soon: urgent (≤3d) first, then warning (4-7d) */}
        {expiringSoon.map(club => {
          const urgent = club.days_left <= 3;
          return (
            <Link
              key={club.slug}
              href={`/clubs/${club.slug}`}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors hover:bg-white/5 ${
                urgent
                  ? 'border-red-500/25 bg-red-500/5'
                  : 'border-yellow-500/20 bg-yellow-500/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className={`w-4 h-4 shrink-0 ${urgent ? 'text-red-400' : 'text-yellow-400'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-200">{club.nombre}</p>
                  <p className="text-xs text-gray-500">{club.slug}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                urgent
                  ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                  : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
              }`}>
                {club.days_left === 0 ? 'Vence hoy' : `${club.days_left}d restantes`}
              </span>
            </Link>
          );
        })}

        {/* Already expired */}
        {expired.map(club => (
          <Link
            key={club.slug}
            href={`/clubs/${club.slug}`}
            className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-500/20 bg-white/2 transition-colors hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-4 h-4 text-gray-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-400">{club.nombre}</p>
                <p className="text-xs text-gray-600">{club.slug}</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-500 border border-white/8">
              Expirado
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
