import { CheckCircle2, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatCOP, formatDate, PLAN_PRICE } from '@/lib/utils';
import type { ClubFullDetail } from '@/types/club';

const HEALTH_COLOR: Record<string, string> = {
  healthy: 'bg-green-500',
  warning: 'bg-yellow-500',
  inactive: 'bg-gray-500',
};

const MODULE_LABELS: Record<string, string> = {
  jugadores:    'Gestión de jugadores',
  uniformes:    'Uniformes',
  torneos:      'Torneos',
  arbitraje:    'Arbitraje',
  cobro:        'Cobro automático WA',
  whatsapp:     'WhatsApp',
  conciliacion: 'Conciliación bancaria',
  finanzas:     'Finanzas',
};

const ONBOARDING_STEPS = [
  { label: 'Nombre del club',     check: (c: ClubFullDetail) => !!c.config.nombre },
  { label: 'Logo',                check: (c: ClubFullDetail) => !!c.config.logo_url },
  { label: 'Color',               check: (c: ClubFullDetail) => !!c.config.color },
  { label: 'WhatsApp',            check: (c: ClubFullDetail) => !!c.config.whatsapp },
  { label: 'Valor mensualidad',   check: (c: ClubFullDetail) => !!c.config.valor_mensualidad },
  { label: 'Onboarding marcado',  check: (c: ClubFullDetail) => !!c.config.onboarding_completed },
];

interface Props { detail: ClubFullDetail }

export function OverviewTab({ detail }: Props) {
  const cfg = detail.config;
  const plan = cfg.plan;
  const price = PLAN_PRICE[plan] ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Config */}
      <section className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Configuración</h3>
        <dl className="space-y-2 text-sm">
          <Row label="Plan" value={
            <span className="capitalize">
              {plan} {price > 0 && <span className="text-gray-600 text-xs ml-1">{formatCOP(price)}/mes</span>}
            </span>
          } />
          <Row label="Ciudad"         value={cfg.ciudad || '—'} />
          <Row label="WhatsApp"       value={cfg.whatsapp || '—'} />
          <Row label="Mensualidad"    value={cfg.valor_mensualidad ? formatCOP(cfg.valor_mensualidad) : '—'} />
          <Row label="Días gracia"    value={cfg.dias_gracia_mora != null ? `${cfg.dias_gracia_mora} días` : '—'} />
          <Row label="Penalidad mora" value={cfg.penalidad_mora != null ? formatCOP(cfg.penalidad_mora) : '—'} />
          {cfg.trial_ends_at && (
            <Row label="Trial expira" value={formatDate(cfg.trial_ends_at)} />
          )}
          <Row label="Creado" value={formatDate(detail.created_at)} />
        </dl>
      </section>

      {/* Health */}
      <section className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Health Score</h3>
        <div className="flex items-center gap-3 mb-4">
          <Progress
            value={detail.health_score}
            className="h-2 flex-1 bg-white/10"
            style={{ '--progress-color': HEALTH_COLOR[detail.health_label] } as React.CSSProperties}
          />
          <span className="text-2xl font-bold text-white w-10 text-right">{detail.health_score}</span>
        </div>
        <ul className="space-y-2 text-sm">
          <HealthRow label="Onboarding completado" pts={20} earned={cfg.onboarding_completed ? 20 : 0} />
          <HealthRow label="Jugadores (máx 10→20 pts)" pts={20} earned={Math.round(Math.min(detail.player_count, 10) / 10 * 20)} />
          <HealthRow label="Plan activo (no trial)" pts={20} earned={plan !== 'trial' ? 20 : 0} />
          <HealthRow label="Trial vigente" pts={15} earned={plan === 'trial' && cfg.trial_ends_at && new Date(cfg.trial_ends_at) > new Date() ? 15 : 0} />
          <HealthRow label="WhatsApp configurado" pts={15} earned={cfg.whatsapp ? 15 : 0} />
          <HealthRow label="Actividad últimos 14 días" pts={10} earned={detail.health_score >= 10 ? 10 : 0} />
        </ul>
      </section>

      {/* Onboarding checklist */}
      <section className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Onboarding — {detail.onboarding_pct}%
        </h3>
        <ul className="space-y-2">
          {ONBOARDING_STEPS.map(step => {
            const done = step.check(detail);
            return (
              <li key={step.label} className="flex items-center gap-2 text-sm">
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  : <XCircle className="w-4 h-4 text-gray-600 shrink-0" />}
                <span className={done ? 'text-gray-300' : 'text-gray-600'}>{step.label}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Módulos */}
      <section className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Módulos</h3>
        <ul className="space-y-2">
          {Object.entries(MODULE_LABELS).map(([key, label]) => {
            const enabled = cfg.modulos?.[key] ?? false;
            return (
              <li key={key} className="flex items-center gap-2 text-sm">
                {enabled
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  : <XCircle className="w-4 h-4 text-gray-600 shrink-0" />}
                <span className={enabled ? 'text-gray-300' : 'text-gray-600'}>{label}</span>
              </li>
            );
          })}
        </ul>
      </section>

    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className="text-gray-200 text-right">{value}</dd>
    </div>
  );
}

function HealthRow({ label, pts, earned }: { label: string; pts: number; earned: number }) {
  return (
    <li className="flex items-center justify-between text-sm">
      <span className={earned > 0 ? 'text-gray-300' : 'text-gray-600'}>{label}</span>
      <span className={`text-xs font-medium ${earned > 0 ? 'text-green-400' : 'text-gray-700'}`}>
        +{earned}/{pts}
      </span>
    </li>
  );
}
