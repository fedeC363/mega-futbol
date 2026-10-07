-- =====================================================================
-- Mega Futbol - Rol de administrador
--
-- CAMBIO DE REGLA: hasta ahora todos los empleados tenian exactamente
-- los mismos permisos y el campo empleado.rol existia pero no se
-- leia en ningun lado (spec 00 regla 11, spec 04). Federico decidio
-- diferenciar un rol 'admin' para lo que toca plata y configuracion:
-- precios de las canchas, parametros globales, dar de baja una cancha
-- y levantar sanciones.
--
-- Todo el resto del panel (agenda, confirmar seña, validar llegada,
-- cancelar, marcar inasistencias) sigue siendo de cualquier empleado
-- activo, sin jerarquia.
-- =====================================================================

alter table public.empleado
  add constraint empleado_rol_valido check (rol in ('staff', 'admin'));

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.empleado e
    where e.usuario_id = (select auth.uid())
      and e.activo
      and e.rol = 'admin'
  );
$$;

revoke execute on function public.es_admin() from public, anon;
grant execute on function public.es_admin() to authenticated;

-- mi_empleado() ahora informa tambien el rol, para que el frontend
-- sepa si mostrar el panel de admin. Cambia el tipo de retorno, asi
-- que hay que recrearla.
drop function if exists public.mi_empleado();

create function public.mi_empleado()
returns table (empleado_id uuid, sede_id uuid, rol text)
language sql
stable
security invoker
set search_path = ''
as $$
  select e.id, e.sede_id, e.rol
  from public.empleado e
  where e.usuario_id = (select auth.uid())
    and e.activo;
$$;

revoke execute on function public.mi_empleado() from public, anon;
grant execute on function public.mi_empleado() to authenticated;

update public.empleado
set rol = 'admin'
where usuario_id in (select u.id from auth.users u where u.email = 'fjcuda@gmail.com');

-- ---------------------------------------------------------------------
-- actualizar_configuracion(): los parametros globales del negocio.
-- Los NULL dejan el valor que ya estaba.
-- ---------------------------------------------------------------------
create or replace function public.actualizar_configuracion(
  p_hora_primer_turno     time    default null,
  p_hora_ultimo_turno     time    default null,
  p_hora_recargo_desde    time    default null,
  p_factor_recargo        numeric default null,
  p_monto_sena            numeric default null,
  p_max_reservas_activas  int     default null,
  p_dias_anticipacion_max int     default null
)
returns public.configuracion
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_config public.configuracion;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede cambiar la configuración';
  end if;

  update public.configuracion c
  set hora_primer_turno     = coalesce(p_hora_primer_turno, c.hora_primer_turno),
      hora_ultimo_turno     = coalesce(p_hora_ultimo_turno, c.hora_ultimo_turno),
      hora_recargo_desde    = coalesce(p_hora_recargo_desde, c.hora_recargo_desde),
      factor_recargo        = coalesce(p_factor_recargo, c.factor_recargo),
      monto_sena            = coalesce(p_monto_sena, c.monto_sena),
      max_reservas_activas  = coalesce(p_max_reservas_activas, c.max_reservas_activas),
      dias_anticipacion_max = coalesce(p_dias_anticipacion_max, c.dias_anticipacion_max),
      actualizado_at        = now(),
      actualizado_por       = (
        select e.id from public.empleado e
        where e.usuario_id = (select auth.uid()) and e.activo
      )
  returning c.* into v_config;

  return v_config;
end;
$$;

revoke execute on function public.actualizar_configuracion(time, time, time, numeric, numeric, int, int) from public, anon;
grant execute on function public.actualizar_configuracion(time, time, time, numeric, numeric, int, int) to authenticated;

-- ---------------------------------------------------------------------
-- actualizar_cancha(): precio y alta/baja de una cancha.
--
-- Las reservas ya creadas no se tocan: su precio_total quedo congelado
-- al reservarse (spec 01). Dar de baja una cancha tampoco cancela sus
-- reservas futuras; solo impide tomar turnos nuevos.
-- ---------------------------------------------------------------------
create or replace function public.actualizar_cancha(
  p_cancha_id   uuid,
  p_precio_base numeric default null,
  p_activa      boolean default null
)
returns public.cancha
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cancha public.cancha;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede modificar una cancha';
  end if;

  if p_precio_base is not null and p_precio_base <= 0 then
    raise exception 'El precio tiene que ser mayor a cero';
  end if;

  update public.cancha c
  set precio_base = coalesce(p_precio_base, c.precio_base),
      activa      = coalesce(p_activa, c.activa)
  where c.id = p_cancha_id
  returning c.* into v_cancha;

  if v_cancha.id is null then
    raise exception 'La cancha no existe';
  end if;

  return v_cancha;
end;
$$;

revoke execute on function public.actualizar_cancha(uuid, numeric, boolean) from public, anon;
grant execute on function public.actualizar_cancha(uuid, numeric, boolean) to authenticated;
