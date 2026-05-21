'use client';
import { useEffect, useState, useCallback } from 'react';
import { MessageCircle, RefreshCw, CheckCircle2, Clock, Search, Users } from 'lucide-react';

interface Lead {
  id: string;
  nombre: string;
  whatsapp: string;
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

  const load = useCallback(async () => {
    setLoading(true);
    const param = filter === 'pending' ? '?convertido=false' : filter === 'converted' ? '?convertido=true' : '';
    const res  = await fetch(`/api/leads${param}`);
    const json = await res.json();
    setLeads(json.leads || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const markConverted = async (id: string, value: boolean) => {
    setUpdating(id);
    await fetch('/api/leads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, convertido: value }) });
    setUpdating(null);
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
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500 text-sm">Cargando leads…</div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Users className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No hay leads {filter !== 'all' ? 'en este filtro' : 'aún'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {['Nombre', 'WhatsApp', 'Club', 'Ciudad', 'Plan', 'Fecha', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(lead => (
                <tr key={lead.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${lead.convertido ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-medium text-white">{lead.nombre}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{lead.whatsapp}</td>
                  <td className="px-4 py-3 text-gray-300">{lead.nombre_club || <span className="text-gray-600">—</span>}</td>
                  <td className="px-4 py-3 text-gray-400">{lead.ciudad || <span className="text-gray-600">—</span>}</td>
                  <td className="px-4 py-3">
                    <span style={{ background: `${PLAN_COLOR[lead.plan_interes]}20`, color: PLAN_COLOR[lead.plan_interes], border: `1px solid ${PLAN_COLOR[lead.plan_interes]}40` }}
                      className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize">
                      {lead.plan_interes}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(lead.created_at)}</td>
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
                        onClick={() => markConverted(lead.id, !lead.convertido)}
                        className="px-2 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-50">
                        {lead.convertido ? 'Desmarcar' : '✓ Convertido'}
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
  );
}
