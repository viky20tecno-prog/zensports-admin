'use client';
import { useState } from 'react';
import { Plus, X, TrendingUp, Pencil, Trash2, Check, Link2, Copy, CircleDollarSign } from 'lucide-react';
import { formatCOP, formatDate, PLAN_PRICE } from '@/lib/utils';
import type { BillingRecord, ClubFullDetail } from '@/types/club';

const MESES_ES: Record<string, string> = {
  '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
  '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
  '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre',
};

function formatPeriodo(periodo: string) {
  const [year, month] = periodo.split('-');
  return `${MESES_ES[month] ?? month} ${year}`;
}

const METODOS = ['transferencia', 'efectivo', 'tarjeta', 'nequi', 'daviplata', 'otro'];

interface Props {
  detail: ClubFullDetail;
  initialRecords: BillingRecord[];
}

export function BillingTab({ detail, initialRecords }: Props) {
  const [records, setRecords] = useState<BillingRecord[]>(initialRecords);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const planPrice = PLAN_PRICE[detail.config.plan] ?? 0;
  const totalCollected = records.filter(r => r.estado === 'pagado').reduce((s, r) => s + r.monto, 0);

  const now = new Date();
  const currentPeriodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const paidThisMonth = records.some(r => r.periodo === currentPeriodo && r.estado === 'pagado');

  const [form, setForm] = useState({
    monto: planPrice > 0 ? String(planPrice) : '',
    periodo: currentPeriodo,
    metodo: 'transferencia',
    referencia: '',
    notas: '',
  });

  function setField(k: keyof typeof form, v: string) {
    setForm(prev => ({ ...prev, [k]: v }));
    setError('');
  }

  async function handleSubmit() {
    if (!form.monto || !form.periodo) { setError('Monto y período son requeridos'); return; }
    setSaving(true);
    const res = await fetch(`/api/clubs/${detail.slug}/billing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, monto: Number(form.monto) }),
    });
    setSaving(false);
    if (res.ok) {
      const { record } = await res.json();
      setRecords(prev => [record, ...prev]);
      setShowForm(false);
      setForm({ monto: planPrice > 0 ? String(planPrice) : '', periodo: currentPeriodo, metodo: 'transferencia', referencia: '', notas: '' });
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error || 'Error al guardar');
    }
  }

  const [showBoldForm, setShowBoldForm] = useState(false);
  const [boldPeriodo, setBoldPeriodo] = useState(currentPeriodo);
  const [boldMontoOverride, setBoldMontoOverride] = useState('');
  const [boldActivarPlan, setBoldActivarPlan] = useState(false);
  const [boldPlanSolicitado, setBoldPlanSolicitado] = useState('starter');
  const [boldGenerating, setBoldGenerating] = useState(false);
  const [boldError, setBoldError] = useState('');
  const [boldResult, setBoldResult] = useState<BillingRecord | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function copyLink(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleGenerarLinkBold() {
    setBoldGenerating(true);
    setBoldError('');
    const body: { periodo: string; monto?: number; plan_solicitado?: string } = { periodo: boldPeriodo };
    if (boldMontoOverride) body.monto = Number(boldMontoOverride);
    if (boldActivarPlan) body.plan_solicitado = boldPlanSolicitado;
    const res = await fetch(`/api/clubs/${detail.slug}/billing/bold-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBoldGenerating(false);
    if (res.ok) {
      const { record } = await res.json();
      setRecords(prev => [record, ...prev]);
      setBoldResult(record);
    } else {
      const json = await res.json().catch(() => ({}));
      setBoldError(json.error || 'Error generando el link');
    }
  }

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ monto: '', periodo: '', metodo: '', referencia: '', notas: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function startEdit(r: BillingRecord) {
    setEditingId(r.id);
    setEditError('');
    setEditForm({
      monto: String(r.monto),
      periodo: r.periodo,
      metodo: r.metodo,
      referencia: r.referencia || '',
      notas: r.notas || '',
    });
  }

  async function saveEdit(id: string) {
    if (!editForm.monto || !editForm.periodo) { setEditError('Monto y período son requeridos'); return; }
    setEditSaving(true);
    setEditError('');
    const res = await fetch(`/api/clubs/${detail.slug}/billing/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, monto: Number(editForm.monto) }),
    });
    setEditSaving(false);
    if (res.ok) {
      const { record } = await res.json();
      setRecords(prev => prev.map(r => r.id === id ? record : r));
      setEditingId(null);
    } else {
      const json = await res.json().catch(() => ({}));
      setEditError(json.error || 'Error al guardar');
    }
  }

  async function handleDelete(r: BillingRecord) {
    if (!window.confirm(`¿Borrar el pago de ${formatCOP(r.monto)} (${formatPeriodo(r.periodo)})? Esta acción no se puede deshacer.`)) return;
    setDeletingId(r.id);
    const res = await fetch(`/api/clubs/${detail.slug}/billing/${r.id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (res.ok) {
      setRecords(prev => prev.filter(x => x.id !== r.id));
    } else {
      const json = await res.json().catch(() => ({}));
      alert(json.error || 'Error al borrar');
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/8 bg-white/2 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Plan actual</p>
          <p className="text-lg font-bold text-white capitalize">{detail.config.plan}</p>
          {planPrice > 0 && <p className="text-xs text-gray-600 mt-0.5">{formatCOP(planPrice)}/mes</p>}
        </div>
        <div className="rounded-xl border border-white/8 bg-white/2 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total cobrado</p>
          <p className="text-lg font-bold text-white">{formatCOP(totalCollected)}</p>
          <p className="text-xs text-gray-600 mt-0.5">{records.length} pagos registrados</p>
        </div>
        <div className={`rounded-xl border p-4 ${paidThisMonth ? 'border-green-500/20 bg-green-500/5' : 'border-yellow-500/20 bg-yellow-500/5'}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Mes actual</p>
          <p className={`text-lg font-bold ${paidThisMonth ? 'text-green-400' : 'text-yellow-400'}`}>
            {paidThisMonth ? 'Pagado' : 'Sin pago'}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">{formatPeriodo(currentPeriodo)}</p>
        </div>
      </div>

      {/* Header + add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Historial de suscripción
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowBoldForm(v => !v); setBoldResult(null); setBoldError(''); }}
            className="flex items-center gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            {showBoldForm ? <X className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
            {showBoldForm ? 'Cancelar' : 'Generar link Bold'}
          </button>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? 'Cancelar' : 'Registrar pago'}
          </button>
        </div>
      </div>

      {/* Generador de link Bold */}
      {showBoldForm && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
          <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Generar link de pago Bold</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Período</label>
              <input
                type="month"
                value={boldPeriodo}
                onChange={e => setBoldPeriodo(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Monto (plan {detail.config.plan}: {formatCOP(planPrice)})</label>
              <input
                type="number"
                value={boldMontoOverride}
                onChange={e => setBoldMontoOverride(e.target.value)}
                placeholder={String(planPrice)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={boldActivarPlan} onChange={e => setBoldActivarPlan(e.target.checked)} />
            Activar plan automáticamente al confirmarse el pago
          </label>
          {boldActivarPlan && (
            <select
              value={boldPlanSolicitado}
              onChange={e => setBoldPlanSolicitado(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
            >
              {['starter', 'pro', 'scale'].map(p => <option key={p} value={p} className="bg-[#0F1219]">{p}</option>)}
            </select>
          )}
          {boldError && <p className="text-red-400 text-xs">{boldError}</p>}
          {boldResult ? (
            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
              <CircleDollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-gray-300 truncate flex-1">{boldResult.bold_link_url}</span>
              <button
                onClick={() => copyLink(boldResult.bold_link_url!)}
                className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 shrink-0"
              >
                <Copy className="w-3.5 h-3.5" /> {copied === boldResult.bold_link_url ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerarLinkBold}
              disabled={boldGenerating}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
            >
              {boldGenerating ? 'Generando…' : 'Generar link'}
            </button>
          )}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
          <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider">Nuevo pago de suscripción</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Período *</label>
              <input
                type="month"
                value={form.periodo}
                onChange={e => setField('periodo', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Monto *</label>
              <input
                type="number"
                value={form.monto}
                onChange={e => setField('monto', e.target.value)}
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Método</label>
              <select
                value={form.metodo}
                onChange={e => setField('metodo', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
              >
                {METODOS.map(m => <option key={m} value={m} className="bg-[#0F1219]">{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Referencia</label>
              <input
                type="text"
                value={form.referencia}
                onChange={e => setField('referencia', e.target.value)}
                placeholder="# transferencia"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Notas internas</label>
            <input
              type="text"
              value={form.notas}
              onChange={e => setField('notas', e.target.value)}
              placeholder="Opcional"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar pago'}
          </button>
        </div>
      )}

      {/* Records table */}
      {records.length === 0 ? (
        <div className="rounded-xl border border-white/8 py-14 text-center text-gray-600 text-sm">
          Sin pagos de suscripción registrados
        </div>
      ) : (
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/3 border-b border-white/8">
              <tr>
                {['Período', 'Monto', 'Método', 'Estado', 'Referencia', 'Registrado por', 'Fecha', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {records.map(r => (
                editingId === r.id ? (
                  <tr key={r.id} className="bg-indigo-500/5">
                    <td className="px-4 py-2">
                      <input type="month" value={editForm.periodo} onChange={e => setEditForm(f => ({ ...f, periodo: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500/50" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={editForm.monto} onChange={e => setEditForm(f => ({ ...f, monto: e.target.value }))}
                        className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500/50" />
                    </td>
                    <td className="px-4 py-2">
                      <select value={editForm.metodo} onChange={e => setEditForm(f => ({ ...f, metodo: e.target.value }))}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500/50">
                        {METODOS.map(m => <option key={m} value={m} className="bg-[#0F1219]">{m}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={editForm.referencia} onChange={e => setEditForm(f => ({ ...f, referencia: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500/50" />
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">—</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{r.recorded_by}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => saveEdit(r.id)} disabled={editSaving} title="Guardar"
                          className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)} title="Cancelar"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-white/5 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {editError && <p className="text-red-400 text-[10px] mt-1">{editError}</p>}
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-gray-200 font-medium">{formatPeriodo(r.periodo)}</td>
                    <td className="px-4 py-3 text-white font-bold">{formatCOP(r.monto)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs capitalize">{r.metodo}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        r.estado === 'pagado' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {r.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs font-mono">{r.referencia || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{r.recorded_by}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {r.metodo === 'bold' && r.estado === 'pendiente' && r.bold_link_url && (
                          <button onClick={() => copyLink(r.bold_link_url!)} title="Copiar link de pago"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => startEdit(r)} title="Editar"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(r)} disabled={deletingId === r.id} title="Borrar"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
