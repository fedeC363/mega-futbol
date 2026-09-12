-- =====================================================================
-- Mega Futbol - Funciones de negocio (RPC)
-- Ver specs/02-supabase-backend.txt
--
-- Todas son SECURITY DEFINER: corren con permisos elevados porque los
-- roles del cliente no tienen INSERT/UPDATE sobre ninguna tabla, y
-- validan "a mano" quien puede hacer que.
--
-- El precio, el chequeo de turno libre y los permisos de staff se
-- resuelven aca. El frontend nunca manda un precio ni decide si un
-- turno esta libre: solo llama y muestra el resultado.
-- =====================================================================

-- ---------------------------------------------------------------------
-- disponibilidad(): el cuadro horario de una cancha para un dia.
-- Accesible sin login, porque el mapa se navega sin estar logueado.
--
-- "ocupado" es true tanto si el turno ya esta reservado como si ya
-- paso (para un turno de hoy mas temprano). Desde el punto de vista
-- del que reserva son el mismo caso: no se puede tomar.
-- ---------------------------------------------------------------------
create or replace function public.disponibilidad(p_cancha_id uuid, p_fecha date)
returns table (hora_inicio time, ocupado boolean, precio numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_precio_base numeric(10,2);
  v_ahora timestamp := public.ahora_local();
begin
  select c.precio_base into v_precio_base
  from public.cancha c
  where c.id = p_cancha_id and c.activa;

  if v_precio_base is null then
    raise exception 'La cancha no existe o no está disponible';
  end if;

  if p_fecha < v_ahora::date then
    raise exception 'Esa fecha ya pasó';
  end if;

  if p_fecha > v_ahora::date + public.dias_anticipacion_max() then
    raise exception 'Se puede reservar con hasta % días de anticipación',
      public.dias_anticipacion_max();
  end if;

  return query
  select
    t.hora,
    (
      t.inicio <= v_ahora
      or exists (
        select 1
        from public.reserva r
        where r.cancha_id = p_cancha_id
          and r.fecha = p_fecha
          and r.hora_inicio = t.hora
          and r.estado <> 'cancelada'
      )
    ),
    public.precio_turno(v_precio_base, t.hora)
  from (
    select gs as inicio, gs::time as hora
    from generate_series(
      p_fecha + public.hora_primer_turno(),
      p_fecha + public.hora_ultimo_turno(),
      interval '1 hour'
    ) gs
  ) t
  order by t.hora;
end;
$$;

-- ---------------------------------------------------------------------
-- crear_reserva(): la unica via para que un usuario tome un turno.
-- Nace en 'pendiente_pago'. Hasta la Fase 2 la pasa a 'confirmada' un
-- empleado a mano (confirmar_reserva), cuando verifica la
-- transferencia de la sena; despues lo hara el webhook de Mercado Pago.
-- ---------------------------------------------------------------------
create or replace function public.crear_reserva(
  p_cancha_id   uuid,
  p_fecha       date,
  p_hora_inicio time
)
returns public.reserva
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid         uuid := (select auth.uid());
  v_ahora       timestamp := public.ahora_local();
  v_precio_base numeric(10,2);
  v_activas     int;
  v_constraint  text;
  v_reserva     public.reserva;
begin
  if v_uid is null then
    raise exception 'Tenés que iniciar sesión para reservar';
  end if;

  if not public.es_turno_valido(p_hora_inicio) then
    raise exception 'Horario inválido: los turnos son en punto, de % a %',
      to_char(public.hora_primer_turno(), 'HH24:MI'),
      to_char(public.hora_ultimo_turno(), 'HH24:MI');
  end if;

  if (p_fecha + p_hora_inicio) <= v_ahora then
    raise exception 'Ese turno ya pasó';
  end if;

  if p_fecha > v_ahora::date + public.dias_anticipacion_max() then
    raise exception 'Se puede reservar con hasta % días de anticipación',
      public.dias_anticipacion_max();
  end if;

  select c.precio_base into v_precio_base
  from public.cancha c
  where c.id = p_cancha_id and c.activa;

  if v_precio_base is null then
    raise exception 'La cancha no existe o no está disponible';
  end if;

  -- Tope de reservas simultaneas. Solo cuentan las que todavia no se
  -- jugaron: las pasadas no tienen que bloquear al usuario para siempre.
  select count(*) into v_activas
  from public.reserva r
  where r.usuario_id = v_uid
    and r.estado in ('pendiente_pago', 'confirmada')
    and (r.fecha + r.hora_inicio) > v_ahora;

  if v_activas >= public.max_reservas_activas() then
    raise exception 'Ya tenés % reservas activas. Esperá a jugar alguna o pedí una cancelación antes de reservar otra',
      public.max_reservas_activas();
  end if;

  -- Los dos indices unicos parciales son los que deciden de verdad:
  -- resuelven la carrera entre dos requests simultaneos, cosa que un
  -- "select ... if not found" nunca podria garantizar.
  begin
    insert into public.reserva (
      cancha_id, usuario_id, fecha, hora_inicio,
      precio_total, monto_sena, estado
    )
    values (
      p_cancha_id, v_uid, p_fecha, p_hora_inicio,
      public.precio_turno(v_precio_base, p_hora_inicio),
      public.monto_sena_default(), 'pendiente_pago'
    )
    returning * into v_reserva;
  exception
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint = 'reserva_usuario_horario_unico' then
        raise exception 'Ya tenés una reserva para ese día y ese horario';
      else
        raise exception 'Ese turno ya fue reservado';
      end if;
  end;

  return v_reserva;
end;
$$;

-- ---------------------------------------------------------------------
-- empleado_a_cargo(): chequeo de permisos compartido por las tres
-- funciones del panel de staff. Devuelve el id del empleado que llama
-- si trabaja en la sede de esa reserva, o corta con excepcion.
--
-- No mira empleado.rol: hoy cualquier empleado activo puede hacer todo
-- lo del panel (spec 04).
-- ---------------------------------------------------------------------
create or replace function public.empleado_a_cargo(p_reserva_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_sede     uuid;
  v_empleado uuid;
begin
  select c.sede_id into v_sede
  from public.reserva r
  join public.cancha c on c.id = r.cancha_id
  where r.id = p_reserva_id;

  if v_sede is null then
    raise exception 'La reserva no existe';
  end if;

  select e.id into v_empleado
  from public.empleado e
  where e.usuario_id = (select auth.uid())
    and e.sede_id = v_sede
    and e.activo;

  if v_empleado is null then
    raise exception 'No tenés permiso para operar sobre esta reserva';
  end if;

  return v_empleado;
end;
$$;

-- ---------------------------------------------------------------------
-- confirmar_reserva(): puente manual mientras no hay Mercado Pago.
-- El usuario transfiere la sena por fuera del sistema, el empleado la
-- verifica y confirma la reserva desde el panel.
--
-- NO esta en los specs originales: se agrego por decision explicita de
-- Federico para la Fase 1. En Fase 2 convive con el webhook, que hace
-- exactamente lo mismo pero automatico.
-- ---------------------------------------------------------------------
create or replace function public.confirmar_reserva(p_reserva_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estado text;
begin
  -- Corta con excepcion si el que llama no es empleado de esa sede.
  -- La reserva no guarda quien la confirmo: no hay columna para eso.
  perform public.empleado_a_cargo(p_reserva_id);

  select r.estado into v_estado
  from public.reserva r where r.id = p_reserva_id;

  if v_estado = 'confirmada' then
    raise exception 'La reserva ya estaba confirmada';
  end if;

  if v_estado <> 'pendiente_pago' then
    raise exception 'No se puede confirmar una reserva en estado %', v_estado;
  end if;

  update public.reserva
  set estado = 'confirmada'
  where id = p_reserva_id;
end;
$$;

-- ---------------------------------------------------------------------
-- validar_llegada(): el empleado marca que el grupo llegó y arrancó a
-- jugar. Necesario porque el turno dura 1 hora pero puede demorar en
-- arrancar (spec 00, regla 9).
--
-- Solo sella la llegada; NO cambia el estado de la reserva. Los
-- estados 'completada' y 'no_show' quedan definidos en el modelo pero
-- todavia sin uso: nadie los escribe en esta fase.
-- ---------------------------------------------------------------------
create or replace function public.validar_llegada(p_reserva_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_empleado uuid := public.empleado_a_cargo(p_reserva_id);
  v_reserva  public.reserva;
begin
  select * into v_reserva from public.reserva r where r.id = p_reserva_id;

  if v_reserva.estado = 'cancelada' then
    raise exception 'La reserva está cancelada';
  end if;

  if v_reserva.llegada_validada_at is not null then
    raise exception 'La llegada ya había sido validada';
  end if;

  update public.reserva
  set llegada_validada_at  = now(),
      llegada_validada_por = v_empleado
  where id = p_reserva_id;
end;
$$;

-- ---------------------------------------------------------------------
-- cancelar_reserva(): no hay autocancelacion. El usuario contacta al
-- staff por fuera del sistema y un empleado cancela desde el panel,
-- registrando si le devolvio la sena o no.
--
-- La devolucion del dinero ocurre por fuera del sistema: aca solo se
-- deja constancia de que pasó.
--
-- Al pasar a 'cancelada' la fila sale de los indices unicos parciales,
-- asi que el turno queda libre en el acto.
-- ---------------------------------------------------------------------
create or replace function public.cancelar_reserva(
  p_reserva_id    uuid,
  p_sena_devuelta boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_empleado uuid := public.empleado_a_cargo(p_reserva_id);
  v_estado   text;
begin
  select r.estado into v_estado
  from public.reserva r where r.id = p_reserva_id;

  if v_estado = 'cancelada' then
    raise exception 'La reserva ya estaba cancelada';
  end if;

  update public.reserva
  set estado         = 'cancelada',
      cancelada_at   = now(),
      cancelada_por  = v_empleado,
      sena_devuelta  = coalesce(p_sena_devuelta, false)
  where id = p_reserva_id;
end;
$$;

-- =====================================================================
-- Permisos de ejecucion
--
-- Postgres le da EXECUTE a PUBLIC sobre toda funcion nueva. Como estas
-- son SECURITY DEFINER, se revoca todo y se devuelve el permiso solo a
-- los roles que corresponden.
-- =====================================================================

-- Helpers internos y trigger: no los llama nadie desde el cliente.
revoke execute on function public.handle_new_user()             from public;
revoke execute on function public.ahora_local()                 from public;
revoke execute on function public.precio_turno(numeric, time)   from public;
revoke execute on function public.es_turno_valido(time)         from public;
revoke execute on function public.es_empleado_de_sede(uuid)     from public;
revoke execute on function public.sede_de_cancha(uuid)          from public;
revoke execute on function public.empleado_a_cargo(uuid)        from public;

-- Parametros de negocio: los usan las funciones de arriba. Se dejan
-- legibles por el cliente para poder mostrar el cuadro horario o el
-- monto de la sena en la UI sin hardcodearlos en el frontend.
grant execute on function public.hora_primer_turno()      to anon, authenticated;
grant execute on function public.hora_ultimo_turno()      to anon, authenticated;
grant execute on function public.dias_anticipacion_max()  to anon, authenticated;
grant execute on function public.max_reservas_activas()   to authenticated;
grant execute on function public.hora_recargo_desde()     to anon, authenticated;
grant execute on function public.factor_recargo()         to anon, authenticated;
grant execute on function public.monto_sena_default()     to anon, authenticated;

-- Navegacion publica: no requiere login.
revoke execute on function public.disponibilidad(uuid, date) from public;
grant  execute on function public.disponibilidad(uuid, date) to anon, authenticated;

-- Requieren sesion. Las tres del panel ademas verifican por dentro que
-- el que llama sea empleado de la sede.
revoke execute on function public.crear_reserva(uuid, date, time)   from public;
grant  execute on function public.crear_reserva(uuid, date, time)   to authenticated;

revoke execute on function public.mi_empleado()                     from public;
grant  execute on function public.mi_empleado()                     to authenticated;

revoke execute on function public.confirmar_reserva(uuid)           from public;
grant  execute on function public.confirmar_reserva(uuid)           to authenticated;

revoke execute on function public.validar_llegada(uuid)             from public;
grant  execute on function public.validar_llegada(uuid)             to authenticated;

revoke execute on function public.cancelar_reserva(uuid, boolean)   from public;
grant  execute on function public.cancelar_reserva(uuid, boolean)   to authenticated;
