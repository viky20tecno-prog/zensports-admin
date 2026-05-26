'use client';
import { useState, useCallback } from 'react';
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel,
  flexRender, type ColumnDef, type SortingState,
} from '@tanstack/react-table';
import Link from 'next/link';
import { Search, ArrowUpDown, Users, Activity, Info, Download, Mail, X, Plus, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ClubStatusBadge } from './ClubStatusBadge';
import { ClubActionsMenu } from './ClubActionsMenu';
import { CreateClubDialog } from './CreateClubDialog';
import { formatDate, formatCOP, PLAN_PRICE } from '@/lib/utils';
import type { ClubWithMetrics } from '@/types/club';
import type { AdminRole } from '@/types/admin';
import { canAccess } from '@/lib/rbac';

const STATUS_FILTER = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'trial', label: 'Trial' },
  { value: 'expired', label: 'Expirados' },
  { value: 'suspended', label: 'Suspendidos' },
];

const HEALTH_COLOR: Record<string, string> = {
  healthy: 'bg-green-500',
  warning: 'bg-yellow-500',
  inactive: 'bg-gray-500',
};

interface Props {
  initialClubs: ClubWithMetrics[];
  role: AdminRole;
}

export function ClubsTable({ initialClubs, role }: Props) {
  const [clubs, setClubs] = useState(initialClubs);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (globalFilter) params.set('search', globalFilter);
    const res = await fetch(`/api/clubs?${params}`);
    const json = await res.json();
    setClubs(json.clubs || []);
    setLoading(false);
  }, [statusFilter, globalFilter]);

  const canChangePlan   = canAccess(role, 'change_plan');
  const canSuspend      = canAccess(role, 'suspend_club');
  const canExtendTrial  = canAccess(role, 'extend_trial');
  const canDelete       = canAccess(role, 'delete_club');
  const canImpersonate  = canAccess(role, 'impersonate');

  function toggleSelect(slug: string) {
    setSelected(prev => { const n = new Set(prev); n.has(slug) ? n.delete(slug) : n.add(slug); return n; });
  }

  function toggleAll(rows: ClubWithMetrics[]) {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map(r => r.slug)));
  }

  async function handleBulkReminder() {
    setBulkBusy(true); setBulkResult('');
    const res = await fetch('/api/clubs/bulk-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send_reminder', slugs: Array.from(selected) }),
    });
    const json = await res.json();
    setBulkResult(`✓ Recordatorio enviado a ${json.succeeded} de ${json.total} clubs`);
    setBulkBusy(false);
    setSelected(new Set());
  }

  function handleExport() {
    window.open('/api/clubs/export', '_blank');
  }

  function handlePDF() {
    const rows = clubs.map(c => `
      <tr>
        <td>${c.config?.nombre || c.slug}</td>
        <td>${c.config?.ciudad || '—'}</td>
        <td style="text-transform:capitalize">${c.config?.plan || 'trial'}</td>
        <td>${c.status}</td>
        <td>${c.player_count}</td>
        <td>${c.created_at?.slice(0,10)}</td>
      </tr>`).join('');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>ZenSports — Clubes</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; padding: 32px; color: #111; }
      h1 { font-size: 20px; margin: 0 0 4px; } p { color: #666; font-size: 13px; margin: 0 0 20px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th { background: #1e1b4b; color: #fff; padding: 10px 12px; text-align: left; font-weight: 600; }
      td { padding: 9px 12px; border-bottom: 1px solid #e5e7eb; }
      tr:nth-child(even) td { background: #f9fafb; }
      @media print { body { padding: 0; } }
    </style></head><body>
    <h1>ZenSports — Reporte de Clubes</h1>
    <p>Generado el ${new Date().toLocaleDateString('es-CO')} · ${clubs.length} clubes</p>
    <table><thead><tr>
      <th>Club</th><th>Ciudad</th><th>Plan</th><th>Estado</th><th>Jugadores</th><th>Creado</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <script>window.onload=()=>{window.print();}<\/script>
    </body></html>`);
    win.document.close();
  }

  const columns: ColumnDef<ClubWithMetrics>[] = [
    {
      id: 'select',
      header: ({ table: t }) => {
        const rows = t.getRowModel().rows.map(r => r.original);
        const allSelected = rows.length > 0 && selected.size === rows.length;
        return (
          <input type="checkbox" checked={allSelected} onChange={() => toggleAll(rows)}
            className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer" />
        );
      },
      cell: ({ row }) => (
        <input type="checkbox" checked={selected.has(row.original.slug)} onChange={() => toggleSelect(row.original.slug)}
          className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer" onClick={e => e.stopPropagation()} />
      ),
    },
    {
      accessorKey: 'config.nombre',
      header: 'Club',
      cell: ({ row }) => {
        const c = row.original;
        return (
          <Link href={`/clubs/${c.slug}`} className="group block">
            <div className="font-medium text-white text-sm group-hover:text-indigo-300 transition-colors">{c.config.nombre}</div>
            <div className="text-xs text-gray-500">{c.slug} · {c.config.ciudad || '—'}</div>
          </Link>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <ClubStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'config.plan',
      header: 'Plan',
      cell: ({ row }) => {
        const plan = row.original.config.plan;
        const price = PLAN_PRICE[plan];
        return (
          <div>
            <span className="text-sm text-gray-200 capitalize">{plan}</span>
            {price > 0 && <span className="text-xs text-gray-500 ml-1">{formatCOP(price)}</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'trial_days_left',
      header: 'Trial',
      cell: ({ row }) => {
        const { trial_days_left: days, status } = row.original;
        if (status === 'active') return <span className="text-gray-600 text-xs">—</span>;
        if (days === null) return <span className="text-gray-500 text-xs">Sin fecha</span>;
        const color = days <= 0 ? 'text-red-400' : days <= 3 ? 'text-yellow-400' : 'text-gray-400';
        return <span className={`text-xs font-medium ${color}`}>{days <= 0 ? 'Expirado' : `${days}d`}</span>;
      },
    },
    {
      accessorKey: 'player_count',
      header: ({ column }) => (
        <button
          title="Número de jugadores registrados en el club"
          className="flex items-center gap-1 text-gray-400 hover:text-white text-xs uppercase tracking-wider"
          onClick={() => column.toggleSorting()}>
          <Users className="w-3 h-3" /><ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ getValue }) => <span className="text-sm text-gray-300">{getValue() as number}</span>,
    },
    {
      accessorKey: 'health_score',
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <button
            className="flex items-center gap-1 text-gray-400 hover:text-white text-xs uppercase tracking-wider"
            onClick={() => column.toggleSorting()}>
            <Activity className="w-3 h-3" /> Health
          </button>
          <span
            title="Puntaje de salud del club (0–100). Se calcula con: onboarding completado (+20), jugadores registrados (+20), plan activo no-trial (+20), WhatsApp configurado (+15), trial vigente (+15), actividad reciente en 14 días (+10). Verde ≥80 · Amarillo ≥50 · Gris <50"
            className="cursor-help">
            <Info className="w-3 h-3 text-gray-600 hover:text-gray-400" />
          </span>
        </div>
      ),
      cell: ({ row }) => {
        const { health_score, health_label } = row.original;
        return (
          <div className="flex items-center gap-2 min-w-[80px]">
            <Progress value={health_score} className="h-1.5 w-16 bg-white/10"
              style={{ '--progress-color': HEALTH_COLOR[health_label] } as React.CSSProperties} />
            <span className="text-xs text-gray-500">{health_score}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'onboarding_pct',
      header: () => (
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Onb.</span>
          <span
            title="Porcentaje del proceso de configuración inicial completado. Pasos: nombre del club, logo, color, WhatsApp, valor mensualidad, y marcar onboarding como completado."
            className="cursor-help">
            <Info className="w-3 h-3 text-gray-600 hover:text-gray-400" />
          </span>
        </div>
      ),
      cell: ({ getValue }) => {
        const v = getValue() as number;
        return <span className={`text-xs font-medium ${v === 100 ? 'text-green-400' : 'text-gray-500'}`}>{v}%</span>;
      },
    },
    {
      id: 'billing',
      header: 'Facturación',
      cell: ({ row }) => {
        const { status, config, trial_days_left } = row.original;
        const plan = config.plan;
        const price = PLAN_PRICE[plan];
        if (status === 'active' && price > 0) {
          return (
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                {formatCOP(price)}/mes
              </span>
            </div>
          );
        }
        if (status === 'trial') {
          const urgent = (trial_days_left ?? 99) <= 3;
          return (
            <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 ${urgent ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20' : 'text-gray-400 bg-white/5 border border-white/10'}`}>
              Trial
            </span>
          );
        }
        if (status === 'expired') {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20 rounded-full px-2 py-0.5">
              Sin pago
            </span>
          );
        }
        return <span className="text-xs text-gray-600">—</span>;
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <button className="flex items-center gap-1 text-gray-400 hover:text-white text-xs uppercase tracking-wider"
          onClick={() => column.toggleSorting()}>
          Creado <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ getValue }) => <span className="text-xs text-gray-500">{formatDate(getValue() as string)}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <ClubActionsMenu
          club={row.original}
          canChangePlan={canChangePlan}
          canSuspend={canSuspend}
          canExtendTrial={canExtendTrial}
          canDelete={canDelete}
          canImpersonate={canImpersonate}
          onRefresh={refresh}
        />
      ),
    },
  ];

  const filtered = statusFilter ? clubs.filter(c => c.status === statusFilter) : clubs;

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _colId, value) => {
      const c = row.original;
      const q = value.toLowerCase();
      return c.config.nombre.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
    },
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <Input
            placeholder="Buscar club o slug..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-8 text-sm"
          />
        </div>
        <div className="flex gap-1.5">
          {STATUS_FILTER.map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === f.value
                  ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300'
                  : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-200 hover:bg-white/8'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        {loading && <span className="text-xs text-gray-500 animate-pulse">Actualizando...</span>}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={handlePDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-600/20 text-xs text-indigo-300 hover:text-white hover:bg-indigo-600/40 transition-colors font-medium">
            <Plus className="w-3.5 h-3.5" /> Crear club
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
          <span className="text-sm font-medium text-indigo-300">{selected.size} seleccionados</span>
          <div className="flex gap-2 ml-2">
            <button onClick={handleBulkReminder} disabled={bulkBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors disabled:opacity-50">
              <Mail className="w-3.5 h-3.5" />
              {bulkBusy ? 'Enviando...' : 'Enviar recordatorio'}
            </button>
          </div>
          {bulkResult && <span className="text-xs text-green-400 ml-2">{bulkResult}</span>}
          <button onClick={() => { setSelected(new Set()); setBulkResult(''); }}
            className="ml-auto text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}


      {/* Table */}
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/3 border-b border-white/8">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-white/5">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-600 text-sm">
                  No hay clubes que coincidan con el filtro
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-white/3 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600">{table.getRowModel().rows.length} clubes mostrados</p>

      <CreateClubDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={refresh}
      />
    </div>
  );
}
