import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Usuario } from '../lib/tipos';

export interface Empleado {
  empleado_id: string;
  sede_id: string;
}

interface AuthContexto {
  session: Session | null;
  perfil: Usuario | null;
  /** Fila activa en empleado, o null si no es staff (spec 04). */
  empleado: Empleado | null;
  /** true hasta saber si hay sesion y, si la hay, quien es. */
  cargando: boolean;
  salir: () => Promise<void>;
}

const Contexto = createContext<AuthContexto | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sesionLista, setSesionLista] = useState(false);
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [perfilListo, setPerfilListo] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSesionLista(true);
    });
    // Ojo: no llamar a otros metodos de supabase dentro de este callback
    // (corre con el lock de auth tomado y puede trabarse). La carga del
    // perfil va en el efecto de abajo, disparado por el cambio de usuario.
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => {
      setSession(nueva);
      setSesionLista(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) {
      setPerfil(null);
      setEmpleado(null);
      setPerfilListo(true);
      return;
    }
    let vigente = true;
    setPerfilListo(false);
    Promise.all([
      supabase.from('usuario').select('*').eq('id', userId).maybeSingle(),
      supabase.rpc('mi_empleado'),
    ]).then(([p, e]) => {
      if (!vigente) return;
      setPerfil(p.data ?? null);
      setEmpleado(e.data?.[0] ?? null);
      setPerfilListo(true);
    });
    return () => {
      vigente = false;
    };
  }, [userId]);

  const valor: AuthContexto = {
    session,
    perfil,
    empleado,
    cargando: !sesionLista || !perfilListo,
    salir: async () => {
      await supabase.auth.signOut();
    },
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth(): AuthContexto {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useAuth se usa dentro de <AuthProvider>');
  return contexto;
}
