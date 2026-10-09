-- =====================================================================
-- Mega Futbol - Bloqueos temporales de cancha
--
-- cancha.activa es un interruptor permanente: la cancha sale del mapa
-- hasta nuevo aviso. Esto es otra cosa: sacar canchas puntuales de
-- circulacion en fechas puntuales (mantenimiento, un torneo, un eveto
-- privado) sin tocar las demas canchas ni las demas fechas.
--
-- Un bloqueo cubre el dia entero, de `desde` a `hasta` inclusive. No se
-- bloquean turnos sueltos: para eso el staff puede reservar el turno.
--
-- Lo consulta disponibilidad() ademas de las reservas, asi que el mapa
-- y el cuadro horario se enteran solos. crear_reserva tambien lo
-- valida, para que no se pueda esquivar llamando a la funcion directo.
-- =====================================================================

create table public.bloqueo_cancha (
  id          uuid primary key default gen_random_uuid(),
  cancha_id   uuid not null references public.cancha (id) on delete cascade,
  desde       date not null,
  hasta       date not null,
  motivo      text,
  creado_por  uuid references public.empleado (id),
  created_at  timestamptz not null default now(),

  constraint bloqueo_rango_valido check (desde <= hasta)
);

comment on table public.bloqueo_cancha is
  'Fechas en las que una cancha no se puede reservar. Se escribe solo via bloquear_cancha (admin).';

-- Para la consulta de disponibilidad, que pregunta por cancha y fecha.
create index bloqueo_cancha_fechas_idx on public.bloqueo_cancha (cancha_id, desde, hasta);

-- Lectura publica, igual que cancha: el visitante tiene que poder ver
-- por que un dia no hay turnos. Escritura solo por las funciones.
alter table public.bloqueo_cancha enable row level security;
revoke all on public.bloqueo_cancha from anon, authenticated;
grant select on public.bloqueo_cancha to anon, authenticated;

create policy bloqueo_select_publico on public.bloqueo_cancha
  for select to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------
-- esta_bloqueada(): el chequeo en un solo lugar.
-- ---------------------------------------------------------------------
create or replace function public.esta_bloqueada(p_cancha_id uuid, p_fecha date)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bloqueo_cancha b
    where b.cancha_id = p_cancha_id
      and p_fecha between b.desde and b.hasta
  );
$$;

revoke execute on function public.esta_bloqueada(uuid, date) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- bloquear_cancha(): SOLO ADMIN.
--
-- p_hasta en null bloquea un solo dia. Si hay reservas activas en el
-- rango no bloquea: avisa cuantas son. Pasar p_forzar => true lo hace
-- igual, dejando esas reservas en pie para que el staff las resuelva a
-- mano (misma logica que dar de baja una cancha: el sistema no cancela
-- ni devuelve plata solo).
-- ---------------------------------------------------------------------
create or replace function public.bloquear_cancha(
  p_cancha_id uuid,
  p_desde     date,
  p_hasta     date    default null,
  p_motivo    text    default null,
  p_forzar    boolean default false
)
returns public.bloqueo_cancha
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hasta    date := coalesce(p_hasta, p_desde);
  v_reservas int;
  v_empleado uuid;
  v_bloqueo  public.bloqueo_cancha;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede bloquear una cancha';
  end if;

  if v_hasta < p_desde then
    raise exception 'La fecha de fin no puede ser anterior a la de inicio';
  end if;

  if v_hasta < public.ahora_local()::date then
    raise exception 'Ese rango ya pasó';
  end if;

  if not exists (select 1 from public.cancha c where c.id = p_cancha_id) then
    raise exception 'La cancha no existe';
  end if;

  select count(*) into v_reservas
  from public.reserva r
  where r.cancha_id = p_cancha_id
    and r.fecha between p_desde and v_hasta
    and r.estado in ('pendiente_pago', 'confirmada');

  if v_reservas > 0 and not p_forzar then
    raise exception
      'Hay % reserva(s) activa(s) en ese rango. Cancelalas primero, o repetí la llamada con p_forzar => true si las vas a resolver aparte.',
      v_reservas;
  end if;

  select e.id into v_empleado
  from public.empleado e
  where e.usuario_id = (select auth.uid()) and e.activo;

  insert into public.bloqueo_cancha (cancha_id, desde, hasta, motivo, creado_por)
  values (p_cancha_id, p_desde, v_hasta, nullif(trim(p_motivo), ''), v_empleado)
  returning * into v_bloqueo;

  return v_bloqueo;
end;
$$;

revoke execute on function public.bloquear_cancha(uuid, date, date, text, boolean) from public, anon;
grant execute on function public.bloquear_cancha(uuid, date, date, text, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- desbloquear_cancha(): SOLO ADMIN. Levanta un bloqueo por su id.
-- ---------------------------------------------------------------------
create or replace function public.desbloquear_cancha(p_bloqueo_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede levantar un bloqueo';
  end if;

  delete from public.bloqueo_cancha where id = p_bloqueo_id;

  if not found then
    raise exception 'Ese bloqueo no existe';
  end if;
end;
$$;

revoke execute on function public.desbloquear_cancha(uuid) from public, anon;
grant execute on function public.desbloquear_cancha(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- disponibilidad(): suma el bloqueo a lo que ya miraba.
-- Un dia bloqueado devuelve todos los turnos ocupados, igual que si
-- estuvieran reservados: para el que quiere jugar es el mismo caso.
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
  v_bloqueada boolean;
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

  v_bloqueada := public.esta_bloqueada(p_cancha_id, p_fecha);

  return query
  select
    t.hora,
    (
      v_bloqueada
      or t.inicio <= v_ahora
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
-- crear_reserva(): rechaza los dias bloqueados. El resto queda igual.
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
  v_usuario     public.usuario;
  v_precio_base numeric(10,2);
  v_activas     int;
  v_constraint  text;
  v_reserva     public.reserva;
begin
  if v_uid is null then
    raise exception 'Tenés que iniciar sesión para reservar';
  end if;

  select * into v_usuario from public.usuario u where u.id = v_uid;

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
