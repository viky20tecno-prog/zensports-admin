'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ClubFullDetail } from '@/types/club';

interface Props {
  club: ClubFullDetail;
  open: boolean;
  onClose: () => void;
  onSuccess: (patch: Record<string, unknown>) => void;
}

const PRESET_COLORS = [
  '#EF4444','#E14924','#F97316','#EAB308','#22C55E',
  '#14B8A6','#00AAFF','#3B82F6','#8B5CF6','#EC4899','#64748B',
];

export function EditClubConfigDialog({ club, open, onClose, onSuccess }: Props) {
  const cfg = club.config;

  const [nombre,    setNombre]    = useState(cfg.nombre      || '');
  const [subtitulo, setSubtitulo] = useState(cfg.subtitulo   || '');
  const [ciudad,    setCiudad]    = useState(cfg.ciudad      || '');
  const [color,     setColor]     = useState(cfg.color       || '#E14924');
  const [logoUrl,   setLogoUrl]   = useState(cfg.logo_url    || '');
  const [whatsapp,    setWhatsapp]    = useState(cfg.whatsapp     || '');
  const [wahaSession, setWahaSession] = useState(cfg.waha_session || '');
  const [mensualidad, setMensualidad] = useState(String(cfg.valor_mensualidad || ''));

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSave() {
    if (!nombre.trim()) { setError('El nombre del club es obligatorio'); return; }
    setLoading(true);
    setError('');

    const body: Record<string, unknown> = {
      nombre:            nombre.trim(),
      subtitulo:         subtitulo.trim(),
      ciudad:            ciudad.trim(),
      color,
      logo_url:          logoUrl.trim() || null,
      whatsapp:          whatsapp.trim(),
      waha_session:      wahaSession.trim() || null,
      valor_mensualidad: mensualidad ? parseInt(mensualidad.replace(/\D/g, ''), 10) : null,
    };

    const res = await fetch(`/api/clubs/${club.slug}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) { setError('Error al guardar'); return; }
    onSuccess(body);
    onClose();
  }

  const field = 'block text-xs text-gray-400 mb-1 uppercase tracking-wider';
  const inp   = 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-indigo-500';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0F1219] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Editar config — {club.slug}</DialogTitle>
          <p className="text-xs text-yellow-400/80 mt-1">
            ⚠️ Solo edita campos de identidad. Plan, módulos y datos de jugadores no se tocan.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
          {/* Nombre */}
          <div>
            <label className={field}>Nombre del club *</label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: City FC" className={inp} />
          </div>

          {/* Subtítulo */}
          <div>
            <label className={field}>Subtítulo / categoría</label>
            <Input value={subtitulo} onChange={e => setSubtitulo(e.target.value)}
              placeholder="Ej: Fútbol 7 · Masculino" className={inp} />
          </div>

          {/* Ciudad */}
          <div>
            <label className={field}>Ciudad</label>
            <Input value={ciudad} onChange={e => setCiudad(e.target.value)}
              placeholder="Ej: Bogotá" className={inp} />
          </div>

          {/* Color */}
          <div>
            <label className={field}>Color del club</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  style={{ background: c }}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    color === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                />
              ))}
              <label className="w-7 h-7 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center cursor-pointer overflow-hidden relative">
                <span className="text-white/40 text-xs">+</span>
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              </label>
              <span className="text-xs font-mono text-gray-400">{color}</span>
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className={field}>URL del logo</label>
            <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)}
              placeholder="https://..." className={inp} />
            {logoUrl && (
              <img src={logoUrl} alt="Preview" className="mt-2 h-10 w-10 rounded object-contain border border-white/10" />
            )}
          </div>

          {/* WhatsApp */}
          <div>
            <label className={field}>WhatsApp admin (con código de país)</label>
            <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ''))}
              placeholder="573001234567" type="tel" className={inp} />
          </div>

          {/* Sesión WAHA */}
          <div>
            <label className={field}>Sesión WhatsApp plantillas (WAHA)</label>
            <Input value={wahaSession} onChange={e => setWahaSession(e.target.value.trim())}
              placeholder="city-fc (vacío = número central ZenSports)" className={inp} />
            <p className="text-xs text-gray-500 mt-1">Nombre de la sesión WAHA del club para enviar plantillas masivas desde su propio número.</p>
          </div>

          {/* Mensualidad */}
          <div>
            <label className={field}>Valor mensualidad</label>
            <Input value={mensualidad}
              onChange={e => setMensualidad(e.target.value.replace(/\D/g, ''))}
              placeholder="65000" type="text" inputMode="numeric" className={inp} />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !nombre.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white">
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
