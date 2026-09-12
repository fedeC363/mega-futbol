-- =====================================================================
-- Mega Futbol - El staff puede ver el perfil de quien reservo en su sede
-- Ver specs/02-supabase-backend.txt (RLS de usuario) y spec 04
--
-- La agenda del staff tiene que mostrar nombre y telefono del que
-- reservo, para poder contactarlo. Con la policy original de usuario
-- (cada uno ve solo su perfil), el join reserva -> usuario le devolvia
-- null al empleado.
--
-- Alcance acotado a proposito: un empleado ve SOLO a los usuarios que
-- tienen alguna reserva en una cancha de su sede. No puede listar la
-- base de usuarios completa.
-- =====================================================================

create policy usuario_select_staff_de_su_sede on public.usuario
  for select to authenticated
  using (
    exists (
      select 1
      from public.reserva r
      where r.usuario_id = usuario.id
        and public.es_empleado_de_sede(public.sede_de_cancha(r.cancha_id))
    )
  );
