'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, XCircle, CheckCircle2, AlertTriangle, MessageCircle, ExternalLink } from 'lucide-react';

export interface TrialClub {
  slug: string;
  nombre: string;
  whatsapp: string | null;
  trial_ends_at: string | null;
  days_left: number | null;
  created_at: string;
}

interface Props {
  inProgress: TrialClub[];   // >5 días
  expiringSoon: TrialClub[]; // 0-5 días
  expired: TrialClub[];      // vencidos sin convertir
}

const WA_ZENSPORTS = '573023903192';

export function TrialManager({ inProgress, expiringSoon, expired }: Props) {
  const [tab, setTab] = useState<'expiring' | 'active' | 'expired'>(
    expiringSoon.length > 0 ? 'expiring' : 'active'
  );
  const [contacted, setContacted] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem('zs_contacted_trials');
      if (saved) setContacted(new Set(JSON.parse(saved) as string[]));
    } catch { /* ignore */ }
  }, []);

  const toggleContacted = (slug: string) => {
    setContacted(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      try { localStorage.setItem('zs_contacted_trials', JSON.stringify(Array.from(next))); } catch { /* ignore */ }
      return next;
    });
  };

  const tabs = [
    { id: 'expiring' as const, label: 'Por vencer', count: expiringSoon.length, color: 'text-red-400', bg: expiringSoon.length > 0 ? 'bg-red-500/15 border-red-500/20' : '' },
    { id: 'active'   as const, label: 'En curso',   count: inProgress.length,   color: 'text-yellow-400', bg: '' },
    { id: 'expired'  as const, label: 'Expirados',  count: expired.length,       color: 'text-gray-400', bg: '' },
  ];

  const lists: Record<typeof tab, TrialClub[]> = {
    expiring: expiringSoon,
    active:   inProgress,
    expired,
  };

  const total = inProgress.length + expiringSoon.length + expired.length;

  if (total === 0) return null;

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          Gestión de trials
        </h3>
        <span className="text-xs text-gray-600">{total} en total</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/3 rounded-xl border border-white/5">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
              tab === t.id
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span>{t.label}</span>
            {t.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === t.id
                  ? t.id === 'expiring' ? 'bg-red-500/20 text-red-400'
                  : t.id === 'active' ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-gray-500/20 text-gray-400'
                  : 'bg-white/8 text-gray-500'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {lists[tab].length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-6">Sin clubs en esta categoría</p>
        ) : (
          lists[tab].map(club => {
            const isContacted = contacted.has(club.slug);
            const urgent = tab === 'expiring' && (club.days_left ?? 99) <= 2;
            const waMsg = encodeURIComponent(
              `Hola${club.nombre ? ` equipo ${club.nombre}` : ''}! 👋 Soy del equipo ZenSports. Tu trial${club.days_left != null && club.days_left > 0 ? ` vence en ${club.days_left} día${club.days_left !== 1 ? 's' : ''}` : ' venció'}. ¿Cómo te podemos ayudar a continuar con tu plan?`
            );

            return (
              <div
                key={club.slug}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                  isContacted
                    ? 'border-green-500/15 bg-green-500/4 opacity-60'
                    : urgent
                    ? 'border-red-500/20 bg-red-500/5'
                    : tab === 'expiring'
                    ? 'border-yellow-500/15 bg-yellow-500/4'
                    : tab === 'expired'
                    ? 'border-white/5 bg-white/2'
                    : 'border-white/6 bg-white/2'
                }`}
              >
                {/* Status icon */}
                <div className="shrink-0">
                  {isContacted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : tab === 'expired' ? (
                    <XCircle className="w-4 h-4 text-gray-600" />
                  ) : (
                    <Clock className={`w-4 h-4 ${urgent ? 'text-red-400' : 'text-yellow-400'}`} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{club.nombre}</p>
                  <p className="text-[11px] text-gray-600 truncate">
                    {club.slug}
                    {club.whatsapp && <span className="ml-1 text-gray-700">· {club.whatsapp}</span>}
                  </p>
                </div>

                {/* Days left badge */}
                <div className="shrink-0 text-right">
                  {tab !== 'expired' && club.days_left != null && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      urgent
                        ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/15'
                    }`}>
                      {club.days_left === 0 ? 'Vence hoy' : `${club.days_left}d`}
                    </span>
                  )}
                  {tab === 'expired' && (
                    <span className="text-[10px] text-gray-600">Expirado</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {club.whatsapp && (
                    <a
                      href={`https://wa.me/${club.whatsapp.replace(/\D/g, '')}?text=${waMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Contactar por WhatsApp"
                      className="p-1.5 rounded-lg text-gray-600 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <Link
                    href={`/clubs/${club.slug}`}
                    title="Ver club"
                    className="p-1.5 rounded-lg text-gray-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => toggleContacted(club.slug)}
                    title={isContacted ? 'Quitar marca contactado' : 'Marcar como contactado'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isContacted
                        ? 'text-green-400 bg-green-500/10'
                        : 'text-gray-600 hover:text-green-400 hover:bg-green-500/10'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
