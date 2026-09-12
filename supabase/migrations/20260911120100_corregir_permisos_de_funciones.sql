-- =====================================================================
-- Mega Futbol - Corregir permisos de ejecucion de funciones
--
-- La migracion 20260906120300 revoco EXECUTE solo de PUBLIC. Pero en
-- Supabase cada funcion nueva del schema public recibe ademas un GRANT
-- EXPLICITO a anon y authenticated (default privileges de la
-- plataforma), asi que ese revoke no alcanzaba: el rol anonimo podia
-- ejecutar todas las funciones, incluidas crear_reserva y las del
-- panel de staff.
--
-- No habia un agujero explotable (cada funcion valida por dentro que
-- haya sesion o que el que llama sea empleado), pero se perdia la
-- primera capa de defensa. Esta migracion la restituye.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Funciones internas: solo las llaman otras funciones SECURITY
--    DEFINER (que corren como owner) o el trigger. Ningun cliente.
-- ---------------------------------------------------------------------
revoke execute on function public.handle_new_user()            from anon, authenticated;
revoke execute on function public.ahora_local()                from anon, authenticated;
revoke execute on function public.precio_turno(numeric, time)  from anon, authenticated;
revoke execute on function public.es_turno_valido(time)        from anon, authenticated;
revoke execute on function public.empleado_a_cargo(uuid)       from anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Helpers de RLS: las policies de reserva, usuario y pago los
--    evaluan CON EL ROL DEL QUE CONSULTA, asi que authenticated tiene
--    que conservar EXECUTE o se rompe la RLS. Se le quita solo a anon,
--    que nunca evalua esas policies (son "to authenticated").
-- ---------------------------------------------------------------------
revoke execute on function public.es_empleado_de_sede(uuid)    from anon;
revoke execute on function public.sede_de_cancha(uuid)         from anon;

-- ---------------------------------------------------------------------
-- 3. Funciones que requieren sesion: fuera anon.
-- ---------------------------------------------------------------------
revoke execute on function public.crear_reserva(uuid, date, time)  from anon;
revoke execute on function public.mi_empleado()                    from anon;
revoke execute on function public.confirmar_reserva(uuid)          from anon;
revoke execute on function public.validar_llegada(uuid)            from anon;
revoke execute on function public.cancelar_reserva(uuid, boolean)  from anon;
revoke execute on function public.max_reservas_activas()           from anon;

-- disponibilidad() y los parametros publicos (horarios, recargo, sena,
-- anticipacion) quedan ejecutables por anon a proposito: el mapa y el
-- cuadro horario se navegan sin login.

-- ---------------------------------------------------------------------
-- 4. Cerrado por defecto para lo que venga: toda funcion nueva que cree
--    postgres en public nace SIN execute para los roles del cliente, y
--    hay que concederlo explicitamente en su migracion. Evita repetir
--    este mismo error la proxima vez.
-- ---------------------------------------------------------------------
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
