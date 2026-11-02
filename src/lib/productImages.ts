// Fotos reais dos produtos (otimizadas em WebP, 1200px). O Vite empacota e
// gera hash de cache automaticamente a partir destes imports.
// ÚNICA fonte das imagens da landing — não duplique estes imports em outros arquivos.
import comboKit from '../assets/products/combo-kit.webp';
import googlePretoParede from '../assets/products/google-preto-parede.webp';
import googleBrancaParede from '../assets/products/google-branca-parede.webp';
import googlePretoMesa from '../assets/products/google-preto-mesa.webp';
import googleBrancaMesa from '../assets/products/google-branca-mesa.webp';
import googleBrancaBalcao from '../assets/products/google-branca-balcao.webp';
import standPosto from '../assets/products/stand-posto.webp';
import standGoogleNfc from '../assets/products/stand-google-nfc.webp';
import petThor from '../assets/airnext/pet-thor.webp';
import petTagAnuncio from '../assets/airnext/pet-tag-anuncio.webp';
import nfcTagToque from '../assets/airnext/nfc-tag-toque.webp';
import petCavalierToque from '../assets/airnext/pet-cavalier-toque.webp';
import petCavalierSentado from '../assets/airnext/pet-cavalier-sentado.webp';
import petThorPerfil from '../assets/airnext/pet-thor-perfil.webp';
import petThorTag from '../assets/airnext/pet-thor-tag.webp';
import petFilhoteChuva from '../assets/airnext/pet-filhote-chuva.webp';
import petPassoPerfil from '../assets/airnext/pet-passo-perfil.webp';
import petPassoColeira from '../assets/airnext/pet-passo-coleira.webp';
import petPassoAchou from '../assets/airnext/pet-passo-achou.webp';
import logoAirnext from '../assets/airnext/logo-airnext.webp';
import logoAirnextDark from '../assets/airnext/logo-airnext-dark.webp';
import eventoParticipante from '../assets/airnext/evento-participante.webp';
import eventoExpositor from '../assets/airnext/evento-expositor.webp';

export const COMBO_KIT_IMG = comboKit;

// Fotos avulsas usadas na narrativa da seção "AirNext Stand".
export const STAND_POSTO_IMG = standPosto;
export const STAND_GOOGLE_NFC_IMG = standGoogleNfc;
export const STAND_BALCAO_IMG = googleBrancaBalcao;

// Seção HUB (produto "AirNext Hub Google Avaliação"): somente plaquinhas de parede e mesa.
export const HUB_GALLERY = [googlePretoParede, googleBrancaParede, googleBrancaMesa, googlePretoMesa];

// Seção STAND (produto "AirNext Stand"): as duas fotos de stand de balcão.
export const STAND_GALLERY = [standPosto, standGoogleNfc];

// Seção "Plaquinhas de avaliação Google": todas as plaquinhas com o símbolo do Google.
export const GOOGLE_SHOWCASE = [
  { src: googlePretoParede, alt: 'Plaquinha preta de avaliação Google fixada na parede de um restaurante', label: 'Preta · parede' },
  { src: googleBrancaBalcao, alt: 'Stand branco de avaliação Google com QR Code e NFC sobre o balcão de uma cafeteria', label: 'Branca · balcão' },
  { src: googleBrancaMesa, alt: 'Plaquinha branca de avaliação Google sobre a mesa de vidro', label: 'Branca · mesa' },
  { src: googlePretoMesa, alt: 'Plaquinha preta de avaliação Google sobre a mesa de vidro', label: 'Preta · mesa' },
  { src: standGoogleNfc, alt: 'Stand NFC preto e branco com avaliação Google e QR Code sobre uma mesa de madeira', label: 'Stand NFC · mesa' },
];

// Artes oficiais AirNext (campanha). Usadas no hero, no produto Pet e no Pro.
export const PET_THOR_IMG = petThor;            // 4:5 — cachorro Thor com a tag + perfil no celular
export const PET_TAG_AD_IMG = petTagAnuncio;    // 4:5 — anúncio "Seu pet sempre protegido"
export const NFC_TAG_IMG = nfcTagToque;         // 1:1 — tag NFC "Seu mundo, com um toque"
export const PET_GALLERY = [petThor, petTagAnuncio];
export const PRO_GALLERY = [nfcTagToque];

// Fotos novas (campanha 2026) — 9:16. Cada uma é usada em UM único lugar da landing,
// para não repetir imagem entre seções.
export const PET_CAVALIER_TOQUE_IMG = petCavalierToque;     // destaque: pet + celular
export const PET_CAVALIER_SENTADO_IMG = petCavalierSentado; // galeria "Momentos"
export const PET_THOR_PERFIL_IMG = petThorPerfil;           // galeria "Momentos"
export const PET_THOR_TAG_IMG = petThorTag;                 // destaque: tag no pescoço
export const PET_FILHOTE_CHUVA_IMG = petFilhoteChuva;       // galeria "Momentos"
export const EVENTO_PARTICIPANTE_IMG = eventoParticipante;  // galeria "Momentos"
export const EVENTO_EXPOSITOR_IMG = eventoExpositor;        // destaque: troca de contato

// Seção "Como funciona" do AirNext Pet: uma foto por passo (9:16).
export const PET_STEP_IMGS = [petPassoPerfil, petPassoColeira, petPassoAchou];

// Logo AirNext (empacotado pelo Vite, não depende da pasta public).
export const LOGO_ON_DARK_IMG = logoAirnext;       // "Air" branco — para fundos escuros
export const LOGO_ON_LIGHT_IMG = logoAirnextDark;  // "Air" escuro — para fundos claros
