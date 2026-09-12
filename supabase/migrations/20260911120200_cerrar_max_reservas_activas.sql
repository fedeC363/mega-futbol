-- =====================================================================
-- Mega Futbol - Cerrar max_reservas_activas() a anon
--
-- La migracion 20260911120100 le revoco EXECUTE a anon, pero esta
-- funcion nunca habia perdido el grant de PUBLIC (la 20260906120300
-- solo le concedio a authenticated, sin revocar PUBLIC primero), y anon
-- lo seguia heredando por ahi. El resto de las funciones privadas si
-- tenian revocado PUBLIC y ya estaban cerradas.
-- =====================================================================

revoke execute on function public.max_reservas_activas() from public;
