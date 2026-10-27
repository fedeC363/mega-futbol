-- =====================================================================
-- Mega Futbol - VERIFICACION de acceso a los perfiles de usuario
--
-- Esta migracion NO cambia el esquema: solo comprueba, contra la base
-- de verdad, que un usuario comun autenticado no puede llegar a los
-- datos de otro usuario por ninguna via.
--
-- Corre dentro de una transaccion: si alguna comprobacion falla, la
-- migracion entera se revierte y queda sin aplicar (que es lo que se
-- busca: enterarse). Si pasa, borra sus propios usuarios de prueba y
-- la base queda igual que antes.
--
-- Se simula al cliente con request.jwt.claims (de donde sale auth.uid)
-- y con `set local role authenticated`, que es lo que hace PostgREST:
-- asi las policies de RLS se aplican de verdad, en vez de correr como
-- postgres, que se las saltea.
--
-- Para volver a correrla, copiar el bloque DO en el SQL Editor.
-- =====================================================================

do $$
declare
  v_espia   uuid := gen_random_uuid();  -- usuario comun que curiosea
  v_victima uuid := gen_random_uuid();  -- el usuario que intenta espiar
  v_admin   uuid := gen_random_uuid();
  v_sede    uuid;
  v_cancha  uuid;
  v_filas   int;
  v_json    jsonb;
  v_rechazo boolean;
  v_motivo  text;
begin
  -- El rol con el que el CLI aplica migraciones no tiene permisos
  -- sobre las tablas de public: para PREPARAR los datos de prueba hay
  -- que tomar el rol dueño. Las comprobaciones en si se hacen despues,
  -- como `authenticated`, que es lo que importa.
  execute 'set local role postgres';

  select s.id into v_sede from public.sede s order by s.created_at limit 1;
  select c.id into v_cancha from public.cancha c where c.sede_id = v_sede order by c.numero limit 1;

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at,
                          raw_app_meta_data, raw_user_meta_data)
  values
    (v_espia, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'auditoria-espia@ejemplo.test', '', now(), now(), now(), '{}'::jsonb,
     jsonb_build_object('nombre', 'Espía', 'telefono', '1100000010')),
    (v_victima, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'auditoria-victima@ejemplo.test', '', now(), now(), now(), '{}'::jsonb,
     jsonb_build_object('nombre', 'Víctima', 'telefono', '1100000011')),
    (v_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'auditoria-admin@ejemplo.test', '', now(), now(), now(), '{}'::jsonb,
     jsonb_build_object('nombre', 'Admin de prueba', 'telefono', '1100000012'));

  insert into public.empleado (usuario_id, sede_id, rol) values (v_admin, v_sede, 'admin');

  -- La víctima con datos sensibles: una sanción y una reserva.
  update public.usuario
  set inasistencias = 4, suspensiones = 1, suspendido_hasta = now() + interval '30 days', vetado = true
  where id = v_victima;

  insert into public.reserva (cancha_id, usuario_id, fecha, hora_inicio, precio_total, monto_sena)
  values (v_cancha, v_victima, (public.ahora_local() + interval '300 days')::date, '08:00', 40000, 15000);

  -- =================================================================
  -- COMO USUARIO COMUN AUTENTICADO
  -- =================================================================
  perform set_config('request.jwt.claims',
                     json_build_object('sub', v_espia, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  -- Control de que la simulación sirve: tiene que verse a sí mismo.
  select count(*) into v_filas from public.usuario u where u.id = v_espia;
  if v_filas <> 1 then
    raise exception 'La prueba no es válida: el usuario no puede leer ni su propio perfil (RLS mal simulada)';
  end if;

  -- 1. Perfil ajeno por consulta directa a la tabla
  select count(*) into v_filas from public.usuario u where u.id = v_victima;
  if v_filas <> 0 then
    raise exception 'AGUJERO: un usuario común leyó el perfil de otro usuario desde la tabla usuario';
  end if;

  -- 2. Reservas ajenas
  select count(*) into v_filas from public.reserva r where r.usuario_id = v_victima;
  if v_filas <> 0 then
    raise exception 'AGUJERO: un usuario común leyó las reservas de otro usuario';
  end if;

  -- 3. Quién es empleado (para no poder mapear al staff)
  select count(*) into v_filas from public.empleado e where e.usuario_id <> v_espia;
  if v_filas <> 0 then
    raise exception 'AGUJERO: un usuario común puede listar a los empleados';
  end if;

  -- 4. Listado de perfiles por RPC
  v_rechazo := false;
  begin
    perform * from public.usuarios_para_admin(null);
  exception when others then
    v_rechazo := true; v_motivo := sqlerrm;
  end;
  if not v_rechazo then
    raise exception 'AGUJERO: un usuario común pudo ejecutar usuarios_para_admin';
  end if;
  if v_motivo not ilike '%administrador%' and v_motivo not ilike '%permission denied%' then
    raise exception 'AGUJERO: usuarios_para_admin rechazó por otro motivo (%), no por permisos', v_motivo;
  end if;

  -- 5. Ficha de un usuario por RPC
  v_rechazo := false;
  begin
    v_json := public.perfil_de_usuario(v_victima);
  exception when others then
    v_rechazo := true; v_motivo := sqlerrm;
  end;
  if not v_rechazo then
    raise exception 'AGUJERO: un usuario común pudo leer la ficha completa de otro usuario';
  end if;

  -- 6. Levantar sanciones (lo más delicado: escribe)
  v_rechazo := false;
  begin
    perform public.levantar_sancion(v_victima);
  exception when others then
    v_rechazo := true; v_motivo := sqlerrm;
  end;
  if not v_rechazo then
    raise exception 'AGUJERO: un usuario común pudo levantarle la sanción a otro usuario';
  end if;

  -- Y que el intento no haya tocado nada igual.
  execute 'set local role postgres';
  if not exists (select 1 from public.usuario u where u.id = v_victima and u.vetado) then
    raise exception 'AGUJERO: el intento de levantar la sanción modificó datos';
  end if;

  -- =================================================================
  -- COMO ADMIN: el permiso tiene que servir, no solo negar
  -- =================================================================
  perform set_config('request.jwt.claims',
                     json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  select count(*) into v_filas from public.usuarios_para_admin(null);
  if v_filas = 0 then
    raise exception 'El admin no ve ningún usuario: la función quedó negando a todos';
  end if;

  v_json := public.perfil_de_usuario(v_victima);
  if v_json -> 'usuario' ->> 'email' is null then
    raise exception 'El admin no recibe el mail en la ficha';
  end if;

  perform public.levantar_sancion(v_victima);
  execute 'set local role postgres';

  if exists (select 1 from public.usuario u where u.id = v_victima and (u.vetado or u.inasistencias > 0)) then
    raise exception 'levantar_sancion no limpió la sanción cuando la llamó un admin';
  end if;

  -- =================================================================
  -- Limpieza: no queda nada de la prueba
  -- =================================================================
  delete from public.reserva where usuario_id in (v_espia, v_victima, v_admin);
  delete from auth.users where id in (v_espia, v_victima, v_admin);

  raise notice 'VERIFICACION OK: un usuario común no llega a los datos de otro por ninguna via, y el admin si';
end;
$$;
