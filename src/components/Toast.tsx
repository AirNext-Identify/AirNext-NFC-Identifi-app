import { CheckCircle, Copy, Share2, X, AlertTriangle, Info } from 'lucide-react';
import { useState, createContext, useContext, ReactNode, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'copy' | 'share' | 'warning';
interface Toast { id: string; message: string; type: ToastType; }

interface ToastCtx { show: (message: string, type?: ToastType) => void; }
const ToastContext = createContext<ToastCtx | undefined>(undefined);

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircle, error: AlertTriangle, info: Info, copy: Copy, share: Share2, warning: AlertTriangle
};
const colors: Record<ToastType, string> = {
  success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  error: 'text-red-400 bg-red-500/10 border-red-500/20',
  info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  copy: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
  share: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Contador monotônico em ref: garante id único mesmo quando show() é
  // chamado várias vezes dentro do mesmo milissegundo (ex: um loop
  // sincrono disparando um toast por notificação). Date.now() sozinho
  // colide nesse cenário; o contador nunca repete dentro da mesma sessão.
  const counterRef = useRef(0);
  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${counterRef.current++}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500);
  }, []);
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => {
          const Icon = icons[t.type];
          return (
            <div key={t.id} className={`toast-in pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl border backdrop-blur-xl shadow-2xl ${colors[t.type]}`}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium whitespace-nowrap">{t.message}</span>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="ml-1 opacity-50 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
