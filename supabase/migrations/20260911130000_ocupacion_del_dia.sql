-- =====================================================================
-- Mega Futbol - Ocupacion del dia para el mapa de canchas
--
-- El mapa pinta cada cancha como "disponible" u "ocupada" (ocupada =
-- no le queda ningun turno libre ese dia, spec de frontend 2.2). Sin
-- esta funcion el frontend tendria que llamar a disponibilidad() una
-- vez por cancha: 20 requests cada vez que se cambia de fecha.
--
-- Reusa disponibilidad() por dentro, asi que el criterio de "libre"
-- (sin reserva activa y todavia no empezado) es exactamente el mismo
-- que ve el usuario al abrir una cancha. Tambien hereda sus
-- validaciones de fecha (no pasadas, hasta 30 dias).
--
-- Recibe la sede para que el mapa de una sede futura no traiga
-- canchas de otra (spec 04, multi-sede).
-- =====================================================================

create or replace function public.ocupacion_del_dia(p_sede_id uuid, p_fecha date)
returns table (cancha_id uuid, turnos_libres int)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    (
      select count(*)::int
      from public.disponibilidad(c.id, p_fecha) d
      where not d.ocupado
    )
  from public.cancha c
  where c.sede_id = p_sede_id
    and c.activa
  order by c.numero;
$$;

-- Desde la migracion 20260911120100 las funciones nuevas nacen sin
-- EXECUTE para los roles del cliente: se concede explicitamente.
-- Publica, porque el mapa se navega sin login.
grant execute on function public.ocupacion_del_dia(uuid, date) to anon, authenticated;
