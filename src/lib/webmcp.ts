/**
 * WebMCP — expõe ferramentas da AirNext para agentes de IA que rodam NO navegador
 * (navigator.modelContext). Chamado uma vez, no carregamento da página (main.tsx).
 *
 * Todas as ferramentas são de leitura (catálogo, FAQ, contato) ou navegação. Nenhuma compra,
 * envio de formulário ou dado de usuário passa por aqui.
 * Navegadores sem WebMCP simplesmente ignoram: não há erro nem custo.
 */
import { AIRNEXT_FAQ } from '../config/aiContent';
import { CATALOG_PRODUCTS, formatBRL, productUrl } from '../config/catalog';
import { LEGAL_CONFIG } from '../config/legal';

type ToolResult = { content: { type: 'text'; text: string }[] };

interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean };
  execute: (args: any) => Promise<ToolResult> | ToolResult;
}

const json = (data: unknown): ToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
});

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const tokens = (s: string) => norm(s).split(/[^a-z0-9]+/).filter((t) => t.length > 2);

const summarize = (p: (typeof CATALOG_PRODUCTS)[number]) => ({
  id: p.id,
  name: p.name,
  audience: p.tag,
  price: formatBRL(p.price),
  ...(p.oldPrice ? { previous_price: formatBRL(p.oldPrice) } : {}),
  description: p.desc,
  url: productUrl(p.id),
});

const PAGES: Record<string, { path: string; hash?: string }> = {
  home: { path: '/' },
  products: { path: '/', hash: 'produtos' },
  faq: { path: '/', hash: 'faq' },
  support: { path: '/suporte' },
  about: { path: '/sobre' },
  contact: { path: '/contato' },
  privacy: { path: '/politica-de-privacidade' },
  terms: { path: '/termos-de-uso' },
  cookies: { path: '/politica-de-cookies' },
};

const TOOLS: WebMcpTool[] = [
  {
    name: 'search_products',
    description:
      'Lista os produtos AirNext (cartões, tags e pulseiras NFC com QR Code) com preço em reais. Filtre por uma palavra, como "pet", "kids", "empresa" ou "google". Sem filtro, devolve todos.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Palavra ou frase para filtrar, opcional.' } },
    },
    annotations: { readOnlyHint: true },
    execute: ({ query }: { query?: string } = {}) => {
      const q = tokens(query || '');
      const list = CATALOG_PRODUCTS.filter((p) => {
        if (q.length === 0) return true;
        const hay = norm(`${p.name} ${p.tag} ${p.desc} ${p.specs.join(' ')}`);
        return q.some((t) => hay.includes(t));
      });
      return json({ count: list.length, products: list.map(summarize) });
    },
  },
  {
    name: 'get_product',
    description: 'Detalhes de um produto AirNext: preço, descrição, características e link da página.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', enum: CATALOG_PRODUCTS.map((p) => p.id), description: 'Identificador do produto.' } },
      required: ['id'],
    },
    annotations: { readOnlyHint: true },
    execute: ({ id }: { id: string }) => {
      const p = CATALOG_PRODUCTS.find((x) => x.id === id);
      if (!p) return json({ error: `Produto "${id}" não existe.`, valid_ids: CATALOG_PRODUCTS.map((x) => x.id) });
      return json({ ...summarize(p), features: p.specs });
    },
  },
  {
    name: 'answer_faq',
    description:
      'Busca nas perguntas frequentes da AirNext (NFC, QR Code, iPhone e Android, mensalidade, LGPD, pets, TEA) e devolve as respostas mais parecidas com a pergunta.',
    inputSchema: {
      type: 'object',
      properties: { question: { type: 'string', description: 'A dúvida, em português.' } },
      required: ['question'],
    },
    annotations: { readOnlyHint: true },
    execute: ({ question }: { question: string }) => {
      const q = tokens(question || '');
      const ranked = AIRNEXT_FAQ.map((f) => {
        const hay = norm(`${f.question} ${f.answer}`);
        const score = q.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
        return { f, score };
      })
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      return json({
        matches: ranked.map((r) => ({ question: r.f.question, answer: r.f.answer })),
        more: 'https://airnext.com.br/#faq',
      });
    },
  },
  {
    name: 'get_contact_info',
    description: 'Canais oficiais de contato da AirNext: WhatsApp, telefone, e-mail de suporte, e-mail de privacidade e Instagram.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    execute: () =>
      json({
        company: LEGAL_CONFIG.legalName,
        whatsapp: `https://wa.me/${LEGAL_CONFIG.whatsappNumber}`,
        phone: LEGAL_CONFIG.phone,
        support_email: LEGAL_CONFIG.supportEmail,
        privacy_email: LEGAL_CONFIG.privacyEmail,
        instagram: LEGAL_CONFIG.instagramUrl,
        contact_page: 'https://airnext.com.br/contato',
        ...(LEGAL_CONFIG.address ? { address: LEGAL_CONFIG.address } : {}),
      }),
  },
  {
    name: 'open_page',
    description:
      'Abre uma página ou seção do site AirNext para a pessoa que está usando o navegador: produtos, perguntas frequentes, suporte, sobre, contato, privacidade, termos ou cookies.',
    inputSchema: {
      type: 'object',
      properties: { page: { type: 'string', enum: Object.keys(PAGES), description: 'Destino.' } },
      required: ['page'],
    },
    annotations: { readOnlyHint: false },
    execute: ({ page }: { page: string }) => {
      const dest = PAGES[page];
      if (!dest) return json({ error: `Destino "${page}" não existe.`, valid: Object.keys(PAGES) });
      const onHome = window.location.pathname === '/';
      if (dest.hash && onHome) {
        document.getElementById(dest.hash)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.assign(dest.path + (dest.hash ? `#${dest.hash}` : ''));
      }
      return json({ opened: page, url: `https://airnext.com.br${dest.path}${dest.hash ? `#${dest.hash}` : ''}` });
    },
  },
];

let registered = false;

function tryRegister(): boolean {
  if (registered || typeof navigator === 'undefined') return registered;
  const mc = (navigator as any).modelContext;
  if (!mc) return false;
  try {
    if (typeof mc.registerTool === 'function') {
      for (const tool of TOOLS) {
        try { mc.registerTool(tool); } catch (e) { console.warn('[WebMCP] falha ao registrar', tool.name, e); }
      }
      registered = true;
    } else if (typeof mc.provideContext === 'function') {
      mc.provideContext({ tools: TOOLS });
      registered = true;
    }
  } catch (e) {
    console.warn('[WebMCP] indisponível:', e);
  }
  return registered;
}

/** Registra as ferramentas já no carregamento; tenta de novo se o navegador injetar a API um pouco depois. */
export function registerWebMcpTools(): void {
  if (typeof window === 'undefined') return;
  if (tryRegister()) return;
  window.addEventListener('load', () => { tryRegister(); }, { once: true });
  window.setTimeout(tryRegister, 1500);
}
