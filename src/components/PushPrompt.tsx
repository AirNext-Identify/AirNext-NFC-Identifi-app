import { useEffect, useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { getPushState, enablePush, syncPushOnLogin } from '@/lib/push';

const DISMISS_KEY = 'airnext:push-prompt-dismissed';
const DISMISS_DAYS = 7;
const DELAY_MS = 3000;

function recentlyDismissed() {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return t && Date.now() - t < DISMISS_DAYS * 86400000;
  } catch { return false; }
}

/** Monte UMA vez no layout do cliente (DashboardLayout) e do admin (AdminPanel). */
export default function PushPrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let timer: number | undefined;
    (async () => {
      // Já aceitou antes: só vincula este aparelho ao usuário logado, sem perguntar nada
      await syncPushOnLogin();
      const state = await getPushState();
      if (state !== 'off') return;                       // ligado, bloqueado, sem suporte ou iPhone fora do app
      if (Notification.permission !== 'default') return; // permissão já decidida
      if (recentlyDismissed()) return;
      timer = window.setTimeout(() => setShow(true), DELAY_MS);
    })();
    return () => window.clearTimeout(timer);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
    setShow(false);
  };

  const accept = async () => {
    setBusy(true); setError('');
    try {
      const s = await enablePush();   // aqui o navegador mostra a janela "Permitir notificações"
      if (s === 'on') setShow(false);
      else dismiss();
    } catch (e: any) {
      setError(e?.message || 'Não foi possível ativar agora.');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[95] rounded-2xl border border-white/10 bg-surface-900 p-4 shadow-2xl">
      <button onClick={dismiss} aria-label="Fechar" className="absolute right-2.5 top-2.5 rounded-full p-1 text-zinc-500 hover:bg-white/5">
        <X className="h-4 w-4" />
      </button>
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
          <BellRing className="h-4 w-4 text-blue-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Receber avisos no seu aparelho?</p>
          <p className="mt-0.5 text-xs text-zinc-400">Saiba na hora quando alguém acessar seu perfil, mesmo com o painel fechado.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={accept} disabled={busy}
              className="rounded-full bg-blue-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-400 disabled:opacity-60">
              {busy ? 'Ativando…' : 'Ativar avisos'}
            </button>
            <button onClick={dismiss} className="rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-white/5">
              Agora não
            </button>
          </div>
          {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
