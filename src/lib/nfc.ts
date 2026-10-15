/**
 * Camada de integração com a Web NFC API (https://w3c.github.io/web-nfc/).
 *
 * Funciona apenas em:
 *  - Google Chrome para Android (89+), com o NFC ligado no aparelho
 *  - Página em HTTPS (ou localhost), NÃO dentro de iframe
 *  - Permissão de NFC concedida pelo usuário (precisa de toque/clique)
 *
 * Em desktop, iOS, Firefox, Samsung Internet etc. não há suporte.
 */

export interface NFCReadResult {
  serialNumber: string;
  records: { recordType: string; data: string }[];
}

type NDEFRecordInit = {
  recordType: 'url' | 'text' | 'mime';
  data: string;
  mediaType?: string;
};

interface NDEFReaderLike {
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
  write: (message: { records: NDEFRecordInit[] }, options?: { signal?: AbortSignal; overwrite?: boolean }) => Promise<void>;
  onreading: ((event: any) => void) | null;
  onreadingerror: ((event: any) => void) | null;
}

declare global {
  interface Window {
    NDEFReader?: new () => NDEFReaderLike;
  }
}

/** Verifica se o navegador/dispositivo atual suporta Web NFC. */
export function isWebNFCSupported(): boolean {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
}

/** Diagnostica POR QUE o NFC não está disponível (retorna null se tudo ok). */
export function getNFCBlockReason(): string | null {
  if (typeof window === 'undefined') return 'Ambiente sem navegador.';
  if (!window.isSecureContext) {
    return 'A página precisa estar em HTTPS para usar NFC.';
  }
  try {
    if (window.top !== window.self) {
      return 'O NFC não funciona dentro de iframe/pré-visualização. Abra o site direto no Chrome do Android.';
    }
  } catch {
    return 'O NFC não funciona dentro de iframe/pré-visualização. Abra o site direto no Chrome do Android.';
  }
  if (!('NDEFReader' in window)) {
    return 'Este navegador não suporta NFC. Use o Google Chrome no Android (iPhone/iOS e computador não suportam gravação).';
  }
  return null;
}

/** Lê uma tag NFC e retorna serial + registros NDEF. */
export function readNFCTag(timeoutMs = 20000): Promise<NFCReadResult> {
  return new Promise((resolve, reject) => {
    if (!isWebNFCSupported() || !window.NDEFReader) {
      reject(new Error('unsupported'));
      return;
    }

    const controller = new AbortController();
    let done = false;
    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      controller.abort();
      fn();
    };
    const timer = setTimeout(() => finish(() => reject(new Error('timeout'))), timeoutMs);

    try {
      const reader = new window.NDEFReader();

      // Handlers ANTES do scan(), para não perder uma leitura imediata.
      reader.onreading = (event: any) => {
        const records =
          Array.from(event.message?.records ?? []).map((record: any) => {
            let data = '';
            try {
              data = new TextDecoder(record.encoding || 'utf-8').decode(record.data);
            } catch {
              data = '';
            }
            return { recordType: record.recordType as string, data };
          });
        finish(() => resolve({ serialNumber: event.serialNumber || 'desconhecido', records }));
      };
      reader.onreadingerror = () => finish(() => reject(new Error('reading-error')));

      reader.scan({ signal: controller.signal }).catch((err) => {
        if (done) return;
        finish(() => reject(err));
      });
    } catch (err) {
      finish(() => reject(err as Error));
    }
  });
}

/** Grava uma URL (NDEF "url") na tag aproximada, com 1 nova tentativa se o chip escapar. */
export async function writeNFCUrl(url: string, timeoutMs = 20000): Promise<void> {
  if (!isWebNFCSupported() || !window.NDEFReader) throw new Error('unsupported');

  const attempt = () =>
    new Promise<void>((resolve, reject) => {
      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort();
        reject(new Error('timeout'));
      }, timeoutMs);
      try {
        new window.NDEFReader!()
          .write({ records: [{ recordType: 'url', data: url }] }, { signal: controller.signal, overwrite: true })
          .then(() => {
            clearTimeout(timer);
            resolve();
          })
          .catch((err) => {
            clearTimeout(timer);
            reject(err);
          });
      } catch (err) {
        clearTimeout(timer);
        reject(err as Error);
      }
    });

  try {
    await attempt();
  } catch (err: any) {
    // NetworkError = chip saiu do campo no meio da gravação → tenta de novo uma vez
    if (err?.name === 'NetworkError') {
      await new Promise((r) => setTimeout(r, 600));
      await attempt();
      return;
    }
    throw err;
  }
}

/**
 * Grava e confirma por releitura. Se a releitura automática não pegar o chip
 * (comum no Chrome logo após gravar), tenta de novo com mais tempo.
 */
export async function writeAndVerifyNFCTag(url: string): Promise<{ serialNumber: string; verified: boolean }> {
  await writeNFCUrl(url);
  const key = url.split('/n/')[1] || url;

  for (let i = 0; i < 2; i++) {
    try {
      await new Promise((r) => setTimeout(r, 700));
      const result = await readNFCTag(12000);
      const urlRecord = result.records.find((r) => r.recordType === 'url' || r.data.includes('/n/'));
      return { serialNumber: result.serialNumber, verified: !!urlRecord && urlRecord.data.includes(key) };
    } catch {
      /* tenta de novo */
    }
  }
  return { serialNumber: 'não confirmado', verified: false };
}

/** Mensagem amigável em português a partir do erro da Web NFC API. */
export function describeNFCError(error: unknown): string {
  const name = (error as any)?.name as string | undefined;
  const message = error instanceof Error ? error.message : String(error);

  if (message === 'unsupported') return getNFCBlockReason() || 'Este dispositivo/navegador não suporta NFC.';
  if (message === 'timeout') return 'Tempo esgotado. Encoste o chip na parte de trás do celular (perto da câmera) e mantenha parado.';
  if (message === 'reading-error') return 'Não foi possível ler o chip. Reaproxime ou teste outra tag.';

  switch (name) {
    case 'NotAllowedError':
      return 'Permissão de NFC negada. No Chrome: ícone de cadeado → Configurações do site → NFC → Permitir. Depois toque no botão de novo.';
    case 'NotSupportedError':
      return 'NFC desligado ou indisponível. Ative o NFC nas configurações do Android.';
    case 'NotReadableError':
      return 'Não foi possível acessar o NFC. Ligue o NFC no aparelho e feche outros apps que usem NFC.';
    case 'NetworkError':
      return 'O chip saiu do campo durante a gravação ou está protegido/travado. Encoste e segure parado até terminar.';
    case 'InvalidStateError':
      return 'O NFC está ocupado. Feche e abra o Chrome e tente novamente.';
    case 'SecurityError':
      return 'Bloqueado por segurança: use HTTPS e abra fora de iframe.';
    case 'AbortError':
      return 'Operação cancelada.';
  }
  return `Erro ao comunicar com o chip${name ? ` (${name})` : ''}: ${message}`;
}
