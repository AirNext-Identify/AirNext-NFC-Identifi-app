// ============================================================================
// site-images.ts
// ----------------------------------------------------------------------------
// Registro central de TODAS as imagens fixas da LandingPage. Cada bloco do
// site (busca, vitrine, carrinho, modal, "veja em ação", "momentos" e o
// simulador "para todo mundo") tem sua PRÓPRIA chave — trocar uma imagem
// aqui não afeta as outras, mesmo que seja do mesmo produto.
// ============================================================================

export interface ImageSlot {
  id: string;
  label: string;
  context: string;
  recommendedSize: string;
  note: string;
  defaultUrl: string;
  /** 'image' (padrão, quando omitido) ou 'video'. Usado pelo Admin de Mídia
   *  para saber se deve mostrar preview de foto ou de vídeo, e qual tipo de
   *  arquivo aceitar no upload. */
  type?: 'image' | 'video';
}

// Nome amigável + foto padrão (a que já estava no código) de cada linha de produto.
const PRODUCT_META: Record<string, { label: string; url: string }> = {
  pro: { label: 'AirNext Pro', url: 'https://images.pexels.com/photos/9122014/pexels-photo-9122014.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200' },
  stand: { label: 'AirNext Stand', url: 'https://images.pexels.com/photos/5239822/pexels-photo-5239822.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200' },
  pet: { label: 'AirNext Pet', url: 'https://images.pexels.com/photos/15075137/pexels-photo-15075137.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200' },
  kids: { label: 'AirNext Kids', url: 'https://images.pexels.com/photos/5275817/pexels-photo-5275817.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200' },
  senior: { label: 'AirNext Senior', url: 'https://images.pexels.com/photos/7394608/pexels-photo-7394608.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200' },
  tea: { label: 'AirNext TEA', url: 'https://images.pexels.com/photos/8944295/pexels-photo-8944295.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200' },
};

// Foto exclusiva do cenário "Business" do simulador (não é de um produto específico).
const BUSINESS_URL = 'https://images.pexels.com/photos/7413999/pexels-photo-7413999.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';

// Cada bloco do site onde uma foto de produto aparece — com o tamanho certo
// pra não cortar feio ali.
const CONTEXTS: { prefix: string; context: string; size: string; note: string; products: string[] }[] = [
  {
    prefix: 'search',
    context: 'Overlay de busca (resultado da pesquisa)',
    size: 'Mínimo 1200×900px — formato 4:3',
    note: 'Card pequeno na busca. Foto horizontal ou quadrada, assunto centralizado.',
    products: ['pro', 'stand', 'pet', 'kids', 'senior', 'tea'],
  },
  {
    prefix: 'demo',
    context: 'Carrossel "Veja o AirNext em ação" (e o lightbox ao clicar)',
    size: 'Mínimo 1200×1500px — formato vertical 4:5',
    note: 'Aparece grande, em tela cheia ao clicar. Prefira foto vertical com o produto/pessoa central.',
    products: ['pro', 'stand', 'pet', 'kids', 'senior', 'tea'],
  },
  {
    prefix: 'shop',
    context: 'Vitrine principal de produtos (seção "Produtos")',
    size: 'Mínimo 1600×1600px — formato quadrado',
    note: 'Card quadrado grande, foco total no produto, fundo neutro funciona bem aqui.',
    products: ['pro', 'stand', 'pet', 'kids', 'senior', 'tea'],
  },
  {
    prefix: 'modal',
    context: 'Modal de detalhes do produto (ao clicar num card)',
    size: 'Mínimo 1600×1600px — formato quadrado',
    note: 'Pode ser a mesma foto usada na vitrine, mas com marca(s) em outro ângulo se quiser variar.',
    products: ['pro', 'stand', 'pet', 'kids', 'senior', 'tea'],
  },
  {
    prefix: 'cart',
    context: 'Miniatura no carrinho de compras',
    size: 'Mínimo 400×400px — formato quadrado',
    note: 'Aparece bem pequena (thumbnail), então qualquer recorte quadrado nítido funciona.',
    products: ['pro', 'stand', 'pet', 'kids', 'senior', 'tea'],
  },
  {
    prefix: 'moments',
    context: 'Carrossel "Momentos AirNext" (fotos de uso real)',
    size: 'Mínimo 1200×1600px — formato vertical 3:4',
    note: 'Foto de "vida real" mostrando o produto em uso. Vertical, com espaço embaixo para o texto sobreposto.',
    products: ['pro', 'stand', 'pet', 'kids', 'senior', 'tea'],
  },
];

export const SITE_IMAGE_SLOTS: ImageSlot[] = [
  ...CONTEXTS.flatMap((ctx) =>
    ctx.products.map((id) => ({
      id: `${ctx.prefix}-${id}`,
      label: PRODUCT_META[id].label,
      context: ctx.context,
      recommendedSize: ctx.size,
      note: ctx.note,
      defaultUrl: PRODUCT_META[id].url,
    }))
  ),
  // Simulador "Para todo mundo" — 4 cenários, cada um com sua própria foto.
  {
    id: 'everyone-tea',
    label: 'Cenário Autistas',
    context: 'Simulador "Para todo mundo"',
    recommendedSize: 'Mínimo 1600×1200px — formato paisagem 4:3',
    note: 'Aparece em tela cheia numa faixa 4:3. Prefira foto horizontal.',
    defaultUrl: PRODUCT_META.tea.url,
  },
  {
    id: 'everyone-kids',
    label: 'Cenário Kids',
    context: 'Simulador "Para todo mundo"',
    recommendedSize: 'Mínimo 1600×1200px — formato paisagem 4:3',
    note: 'Aparece em tela cheia numa faixa 4:3. Prefira foto horizontal.',
    defaultUrl: PRODUCT_META.kids.url,
  },
  {
    id: 'everyone-senior',
    label: 'Cenário Sênior',
    context: 'Simulador "Para todo mundo"',
    recommendedSize: 'Mínimo 1600×1200px — formato paisagem 4:3',
    note: 'Aparece em tela cheia numa faixa 4:3. Prefira foto horizontal.',
    defaultUrl: PRODUCT_META.senior.url,
  },
  {
    id: 'everyone-business',
    label: 'Cenário Business',
    context: 'Simulador "Para todo mundo"',
    recommendedSize: 'Mínimo 1600×1200px — formato paisagem 4:3',
    note: 'Aparece em tela cheia numa faixa 4:3. Prefira foto horizontal.',
    defaultUrl: BUSINESS_URL,
  },
];

// ----------------------------------------------------------------------------
// Vídeos do site — mesmo esquema de "slot" das imagens, cada um com sua
// própria chave. Hoje só tem o vídeo da seção "Veja a mágica acontecer", mas
// dá pra adicionar outros aqui no futuro seguindo o mesmo padrão.
// ----------------------------------------------------------------------------
export const SITE_VIDEO_SLOTS: ImageSlot[] = [
  {
    id: 'video-demo',
    label: 'Vídeo "Veja a mágica acontecer"',
    context: 'Vídeos do site',
    recommendedSize: 'Formato 16:9 — MP4 (H.264), ideal até 8MB',
    note: 'Vídeo em loop, sem áudio, exibido na seção de demonstração da home. Prefira um clipe curto (5–15s) que fique bom repetindo.',
    defaultUrl: 'https://assets.mixkit.co/videos/preview/mixkit-network-connection-lines-and-dots-31580-large.mp4',
    type: 'video',
  },
];

// Todos os slots (imagens + vídeos) juntos — usado pelo Admin de Mídia e pelo
// hook useSiteImages para resolver qualquer id, seja foto ou vídeo.
export const ALL_SITE_MEDIA_SLOTS: ImageSlot[] = [...SITE_IMAGE_SLOTS, ...SITE_VIDEO_SLOTS];

export const DEFAULT_IMAGES: Record<string, string> = Object.fromEntries(
  ALL_SITE_MEDIA_SLOTS.map((s) => [s.id, s.defaultUrl])
);
