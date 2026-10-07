import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Pagina } from '../components/Pagina';
import { Aviso, Boton, Campo, Cargando } from '../components/ui';
import { useCargado } from '../hooks/useCargado';
import { modalidad, tipoDeCancha } from '../lib/canchas';
import { cn } from '../lib/cn';
import { cargarCanchas, cargarConfiguracion, cargarParametros, cargarSede } from '../lib/datos';
import { mensajeDeError } from '../lib/errores';
import { horaCorta } from '../lib/fechas';
import { pesos } from '../lib/formato';
import { supabase } from '../lib/supabase';
import type { Cancha } from '../lib/tipos';

/**
 * Panel de admin: precios de las canchas, alta/baja y parametros
 * globales. Solo para empleados con rol 'admin'; la base lo vuelve a
 * verificar en cada funcion, esta pantalla solo evita mostrar lo que no
 * se puede usar.
 */
export function AdminPage() {
  const { session, esAdmin, cargando } = useAuth();
  const config = useCargado(cargarConfiguracion, []);
  const sede = useCargado(cargarSede, []);
  const sedeId = sede.data?.id;
  // false: el admin tambien ve las canchas dadas de baja.
  const canchas = useCargado(() => (sedeId ? cargarCanchas(sedeId, false) : Promise.resolve([])), [sedeId]);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function guardarConfiguracion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setGuardando(true);
    setError(null);
    setMensaje(null);
    const { error } = await supabase.rpc('actualizar_configuracion', {
      p_hora_primer_turno: String(f.get('primer')),
      p_hora_ultimo_turno: String(f.get('ultimo')),
      p_hora_recargo_desde: String(f.get('recargo')),
      p_factor_recargo: 1 + Number(f.get('porcentaje')) / 100,
      p_monto_sena: Number(f.get('sena')),
      p_max_reservas_activas: Number(f.get('tope')),
      p_dias_anticipacion_max: Number(f.get('anticipacion')),
    });
    setGuardando(false);
    if (error) return setError(mensajeDeError(error));
    // La config esta cacheada en toda la app: hay que soltarla.
    cargarParametros.invalidar();
    config.recargar();
    setMensaje('Configuración guardada.');
  }

  if (cargando) {
    return (
      <Pagina titulo="Panel de admin">
        <Cargando />
      </Pagina>
    );
  }

  if (!session || !esAdmin) {
    return (
      <Pagina titulo="Panel de admin" ancho="max-w-md">
        <p className="text-[14px] text-cream-dim">
          {session ? 'Tu cuenta no tiene permisos de administrador.' : 'Ingresá con tu cuenta de administrador.'}
        </p>
        {!session && (
          <Link
            to="/ingresar"
            state={{ volverA: '/admin' }}
            className="mt-4 block rounded-xl bg-orange px-4 py-3.5 text-center text-[15px] font-semibold text-ink"
          >
            Ingresar
          </Link>
        )}
      </Pagina>
    );
  }

  const c = config.data;

  return (
    <Pagina titulo="Panel de admin" subtitulo="Precios, horarios y disponibilidad del predio" ancho="max-w-3xl">
      {config.error && <Aviso>{config.error}</Aviso>}
      {!c && config.cargando && <Cargando />}

      {c && (
        <section>
          <h2 className="text-[11px] tracking-[1.2px] text-cream-dim uppercase">Parámetros del negocio</h2>
          <form onSubmit={guardarConfiguracion} className="mt-3 rounded-xl border border-cream/10 bg-panel p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="primer" name="primer" etiqueta="Primer turno" type="time" step={3600} defaultValue={horaCorta(c.hora_primer_turno)} required />
              <Campo
                id="ultimo"
                name="ultimo"
                etiqueta="Último turno"
                type="time"
                step={3600}
                defaultValue={horaCorta(c.hora_ultimo_turno)}
                ayuda="Es la hora en que empieza el último turno."
                required
              />
              <Campo id="recargo" name="recargo" etiqueta="Recargo desde" type="time" step={3600} defaultValue={horaCorta(c.hora_recargo_desde)} required />
              <Campo
                id="porcentaje"
                name="porcentaje"
                etiqueta="Recargo (%)"
                type="number"
                min={0}
                max={200}
                step={1}
                defaultValue={Math.round((c.factor_recargo - 1) * 100)}
                required
              />
              <Campo id="sena" name="sena" etiqueta="Seña ($)" type="number" min={1} step={100} defaultValue={c.monto_sena} required />
              <Campo
                id="tope"
                name="tope"
                etiqueta="Tope de reservas activas"
                type="number"
                min={1}
                max={20}
                step={1}
                defaultValue={c.max_reservas_activas}
                required
              />
              <Campo
                id="anticipacion"
                name="anticipacion"
                etiqueta="Días de anticipación"
                type="number"
                min={1}
                max={365}
                step={1}
                defaultValue={c.dias_anticipacion_max}
                required
              />
            </div>

            {error && (
              <div className="mt-4">
                <Aviso>{error}</Aviso>
              </div>
            )}
            {mensaje && (
              <div className="mt-4">
                <Aviso tipo="info">{mensaje}</Aviso>
              </div>
            )}

            <Boton type="submit" disabled={guardando} className="mt-4">
              {guardando ? 'Guardando…' : 'Guardar parámetros'}
            </Boton>
            <p className="mt-2.5 text-[11px] text-cream-dim">
              Cambiar un precio o el recargo no toca las reservas ya hechas: cada una guarda el precio que tenía al
              reservarse.
            </p>
          </form>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-[11px] tracking-[1.2px] text-cream-dim uppercase">Canchas</h2>
        {canchas.error && <Aviso>{canchas.error}</Aviso>}
        {canchas.cargando && !canchas.data && <Cargando />}
        <ul className="mt-3 grid gap-2">
          {(canchas.data ?? []).map((cancha) => (
            <FilaCancha key={cancha.id} cancha={cancha} onGuardada={canchas.recargar} />
          ))}
        </ul>
      </section>
    </Pagina>
  );
}

function FilaCancha({ cancha, onGuardada }: { cancha: Cancha; onGuardada: () => void }) {
  const [precio, setPrecio] = useState(String(cancha.precio_base));
  const [activa, setActiva] = useState(cancha.activa);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambio = Number(precio) !== cancha.precio_base || activa !== cancha.activa;

  async function guardar() {
    setGuardando(true);
    setError(null);
    const { error } = await supabase.rpc('actualizar_cancha', {
      p_cancha_id: cancha.id,
      p_precio_base: Number(precio),
      p_activa: activa,
    });
    setGuardando(false);
    if (error) {
      setError(mensajeDeError(error));
      return;
    }
    onGuardada();
  }

  return (
    <li className={cn('rounded-xl border border-cream/10 bg-panel px-4 py-3', !activa && 'opacity-60')}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <p className="font-display text-xl leading-none font-bold">
          {cancha.numero}
          <span className="ml-2 font-sans text-[12px] font-medium text-cream-dim">
            {modalidad(tipoDeCancha(cancha.capacidad))}
          </span>
        </p>

        <label className="flex items-center gap-2 text-[13px] text-cream-dim">
          Precio
          <input
            type="number"
            min={1}
            step={1000}
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            aria-label={`Precio de la cancha ${cancha.numero}`}
            className="w-28 rounded-lg border border-cream/12 bg-pitch px-2.5 py-1.5 text-[14px] text-cream outline-none focus:border-orange"
          />
        </label>

        <label className="flex items-center gap-2 text-[13px] text-cream-dim">
          <input
            type="checkbox"
            checked={activa}
            onChange={(e) => setActiva(e.target.checked)}
            className="size-4 accent-[#f2622e]"
          />
          {activa ? 'Activa' : 'Dada de baja'}
        </label>

        <div className="ml-auto flex items-center gap-2">
          {!cambio && <span className="text-[12px] text-cream-dim">{pesos(cancha.precio_base)}</span>}
          <Boton className="px-3.5 py-2 text-[13px]" disabled={!cambio || guardando} onClick={guardar}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Boton>
        </div>
      </div>
      {error && (
        <div className="mt-2.5">
          <Aviso>{error}</Aviso>
        </div>
      )}
    </li>
  );
}
