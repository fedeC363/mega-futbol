-- =====================================================================
-- Mega Futbol - Row Level Security y permisos
-- Ver specs/02-supabase-backend.txt
--
-- Criterio general: el frontend habla directo con Supabase, asi que la
-- unica barrera real es esta. Se aplica defensa en dos capas:
--   1. Privilegios de tabla (grant/revoke): que puede tocar cada rol.
--   2. Policies de RLS: que filas puede tocar dentro de lo permitido.
--
-- Ninguna tabla acepta INSERT/UPDATE/DELETE directo desde el cliente.
-- Toda escritura pasa por las funciones de la migracion siguiente.
-- =====================================================================

alter table public.usuario  enable row level security;
alter table public.sede     enable row level security;
alter table public.cancha   enable row level security;
alter table public.empleado enable row level security;
alter table public.reserva  enable row level security;
alter table public.pago     enable row level security;

-- Punto de partida: los roles del cliente no tienen ningun privilegio
-- sobre ninguna tabla. Abajo se devuelve solo lo estrictamente
-- necesario, y siempre de solo lectura.
revoke all on public.usuario, public.sede, public.cancha,
              public.empleado, public.reserva, public.pago
  from anon, authenticated;

-- ---------------------------------------------------------------------
-- usuario: cada uno ve y edita solo su propio perfil.
-- El INSERT lo hace el trigger on_auth_user_created (SECURITY DEFINER),
-- por eso no hace falta policy de insert para el cliente.
-- ---------------------------------------------------------------------
grant select on public.usuario to authenticated;
-- Solo estas dos columnas: el id no se puede reescribir.
grant update (nombre, telefono) on public.usuario to authenticated;

create policy usuario_select_propio on public.usuario
  for select to authenticated
  using ((select auth.uid()) = id);

create policy usuario_update_propio on public.usuario
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------
-- sede y cancha: lectura publica, incluso sin login, porque el mapa de
-- canchas se navega sin estar logueado (spec 00, regla 1).
-- Se administran por migracion o desde el dashboard, nunca desde la app.
-- ---------------------------------------------------------------------
grant select on public.sede to anon, authenticated;
grant select on public.cancha to anon, authenticated;

create policy sede_select_publica on public.sede
  for select to anon, authenticated
  using (true);

create policy cancha_select_publica on public.cancha
  for select to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------
-- empleado: cada empleado puede confirmar que el mismo es staff. No
-- necesita ver la lista del resto para el MVP.
-- ---------------------------------------------------------------------
grant select on public.empleado to authenticated;

create policy empleado_select_propio on public.empleado
  for select to authenticated
  using ((select auth.uid()) = usuario_id);

-- ---------------------------------------------------------------------
-- reserva: la ve el dueno, o cualquier empleado activo de la sede a la
-- que pertenece la cancha reservada. Sin importar el estado: el staff
-- tiene que ver tambien las 'pendiente_pago' en su agenda (spec 03).
--
-- Sin grant de insert/update/delete: crear_reserva, validar_llegada,
-- confirmar_reserva y cancelar_reserva son las unicas vias de escritura.
-- ---------------------------------------------------------------------
grant select on public.reserva to authenticated;

create policy reserva_select_dueno_o_staff on public.reserva
  for select to authenticated
  using (
    usuario_id = (select auth.uid())
    or public.es_empleado_de_sede(public.sede_de_cancha(cancha_id))
  );

-- ---------------------------------------------------------------------
-- pago (fase 2): mismo criterio que reserva.
-- La condicion se apoya en la policy de reserva: el EXISTS solo
-- encuentra la fila si el que consulta ya tiene permiso de verla, asi
-- que la regla no queda duplicada en dos lugares.
--
-- Escribe unicamente la Edge Function del webhook de Mercado Pago, que
-- usa la service role key y por lo tanto ignora RLS por completo.
-- ---------------------------------------------------------------------
grant select on public.pago to authenticated;

create policy pago_select_dueno_o_staff on public.pago
  for select to authenticated
  using (exists (select 1 from public.reserva r where r.id = reserva_id));
