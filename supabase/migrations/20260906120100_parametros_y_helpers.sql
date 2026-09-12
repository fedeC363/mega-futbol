-- =====================================================================
-- Mega Futbol - Parametros de negocio y funciones auxiliares
--
-- Los numeros que definen las reglas del negocio (horarios, recargo,
-- sena, topes) viven aca como funciones inmutables en vez de estar
-- repetidos como literales dentro de cada RPC. Para cambiar una regla
-- se crea una migracion nueva que reemplace la funcion, y el cambio
-- vale para todo el sistema de una sola vez.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Zona horaria: todo el sistema asume Buenos Aires (spec 00, regla 12).
-- Devuelve el "ahora" local como timestamp SIN zona, para poder
-- compararlo directo contra (fecha + hora_inicio) de una reserva.
-- ---------------------------------------------------------------------
create or replace function public.ahora_local()
returns timestamp
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Argentina/Buenos_Aires')::timestamp;
$$;

-- ---------------------------------------------------------------------
-- Parametros de los turnos.
-- Turnos de 1 hora en punto, de 08:00 a 23:00: el primero arranca
-- 08:00 y el ultimo 22:00 (termina 23:00).
-- ---------------------------------------------------------------------
create or replace function public.hora_primer_turno()
returns time language sql immutable as $$ select time '08:00' $$;

create or replace function public.hora_ultimo_turno()
returns time language sql immutable as $$ select time '22:00' $$;

-- Con cuanta anticipacion maxima se puede reservar, en dias.
create or replace function public.dias_anticipacion_max()
returns int language sql immutable as $$ select 30 $$;

-- Cuantas reservas activas a futuro puede acumular un mismo usuario.
create or replace function public.max_reservas_activas()
returns int language sql immutable as $$ select 3 $$;

-- ---------------------------------------------------------------------
-- Precio: recargo del 10% para turnos que arrancan 19:00 o mas tarde
-- (spec 00, regla 3).
-- ---------------------------------------------------------------------
create or replace function public.hora_recargo_desde()
returns time language sql immutable as $$ select time '19:00' $$;

create or replace function public.factor_recargo()
returns numeric language sql immutable as $$ select 1.10::numeric $$;

-- La sena es un monto fijo, no un porcentaje del precio total
-- (spec 00, regla 5).
create or replace function public.monto_sena_default()
returns numeric language sql immutable as $$ select 15000::numeric $$;

-- ---------------------------------------------------------------------
-- Precio final de un turno. Unica fuente de verdad del calculo: la
-- usan tanto disponibilidad() como crear_reserva(), asi que lo que ve
-- el usuario antes de reservar y lo que se guarda no pueden diferir.
-- ---------------------------------------------------------------------
create or replace function public.precio_turno(p_precio_base numeric, p_hora time)
returns numeric
language sql
immutable
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

-- ---------------------------------------------------------------------
-- Es un turno valido del cuadro horario? (hora en punto y dentro del
-- rango). Evita que alguien reserve las 20:30 o las 03:00 llamando a
-- la RPC directo, sin pasar por la UI.
-- ---------------------------------------------------------------------
create or replace function public.es_turno_valido(p_hora time)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_hora >= public.hora_primer_turno()
     and p_hora <= public.hora_ultimo_turno()
     and date_part('minute', p_hora) = 0
     and date_part('second', p_hora) = 0;
$$;

-- ---------------------------------------------------------------------
-- mi_empleado(): le permite al frontend saber si el usuario logueado
-- es staff y de que sede, para mostrar u ocultar el panel (spec 02).
-- SECURITY INVOKER: se apoya en la policy de SELECT de empleado.
-- ---------------------------------------------------------------------
create or replace function public.mi_empleado()
returns table (empleado_id uuid, sede_id uuid)
language sql
stable
security invoker
set search_path = ''
as $$
  select e.id, e.sede_id
  from public.empleado e
  where e.usuario_id = (select auth.uid())
    and e.activo;
$$;

-- ---------------------------------------------------------------------
-- es_empleado_de_sede(): el chequeo de permisos de staff, en un solo
-- lugar. Lo usan las policies de RLS y las funciones del panel.
--
-- SECURITY DEFINER a proposito: tiene que poder mirar la tabla
-- empleado entera sin quedar limitado por la policy de SELECT de esa
-- tabla. Solo devuelve un booleano sobre el usuario que llama, no
-- expone ninguna fila.
-- ---------------------------------------------------------------------
create or replace function public.es_empleado_de_sede(p_sede_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.empleado e
    where e.usuario_id = (select auth.uid())
      and e.sede_id = p_sede_id
      and e.activo
  );
$$;

-- ---------------------------------------------------------------------
-- sede_de_cancha(): resuelve la sede a la que pertenece una cancha.
-- SECURITY DEFINER para poder usarla dentro de policies sin depender
-- de que el que consulta tenga permiso de leer cancha.
-- ---------------------------------------------------------------------
create or replace function public.sede_de_cancha(p_cancha_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.sede_id from public.cancha c where c.id = p_cancha_id;
$$;
