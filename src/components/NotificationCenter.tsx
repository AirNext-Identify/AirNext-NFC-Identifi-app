import { X, Bell, Activity, LogIn, CheckCheck, Trash2, XCircle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useAuth, AppNotification } from '../contexts/AuthContext';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d}d`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

const typeStyles: Record<AppNotification['type'], { icon: React.ElementType; classes: string }> = {
  visit: { icon: Activity, classes: 'text-blue-400 bg-blue-500/10' },
  login: { icon: LogIn, classes: 'text-emerald-400 bg-emerald-500/10' },
  activation: { icon: CheckCheck, classes: 'text-emerald-400 bg-emerald-500/10' },
  update: { icon: Bell, classes: 'text-amber-400 bg-amber-500/10' },
  system: { icon: Bell, classes: 'text-amber-400 bg-amber-500/10' },
  admin: { icon: Bell, classes: 'text-indigo-400 bg-indigo-500/10' },
};

export default function NotificationCenter({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { notifications, markNotificationsRead, deleteNotification, clearAllNotifications } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      // Fecha o pedido de confirmação sozinho depois de alguns segundos,
      // caso o usuário mude de ideia e não clique de novo.
      setTimeout(() => setConfirmClear(false), 4000);
      return;
    }
    clearAllNotifications();
    setConfirmClear(false);
  };

  const filtered = useMemo(
    () => (filter === 'unread' ? notifications.filter(n => !n.read) : notifications),
    [filter, notifications]
  );
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-surface border-l border-white/5 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-zinc-300" />
            <div>
              <h2 className="text-sm font-bold text-white">Notificações</h2>
              <p className="text-[10px] text-zinc-500">{unreadCount} não lidas</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <div className="flex gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                filter === 'all' ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                filter === 'unread' ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              Não lidas
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markNotificationsRead}
              className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center justify-end px-5 py-2 border-b border-white/5">
            <button
              onClick={handleClearAll}
              onBlur={() => setConfirmClear(false)}
              className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full transition-all ${
                confirmClear
                  ? 'bg-red-500 text-white'
                  : 'text-red-400/80 hover:text-red-300 hover:bg-red-500/10'
              }`}
            >
              {confirmClear ? <XCircle className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
              {confirmClear ? 'Confirmar exclusão' : 'Limpar tudo'}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6 h-full">
              <div className="text-center">
                <Bell className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">
                  {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação por aqui ainda'}
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {filtered.map(n => {
                const style = typeStyles[n.type] ?? typeStyles.system;
                const Icon = style.icon;
                return (
                  <li
                    key={n.id}
                    className={`group flex gap-3 px-5 py-3.5 transition-colors ${!n.read ? 'bg-white/[0.02]' : ''}`}
                  >
                    <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${style.classes}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {n.title && (
                        <p className={`text-sm ${n.read ? 'text-zinc-300' : 'text-white font-semibold'}`}>
                          {n.title}
                        </p>
                      )}
                      <p className={`text-sm ${n.read ? 'text-zinc-400' : 'text-zinc-100 font-medium'}`}>
                        {n.message}
                      </p>
                      <p className="text-[11px] text-zinc-600 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                    <div className="flex items-start gap-2 shrink-0">
                      {!n.read && <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        title="Excluir permanentemente"
                        className="p-1 rounded-full text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
