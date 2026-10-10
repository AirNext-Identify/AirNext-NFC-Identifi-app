import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '../Modal';
import { ConsentCheckboxes, ConsentState, consentsRequiredOk } from './ConsentCheckboxes';
import { acceptRequiredConsents } from '../../lib/consents';

interface ConsentModalProps {
  isOpen: boolean;
  userId: string;
  onAccepted: () => void | Promise<void>;
  onClose?: () => void;
  /** Inclui checkbox de marketing (padrão: false no gate obrigatório) */
  showMarketing?: boolean;
  title?: string;
  description?: string;
}

export function ConsentModal({
  isOpen,
  userId,
  onAccepted,
  onClose,
  showMarketing = false,
  title = 'Antes de continuar',
  description = 'Para usar a AirNext com segurança e transparência, precisamos confirmar que você leu e concorda com os documentos atualizados.',
}: ConsentModalProps) {
  const [consents, setConsents] = useState<ConsentState>({
    privacy: false,
    terms: false,
    marketing: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const canContinue = consentsRequiredOk(consents);

  const handleContinue = async () => {
    if (!canContinue || !userId) return;
    setBusy(true);
    setError('');
    const res = await acceptRequiredConsents(userId, { marketing: consents.marketing });
    setBusy(false);
    if (!res.ok) {
      setError(res.error || 'Não foi possível registrar o aceite. Tente novamente.');
      return;
    }
    await onAccepted();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose || (() => undefined)} title={title}>
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-zinc-400">{description}</p>

        <ConsentCheckboxes
          value={consents}
          onChange={setConsents}
          variant="dark"
          showMarketing={showMarketing}
        />

        {error && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!canContinue || busy}
          onClick={handleContinue}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-semibold text-zinc-900 transition enabled:hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            'Continuar'
          )}
        </button>
      </div>
    </Modal>
  );
}
