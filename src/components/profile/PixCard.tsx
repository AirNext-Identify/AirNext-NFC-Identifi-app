import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Card } from '../ui/Card';

/**
 * PixCard — versão reutilizável do bloco de Pix que já existia inline em
 * PublicProfile.tsx (copiar chave + ver QR Code). Mesma funcionalidade,
 * agora isolada para poder ser usada em qualquer template/categoria sem
 * duplicar JSX.
 *
 * Uso (substitui o bloco "{/* Pix *\/}" em PublicProfile.tsx):
 *   <PixCard pixKey={d.chavePix} accentText={th.text} mutedText={th.muted} />
 */
interface PixCardProps {
  pixKey: string;
  accentText?: string;
  mutedText?: string;
  onCopy?: () => void;
}

export function PixCard({ pixKey, accentText = 'text-white', mutedText = 'text-zinc-500', onCopy }: PixCardProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(pixKey);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Card variant="glass" padding="sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all"
      >
        <span className="text-lg">💰</span>
        <span className={`text-sm font-bold ${accentText}`}>Pagar via Pix</span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/[0.04]">
          <div className="bg-white p-3 rounded-xl shadow">
            <QRCodeSVG value={pixKey} size={140} />
          </div>
          <div className="flex items-center gap-2 w-full">
            <span className={`text-xs font-mono flex-1 truncate ${mutedText}`}>{pixKey}</span>
            <button
              onClick={copy}
              className="text-xs font-bold shrink-0 flex items-center gap-1 text-blue-400 hover:text-blue-300"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
