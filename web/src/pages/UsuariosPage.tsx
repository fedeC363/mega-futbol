import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Pagina } from '../components/Pagina';
import { Aviso, Campo, Cargando, Insignia } from '../components/ui';
import { useCargado } from '../hooks/useCargado';
import { cargarParametros } from '../lib/datos';
import { CLASES_SANCION, sancionDe } from '../lib/sanciones';
import { supabase } from '../lib/supabase';
import { SinPermiso } from './SinPermiso';

/**
 * Listado de clientes para el admin. Los empleados no aparecen: esto es
 * para mirar a quien reserva.
 *
 * La busqueda la resuelve la base (por nombre o mail) y no el
 * navegador, porque la lista puede ser larga y el email ni siquiera
 * esta en la tabla usuario.
 */
export function UsuariosPage() {
  const { session, esAdmin, cargando } = useAuth();
  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const parametros = useCargado(cargarParametros, []);

  // Espera a que deje de tipear antes de consultar.
  useEffect(() => {
    const id = setTimeout(() => setBusqueda(texto.trim()), 300);
    return () => clearTimeout(id);
  }, [texto]);

  const usuarios = useCargado(async () => {
    if (!esAdmin) return null;
    const { data, error } = await supabase.rpc('usuarios_para_admin', {
      p_busqueda: busqueda || undefined,
    });
    if (error) throw error;
    return data;
  }, [esAdmin, busqueda]);

  if (cargando) {
    return (
      <Pagina titulo="Usuarios">
        <Cargando />
      </Pagina>
    );
  }
  if (!session || !esAdmin) return <SinPermiso titulo="Usuarios" volverA="/admin/usuarios" hayDesesion={!session} />;

  const lista = usuarios.data ?? [];

  return (
    <Pagina
      titulo="Usuarios"
      subtitulo="Clientes del predio. Los empleados no figuran acá."
      ancho="max-w-3xl"
      acciones={
        <Link to="/admin" className="text-[13px] text-cream-dim hover:text-cream">
          ← Panel de admin
        </Link>
      }
    >
      <Campo
        id="busqueda"
        etiqueta="Buscar"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Nombre o mail"
        autoComplete="off"
      />

      <div className="mt-5">
        {usuarios.error && <Aviso>{usuarios.error}</Aviso>}
        {usuarios.cargando && !usuarios.data && <Cargando texto="Buscando…" />}

        {usuarios.data && lista.length === 0 && (
          <p className="rounded-xl border border-cream/10 bg-panel px-5 py-8 text-center text-[14px] text-cream-dim">
            {busqueda ? `No hay usuarios que coincidan con "${busqueda}".` : 'Todavía no hay usuarios registrados.'}
          </p>
        )}

        <ul className="grid gap-2">
          {lista.map((u) => {
            const sancion = sancionDe(u, parametros.data);
            return (
              <li key={u.id}>
                <Link
                  to={`/admin/usuarios/${u.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-cream/10 bg-panel px-4 py-3.5 hover:border-cream/25"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{u.nombre}</p>
                    <p className="truncate text-[13px] text-cream-dim">
                      {u.email}
                      {u.telefono && <> · {u.telefono}</>}
                    </p>
                  </div>

                  {u.reservas_activas > 0 && (
                    <span className="text-[12px] text-cream-dim">
                      {u.reservas_activas} {u.reservas_activas === 1 ? 'reserva' : 'reservas'} a futuro
                    </span>
                  )}
                  {sancion && <Insignia clases={CLASES_SANCION[sancion.tipo]}>⚠ {sancion.etiqueta}</Insignia>}
                  <span className="text-orange" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {lista.length === 100 && (
          <p className="mt-3 text-[11px] text-cream-dim">
            Se muestran los primeros 100. Afiná la búsqueda para encontrar a alguien puntual.
          </p>
        )}
      </div>
    </Pagina>
  );
}
