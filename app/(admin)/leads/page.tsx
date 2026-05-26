'use client';
import { useEffect, useState, useCallback } from 'react';
import { MessageCircle, RefreshCw, CheckCircle2, Clock, Search, Users, X, Send, Trash2 } from 'lucide-react';

interface Lead {
  id: string;
  nombre: string;
  whatsapp: string;
  email: string | null;
  nombre_club: string | null;
  ciudad: string | null;
  plan_interes: string;
  fuente: string;
  convertido: boolean;
  club_slug: string | null;
  notas: string | null;
  created_at: string;
}

const PLAN_COLOR: Record<string, string> = {
  free: '#6B7280', starter: '#3B82F6', pro: '#8B5CF6', scale: '#C678FF', enterprise: '#F59E0B',
};

function fmt(dt: string) {
  return new Date(dt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function LeadsPage() {
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<'all' | 'pending' | 'converted'>('all');
  const [search, setSearch]     = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [sendModal, setSendModal] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const param = filter === 'pending' ? '?convertido=false' : filter === 'converted' ? '?convertido=true' : '';
    const res  = await fetch(`/api/leads${param}`);
    const json = await res.json();
    setLeads(json.leads || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const markConverted = async (lead: Lead, value: boolean) => {
    setUpdating(lead.id);
    await fetch('/api/leads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: lead.id, convertido: value }) });
    setUpdating(null);
    load();
    if (value) setSendModal(lead);
  };

  const registroLink = (lead: Lead) => {
    const base = 'https://zensports.zenpra.ai/registro';
    const params = new URLSearchParams({
      nombre: lead.nombre_club || lead.nombre,
      plan:   lead.plan_interes,
      wa:     lead.whatsapp,
    });
    return `${base}?${params.toString()}`;
  };

  const waRegistro = (lead: Lead) => {
    const link = registroLink(lead);
    const msg = `¡Hola ${lead.nombre}! 👋 Fue un placer hablar contigo.\n\nAquí está tu enlace para activar tu prueba gratuita de 5 días en ZenSports 🚀\n\n👉 ${link}\n\nEs rápido, sin tarjeta de crédito. Cualquier duda estoy aquí. ¡Bienvenido al equipo! 🏆`;
    return `https://wa.me/57${lead.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`;
  };

  const deleteLead = async (id: string) => {
    if (!confirm('¿Eliminar este lead?')) return;
    setDeleting(id);
    await fetch(`/api/leads?id=${id}`, { method: 'DELETE' });
    setDeleting(null);
    load();
  };

  const waLink = (wa: string, nombre: string, plan: string) => {
    const msg = encodeURIComponent(`Hola ${nombre}, vi que te interesó ZenSports (plan ${plan}). ¿Te puedo ayudar a configurar tu club? 🚀`);
    return `https://wa.me/57${wa.replace(/\D/g,'')}?text=${msg}`;
  };

  const visible = leads.filter(l =>
    !search || [l.nombre, l.nombre_club, l.whatsapp, l.ciudad].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const pendientes  = leads.filter(l => !l.convertido).length;
  const convertidos = leads.filter(l => l.convertido).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-gray-400 text-sm mt-0.5">Clubes interesados que dejaron sus datos en la landing</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white text-sm transition-colors">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total leads', value: leads.length, icon: Users, color: 'text-blue-400' },
          { label: 'Pendientes', value: pendientes, icon: Clock, color: 'text-yellow-400' },
          { label: 'Convertidos', value: convertidos, icon: CheckCircle2, color: 'text-green-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#0F1219] border border-white/8 rounded-xl p-4 flex items-center gap-3">
            <Icon className={`w-5 h-5 ${color} shrink-0`} />
            <div>
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex gap-3 flex-wrap">
        {(['all', 'pending', 'converted'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}>
            {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : 'Convertidos'}
          </button>
        ))}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 ml-auto">
          <Search className="w-3.5 h-3.5 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…"
            className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-40" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0F1219] border border-white/8 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500 text-sm">Cargando leads…</div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Users className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No hay leads {filter !== 'all' ? 'en este filtro' : 'aún'}</p>
          </div>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {[
                  { label: 'Nombre',    cls: '' },
                  { label: 'WhatsApp',  cls: '' },
                  { label: 'Email',     cls: 'hidden md:table-cell' },
                  { label: 'Club',      cls: '' },
                  { label: 'Ciudad',    cls: 'hidden sm:table-cell' },
                  { label: 'Plan',      cls: '' },
                  { label: 'Fecha',     cls: 'hidden lg:table-cell' },
                  { label: 'Estado',    cls: '' },
                  { label: '',          cls: '' },
                ].map(({ label, cls }) => (
                  <th key={label} className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${cls}`}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(lead => (
                <tr key={lead.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${lead.convertido ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-medium text-white">{lead.nombre}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs whitespace-nowrap">{lead.whatsapp}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell max-w-[160px] truncate">{lead.email || <span className="text-gray-600">—</span>}</td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{lead.nombre_club || <span className="text-gray-600">—</span>}</td>
                  <td className="px-4 py-3 text-gray-400 hidden sm:table-cell whitespace-nowrap">{lead.ciudad || <span className="text-gray-600">—</span>}</td>
                  <td className="px-4 py-3">
                    <span style={{ background: `${PLAN_COLOR[lead.plan_interes]}20`, color: PLAN_COLOR[lead.plan_interes], border: `1px solid ${PLAN_COLOR[lead.plan_interes]}40` }}
                      className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize">
                      {lead.plan_interes}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap hidden lg:table-cell">{fmt(lead.created_at)}</td>
                  <td className="px-4 py-3">
                    {lead.convertido
                      ? <span className="flex items-center gap-1 text-green-400 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Convertido</span>
                      : <span className="flex items-center gap-1 text-yellow-400 text-xs font-medium"><Clock className="w-3.5 h-3.5" /> Pendiente</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a href={waLink(lead.whatsapp, lead.nombre, lead.plan_interes)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        style={{ background: 'rgba(37,211,102,0.10)', color: '#25D366', border: '1px solid rgba(37,211,102,0.30)' }}>
                        <MessageCircle className="w-3.5 h-3.5" /> Contactar
                      </a>
                      <button
                        disabled={updating === lead.id}
                        onClick={() => markConverted(lead, !lead.convertido)}
                        className="px-2 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-50">
                        {lead.convertido ? 'Desmarcar' : '✓ Convertido'}
                      </button>
                      <button
                        disabled={deleting === lead.id}
                        onClick={() => deleteLead(lead.id)}
                        className="px-2 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      </div>

      {/* Modal envío enlace de registro */}
      {sendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSendModal(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-[#0F1219] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSendModal(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>

            <div className="mb-5">
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1 text-xs font-bold text-green-400 uppercase tracking-wide mb-3">
                <CheckCircle2 className="w-3.5 h-3.5" /> Lead convertido
              </div>
              <h3 className="text-white font-bold text-lg">Enviar enlace de registro</h3>
              <p className="text-gray-400 text-sm mt-1">
                Envía el enlace a <span className="text-white font-semibold">{sendModal.nombre}</span> para que active su prueba gratuita.
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-3 mb-5 text-xs text-gray-300 leading-relaxed border border-white/8">
              <p className="text-gray-500 text-[10px] uppercase tracking-wide font-bold mb-2">Vista previa del mensaje</p>
              ¡Hola {sendModal.nombre}! 👋 Fue un placer hablar contigo.<br /><br />
              Aquí está tu enlace para activar tu prueba gratuita de 5 días 🚀<br />
              <span className="text-indigo-400 break-all">{registroLink(sendModal)}</span><br /><br />
              Sin tarjeta de crédito. ¡Bienvenido! 🏆
            </div>

            <a
              href={waRegistro(sendModal)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setSendModal(null)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.35)' }}
            >
              <Send className="w-4 h-4" /> Enviar por WhatsApp
            </a>
            <button onClick={() => setSendModal(null)} className="w-full mt-2 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Cerrar sin enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
