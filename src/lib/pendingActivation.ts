/**
 * Guarda temporariamente o código de ativação lido do QR/chip, para que ele
 * NÃO precise ficar na barra de endereço (nem no histórico, nem em ?next=) ao
 * longo do fluxo scan → login/cadastro → ativação.
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
