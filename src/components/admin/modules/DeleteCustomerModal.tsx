import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from '@/components/admin/ui/Modal';
import type { Customer } from '@/types/admin';

interface DeleteCustomerModalProps {
  customer: Customer | null;
  onClose: () => void;
  /** Deve retornar true quando o usuário foi realmente excluído. */
  onConfirm: (id: string, opts: { deleteProducts: boolean }) => Promise<boolean> | boolean;
}

/**
 * Confirmação de exclusão de usuário (conta de login + dados).
 * Mostra estado de carregamento e só fecha quando a exclusão dá certo —
 * se falhar, o toast de erro aparece e o modal continua aberto.
 */
export function DeleteCustomerModal({ customer, onClose, onConfirm }: DeleteCustomerModalProps) {
  const [deleteProducts, setDeleteProducts] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (customer) {
      setDeleteProducts(false);
      setBusy(false);
    }
  }, [customer?.id]);

  const handleConfirm = async () => {
    if (!customer || busy) return;
    setBusy(true);
    try {
      const ok = await onConfirm(customer.id, { deleteProducts });
      if (ok) onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={!!customer} onClose={() => !busy && onClose()} title="Excluir usuário">
      {customer && (
        <div className="space-y-4">
          <div className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="text-sm text-red-200">
              Isso apaga a conta de login e os dados de <strong>{customer.name}</strong>
              {customer.email ? ` (${customer.email})` : ''}. Esta ação não pode ser desfeita.
            </p>
          </div>

          {customer.productCount > 0 && (
            <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <p className="text-sm text-zinc-300">
                Este usuário tem <strong>{customer.productCount}</strong> produto(s). O que fazer com eles?
              </p>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-400">
                <input type="radio" name="prod-mode" className="mt-1" checked={!deleteProducts} onChange={() => setDeleteProducts(false)} />
                <span>
                  <strong className="text-zinc-200">Liberar</strong> — voltam a ficar disponíveis para ativação (recomendado)
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-400">
                <input type="radio" name="prod-mode" className="mt-1" checked={deleteProducts} onChange={() => setDeleteProducts(true)} />
                <span>
                  <strong className="text-zinc-200">Apagar</strong> — remove os produtos do sistema
                </span>
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={onClose} disabled={busy} className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 disabled:opacity-50">
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={busy}
              className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? 'Excluindo…' : 'Excluir definitivamente'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
