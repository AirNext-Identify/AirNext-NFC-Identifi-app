import { useEffect, useState } from 'react';
import { BellRing, BellOff, Smartphone } from 'lucide-react';
import { getPushState, enablePush, disablePush, type PushState } from '@/lib/push';

export default function PushToggle() {
  const [state, setState] = useState<PushState>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getPushState().then(setState); }, []);

  if (state === 'loading' || state === 'unsupported') return null;

  const toggle = async () => {
    setBusy(true); setError('');
    try { setState(state === 'on' ? await disablePush() : await enablePush()); }
    catch (e: any) { setError(e?.message || 'Não foi possível alterar as notificações.'); }
    finally { setBusy(false); }
  };

  if (state === 'ios-install') {
    return (
      <div className="mx-5 my-3 flex gap-2.5 rounded-xl bg-amber-500/10 p-3 text-[11px] text-amber-200">
        <Smartphone className="h-4 w-4 shrink-0" />
        <p>No iPhone: toque em <b>Compartilhar</b> → <b>Adicionar à Tela de Início</b> e abra o painel por lá para ativar os avisos no celular.</p>
      </div>
    );
  }
  if (state === 'denied') {
    return (
      <div className="mx-5 my-3 flex gap-2.5 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-200">
        <BellOff className="h-4 w-4 shrink-0" />
        <p>As notificações estão bloqueadas neste navegador. Libere nas configurações do site (cadeado ao lado do endereço) e recarregue.</p>
      </div>
    );
  }

  const on = state === 'on';
  return (
    <div className="mx-5 my-3">
      <button
        onClick={toggle}
        disabled={busy}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors disabled:opacity-60 ${
          on ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/15'
        }`}
      >
        <span className="flex items-center gap-2.5">
          {on ? <BellRing className="h-4 w-4 text-emerald-400" /> : <BellOff className="h-4 w-4 text-blue-400" />}
          <span>
            <span className="block text-xs font-semibold text-white">
              {on ? 'Avisos neste aparelho: ligados' : 'Ativar avisos neste aparelho'}
            </span>
            <span className="block text-[10px] text-zinc-400">
              {on ? 'Toque para desligar' : 'Receba os alertas mesmo com o painel fechado'}
            </span>
          </span>
        </span>
      </button>
      {error && <p className="mt-1.5 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
