import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import SmartProtected from './routes/SmartProtected';
import { ConsentGate } from './components/legal/ConsentGate';
import { SeoManager } from './components/Seo';
import ScrollManager from './components/ScrollManager';
import AnalyticsTracker from './components/AnalyticsTracker';
import { FeedbackProvider } from './components/feedback';


import ScanLoader from './components/ScanLoader';
import { startScanLookup } from './lib/scanPrefetch';

// Layouts do painel só carregam quando alguém entra no painel (fora do caminho da landing).
const DashboardLayout = lazy(() => import('./components/DashboardLayout'));
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const ImageAdmin = lazy(() => import('./pages/ImageAdmin'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const StoreShell = lazy(() => import('./store/StoreShell'));
const StorePage = lazy(() => import('./pages/StorePage'));
const StoreProductPage = lazy(() => import('./pages/StoreProductPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
// Landing + sacola compartilhada com a loja (mesmo pacote, carregado sob demanda).
const loadLanding = () => import('./pages/LandingRoute');
const loadNfcRedirect = () => import('./pages/NfcRedirect');
const loadPublicProfile = () => import('./pages/PublicProfile');
// A landing é grande: fica fora do pacote principal para quem só escaneia uma placa abrir mais rápido.
const LandingPage = lazy(loadLanding);
const NfcRedirect = lazy(loadNfcRedirect);
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ActivationPage = lazy(() => import('./pages/ActivationPage'));
const PublicProfile = lazy(loadPublicProfile);

// Começa cedo o que a página aberta vai precisar, em paralelo (em vez de uma espera depois da outra):
//  • escanear placa (/n/…, /a/…): consulta ao banco + telas de redirecionamento e de perfil;
//  • link de perfil (/u/…, /p/…): tela do perfil;
//  • página inicial: a landing.
if (typeof window !== 'undefined') {
  const path = window.location.pathname;
  if (/^\/(n|a)\/[^/]+/.test(path)) { startScanLookup(); void loadNfcRedirect(); void loadPublicProfile(); }
  else if (/^\/(u|p)\/[^/]+/.test(path)) void loadPublicProfile();
  else if (path === '/' || path === '') void loadLanding();
}

const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome'));
const MyProducts = lazy(() => import('./pages/dashboard/MyProducts'));
const GoogleProducts = lazy(() => import('./pages/dashboard/GoogleProducts'));
const Statistics = lazy(() => import('./pages/dashboard/Statistics'));
const SupportPage = lazy(() => import('./pages/dashboard/SupportPage'));
const Account = lazy(() => import('./pages/dashboard/Account'));
const Perfil = lazy(() => import('./pages/dashboard/Perfil'));

const AdminHome = lazy(() => import('./pages/admin/AdminHome'));
const AdminClients = lazy(() => import('./pages/admin/Clients'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));

const Onboarding = lazy(() => import('./pages/Onboarding'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfUsePage = lazy(() => import('./pages/TermsOfUsePage'));
const CookiesPolicyPage = lazy(() => import('./pages/CookiesPolicyPage'));
const SupportTutorialsPage = lazy(() => import('./pages/SupportTutorialsPage'));

function LoadingScreen() {
  const { pathname } = useLocation();
  // Caminho de escaneamento usa a mesma tela de espera da página do perfil (sem "piscar" entre telas diferentes).
  if (/^\/(n|a|u|p)(\/|$)/.test(pathname)) return <ScanLoader />;
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
  // Validação de consentimento (versão atual da Política e Termos).
  // Bloqueia dashboard, ativação e demais rotas autenticadas até o aceite.
  return <ConsentGate>{children}</ConsentGate>;
}

function Guest({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (user) {
    // Se já existe uma sessão ativa e o link trouxe "next" (ex.: alguém
    // escaneou o QR/NFC de um produto ainda não ativado já estando logado
    // em outra aba), respeita esse destino em vez de sempre cair no
    // dashboard — mesma lógica usada em LoginPage/RegisterPage.
    const next = user.role !== 'ADMIN' ? new URLSearchParams(location.search).get('next') : null;
    return <Navigate to={next || (user.role === 'ADMIN' ? '/admin' : '/dashboard')} replace />;
  }
  return <>{children}</>;
}

function ConfirmedRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/dashboard/conta'} replace />;
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
// O AuthProvider agora vive em App(), envolvendo TODAS as rotas (inclusive
// /painel-imagens, /u/:slug, /p/:slug etc). Isso corrige um bug em que
// /painel-imagens ficava fora do AuthProvider e o useAuth() usado por
// SmartProtected/ImageAdmin estourava "useAuth fora do AuthProvider" assim
// que a página era aberta — o atalho "Imagens do site" no Sidebar do admin
// (que abre /painel-imagens em nova aba) simplesmente não funcionava.
// As rotas públicas de cartão (/u/:slug, /p/:slug, /n/:uuid) continuam
// públicas normalmente: ter um AuthProvider por perto não exige login,
// só disponibiliza o contexto para quem precisar dele (como /painel-imagens).
function AuthenticatedRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Guest><LoginPage /></Guest>} />
      <Route path="/register" element={<Guest><RegisterPage /></Guest>} />
      {/* Destino do link de confirmação de e-mail: leva o cliente para a própria conta */}
      <Route path="/confirmado" element={<Protected><ConfirmedRedirect /></Protected>} />
      <Route path="/recuperar-senha" element={<Guest><ForgotPasswordPage /></Guest>} />
      {/* Sem Guest: o link do e-mail já abre uma sessão de recuperação */}
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
      <Route path="/ativar" element={<Protected><ActivationPage /></Protected>} />
      <Route path="/ativar/:code" element={<Protected><ActivationPage /></Protected>} />
      <Route path="/onboarding" element={<OnboardingGuard><Onboarding /></OnboardingGuard>} />

      <Route path="/dashboard" element={<Protected><DashboardLayout /></Protected>}>
        <Route index element={<DashboardHome />} />
        <Route path="produtos" element={<MyProducts />} />
        <Route path="google" element={<GoogleProducts />} />
        <Route path="perfil/:productId" element={<Perfil />} />
        <Route path="estatisticas" element={<Statistics />} />
        <Route path="suporte" element={<SupportPage />} />
        <Route path="conta" element={<Account />} />
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
  );
}

/**
 * Rede de segurança do "recuperar senha": se o link do e-mail cair em qualquer outra página
 * (ex.: a página inicial, quando a URL não está liberada no Supabase), leva para /redefinir-senha,
 * onde a pessoa digita a nova senha.
 */
function RecoveryRedirect() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname === '/redefinir-senha') return;
    if (typeof window !== 'undefined' && /type=recovery/.test(window.location.hash)) {
      nav('/redefinir-senha', { replace: true });
      return;
    }
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') nav('/redefinir-senha', { replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [pathname, nav]);
  return null;
}

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add('app-ready');
  }, []);
  return (
    <ToastProvider>
      <Router>
      <SeoManager />
      <ScrollManager />
      <RecoveryRedirect />
      <AnalyticsTracker />
        <AuthProvider>
         <FeedbackProvider>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>

              {/* Landing page institucional (site AirNect) */}
              <Route path="/" element={<LandingPage />} />

              {/* Página "Saiba mais" de cada produto */}
              <Route path="/produto/:id" element={<ProductDetailPage />} />
              <Route path="/loja" element={<StoreShell />}>
                <Route index element={<StorePage />} />
                <Route path=":id" element={<StoreProductPage />} />
              </Route>

              {/* Documentos legais (públicos, design premium) */}
              <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />
              <Route path="/termos-de-uso" element={<TermsOfUsePage />} />
              <Route path="/politica-de-cookies" element={<CookiesPolicyPage />} />

              {/* Institucional: quem somos e contato (públicos, indexáveis) */}
              <Route path="/sobre" element={<AboutPage />} />
              <Route path="/contato" element={<ContactPage />} />

              {/* Suporte e tutoriais (público, indexável) */}
              <Route path="/suporte" element={<SupportTutorialsPage />} />

              {/* Painel de imagens do site — agora exige login real de ADMIN
                  (Supabase Auth + is_admin() no banco), não mais uma senha
                  fixa no código-fonte. Ver fix_critico_seguranca_2026-07.sql:
                  as policies de escrita em site_images/site-media agora só
                  aceitam usuário autenticado com is_admin() = true, então a
                  senha antiga deixaria de funcionar mesmo se mantida aqui. */}
              <Route
                path="/painel-imagens"
                element={
                  <SmartProtected adminOnly>
                    <ImageAdmin />
                  </SmartProtected>
                }
              />

              {/* NFC */}
              <Route path="/n/:uuid" element={<NfcRedirect />} />

              {/* Código de ativação */}
              <Route path="/a/:code" element={<NfcRedirect />} />
              <Route path="/a" element={<NfcRedirect />} />

              {/* Perfil público */}
              <Route path="/u/:slug" element={<PublicProfile />} />
              <Route path="/p/:slug" element={<PublicProfile />} />

              {/* Rotas autenticadas */}
              <Route path="/*" element={<AuthenticatedRoutes />} />

            </Routes>
          </Suspense>
         </FeedbackProvider>
        </AuthProvider>
      </Router>
    </ToastProvider>
  );
}
