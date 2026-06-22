import { formatCOP, formatDate } from '@/lib/utils';
import type { Pago } from '@/types/club';

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  aprobado_manual:  { label: 'Aprobado',  color: 'bg-green-500/10 text-green-400' },
  pendiente:        { label: 'Pendiente', color: 'bg-yellow-500/10 text-yellow-400' },
  rechazado:        { label: 'Rechazado', color: 'bg-red-500/10 text-red-400' },
};

interface Props { pagos: Pago[] }

export function PaymentsTab({ pagos }: Props) {
  if (pagos.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 py-16 text-center text-gray-600 text-sm">
        Este club no tiene pagos registrados
      </div>
    );
  }

  const total = pagos.reduce((s, p) => s + p.monto, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">{pagos.length} pagos · últimos 50</span>
        <span className="text-gray-300 font-medium">Total: {formatCOP(total)}</span>
      </div>
      <div className="rounded-xl border border-white/8 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-white/3 border-b border-white/8">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Cédula</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Banco</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Referencia</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pagos.map(p => {
              const estado = ESTADO_LABELS[p.estado_revision] ?? { label: p.estado_revision, color: 'bg-gray-500/10 text-gray-400' };
              return (
                <tr key={p.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{p.cedula}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs capitalize">{p.concepto}</td>
                  <td className="px-4 py-3 text-white text-sm font-medium whitespace-nowrap">{formatCOP(p.monto)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{p.banco}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs font-mono hidden lg:table-cell">{p.referencia || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estado.color}`}>
                      {estado.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{formatDate(p.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
