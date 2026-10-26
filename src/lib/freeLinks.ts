/**
 * Links livres do perfil (PERSONAL = Profissional e BUSINESS).
 * Guardados em `profile_data.linksLivres` — mesmo padrão dos demais campos do
 * perfil, então não precisa de migração de banco.
 */
export interface FreeLink {
  id: string;
  titulo: string;
  url: string;
  /** Emoji opcional mostrado antes do título (ex.: "📅"). */
  icone?: string;
  /** Quando true o link aparece como botão cheio, com a cor dos botões do perfil. */
  destaque?: boolean;
}

export const MAX_FREE_LINKS = 30;

/** Categorias em que o editor mostra os links livres. */
export const FREE_LINK_CATEGORIES = ['PERSONAL', 'BUSINESS'];

export const newFreeLink = (): FreeLink => ({
  id: `lnk${Date.now()}${Math.floor(Math.random() * 1000)}`,
  titulo: '',
  url: '',
  icone: '',
  destaque: false,
});

/**
 * Converte o que o cliente digitou numa URL segura.
 * Só devolve http(s), mailto: e tel: — qualquer outro esquema (javascript:, data:…)
 * é descartado (retorna '').
 */
export function normalizeFreeLink(raw: string): string {
  const v = (raw || '').trim();
  if (!v) return '';
  if (/^(javascript|data|vbscript|file):/i.test(v)) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(v)) return v;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`;
  if (/^\+?[\d\s().-]{8,}$/.test(v)) return `tel:${v.replace(/[^\d+]/g, '')}`;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v) && !/^[a-z0-9.-]+:\d+/i.test(v)) return '';
  return `https://${v.replace(/^\/+/, '')}`;
}

/** Lista pronta para exibir: com título e URL válida. */
export function visibleFreeLinks(list: unknown): (FreeLink & { href: string })[] {
  if (!Array.isArray(list)) return [];
  return (list as FreeLink[])
    .map(l => ({ ...l, href: normalizeFreeLink(l?.url || '') }))
    .filter(l => l && l.titulo?.trim() && l.href)
    .slice(0, MAX_FREE_LINKS);
}
