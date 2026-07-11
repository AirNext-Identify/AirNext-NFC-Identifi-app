import {
  LayoutDashboard,
  Users,
  CreditCard,
  Boxes,
  Cpu,
  CalendarClock,
  Bell,
  BarChart3,
  Settings,
  Menu,
  X,
  Sliders,
  BookOpen,
  LogOut,
  ArrowLeftCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, getInitials } from '@/lib/adminUtils';
import type { AdminModule } from '@/types/admin';

const menuItems: { id: AdminModule; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'Clientes', icon: Users },
  { id: 'products', label: 'Produtos', icon: CreditCard },
  { id: 'lots', label: 'Lotes', icon: Boxes },
  { id: 'nfc', label: 'Programador NFC', icon: Cpu },
  { id: 'validity', label: 'Validade', icon: CalendarClock },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'guide', label: 'Manual & Guia NFC', icon: BookOpen },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

interface SidebarProps {
  active: AdminModule;
  onNavigate: (module: AdminModule) => void;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
}

export function Sidebar({ active, onNavigate, mobileOpen, onToggleMobile, userName, userEmail, onLogout }: SidebarProps) {
  return (
    <>
      <button
        onClick={onToggleMobile}
        className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 shadow-xl transition-colors hover:bg-zinc-800 lg:hidden"
        title="Abrir menu"
      >
        {mobileOpen ? <X className="h-5 w-5 text-indigo-400" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onToggleMobile} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-30 h-full w-64 transform border-r border-zinc-800 bg-zinc-950 transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-zinc-900 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20">
            <Sliders className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-lobster text-2xl tracking-wide text-zinc-100">AirNext</h1>
            <p className="text-[10px] font-medium uppercase tracking-wider text-indigo-400">Gestão ERP</p>
          </div>
        </div>

        <nav className="space-y-1 p-4 pb-40">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onToggleMobile();
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-zinc-900 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
                )}
              >
                <Icon className={cn('h-4.5 w-4.5', isActive ? 'text-indigo-400' : 'text-zinc-500')} />
                {item.label}
              </button>
            );
          })}

          <Link
            to="/dashboard"
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 transition-all hover:bg-zinc-900/50 hover:text-zinc-200"
          >
            <ArrowLeftCircle className="h-4.5 w-4.5 text-zinc-500" />
            Voltar ao app do cliente
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 w-full border-t border-zinc-900 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-zinc-900/50 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-semibold text-indigo-400">
              {getInitials(userName || 'Admin AirNext')}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-zinc-200">{userName || 'Admin AirNext'}</p>
              <p className="truncate text-xs text-zinc-500">{userEmail || ''}</p>
            </div>
            <button
              onClick={onLogout}
              title="Sair"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
