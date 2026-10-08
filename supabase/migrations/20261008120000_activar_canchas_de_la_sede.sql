-- =====================================================================
-- Mega Futbol - Activar o desactivar todas las canchas de una sede
--
-- El panel de admin ya permite dar de alta o de baja cancha por cancha.
-- Esto hace lo mismo para todas juntas, en una sola operacion atomica,
-- en vez de 20 llamadas desde el navegador.
--
-- Igual que actualizar_cancha: no cancela reservas ya hechas. Dar de
-- baja solo impide tomar turnos nuevos.
-- =====================================================================

create or replace function public.actualizar_canchas_sede(
  p_sede_id uuid,
  p_activa  boolean
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cantidad int;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede modificar las canchas';
  end if;

  -- `is distinct from` evita reescribir las que ya estaban asi, para
  -- que el numero devuelto sea "cuantas cambiaron" de verdad.
  update public.cancha
  set activa = p_activa
  where sede_id = p_sede_id
    and activa is distinct from p_activa;

  get diagnostics v_cantidad = row_count;
  return v_cantidad;
end;
$$;

revoke execute on function public.actualizar_canchas_sede(uuid, boolean) from public, anon;
grant execute on function public.actualizar_canchas_sede(uuid, boolean) to authenticated;
