'use client';
import { useEffect, useState } from 'react';
import { Award, Gift, Trophy, Users } from 'lucide-react';
import type { BillingRecord, ClubFullDetail } from '@/types/club';

// Plan Fundadores + Plan de Referidos (ver lib/programa.ts).
interface Props {
  detail: ClubFullDetail;
  onRecord: (r: BillingRecord) => void;
}

type ProgramaConfig = {
  fundador?: { numero: number; desde: string };
  concurso?: boolean;
  recomendado_por?: string;
  referido_por_slug?: string | null;
  meses_gratis?: number;
  referidos_premiados?: string[];
  sin_cobro?: boolean;
};

export function ProgramaPanel({ detail, onRecord }: Props) {
  const [cfg, setCfg] = useState<ProgramaConfig>(detail.config as ProgramaConfig);
  const [info, setInfo] = useState<{ fundadores_usados: number; cupos: number; clubs: { slug: string; nombre: string }[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const now = new Date();
  const [periodoGratis, setPeriodoGratis] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

  async function cargar() {
    const res = await fetch(`/api/clubs/${detail.slug}/programa`);
    if (res.ok) setInfo(await res.json());
  }
  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function accion(body: Record<string, unknown>, confirmar?: string) {
    if (confirmar && !window.confirm(confirmar)) return;
    setBusy(true); setError('');
    const res = await fetch(`/api/clubs/${detail.slug}/programa`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(json.error || 'Error'); return; }
    if (json.config) setCfg(json.config);
    if (json.record) onRecord(json.record);
    cargar();
  }

  const nombreDe = (slug?: string | null) => info?.clubs.find(c => c.slug === slug)?.nombre ?? slug;
  const meses = Number(cfg.meses_gratis) || 0;

  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-violet-300 uppercase tracking-wider">Plan Fundadores · Referidos · Concurso</p>
        <label className="flex items-center gap-2 text-xs text-amber-300">
          <input type="checkbox" checked={!!cfg.sin_cobro} disabled={busy}
            onChange={e => accion({ accion: 'sin_cobro', valor: e.target.checked })} />
          Sin cobro (club de prueba o cortesía — no suma al MRR)
        </label>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        {/* Fundador */}
        <div className="rounded-lg bg-black/20 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-white"><Award className="w-4 h-4 text-violet-300" /> Fundador</div>
          {cfg.fundador?.numero ? (
            <>
              <p className="text-lg font-bold text-violet-300">#{cfg.fundador.numero} <span className="text-xs text-gray-500 font-normal">de {info?.cupos ?? 20}</span></p>
              <button disabled={busy} onClick={() => accion({ accion: 'quitar_fundador' }, '¿Quitar el cupo de fundador a este club?')}
                className="text-xs text-gray-500 hover:text-red-400 disabled:opacity-50">Quitar cupo</button>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500">Cupos usados: {info ? `${info.fundadores_usados} de ${info.cupos}` : '…'}. Se asigna solo al pagar el anual.</p>
              <button disabled={busy || !!cfg.sin_cobro || (info ? info.fundadores_usados >= info.cupos : true)}
                onClick={() => accion({ accion: 'asignar_fundador' }, '¿Asignar el siguiente cupo de fundador a este club?')}
                className="text-xs font-medium text-violet-300 hover:text-violet-200 disabled:opacity-40">Asignar cupo manualmente</button>
            </>
          )}
        </div>

        {/* Referido por */}
        <div className="rounded-lg bg-black/20 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-white"><Users className="w-4 h-4 text-violet-300" /> Referido por</div>
          <p className="text-xs text-gray-500">En el registro escribió: <span className="text-gray-300">{cfg.recomendado_por || '—'}</span></p>
          <select disabled={busy || !info} value={cfg.referido_por_slug ?? ''}
            onChange={e => accion({ accion: 'vincular_referidor', referido_por_slug: e.target.value || null })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none">
            <option value="" className="bg-[#0F1219]">Sin referidor</option>
            {info?.clubs.map(c => <option key={c.slug} value={c.slug} className="bg-[#0F1219]">{c.nombre}</option>)}
          </select>
          <p className="text-[11px] text-gray-600">Al pagar el anual, {cfg.referido_por_slug ? nombreDe(cfg.referido_por_slug) : 'el referidor'} gana 1 mes gratis.</p>
        </div>

        {/* Meses gratis + concurso */}
        <div className="rounded-lg bg-black/20 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-white"><Gift className="w-4 h-4 text-violet-300" /> Meses gratis por referir</div>
          <p className="text-lg font-bold text-emerald-400">{meses} <span className="text-xs text-gray-500 font-normal">de máx. 12</span></p>
          {meses > 0 && (
            <div className="flex items-center gap-2">
              <input type="month" value={periodoGratis} onChange={e => setPeriodoGratis(e.target.value)}
                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none" />
              <button disabled={busy} onClick={() => accion({ accion: 'aplicar_mes_gratis', periodo: periodoGratis }, `¿Aplicar 1 mes gratis al período ${periodoGratis}? Queda registrado como pagado por $0.`)}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50 shrink-0">Aplicar</button>
            </div>
          )}
          <label className="flex items-center gap-2 text-xs text-gray-400 pt-1">
            <input type="checkbox" checked={!!cfg.concurso} disabled={busy} onChange={e => accion({ accion: 'concurso', valor: e.target.checked })} />
            <Trophy className="w-3.5 h-3.5 text-amber-400" /> Participa en el concurso
          </label>
        </div>
      </div>
    </div>
  );
}
