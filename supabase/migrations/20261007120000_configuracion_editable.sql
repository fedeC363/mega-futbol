-- =====================================================================
-- Mega Futbol - Parametros de negocio editables
--
-- Hasta ahora los parametros (horario, recargo, seña, topes) eran
-- funciones SQL fijas: cambiarlos era escribir una migracion nueva.
-- El panel de admin necesita poder cambiarlos desde la app, asi que
-- pasan a una tabla de una sola fila y las funciones la leen.
--
-- Las funciones se mantienen con el mismo nombre y la misma firma, asi
-- que ni disponibilidad() ni crear_reserva() cambian: siguen siendo el
-- unico lugar donde se decide un precio o un horario valido. Lo unico
-- que cambia es de donde sale el numero.
--
-- Dejan de ser IMMUTABLE y pasan a STABLE, porque ahora dependen del
-- contenido de una tabla y no solo de sus argumentos.
-- =====================================================================

create table public.configuracion (
  -- Fila unica: el check obliga a que id sea true, y la PK a que haya
  -- una sola. Asi no hace falta preguntarse "cual de todas vale".
  id                        boolean primary key default true,

  hora_primer_turno         time not null default '08:00',
  hora_ultimo_turno         time not null default '22:00',
  hora_recargo_desde        time not null default '19:00',
  factor_recargo            numeric(4,2) not null default 1.10,
  monto_sena                numeric(10,2) not null default 15000,
  max_reservas_activas      int not null default 3,
  dias_anticipacion_max     int not null default 30,

  -- Umbrales del sistema de amonestaciones (ver migracion
  -- amonestaciones). No se editan desde el panel por ahora.
  inasistencias_aviso       int not null default 2,
  inasistencias_suspension  int not null default 5,
  meses_suspension          int not null default 2,

  actualizado_at            timestamptz not null default now(),
  actualizado_por           uuid references public.empleado (id),

  constraint configuracion_fila_unica check (id),
  constraint configuracion_horario_valido check (hora_primer_turno < hora_ultimo_turno),
  constraint configuracion_recargo_valido check (factor_recargo >= 1 and factor_recargo <= 3),
  constraint configuracion_sena_valida check (monto_sena > 0),
  constraint configuracion_tope_valido check (max_reservas_activas between 1 and 20),
  constraint configuracion_anticipacion_valida check (dias_anticipacion_max between 1 and 365),
  constraint configuracion_umbrales_validos check (
    inasistencias_aviso >= 1
    and inasistencias_suspension > inasistencias_aviso
    and meses_suspension >= 1
  )
);

comment on table public.configuracion is
  'Parametros de negocio, fila unica. Se escriben solo via actualizar_configuracion (admin).';

-- Arranca con los mismos valores que tenian las funciones fijas.
insert into public.configuracion (id) values (true);

-- Lectura publica: el frontend muestra horarios, seña y recargo sin
-- login. Escritura por ninguna via directa (ver RPC del admin).
alter table public.configuracion enable row level security;
revoke all on public.configuracion from anon, authenticated;
grant select on public.configuracion to anon, authenticated;

create policy configuracion_select_publica on public.configuracion
  for select to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------
-- Las funciones de parametros ahora leen la tabla.
-- ---------------------------------------------------------------------
create or replace function public.hora_primer_turno()
returns time language sql stable security definer set search_path = ''
as $$ select c.hora_primer_turno from public.configuracion c $$;

create or replace function public.hora_ultimo_turno()
returns time language sql stable security definer set search_path = ''
as $$ select c.hora_ultimo_turno from public.configuracion c $$;

create or replace function public.hora_recargo_desde()
returns time language sql stable security definer set search_path = ''
as $$ select c.hora_recargo_desde from public.configuracion c $$;

create or replace function public.factor_recargo()
returns numeric language sql stable security definer set search_path = ''
as $$ select c.factor_recargo from public.configuracion c $$;

create or replace function public.monto_sena_default()
returns numeric language sql stable security definer set search_path = ''
as $$ select c.monto_sena from public.configuracion c $$;

create or replace function public.max_reservas_activas()
returns int language sql stable security definer set search_path = ''
as $$ select c.max_reservas_activas from public.configuracion c $$;

create or replace function public.dias_anticipacion_max()
returns int language sql stable security definer set search_path = ''
as $$ select c.dias_anticipacion_max from public.configuracion c $$;

-- Estas dos dependen de las de arriba, asi que tampoco pueden seguir
-- siendo IMMUTABLE.
create or replace function public.precio_turno(p_precio_base numeric, p_hora time)
returns numeric
language sql
stable
set search_path = ''
as $$
  select round(
    p_precio_base * case
      when p_hora >= public.hora_recargo_desde() then public.factor_recargo()
      else 1
    end,
    2
  );
$$;

create or replace function public.es_turno_valido(p_hora time)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_hora >= public.hora_primer_turno()
     and p_hora <= public.hora_ultimo_turno()
     and date_part('minute', p_hora) = 0
     and date_part('second', p_hora) = 0;
$$;
