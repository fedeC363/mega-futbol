-- =====================================================================
-- Mega Futbol - La ocupacion del dia informa reservas y turnos totales
--
-- Antes devolvia solo turnos_libres, que alcanzaba para pintar la
-- cancha de gris cuando no quedaba nada. Para colorear por nivel de
-- ocupacion hace falta distinguir dos cosas que no son lo mismo:
--
--   - turnos_libres: lo que todavia se puede reservar. Un turno deja de
--     estar libre si esta reservado, si ya paso o si la cancha esta
--     bloqueada ese dia.
--   - turnos_reservados: solo las reservas activas. Es lo que mide que
--     tan pedida esta la cancha.
--
-- Sin esa separacion, una cancha sin ninguna reserva se veria "muy
-- ocupada" al final del dia, solo porque ya pasaron sus turnos.
--
-- Cambia el tipo de retorno, asi que hay que recrearla.
-- =====================================================================

drop function if exists public.ocupacion_del_dia(uuid, date);

create function public.ocupacion_del_dia(p_sede_id uuid, p_fecha date)
returns table (
  cancha_id         uuid,
  turnos_totales    int,
  turnos_libres     int,
  turnos_reservados int
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    count(*)::int,
    count(*) filter (where not d.ocupado)::int,
    (
      select count(*)::int
      from public.reserva r
      where r.cancha_id = c.id
        and r.fecha = p_fecha
        and r.estado <> 'cancelada'
    )
  from public.cancha c
  -- Un solo recorrido de disponibilidad por cancha: el lateral la
  -- expande en sus turnos y el group by los vuelve a juntar.
  cross join lateral public.disponibilidad(c.id, p_fecha) d
  where c.sede_id = p_sede_id
    and c.activa
  group by c.id, c.numero
  order by c.numero;
$$;

grant execute on function public.ocupacion_del_dia(uuid, date) to anon, authenticated;
