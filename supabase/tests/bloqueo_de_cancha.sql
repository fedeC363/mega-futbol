-- =====================================================================
-- PRUEBA: bloquear una cancha saca sus turnos de circulacion
--
-- Verifica, llamando a las funciones reales:
--   1. Un dia bloqueado devuelve TODOS los turnos ocupados.
--   2. crear_reserva rechaza ese dia aunque se la llame directo.
--   3. El bloqueo no afecta a otras fechas ni a otras canchas.
--   4. No deja bloquear si hay reservas activas en el rango, salvo que
--      se insista con p_forzar.
--   5. Al levantar el bloqueo, los turnos vuelven.
--   6. Un empleado sin rol admin no puede bloquear.
--
-- COMO CORRERLA
--   Pegala entera en el SQL Editor de Supabase y ejecutala. Crea
--   usuarios de prueba y al final hace ROLLBACK: no deja nada.
--   Si algo falla, corta con un error que dice que. Si pasa, imprime
--   "PRUEBA OK".
-- =====================================================================

begin;

do $$
declare
  v_sede      uuid;
  v_cancha    uuid;
  v_otra      uuid;
  v_admin     uuid := gen_random_uuid();
  v_staff     uuid := gen_random_uuid();
  v_cliente   uuid := gen_random_uuid();
  v_fecha     date;
  v_otra_fecha date;
  v_hora      time;
  v_bloqueo   public.bloqueo_cancha;
  v_libres    int;
  v_reserva   public.reserva;
begin
  select s.id into v_sede from public.sede s order by s.created_at limit 1;
  select c.id into v_cancha from public.cancha c where c.sede_id = v_sede and c.activa order by c.numero limit 1;
  select c.id into v_otra from public.cancha c where c.sede_id = v_sede and c.activa and c.id <> v_cancha limit 1;
  v_fecha := (public.ahora_local() + interval '2 days')::date;
  v_otra_fecha := v_fecha + 1;

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at,
                          raw_app_meta_data, raw_user_meta_data)
  values
    (v_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'prueba-admin@ejemplo.test', '', now(), now(), now(), '{}'::jsonb,
     jsonb_build_object('nombre', 'Admin de prueba', 'telefono', '1100000002')),
    (v_staff, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'prueba-staff2@ejemplo.test', '', now(), now(), now(), '{}'::jsonb,
     jsonb_build_object('nombre', 'Staff de prueba', 'telefono', '1100000003')),
    (v_cliente, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'prueba-cliente2@ejemplo.test', '', now(), now(), now(), '{}'::jsonb,
     jsonb_build_object('nombre', 'Cliente de prueba', 'telefono', '1100000004'));

  insert into public.empleado (usuario_id, sede_id, rol) values (v_admin, v_sede, 'admin');
  insert into public.empleado (usuario_id, sede_id, rol) values (v_staff, v_sede, 'staff');

  -- ---- Un empleado sin rol admin NO puede bloquear ------------------
  perform set_config('request.jwt.claims',
                     json_build_object('sub', v_staff, 'role', 'authenticated')::text, true);
  begin
    perform public.bloquear_cancha(v_cancha, v_fecha);
    raise exception 'FALLA: un empleado staff pudo bloquear una cancha';
  exception
    when others then
      if sqlerrm not like '%administrador%' then
        raise exception 'FALLA: el rechazo al staff fue por otro motivo: %', sqlerrm;
      end if;
  end;

  -- ---- El admin bloquea dos dias ------------------------------------
  perform set_config('request.jwt.claims',
                     json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);

  v_bloqueo := public.bloquear_cancha(v_cancha, v_fecha, v_otra_fecha, 'Mantenimiento de prueba');

  select count(*) into v_libres
  from public.disponibilidad(v_cancha, v_fecha) d where not d.ocupado;
  if v_libres <> 0 then
    raise exception 'FALLA: la cancha bloqueada todavia muestra % turnos libres', v_libres;
  end if;

  -- ---- No afecta a otra cancha el mismo dia -------------------------
  select count(*) into v_libres
  from public.disponibilidad(v_otra, v_fecha) d where not d.ocupado;
  if v_libres = 0 then
    raise exception 'FALLA: el bloqueo dejo sin turnos a otra cancha';
  end if;

  -- ---- Ni a la misma cancha fuera del rango -------------------------
  select count(*) into v_libres
  from public.disponibilidad(v_cancha, v_otra_fecha + 1) d where not d.ocupado;
  if v_libres = 0 then
    raise exception 'FALLA: el bloqueo se extendio a una fecha de mas';
  end if;

  -- ---- crear_reserva rechaza el dia bloqueado -----------------------
  perform set_config('request.jwt.claims',
                     json_build_object('sub', v_cliente, 'role', 'authenticated')::text, true);
  begin
    perform public.crear_reserva(v_cancha, v_fecha, public.hora_primer_turno());
    raise exception 'FALLA: dejo reservar en una cancha bloqueada';
  exception
    when others then
      if sqlerrm not like '%no está disponible%' then
        raise exception 'FALLA: el rechazo al reservar fue por otro motivo: %', sqlerrm;
      end if;
  end;

  -- ---- Se levanta el bloqueo y los turnos vuelven -------------------
  perform set_config('request.jwt.claims',
                     json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  perform public.desbloquear_cancha(v_bloqueo.id);

  select count(*) into v_libres
  from public.disponibilidad(v_cancha, v_fecha) d where not d.ocupado;
  if v_libres = 0 then
    raise exception 'FALLA: despues de desbloquear la cancha sigue sin turnos';
  end if;

  -- ---- Con una reserva activa en el rango, avisa y no bloquea -------
  perform set_config('request.jwt.claims',
                     json_build_object('sub', v_cliente, 'role', 'authenticated')::text, true);
  select d.hora_inicio into v_hora
  from public.disponibilidad(v_cancha, v_fecha) d where not d.ocupado limit 1;
  v_reserva := public.crear_reserva(v_cancha, v_fecha, v_hora);

  perform set_config('request.jwt.claims',
                     json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  begin
    perform public.bloquear_cancha(v_cancha, v_fecha);
    raise exception 'FALLA: bloqueo un rango con reservas activas sin avisar';
  exception
    when others then
      if sqlerrm not like '%reserva%' then
        raise exception 'FALLA: el rechazo fue por otro motivo: %', sqlerrm;
      end if;
  end;

  -- Con p_forzar si lo hace, y la reserva queda en pie para resolverla
  -- a mano (el sistema no cancela ni devuelve plata solo).
  v_bloqueo := public.bloquear_cancha(v_cancha, v_fecha, null, 'Forzado', true);
  if not exists (select 1 from public.reserva r where r.id = v_reserva.id and r.estado = 'pendiente_pago') then
    raise exception 'FALLA: forzar el bloqueo toco la reserva existente';
  end if;

  raise notice 'PRUEBA OK: el bloqueo saca los turnos de esa cancha y esas fechas, y de ninguna otra';
end;
$$;

rollback;
