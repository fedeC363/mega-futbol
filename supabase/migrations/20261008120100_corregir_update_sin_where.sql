-- =====================================================================
-- Mega Futbol - Corregir "UPDATE requires a WHERE clause"
--
-- actualizar_configuracion hacia el UPDATE sin WHERE, aprovechando que
-- configuracion tiene una sola fila. Supabase bloquea los UPDATE sin
-- WHERE (proteccion contra pisar una tabla entera por accidente), asi
-- que la funcion fallaba al guardar desde el panel de admin.
--
-- La condicion `where c.id` alcanza: id es la PK y su check obliga a
-- que sea true, asi que apunta siempre a la unica fila.
-- =====================================================================

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
  where c.id
  returning c.* into v_config;

  return v_config;
end;
$$;
