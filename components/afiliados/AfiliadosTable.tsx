'use client';
import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { AfiliadoStatusBadge, AfiliadoTierBadge } from './AfiliadoStatusBadge';
import { CreateAfiliadoDialog } from './CreateAfiliadoDialog';
import type { Afiliado, AfiliadoEstado } from '@/types/afiliado';

const ESTADO_FILTER: { value: '' | AfiliadoEstado; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'activo', label: 'Activos' },
  { value: 'pendiente_pago', label: 'Pendiente pago' },
  { value: 'vencido', label: 'Vencidos' },
  { value: 'inactivo', label: 'Inactivos' },
];

interface Props {
  initialAfiliados: Afiliado[];
}

export function AfiliadosTable({ initialAfiliados }: Props) {
  const [afiliados, setAfiliados] = useState(initialAfiliados);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'' | AfiliadoEstado>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (estadoFilter) params.set('estado', estadoFilter);
    if (search) params.set('search', search);
    const res = await fetch(`/api/afiliados?${params}`);
    const json = await res.json().catch(() => ({}));
    setAfiliados(json.afiliados || []);
    setLoading(false);
  }, [estadoFilter, search]);

  const filtered = useMemo(() => {
    let rows = afiliados;
    if (estadoFilter) rows = rows.filter(a => a.estado === estadoFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(a => a.nombre.toLowerCase().includes(q) || (a.ciudad || '').toLowerCase().includes(q));
    }
    return rows;
  }, [afiliados, estadoFilter, search]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px] sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <Input
            placeholder="Buscar afiliado o ciudad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-8 text-sm w-full"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ESTADO_FILTER.map(f => (
            <button key={f.value} onClick={() => setEstadoFilter(f.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                estadoFilter === f.value
                  ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300'
                  : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-200 hover:bg-white/8'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        {loading && <span className="text-xs text-gray-500 animate-pulse">Actualizando...</span>}
        <div className="sm:ml-auto">
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-600/20 text-xs text-indigo-300 hover:text-white hover:bg-indigo-600/40 transition-colors font-medium">
            <Plus className="w-3.5 h-3.5" /> Nuevo afiliado
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/8 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-white/3 border-b border-white/8">
            <tr>
              {['Afiliado', 'Categoría', 'Tier', 'Estado', 'Vencimiento', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-600 text-sm">
                  No hay afiliados que coincidan con el filtro
                </td>
              </tr>
            ) : (
              filtered.map(a => (
                <tr key={a.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/afiliados/${a.id}`} className="group block">
                      <div className="font-medium text-white text-sm group-hover:text-indigo-300 transition-colors">{a.nombre}</div>
                      <div className="text-xs text-gray-500">{a.ciudad || '—'}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{a.categoria || '—'}</td>
                  <td className="px-4 py-3"><AfiliadoTierBadge tier={a.tier} /></td>
                  <td className="px-4 py-3"><AfiliadoStatusBadge estado={a.estado} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{a.fecha_vencimiento ? formatDate(a.fecha_vencimiento) : '—'}</td>
                  <td className="px-4 py-3">
                    <Link href={`/afiliados/${a.id}`} className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                      Ver detalle →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600">{filtered.length} afiliados mostrados</p>

      <CreateAfiliadoDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={refresh}
      />
    </div>
  );
}
