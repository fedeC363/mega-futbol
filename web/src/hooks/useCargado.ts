import { useEffect, useState, type DependencyList } from 'react';
import { mensajeDeError } from '../lib/errores';

interface Estado<T> {
  data?: T;
  error?: string;
  cargando: boolean;
}

/**
 * Carga asincronica atada a dependencias. Mientras recarga conserva el dato
 * anterior (evita parpadeos al cambiar de fecha) y descarta respuestas
 * viejas si las dependencias cambiaron en el medio.
 */
export function useCargado<T>(cargar: () => Promise<T>, deps: DependencyList) {
  const [estado, setEstado] = useState<Estado<T>>({ cargando: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    setEstado((previo) => ({ data: previo.data, cargando: true }));
    cargar().then(
      (data) => vigente && setEstado({ data, cargando: false }),
      (error: unknown) => vigente && setEstado({ error: mensajeDeError(error), cargando: false }),
    );
    return () => {
      vigente = false;
    };
    // `cargar` cambia en cada render; lo que manda son las deps explicitas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  return { ...estado, recargar: () => setVersion((v) => v + 1) };
}
