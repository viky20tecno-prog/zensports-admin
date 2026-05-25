-- Tabla para registrar los pagos de suscripción ZenSports recibidos de cada club
-- Ejecutar en Supabase SQL Editor

create table if not exists admin_billing (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid references clubs(id) on delete cascade not null,
  club_slug   text not null,
  monto       bigint not null,
  periodo     text not null,       -- formato 'YYYY-MM'
  metodo      text not null default 'transferencia',
  referencia  text,
  notas       text,
  recorded_by text not null,       -- email del admin que registró
  created_at  timestamptz not null default now()
);

create index if not exists admin_billing_club_id_idx on admin_billing(club_id);
create index if not exists admin_billing_periodo_idx  on admin_billing(periodo);

-- RLS: solo service_role accede (el admin console usa service_role key)
alter table admin_billing enable row level security;
