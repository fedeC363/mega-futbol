-- =====================================================================
-- Mega Futbol - Esquema inicial
-- Ver specs/01-modelo-de-datos.txt
--
-- Crea las tablas del dominio y el trigger que replica cada alta de
-- auth.users en public.usuario. NO incluye RLS ni funciones de negocio:
-- eso vive en las migraciones siguientes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- usuario: extiende auth.users, no la reemplaza.
-- El email y la password los maneja Supabase Auth, no se duplican aca.
-- ---------------------------------------------------------------------
create table public.usuario (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null,
  -- Nullable a proposito (spec 01). El registro desde la web pide el
  -- telefono como obligatorio, pero un usuario creado a mano desde el
  -- dashboard de Supabase puede no tenerlo.
  telefono    text,
  created_at  timestamptz not null default now()
);

comment on table public.usuario is
  'Perfil publico de cada cuenta de auth.users. Un empleado tambien es un usuario.';

-- ---------------------------------------------------------------------
-- sede: una ubicacion fisica. Hoy solo existe San Justo, pero el
-- modelo ya es multi-sede (ver spec 04).
-- ---------------------------------------------------------------------
create table public.sede (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  direccion   text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- cancha
-- ---------------------------------------------------------------------
create table public.cancha (
  id           uuid primary key default gen_random_uuid(),
  sede_id      uuid not null references public.sede (id),
  numero       int not null,
  -- Cantidad total de jugadores del partido, no por equipo
  -- (10 = futbol 5, 12 = futbol 6, 14 = futbol 7, 16 = futbol 8).
  capacidad    int not null,
  -- Precio por turno de 1 hora, SIN el recargo nocturno.
  precio_base  numeric(10,2) not null,
  -- Permite dar de baja una cancha sin borrarla ni perder su historial.
  activa       boolean not null default true,

  constraint cancha_numero_unico_por_sede unique (sede_id, numero),
  constraint cancha_capacidad_positiva check (capacidad > 0),
  constraint cancha_precio_positivo check (precio_base > 0)
);

-- ---------------------------------------------------------------------
-- empleado: un usuario que trabaja en una sede.
-- La sola existencia de una fila activa aca da acceso completo al panel
-- de staff. El campo "rol" queda preparado para el futuro pero HOY NO
-- SE USA para decidir permisos (spec 04).
-- ---------------------------------------------------------------------
create table public.empleado (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null unique references public.usuario (id) on delete cascade,
  sede_id     uuid not null references public.sede (id),
  rol         text not null default 'staff',
  activo      boolean not null default true
);

-- ---------------------------------------------------------------------
-- reserva: un turno de 1 hora en una cancha.
-- hora_fin no se guarda, siempre es hora_inicio + 1 hora.
-- ---------------------------------------------------------------------
create table public.reserva (
  id                    uuid primary key default gen_random_uuid(),
  cancha_id             uuid not null references public.cancha (id),
  usuario_id            uuid not null references public.usuario (id),
  fecha                 date not null,
  hora_inicio           time not null,
  -- Se calcula y congela al crear la reserva (ya con recargo si aplica),
  -- para que un cambio futuro de precio_base no altere reservas viejas.
  precio_total          numeric(10,2) not null,
  monto_sena            numeric(10,2) not null default 15000,
  estado                text not null default 'pendiente_pago'
                          constraint reserva_estado_valido
                          check (estado in ('pendiente_pago','confirmada','cancelada','completada','no_show')),
  llegada_validada_at   timestamptz,
  llegada_validada_por  uuid references public.empleado (id),
  cancelada_at          timestamptz,
  cancelada_por         uuid references public.empleado (id),
  -- Registro manual de que el staff devolvio la sena por fuera del
  -- sistema (efectivo o transferencia).
  sena_devuelta         boolean not null default false,
  created_at            timestamptz not null default now()
);

-- Dos reservas activas no pueden ocupar el mismo turno de la misma
-- cancha. Lo garantiza Postgres incluso con dos requests simultaneos.
-- Al pasar a 'cancelada' la fila deja de contar y el turno se libera.
create unique index reserva_turno_unico
  on public.reserva (cancha_id, fecha, hora_inicio)
  where estado <> 'cancelada';

-- Un usuario no puede tener dos reservas activas a la misma fecha y
-- hora: no puede jugar en dos canchas a la vez. En dias distintos si
-- puede repetir horario.
create unique index reserva_usuario_horario_unico
  on public.reserva (usuario_id, fecha, hora_inicio)
  where estado <> 'cancelada';

-- Consultas de disponibilidad.
create index reserva_cancha_fecha_idx on public.reserva (cancha_id, fecha);
-- Agenda del staff y "mis reservas".
create index reserva_fecha_idx on public.reserva (fecha);
create index reserva_usuario_idx on public.reserva (usuario_id);

-- ---------------------------------------------------------------------
-- pago (FASE 2): modelada desde ahora para no migrar despues.
-- Solo la escribe la Edge Function del webhook de Mercado Pago con la
-- service role key. Ningun cliente escribe aca.
-- ---------------------------------------------------------------------
create table public.pago (
  id                   uuid primary key default gen_random_uuid(),
  reserva_id           uuid not null unique references public.reserva (id),
  mp_payment_id        text,
  monto                numeric(10,2) not null,
  estado               text not null
                         constraint pago_estado_valido
                         check (estado in ('pendiente','aprobado','rechazado','expirado')),
  fecha_pago           timestamptz,
  comprobante_enviado  boolean not null default false,
  -- Copia del email al momento del pago, para el comprobante.
  comprobante_email    text,
  created_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Trigger: cada alta en auth.users crea su fila en public.usuario.
-- El nombre y el telefono viajan en los metadatos del signUp:
--   supabase.auth.signUp({ email, password,
--     options: { data: { nombre, telefono } } })
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.usuario (id, nombre, telefono)
  values (
    new.id,
    -- Si alguien se crea desde el dashboard sin metadatos, usamos la
    -- parte local del email como nombre provisorio en vez de fallar.
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''),
             split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data ->> 'telefono'), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
