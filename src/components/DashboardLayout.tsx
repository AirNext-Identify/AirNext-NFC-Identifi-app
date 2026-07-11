import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Package, BarChart3, LogOut, Menu, Zap, HelpCircle, Bell, X, Globe } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Logo from './Logo';
import NotificationCenter from './NotificationCenter';
import { useToast } from './Toast';

export default function DashboardLayout() {
 const { user, logout, products, notifications, loading } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const seenIds = useRef<Set<string> | null>(null);
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
    { name: 'Estatísticas', href: '/dashboard/estatisticas', icon: BarChart3 },
    { name: 'Suporte', href: '/dashboard/suporte', icon: HelpCircle },
  ];

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
          <Link key={n.name} to={n.href} onClick={() => setOpen(false)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive(n.href) ? 'bg-blue-500/10 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
            <n.icon className={`h-4 w-4 ${isActive(n.href) ? 'text-blue-400' : 'text-zinc-600'}`} />
            {n.name}
          </Link>
        ))}
        <div className="pt-4 mt-4 border-t border-white/5">
          <Link to="/ativar" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 transition-all">
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
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">{user?.name?.charAt(0)}</div>
          <div className="min-w-0 flex-1"><p className="text-xs font-medium text-white truncate">{user?.name}</p><p className="text-[10px] text-zinc-600 truncate">{user?.email}</p></div>
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
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[11px] font-bold">{user?.name?.charAt(0)}</div>
        </div>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-[1400px] w-full mx-auto"><Outlet /></main>
      </div>

      <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
