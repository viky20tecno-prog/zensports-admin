import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { canAccess } from '@/lib/rbac';
import { AfiliadosTable } from '@/components/afiliados/AfiliadosTable';
import type { Afiliado } from '@/types/afiliado';

async function getAfiliados(): Promise<Afiliado[]> {
  const { data } = await adminDb.from('afiliados').select('*').order('created_at', { ascending: false });
  return (data || []) as Afiliado[];
}

export default async function AfiliadosPage() {
  const session = await getAdminSession();
  if (!session) redirect('/login');
  if (!canAccess(session.role, 'manage_billing')) redirect('/dashboard');

  const afiliados = await getAfiliados();
  const activos = afiliados.filter(a => a.estado === 'activo').length;
  const pendientes = afiliados.filter(a => a.estado === 'pendiente_pago').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Afiliados</h2>
        <p className="text-sm text-gray-500 mt-1">
          {afiliados.length} afiliados registrados · {activos} activos · {pendientes} pendientes de pago
        </p>
      </div>

      <AfiliadosTable initialAfiliados={afiliados} />
    </div>
  );
}
