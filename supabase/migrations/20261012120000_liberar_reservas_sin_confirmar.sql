-- =====================================================================
-- Mega Futbol - Liberar las reservas que nadie confirmo
--
-- Si una reserva queda en 'pendiente_pago' mas de 24 horas y ningun
-- empleado confirmo que llego la seña, se elimina y el turno vuelve a
-- estar disponible para cualquiera.
--
-- Se borra la fila, no se cancela: una cancelada queda registrada
-- porque alguien decidio cancelarla y hubo (o no) devolucion de seña.
-- Acá no paso nada: la reserva nunca se concreto.
--
-- Esto REEMPLAZA la expiracion que el spec 01 sugeria para la Fase 2
-- (15 minutos, atada al pago con Mercado Pago). Esa nunca se
-- implemento y, con confirmacion manual del staff, 15 minutos no
-- alcanzaban: el plazo ahora es de 24 horas y vive en configuracion.
-- =====================================================================

alter table public.configuracion
  add column horas_para_confirmar int not null default 24;

alter table public.configuracion
  add constraint configuracion_plazo_confirmacion_valido
  check (horas_para_confirmar between 1 and 720);

comment on column public.configuracion.horas_para_confirmar is
  'Horas que una reserva puede quedar pendiente_pago antes de liberarse sola.';

create or replace function public.liberar_reservas_sin_confirmar()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := (select auth.uid());
  v_horas     int;
  v_liberadas int;
begin
  -- Sin sesion = la corre el cron. Con sesion, solo un admin.
  if v_uid is not null and not public.es_admin() then
    raise exception 'Solo un administrador puede liberar reservas sin confirmar';
  end if;

  select c.horas_para_confirmar into v_horas from public.configuracion c;

  delete from public.reserva r
  where r.estado = 'pendiente_pago'
    and r.created_at < now() - make_interval(hours => v_horas);

  get diagnostics v_liberadas = row_count;
  return v_liberadas;
end;
$$;

revoke execute on function public.liberar_reservas_sin_confirmar() from public, anon;
grant execute on function public.liberar_reservas_sin_confirmar() to authenticated;

-- Cada 15 minutos: el plazo es de 24 horas, pero conviene que el turno
-- se libere apenas vence y no al dia siguiente. Es un delete sobre un
-- indice, no pesa.
do $$
begin
  if exists (select 1 from cron.job j where j.jobname = 'liberar-reservas-sin-confirmar') then
    perform cron.unschedule('liberar-reservas-sin-confirmar');
  end if;
end;
$$;

select cron.schedule(
  'liberar-reservas-sin-confirmar',
  '*/15 * * * *',
  $$ select public.liberar_reservas_sin_confirmar() $$
);
