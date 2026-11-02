/** Transforma o texto do campo "Serviços / Produtos principais" em uma lista limpa de itens. */
export function parseServicos(raw: unknown, max = 12): string[] {
  if (typeof raw !== 'string') return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[\n,;•·|]+/)) {
    const t = part.replace(/^[-–—*\s]+/, '').trim().slice(0, 40);
    const k = t.toLowerCase();
    if (!t || seen.has(k)) continue;
    seen.add(k);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}
