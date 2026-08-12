'use client';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Afiliado, AfiliadoEstado, AfiliadoTier } from '@/types/afiliado';

interface Props {
  afiliado: Afiliado;
  onUpdated: (patch: Partial<Afiliado>) => void;
}

const TIERS: AfiliadoTier[] = ['bronce', 'plata', 'oro'];
const ESTADOS: AfiliadoEstado[] = ['activo', 'pendiente_pago', 'inactivo', 'vencido'];

export function AfiliadoInfoTab({ afiliado, onUpdated }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: afiliado.nombre || '',
    categoria: afiliado.categoria || '',
    descripcion: afiliado.descripcion || '',
    logo_url: afiliado.logo_url || '',
    link_web: afiliado.link_web || '',
    ciudad: afiliado.ciudad || '',
    tier: afiliado.tier,
    estado: afiliado.estado,
    precio_mensual: afiliado.precio_mensual != null ? String(afiliado.precio_mensual) : '',
    fecha_vencimiento: afiliado.fecha_vencimiento || '',
    notas: afiliado.notas || '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave() {
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return; }
    setSaving(true);
    setError('');
    const body = {
      ...form,
      precio_mensual: form.precio_mensual === '' ? null : Number(form.precio_mensual),
      fecha_vencimiento: form.fecha_vencimiento || null,
    };
    const res = await fetch(`/api/afiliados/${afiliado.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(json.error || 'Error al guardar'); return; }
    onUpdated(json.afiliado);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleDelete() {
    if (!window.confirm(`¿Borrar el afiliado "${afiliado.nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/afiliados/${afiliado.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) {
      router.push('/afiliados');
    } else {
      const json = await res.json().catch(() => ({}));
      alert(json.error || 'Error al borrar');
    }
  }

  const field = 'block text-xs text-gray-500 mb-1 uppercase tracking-wider';
  const inp = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50';

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={field}>Nombre *</label>
          <input value={form.nombre} onChange={e => set('nombre', e.target.value)} className={inp} />
        </div>
        <div>
          <label className={field}>Categoría</label>
          <input value={form.categoria} onChange={e => set('categoria', e.target.value)} className={inp} placeholder="ej. Tienda deportiva" />
        </div>
        <div>
          <label className={field}>Ciudad</label>
          <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)} className={inp} />
        </div>
        <div className="col-span-2">
          <label className={field}>Descripción (visible en el directorio público)</label>
          <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} className={inp} rows={2} />
        </div>
        <div>
          <label className={field}>URL del logo</label>
          <input value={form.logo_url} onChange={e => set('logo_url', e.target.value)} className={inp} placeholder="https://..." />
        </div>
        <div>
          <label className={field}>Sitio web / redes</label>
          <input value={form.link_web} onChange={e => set('link_web', e.target.value)} className={inp} placeholder="https://..." />
        </div>
        <div>
          <label className={field}>Tier</label>
          <select value={form.tier} onChange={e => set('tier', e.target.value as AfiliadoTier)} className={inp}>
            {TIERS.map(t => <option key={t} value={t} className="bg-[#0F1219] capitalize">{t}</option>)}
          </select>
        </div>
        <div>
          <label className={field}>Estado</label>
          <select value={form.estado} onChange={e => set('estado', e.target.value as AfiliadoEstado)} className={inp}>
            {ESTADOS.map(e => <option key={e} value={e} className="bg-[#0F1219]">{e}</option>)}
          </select>
        </div>
        <div>
          <label className={field}>Precio mensual (COP)</label>
          <input type="number" value={form.precio_mensual} onChange={e => set('precio_mensual', e.target.value)} className={inp} placeholder="99000" />
        </div>
        <div>
          <label className={field}>Fecha de vencimiento</label>
          <input type="date" value={form.fecha_vencimiento} onChange={e => set('fecha_vencimiento', e.target.value)} className={inp} />
        </div>
        <div className="col-span-2">
          <label className={field}>Notas internas</label>
          <textarea value={form.notas} onChange={e => set('notas', e.target.value)} className={inp} rows={2} placeholder="Nunca se muestra públicamente" />
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}
      {saved && <p className="text-green-400 text-xs">✓ Guardado</p>}

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" /> {deleting ? 'Borrando…' : 'Borrar afiliado'}
        </button>
      </div>
    </div>
  );
}
