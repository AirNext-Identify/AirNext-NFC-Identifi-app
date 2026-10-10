import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Bell, ChevronRight, FileDown, CheckCircle, Clock, Zap, ArrowRight } from 'lucide-react';
import { Modal } from '@/components/admin/ui/Modal';
import { Badge } from '@/components/admin/ui/Badge';
import type { AdminModule, Notification } from '@/types/admin';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onExport?: () => void;
  customers: { id: string; name: string; company: string; email: string; phone: string }[];
  products: { id: string; uuid: string; activationCode: string; internalCode: string }[];
  lots: { id: string; code: string }[];
  notifications?: Notification[];
  onNavigate: (module: AdminModule, subId?: string) => void;
  onResolveNotification?: (id: string) => void;
}

export function Header({
  title,
  subtitle,
  onExport,
  customers,
  products,
  lots,
  notifications = [],
  onNavigate,
  onResolveNotification,
}: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadNotifications = useMemo(() => {
    return notifications.filter((n) => n.status !== 'Resolvido');
  }, [notifications]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const mappedCustomers = customers
      .filter((c) => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q))
      .map((c) => ({ type: 'Cliente' as const, label: `${c.name} — ${c.company}`, id: c.id, module: 'customers' as AdminModule }));
    const mappedProducts = products
      .filter((p) => p.uuid.toLowerCase().includes(q) || p.activationCode.toLowerCase().includes(q) || p.internalCode.toLowerCase().includes(q))
      .map((p) => ({ type: 'Produto' as const, label: `${p.internalCode}`, id: p.id, module: 'products' as AdminModule }));
    const mappedLots = lots
      .filter((l) => l.code.toLowerCase().includes(q))
      .map((l) => ({ type: 'Lote' as const, label: l.code, id: l.id, module: 'lots' as AdminModule }));
    return [...mappedCustomers, ...mappedProducts, ...mappedLots].slice(0, 8);
  }, [query, customers, products, lots]);

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/80 py-4 pl-16 pr-4 backdrop-blur-xl sm:px-6 lg:pl-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight text-zinc-100 sm:text-xl">{title}</h2>
          {subtitle && <p className="hidden truncate text-sm text-zinc-500 sm:block">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onExport && (
            <button
              onClick={onExport}
              className="hidden items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 sm:flex"
            >
              <FileDown className="h-4 w-4" />
              Exportar
            </button>
          )}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200 sm:px-3"
            title="Atalho: ⌘K ou Ctrl+K"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Busca global</span>
            <span className="hidden rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500 lg:inline">⌘K</span>
          </button>

          {/* Notificações no Header com Popover funcional */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
              title="Central de notificações rápidas"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white shadow-sm shadow-indigo-500/50">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl backdrop-blur-xl sm:w-96">
                <div className="mb-3 flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-indigo-400" />
                    <h4 className="text-sm font-semibold text-zinc-100">Notificações Recentes</h4>
                  </div>
                  <Badge colorClass="bg-indigo-500/10 text-indigo-400">{unreadNotifications.length} pendentes</Badge>
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.customerId) onNavigate('customers', n.customerId);
                        else if (n.productId) onNavigate('products', n.productId);
                        setNotifOpen(false);
                      }}
                      className="group flex cursor-pointer items-start justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-semibold text-zinc-200">{n.title}</p>
                          {n.status !== 'Resolvido' && <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{n.message}</p>
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-500">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(n.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span>{n.channel}</span>
                        </div>
                      </div>
                      {onResolveNotification && n.status !== 'Resolvido' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onResolveNotification(n.id);
                          }}
                          className="shrink-0 rounded-lg p-1.5 text-zinc-500 opacity-0 transition-opacity hover:bg-zinc-800 hover:text-emerald-400 group-hover:opacity-100"
                          title="Marcar como resolvido"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="py-6 text-center text-xs text-zinc-500">Nenhuma notificação registrada.</p>
                  )}
                </div>

                <div className="mt-3 border-t border-zinc-800 pt-3">
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      onNavigate('notifications');
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-800 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-700"
                  >
                    <span>Ver todas na Central de Notificações</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={searchOpen} onClose={() => setSearchOpen(false)} title="Busca global" maxWidth="max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busque cliente, UUID, código, telefone, email, produto ou lote..."
            className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-4 text-sm text-zinc-100 outline-none focus:border-zinc-700"
          />
        </div>
        <div className="mt-4 max-h-80 overflow-auto">
          {results.length === 0 && query && (
            <p className="py-8 text-center text-sm text-zinc-500">Nenhum resultado encontrado.</p>
          )}
          {results.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              onClick={() => {
                setSearchOpen(false);
                setQuery('');
                onNavigate(r.module, r.id);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-zinc-800"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-200">{r.label}</p>
                <p className="text-xs text-zinc-500">{r.type}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
            </button>
          ))}
          {!query && (
            <div className="space-y-2 text-xs text-zinc-500">
              <p className="font-medium text-zinc-400">Sugestões:</p>
              <div className="flex flex-wrap gap-2">
                {['Clientes ativos', 'Produtos expirando', 'Lotes recentes', 'Renovações pendentes'].map((s) => (
                  <span key={s} className="rounded-lg bg-zinc-800 px-2 py-1">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </header>
  );
}
