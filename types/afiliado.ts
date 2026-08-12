export type AfiliadoTier = 'bronce' | 'plata' | 'oro';
export type AfiliadoEstado = 'activo' | 'pendiente_pago' | 'inactivo' | 'vencido';

export interface Afiliado {
  id: string;
  nombre: string;
  categoria: string | null;
  descripcion: string | null;
  logo_url: string | null;
  link_web: string | null;
  ciudad: string | null;
  tier: AfiliadoTier;
  precio_mensual: number | null;
  estado: AfiliadoEstado;
  fecha_inicio: string | null;
  fecha_vencimiento: string | null;
  notas: string | null;
  created_at: string;
}

export interface AfiliadoBillingRecord {
  id: string;
  afiliado_id: string;
  afiliado_nombre: string | null;
  monto: number;
  periodo: string;
  metodo: string;
  estado: 'pendiente' | 'pagado';
  bold_link_id?: string | null;
  bold_link_url?: string | null;
  bold_reference?: string | null;
  referencia?: string | null;
  notas?: string | null;
  recorded_by: string;
  created_at: string;
}

export interface AfiliadoFullDetail extends Afiliado {
  billing_records: AfiliadoBillingRecord[];
}
