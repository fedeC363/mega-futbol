import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { AppShell } from './components/AppShell';
import { Cargando } from './components/ui';
import { AdminPage } from './pages/AdminPage';
import { ContactoPage } from './pages/ContactoPage';
import { IngresarPage } from './pages/IngresarPage';
import { MapaPage } from './pages/MapaPage';
import { PerfilPage } from './pages/PerfilPage';
import { ReservaPage } from './pages/ReservaPage';
import { StaffPage } from './pages/StaffPage';
import { UsuarioPage } from './pages/UsuarioPage';
import { UsuariosPage } from './pages/UsuariosPage';

// Diferida: arrastra la libreria de graficos y la ve solo el admin.
const EstadisticasPage = lazy(() =>
  import('./pages/EstadisticasPage').then((m) => ({ default: m.EstadisticasPage })),
);

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<MapaPage />} />
            <Route path="cancha/:canchaId" element={<ReservaPage />} />
            <Route path="ingresar" element={<IngresarPage />} />
            <Route path="perfil" element={<PerfilPage />} />
            <Route path="contacto" element={<ContactoPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="admin/usuarios" element={<UsuariosPage />} />
            <Route path="admin/usuarios/:usuarioId" element={<UsuarioPage />} />
            <Route
              path="estadisticas"
              element={
                <Suspense
                  fallback={
                    <main className="flex-1 px-4 pt-8">
                      <Cargando texto="Cargando los gráficos…" />
                    </main>
                  }
                >
                  <EstadisticasPage />
                </Suspense>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
