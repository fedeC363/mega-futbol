import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { AppShell } from './components/AppShell';
import { AdminPage } from './pages/AdminPage';
import { ContactoPage } from './pages/ContactoPage';
import { IngresarPage } from './pages/IngresarPage';
import { MapaPage } from './pages/MapaPage';
import { PerfilPage } from './pages/PerfilPage';
import { ReservaPage } from './pages/ReservaPage';
import { StaffPage } from './pages/StaffPage';

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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
