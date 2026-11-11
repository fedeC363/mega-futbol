-- =====================================================================
-- Mega Futbol - Pedidos simultaneos en crear_reserva y marcar_inasistencia
--
-- Las dos funciones leian una fila, chequeaban una condicion y despues
-- escribian. Entre la lectura y la escritura otro pedido podia hacer lo
-- mismo:
--
--   - crear_reserva: 20 llamadas en paralelo del mismo usuario contaban
--     todas 0 reservas activas y todas insertaban, salteando el tope.
--   - marcar_inasistencia: dos empleados tocando "No se presento" a la
--     vez sumaban 2 amonestaciones por un solo turno.
--
-- El arreglo es leer con FOR UPDATE: el segundo pedido espera a que
-- termine el primero y recien ahi lee, ya viendo lo que el primero
-- escribio. El resto de cada funcion queda igual que en su ultima
-- version (crear_reserva: bloqueos_de_cancha; marcar_inasistencia:
-- amonestaciones). CREATE OR REPLACE conserva los grants.
-- =====================================================================

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
  v_usuario     public.usuario;
  v_precio_base numeric(10,2);
  v_activas     int;
  v_constraint  text;
  v_reserva     public.reserva;
begin
  if v_uid is null then
    raise exception 'Tenés que iniciar sesión para reservar';
  end if;

  -- FOR UPDATE: las reservas del mismo usuario se crean de a una, asi
  -- el conteo del tope de abajo no se puede saltear con pedidos en
  -- paralelo.
  select * into v_usuario from public.usuario u where u.id = v_uid for update;

  if v_usuario.vetado then
    raise exception 'Tu cuenta no puede hacer reservas por inasistencias reiteradas. Comunicate con el predio.';
  end if;

  if v_usuario.suspendido_hasta is not null and v_usuario.suspendido_hasta > now() then
    raise exception 'Estás suspendido por inasistencias hasta el %. No vas a poder reservar hasta esa fecha.',
      to_char(v_usuario.suspendido_hasta at time zone 'America/Argentina/Buenos_Aires', 'DD/MM/YYYY');
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

  if public.esta_bloqueada(p_cancha_id, p_fecha) then
    raise exception 'Esa cancha no está disponible el %', to_char(p_fecha, 'DD/MM/YYYY');
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

create or replace function public.marcar_inasistencia(p_reserva_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_empleado      uuid := public.empleado_a_cargo(p_reserva_id);
  v_reserva       public.reserva;
  v_config        public.configuracion;
  v_inasistencias int;
  v_suspensiones  int;
begin
  -- FOR UPDATE: si dos empleados la marcan a la vez, el segundo espera,
  -- ve el estado 'no_show' y corta abajo en vez de sumar otra vez.
  select * into v_reserva from public.reserva r where r.id = p_reserva_id for update;

  if v_reserva.estado = 'cancelada' then
    raise exception 'La reserva está cancelada';
  end if;
  if v_reserva.estado = 'no_show' then
    raise exception 'La inasistencia ya estaba marcada';
  end if;
  if v_reserva.llegada_validada_at is not null then
    raise exception 'Esa reserva tiene la llegada validada: el usuario sí se presentó';
  end if;
  if (v_reserva.fecha + v_reserva.hora_inicio) > public.ahora_local() then
    raise exception 'El turno todavía no empezó';
  end if;

  select * into v_config from public.configuracion;

  update public.reserva
  set estado      = 'no_show',
      no_show_at  = now(),
      no_show_por = v_empleado
  where id = p_reserva_id;

  update public.usuario
  set inasistencias = inasistencias + 1
  where id = v_reserva.usuario_id
  returning inasistencias, suspensiones into v_inasistencias, v_suspensiones;

  if v_inasistencias >= v_config.inasistencias_suspension then
    if v_suspensiones >= 1 then
      -- Ya cumplio una suspension y volvio a juntar el tope: veto.
      update public.usuario set vetado = true where id = v_reserva.usuario_id;
    else
      update public.usuario
      set suspendido_hasta = now() + make_interval(months => v_config.meses_suspension),
          suspensiones     = suspensiones + 1,
          inasistencias    = 0
      where id = v_reserva.usuario_id;
    end if;
  end if;
end;
$$;
