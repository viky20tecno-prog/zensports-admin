import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getAdminSession } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { canAccess } from '@/lib/rbac';
import { AfiliadoStatusBadge, AfiliadoTierBadge } from '@/components/afiliados/AfiliadoStatusBadge';
import { AfiliadoDetailTabs } from '@/components/afiliados/AfiliadoDetailTabs';
import type { Afiliado, AfiliadoBillingRecord, AfiliadoFullDetail } from '@/types/afiliado';

async function getAfiliadoDetail(id: string): Promise<AfiliadoFullDetail | null> {
  const { data: afiliado, error } = await adminDb.from('afiliados').select('*').eq('id', id).single();
  if (error || !afiliado) return null;

  const { data: billingRows } = await adminDb
    .from('afiliados_billing')
    .select('*')
    .eq('afiliado_id', id)
    .order('periodo', { ascending: false })
    .limit(24);

  return {
    ...(afiliado as Afiliado),
    billing_records: (billingRows || []) as AfiliadoBillingRecord[],
  };
}

export default async function AfiliadoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect('/login');
  if (!canAccess(session.role, 'manage_billing')) redirect('/dashboard');

  const { id } = await params;
  const detail = await getAfiliadoDetail(id);
  if (!detail) notFound();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/afiliados"
          className="flex items-center gap-1 text-gray-500 hover:text-gray-200 text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Afiliados
        </Link>
        <span className="text-gray-700">/</span>
        <span className="text-sm text-gray-400">{detail.nombre}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {detail.logo_url ? (
            <img
              src={detail.logo_url}
              alt={detail.nombre}
              className="w-14 h-14 rounded-xl object-contain bg-white/5 border border-white/10"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl border border-white/10 bg-indigo-600">
              {detail.nombre.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold text-white tracking-tight">{detail.nombre}</h2>
              <AfiliadoStatusBadge estado={detail.estado} />
              <AfiliadoTierBadge tier={detail.tier} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {detail.categoria || 'Sin categoría'}
              {detail.ciudad ? ` · ${detail.ciudad}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <AfiliadoDetailTabs detail={detail} />
    </div>
  );
}
