import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL;
const clavePublica = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !clavePublica) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en web/.env (ver .env.example en la raiz).',
  );
}

// Un solo cliente para toda la app. La clave es publica por diseño: lo que
// protege los datos es la RLS y las funciones de Postgres, no esta clave.
export const supabase = createClient<Database>(url, clavePublica);
