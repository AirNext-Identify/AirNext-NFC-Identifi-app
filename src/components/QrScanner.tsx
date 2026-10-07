import { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';
import { createQrDetector, isBarcodeDetectorSupported } from '../lib/qrScanner';

interface QrScannerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Chamado com o texto bruto lido do QR (URL completa ou só o código) assim que um QR é detectado. */
  onDetected: (rawValue: string) => void;
}

/**
 * Modal de leitura de QR Code pela câmera do dispositivo. Usado em
 * "Ativar Produto" (ActivationPage) para ativar a placa escaneando o QR
 * impresso nela, em vez de digitar o código manualmente — mesma ideia do
 * "Ativar NFC ou QR Code" do fluxo físico.
 *
 * Mesmo conceito de fallback usado para a Web NFC API: se o navegador não
 * suportar leitura nativa de QR, mostra um aviso e o cliente digita o
 * código manualmente (o fluxo continua funcionando normalmente).
 */
export function QrScanner({ isOpen, onClose, onDetected }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [error, setError] = useState('');
  const supported = isBarcodeDetectorSupported();

  useEffect(() => {
    if (!isOpen || !supported) return;

    let cancelled = false;
    const detector = createQrDetector();

    async function tick() {
      if (cancelled || !detector || !videoRef.current) return;
      try {
        const results = await detector.detect(videoRef.current);
        if (results.length > 0 && !cancelled) {
          onDetected(results[0].rawValue);
          return; // Encontrou — o componente pai fecha o modal e processa o código.
        }
      } catch {
        // Quadro inválido pontual (ex.: vídeo ainda carregando) — ignora e tenta de novo.
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
              ? 'Permissão de câmera negada. Habilite o acesso à câmera nas configurações do navegador.'
              : 'Não foi possível acessar a câmera deste dispositivo.'
          );
        }
      }
    }

    setError('');
    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, supported]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#0a0a0a] border border-white/10 overflow-hidden">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-5 pb-3 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2563EB]/20 mb-3">
            <Camera className="h-6 w-6 text-[#60A5FA]" />
          </div>
          <h3 className="text-white font-bold text-lg">Escanear QR Code</h3>
          <p className="text-zinc-400 text-sm mt-1">Aponte a câmera para o QR Code impresso na placa</p>
        </div>

        {supported ? (
          error ? (
            <div className="px-6 pb-6">
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            </div>
          ) : (
            <div className="relative mx-5 mb-5 rounded-xl overflow-hidden bg-black aspect-square">
              <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-6 border-2 border-white/60 rounded-2xl pointer-events-none" />
            </div>
          )
        ) : (
          <div className="px-6 pb-6">
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 flex gap-2 text-sm text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Este navegador não suporta leitura de QR Code pela câmera. Feche esta janela e digite o código manualmente.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
