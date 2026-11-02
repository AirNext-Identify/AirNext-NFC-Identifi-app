/**
 * Catálogo em dados puros (sem JSX), para quem não pode importar a LandingPage:
 * ferramentas WebMCP (navegador), servidor MCP (public/mcp.php) e versões em Markdown.
 *
 * ⚠️ Espelha o array PRODUCTS de src/pages/LandingPage.tsx. Ao mudar nome, preço ou
 * descrição lá, mude aqui e em public/mcp-data.json / public/index.md.
 * Preço 0 = "sob consulta".
 */
export interface CatalogProduct {
  id: string;
  name: string;
  tag: string;
  price: number;
  oldPrice?: number;
  desc: string;
  specs: string[];
}

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  { id: "pro", name: "AirNext Pro", tag: "Profissionais", price: 89.9, oldPrice: undefined, desc: "Perfil digital para profissionais, autônomos e empreendedores.", specs: ["Chip NFC", "QR Code Dinâmico", "PVC Premium Matte", "IP65 · À Prova d'Água", "Edição ilimitada do perfil"] },
  { id: "stand", name: "AirNext Stand", tag: "Estabelecimentos", price: 129.9, oldPrice: undefined, desc: "Centralizador de informações para estabelecimentos.", specs: ["Base Acrílico Premium", "Chip NFC", "QR Code Estático + Dinâmico", "Avaliações no Google com um toque", "Dashboard de analytics", "Personalização com logo"] },
  { id: "pet", name: "AirNext Pet", tag: "Pets", price: 79.9, oldPrice: undefined, desc: "Identificação inteligente para pets.", specs: ["Acabamento em Resina", "Chip NFC", "QR Code Estático + Dinâmico", "IP68 · Submersível", "Argola", "Dados veterinários e +"] },
  { id: "kids", name: "AirNext Kids", tag: "Crianças", price: 99.9, oldPrice: undefined, desc: "Identificação digital para crianças.", specs: ["Silicone Hipoalergênico", "Chip NFC", "Nome e foto de identificação", "Resistente à água", "Contato dos responsáveis"] },
  { id: "senior", name: "AirNext Senior", tag: "Idosos", price: 99.9, oldPrice: undefined, desc: "Identificação para idosos.", specs: ["Dados do plano de saúde", "Chip NFC", "QR Code Estático + Dinâmico", "Medicações em uso", "Contato do médico", "Endereço residencial", "Leitura sem aplicativo"] },
  { id: "tea", name: "AirNext TEA", tag: "Espectro Autista", price: 99.9, oldPrice: undefined, desc: "Identificação para pessoas com Transtorno do Espectro Autista.", specs: ["Instruções de comunicação", "Chip NFC", "QR Code Estático + Dinâmico", "Sensibilidades sensoriais", "Contato do cuidador", "Dados médicos de emergência"] },
  { id: "combo", name: "Combo AirNext Completo", tag: "Kit · Economize", price: 219.9, oldPrice: 259.7, desc: "Tag + Card Pro + Pulseira NFC juntos por um preço especial.", specs: ["Card Pro + Tag + Pulseira NFC", "Um único perfil digital para os três", "Economia de R$ 39,80 no kit", "Chip NFC + QR Code em todas as peças", "Personalização pelo WhatsApp após o pedido"] },
  { id: "hubgoogle", name: "AirNext Hub Google Avaliação", tag: "Google Avaliações", price: 79.9, oldPrice: undefined, desc: "Plaquinha NFC que leva o cliente direto para avaliar seu negócio no Google.", specs: ["Link direto para avaliação no Google", "Chip NFC + QR Code de backup", "Acrílico premium resistente", "Sem app e sem mensalidade", "Aumenta suas avaliações e sua reputação"] },
  { id: "service", name: "AirNext Service", tag: "Estabelecimentos", price: 129.9, oldPrice: undefined, desc: "Placa NFC inteligente para hotéis, restaurantes, clínicas, salões, lojas e qualquer negócio.", specs: ["Wi-Fi, cardápio e catálogo de serviços", "Solicitação de atendimento e reservas", "Avaliações e feedback dos clientes", "Localização, horários e redes sociais", "Para hotéis, restaurantes, clínicas, lojas e mais"] },
  { id: "tag", name: "AirNext Tag", tag: "Multiuso", price: 69.9, oldPrice: undefined, desc: "Tag NFC universal para bagagens, mochilas, chaves e objetos do dia a dia.", specs: ["Base Acrílico Premium", "Acabamento em Resina", "Chip NFC", "QR Code de backup", "Resistente à água e riscos", "Fácil de fixar em qualquer objeto", "Ideal para bagagens, celulares e inúmeras possibilidades de uso no dia a dia."] },
  { id: "corporate", name: "AirNext Corporate", tag: "Empresas", price: 99.9, oldPrice: undefined, desc: "Crachás e cartões NFC inteligentes para equipes e colaboradores.", specs: ["Emissão em lote para equipes", "Perfil corporativo com marca própria", "Chip NFC + QR Code", "Dashboard de gestão"] },
  { id: "evento", name: "AirNext Evento", tag: "Eventos", price: 0.0, oldPrice: undefined, desc: "Crachás inteligentes para congressos, feiras e eventos.", specs: ["Programação e mapa do evento", "Acesso por NFC + QR Code", "Perfil digital personalizado", "Networking sem troca de papel", "PVC Premium Matte"] },
];

export const productUrl = (id: string) => `https://airnext.com.br/produto/${id}`;

export const formatBRL = (n: number) =>
  n > 0 ? `R$ ${n.toFixed(2).replace('.', ',')}` : 'sob consulta';
