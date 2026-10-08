import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Pagina } from '../components/Pagina';
import { Aviso, Boton, Campo } from '../components/ui';
import { cn } from '../lib/cn';
import { mensajeDeErrorAuth } from '../lib/errores';
import { supabase } from '../lib/supabase';
import { validarTelefono } from '../lib/validacion';

/** A donde volver despues de ingresar; lo manda la pagina que trajo acá. */
interface EstadoVuelta {
  volverA?: string;
}

/**
 * Sin boceto todavia: formulario simple con los tokens de la marca.
 * Registro con nombre y telefono obligatorios (el trigger los copia a
 * public.usuario desde los metadatos, spec 02).
 */
export function IngresarPage() {
  const { session, cargando } = useAuth();
  const navigate = useNavigate();
  const vuelta = (useLocation().state as EstadoVuelta | null) ?? {};
  const volverA = vuelta.volverA;
  const [modo, setModo] = useState<'ingresar' | 'registro'>('ingresar');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorTelefono, setErrorTelefono] = useState<string | null>(null);
  const [mailEnviadoA, setMailEnviadoA] = useState<string | null>(null);

  if (!cargando && session && !enviando) {
    return <Navigate to={volverA ?? '/perfil'} replace />;
  }

  const continuar = () => navigate(volverA ?? '/', { replace: true });

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email')).trim();
    const password = String(f.get('password'));
    setEnviando(true);
    setError(null);
    setErrorTelefono(null);

    if (modo === 'ingresar') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setEnviando(false);
      if (error) return setError(mensajeDeErrorAuth(error));
      return continuar();
    }

    // Validado por la app, no por el navegador: el cartel nativo de
    // `pattern` no explica nada.
    const telefono = validarTelefono(String(f.get('telefono')));
    if (!telefono.ok) {
      setEnviando(false);
      setErrorTelefono(telefono.error);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: String(f.get('nombre')).trim(),
          telefono: String(f.get('telefono')).trim(),
        },
        emailRedirectTo: window.location.origin,
      },
    });
    setEnviando(false);
    if (error) return setError(mensajeDeErrorAuth(error));
    // Con confirmacion de email activa, Supabase devuelve un usuario sin
    // identidades cuando el email ya estaba registrado (no lo revela).
    if (data.user && data.user.identities?.length === 0) {
      return setError('Ya existe una cuenta con ese email. Probá ingresar.');
    }
    if (data.session) return continuar();
    setMailEnviadoA(email);
  }

  if (mailEnviadoA) {
    return (
      <Pagina titulo="Revisá tu mail" ancho="max-w-md">
        <Aviso tipo="info">
          Te mandamos un link a <b>{mailEnviadoA}</b> para confirmar la cuenta. Después de confirmarla, volvé acá e
          ingresá con tu email y contraseña.
        </Aviso>
        <Boton
          variante="secundaria"
          className="mt-4 w-full"
          onClick={() => {
            setMailEnviadoA(null);
            setModo('ingresar');
          }}
        >
          Ir a ingresar
        </Boton>
      </Pagina>
    );
  }

  return (
    <Pagina
      titulo={modo === 'ingresar' ? 'Ingresá' : 'Creá tu cuenta'}
      subtitulo={
        volverA?.startsWith('/cancha') ? 'Necesitás una cuenta para reservar. No perdés el turno elegido.' : undefined
      }
      ancho="max-w-md"
    >
      <div role="tablist" className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-cream/10 bg-panel p-1">
        {(['ingresar', 'registro'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={modo === m}
            onClick={() => {
              setModo(m);
              setError(null);
            }}
            className={cn(
              'rounded-lg py-2 text-[13px] font-medium transition',
              modo === m ? 'bg-orange text-ink' : 'text-cream-dim hover:text-cream',
            )}
          >
            {m === 'ingresar' ? 'Ya tengo cuenta' : 'Soy nuevo'}
          </button>
        ))}
      </div>

      <form onSubmit={enviar} className="grid gap-4">
        {modo === 'registro' && (
          <>
            <Campo id="nombre" name="nombre" etiqueta="Nombre y apellido" autoComplete="name" required />
            <Campo
              id="telefono"
              name="telefono"
              etiqueta="Teléfono"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              error={errorTelefono ?? undefined}
              ayuda="Lo usa el predio para contactarte por tu reserva."
              required
            />
          </>
        )}
        <Campo id="email" name="email" etiqueta="Email" type="email" autoComplete="email" required />
        <Campo
          id="password"
          name="password"
          etiqueta="Contraseña"
          type="password"
          autoComplete={modo === 'ingresar' ? 'current-password' : 'new-password'}
          minLength={6}
          required
        />

        {error && <Aviso>{error}</Aviso>}

        <Boton type="submit" disabled={enviando} className="mt-1 w-full py-3.5">
          {enviando ? 'Un momento…' : modo === 'ingresar' ? 'Ingresar' : 'Crear cuenta'}
        </Boton>
      </form>
    </Pagina>
  );
}
