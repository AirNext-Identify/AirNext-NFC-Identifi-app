/**
 * Guarda temporariamente o código de ativação que o PRÓPRIO CLIENTE recebeu
 * (link /ativar/:código enviado pelo suporte), para que ele não fique na barra
 * de endereço nem no histórico ao longo do fluxo login/cadastro → ativação.
 *
 * Ler QR/chip NUNCA grava código aqui: o código de ativação não sai do banco
 * por escaneamento (ver sql/19_ativacao_codigo_obrigatorio.sql). Quem escaneia
 * só deixa um aviso (hint) de que o produto está aguardando ativação.
 *
 * Expira em 30 min e é apagado assim que o produto é ativado.
 */
const KEY = 'airnext:pending_activation';
const TTL_MS = 30 * 60 * 1000;

export function setPendingActivationCode(code: string, line?: string): void {
  try {
    // `line` ('GOOGLE'…) só ajusta o TEXTO das telas; quem decide o tipo do
    // produto é sempre o banco (ver sql/10_airnext_google.sql).
    localStorage.setItem(KEY, JSON.stringify({ code, line, t: Date.now() }));
  } catch {
    /* storage indisponível: o cliente ainda pode digitar o código */
  }
}

export function getPendingActivationCode(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { code, t } = JSON.parse(raw) as { code: string; t: number };
    if (!code || Date.now() - t > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

export function getPendingActivationLine(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { line, t } = JSON.parse(raw) as { line?: string; t: number };
    return line && Date.now() - t <= TTL_MS ? line : null;
  } catch {
    return null;
  }
}

export function clearPendingActivationCode(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

const HINT_KEY = 'airnext:pending_activation_hint';

/** Marca que o cliente escaneou/tocou um produto ainda não ativado (sem guardar código). */
export function setPendingActivationHint(line?: string): void {
  try {
    localStorage.setItem(HINT_KEY, JSON.stringify({ line, t: Date.now() }));
  } catch {
    /* storage indisponível: só perde o texto personalizado da tela */
  }
}

export function getPendingActivationHint(): { line?: string } | null {
  try {
    const raw = localStorage.getItem(HINT_KEY);
    if (!raw) return null;
    const { line, t } = JSON.parse(raw) as { line?: string; t: number };
    if (Date.now() - t > TTL_MS) {
      localStorage.removeItem(HINT_KEY);
      return null;
    }
    return { line };
  } catch {
    return null;
  }
}

export function clearPendingActivationHint(): void {
  try {
    localStorage.removeItem(HINT_KEY);
  } catch {
    /* ignore */
  }
}
