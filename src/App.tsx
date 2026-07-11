import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';


import DashboardLayout from './components/DashboardLayout';
import AdminLayout from './components/AdminLayout';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const NfcRedirect = lazy(() => import('./pages/NfcRedirect'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ActivationPage = lazy(() => import('./pages/ActivationPage'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));

const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome'));
const MyProducts = lazy(() => import('./pages/dashboard/MyProducts'));
const Statistics = lazy(() => import('./pages/dashboard/Statistics'));
const SupportPage = lazy(() => import('./pages/dashboard/SupportPage'));
const Perfil = lazy(() => import('./pages/dashboard/Perfil'));

const AdminHome = lazy(() => import('./pages/admin/AdminHome'));
const AdminClients = lazy(() => import('./pages/admin/Clients'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));

const Onboarding = lazy(() => import('./pages/Onboarding'));

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <p className="text-xs text-zinc-600">Carregando...</p>
      </div>
    </div>
  );
}

function Protected({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function Guest({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
  return <>{children}</>;
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, hasProfile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (hasProfile === null) return <LoadingScreen />;
  if (hasProfile === true) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// Rotas que dependem de autenticação (login, dashboard, admin, onboarding).
// Isoladas num AuthProvider próprio para não vazar para as rotas públicas
// de cartão (/u/:slug, /p/:slug) — ver comentário em App() mais abaixo.
function AuthenticatedRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Guest><LoginPage /></Guest>} />
        <Route path="/register" element={<Guest><RegisterPage /></Guest>} />
        <Route path="/ativar" element={<Protected><ActivationPage /></Protected>} />
        <Route path="/ativar/:code" element={<Protected><ActivationPage /></Protected>} />
        <Route path="/onboarding" element={<OnboardingGuard><Onboarding /></OnboardingGuard>} />

        <Route path="/dashboard" element={<Protected><DashboardLayout /></Protected>}>
          <Route index element={<DashboardHome />} />
          <Route path="produtos" element={<MyProducts />} />
          <Route path="perfil/:productId" element={<Perfil />} />
          <Route path="estatisticas" element={<Statistics />} />
          <Route path="suporte" element={<SupportPage />} />
        </Route>

        {/* Painel administrativo premium — substitui o admin simples anterior.
            É self-contained (tem seu próprio Sidebar/Header), por isso não
            fica dentro de <AdminLayout>. Usa /admin/* para engolir qualquer
            sub-caminho, já que a navegação entre módulos é interna (estado
            React), não por rota. */}
        <Route path="/admin/*" element={<Protected admin><AdminPanel /></Protected>} />

        {/* Admin antigo (simples), mantido acessível para referência/backup. */}
        <Route path="/admin-legacy" element={<Protected admin><AdminLayout /></Protected>}>
          <Route index element={<AdminHome />} />
          <Route path="clientes" element={<AdminClients />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>

            {/* Landing page institucional (site AirNect) */}
            <Route path="/" element={<LandingPage />} />

            {/* NFC */}
            <Route path="/n/:uuid" element={<NfcRedirect />} />

            {/* Código de ativação */}
            <Route path="/a/:code" element={<NfcRedirect />} />

            {/* Perfil público */}
            <Route path="/u/:slug" element={<PublicProfile />} />
            <Route path="/p/:slug" element={<PublicProfile />} />

            {/* Rotas autenticadas */}
            <Route path="/*" element={<AuthenticatedRoutes />} />

          </Routes>
        </Suspense>
      </Router>
    </ToastProvider>
  );
}
