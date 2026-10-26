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
    let sawReadingError = false;
    let errorTimer: ReturnType<typeof setTimeout> | null = null;
    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (errorTimer) clearTimeout(errorTimer);
      controller.abort();
      fn();
    };
    const timer = setTimeout(
      () => finish(() => reject(new Error(sawReadingError ? 'reading-error' : 'timeout'))),
      timeoutMs
    );

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
      // Erro de leitura costuma ser transitório (chip se mexeu, antena mal posicionada).
      // Não aborta: continua escutando até achar o chip ou estourar o tempo.
      reader.onreadingerror = () => {
        sawReadingError = true;
        // Dá uma folga curta para uma nova tentativa de leitura; se não vier, falha logo.
        if (!errorTimer) {
          errorTimer = setTimeout(() => finish(() => reject(new Error('reading-error'))), 5000);
        }
      };

      reader.scan({ signal: controller.signal }).catch((err) => {
        if (done) return;
        finish(() => reject(err));
      });
    } catch (err) {
      finish(() => reject(err as Error));
    }
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Uma operação de escrita NDEF com tempo limite (cancela se o chip não aparecer). */
function ndefWrite(message: { records: { recordType: string; data?: string }[] }, timeoutMs: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error('timeout'));
    }, timeoutMs);
    try {
      new window.NDEFReader!()
        .write(message as any, { signal: controller.signal, overwrite: true })
        .then(() => {
          clearTimeout(timer);
          resolve();
        })
        .catch((err: unknown) => {
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
 * "Prepara" o chip: grava um registro NDEF vazio. É o que formata chips novos/em branco
 * (NTAG213/215/216, Ultralight etc.) para que passem a ser lidos e gravados normalmente.
 */
export async function formatNFCTag(timeoutMs = 20000): Promise<void> {
  if (!isWebNFCSupported() || !window.NDEFReader) throw new Error('unsupported');
  await ndefWrite({ records: [{ recordType: 'empty' }] }, timeoutMs);
}

const isRetryable = (err: any) =>
  err?.name === 'NetworkError' || err?.name === 'InvalidStateError' || err?.name === 'NotReadableError';

/** Erros em que vale insistir/formatar o chip. NotSupportedError também: chip novo/sem NDEF aparece assim. */
const isEscalable = (err: any) => isRetryable(err) || err?.name === 'NotSupportedError';

/** Acrescenta o tamanho da URL ao erro de "não suportado" (ajuda a separar chip pequeno de chip incompatível). */
function annotateWriteError(err: any, url: string): Error {
  if (err?.name !== 'NotSupportedError') return err;
  const bytes = new TextEncoder().encode(url).length;
  const out = new Error(`${err.message || 'NotSupportedError'} | URL com ${bytes} bytes (+ ~6 de cabeçalho NDEF)`);
  out.name = 'NotSupportedError';
  return out;
}

/**
 * Grava uma URL (NDEF "url") na tag aproximada. Escalonamento para funcionar com qualquer
 * tag NDEF (NTAG213/215/216, Ultralight, etc.): 1) grava; 2) tenta de novo; 3) formata o chip e grava.
 */
export async function writeNFCUrl(url: string, timeoutMs = 20000): Promise<void> {
  if (!isWebNFCSupported() || !window.NDEFReader) throw new Error('unsupported');
  const message = { records: [{ recordType: 'url', data: url }] };

  const tryWrite = async (): Promise<any | null> => {
    try {
      await ndefWrite(message, timeoutMs);
      return null;
    } catch (e) {
      return e;
    }
  };

  let err = await tryWrite();
  if (!err) return;
  if (!isEscalable(err)) throw err;

  await sleep(800);
  err = await tryWrite();
  if (!err) return;
  if (!isEscalable(err)) throw err;

  // Última tentativa: chip em branco/sem formato NDEF costuma só aceitar depois de formatado.
  await sleep(800);
  try {
    await formatNFCTag(timeoutMs);
  } catch {
    throw annotateWriteError(err, url);
  }
  await sleep(600);
  try {
    await ndefWrite(message, timeoutMs);
  } catch (e) {
    throw annotateWriteError(e, url);
  }
}

export interface WriteOptions {
  /** Seriais de chips já gravados nesta sessão: se o chip aproximado for um deles, NÃO grava por cima. */
  avoidSerials?: Set<string>;
  /** Recebe mensagens de progresso para mostrar na tela. */
  onMessage?: (message: string) => void;
}

/** Espera um chip que NÃO esteja na lista de já gravados (evita sobrescrever o chip anterior). */
async function waitForNewTag(avoid: Set<string> | undefined, onMessage?: (m: string) => void, totalMs = 30000): Promise<NFCReadResult> {
  const deadline = Date.now() + totalMs;
  for (;;) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error('timeout');
    const tag = await readNFCTag(remaining);
    if (!avoid || !avoid.has(tag.serialNumber)) return tag;
    onMessage?.('Este é o MESMO chip da gravação anterior. Afaste-o e aproxime um chip NOVO.');
    await new Promise((r) => setTimeout(r, 800));
  }
}

/**
 * Mantém o Chrome como dono do leitor NFC por alguns segundos depois da gravação.
 * Sem isso, o Android enxerga a URL recém-gravada no chip que continua encostado e
 * abre o link no navegador. Roda em segundo plano e ignora qualquer leitura/erro.
 */
let guardController: AbortController | null = null;

/** Encerra a proteção anterior (se houver) para não competir com a próxima leitura/gravação. */
function releaseNFCGuard(): void {
  if (guardController) {
    guardController.abort();
    guardController = null;
  }
}

function holdNFCReader(ms = 4000): void {
  if (!isWebNFCSupported() || !window.NDEFReader) return;
  releaseNFCGuard();
  try {
    const controller = new AbortController();
    guardController = controller;
    const reader = new window.NDEFReader();
    reader.onreading = () => {};
    reader.onreadingerror = () => {};
    reader.scan({ signal: controller.signal }).catch(() => {});
    setTimeout(() => {
      controller.abort();
      if (guardController === controller) guardController = null;
    }, ms);
  } catch {
    /* sem problema: é só uma proteção extra */
  }
}

/**
 * Fluxo de gravação: 1) detecta um chip NOVO, 2) grava a URL do produto.
 * A gravação é considerada concluída quando o `write()` do Chrome confirma — não há
 * releitura (ela exigia reaproximar o chip e fazia o Android abrir o link gravado).
 */
export async function programNFCTag(
  url: string,
  options: WriteOptions = {}
): Promise<{ serialNumber: string; written: true }> {
  if (!/^https?:\/\/\S+$/i.test(url)) {
    throw new Error('url-invalid');
  }

  // A proteção da gravação anterior ainda pode estar ativa: encerra antes de ler/gravar o próximo chip.
  releaseNFCGuard();
  await new Promise((r) => setTimeout(r, 300));

  options.onMessage?.('Aproxime o chip NFC da parte de trás do celular e segure parado...');
  let tag: NFCReadResult;
  try {
    tag = await waitForNewTag(options.avoidSerials, options.onMessage);
  } catch (err) {
    // Chip detectado mas ilegível (comum em chip novo/sem formato NDEF): a gravação costuma funcionar mesmo assim.
    if ((err as Error)?.message !== 'reading-error') throw err;
    options.onMessage?.('Não consegui ler o serial do chip. Tentando gravar direto — não afaste...');
    tag = { serialNumber: 'desconhecido', records: [] };
  }

  options.onMessage?.(`Chip ${tag.serialNumber} detectado. Gravando — não afaste...`);
  // O Chrome precisa de um instante para liberar o scan() anterior antes de aceitar o write().
  await new Promise((r) => setTimeout(r, 500));
  await writeNFCUrl(url);

  holdNFCReader();
  return { serialNumber: tag.serialNumber, written: true };
}

/** Mensagem amigável em português a partir do erro da Web NFC API. */
function friendlyNFCError(error: unknown): string {
  const name = (error as any)?.name as string | undefined;
  const message = error instanceof Error ? error.message : String(error);

  if (message === 'unsupported') return getNFCBlockReason() || 'Este dispositivo/navegador não suporta NFC.';
  if (message === 'timeout') return 'Tempo esgotado. Encoste o chip na parte de trás do celular (perto da câmera) e mantenha parado.';
  if (message === 'reading-error') return 'Chip detectado, mas o conteúdo não pôde ser lido: normalmente é chip em branco (sem formato NDEF) ou mal encostado. Isso não impede de gravar — use "Preparar chip" ou grave direto. Mifare Classic não funciona no Chrome.';
  if (message === 'url-invalid') return 'A URL a gravar está vazia ou inválida. Confira a URL base em Configurações e se o produto tem UUID.';

  switch (name) {
    case 'NotAllowedError':
      return 'Permissão de NFC negada. No Chrome: ícone de cadeado → Configurações do site → NFC → Permitir. Depois toque no botão de novo.';
    case 'NotSupportedError': {
      const m = message.toLowerCase();
      if (/disabled|turned off|setting/.test(m)) {
        return 'NFC desligado. Ative o NFC nas configurações do Android.';
      }
      if (/size|large|capacity|exceed|too big|space/.test(m)) {
        return 'A URL é grande demais para a memória deste chip. Use um chip maior (NTAG215/216) ou uma URL base mais curta.';
      }
      return 'O Chrome recusou a operação. Pode ser: (1) NFC desligado no Android; (2) chip que não aceita NDEF (tipo incompatível, clone ou travado); (3) memória do chip pequena para a URL. Teste "Preparar chip" e, se o erro continuar, o chip não é compatível.';
    }
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

/** Mensagem amigável + código técnico real do erro (para saber exatamente o porquê). */
export function describeNFCError(error: unknown): string {
  const name = (error as any)?.name as string | undefined;
  const message = error instanceof Error ? error.message : String(error);
  const friendly = friendlyNFCError(error);
  if (friendly.includes('Código técnico')) return friendly;
  return `${friendly} [Código técnico: ${name || 'Error'} — ${message || 'sem detalhe'}]`;
}

/** Diagnóstico do ambiente: mostra o que está bloqueando o NFC neste aparelho/navegador. */
export async function getNFCDiagnostics(): Promise<{ label: string; ok: boolean; detail: string }[]> {
  const out: { label: string; ok: boolean; detail: string }[] = [];
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isAndroid = /Android/i.test(ua);
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  const isOtherBrowser = /EdgA|OPR|SamsungBrowser|Firefox|FxiOS|DuckDuckGo|Brave|UCBrowser/i.test(ua);
  const isWebView = /; wv\)|Version\/\d+\.\d+ Chrome/i.test(ua);
  const inApp = /FBAN|FBAV|Instagram|WhatsApp|Line\/|GSA\//i.test(ua);

  out.push({ label: 'Android', ok: isAndroid, detail: isAndroid ? 'sim' : 'não — precisa ser Android' });
  out.push({
    label: 'Google Chrome 89+',
    ok: !!chromeMatch && Number(chromeMatch[1]) >= 89 && !isOtherBrowser && !isWebView && !inApp,
    detail: `${chromeMatch ? 'Chrome ' + chromeMatch[1] : 'não é Chrome'}${isOtherBrowser ? ' (outro navegador)' : ''}${isWebView || inApp ? ' (WebView/app interno — abra no Chrome)' : ''}`,
  });
  out.push({ label: 'HTTPS', ok: !!window.isSecureContext, detail: window.isSecureContext ? 'sim' : 'não — precisa de HTTPS' });
  let framed = false;
  try { framed = window.top !== window.self; } catch { framed = true; }
  out.push({ label: 'Fora de iframe', ok: !framed, detail: framed ? 'não — está dentro de iframe/pré-visualização' : 'sim' });
  out.push({ label: 'API NDEFReader', ok: 'NDEFReader' in window, detail: 'NDEFReader' in window ? 'disponível' : 'indisponível neste navegador' });
  try {
    const perm = await (navigator as any).permissions.query({ name: 'nfc' });
    out.push({
      label: 'Permissão NFC do site',
      ok: perm.state !== 'denied',
      detail: perm.state === 'denied' ? 'NEGADA — cadeado → Configurações do site → NFC → Permitir' : perm.state === 'granted' ? 'concedida' : 'ainda não concedida (será pedida ao tocar em gravar)',
    });
  } catch {
    out.push({ label: 'Permissão NFC do site', ok: true, detail: 'não foi possível consultar' });
  }
  return out;
}
