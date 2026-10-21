-- =====================================================================
-- Mega Futbol - Perfiles de usuario para el admin
--
-- Dos cosas que el panel necesita y que la RLS no puede dar sola:
--
--   1. El email vive en auth.users, no en public.usuario (spec 01: no
--      se duplica). Ningun cliente puede leer auth.users.
--   2. La policy de usuario deja ver el perfil de quien reservo en tu
--      sede. Un admin tiene que poder listar tambien a los que todavia
--      no reservaron nunca.
--
-- Por eso van como funciones SECURITY DEFINER restringidas a admin, en
-- vez de abrir la RLS de usuario.
--
-- Los empleados (staff y admin) quedan fuera del listado: esto es para
-- ver clientes. Levantar una suspension o un veto sigue siendo
-- levantar_sancion, que ya existe y tambien es solo de admin.
-- =====================================================================

create or replace function public.usuarios_para_admin(p_busqueda text default null)
returns table (
  id               uuid,
  nombre           text,
  telefono         text,
  email            text,
  inasistencias    int,
  suspensiones     int,
  suspendido_hasta timestamptz,
  vetado           boolean,
  reservas_activas int,
  created_at       timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_busqueda text := nullif(trim(coalesce(p_busqueda, '')), '');
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede ver los perfiles de usuarios';
  end if;

  return query
  select
    u.id,
    u.nombre,
    u.telefono,
    au.email::text,
    u.inasistencias,
    u.suspensiones,
    u.suspendido_hasta,
    u.vetado,
    (
      select count(*)::int
      from public.reserva r
      where r.usuario_id = u.id
        and r.estado in ('pendiente_pago', 'confirmada')
        and (r.fecha + r.hora_inicio) > public.ahora_local()
    ),
    u.created_at
  from public.usuario u
  join auth.users au on au.id = u.id
  where not exists (select 1 from public.empleado e where e.usuario_id = u.id)
    and (
      v_busqueda is null
      or u.nombre ilike '%' || v_busqueda || '%'
      or au.email ilike '%' || v_busqueda || '%'
    )
  -- Primero los que tienen algo que mirar: vetados, suspendidos y con
  -- amonestaciones. El resto, alfabetico.
  order by u.vetado desc, u.suspendido_hasta desc nulls last, u.inasistencias desc, u.nombre
  limit 100;
end;
$$;

revoke execute on function public.usuarios_para_admin(text) from public, anon;
grant execute on function public.usuarios_para_admin(text) to authenticated;

-- ---------------------------------------------------------------------
-- perfil_de_usuario(): la ficha completa de un cliente, con TODAS sus
-- reservas (el frontend separa pendientes de pasadas). Solo admin.
-- ---------------------------------------------------------------------
create or replace function public.perfil_de_usuario(p_usuario_id uuid)
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
    raise exception 'Solo un administrador puede ver el perfil de un usuario';
  end if;

  select jsonb_build_object(
    'usuario', jsonb_build_object(
      'id', u.id,
      'nombre', u.nombre,
      'telefono', u.telefono,
      'email', au.email,
      'created_at', u.created_at,
      'inasistencias', u.inasistencias,
      'suspensiones', u.suspensiones,
      'suspendido_hasta', u.suspendido_hasta,
      'vetado', u.vetado
    ),
    'reservas', (
      select coalesce(jsonb_agg(
               jsonb_build_object(
                 'id', r.id,
                 'fecha', r.fecha,
                 'hora_inicio', r.hora_inicio,
                 'estado', r.estado,
                 'precio_total', r.precio_total,
                 'monto_sena', r.monto_sena,
                 'sena_devuelta', r.sena_devuelta,
                 'llegada_validada_at', r.llegada_validada_at,
                 'cancha_numero', c.numero,
                 'cancha_capacidad', c.capacidad
               )
               order by r.fecha desc, r.hora_inicio desc
             ), '[]'::jsonb)
      from public.reserva r
      join public.cancha c on c.id = r.cancha_id
      where r.usuario_id = u.id
    )
  )
  into v_resultado
  from public.usuario u
  join auth.users au on au.id = u.id
  where u.id = p_usuario_id;

  if v_resultado is null then
    raise exception 'El usuario no existe';
  end if;

  return v_resultado;
end;
$$;

revoke execute on function public.perfil_de_usuario(uuid) from public, anon;
grant execute on function public.perfil_de_usuario(uuid) to authenticated;
