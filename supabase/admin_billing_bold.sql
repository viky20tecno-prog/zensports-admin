-- Extiende admin_billing para soportar cobro club→Zenpra vía link de pago Bold
-- Aditivo: no toca filas existentes (quedan en estado 'pagado', que ya eran).
-- Ejecutar en Supabase SQL Editor.

alter table admin_billing add column if not exists estado text not null default 'pagado';
alter table admin_billing add column if not exists bold_link_id text;
alter table admin_billing add column if not exists bold_link_url text;
alter table admin_billing add column if not exists bold_reference text;

create index if not exists admin_billing_estado_idx on admin_billing(estado);
create index if not exists admin_billing_bold_reference_idx on admin_billing(bold_reference);
