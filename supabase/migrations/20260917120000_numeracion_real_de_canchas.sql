-- =====================================================================
-- Mega Futbol - Numeracion real de las canchas
--
-- La numeracion del seed original (spec 01) era sugerida: agrupaba los
-- numeros por modalidad en bloques ordenados. La real del predio, la
-- que usan los bocetos, es otra:
--
--   F5 ($40.000, 10 jugadores) -> canchas 7, 8, 9, 10, 11 y 20
--   F6 ($52.000, 12 jugadores) -> canchas 12 a 15
--   F7 ($60.000, 14 jugadores) -> canchas 1 a 6
--   F8 ($72.000, 16 jugadores) -> canchas 16 a 19
--
-- Se corrigen capacidad y precio_base de cada numero; los numeros en si
-- no se tocan, asi que no hay conflicto con el unique (sede_id, numero)
-- ni se pierde el historial de reservas de ninguna cancha.
--
-- Las reservas ya creadas conservan su precio_total, que se congela al
-- reservar (spec 01): un cambio de precio_base no las afecta.
-- =====================================================================

update public.cancha
set capacidad = datos.capacidad,
    precio_base = datos.precio
from (
  values
    (10, 40000::numeric, array[7, 8, 9, 10, 11, 20]),
    (12, 52000::numeric, array[12, 13, 14, 15]),
    (14, 60000::numeric, array[1, 2, 3, 4, 5, 6]),
    (16, 72000::numeric, array[16, 17, 18, 19])
) as datos(capacidad, precio, numeros)
where public.cancha.numero = any (datos.numeros)
  and public.cancha.sede_id = 'a5f0c1d2-0000-4000-8000-000000000001';
