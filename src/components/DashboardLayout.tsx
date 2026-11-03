import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Package, BarChart3, LogOut, Menu, Zap, HelpCircle, Bell, X, Globe, Star, UserCircle, Pencil, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Logo from './Logo';
import NotificationCenter from './NotificationCenter';
import PushPrompt from './PushPrompt';
import { useToast } from './Toast';
import { WelcomeTour, HelpFab } from './dashboard/WelcomeTour';

const tourKey = (id: string) => `airnext:tour:${id}`;
const TOUR_ANCHORS: Record<string, string> = {
  '/dashboard/produtos': 'perfil',
  '/dashboard/estatisticas': 'estatisticas',
  '/dashboard/conta': 'conta',
  '/dashboard/suporte': 'suporte',
};

export default function DashboardLayout() {
 const { user, logout, notifications, loading, googleProducts, products } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const seenIds = useRef<Set<string> | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourDone, setTourDone] = useState(true);

  // Primeiro acesso: contas criadas nos últimos 7 dias veem o tour de boas-vindas uma vez.
  useEffect(() => {
    if (loading || !user || user.role === 'ADMIN') return;
    let done = false;
    try { done = localStorage.getItem(tourKey(user.id)) === 'done'; } catch { /* sem storage: mostra */ }
    setTourDone(done);
    const created = user.createdAt ? new Date(`${user.createdAt}T00:00:00`).getTime() : 0;
    const recent = created > 0 && Date.now() - created < 7 * 86400000;
    if (!done && recent) {
      const t = setTimeout(() => setTourOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [loading, user?.id]);

  const closeTour = () => {
    setTourOpen(false);
    setTourDone(true);
    if (user) { try { localStorage.setItem(tourKey(user.id), 'done'); } catch { /* ignore */ } }
  };
  const doLogout = () => { logout(); nav('/'); };

  // Toast discreto sempre que uma notificação nova (ainda não vista nesta
  // sessão) chegar — inclui as que vêm em tempo real via Supabase Realtime.
  useEffect(() => {
    // Enquanto o AuthContext ainda está carregando (loadUserData em voo),
    // `notifications` pode estar vazio ou parcialmente populado. Esperar
    // `loading` virar false garante que o baseline abaixo é capturado
    // depois que TODO o histórico inicial (login + visitas) já chegou de
    // uma vez — em vez de capturar um baseline vazio e, no próximo render,
    // tratar o lote inteiro de notificações antigas como "novo" e disparar
    // um toast por item, tudo em sequência síncrona.
    if (loading) return;

    if (seenIds.current === null) {
      // Primeira carga (já com os dados prontos): só registra o que já
      // existe, sem disparar toasts retroativos para notificações antigas.
      seenIds.current = new Set(notifications.map(n => n.id));
      return;
    }
    for (const n of notifications) {
      if (seenIds.current.has(n.id)) continue;
      seenIds.current.add(n.id);
      toast.show(n.message, n.type === 'login' ? 'success' : 'info');
    }
  }, [notifications, toast, loading]);

  // "Perfil" no menu agora sempre leva para a listagem de todos os perfis
  // (Meus Produtos), onde o usuário vê o resumo de cada um antes de entrar
  // em um perfil específico para editar.

  const NAV = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Perfil', href: '/dashboard/produtos', icon: Package },
    // AirNext Google: só aparece para quem já ativou uma plaquinha de avaliações.
    ...((googleProducts || []).length > 0 ? [{ name: 'Avaliações Google', href: '/dashboard/google', icon: Star }] : []),
    { name: 'Estatísticas', href: '/dashboard/estatisticas', icon: BarChart3 },
    { name: 'Minha conta', href: '/dashboard/conta', icon: UserCircle },
    { name: 'Suporte', href: '/dashboard/suporte', icon: HelpCircle },
  ];

  // Atalho "Editar perfil": abre direto o perfil ativo mais recente; sem perfil ativo, vai para a lista.
  const firstActive = (products || []).find(p => p.status === 'ATIVO');
  const editHref = firstActive ? `/dashboard/perfil/${firstActive.id}` : '/dashboard/produtos';

  const isActive = (href: string) => {
    if (href === '/dashboard') return loc.pathname === '/dashboard';
    return loc.pathname.startsWith(href);
  };

  const unreadCount = (notifications || []).filter(n => !n.read).length;
  const sb = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 pt-5 pb-6">
        <Logo size="md" />
        <button className="lg:hidden p-1.5 rounded-full hover:bg-white/5 text-zinc-500" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(n => (
          <Link key={n.name} to={n.href} data-tour={TOUR_ANCHORS[n.href]} onClick={() => setOpen(false)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive(n.href) ? 'bg-blue-500/10 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
            <n.icon className={`h-4 w-4 ${isActive(n.href) ? 'text-blue-400' : 'text-zinc-600'}`} />
            {n.name}
          </Link>
        ))}
        <div className="pt-4 mt-4 border-t border-white/5">
          <Link to="/ativar" data-tour="ativar" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 transition-all">
            <Zap className="h-4 w-4" /> Ativar Produto
          </Link>
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
          >
            <Globe className="h-4 w-4 text-zinc-600" /> Visitar Site
          </Link>
        </div>
      </nav>
      <div className="px-3 pb-4 border-t border-white/5 pt-4 mt-auto">
        <div className="flex items-center gap-2.5 px-2 mb-3">
          <Link to="/dashboard/conta" onClick={() => setOpen(false)} className="flex items-center gap-2.5 min-w-0 flex-1 rounded-xl hover:bg-white/5 p-1 -m-1 transition-colors">
            <div className="h-8 w-8 rounded-full bg-gradient-to-b from-[#2997ff] to-[#0071e3] flex items-center justify-center text-white text-xs font-semibold shrink-0">{user?.name?.charAt(0)}</div>
            <div className="min-w-0 flex-1"><p className="text-xs font-medium text-white truncate">{user?.name}</p><p className="text-[10px] text-zinc-500 truncate">{user?.email}</p></div>
          </Link>
          <button onClick={() => { setNotifOpen(true); setOpen(false); }} className="relative p-1.5 rounded-full hover:bg-white/5 text-zinc-500 lg:hidden">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-blue-500" />}
          </button>
        </div>
        <button onClick={doLogout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><LogOut className="h-4 w-4" /> Sair</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-[60] lg:hidden transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className={`fixed inset-y-0 left-0 w-72 bg-surface-900 border-r border-white/5 transition-transform ${open ? 'translate-x-0' : '-translate-x-full'}`}>{sb}</div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-60 lg:flex-col bg-surface-900 border-r border-white/5">{sb}</div>

      <div className="lg:pl-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-white/5 bg-surface/80 backdrop-blur-xl px-4 lg:px-8">
          <button className="lg:hidden p-2 -ml-2 text-zinc-500 hover:text-white transition-colors" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <div className="lg:hidden"><Logo size="sm" /></div>
          <div className="flex-1" />
          {/* Notifications bell */}
          <button onClick={() => setNotifOpen(true)} className="relative p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-surface" />}
          </button>
          <div className="relative">
            <button onClick={() => setMenuOpen(v => !v)} aria-haspopup="menu" aria-expanded={menuOpen} className="flex items-center gap-1.5 rounded-full pl-1 pr-2 py-1 hover:bg-white/5 transition-colors">
              <span className="h-7 w-7 rounded-full bg-gradient-to-b from-[#2997ff] to-[#0071e3] flex items-center justify-center text-white text-[11px] font-semibold">{user?.name?.charAt(0)}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div role="menu" className="absolute right-0 top-full mt-2 w-64 z-50 rounded-2xl bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60 p-1.5 scale-in">
                  <div className="px-3 py-2.5 border-b border-white/8 mb-1">
                    <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
                  </div>
                  {[
                    { to: '/dashboard/conta', icon: UserCircle, label: 'Minha conta' },
                    { to: editHref, icon: Pencil, label: 'Editar perfil' },
                    { to: '/dashboard/produtos', icon: Package, label: 'Meus perfis' },
                    { to: '/ativar', icon: Zap, label: 'Ativar produto' },
                    { to: '/dashboard/estatisticas', icon: BarChart3, label: 'Estatísticas' },
                    { to: '/dashboard/suporte', icon: HelpCircle, label: 'Suporte' },
                  ].map(i => (
                    <Link key={i.label} to={i.to} role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-200 hover:bg-white/8 transition-colors">
                      <i.icon className="h-4 w-4 text-[#2997ff]" /> {i.label}
                    </Link>
                  ))}
                  <button onClick={() => { setMenuOpen(false); doLogout(); }} role="menuitem" className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#ff6961] hover:bg-[#ff453a]/10 transition-colors mt-1 border-t border-white/8">
                    <LogOut className="h-4 w-4" /> Sair
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-[1400px] w-full mx-auto"><Outlet /></main>
      </div>

      <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
      <PushPrompt />
      <WelcomeTour open={tourOpen} firstName={user?.firstName || user?.name?.split(' ')[0]} onClose={closeTour} />
      {!tourOpen && <HelpFab pulse={!tourDone} onStartTour={() => setTourOpen(true)} />}
    </div>
  );
}
