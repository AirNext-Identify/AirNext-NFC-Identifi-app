/**
 * Leitura de QR Code pela câmera do dispositivo, usando a Barcode Detection
 * API nativa do navegador (https://wicg.github.io/shape-detection-api/).
 *
 * Suporte real (sem biblioteca extra) funciona hoje principalmente em:
 *  - Google Chrome / Edge (desktop e Android)
 *
 * Em navegadores sem suporte (ex.: Safari/iOS mais antigos), o componente
 * de scanner (QrScanner.tsx) cai num aviso amigável pedindo para digitar o
 * código manualmente — exatamente o mesmo padrão de fallback já usado para
 * a Web NFC API em src/lib/nfc.ts.
 */

export interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

/** Verifica se o navegador atual suporta a Barcode Detection API nativa. */
export function isBarcodeDetectorSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

/** Cria um detector configurado especificamente para QR Code. Retorna null se não suportado. */
export function createQrDetector(): BarcodeDetectorLike | null {
  if (!isBarcodeDetectorSupported() || !window.BarcodeDetector) return null;
  try {
    return new window.BarcodeDetector({ formats: ['qr_code'] });
  } catch {
    return null;
  }
}

/**
 * Extrai o código de ativação AirNext (formato "AIR-" + 8 caracteres, ver
 * generateActivationCode em src/lib/adminUtils.ts) de qualquer texto lido
 * do QR — seja a URL permanente completa gravada pelo admin
 * (`${appUrl}/a/AIR-XXXXXXXX`, ver ProductsView.tsx → QrModal) ou o código
 * puro, caso algum QR tenha sido gerado apenas com o código em si.
 */
export function extractActivationCode(rawValue: string): string | null {
  const match = rawValue.match(/AIR-[A-Z0-9]{8}/i);
  return match ? match[0].toUpperCase() : null;
}
