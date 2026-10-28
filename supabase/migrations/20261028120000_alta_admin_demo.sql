-- =====================================================================
-- Mega Futbol - Alta de la cuenta demo como administradora
--
-- Misma idea que el alta de Federico: "ser admin" es tener una fila
-- activa en empleado con rol 'admin' (spec 04), asi que el alta se
-- resuelve con esa fila y nada mas.
--
-- A diferencia de aquella, esta falla si la cuenta todavia no existe
-- en auth.users, en vez de no hacer nada en silencio: asi no queda la
-- duda de si el alta funciono. Si falla, la migracion entera se
-- revierte y queda sin aplicar; alcanza con registrar la cuenta en la
-- app y volver a correr `npm run db:push`.
-- =====================================================================

do $$
declare
  v_mail text := 'demo.admin@megafutbol-test.com';
  v_id   uuid;
begin
  -- El rol con el que el CLI aplica migraciones no tiene permisos
  -- sobre las tablas de public: hay que tomar el rol dueño.
  execute 'set local role postgres';

  select u.id into v_id from auth.users u where u.email = v_mail;

  if v_id is null then
    raise exception 'La cuenta % no existe: registrala en la app y volve a correr npm run db:push', v_mail;
  end if;

  insert into public.empleado (usuario_id, sede_id, rol)
  values (v_id, 'a5f0c1d2-0000-4000-8000-000000000001', 'admin')
  on conflict (usuario_id) do update
    set rol = 'admin', activo = true;

  raise notice 'La cuenta % quedo como administradora de San Justo', v_mail;
end;
$$;
