export type ClubStatus = 'active' | 'trial' | 'suspended' | 'expired';
export type ClubPlan = 'trial' | 'starter' | 'pro' | 'scale' | 'total';

export interface ClubModules {
  jugadores?: boolean;
  uniformes?: boolean;
  torneos?: boolean;
  arbitraje?: boolean;
  cobro?: boolean;
  whatsapp?: boolean;
  conciliacion?: boolean;
  finanzas?: boolean;
  [key: string]: boolean | undefined;
}

export interface ClubConfig {
  nombre: string;
  ciudad?: string;
  valor_mensualidad?: number;
  color?: string;
  subtitulo?: string;
  logo_url?: string;
  codigo_pais?: string;
  plan: ClubPlan;
  trial_ends_at?: string;
  modulos?: ClubModules;
  onboarding_completed?: boolean;
  whatsapp?: string;
  celular_admin?: string;
  dias_gracia_mora?: number;
  penalidad_mora?: number;
  categorias_jugadores?: string[];
  redes_sociales?: Record<string, string>;
  deporte?: string;
  deportes?: string[];
  celulares_staff?: string[];
}

export interface Club {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  suspended_at?: string | null;
  suspended_reason?: string | null;
  admin_notes?: string | null;
  owner_user_id: string;
  created_at: string;
  config: ClubConfig;
  celular_admin?: string;
}

export interface ClubWithMetrics extends Club {
  player_count: number;
  trial_days_left: number | null;
  health_score: number;
  health_label: 'healthy' | 'warning' | 'inactive';
  status: ClubStatus;
  onboarding_pct: number;
  owner_email?: string;
}


export interface Player {
  id: string;
  cedula: string;
  nombre: string;
  apellidos: string;
  celular?: string;
  activo: boolean;
  created_at: string;
  categoria?: string;
  equipo?: string;
  foto_url?: string;
  posicion?: string;
  numero_camiseta?: string;
}

export interface Pago {
  id: string;
  cedula: string;
  monto: number;
  banco: string;
  concepto: string;
  referencia?: string;
  estado_revision: string;
  tipo_origen?: string;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  admin_email: string;
  action: string;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface BillingRecord {
  id: string;
  club_id: string;
  club_slug: string;
  monto: number;
  periodo: string;
  metodo: string;
  referencia?: string | null;
  notas?: string | null;
  recorded_by: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  club_id: string;
  club_slug: string;
  user_id?: string | null;
  user_email: string;
  user_role?: string | null;
  user_name?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  entity_label?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
}

export interface ClubFullDetail extends ClubWithMetrics {
  players: Player[];
  pagos: Pago[];
  audit_events: AuditEvent[];
  billing_records: BillingRecord[];
  activity_logs: ActivityLog[];
}
