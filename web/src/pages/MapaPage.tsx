import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CourtsMap } from '../components/CourtsMap';
import { DateStrip } from '../components/DateStrip';
import { LegendBar } from '../components/LegendBar';
import { Aviso, Cargando } from '../components/ui';
import { useCargado } from '../hooks/useCargado';
import { nivelDeOcupacion, tipoDeCancha, type CanchaMapa } from '../lib/canchas';
import {
  cargarCanchas,
  cargarOcupacion,
  cargarParametros,
  cargarSede,
  horaEntera,
  porcentajeRecargo,
  type Parametros,
} from '../lib/datos';
import { horaActualBA, horaCorta, hoyBA, sumarDias } from '../lib/fechas';

/** Hoy, salvo que ya no quede ningun turno por empezar: entonces mañana. */
function fechaPorDefecto(p: Parametros): string {
  return horaActualBA() < horaEntera(p.ultimoTurno) ? hoyBA() : sumarDias(hoyBA(), 1);
}

/** Mapa del predio. Tocar una cancha lleva a su propia pagina de reserva. */
export function MapaPage() {
  const navigate = useNavigate();

  const sede = useCargado(cargarSede, []);
  const parametros = useCargado(cargarParametros, []);
  const sedeId = sede.data?.id;
  const canchas = useCargado(() => (sedeId ? cargarCanchas(sedeId) : Promise.resolve([])), [sedeId]);

  const [fecha, setFecha] = useState<string | null>(null);
  useEffect(() => {
    if (fecha === null && parametros.data) setFecha(fechaPorDefecto(parametros.data));
  }, [fecha, parametros.data]);

  const ocupacion = useCargado(
    () => (sedeId && fecha ? cargarOcupacion(sedeId, fecha) : Promise.resolve(null)),
    [sedeId, fecha],
  );

  const canchasMapa: CanchaMapa[] = useMemo(
    () =>
      (canchas.data ?? []).map((c) => {
        const ocup = ocupacion.data?.get(c.id);
        const porcentaje = ocup?.porcentaje ?? 0;
        return {
          ...c,
          tipo: tipoDeCancha(c.capacidad),
          // Mientras carga la ocupacion, nada se muestra como ocupado.
          ocupada: ocup ? ocup.libres === 0 : false,
          porcentaje,
          nivel: nivelDeOcupacion(porcentaje),
        };
      }),
    [canchas.data, ocupacion.data],
  );

  const error = sede.error ?? canchas.error ?? ocupacion.error;
  const p = parametros.data;

  return (
    <div className="flex flex-1 flex-col md:min-h-0">
      <LegendBar canchas={canchasMapa} />
      <DateStrip fecha={fecha} onCambiar={setFecha} />

      <main className="px-3.5 pt-4 pb-28 md:flex-1 md:overflow-y-auto md:px-8 md:pt-5 md:pb-10">
        {/* max-w-3xl y no 5xl: con las canchas mas chicas, el pulso del
            hover se ve mas prolijo y el mapa entra mejor en pantalla. */}
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="sr-only">Reservá una cancha en Mega Fútbol</h1>
          <p className="mx-0.5 mb-2.5 text-[11px] tracking-[1.2px] text-cream-dim uppercase md:mb-3.5">
            Mapa del predio · <span className="md:hidden">tocá</span>
            <span className="hidden md:inline">hacé click en</span> una cancha para reservar
          </p>

          {error && (
            <div className="mb-3">
              <Aviso>{error}</Aviso>
            </div>
          )}
          {canchas.cargando && !canchas.data?.length ? (
            <Cargando texto="Cargando el mapa…" />
          ) : canchas.data?.length === 0 ? (
            // Todas las canchas dadas de baja: el mapa vacio no dice nada.
            <div className="rounded-xl border border-cream/10 bg-panel px-5 py-10 text-center">
              <p className="text-[15px] font-medium">Por el momento no hay canchas disponibles para reservar</p>
              <p className="mx-auto mt-2 max-w-sm text-[13px] text-cream-dim">
                Escribinos y te avisamos cuando se habiliten de nuevo.
              </p>
              <Link to="/contacto" className="mt-4 inline-block text-[14px] font-semibold text-orange">
                Ver contacto →
              </Link>
            </div>
          ) : (
            <CourtsMap
              canchas={canchasMapa}
              seleccionadaId={null}
              onSeleccionar={(id) => navigate(`/cancha/${id}?fecha=${fecha ?? hoyBA()}`)}
            />
          )}

          {p && (
            <p className="mt-3.5 text-center text-[11px] text-cream-dim">
              Precios por turno de 1h · recargo {porcentajeRecargo(p)}% desde las {horaCorta(p.recargoDesde)}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
