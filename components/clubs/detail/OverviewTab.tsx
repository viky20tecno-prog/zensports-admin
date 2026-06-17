'use client';
import { useState } from 'react';
import { CheckCircle2, XCircle, Lock, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatCOP, formatDate, formatRelative, PLAN_PRICE } from '@/lib/utils';
import { MODULE_KEYS, MODULE_LABELS, isModuleUnlocked } from '@/lib/plan-modules';
import { EditAdminContactDialog } from '@/components/clubs/EditAdminContactDialog';
import type { ClubFullDetail } from '@/types/club';
import type { ModuleKey } from '@/lib/plan-modules';

const HEALTH_COLOR: Record<string, string> = {
  healthy: 'bg-green-500',
  warning: 'bg-yellow-500',
  inactive: 'bg-gray-500',
};

const ONBOARDING_STEPS = [
  { label: 'Nombre del club',    check: (c: ClubFullDetail) => !!c.config.nombre },
  { label: 'Logo',               check: (c: ClubFullDetail) => !!c.config.logo_url },
  { label: 'Color',              check: (c: ClubFullDetail) => !!c.config.color },
  { label: 'WhatsApp',           check: (c: ClubFullDetail) => !!c.config.whatsapp },
  { label: 'Valor mensualidad',  check: (c: ClubFullDetail) => !!c.config.valor_mensualidad },
  { label: 'Onboarding marcado', check: (c: ClubFullDetail) => !!c.config.onboarding_completed },
];

const PLAN_UPGRADE_LABEL: Record<string, string> = {
  trial:   'Starter+',
  starter: 'Pro+',
  pro:     'Scale',
  scale:   '',
  total:   '',
};

interface Props { detail: ClubFullDetail }

export function OverviewTab({ detail }: Props) {
  const cfg = detail.config;
  const plan = cfg.plan;
  const price = PLAN_PRICE[plan] ?? 0;

  const [modulos, setModulos] = useState<Record<string, boolean>>((cfg.modulos ?? {}) as Record<string, boolean>);
  const [toggling, setToggling] = useState<string | null>(null);
  const [editContact, setEditContact] = useState(false);
  const [ownerEmail,  setOwnerEmail]  = useState(detail.owner_email ?? '');
  const [celularAdmin, setCelularAdmin] = useState(detail.celular_admin ?? '');
  const [staff, setStaff] = useState<string[]>(cfg.celulares_staff ?? []);
  const [newStaff, setNewStaff] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);

  async function staffAction(action: 'add' | 'remove', celular: string) {
    setStaffLoading(true);
    const res = await fetch(`/api/clubs/${detail.slug}/staff`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, celular }),
    });
    if (res.ok) {
      const data = await res.json();
      setStaff(data.celulares_staff);
      if (action === 'add') setNewStaff('');
    }
    setStaffLoading(false);
  }

  async function toggleModule(key: ModuleKey, next: boolean) {
    setToggling(key);
    setModulos(prev => ({ ...prev, [key]: next }));
    const res = await fetch(`/api/clubs/${detail.slug}/modules`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, enabled: next }),
    });
    if (!res.ok) {
      setModulos(prev => ({ ...prev, [key]: !next }));
    }
    setToggling(null);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Config */}
      <section className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Configuración</h3>
          <button
            onClick={() => setEditContact(true)}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition"
          >
            <Pencil className="w-3 h-3" /> Cambiar admin
          </button>
        </div>
        <dl className="space-y-2 text-sm">
          <Row label="Plan" value={
            <span className="capitalize">
              {plan} {price > 0 && <span className="text-gray-600 text-xs ml-1">{formatCOP(price)}/mes</span>}
            </span>
          } />
          {ownerEmail && (
            <Row label="Email admin" value={<span className="font-mono text-xs">{ownerEmail}</span>} />
          )}
          {celularAdmin && (
            <Row label="WA admin (bot)" value={celularAdmin} />
          )}
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

      {editContact && (
        <EditAdminContactDialog
          slug={detail.slug}
          currentEmail={ownerEmail}
          currentCelular={celularAdmin}
          open={editContact}
          onClose={() => setEditContact(false)}
          onSuccess={(email, celular) => { setOwnerEmail(email); setCelularAdmin(celular); }}
        />
      )}

      {/* Módulos */}
      <section className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Módulos</h3>
          <span className="text-xs text-gray-600">Plan: <span className="capitalize text-gray-400">{plan}</span></span>
        </div>
        <ul className="space-y-2">
          {MODULE_KEYS.map(key => {
            const unlocked = isModuleUnlocked(plan, key);
            const active = modulos[key] ?? false;
            const isToggling = toggling === key;
            const upgradeNeeded = PLAN_UPGRADE_LABEL[plan];

            return (
              <li key={key} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {unlocked ? (
                    active
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      : <XCircle className="w-4 h-4 text-gray-600 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-700 shrink-0" />
                  )}
                  <span className={`text-sm ${unlocked ? (active ? 'text-gray-200' : 'text-gray-500') : 'text-gray-700'}`}>
                    {MODULE_LABELS[key]}
                  </span>
                  {!unlocked && upgradeNeeded && (
                    <span className="text-xs text-gray-700 border border-white/8 rounded px-1">{upgradeNeeded}</span>
                  )}
                </div>

                {unlocked && (
                  <button
                    onClick={() => toggleModule(key, !active)}
                    disabled={isToggling}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                      active ? 'bg-indigo-600' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                        active ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
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
          <HealthRow label="Onboarding completado"      pts={20} earned={cfg.onboarding_completed ? 20 : 0} />
          <HealthRow label="Jugadores (máx 10→20 pts)"  pts={20} earned={Math.round(Math.min(detail.player_count, 10) / 10 * 20)} />
          <HealthRow label="Plan activo (no trial)"      pts={20} earned={plan !== 'trial' ? 20 : 0} />
          <HealthRow label="Trial vigente"               pts={15} earned={plan === 'trial' && cfg.trial_ends_at && new Date(cfg.trial_ends_at) > new Date() ? 15 : 0} />
          <HealthRow label="WhatsApp configurado"        pts={15} earned={cfg.whatsapp ? 15 : 0} />
          <HealthRow label="Actividad últimos 14 días"   pts={10} earned={detail.health_score >= 10 ? 10 : 0} />
        </ul>
      </section>

      {/* Métricas de uso */}
      <section className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Uso real</h3>
        <dl className="space-y-2 text-sm">
          <Row label="Jugadores activos" value={
            <span>{detail.players.filter(p => p.activo).length} <span className="text-gray-600 text-xs">/ {detail.player_count} total</span></span>
          } />
          <Row label="Pagos este mes" value={(() => {
            const now = new Date();
            const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const count = detail.pagos.filter(p => p.created_at.startsWith(periodo)).length;
            return <span>{count} pagos</span>;
          })()} />
          <Row label="Última actividad" value={
            detail.audit_events.length > 0
              ? <span className="text-xs">{formatRelative(detail.audit_events[0].created_at)}</span>
              : <span className="text-gray-600">Sin actividad</span>
          } />
          <Row label="Acciones admin" value={<span>{detail.audit_events.length}</span>} />
        </dl>
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

      {/* Staff WhatsApp */}
      <section className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3 md:col-span-2">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-gray-500" />
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Staff WhatsApp (bot)</h3>
          <span className="text-xs text-gray-700 ml-1">— entrenadores y asistentes con acceso al bot</span>
        </div>

        {/* Lista actual */}
        {staff.length === 0 ? (
          <p className="text-sm text-gray-600">Sin staff registrado aún.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {staff.map(n => (
              <li key={n} className="flex items-center gap-1.5 text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                <span className="font-mono text-gray-300">{n}</span>
                <button
                  onClick={() => staffAction('remove', n)}
                  disabled={staffLoading}
                  className="text-gray-600 hover:text-red-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Agregar */}
        <div className="flex gap-2 mt-1">
          <input
            type="tel"
            value={newStaff}
            onChange={e => setNewStaff(e.target.value)}
            placeholder="Número celular (ej: 3001234567)"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => newStaff.trim() && staffAction('add', newStaff.trim())}
            disabled={staffLoading || !newStaff.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition text-white"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>
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
