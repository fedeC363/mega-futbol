import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Pagina } from '../components/Pagina';
import { Aviso, Boton, Cargando, Insignia } from '../components/ui';
import { useCargado } from '../hooks/useCargado';
import { tipoDeCancha } from '../lib/canchas';
import { cn } from '../lib/cn';
import { cargarParametros } from '../lib/datos';
import { mensajeDeError } from '../lib/errores';
import { estadoDe } from '../lib/estados';
import { conMayuscula, fechaLegible, horaCorta, horaDeTimestamp, hoyBA, sumarDias } from '../lib/fechas';
import { pesos } from '../lib/formato';
import { CLASES_SANCION, sancionDe } from '../lib/sanciones';
import { supabase } from '../lib/supabase';

/** Filtros de la agenda. 'todos' no filtra nada. */
const FILTROS = [
  { clave: 'todos', etiqueta: 'Todos' },
  { clave: 'pendiente_pago', etiqueta: 'Pendientes' },
  { clave: 'confirmada', etiqueta: 'Confirmados' },
  { clave: 'cancelada', etiqueta: 'Cancelados' },
  { clave: 'no_show', etiqueta: 'No se presentó' },
] as const;

type Filtro = (typeof FILTROS)[number]['clave'];

/**
 * Panel de staff (spec 04). Sin boceto todavia.
 * Agenda del dia de la sede + confirmar seña, validar llegada, marcar
 * inasistencia y cancelar. Los permisos los chequea la base (RLS +
 * funciones), no esta pantalla.
 */
export function StaffPage() {
  const { session, empleado, cargando } = useAuth();
  const [fecha, setFecha] = useState(hoyBA());
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const parametros = useCargado(cargarParametros, []);

  const agenda = useCargado(async () => {
    if (!empleado) return [];
    const { data, error } = await supabase
      .from('reserva')
      .select(
        'id, hora_inicio, estado, precio_total, monto_sena, sena_devuelta, llegada_validada_at, no_show_at, cancha:cancha_id(numero, capacidad), usuario:usuario_id(nombre, telefono, inasistencias, suspendido_hasta, vetado)',
      )
      .eq('fecha', fecha)
      .order('hora_inicio');
    if (error) throw error;
    return [...data].sort(
      (a, b) => a.hora_inicio.localeCompare(b.hora_inicio) || (a.cancha?.numero ?? 0) - (b.cancha?.numero ?? 0),
    );
  }, [fecha, empleado?.empleado_id]);

  async function ejecutar(id: string, accion: () => PromiseLike<{ error: unknown }>) {
    setOcupadoId(id);
    setErrores(({ [id]: _, ...resto }) => resto);
    const { error } = await accion();
    setOcupadoId(null);
    setCancelandoId(null);
    if (error) setErrores((e) => ({ ...e, [id]: mensajeDeError(error) }));
    agenda.recargar();
  }

  if (cargando) {
    return (
      <Pagina titulo="Panel de staff">
        <Cargando />
      </Pagina>
    );
  }
  if (!session || !empleado) {
    return (
      <Pagina titulo="Panel de staff" ancho="max-w-md">
        <p className="text-[14px] text-cream-dim">
          {session ? 'Tu cuenta no tiene acceso al panel de staff.' : 'Ingresá con tu cuenta de empleado.'}
        </p>
        {!session && (
          <Link
            to="/ingresar"
            state={{ volverA: '/staff' }}
            className="mt-4 block rounded-xl bg-orange px-4 py-3.5 text-center text-[15px] font-semibold text-ink"
          >
            Ingresar
          </Link>
        )}
      </Pagina>
    );
  }

  const filas = agenda.data ?? [];
  const activas = filas.filter((r) => r.estado !== 'cancelada');
  const resumen = [
    { etiqueta: 'Turnos', valor: activas.length },
    { etiqueta: 'Pendientes de seña', valor: activas.filter((r) => r.estado === 'pendiente_pago').length },
    { etiqueta: 'Confirmadas', valor: activas.filter((r) => r.estado === 'confirmada').length },
    { etiqueta: 'No se presentaron', valor: filas.filter((r) => r.estado === 'no_show').length },
  ];
  const visibles = filtro === 'todos' ? filas : filas.filter((r) => r.estado === filtro);

  return (
    <Pagina
      titulo="Agenda del día"
      subtitulo={conMayuscula(fechaLegible(fecha))}
      ancho="max-w-3xl"
      acciones={
        <div className="flex items-center gap-1.5">
          {/* Siempre ocupa su lugar, aunque no se vea: si apareciera y
              desapareciera, el selector de fecha saltaría de posición. */}
          <Boton
            variante="fantasma"
            className={cn('px-2 py-2 text-[13px]', fecha === hoyBA() && 'invisible')}
            aria-hidden={fecha === hoyBA()}
            tabIndex={fecha === hoyBA() ? -1 : undefined}
            onClick={() => setFecha(hoyBA())}
          >
            Ir a hoy
          </Boton>
          <Boton variante="secundaria" className="px-3 py-2" aria-label="Día anterior" onClick={() => setFecha(sumarDias(fecha, -1))}>
            ‹
          </Boton>
          <input
            type="date"
            value={fecha}
            onChange={(e) => e.target.value && setFecha(e.target.value)}
            aria-label="Fecha"
            className="rounded-xl border border-cream/15 bg-cream/5 px-3 py-2 text-[14px] text-cream"
          />
          <Boton variante="secundaria" className="px-3 py-2" aria-label="Día siguiente" onClick={() => setFecha(sumarDias(fecha, 1))}>
            ›
          </Boton>
        </div>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {resumen.map((r) => (
          <div key={r.etiqueta} className="rounded-xl border border-cream/10 bg-panel px-3.5 py-2.5">
            <p className="font-display text-2xl leading-none font-bold">{r.valor}</p>
            <p className="mt-1 text-[11px] text-cream-dim">{r.etiqueta}</p>
          </div>
        ))}
      </div>

      <div role="radiogroup" aria-label="Filtrar por estado" className="mb-4 flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const cantidad = f.clave === 'todos' ? filas.length : filas.filter((r) => r.estado === f.clave).length;
          const activo = filtro === f.clave;
          return (
            <button
              key={f.clave}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => setFiltro(f.clave)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-[13px] transition',
                activo
                  ? 'border-orange bg-orange font-semibold text-ink'
                  : 'border-cream/12 bg-panel text-cream-dim hover:text-cream',
              )}
            >
              {f.etiqueta} <span className={activo ? 'text-ink/70' : 'text-cream-dim'}>{cantidad}</span>
            </button>
          );
        })}
      </div>

      {agenda.error && <Aviso>{agenda.error}</Aviso>}
      {agenda.cargando && !agenda.data && <Cargando texto="Cargando la agenda…" />}
      {agenda.data && visibles.length === 0 && (
        <p className="rounded-xl border border-cream/10 bg-panel px-5 py-8 text-center text-[14px] text-cream-dim">
          {filas.length === 0 ? 'No hay reservas para este día.' : 'Ninguna reserva de este día tiene ese estado.'}
        </p>
      )}

      <ul className="grid gap-2.5">
        {visibles.map((r) => {
          const estado = estadoDe(r.estado);
          const cerrada = r.estado === 'cancelada' || r.estado === 'no_show';
          const ocupado = ocupadoId === r.id;
          const sancion = r.usuario ? sancionDe(r.usuario, parametros.data) : null;
          return (
            <li
              key={r.id}
              className={cn('rounded-xl border border-cream/10 bg-panel px-4 py-3.5', cerrada && 'opacity-60')}
            >
              <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                <p className="font-display text-[28px] leading-none font-bold text-orange">{horaCorta(r.hora_inicio)}</p>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    Cancha {r.cancha?.numero} · {r.cancha ? tipoDeCancha(r.cancha.capacidad) : ''}
                  </p>
                  <p className="text-[13px] text-cream-dim">
                    {r.usuario?.nombre ?? 'Sin nombre'}
                    {r.usuario?.telefono && (
                      <>
                        {' · '}
                        <a href={`tel:${r.usuario.telefono}`} className="text-cream underline decoration-cream/30">
                          {r.usuario.telefono}
                        </a>
                      </>
                    )}
                  </p>
                  {sancion && (
                    <p className="mt-1.5">
                      <Insignia clases={CLASES_SANCION[sancion.tipo]}>⚠ {sancion.etiqueta}</Insignia>
                    </p>
                  )}
                </div>
                <Insignia clases={estado.clases}>{estado.etiqueta}</Insignia>
              </div>

              <p className="mt-2 text-[12px] text-cream-dim">
                Turno {pesos(r.precio_total)} · seña {pesos(r.monto_sena)} · resto {pesos(r.precio_total - r.monto_sena)}
                {r.llegada_validada_at && <> · llegó {horaDeTimestamp(r.llegada_validada_at)}</>}
                {r.no_show_at && <> · inasistencia marcada {horaDeTimestamp(r.no_show_at)}</>}
                {r.estado === 'cancelada' && <> · seña {r.sena_devuelta ? 'devuelta' : 'no devuelta'}</>}
              </p>

              {errores[r.id] && (
                <div className="mt-2.5">
                  <Aviso>{errores[r.id]}</Aviso>
                </div>
              )}

              {!cerrada && cancelandoId !== r.id && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.estado === 'pendiente_pago' && (
                    <Boton
                      className="px-3.5 py-2 text-[13px]"
                      disabled={ocupado}
                      onClick={() => ejecutar(r.id, () => supabase.rpc('confirmar_reserva', { p_reserva_id: r.id }))}
                    >
                      Confirmar seña
                    </Boton>
                  )}
                  {!r.llegada_validada_at && (
                    <>
                      <Boton
                        variante="secundaria"
                        className="px-3.5 py-2 text-[13px]"
                        disabled={ocupado}
                        onClick={() => ejecutar(r.id, () => supabase.rpc('validar_llegada', { p_reserva_id: r.id }))}
                      >
                        Validar llegada
                      </Boton>
                      <Boton
                        variante="secundaria"
                        className="px-3.5 py-2 text-[13px]"
                        disabled={ocupado}
                        onClick={() => ejecutar(r.id, () => supabase.rpc('marcar_inasistencia', { p_reserva_id: r.id }))}
                      >
                        No se presentó
                      </Boton>
                    </>
                  )}
                  <Boton
                    variante="fantasma"
                    className="px-3.5 py-2 text-[13px]"
                    disabled={ocupado}
                    onClick={() => setCancelandoId(r.id)}
                  >
                    Cancelar
                  </Boton>
                </div>
              )}

              {cancelandoId === r.id && (
                <div className="mt-3 rounded-[10px] border border-cream/12 bg-pitch/60 p-3">
                  <p className="text-[13px]">
                    ¿Le devolviste la seña de {pesos(r.monto_sena)}? El turno queda libre al cancelar.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Boton
                      variante="secundaria"
                      className="px-3.5 py-2 text-[13px]"
                      disabled={ocupado}
                      onClick={() =>
                        ejecutar(r.id, () => supabase.rpc('cancelar_reserva', { p_reserva_id: r.id, p_sena_devuelta: true }))
                      }
                    >
                      Sí, la devolví
                    </Boton>
                    <Boton
                      variante="secundaria"
                      className="px-3.5 py-2 text-[13px]"
                      disabled={ocupado}
                      onClick={() =>
                        ejecutar(r.id, () => supabase.rpc('cancelar_reserva', { p_reserva_id: r.id, p_sena_devuelta: false }))
                      }
                    >
                      No la devolví
                    </Boton>
                    <Boton variante="fantasma" className="px-3.5 py-2 text-[13px]" onClick={() => setCancelandoId(null)}>
                      Volver
                    </Boton>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Pagina>
  );
}
