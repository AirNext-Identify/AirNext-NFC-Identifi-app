import { useMemo, useState } from 'react';
import { Bell, Mail, MessageCircle, RefreshCw, CheckCircle, Zap, Trash2 } from 'lucide-react';
import { SearchBar } from '@/components/admin/ui/SearchBar';
import { Badge } from '@/components/admin/ui/Badge';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { formatDateTime } from '@/lib/adminUtils';
import type { Customer, Notification, Product } from '@/types/admin';

interface NotificationsViewProps {
  notifications: Notification[];
  customers: Customer[];
  products: Product[];
  onUpdate: (id: string, data: Partial<Notification>) => void;
  onSend: () => void;
  onResend: (title: string, message: string, channel: Notification['channel'], customerId?: string, productId?: string) => void;
  onDelete: (id: string) => void;
}

const statusConfig: Record<Notification['status'], { color: string; dot: string }> = {
  Enviado: { color: 'bg-blue-500/10 text-blue-400', dot: 'bg-blue-500' },
  Aberto: { color: 'bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-500' },
  Ignorado: { color: 'bg-yellow-500/10 text-yellow-400', dot: 'bg-yellow-500' },
  Resolvido: { color: 'bg-zinc-500/10 text-zinc-400', dot: 'bg-zinc-500' },
  Falhou: { color: 'bg-red-500/10 text-red-400', dot: 'bg-red-500' },
};

export function NotificationsView({ notifications, customers, products, onUpdate, onSend, onResend, onDelete }: NotificationsViewProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const customer = customers.find((c) => c.id === n.customerId);
      const product = products.find((p) => p.id === n.productId);
      return (
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.message.toLowerCase().includes(search.toLowerCase()) ||
        customer?.name.toLowerCase().includes(search.toLowerCase()) ||
        product?.internalCode.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [notifications, customers, products, search]);

  const activationNotifications = filtered.filter((n) => n.trigger === 'ativacao');

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
            <Zap className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-indigo-200">Notificações em tempo real</h3>
            <p className="text-xs text-indigo-300/70">Sempre que um produto for ativado, o administrador receberá imediatamente uma notificação com cliente, produto, data, hora, código e UUID.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar notificação, cliente, produto..." className="sm:max-w-xs" />
        <button onClick={onSend} className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600">
          <Bell className="h-4 w-4" /> Enviar notificação
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhuma notificação" />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const customer = customers.find((c) => c.id === n.customerId);
            const product = products.find((p) => p.id === n.productId);
            const cfg = statusConfig[n.status];
            return (
              <div key={n.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition-all hover:border-zinc-700">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-200">{n.title}</p>
                      <Badge variant="dot" colorClass={cfg.color} dotColor={cfg.dot}>{n.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">{n.message}</p>
                    {n.trigger === 'ativacao' && (
                      <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-zinc-500 sm:grid-cols-2">
                        <p>Cliente: <span className="text-zinc-300">{customer?.name || '—'}</span></p>
                        <p>Produto: <span className="text-zinc-300">{product?.internalCode || '—'}</span></p>
                        <p>Código: <span className="text-zinc-300">{product?.activationCode || '—'}</span></p>
                        <p>UUID: <span className="text-zinc-300">{product?.uuid || '—'}</span></p>
                      </div>
                    )}
                    <p className="mt-2 text-xs text-zinc-600">{formatDateTime(n.sentAt)} • {n.channel}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => onResend(n.title, n.message, n.channel, n.customerId, n.productId)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" title="Reenviar">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => window.open(`mailto:${customer?.email}`, '_blank')} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" title="Email">
                      <Mail className="h-4 w-4" />
                    </button>
                    <button onClick={() => window.open(`https://wa.me/${customer?.phone.replace(/\D/g, '')}`, '_blank')} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" title="WhatsApp">
                      <MessageCircle className="h-4 w-4" />
                    </button>
                    <button onClick={() => onUpdate(n.id, { status: 'Resolvido', resolvedAt: new Date().toISOString() })} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" title="Marcar resolvido">
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm('Excluir esta notificação permanentemente?')) onDelete(n.id); }}
                      className="rounded-lg p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-200">Resumo de ativações</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-zinc-950 p-4 text-center">
            <p className="text-xs text-zinc-500">Recebidas</p>
            <p className="mt-1 text-xl font-semibold text-zinc-100">{activationNotifications.length}</p>
          </div>
          <div className="rounded-xl bg-zinc-950 p-4 text-center">
            <p className="text-xs text-zinc-500">Abertas</p>
            <p className="mt-1 text-xl font-semibold text-zinc-100">{activationNotifications.filter((n) => n.status === 'Aberto' || n.status === 'Resolvido').length}</p>
          </div>
          <div className="rounded-xl bg-zinc-950 p-4 text-center">
            <p className="text-xs text-zinc-500">Ignoradas</p>
            <p className="mt-1 text-xl font-semibold text-zinc-100">{activationNotifications.filter((n) => n.status === 'Ignorado').length}</p>
          </div>
          <div className="rounded-xl bg-zinc-950 p-4 text-center">
            <p className="text-xs text-zinc-500">Resolvidas</p>
            <p className="mt-1 text-xl font-semibold text-zinc-100">{activationNotifications.filter((n) => n.status === 'Resolvido').length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
