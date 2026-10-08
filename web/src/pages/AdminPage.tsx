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
import type { Cancha, Configuracion } from '../lib/tipos';
import { validarEntero, validarHora } from '../lib/validacion';

/**
 * Panel de admin: precios de las canchas, alta/baja y parametros
 * globales. Solo para empleados con rol 'admin'; la base lo vuelve a
 * verificar en cada funcion, esta pantalla solo evita mostrar lo que no
 * se puede usar.
 *
 * Todos los campos son de texto y se escriben con el teclado. Nada de
 * flechitas, relojes ni carteles de validacion del navegador: los
 * errores los decide y los muestra la app (ver lib/validacion).
 */
export function AdminPage() {
  const { session, esAdmin, cargando } = useAuth();
  const config = useCargado(cargarConfiguracion, []);
  const sede = useCargado(cargarSede, []);
  const sedeId = sede.data?.id;
  // false: el admin tambien ve las canchas dadas de baja.
  const canchas = useCargado(() => (sedeId ? cargarCanchas(sedeId, false) : Promise.resolve([])), [sedeId]);

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

  return (
    <Pagina titulo="Panel de admin" subtitulo="Precios, horarios y disponibilidad del predio" ancho="max-w-3xl">
      <section>
        <h2 className="text-[11px] tracking-[1.2px] text-cream-dim uppercase">Parámetros del negocio</h2>
        {config.error && (
          <div className="mt-3">
            <Aviso>{config.error}</Aviso>
          </div>
        )}
        {!config.data && config.cargando && <Cargando />}
        {config.data && (
          // key: si se recarga la config, el formulario vuelve a arrancar
          // de los valores guardados.
          <FormularioParametros
            key={config.data.actualizado_at}
            config={config.data}
            onGuardado={config.recargar}
          />
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-[11px] tracking-[1.2px] text-cream-dim uppercase">Canchas</h2>
        {canchas.error && <Aviso>{canchas.error}</Aviso>}
        {canchas.cargando && !canchas.data && <Cargando />}
        {sedeId && canchas.data && (
          <AccionesMasivas sedeId={sedeId} canchas={canchas.data} onCambio={canchas.recargar} />
        )}
        <ul className="mt-3 grid gap-2">
          {(canchas.data ?? []).map((cancha) => (
            <FilaCancha key={cancha.id} cancha={cancha} onGuardada={canchas.recargar} />
          ))}
        </ul>
      </section>
    </Pagina>
  );
}

type Campos = 'primer' | 'ultimo' | 'recargo' | 'porcentaje' | 'sena' | 'tope' | 'anticipacion';

function FormularioParametros({ config, onGuardado }: { config: Configuracion; onGuardado: () => void }) {
  const [valores, setValores] = useState<Record<Campos, string>>({
    primer: horaCorta(config.hora_primer_turno),
    ultimo: horaCorta(config.hora_ultimo_turno),
    recargo: horaCorta(config.hora_recargo_desde),
    porcentaje: String(Math.round((config.factor_recargo - 1) * 100)),
    sena: String(Math.round(config.monto_sena)),
    tope: String(config.max_reservas_activas),
    anticipacion: String(config.dias_anticipacion_max),
  });
  const [errores, setErrores] = useState<Partial<Record<Campos, string>>>({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const escribir = (campo: Campos) => (e: { target: { value: string } }) => {
    setValores((v) => ({ ...v, [campo]: e.target.value }));
    setErrores(({ [campo]: _, ...resto }) => resto);
    setMensaje(null);
  };

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMensaje(null);

    const primer = validarHora(valores.primer);
    const ultimo = validarHora(valores.ultimo);
    const recargo = validarHora(valores.recargo);
    const porcentaje = validarEntero(valores.porcentaje, { min: 0, max: 200 });
    const sena = validarEntero(valores.sena, { min: 1, max: 10_000_000 });
    const tope = validarEntero(valores.tope, { min: 1, max: 20 });
    const anticipacion = validarEntero(valores.anticipacion, { min: 1, max: 365 });

    const nuevos: Partial<Record<Campos, string>> = {};
    if (!primer.ok) nuevos.primer = primer.error;
    if (!ultimo.ok) nuevos.ultimo = ultimo.error;
    if (!recargo.ok) nuevos.recargo = recargo.error;
    if (!porcentaje.ok) nuevos.porcentaje = porcentaje.error;
    if (!sena.ok) nuevos.sena = sena.error;
    if (!tope.ok) nuevos.tope = tope.error;
    if (!anticipacion.ok) nuevos.anticipacion = anticipacion.error;

    // Reglas cruzadas: las mismas que tiene la base como checks, pero
    // avisadas antes de ir y volver.
    if (primer.ok && ultimo.ok && primer.valor >= ultimo.valor) {
      nuevos.ultimo = 'El último turno tiene que empezar después del primero.';
    }
    if (primer.ok && ultimo.ok && recargo.ok && (recargo.valor < primer.valor || recargo.valor > ultimo.valor)) {
      nuevos.recargo = 'El recargo tiene que caer dentro del horario de los turnos.';
    }

    if (Object.keys(nuevos).length > 0) {
      setErrores(nuevos);
      return;
    }
    if (!primer.ok || !ultimo.ok || !recargo.ok || !porcentaje.ok || !sena.ok || !tope.ok || !anticipacion.ok) return;

    setGuardando(true);
    const { error } = await supabase.rpc('actualizar_configuracion', {
      p_hora_primer_turno: primer.valor,
      p_hora_ultimo_turno: ultimo.valor,
      p_hora_recargo_desde: recargo.valor,
      p_factor_recargo: 1 + porcentaje.valor / 100,
      p_monto_sena: sena.valor,
      p_max_reservas_activas: tope.valor,
      p_dias_anticipacion_max: anticipacion.valor,
    });
    setGuardando(false);
    if (error) return setError(mensajeDeError(error));

    // La config esta cacheada en toda la app: hay que soltarla.
    cargarParametros.invalidar();
    setMensaje('Configuración guardada.');
    onGuardado();
  }

  // noValidate: la validacion la hace la app, no el navegador.
  return (
    <form onSubmit={guardar} noValidate className="mt-3 rounded-xl border border-cream/10 bg-panel p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="primer"
          etiqueta="Primer turno"
          value={valores.primer}
          onChange={escribir('primer')}
          error={errores.primer}
          ayuda="Formato HH:MM, en punto."
          inputMode="numeric"
          autoComplete="off"
        />
        <Campo
          id="ultimo"
          etiqueta="Último turno"
          value={valores.ultimo}
          onChange={escribir('ultimo')}
          error={errores.ultimo}
          ayuda="Hora en que empieza el último turno."
          inputMode="numeric"
          autoComplete="off"
        />
        <Campo
          id="recargo"
          etiqueta="Recargo desde"
          value={valores.recargo}
          onChange={escribir('recargo')}
          error={errores.recargo}
          ayuda="Desde esta hora el turno sale más caro."
          inputMode="numeric"
          autoComplete="off"
        />
        <Campo
          id="porcentaje"
          etiqueta="Recargo (%)"
          value={valores.porcentaje}
          onChange={escribir('porcentaje')}
          error={errores.porcentaje}
          ayuda="Entre 0 y 200."
          inputMode="numeric"
          autoComplete="off"
        />
        <Campo
          id="sena"
          etiqueta="Seña ($)"
          value={valores.sena}
          onChange={escribir('sena')}
          error={errores.sena}
          ayuda="Pesos enteros."
          inputMode="numeric"
          autoComplete="off"
        />
        <Campo
          id="tope"
          etiqueta="Tope de reservas activas"
          value={valores.tope}
          onChange={escribir('tope')}
          error={errores.tope}
          ayuda="Por usuario, entre 1 y 20."
          inputMode="numeric"
          autoComplete="off"
        />
        <Campo
          id="anticipacion"
          etiqueta="Días de anticipación"
          value={valores.anticipacion}
          onChange={escribir('anticipacion')}
          error={errores.anticipacion}
          ayuda="Con cuánto tiempo se puede reservar."
          inputMode="numeric"
          autoComplete="off"
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
  );
}

/** Activar o dar de baja todas las canchas de la sede de una vez. */
function AccionesMasivas({
  sedeId,
  canchas,
  onCambio,
}: {
  sedeId: string;
  canchas: Cancha[];
  onCambio: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const activas = canchas.filter((c) => c.activa).length;
  const inactivas = canchas.length - activas;

  async function cambiarTodas(activa: boolean) {
    setTrabajando(true);
    setError(null);
    setMensaje(null);
    const { data, error } = await supabase.rpc('actualizar_canchas_sede', {
      p_sede_id: sedeId,
      p_activa: activa,
    });
    setTrabajando(false);
    setConfirmando(false);
    if (error) return setError(mensajeDeError(error));
    setMensaje(
      data === 0
        ? 'No hubo cambios: ya estaban todas así.'
        : `${data} ${data === 1 ? 'cancha' : 'canchas'} ${activa ? 'activadas' : 'dadas de baja'}.`,
    );
    onCambio();
  }

  return (
    <div className="mt-3 rounded-xl border border-cream/10 bg-panel px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-[13px] text-cream-dim">
          {activas} {activas === 1 ? 'activa' : 'activas'}
          {inactivas > 0 && <> · {inactivas} de baja</>}
        </p>
        {!confirmando && (
          <div className="ml-auto flex flex-wrap gap-2">
            <Boton
              variante="secundaria"
              className="px-3.5 py-2 text-[13px]"
              disabled={trabajando || inactivas === 0}
              onClick={() => cambiarTodas(true)}
            >
              Activar todas
            </Boton>
            <Boton
              variante="secundaria"
              className="px-3.5 py-2 text-[13px]"
              disabled={trabajando || activas === 0}
              onClick={() => setConfirmando(true)}
            >
              Desactivar todas
            </Boton>
          </div>
        )}
      </div>

      {confirmando && (
        <div className="mt-3 rounded-[10px] border border-cream/12 bg-pitch/60 p-3">
          <p className="text-[13px]">
            ¿Dar de baja las {activas} canchas activas? Nadie va a poder reservar turnos nuevos. Las reservas que ya
            existen no se cancelan.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Boton className="px-3.5 py-2 text-[13px]" disabled={trabajando} onClick={() => cambiarTodas(false)}>
              {trabajando ? 'Dando de baja…' : 'Sí, dar de baja todas'}
            </Boton>
            <Boton variante="fantasma" className="px-3.5 py-2 text-[13px]" onClick={() => setConfirmando(false)}>
              Volver
            </Boton>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2.5">
          <Aviso>{error}</Aviso>
        </div>
      )}
      {mensaje && <p className="mt-2 text-[12px] text-turf-light">{mensaje}</p>}
    </div>
  );
}

function FilaCancha({ cancha, onGuardada }: { cancha: Cancha; onGuardada: () => void }) {
  const [precio, setPrecio] = useState(String(Math.round(cancha.precio_base)));
  const [activa, setActiva] = useState(cancha.activa);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambio = precio.trim() !== String(Math.round(cancha.precio_base)) || activa !== cancha.activa;

  async function guardar() {
    const validado = validarEntero(precio, { min: 1, max: 10_000_000 });
    if (!validado.ok) {
      setError(validado.error);
      return;
    }
    setGuardando(true);
    setError(null);
    const { error } = await supabase.rpc('actualizar_cancha', {
      p_cancha_id: cancha.id,
      p_precio_base: validado.valor,
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
          Precio $
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={precio}
            onChange={(e) => {
              setPrecio(e.target.value);
              setError(null);
            }}
            aria-label={`Precio de la cancha ${cancha.numero}`}
            aria-invalid={error ? true : undefined}
            className={cn(
              'w-28 rounded-lg border bg-pitch px-2.5 py-1.5 text-[14px] text-cream outline-none focus:border-orange',
              error ? 'border-orange' : 'border-cream/12',
            )}
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
        <p role="alert" className="mt-2 text-[12px] text-orange">
          {error}
        </p>
      )}
    </li>
  );
}
