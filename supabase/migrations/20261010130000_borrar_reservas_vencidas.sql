-- =====================================================================
-- Mega Futbol - Borrado de reservas viejas
--
-- Una reserva se borra definitivamente 15 dias despues de que termino
-- el turno (fecha + hora_inicio + 1 hora de duracion), sin importar en
-- que estado quedo: confirmada, cancelada, no_show, completada o
-- pendiente_pago.
--
-- POR QUE ESTO NO ROMPE LAS AMONESTACIONES: el contador de
-- inasistencias NO se calcula contando filas de reserva. Vive en
-- usuario.inasistencias y lo incrementa marcar_inasistencia en el
-- momento en que el empleado marca la reserva (migracion
-- amonestaciones). Lo mismo con suspensiones, suspendido_hasta y
-- vetado: son columnas de usuario. Borrar la reserva no les mueve
-- nada. Lo unico que se pierde es el detalle historico del turno.
--
-- El plazo vive en configuracion, como el resto de los parametros.
-- =====================================================================

alter table public.configuracion
  add column dias_retencion_reservas int not null default 15;

alter table public.configuracion
  add constraint configuracion_retencion_valida
  check (dias_retencion_reservas between 1 and 3650);

comment on column public.configuracion.dias_retencion_reservas is
  'Dias que se conserva una reserva despues de que termino el turno.';

-- La tabla pago (fase 2, hoy vacia) apunta a reserva. Sin cascade, el
-- dia que exista un pago el borrado fallaria en silencio desde el cron.
alter table public.pago drop constraint pago_reserva_id_fkey;
alter table public.pago
  add constraint pago_reserva_id_fkey
  foreign key (reserva_id) references public.reserva (id) on delete cascade;

-- ---------------------------------------------------------------------
-- borrar_reservas_vencidas(): la ejecuta el cron (ver migracion
-- siguiente). Devuelve cuantas borro, para poder revisarlo.
--
-- Sin sesion = la esta corriendo el cron o alguien desde el SQL
-- editor. Con sesion, solo un admin: no es una tarea operativa.
-- ---------------------------------------------------------------------
create or replace function public.borrar_reservas_vencidas()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := (select auth.uid());
  v_dias     int;
  v_borradas int;
begin
  if v_uid is not null and not public.es_admin() then
    raise exception 'Solo un administrador puede ejecutar la limpieza de reservas';
  end if;

  select c.dias_retencion_reservas into v_dias from public.configuracion c;

  delete from public.reserva r
  where (r.fecha + r.hora_inicio + interval '1 hour')
        < (public.ahora_local() - make_interval(days => v_dias));

  get diagnostics v_borradas = row_count;
  return v_borradas;
end;
$$;

revoke execute on function public.borrar_reservas_vencidas() from public, anon;
grant execute on function public.borrar_reservas_vencidas() to authenticated;
