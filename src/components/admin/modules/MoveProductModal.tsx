import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRightLeft, Loader2 } from 'lucide-react';
import { Modal } from '@/components/admin/ui/Modal';
import { cn } from '@/lib/adminUtils';
import { GOOGLE_URL_HELP, isValidGoogleReviewUrl, normalizeGoogleReviewUrl } from '@/lib/googleReview';
import type { Customer, Lot, Product } from '@/types/admin';

export interface MoveProductOptions {
  /** undefined = mantém o cliente · null = desvincula · string = transfere para esse cliente. */
  customerId?: string | null;
  redirectUrl?: string;
  newIdentity?: boolean;
}

interface Props {
  product: Product;
  /** TODOS os lotes (padrão e Google). */
  lots: Lot[];
  customers: Customer[];
  onClose: () => void;
  onMove: (productId: string, targetLotId: string, opts: MoveProductOptions) => Promise<boolean> | boolean | void;
}

const fieldCls =
  'h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700';

const KEEP = '__keep__';
const NONE = '__none__';

/**
 * Move QUALQUER produto para QUALQUER lote (padrão ⇄ Google) e, se quiser, para outro cliente.
 * - Perfil (dados, categoria, slug) nunca é apagado: fica guardado e volta a aparecer ao voltar para a linha padrão.
 * - Produto com cliente mantém QR e código. Sem cliente, dá para gerar novo QR/código no formato do lote.
 */
export function MoveProductModal({ product, lots, customers, onClose, onMove }: Props) {
  const isGoogleNow = product.productLine === 'GOOGLE';
  const currentLot = lots.find((l) => l.id === product.lotId);
  const currentCustomer = customers.find((c) => c.id === product.customerId);

  const googleLots = useMemo(() => lots.filter((l) => l.productLine === 'GOOGLE'), [lots]);
  const stdLots = useMemo(() => lots.filter((l) => l.productLine !== 'GOOGLE'), [lots]);

  const firstOther = lots.find((l) => l.id !== product.lotId);
  const [lotId, setLotId] = useState(firstOther?.id || product.lotId || '');
  const [customerSel, setCustomerSel] = useState<string>(KEEP);
  const [customerQuery, setCustomerQuery] = useState('');
  const [url, setUrl] = useState(product.redirectUrl || '');
  const [newIdentity, setNewIdentity] = useState(false);
  const [busy, setBusy] = useState(false);

  const target = lots.find((l) => l.id === lotId);
  const toGoogle = target?.productLine === 'GOOGLE';
  const lineChanged = !!target && toGoogle !== isGoogleNow;

  const finalCustomerId: string | undefined =
    customerSel === KEEP ? product.customerId : customerSel === NONE ? undefined : customerSel;
  const customerChanged = (finalCustomerId || '') !== (product.customerId || '');
  const hasOwner = !!finalCustomerId;

  const needsUrl = !!toGoogle && hasOwner && (lineChanged || customerChanged);
  const clean = normalizeGoogleReviewUrl(url);
  const urlOk = !needsUrl || isValidGoogleReviewUrl(clean);
  const canChooseIdentity = lineChanged && !hasOwner;
  const hadChip = !!product.programmedAt;

  const nothingToDo = !target || (target.id === product.lotId && !customerChanged);
  const canSave = !busy && !nothingToDo && urlOk;

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(q) || c.id === product.customerId
    );
  }, [customers, customerQuery, product.customerId]);

  const submit = async () => {
    if (!canSave || !target) return;
    setBusy(true);
    const ok = await onMove(product.id, target.id, {
      customerId: customerSel === KEEP ? undefined : customerSel === NONE ? null : customerSel,
      redirectUrl: needsUrl ? clean : undefined,
      newIdentity: canChooseIdentity && newIdentity,
    });
    setBusy(false);
    if (ok !== false) onClose();
  };

  const lotLabel = (l: Lot) => `${l.code}${l.id === product.lotId ? ' (atual)' : ''}${l.description ? ` — ${l.description}` : ''}`;

  return (
    <Modal
      isOpen
      onClose={busy ? () => {} : onClose}
      title={`Mover produto — ${product.activationCode}`}
      description={`Hoje: ${isGoogleNow ? 'AirNext Google' : 'produto padrão'} · lote ${currentLot?.code || 'sem lote'}${currentCustomer ? ` · cliente ${currentCustomer.name}` : ' · sem cliente'}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-zinc-500">Lote de destino</label>
          <select value={lotId} onChange={(e) => setLotId(e.target.value)} className={cn(fieldCls, 'mt-1')}>
            {stdLots.length > 0 && (
              <optgroup label="Lotes padrão (perfil)">
                {stdLots.map((l) => <option key={l.id} value={l.id}>{lotLabel(l)}</option>)}
              </optgroup>
            )}
            {googleLots.length > 0 && (
              <optgroup label="Lotes AirNext Google (avaliações)">
                {googleLots.map((l) => <option key={l.id} value={l.id}>{lotLabel(l)}</option>)}
              </optgroup>
            )}
          </select>
          {lots.length < 2 && <p className="mt-1 text-xs text-amber-400">Só existe um lote. Crie outro em Lotes para poder mover.</p>}
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-500">Cliente</label>
          <input
            value={customerQuery}
            onChange={(e) => setCustomerQuery(e.target.value)}
            placeholder="Buscar cliente por nome, empresa ou e-mail…"
            className={cn(fieldCls, 'mt-1')}
          />
          <select value={customerSel} onChange={(e) => setCustomerSel(e.target.value)} className={cn(fieldCls, 'mt-2')}>
            <option value={KEEP}>{currentCustomer ? `Manter cliente atual — ${currentCustomer.name}` : 'Manter sem cliente'}</option>
            {product.customerId && <option value={NONE}>Nenhum cliente (desvincular)</option>}
            {filteredCustomers
              .filter((c) => c.id !== product.customerId)
              .map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
          </select>
        </div>

        {needsUrl && (
          <div>
            <label className="text-xs font-medium text-zinc-500">Link de avaliações do Google (obrigatório)</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://g.page/r/…/review"
              className={cn(fieldCls, 'mt-1')}
            />
            {url.trim() && !urlOk && <p className="mt-1 text-xs text-amber-400">{GOOGLE_URL_HELP}</p>}
            {!url.trim() && <p className="mt-1 text-xs text-zinc-500">Plaquinha Google com cliente precisa de um destino para o QR redirecionar.</p>}
          </div>
        )}

        {canChooseIdentity && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 p-3 hover:bg-zinc-800/40">
            <input type="checkbox" checked={newIdentity} onChange={(e) => setNewIdentity(e.target.checked)} className="mt-0.5 h-4 w-4 accent-blue-500" />
            <span className="text-sm text-zinc-300">
              Gerar novo QR Code e novo código no formato do lote de destino
              <span className="mt-0.5 block text-xs text-zinc-500">
                Desmarcado (recomendado): o QR já impresso e o chip gravado continuam funcionando ({product.activationCode}).
              </span>
            </span>
          </label>
        )}

        <ul className="space-y-1.5 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
          {!lineChanged && !customerChanged && <li>• Só o lote muda. Código, QR Code, chip, cliente e perfil continuam iguais.</li>}
          {lineChanged && toGoogle && (
            <>
              <li>• O produto passa a ser <strong className="text-zinc-200">AirNext Google</strong>: o QR/chip redireciona para as avaliações do Google.</li>
              <li>• O perfil (dados, categoria, endereço público) fica <strong className="text-zinc-200">guardado</strong>, mas a página do perfil deixa de abrir enquanto for Google.</li>
              <li>• Google não tem validade: a data de validade é removida.</li>
            </>
          )}
          {lineChanged && !toGoogle && (
            <>
              <li>• O produto passa a ser <strong className="text-zinc-200">produto padrão</strong> (perfil, categoria, validade, renovação).</li>
              <li>• O link de avaliações do Google é apagado.{hasOwner ? ' O cliente continua com o mesmo QR e código.' : ''}</li>
              <li>• Se já existia um perfil guardado, ele volta a aparecer; senão o cliente monta o perfil.</li>
            </>
          )}
          {customerChanged && hasOwner && <li>• Será ativado em nome do cliente escolhido.</li>}
          {customerChanged && !hasOwner && <li className="text-amber-300">• Sem cliente, o produto volta para “Disponível” e a validade é removida.</li>}
          {canChooseIdentity && newIdentity && <li className="text-amber-300">• O código e o QR antigos deixam de funcionar.{hadChip ? ' A gravação do chip é zerada (volta para “Não programado”).' : ''}</li>}
        </ul>

        {lineChanged && hasOwner && !toGoogle && isGoogleNow && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-xs text-amber-200">Este cliente já usa a plaquinha como link de avaliações. Depois de mover, ela abrirá o perfil dele (ou o onboarding, se ainda não houver perfil).</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} disabled={busy} className="rounded-xl border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800">Cancelar</button>
          <button
            onClick={submit}
            disabled={!canSave}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />} {busy ? 'Movendo…' : 'Mover'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
