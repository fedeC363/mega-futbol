-- =====================================================================
-- PRUEBA: cancelar una reserva NO suma inasistencias
--
-- Cancelar con aviso y no presentarse son cosas distintas: solo la
-- segunda penaliza (spec 04). Esta prueba lo verifica de punta a punta,
-- llamando a las funciones reales.
--
-- COMO CORRERLA
--   Pegala entera en el SQL Editor de Supabase y ejecutala. Crea dos
--   usuarios de prueba, reserva, cancela, verifica y al final hace
--   ROLLBACK: no deja nada en la base.
--
--   Si alguna verificacion falla, corta con un error que dice cual.
--   Si pasa, imprime "PRUEBA OK" en los mensajes.
--
-- Simula al cliente con request.jwt.claims, que es de donde auth.uid()
-- saca el usuario: asi crear_reserva y cancelar_reserva se ejecutan
-- igual que cuando las llama el navegador.
-- =====================================================================

begin;

do $$
declare
  v_sede       uuid;
  v_cancha     uuid;
  v_cliente    uuid := gen_random_uuid();
  v_staff      uuid := gen_random_uuid();
  v_fecha      date;
  v_hora       time;
  v_reserva    public.reserva;
  v_estado     text;
  v_inasist    int;
  v_vetado     boolean;
  v_suspendido timestamptz;
begin
  select s.id into v_sede from public.sede s order by s.created_at limit 1;
  select c.id into v_cancha from public.cancha c where c.sede_id = v_sede and c.activa order by c.numero limit 1;
  v_fecha := (public.ahora_local() + interval '1 day')::date;

  -- Primer turno libre de esa cancha ese dia.
  select d.hora_inicio into v_hora
  from public.disponibilidad(v_cancha, v_fecha) d
  where not d.ocupado
  limit 1;

  if v_hora is null then
    raise exception 'No hay turnos libres para probar en la cancha elegida';
  end if;

  -- Dos cuentas de prueba. El trigger on_auth_user_created crea sus
  -- filas en public.usuario.
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at,
                          raw_app_meta_data, raw_user_meta_data)
  values
    (v_cliente, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'prueba-cliente@ejemplo.test', '', now(), now(), now(), '{}'::jsonb,
     jsonb_build_object('nombre', 'Cliente de prueba', 'telefono', '1100000000')),
    (v_staff, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'prueba-staff@ejemplo.test', '', now(), now(), now(), '{}'::jsonb,
     jsonb_build_object('nombre', 'Staff de prueba', 'telefono', '1100000001'));

  insert into public.empleado (usuario_id, sede_id) values (v_staff, v_sede);

  -- ---- El cliente reserva -------------------------------------------
  perform set_config('request.jwt.claims',
                     json_build_object('sub', v_cliente, 'role', 'authenticated')::text, true);

  v_reserva := public.crear_reserva(v_cancha, v_fecha, v_hora);

  select u.inasistencias into v_inasist from public.usuario u where u.id = v_cliente;
  if v_inasist <> 0 then
    raise exception 'Antes de cancelar el contador ya era %, deberia ser 0', v_inasist;
  end if;

  -- ---- El staff la cancela ------------------------------------------
  perform set_config('request.jwt.claims',
                     json_build_object('sub', v_staff, 'role', 'authenticated')::text, true);

  perform public.cancelar_reserva(v_reserva.id, true);

  -- ---- Verificaciones -----------------------------------------------
  select r.estado into v_estado from public.reserva r where r.id = v_reserva.id;
  if v_estado <> 'cancelada' then
    raise exception 'La reserva quedo en estado "%" en vez de "cancelada"', v_estado;
  end if;

  select u.inasistencias, u.vetado, u.suspendido_hasta
  into v_inasist, v_vetado, v_suspendido
  from public.usuario u where u.id = v_cliente;

  if v_inasist <> 0 then
    raise exception 'FALLA: cancelar sumo % inasistencia(s); tiene que quedar en 0', v_inasist;
  end if;
  if v_vetado or v_suspendido is not null then
    raise exception 'FALLA: cancelar dejo al usuario sancionado';
  end if;

  -- Y el contrario: marcar inasistencia sobre una cancelada se rechaza.
  begin
    perform public.marcar_inasistencia(v_reserva.id);
    raise exception 'FALLA: dejo marcar inasistencia sobre una reserva cancelada';
  exception
    when others then
      if sqlerrm not like '%cancelada%' then
        raise exception 'FALLA: el rechazo fue por otro motivo: %', sqlerrm;
      end if;
  end;

  raise notice 'PRUEBA OK: cancelar no suma inasistencias y no se puede marcar inasistencia sobre una cancelada';
end;
$$;

rollback;
