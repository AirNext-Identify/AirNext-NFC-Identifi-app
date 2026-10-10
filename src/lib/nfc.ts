/**
 * Camada de integração com a Web NFC API (https://w3c.github.io/web-nfc/).
 *
 * Suporte real de leitura/gravação de tags NFC funciona apenas em:
 *  - Google Chrome / Chromium para Android (versão 89+)
 *  - Conexão servida via HTTPS (ou localhost)
 *  - Permissão de NFC concedida pelo usuário
 *
 * Em qualquer outro ambiente (desktop, iOS, navegadores sem suporte),
 * a aplicação cai automaticamente em modo de simulação, para que a
 * equipe consiga testar o fluxo operacional sem um dispositivo compatível.
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
  addEventListener: (type: string, listener: (event: any) => void) => void;
  removeEventListener: (type: string, listener: (event: any) => void) => void;
}

declare global {
  interface Window {
    NDEFReader?: new () => NDEFReaderLike;
  }
}

/** Verifica se o navegador/dispositivo atual suporta Web NFC nativamente. */
export function isWebNFCSupported(): boolean {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
}

/**
 * Aproxima e lê uma tag NFC física, retornando o número de série do chip
 * e os registros NDEF gravados (URL, texto, etc.). Rejeita a Promise caso
 * o navegador não tenha suporte, a permissão seja negada ou ocorra timeout.
 */
export function readNFCTag(timeoutMs = 20000): Promise<NFCReadResult> {
  return new Promise((resolve, reject) => {
    if (!isWebNFCSupported() || !window.NDEFReader) {
      reject(new Error('unsupported'));
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error('timeout'));
    }, timeoutMs);

    try {
      const reader = new window.NDEFReader();
      reader
        .scan({ signal: controller.signal })
        .then(() => {
          reader.onreading = (event: any) => {
            clearTimeout(timer);
            controller.abort();
            const records =
              event.message?.records?.map((record: any) => {
                let data = '';
                try {
                  const decoder = new TextDecoder(record.encoding || 'utf-8');
                  data = decoder.decode(record.data);
                } catch {
                  data = '';
                }
                return { recordType: record.recordType, data };
              }) ?? [];
            resolve({ serialNumber: event.serialNumber || 'desconhecido', records });
          };
          reader.onreadingerror = () => {
            clearTimeout(timer);
            reject(new Error('reading-error'));
          };
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
}

/**
 * Grava um link (URL) na tag NFC aproximada, no formato NDEF "url".
 * Esse é o método usado para programar os produtos AirNext: cada chip
 * recebe a URL única `https://airnext.com.br/n/{uuid}`.
 */
export function writeNFCUrl(url: string, timeoutMs = 20000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isWebNFCSupported() || !window.NDEFReader) {
      reject(new Error('unsupported'));
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error('timeout'));
    }, timeoutMs);

    try {
      const writer = new window.NDEFReader();
      writer
        .write(
          { records: [{ recordType: 'url', data: url }] },
          { signal: controller.signal, overwrite: true }
        )
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
}

/**
 * Fluxo completo de programação: grava a URL na tag e, em seguida, lê
 * novamente o chip para confirmar que a gravação foi realizada com
 * sucesso (verificação de integridade), retornando o serial e a URL lida.
 */
export async function writeAndVerifyNFCTag(url: string): Promise<{ serialNumber: string; verified: boolean }> {
  await writeNFCUrl(url);
  try {
    const result = await readNFCTag(8000);
    const urlRecord = result.records.find((r) => r.recordType === 'url');
    const verified = !!urlRecord && urlRecord.data.includes(url.split('/n/')[1] || url);
    return { serialNumber: result.serialNumber, verified };
  } catch {
    // Gravação pode ter funcionado mesmo que a leitura de confirmação falhe
    // (ex.: usuário afastou o chip rápido demais). Reporta sem verificação.
    return { serialNumber: 'não confirmado', verified: false };
  }
}

/** Gera erro amigável em português a partir de um erro da Web NFC API. */
export function describeNFCError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message === 'unsupported') {
    return 'Este dispositivo/navegador não possui suporte à leitura/gravação NFC (disponível apenas no Chrome para Android com NFC ativado).';
  }
  if (message === 'timeout') {
    return 'Tempo esgotado aguardando o chip. Aproxime a tag NFC do dispositivo e tente novamente.';
  }
  if (message === 'reading-error') {
    return 'Não foi possível ler o chip NFC. Tente aproximar novamente ou use outra tag.';
  }
  if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('notallowed')) {
    return 'Permissão de NFC negada. Habilite o acesso ao NFC nas configurações do navegador.';
  }
  return `Erro ao comunicar com o chip: ${message}`;
}
