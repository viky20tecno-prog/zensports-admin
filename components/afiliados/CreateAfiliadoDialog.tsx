'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AFILIADO_TIER_PRICE } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIAS_SUGERIDAS = ['Tienda deportiva', 'Salud/Fisioterapia', 'Alimentación', 'Seguros', 'Otro'];
const TIERS = ['bronce', 'plata', 'oro'] as const;

const INITIAL = {
  nombre: '',
  categoria: '',
  ciudad: '',
  tier: 'bronce' as (typeof TIERS)[number],
  link_web: '',
  logo_url: '',
  descripcion: '',
};

export function CreateAfiliadoDialog({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field: keyof typeof INITIAL, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return; }
    setError('');
    setLoading(true);
    const res = await fetch('/api/afiliados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(json.error || 'Error creando afiliado'); return; }
    setForm(INITIAL);
    onSuccess();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setError(''); setForm(INITIAL); onClose(); } }}>
      <DialogContent className="bg-[#0F1219] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Nuevo afiliado</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 max-h-[65vh] overflow-y-auto pr-1">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Nombre *</label>
            <Input value={form.nombre} onChange={e => set('nombre', e.target.value)}
              placeholder="ej. Deportes Total"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-9" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Categoría</label>
              <select
                value={form.categoria}
                onChange={e => set('categoria', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 h-9 text-sm text-white outline-none focus:border-indigo-500/50"
              >
                <option value="" className="bg-[#0F1219]">— Elegir —</option>
                {CATEGORIAS_SUGERIDAS.map(c => (
                  <option key={c} value={c} className="bg-[#0F1219]">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Ciudad</label>
              <Input value={form.ciudad} onChange={e => set('ciudad', e.target.value)}
                placeholder="ej. Bogotá"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-9" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Tier</label>
            <div className="grid grid-cols-3 gap-2">
              {TIERS.map(t => (
                <button key={t} type="button" onClick={() => set('tier', t)}
                  className={`py-2 rounded-lg text-xs font-semibold capitalize border transition-colors ${
                    form.tier === t
                      ? 'bg-indigo-600/25 border-indigo-500/40 text-indigo-200'
                      : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-200'
                  }`}
                >
                  {t}
                  <div className="text-[10px] font-normal opacity-70 mt-0.5">
                    {AFILIADO_TIER_PRICE[t].toLocaleString('es-CO')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Sitio web / redes</label>
            <Input value={form.link_web} onChange={e => set('link_web', e.target.value)}
              placeholder="https://..."
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-9" />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">URL del logo</label>
            <Input value={form.logo_url} onChange={e => set('logo_url', e.target.value)}
              placeholder="https://..."
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-9" />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Descripción</label>
            <Input value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              placeholder="Breve descripción para el directorio público"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-9" />
          </div>

          <p className="text-xs text-gray-600">
            El afiliado se crea en estado <strong>Pendiente pago</strong>. Se activa automáticamente cuando se
            confirma el primer pago (link Bold) o manualmente cambiando el estado.
          </p>

          {error && <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">Cancelar</Button>
          <Button onClick={handleCreate} disabled={loading || !form.nombre.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white">
            {loading ? 'Creando...' : 'Crear afiliado'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
