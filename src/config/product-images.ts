/**
 * ============================================================================
 *  FOTOS DOS PRODUTOS — edite tudo por aqui
 * ============================================================================
 *  Cada produto da vitrine tem uma entrada abaixo, com o MESMO id usado no
 *  array PRODUCTS (pages/LandingPage.tsx).
 *
 *  main    → foto do card, da busca e da sacola
 *  gallery → (opcional) várias fotos: o card alterna entre elas e, ao clicar no
 *            produto, aparecem lado a lado e podem ser ampliadas
 *
 *  Como trocar uma foto:
 *   1) Arquivo local: coloque a imagem em  src/assets/products/  e importe
 *      (veja a seção "Arquivos locais" abaixo). Dica: use WebP, ~1200px.
 *   2) Link externo: cole a URL direto no campo (https://...).
 *   3) Pelo painel admin: as imagens salvas lá continuam valendo e têm
 *      prioridade sobre as daqui (chaves shop-*, row2-*, modal-*).
 *
 *  Proporção recomendada: quadrada (1:1) para os cards.
 * ============================================================================
 */

// ── Arquivos locais (src/assets/products/) ───────────────────────────────────
import comboKit from '../assets/products/combo-kit.webp';
import googlePretoParede from '../assets/products/google-preto-parede.webp';
import googleBrancaParede from '../assets/products/google-branca-parede.webp';
import googleSuporte from '../assets/products/google-suporte.webp';
import googlePretoMesa from '../assets/products/google-preto-mesa.webp';
import googleBrancaMesa from '../assets/products/google-branca-mesa.webp';
import personalizadoStand from '../assets/products/personalizado-stand.webp';
import personalizadoCard from '../assets/products/personalizado-card.webp';

export interface ProductImageSet {
  main: string;
  gallery?: string[];
}

// ── Fotos por produto ────────────────────────────────────────────────────────
export const PRODUCT_IMAGES: Record<string, ProductImageSet> = {
  // Primeira fileira
  pro:    { main: 'https://images.pexels.com/photos/9122014/pexels-photo-9122014.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200' },
  stand:  { main: 'https://images.pexels.com/photos/5239822/pexels-photo-5239822.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200' },
  pet:    { main: 'https://images.pexels.com/photos/15075137/pexels-photo-15075137.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200' },
  kids:   { main: 'https://images.pexels.com/photos/5275817/pexels-photo-5275817.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200' },
  senior: { main: 'https://images.pexels.com/photos/7394608/pexels-photo-7394608.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200' },
  tea:    { main: 'https://images.pexels.com/photos/8944295/pexels-photo-8944295.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200' },

  // Segunda fileira
  combo: { main: comboKit },                       // montagem: Card Pro + Tag + Pulseira
  tag:       { main: 'https://files.catbox.moe/ucabuc.png' },
  corporate: { main: 'https://files.catbox.moe/m8gpmb.png' },
  evento:    { main: 'https://files.catbox.moe/bp85o5.png' },
  service:   { main: 'https://files.catbox.moe/cuol4c.jpeg' },                // troque por uma foto neutra, se quiser

  // Hub Google Avaliação — 3 fotos (card alterna; ao clicar aparecem lado a lado)
  hubgoogle: {
    main: googlePretoParede,
    gallery: [googlePretoParede, googleSuporte, googleBrancaMesa],
  },

  // Personalizado AirNext — 2 fotos
  personalizado: {
    main: personalizadoStand,
    gallery: [personalizadoStand, personalizadoCard],
  },
};

// ── Seção "Plaquinhas de avaliação Google" (slider) ──────────────────────────
//  src = foto · alt = texto para acessibilidade/SEO · label = legenda no canto
export const GOOGLE_SHOWCASE = [
  { src: googlePretoParede, alt: 'Plaquinha preta de avaliação Google fixada na parede de um restaurante', label: 'Preta · parede' },
  { src: googleBrancaParede, alt: 'Plaquinha branca de avaliação Google com QR Code e NFC na entrada de um café', label: 'Branca · parede' },
  { src: googleSuporte, alt: 'Plaquinha de avaliação Google com suporte de balcão', label: 'Branca · balcão com suporte' },
  { src: googlePretoMesa, alt: 'Plaquinha preta de avaliação Google sobre a mesa de vidro', label: 'Preta · mesa' },
  { src: googleBrancaMesa, alt: 'Plaquinha branca de avaliação Google sobre a mesa de vidro', label: 'Branca · mesa' },
];
