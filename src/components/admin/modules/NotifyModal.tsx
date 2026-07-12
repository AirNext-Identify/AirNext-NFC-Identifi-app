import { useEffect, useState } from 'react';
import { Modal } from '@/components/admin/ui/Modal';
import type { Customer, Notification } from '@/types/admin';

interface NotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  /** Se vier preenchido (ex.: aberto a partir da ficha do cliente), o campo de cliente fica travado nesse destinatário. */
  fixedCustomer?: Customer | null;
  onSend: (title: string, message: string, channel: Notification['channel'], customerId: string) => void;
}

const channels: Notification['channel'][] = ['Painel', 'Email', 'WhatsApp', 'Push'];

export function NotifyModal({ isOpen, onClose, customers, fixedCustomer, onSend }: NotifyModalProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<Notification['channel']>('Painel');
  const [customerId, setCustomerId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setMessage('');
      setChannel('Painel');
      setCustomerId(fixedCustomer?.id || '');
      setError('');
    }
  }, [isOpen, fixedCustomer]);

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      setError('Preencha título e mensagem.');
      return;
    }
    if (!customerId) {
      setError('Selecione o cliente que vai receber a notificação.');
      return;
    }
    onSend(title.trim(), message.trim(), channel, customerId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enviar notificação">
      <div className="space-y-4">
        {fixedCustomer ? (
          <div>
            <label className="text-xs font-medium text-zinc-500">Destinatário</label>
            <p className="mt-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200">
              {fixedCustomer.name} • {fixedCustomer.email}
            </p>
          </div>
        ) : (
          <div>
            <label className="text-xs font-medium text-zinc-500">Cliente</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700"
            >
              <option value="">Selecione um cliente…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-zinc-500">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Seu cartão vence em 7 dias"
            className="mt-1 h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-500">Mensagem</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Escreva a mensagem que o cliente vai ver no painel dele…"
            className="mt-1 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-500">Canal</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {channels.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChannel(c)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  channel === c ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {channel !== 'Painel' && (
            <p className="mt-2 text-xs text-amber-400/80">
              Este envio sempre aparece no painel do cliente (dentro do app). O canal "{channel}" é apenas informativo aqui — o disparo real por {channel.toLowerCase()} depende de uma integração externa (ex.: Edge Function de email/WhatsApp) ainda não configurada.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Cancelar</button>
          <button onClick={handleSend} className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600">Enviar</button>
        </div>
      </div>
    </Modal>
  );
}
