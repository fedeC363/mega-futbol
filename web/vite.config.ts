import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 5173 es el puerto que figura en las URLs de auth de supabase/config.toml.
  server: { port: 5173, strictPort: true },
});
