-- =====================================================================
-- Mega Futbol - Datos iniciales: sede San Justo y sus 20 canchas
-- Ver specs/01-modelo-de-datos.txt (datos reales confirmados)
--
-- Va como migracion y no como seed local porque son datos de
-- produccion: las canchas existen de verdad y el sistema no sirve sin
-- ellas. Es idempotente, se puede reaplicar sin duplicar nada.
--
--   canchas | numeros | capacidad | precio_base | modalidad
--   --------|---------|-----------|-------------|-----------
--        6  |  1 - 6  |    10     |   40.000    | futbol 5
--        4  |  7 - 10 |    12     |   52.000    | futbol 6
--        6  | 11 - 16 |    14     |   60.000    | futbol 7
--        4  | 17 - 20 |    16     |   72.000    | futbol 8
--
-- La modalidad se deduce de la capacidad (10->5, 12->6, 14->7, 16->8),
-- por eso no hay una columna aparte todavia.
-- =====================================================================

-- Id fijo para que la sede sea la misma en local, en staging y en
-- produccion, y para poder referenciarla desde migraciones futuras.
insert into public.sede (id, nombre, direccion)
values ('a5f0c1d2-0000-4000-8000-000000000001', 'San Justo', null)
on conflict (id) do nothing;

insert into public.cancha (sede_id, numero, capacidad, precio_base)
select
  'a5f0c1d2-0000-4000-8000-000000000001',
  n,
  case
    when n <= 6  then 10
    when n <= 10 then 12
    when n <= 16 then 14
    else              16
  end,
  case
    when n <= 6  then 40000
    when n <= 10 then 52000
    when n <= 16 then 60000
    else              72000
  end
from generate_series(1, 20) as n
on conflict (sede_id, numero) do nothing;
