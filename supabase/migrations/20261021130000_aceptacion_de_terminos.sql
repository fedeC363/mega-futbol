-- =====================================================================
-- Mega Futbol - Aceptacion de los terminos y condiciones
--
-- Se guarda CUANDO acepto y QUE version acepto. La version no se usa
-- todavia (hoy siempre es la misma), pero queda para el dia que el
-- texto cambie: ahi va a alcanzar con comparar contra la version
-- vigente para volver a pedir la aceptacion, sin migrar nada.
--
-- El usuario solo puede escribir nombre y telefono de su propia fila
-- (grant por columna, spec 02), asi que la aceptacion pasa por esta
-- funcion y no por un update directo.
-- =====================================================================

alter table public.usuario
  add column terminos_aceptados_at timestamptz,
  add column terminos_version      text;

comment on column public.usuario.terminos_version is
  'Version del texto que acepto. Para volver a pedirlo si el texto cambia.';

create or replace function public.aceptar_terminos(p_version text default 'v1')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Tenés que iniciar sesión para aceptar los términos';
  end if;

  update public.usuario
  set terminos_aceptados_at = now(),
      terminos_version = coalesce(nullif(trim(p_version), ''), 'v1')
  where id = v_uid;
end;
$$;

revoke execute on function public.aceptar_terminos(text) from public, anon;
grant execute on function public.aceptar_terminos(text) to authenticated;
