import { formatDate } from '@/lib/utils';
import type { Player } from '@/types/club';

interface Props { players: Player[] }

export function PlayersTab({ players }: Props) {
  if (players.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 py-16 text-center text-gray-600 text-sm">
        Este club no tiene jugadores registrados aún
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/8 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-white/3 border-b border-white/8">
          <tr>
            {['Jugador', 'Cédula', 'Categoría', 'Posición', 'Estado', 'Registro'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {players.map(p => (
            <tr key={p.id} className="hover:bg-white/3 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {p.foto_url ? (
                    <img src={p.foto_url} alt="" className="w-7 h-7 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-gray-400 font-medium">
                      {p.nombre?.charAt(0) ?? '?'}
                    </div>
                  )}
                  <div>
                    <div className="text-white text-sm font-medium">{p.nombre} {p.apellidos}</div>
                    {p.celular && <div className="text-xs text-gray-600">{p.celular}</div>}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs">{p.cedula}</td>
              <td className="px-4 py-3 text-gray-400 text-xs">{p.categoria || '—'}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{p.posicion || '—'}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  p.activo
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-gray-500/10 text-gray-500'
                }`}>
                  {p.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(p.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-2 border-t border-white/5 bg-white/2">
        <p className="text-xs text-gray-600">{players.length} jugadores</p>
      </div>
    </div>
  );
}
