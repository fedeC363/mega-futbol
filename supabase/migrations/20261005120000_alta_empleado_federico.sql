-- =====================================================================
-- Mega Futbol - Alta de Federico como empleado de San Justo
--
-- "Ser staff" es tener una fila activa en empleado (spec 04): no hay
-- rol de admin ni jerarquia, cualquier empleado activo puede hacer
-- todo lo del panel. Por eso "hacer admin a fjcuda@gmail.com" se
-- resuelve con esta fila y nada mas.
--
-- Va como migracion para que el alta quede versionada y se reconstruya
-- sola si el proyecto se rearma desde cero. Si la cuenta todavia no
-- existe en auth.users, el insert no hace nada: hay que registrarse
-- primero en la app y recien despues aplicar esto.
-- =====================================================================

insert into public.empleado (usuario_id, sede_id)
select u.id, 'a5f0c1d2-0000-4000-8000-000000000001'
from auth.users u
where u.email = 'fjcuda@gmail.com'
on conflict (usuario_id) do nothing;
