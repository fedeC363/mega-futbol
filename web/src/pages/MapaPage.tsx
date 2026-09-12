import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CourtsMap } from '../components/CourtsMap';
import { DateStrip } from '../components/DateStrip';
import { LegendBar } from '../components/LegendBar';
import { ReservationPanel, type ReservaPendiente } from '../components/ReservationPanel';
import { Aviso, Cargando } from '../components/ui';
import { useCargado } from '../hooks/useCargado';
import { tipoDeCancha, type CanchaMapa } from '../lib/canchas';
import { cn } from '../lib/cn';
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

export function MapaPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Si viene de ingresar con una reserva a medio hacer, se retoma.
  const [restaurar, setRestaurar] = useState<ReservaPendiente | null>(
    () => (location.state as { reserva?: ReservaPendiente } | null)?.reserva ?? null,
  );
  useEffect(() => {
    // Limpia el state para que un refresh no reabra el panel.
    if (location.state) navigate('.', { replace: true, state: null });
  }, [location.state, navigate]);

  const sede = useCargado(cargarSede, []);
  const parametros = useCargado(cargarParametros, []);
  const sedeId = sede.data?.id;
  const canchas = useCargado(() => (sedeId ? cargarCanchas(sedeId) : Promise.resolve([])), [sedeId]);

  const [fecha, setFecha] = useState<string | null>(restaurar?.fecha ?? null);
  useEffect(() => {
    if (fecha === null && parametros.data) setFecha(fechaPorDefecto(parametros.data));
  }, [fecha, parametros.data]);

  const ocupacion = useCargado(
    () => (sedeId && fecha ? cargarOcupacion(sedeId, fecha) : Promise.resolve(null)),
    [sedeId, fecha],
  );

  const [seleccionId, setSeleccionId] = useState<string | null>(restaurar?.canchaId ?? null);

  const canchasMapa: CanchaMapa[] = useMemo(
    () =>
      (canchas.data ?? []).map((c) => ({
        ...c,
        tipo: tipoDeCancha(c.capacidad),
        // Mientras carga la ocupacion, nada se muestra como ocupado.
        ocupada: ocupacion.data ? (ocupacion.data.get(c.id) ?? 0) === 0 : false,
      })),
    [canchas.data, ocupacion.data],
  );

  const seleccionada = canchasMapa.find((c) => c.id === seleccionId) ?? null;

  function seleccionar(id: string) {
    setSeleccionId(id);
    setRestaurar(null);
  }
  function cambiarFecha(f: string) {
    setFecha(f);
    setRestaurar(null);
  }
  const cerrar = () => setSeleccionId(null);

  useEffect(() => {
    if (!seleccionId) return;
    const alPresionar = (e: KeyboardEvent) => e.key === 'Escape' && setSeleccionId(null);
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [seleccionId]);

  const error = sede.error ?? canchas.error ?? ocupacion.error;
  const p = parametros.data;

  return (
    <div className="flex flex-1 flex-col md:min-h-0">
      <LegendBar canchas={canchasMapa} />
      <DateStrip fecha={fecha} onCambiar={cambiarFecha} />

      <div className="flex-1 md:flex md:min-h-0">
        <main className="px-3.5 pt-4 pb-28 md:flex-1 md:overflow-y-auto md:px-8 md:pt-5 md:pb-10">
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
          ) : (
            <CourtsMap canchas={canchasMapa} seleccionadaId={seleccionId} onSeleccionar={seleccionar} />
          )}

          {p && (
            <p className="mt-3.5 text-center text-[11px] text-cream-dim">
              Precios por turno de 1h · recargo {porcentajeRecargo(p)}% desde las {horaCorta(p.recargoDesde)}
            </p>
          )}
        </main>

        {/* Mobile: overlay + bottom sheet. Desktop: panel fijo a la derecha. */}
        {seleccionada && (
          <div className="fixed inset-0 z-40 bg-[rgb(4_8_6/0.55)] md:hidden" onClick={cerrar} aria-hidden="true" />
        )}
        <aside
          aria-label="Reserva"
          className={cn(
            'z-50 overflow-y-auto border-cream/10 bg-panel',
            seleccionada
              ? 'fixed inset-x-0 bottom-0 max-h-[88dvh] animate-subir rounded-t-[20px] border-t px-5 pt-[18px] pb-[22px]'
              : 'hidden',
            'md:static md:block md:max-h-none md:w-[380px] md:shrink-0 md:animate-none md:rounded-none md:border-t-0 md:border-l md:px-6 md:py-[26px]',
          )}
        >
          {seleccionada && fecha ? (
            <ReservationPanel
              key={`${seleccionada.id}-${fecha}`}
              cancha={seleccionada}
              fecha={fecha}
              parametros={p}
              horaInicial={restaurar?.canchaId === seleccionada.id && restaurar.fecha === fecha ? restaurar.hora : null}
              onCerrar={cerrar}
              onReservada={ocupacion.recargar}
            />
          ) : (
            <div className="mt-10 text-center text-[13.5px] leading-relaxed text-cream-dim">
              <span className="mb-2.5 block text-[34px]" aria-hidden="true">
                ⚽
              </span>
              Seleccioná una cancha en el mapa
              <br />
              para ver disponibilidad y reservar.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
