// Fotos reais dos produtos (otimizadas em WebP, 1200px). O Vite empacota e
// gera hash de cache automaticamente a partir destes imports.
import comboKit from '../assets/products/combo-kit.webp';
import googlePretoParede from '../assets/products/google-preto-parede.webp';
import googleBrancaParede from '../assets/products/google-branca-parede.webp';
import googleSuporte from '../assets/products/google-suporte.webp';
import googlePretoMesa from '../assets/products/google-preto-mesa.webp';
import googleBrancaMesa from '../assets/products/google-branca-mesa.webp';

export const COMBO_KIT_IMG = comboKit;

// 3 imagens exibidas no card/modal do produto "Hub Google Avaliação"
export const GOOGLE_PRODUCT_GALLERY = [googlePretoParede, googleSuporte, googleBrancaMesa];

// 5 imagens do slider da seção "Plaquinhas Google"
export const GOOGLE_SHOWCASE = [
  { src: googlePretoParede, alt: 'Plaquinha preta de avaliação Google fixada na parede de um restaurante', label: 'Preta · parede' },
  { src: googleBrancaParede, alt: 'Plaquinha branca de avaliação Google com QR Code e NFC na entrada de um café', label: 'Branca · parede' },
  { src: googleSuporte, alt: 'Plaquinha de avaliação Google com suporte de balcão', label: 'Branca · balcão com suporte' },
  { src: googlePretoMesa, alt: 'Plaquinha preta de avaliação Google sobre a mesa de vidro', label: 'Preta · mesa' },
  { src: googleBrancaMesa, alt: 'Plaquinha branca de avaliação Google sobre a mesa de vidro', label: 'Branca · mesa' },
];
