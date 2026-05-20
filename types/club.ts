export type ClubStatus = 'active' | 'trial' | 'suspended' | 'expired';
export type ClubPlan = 'trial' | 'starter' | 'pro' | 'total';

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
}

export interface ClubWithMetrics extends Club {
  player_count: number;
  trial_days_left: number | null;
  health_score: number;
  health_label: 'healthy' | 'warning' | 'inactive';
  status: ClubStatus;
  onboarding_pct: number;
}

export interface ClubDetail extends ClubWithMetrics {
  recent_payments: Payment[];
  audit_events: AuditEvent[];
}

export interface Payment {
  id: string;
  cedula: string;
  monto: number;
  banco: string;
  concepto: string;
  estado_revision: string;
  tipo_origen: string;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  admin_email: string;
  action: string;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  created_at: string;
}
