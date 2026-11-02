import { useMemo, useState } from 'react';
import { MessageCircle, RotateCcw, Save, Truck } from 'lucide-react';
import type { Order } from '@/lib/orders';
import { CARRIERS, buildFinalizedMessage, formFromOrder, trackingLink, whatsappUrl, type ShippingForm } from '@/lib/orderShipping';

export type SaveFields = Partial<Pick<Order, 'status' | 'carrier' | 'tracking_code' | 'tracking_url' | 'estimated_delivery' | 'shipping_note' | 'shipped_at'>>;

interface Props {
  order: Order;
  onSave: (id: string, fields: SaveFields) => void;
}

const field = 'mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none';

export function OrderShippingPanel({ order: o, onSave }: Props) {
  const [f, setF] = useState<ShippingForm>(() => formFromOrder(o));
  const [edited, setEdited] = useState<string | null>(null);
  const [markShipped, setMarkShipped] = useState(true);
  const [saved, setSaved] = useState(false);

  const auto = useMemo(() => buildFinalizedMessage(o, f), [o, f]);
  const message = edited ?? auto;
  const set = <K extends keyof ShippingForm>(k: K, v: ShippingForm[K]) => { setF(p => ({ ...p, [k]: v })); setSaved(false); };

  const save = () => {
    const fields: SaveFields = {
      carrier: f.carrier || null,
      tracking_code: f.trackingCode.trim().toUpperCase() || null,
      tracking_url: f.trackingUrl.trim() || null,
      estimated_delivery: f.estimatedDelivery.trim() || null,
      shipping_note: f.shippingNote.trim() || null,
    };
    // Com código de rastreio, o pedido passa para "Enviado" (e guarda a data do envio).
    if (markShipped && f.trackingCode.trim() && o.status !== 'enviado' && o.status !== 'entregue') {
      fields.status = 'enviado';
      fields.shipped_at = new Date().toISOString();
    }
    onSave(o.id, fields);
    setSaved(true);
  };

  const wa = whatsappUrl(o.customer_phone, message);
  const sendWhatsApp = () => {
    if (!wa) return;
    window.open(wa, '_blank', 'noopener,noreferrer'); // abre primeiro (evita bloqueio de pop-up)
    save();
  };
  const link = trackingLink(f);

  return (
    <div className="space-y-3 rounded-xl border border-emerald-600/30 bg-emerald-500/5 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
        <Truck className="h-4 w-4" /> Envio, rastreio e mensagem ao cliente
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-zinc-500">
          Transportadora / forma de envio
          <select value={f.carrier} onChange={e => set('carrier', e.target.value)} className={field}>
            {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="block text-xs text-zinc-500">
          Código de rastreio
          <input value={f.trackingCode} onChange={e => set('trackingCode', e.target.value)} placeholder="Ex.: BR123456789BR" className={`${field} uppercase`} />
        </label>
        <label className="block text-xs text-zinc-500">
          Previsão de entrega
          <input value={f.estimatedDelivery} onChange={e => set('estimatedDelivery', e.target.value)} placeholder="Ex.: 3 a 5 dias úteis / até 12/11" className={field} />
        </label>
        <label className="block text-xs text-zinc-500">
          Link de rastreio {f.carrier === 'Correios' ? '(opcional — gerado pelo código)' : ''}
          <input value={f.trackingUrl} onChange={e => set('trackingUrl', e.target.value)} placeholder="https://…" className={field} />
        </label>
      </div>
      <label className="block text-xs text-zinc-500">
        Mais detalhes para o cliente (opcional)
        <textarea value={f.shippingNote} onChange={e => set('shippingNote', e.target.value)} rows={2}
          placeholder="Ex.: Seu card já vem com o QR Code. Ative pelo código que enviamos por e-mail."
          className={`${field} resize-none`} />
      </label>

      <label className="flex items-center gap-2 text-xs text-zinc-400">
        <input type="checkbox" checked={markShipped} onChange={e => setMarkShipped(e.target.checked)} className="h-4 w-4 accent-emerald-500" />
        Ao salvar com código de rastreio, marcar o pedido como “Enviado”
      </label>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs text-zinc-500">Mensagem pronta (pode editar antes de enviar)</p>
          {edited !== null && (
            <button onClick={() => setEdited(null)} className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200">
              <RotateCcw className="h-3 w-3" /> Restaurar automática
            </button>
          )}
        </div>
        <textarea value={message} onChange={e => setEdited(e.target.value)} rows={12}
          className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 font-mono text-xs leading-relaxed text-zinc-200 focus:border-indigo-500 focus:outline-none" />
        {link && <p className="mt-1 truncate text-[11px] text-zinc-600">Rastreio: {link}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={sendWhatsApp} disabled={!wa}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50">
          <MessageCircle className="h-4 w-4" /> Salvar e enviar no WhatsApp
        </button>
        <button onClick={save}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-200 transition hover:bg-zinc-800">
          <Save className="h-4 w-4" /> Só salvar
        </button>
        {saved && <span className="text-xs text-emerald-400">Salvo ✓</span>}
        {!wa && <span className="text-xs text-amber-400">Pedido sem telefone do cliente.</span>}
      </div>
    </div>
  );
}
