-- Extiende admin_billing para soportar links de pago generados por el propio
-- club (autoservicio, Fase 2 de Bold) en vez de por un admin de Zenpra.
-- plan_solicitado guarda qué plan pidió activar el club al generar el link.
-- NULL cuando el link lo genera un admin manualmente — en ese caso el pago
-- no debe disparar ningún cambio de plan automático.
alter table admin_billing add column if not exists plan_solicitado text;
