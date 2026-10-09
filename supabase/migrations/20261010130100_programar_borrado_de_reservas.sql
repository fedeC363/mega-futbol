-- =====================================================================
-- Mega Futbol - Programar el borrado diario de reservas viejas
--
-- pg_cron corre dentro de la base, no hace falta un servicio aparte.
-- Una vez por dia alcanza: el plazo es de 15 dias, no importa a que
-- hora exacta se borra.
--
-- 04:15 UTC = 01:15 en Buenos Aires (pg_cron programa en UTC), que es
-- el horario con menos movimiento: el ultimo turno termina 23:00.
-- =====================================================================

create extension if not exists pg_cron;

-- Idempotente: si la migracion se reaplica, primero saca el job viejo.
do $$
begin
  if exists (select 1 from cron.job j where j.jobname = 'borrar-reservas-vencidas') then
    perform cron.unschedule('borrar-reservas-vencidas');
  end if;
end;
$$;

select cron.schedule(
  'borrar-reservas-vencidas',
  '15 4 * * *',
  $$ select public.borrar_reservas_vencidas() $$
);
