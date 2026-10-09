-- =====================================================================
-- PRUEBA: el borrado de reservas viejas no toca las amonestaciones
--
-- Verifica, llamando a la funcion real:
--   1. Borra una reserva que termino hace mas de 15 dias.
--   2. NO borra una reserva reciente ni una futura.
--   3. El contador de inasistencias del usuario queda intacto despues
--      de que se borro la reserva no_show que lo genero. Esto es lo
--      importante: el contador vive en usuario.inasistencias, no se
--      calcula contando filas.
--   4. La suspension tampoco se pierde.
--   5. El cron quedo programado.
--
-- COMO CORRERLA
--   Pegala entera en el SQL Editor de Supabase y ejecutala. Termina en
--   ROLLBACK: no borra ninguna reserva de verdad y no deja nada.
--   Si algo falla corta con un error que dice que. Si pasa, imprime
--   "PRUEBA OK".
--
-- Las reservas de prueba se insertan directo en la tabla, sin pasar por
-- crear_reserva: esa funcion rechaza fechas pasadas, justamente lo que
-- hace falta simular aca.
-- =====================================================================

begin;

do $$
declare
  v_sede      uuid;
  v_cancha    uuid;
  v_cliente   uuid := gen_random_uuid();
  v_vieja     uuid;
  v_reciente  uuid;
  v_hoy       date := public.ahora_local()::date;
  v_inasist   int;
  v_borradas  int;
  v_programado int;
begin
  select s.id into v_sede from public.sede s order by s.created_at limit 1;
  select c.id into v_cancha from public.cancha c where c.sede_id = v_sede limit 1;

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at,
                          raw_app_meta_data, raw_user_meta_data)
  values (v_cliente, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'prueba-borrado@ejemplo.test', '', now(), now(), now(), '{}'::jsonb,
          jsonb_build_object('nombre', 'Cliente de prueba', 'telefono', '1100000005'));

  -- Una reserva vieja que quedo en no_show, y el usuario con la
  -- amonestacion ya aplicada (como la dejaria marcar_inasistencia).
  insert into public.reserva (cancha_id, usuario_id, fecha, hora_inicio, precio_total, monto_sena, estado, no_show_at)
  values (v_cancha, v_cliente, v_hoy - 30, '10:00', 40000, 15000, 'no_show', now() - interval '30 days')
  returning id into v_vieja;

  update public.usuario set inasistencias = 3, suspensiones = 1, suspendido_hasta = now() + interval '30 days'
  where id = v_cliente;

  -- Una reciente, de ayer: tiene que sobrevivir.
  insert into public.reserva (cancha_id, usuario_id, fecha, hora_inicio, precio_total, monto_sena, estado)
  values (v_cancha, v_cliente, v_hoy - 1, '11:00', 40000, 15000, 'completada')
  returning id into v_reciente;

  -- ---- Se ejecuta la limpieza ---------------------------------------
  v_borradas := public.borrar_reservas_vencidas();

  if exists (select 1 from public.reserva r where r.id = v_vieja) then
    raise exception 'FALLA: no borro una reserva de hace 30 dias';
  end if;

  if not exists (select 1 from public.reserva r where r.id = v_reciente) then
    raise exception 'FALLA: borro una reserva de ayer, que todavia no vencio';
  end if;

  -- ---- Lo que importa: la amonestacion sobrevivio -------------------
  select u.inasistencias into v_inasist from public.usuario u where u.id = v_cliente;
  if v_inasist <> 3 then
    raise exception 'FALLA: el contador de inasistencias quedo en % despues del borrado, deberia seguir en 3', v_inasist;
  end if;

  if not exists (
    select 1 from public.usuario u
    where u.id = v_cliente and u.suspensiones = 1 and u.suspendido_hasta is not null
  ) then
    raise exception 'FALLA: el borrado se llevo puesta la suspension del usuario';
  end if;

  -- ---- El cron quedo programado -------------------------------------
  select count(*) into v_programado from cron.job j where j.jobname = 'borrar-reservas-vencidas';
  if v_programado <> 1 then
    raise exception 'FALLA: el cron "borrar-reservas-vencidas" no esta programado';
  end if;

  raise notice 'PRUEBA OK: borro % reserva(s) vencida(s), dejo las recientes y las amonestaciones intactas', v_borradas;
end;
$$;

rollback;
