-- =====================================================================
-- Mega Futbol - Estadisticas del predio (solo admin)
--
-- Tres resumenes para el panel de admin, en una sola consulta:
--   - por_cancha: cuantas reservas tuvo cada cancha (las 20, incluso
--     las que no tuvieron ninguna, para que el ranking este completo).
--   - por_tipo: agrupado por capacidad (futbol 5, 6, 7 u 8).
--   - por_franja: agrupado en franjas horarias.
--
-- Cuentan solo las reservas 'confirmada' y 'completada': una cancelada
-- no se alquilo, y una 'pendiente_pago' todavia no esta cerrada.
--
-- OJO CON EL ALCANCE: las reservas se borran 15 dias despues del turno
-- (borrar_reservas_vencidas), asi que esto es una foto de las ultimas
-- semanas, no un historico desde el principio. Si se quiere historia
-- larga hay que acumular los totales en una tabla aparte antes de que
-- el borrado se lleve las filas.
-- =====================================================================

create or replace function public.estadisticas_del_predio(p_sede_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_resultado jsonb;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede ver las estadísticas';
  end if;

  select jsonb_build_object(
    'total', (
      select count(*)::int
      from public.reserva r
      join public.cancha c on c.id = r.cancha_id
      where c.sede_id = p_sede_id
        and r.estado in ('confirmada', 'completada')
    ),

    'por_cancha', (
      select coalesce(jsonb_agg(
               jsonb_build_object('numero', x.numero, 'capacidad', x.capacidad, 'cantidad', x.cantidad)
               order by x.numero
             ), '[]'::jsonb)
      from (
        select c.numero, c.capacidad, count(r.id)::int as cantidad
        from public.cancha c
        left join public.reserva r
          on r.cancha_id = c.id
         and r.estado in ('confirmada', 'completada')
        where c.sede_id = p_sede_id
        group by c.numero, c.capacidad
      ) x
    ),

    'por_tipo', (
      select coalesce(jsonb_agg(
               jsonb_build_object('capacidad', y.capacidad, 'cantidad', y.cantidad)
               order by y.capacidad
             ), '[]'::jsonb)
      from (
        select c.capacidad, count(r.id)::int as cantidad
        from public.cancha c
        left join public.reserva r
          on r.cancha_id = c.id
         and r.estado in ('confirmada', 'completada')
        where c.sede_id = p_sede_id
        group by c.capacidad
      ) y
    ),

    'por_franja', (
      select coalesce(jsonb_agg(
               jsonb_build_object('franja', z.franja, 'desde', z.desde, 'cantidad', z.cantidad)
               order by z.desde
             ), '[]'::jsonb)
      from (
        select
          case
            when r.hora_inicio < time '12:00' then 'Mañana'
            when r.hora_inicio < time '16:00' then 'Mediodía'
            when r.hora_inicio < time '19:00' then 'Tarde'
            else 'Noche'
          end as franja,
          case
            when r.hora_inicio < time '12:00' then 8
            when r.hora_inicio < time '16:00' then 12
            when r.hora_inicio < time '19:00' then 16
            else 19
          end as desde,
          count(*)::int as cantidad
        from public.reserva r
        join public.cancha c on c.id = r.cancha_id
        where c.sede_id = p_sede_id
          and r.estado in ('confirmada', 'completada')
        group by 1, 2
      ) z
    )
  )
  into v_resultado;

  return v_resultado;
end;
$$;

revoke execute on function public.estadisticas_del_predio(uuid) from public, anon;
grant execute on function public.estadisticas_del_predio(uuid) to authenticated;
