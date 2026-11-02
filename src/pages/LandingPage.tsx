import { useState, useEffect, useMemo, useRef, lazy } from 'react';
import LazyOnView from '../components/landing/LazyOnView';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { AIRNEXT_FAQ, AIRNEXT_DEFINITION, AIRNEXT_HOW_IT_WORKS } from '../config/aiContent';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { useSiteImages } from '../hooks/useSiteImages';
import { isVideoUrl } from '../lib/media';
import { setAnalyticsConsent } from '../lib/analytics';
import { COMBO_KIT_IMG, HUB_GALLERY, STAND_GALLERY, PET_GALLERY, PET_THOR_IMG, NFC_TAG_IMG, PET_CAVALIER_SENTADO_IMG, PET_THOR_PERFIL_IMG, PET_FILHOTE_CHUVA_IMG, EVENTO_PARTICIPANTE_IMG } from '../lib/productImages';
import { fmtPrice, priceLabel } from '../lib/price';
import ProductHero from '../components/landing/ProductHero';
import HeroScroll3D from '../components/landing/HeroScroll3D';
import TeaTechSlider from '../components/landing/TeaTechSlider';
import { productImage } from '../lib/productShowcase';
import { LOGO_ON_DARK, LOGO_ON_LIGHT } from '../components/BrandLogo';
import SacolaDrawer from '../components/store/SacolaDrawer';
import { useStore } from '../store/StoreContext';
import { usePublicFeedbacks } from '../hooks/usePublicFeedbacks';
// (Abertura animada desativada p/ desempenho: para reativar, reimporte ../components/splash/SplashScreen e renderize <SplashScreen /> no topo da landing.)
import { useFeedbackTheme, FeedbackLink, GOOGLE_REVIEW_URL } from '../components/feedback';
const ProductShowcase = lazy(() => import('../components/landing/ProductShowcase'));
const GooglePlaquesSection = lazy(() => import('../components/landing/GooglePlaquesSection'));
const PrivacyShowcaseSection = lazy(() => import('../components/landing/PrivacyShowcaseSection'));
const AirNextHighlightsSection = lazy(() => import('../components/landing/AirNextHighlightsSection'));
const StandStorySection = lazy(() => import('../components/landing/StandStorySection'));
const PetStorySection = lazy(() => import('../components/landing/PetStorySection'));
const TagShowcaseSection = lazy(() => import('../components/landing/TagShowcaseSection'));
import {
  ChevronRight, ShoppingBag, Nfc, QrCode,
  Shield, Check, ArrowRight, ArrowLeft,
  Globe, MessageCircle, Camera, AtSign, Zap,
  Smartphone, Users, Send, X, Play,
  Leaf, Recycle, TreePine, Droplets, Heart,
  BookOpen, HelpCircle, LifeBuoy,
  Rocket, Eye, Target, Plus, Minus, Trash2, Search,
  Baby, Puzzle, Briefcase, Sun, Moon, Sparkles, Star, UserRound,
  Palette, 
  CreditCard, KeyRound, Tag as TagIcon, PawPrint, Building2,
  Share2, 
  Watch,
  Square,
  
  RectangleHorizontal,
  
  Phone, Wifi, AlertTriangle,
  Ticket, EyeOff, Link2, Store, Gift,
  IdCard, Utensils,
} from 'lucide-react';

/**
 * ─── AirNext Design System — referência rápida ──────────────────────────
 * Escala de espaçamento (Tailwind, base 4px): 2=8px · 3=12px · 4=16px ·
 * 6=24px · 8=32px · 12=48px · 16=64px · 24=96px. Ao adicionar padding/gap
 * novo, prefira sempre um destes steps em vez de valores "soltos" (ex.: p-5,
 * p-10, p-14) para manter o ritmo visual consistente entre seções.
 *
 * Ritmo vertical de seção: py-20 md:py-28 é o padrão em todas as <section>
 * de conteúdo (já aplicado de forma consistente). Exceções legítimas: o
 * hero (#top, usa pt-32 md:pt-40 pb-12 md:pb-16 por causa da navbar fixa) e
 * o footer (py-16 md:py-20, mais compacto por natureza).
 *
 * Container: max-w-7xl para o corpo das seções · max-w-4xl/3xl para blocos
 * de leitura/texto centralizado · max-w-2xl para CTAs e cards estreitos.
 * Larguras "especiais" (max-w-6xl na navbar/configurador, max-w-5xl no
 * player de vídeo 16:9) são propositais — não são inconsistências.
 *
 * Raio de borda: 2xl/3xl (Tailwind) para elementos pequenos · [24px] ·
 * [28px] · [32px] · [40px] · [48px] para cards/painéis maiores. Os valores
 * dentro de FORMATS/SHAPES (ex.: rounded-[22px], rounded-[26px]) são o
 * corte físico real dos produtos (cartão, chaveiro etc.) e não fazem parte
 * dessa escala decorativa — não normalizar.
 * ─────────────────────────────────────────────────────────────────────────
 */

// --- Type definitions ---
// --- Reusable Swipe Indicator ---
/** Mídia do lightbox: carrega na hora (sem lazy), mostra um indicador e cai para a imagem padrão se a trocada falhar. */
function DemoLightboxMedia({ src, fallback, alt }: { src: string; fallback: string; alt: string }) {
  const [current, setCurrent] = useState(src);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setCurrent(src); setLoaded(false); }, [src]);

  if (isVideoUrl(current)) {
    return <video src={current} className="absolute inset-0 w-full h-full object-cover" autoPlay loop controls playsInline />;
  }
  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}
      <img
        key={current}
        ref={(el) => { if (el && el.complete && el.naturalWidth > 0) setLoaded(true); }}
        src={current}
        alt={alt}
        loading="eager"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => { if (current !== fallback) setCurrent(fallback); else setLoaded(true); }}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
}

/** Lightbox da seção "Veja o AirNext em ação". Vai para o <body> (portal) para nunca ficar preso atrás de outra seção. */
function DemoLightbox({ product, resolveImg, onClose }: { product: Product | null; resolveImg: (id: string, fallback: string) => string; onClose: () => void }) {
  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, onClose]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={product.name}
          className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <button onClick={onClose} aria-label="Fechar" className="fixed top-6 right-6 z-[310] w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition text-white">
            <X size={20} />
          </button>
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl aspect-[4/5] sm:aspect-video max-h-[85dvh] rounded-[28px] overflow-hidden bg-zinc-900 shadow-2xl"
          >
            <DemoLightboxMedia src={resolveImg(`demo-${product.id}`, product.img)} fallback={product.img} alt={product.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-black/10 pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 p-6 flex items-center gap-3 pointer-events-none">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${product.color}30`, color: product.color }}>
                {product.icon}
              </div>
              <div>
                <p className="text-white font-bold text-lg leading-tight">{product.name}</p>
                <p className="text-white/70 text-xs mt-0.5">{product.desc}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function SwipeIndicator({ isDark }: { isDark: boolean }) {
  return (
    <div className={`flex items-center justify-center gap-2.5 mt-2 py-4 text-xs font-semibold select-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      <motion.div
        animate={{ x: [-8, 8, -8] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="text-[#0071e3]"
      >
        <ArrowLeft size={14} />
      </motion.div>
      <span>Deslize para navegar</span>
      <motion.div
        animate={{ x: [8, -8, 8] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="text-[#0071e3]"
      >
        <ArrowRight size={14} />
      </motion.div>
    </div>
  );
}

// --- Logo (imagem) --- `dark` = fundo escuro → "Air" branco; senão "Air" escuro.
function Logo({ dark = false, size = 'md' }: { dark?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const h = size === 'lg' ? 'h-8' : size === 'sm' ? 'h-6' : 'h-7';
  return (
    <a href="#top" aria-label="AirNext" className="inline-flex items-center transition-opacity hover:opacity-80">
      <img
        src={dark ? LOGO_ON_DARK : LOGO_ON_LIGHT}
        alt="AirNext"
        width={884}
        height={367}
        decoding="async"
        draggable={false}
        className={`${h} w-auto select-none`}
      />
    </a>
  );
}

// --- Ícone "dois tracinhos" do menu (estilo apple.com) ---
function MenuLines({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M2.5 6h13" />
      <path d="M2.5 12h13" />
    </svg>
  );
}

// --- AirNext product lines & physical formats ---
export interface AirNextFormat {
  id: string;
  label: string;
  icon: React.ReactNode;
  shapeClass: string; // aspect + rounding for the live preview
}

export const FORMATS: AirNextFormat[] = [
  {
    id: 'cartao',
    label: 'Cartão',
    icon: <CreditCard size={16} />,
    shapeClass: 'aspect-[1.586/1] rounded-[22px]',
  },

  {
    id: 'placa',
    label: 'Placa NFC',
    icon: <Square size={16} />,
    shapeClass: 'aspect-[1.586/1] rounded-[22px]',
  },

  {
    id: 'display',
    label: 'Display',
    icon: <RectangleHorizontal size={16} />,
    shapeClass: 'aspect-[1.586/1] rounded-[22px]',
  },

  {
    id: 'tag',
    label: 'Tag',
    icon: <TagIcon size={16} />,
    shapeClass: 'aspect-[3/4] rounded-[28px]',
  },

  {
    id: 'chaveiro',
    label: 'Chaveiro',
    icon: <KeyRound size={16} />,
    shapeClass: 'aspect-square rounded-[26px]',
  },

  {
    id: 'pulseira',
    label: 'Pulseira',
    icon: <Watch size={16} />,
    shapeClass: 'aspect-[3.6/1] rounded-full',
  },

  {
    id: 'adesivo',
    label: 'Adesivo NFC',
    icon: <Nfc size={16} />,
    shapeClass: 'aspect-square rounded-full',
  },
  {
  id: 'cracha',
  label: 'Crachá NFC',
  icon: <IdCard size={16} />,
  shapeClass: 'aspect-[2.8/4.5] rounded-2xl',
  },
];

export interface Product {
  id: string;
  name: string;
  tag: string;
  desc: string;
  longDesc: string;
  price: number;
  img: string;
  color: string;
  icon: React.ReactNode;
  formats: string[]; // ids referencing FORMATS
  specs: string[];
  oldPrice?: number;   // preço "De" (usado em combos/promoções)
  badge?: string;      // selo do card (padrão: "Novo")
  combo?: boolean;     // kit com vários produtos — sem escolha de formato/personalizador
  comboItems?: string[]; // itens incluídos no combo
  gallery?: string[];  // várias fotos (card em rotação + slider no modal)
}

export const PRODUCTS: Product[] = [
  {
    id: 'pro', name: 'AirNext Pro', tag: 'Profissionais', price: 89.9,
    desc: 'Perfil digital para profissionais, autônomos e empreendedores.',
    longDesc: 'Compartilhe seu perfil completo — LinkedIn, portfólio, WhatsApp, Instagram e vCard — com uma simples aproximação. Ideal para quem vive de networking e quer causar impacto em reuniões e eventos.',
    img: NFC_TAG_IMG,
    color: '#0071e3', icon: <Briefcase size={22} />,
    formats: ['cartao'], // todas as categorias disponíveis
    specs: ['Chip NFC', 'QR Code Dinâmico', 'PVC Premium Matte', 'IP65 · À Prova d\'Água', 'Edição ilimitada do perfil'],
  },
  

  {
    id: 'stand', name: 'AirNext Stand', tag: 'Estabelecimentos', price: 129.9,
    desc: 'Centralizador de informações para estabelecimentos.',
    longDesc: 'Recepções, restaurantes e lojas concentram cardápio digital, Wi-Fi, avaliações e formas de pagamento em um único toque. Design minimalista com base antiderrapante para o balcão.',
    img: STAND_GALLERY[0],
    gallery: STAND_GALLERY,
    color: '#34c759', icon: <Building2 size={22} />,
    formats: ['display','placa'], // todas as categorias disponíveis
    specs: ['Base Acrílico Premium', 'Chip NFC', 'QR Code Estático + Dinâmico', 'Avaliações no Google com um toque', 'Dashboard de analytics', 'Personalização com logo'],
  },
  {
    id: 'pet', name: 'AirNext Pet', tag: 'Pets', price: 79.9,
    desc: 'Identificação inteligente para pets.',
    longDesc: 'Se o seu pet se perder, qualquer pessoa pode ler a tag com o celular e ver contatos de emergência, informações de saúde e veterinário. Sem mensalidade, sem bateria.',
    img: PET_THOR_IMG,
    gallery: PET_GALLERY,
    color: '#ff9500', icon: <PawPrint size={22} />,
    formats: [ 'tag', 'chaveiro'], // todas as categorias disponíveis
    specs: ['Acabamento em Resina', 'Chip NFC', 'QR Code Estático + Dinâmico','IP68 · Submersível', 'Argola', 'Dados veterinários e +'],
  },
  {
    id: 'kids', name: 'AirNext Kids', tag: 'Crianças', price: 99.9,
    desc: 'Identificação digital para crianças.',
    longDesc: 'Segurança para crianças em parques, shoppings e eventos. Dados dos pais e contatos de emergência acessíveis por qualquer celular com um simples toque — sem apps.',
    img: 'https://images.pexels.com/photos/5275817/pexels-photo-5275817.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    color: '#af52de', icon: <Baby size={22} />,
    formats: [ 'pulseira'], // todas as categorias disponíveis
    specs: ['Silicone Hipoalergênico', 'Chip NFC', 'Nome e foto de identificação', 'Resistente à água', 'Contato dos responsáveis'],
  },
  {
    id: 'senior', name: 'AirNext Senior', tag: 'Idosos', price: 99.9,
    desc: 'Identificação para idosos.',
    longDesc: 'Tecnologia acessível para idosos. Compartilhe endereço, contato de familiares, plano de saúde e dados médicos essenciais sem precisar de smartphone ou aplicativos.',
    img: 'https://images.pexels.com/photos/7394608/pexels-photo-7394608.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    color: '#ff3b30', icon: <Heart size={22} />,
    formats: [ 'pulseira'], // todas as categorias disponíveis
    specs: ['Dados do plano de saúde','Chip NFC', 'QR Code Estático + Dinâmico', 'Medicações em uso', 'Contato do médico', 'Endereço residencial', 'Leitura sem aplicativo'],
  },
  {
    id: 'tea', name: 'AirNext TEA', tag: 'Espectro Autista', price: 99.9,
    desc: 'Identificação para pessoas com Transtorno do Espectro Autista.',
    longDesc: 'Contém instruções de comunicação, sensibilidades sensoriais, contatos de emergência e dados médicos vitais para auxiliar pessoas no espectro autista em situações de crise.',
    img: 'https://images.pexels.com/photos/8944295/pexels-photo-8944295.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    color: '#00d2ff', icon: <Puzzle size={22} />,
    formats: ['pulseira', 'cracha'], // todas as categorias disponíveis
    specs: ['Instruções de comunicação', 'Chip NFC', 'QR Code Estático + Dinâmico','Sensibilidades sensoriais', 'Contato do cuidador', 'Dados médicos de emergência'],
  },
  {
    id: 'combo', name: 'Combo AirNext Completo', tag: 'Kit · Economize', price: 219.9, oldPrice: 259.7, badge: 'Combo',
    desc: 'Tag + Card Pro + Pulseira NFC juntos por um preço especial.',
    longDesc: 'O kit completo AirNext: o Card Pro para o seu networking, a Tag para chaves, mochila ou bagagem e a Pulseira NFC para ter sua identidade sempre à mão. Três produtos com a mesma identidade digital por um valor muito mais leve do que comprar separado.',
    img: COMBO_KIT_IMG,
    color: '#ff2d55', icon: <Gift size={22} />,
    formats: ['cartao', 'tag', 'pulseira'],
    combo: true,
    comboItems: ['AirNext Card Pro', 'AirNext Tag', 'Pulseira NFC AirNext'],
    specs: ['Card Pro + Tag + Pulseira NFC', 'Um único perfil digital para os três', 'Economia de R$ 39,80 no kit', 'Chip NFC + QR Code em todas as peças', 'Personalização pelo WhatsApp após o pedido'],
  },
  {
    id: 'hubgoogle', name: 'AirNext Hub Google Avaliação', tag: 'Google Avaliações', price: 79.9, badge: 'Em alta',
    desc: 'Plaquinha NFC que leva o cliente direto para avaliar seu negócio no Google.',
    longDesc: 'Um toque e o cliente cai direto na tela de avaliação do seu negócio no Google — sem buscar, sem digitar. Mais avaliações 5 estrelas, melhor posição no Google Maps e mais clientes chegando. Perfeita para balcões, mesas, recepções e caixas.',
    img: HUB_GALLERY[0],
    gallery: HUB_GALLERY,
    color: '#4285f4', icon: <Star size={22} />,
    formats: ['placa', 'display'],
    specs: ['Link direto para avaliação no Google', 'Chip NFC + QR Code de backup', 'Acrílico premium resistente', 'Sem app e sem mensalidade', 'Aumenta suas avaliações e sua reputação'],
  },
  {
    id: 'service', name: 'AirNext Service', tag: 'Estabelecimentos', price: 129.9, badge: 'Novo',
    desc: 'Placa NFC inteligente para hotéis, restaurantes, clínicas, salões, lojas e qualquer negócio.',
    longDesc: 'Com um simples toque, o cliente acessa Wi-Fi, cardápio, serviços, avaliações, localização, regras, contatos e promoções — tudo atualizado em tempo real, sem precisar imprimir materiais. Ideal para hotéis e pousadas, restaurantes e cafés, clínicas, salões, academias, lojas e prestadores de serviço.',
    img: 'https://files.catbox.moe/cuol4c.jpeg',
    color: '#00c2a8', icon: <Store size={22} />,
    formats: ['placa', 'cartao', 'display'],
    specs: ['Wi-Fi, cardápio e catálogo de serviços', 'Solicitação de atendimento e reservas', 'Avaliações e feedback dos clientes', 'Localização, horários e redes sociais', 'Para hotéis, restaurantes, clínicas, lojas e mais'],
  },
  {
    id: 'tag', name: 'AirNext Tag', tag: 'Multiuso', price: 69.9,
    desc: 'Tag NFC universal para bagagens, mochilas, chaves e objetos do dia a dia.',
    longDesc: 'Compacta e resistente, a AirNext Tag identifica qualquer objeto — malas, mochilas, bicicletas, notebooks e muito mais. Quem encontrar aproxima o celular e acessa seus dados de contato na hora, sem precisar instalar nenhum aplicativo.',
    img: 'https://files.catbox.moe/ucabuc.png',
    color: '#eab308', icon: <TagIcon size={22} />,
    formats: [ 'tag' ],
    specs: ['Base Acrílico Premium','Acabamento em Resina','Chip NFC', 'QR Code de backup', 'Resistente à água e riscos', 'Fácil de fixar em qualquer objeto', 'Ideal para bagagens, celulares e inúmeras possibilidades de uso no dia a dia.'],
  },
  {
    id: 'corporate', name: 'AirNext Corporate', tag: 'Empresas', price: 99.9,
    desc: 'Crachás e cartões NFC inteligentes para equipes e colaboradores.',
    longDesc: 'Emita identidade digital para toda a equipe: crachá com NFC, perfil corporativo e dados de contato centralizados — tudo com a marca da sua empresa.',
    img: 'https://files.catbox.moe/m8gpmb.png',
    color: '#5e17eb', icon: <Users size={22} />,
    formats: ['cartao', 'tag', 'chaveiro', 'pulseira', 'adesivo', 'cracha'],
    specs: ['Emissão em lote para equipes', 'Perfil corporativo com marca própria', 'Chip NFC + QR Code', 'Dashboard de gestão'],
  },
  {
    id: 'evento', name: 'AirNext Evento', tag: 'Eventos', price: 0,
    desc: 'Crachás inteligentes para congressos, feiras e eventos.',
    longDesc: 'Participantes trocam contato, acessam a programação com um toque. Ideal para congressos, feiras e eventos corporativos que querem reduzir a fricção.',
    img: 'https://files.catbox.moe/bp85o5.png',
    color: '#ff2d55', icon: <Ticket size={22} />,
    formats: ['cracha', 'display', 'cartao', 'tag', 'chaveiro', 'pulseira', 'adesivo'],
    specs: [ 'Programação e mapa do evento',  'Acesso por NFC + QR Code', 'Perfil digital personalizado', 'Networking sem troca de papel', 'PVC Premium Matte'],
  },
];

// IDs das 6 linhas originais — usados para manter a vitrine principal e o
// carrossel "Veja o AirNext em ação" exatamente como eram, mesmo com os
// novos produtos acima presentes no mesmo array PRODUCTS.
export const ORIGINAL_LINE_IDS = ['pro', 'stand', 'pet', 'kids', 'senior', 'tea'];

const AIRNEXT_WHATSAPP = '5547996287761';

// --- Rastreamento (só carrega depois do consentimento de cookies) ---
// O Google Analytics (G-R0FNB8J98C) agora é instalado no index.html e repassado por lib/analytics.ts.
// Troque o ID do Pixel quando tiver em mãos.
const META_PIXEL_ID = 'SEU_PIXEL_ID_AQUI'; // pegue em business.facebook.com/events_manager > Fontes de dados

function loadMetaPixel(pixelId: string) {
  if ((window as any).fbq || pixelId.includes('AQUI')) return;
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function (...args: any[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  (window as any).fbq('init', pixelId);
  (window as any).fbq('track', 'PageView');
}

/** Avatar do mockup de "Casos de Uso": se a foto externa não carregar, cai para o ícone/iniciais
 *  em vez de mostrar a imagem quebrada. */
function DemoAvatar({ src, alt, fallback }: { src?: string; alt: string; fallback: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <>{fallback}</>;
  return <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}

export default function LandingPage() {
  const { resolve: resolveImg, loading: imagesLoading } = useSiteImages();
  // Começa no modo escuro (preto). Se o visitante alternar o tema, a escolha é lembrada.
  const [isDark, setIsDark] = useState<boolean>(() => {
    try { return localStorage.getItem('airnext-landing-theme') !== 'light'; } catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem('airnext-landing-theme', isDark ? 'dark' : 'light'); } catch { /* ignore */ }
    // Fundo da página e barra do navegador acompanham o tema (evita flash branco nas bordas/overscroll).
    const root = document.documentElement;
    const prevBg = root.style.backgroundColor;
    root.style.backgroundColor = isDark ? '#000000' : '';
    const meta = document.querySelector('meta[name="theme-color"]');
    const prevMeta = meta?.getAttribute('content') ?? null;
    meta?.setAttribute('content', isDark ? '#000000' : (prevMeta ?? '#ffffff'));
    return () => {
      root.style.backgroundColor = prevBg;
      if (meta && prevMeta !== null) meta.setAttribute('content', prevMeta);
    };
  }, [isDark]);
  useFeedbackTheme(isDark);
  // Sacola e pedidos: a MESMA da Loja (StoreContext, persistida no navegador) e a mesma gaveta (SacolaDrawer).
  const store = useStore();
  const cartOpen = store.cartOpen;
  const setCartOpen = (open: boolean) => (open ? store.openCart() : store.closeCart());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalFormatId, setModalFormatId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  // Posição vertical da navbar no mobile: começa logo abaixo da faixa de aviso e
  // "gruda" no topo (top: 0) quando a faixa sai da tela — igual ao apple.com.
  const [navTop, setNavTop] = useState(0);

  // Feedbacks publicados no Admin (com os depoimentos de exemplo como reserva)
  const { feedbacks: pubFeedbacks, settings: fbSettings } = usePublicFeedbacks();
  const testimonialsList = useMemo(() => {
    return pubFeedbacks.map(f => ({
      name: f.name || 'Cliente AirNext',
      role: f.role || '',
      text: f.comment || '',
      avatar: (f.name || 'AN').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase(),
      photo: f.photo_url || '',
      rating: f.rating,
    }));
  }, [pubFeedbacks]);
  const fbAvg = pubFeedbacks.length ? pubFeedbacks.reduce((a, f) => a + f.rating, 0) / pubFeedbacks.length : 0;

  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [b2bStatus, setB2bStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [activeEveryone, setActiveEveryone] = useState(0);
  const [cookieBannerVisible, setCookieBannerVisible] = useState(false);
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  const [cookiePrefs, setCookiePrefs] = useState({ analytics: true, marketing: true });

  // Search overlay state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Overlay body-scroll lock (mobile drawer + cart + search) ---
  // `overflow:hidden` on <body> alone does NOT reliably stop background
  // scrolling on iOS Safari — the page can still rubber-band, and because
  // Safari recalculates the visual viewport as the address bar collapses,
  // fixed-position elements can end up misaligned with where touches are
  // actually registered. The end result looks exactly like "an invisible
  // element swallowing every tap": buttons are visually in one place, but
  // touches land on stale coordinates and nothing responds until reload.
  // The fix that actually works on iOS is to pin the body in place with
  // `position: fixed` (freezing layout scroll) and restore the exact
  // scroll offset when the overlay closes.
  const anyOverlayOpen = mobileOpen || cartOpen || searchOpen;
  useEffect(() => {
    if (!anyOverlayOpen) return;

    const scrollY = window.scrollY;
    const startPath = window.location.pathname;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMobileOpen(false);
      setCartOpen(false);
      setSearchOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      // Instantâneo: com scroll-behavior:smooth no <html> o scrollTo animava a página de 0 até aqui
      // ("o site subindo") e brigava com a rolagem até a seção escolhida no menu. E se o menu levou a
      // outra página (login etc.), não devolvemos o scroll da página antiga para a nova.
      if (window.location.pathname === startPath) {
        window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' as ScrollBehavior });
      }
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [anyOverlayOpen]);

  // Use Case Tab State
  const [activeUseCase, setActiveUseCase] = useState(0);

  // "Veja como funciona na prática" — lightbox de imagem/vídeo, sem levar para produtos
  const [demoLightbox, setDemoLightbox] = useState<Product | null>(null);

  useEffect(() => {
    const h = () => {
      // Menu/sacola/busca abertos: o <body> está travado e window.scrollY vira 0 — ignorar,
      // senão a barra de navegação e o progresso "pulam" enquanto o menu está aberto.
      if (document.body.style.position === 'fixed') return;
      setScrolled(window.scrollY > 30);
      const annH = document.getElementById('announce-bar')?.offsetHeight ?? 0;
      setNavTop(Math.max(0, annH - window.scrollY));
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
      setScrollProgress(scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0);
    };
    h(); // set initial value on mount
    window.addEventListener('scroll', h, { passive: true });
    window.addEventListener('resize', h);
    return () => {
      window.removeEventListener('scroll', h);
      window.removeEventListener('resize', h);
    };
  }, []);


  // ── Scroll reveal suave nas seções ──────────────────────────────────────
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sections = Array.from(document.querySelectorAll('main > section'));
    if (!sections.length) return;

    if (reduce) {
      sections.forEach((el) => el.classList.add('scroll-reveal-visible'));
      return;
    }

    sections.forEach((el) => {
      if (el.id === 'top') {
        el.classList.add('scroll-reveal-visible');
        return;
      }
      el.classList.add('scroll-reveal');
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-reveal-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    sections.forEach((el) => {
      if (el.id !== 'top') io.observe(el);
    });

    const cards = document.querySelectorAll(
      'main section .grid > *, main section [data-reveal]'
    );
    cards.forEach((el, i) => {
      if (el.closest('#top')) return;
      el.classList.add('scroll-reveal');
      el.classList.add('scroll-reveal-delay-' + ((i % 4) + 1));
    });
    const ioCards = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-reveal-visible');
            ioCards.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -5% 0px' }
    );
    cards.forEach((el) => {
      if (!el.closest('#top')) ioCards.observe(el);
    });

    return () => {
      io.disconnect();
      ioCards.disconnect();
    };
  }, []);

  // --- Consentimento de Cookies (LGPD) ---
  useEffect(() => {
    // Sem escolha salva, o banner entra no 1º toque/rolagem/tecla ou após 12 s — e não junto com o 1º desenho,
    // senão ele vira o "maior elemento" da tela e atrasa o LCP. Nada é gravado/enviado antes do aceite
    // (Consent Mode do Google em "negado" e Meta Pixel só carrega após consentir), então isso não afeta a LGPD.
    let cleanup: (() => void) | undefined;
    const showBannerLater = () => {
      const events = ['scroll', 'pointerdown', 'keydown', 'touchstart'];
      let timer = 0;
      const stop = () => {
        window.clearTimeout(timer);
        events.forEach((e) => window.removeEventListener(e, show));
      };
      const show = () => { stop(); setCookieBannerVisible(true); };
      events.forEach((e) => window.addEventListener(e, show, { passive: true }));
      timer = window.setTimeout(show, 12000);
      cleanup = stop;
    };
    const stored = localStorage.getItem('airnext_cookie_consent');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCookiePrefs(parsed);
        if (parsed.marketing) loadMetaPixel(META_PIXEL_ID);
      } catch {
        showBannerLater();
      }
    } else {
      showBannerLater();
    }
    return () => cleanup?.();
  }, []);

  const saveCookieConsent = (prefs: { analytics: boolean; marketing: boolean }) => {
    localStorage.setItem('airnext_cookie_consent', JSON.stringify(prefs));
    setCookiePrefs(prefs);
    setCookieBannerVisible(false);
    setCookieSettingsOpen(false);
    setAnalyticsConsent(prefs);
    if (prefs.marketing) loadMetaPixel(META_PIXEL_ID);
  };

  const acceptAllCookies = () => saveCookieConsent({ analytics: true, marketing: true });
  const rejectNonEssentialCookies = () => saveCookieConsent({ analytics: false, marketing: false });

  // Envia o formulário B2B via Web3Forms — sem backend próprio.
  // Troque WEB3FORMS_ACCESS_KEY pela chave gerada em https://web3forms.com
  // usando o e-mail 0800suport@gmail.com (é grátis e instantâneo).
  const handleB2bSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setB2bStatus('sending');
    const form = e.currentTarget;
    const data = new FormData(form);
    data.append('access_key', 'f7bf8696-162e-442f-8250-d0c16c4bfadd');
    data.append('subject', 'Nova proposta B2B — AirNext');
    data.append('to', '0800suport@gmail.com');

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (result.success) {
        setB2bStatus('success');
        form.reset();
      } else {
        setB2bStatus('error');
      }
    } catch {
      setB2bStatus('error');
    }
  };

  // Ir para uma seção a partir do menu mobile. Com o menu aberto o <body> fica travado
  // (position: fixed); se deixássemos o link nativo agir, o scroll seria restaurado logo depois
  // e a página não andava. Então fechamos o menu e só rolamos depois do destravamento.
  const goToSection = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setMobileOpen(false);
    // Dois quadros + folga: o React precisa destravar o <body> e devolver o scroll antes de rolarmos.
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.setTimeout(() => {
      const el = document.getElementById(href.replace('#', ''));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        try { window.history.replaceState(window.history.state, '', href); } catch { /* ignore */ }
      }
    }, 60)));
  };

  const links = [
    { label: 'Produtos', href: '#destaques' },
    { label: 'Funcionalidades', href: '#funcionalidades' },
    { label: 'Galeria', href: '#galeria' },
    { label: 'Casos', href: '#casos-uso' },
    { label: 'Segurança', href: '#seguranca' },
    { label: 'Inclusão', href: '#para-todos' },
    { label: 'Sobre', href: '#quem-somos' },
    { label: 'Empresas', href: '#b2b' },
    { label: 'Suporte', href: '#ajuda' },
  ];

  const addToCart = (product: Product, formatId?: string) => store.add(product, formatId);

  // Vindo da página "Saiba mais" (/produto/:id): ?comprar=ID adiciona à sacola e ?personalizar=ID abre o personalizador.
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const buyId = params.get('comprar');
    const customId = params.get('personalizar');
    if (!buyId && !customId) return;
    navigate({ pathname: '/', search: '' }, { replace: true });
    if (buyId) {
      const prod = PRODUCTS.find(x => x.id === buyId);
      if (prod) { if (prod.price > 0) addToCart(prod); else setSelectedProduct(prod); }
    } else if (customId) {
      const prod = PRODUCTS.find(x => x.id === customId);
      if (prod) setSelectedProduct(prod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const everyoneData = [
    {
      id: 'tea',
      label: 'Autistas',
      icon: <Puzzle size={18} />,
      title: 'Segurança & Comunicação Assistida',
      text: 'A identificação inteligente AirNext pode armazenar informações médicas cruciais, contatos de emergência e instruções de comunicação para auxiliar pessoas no espectro autista em situações de crise ou desconforto. Basta aproximar um smartphone compatível com NFC para acessar os dados instantaneamente.',
      howTo: 'Após a compra, você recebe um código de ativação exclusivo. Basta ativar escolher sua categoria AirNext, configurar o perfil e preencher as informações que deseja compartilhar. Qualquer smartphone compatível com NFC pode acessar o perfil com um simples toque, sem necessidade de instalar aplicativos.',
      img: 'https://images.pexels.com/photos/8944295/pexels-photo-8944295.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    },
    {
      id: 'kids',
      label: 'Kids',
      icon: <Baby size={18} />,
      title: 'Proteção Inteligente para Crianças',
      text: 'Pulseiras AirNext para crianças que permitem que pais sejam localizados rapidamente se os pequenos se perderem em parques, shoppings ou eventos. Quem encontrar a criança acessa os dados dos pais com um toque no celular.',
      howTo: 'Configure o perfil com nome da criança, foto dos pais, telefone e endereço. Coloque a pulseira e pronto — segurança ativada.',
      img: 'https://images.pexels.com/photos/5275817/pexels-photo-5275817.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    },
    {
      id: 'senior',
      label: 'Sênior',
      icon: <Heart size={18} />,
      title: 'Independência Assistida para Idosos',
      text: 'Facilidade para idosos compartilharem contatos e endereços sem precisar decorar números ou navegar em aplicativos complexos. Dados médicos de emergência, alergias e medicamentos sempre acessíveis.',
      howTo: 'Preencha as informações de emergência no seu perfil AirNext e utilize o dispositivo de identificação da forma que preferir. Com um simples toque de um smartphone compatível com NFC, os dados ficam disponíveis instantaneamente.',
      img: 'https://images.pexels.com/photos/7394608/pexels-photo-7394608.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    },
    {
      id: 'business',
      label: 'Business',
      icon: <Briefcase size={18} />,
      title: 'Networking de Elite para Profissionais',
      text: 'Para profissionais que buscam impressionar. Feche negócios mais rápido com troca instantânea de portfólio, vCard, LinkedIn e redes sociais. Sem papel, sem digitação, sem erro.',
      howTo: 'Personalize seu cartão AirNext Pro com nome e logo. Aproxime do celular do cliente e tudo é compartilhado em 1 segundo.',
      img: 'https://images.pexels.com/photos/7413999/pexels-photo-7413999.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    },
  ];

  // Use Cases details for simulator
  const useCaseScenarios = [
    {
      title: 'Networking no Evento',
      shortTitle: 'Networking',
      icon: <Briefcase size={24} className="text-blue-300" />,
      desc: 'Compartilhe seu portfólio, LinkedIn, e-mail e contato direto para a agenda do cliente.',
      screen: {
        bg: 'linear-gradient(135deg, #0f172a, #1e293b)',
        avatarBg: 'linear-gradient(135deg, #3b82f6, #22c55e)',
        photo: 'https://marketplace.canva.com/R2ujw/MAG5zbR2ujw/1/tl/canva-retrato-de-uma-mulher-elegante-com-blusa-de-gola-alta-preta-MAG5zbR2ujw.jpg',
        title: 'Ana Souza',
        subtitle: 'Product Designer · São Paulo',
        items: [
          { label: 'WhatsApp', val: '(11) 98765-4321', color: 'bg-green-500/20 text-green-300', icon: <Phone size={14} /> },
          { label: 'LinkedIn', val: 'linkedin.com/in/anasouza', color: 'bg-blue-500/20 text-blue-300', icon: <Globe size={14} /> },
          { label: 'Instagram', val: '@ana.design', color: 'bg-emerald-500/20 text-emerald-300', icon: <Camera size={14} /> }
        ],
        btn: 'Adicionar aos Contatos'
      }
    },
    {
      title: 'Pet Perdido na Rua',
      shortTitle: 'Segurança Pet',
      icon: <Heart size={24} className="text-rose-300" />,
      desc: 'Se o seu pet fugir, quem encontrá-lo pode ler a tag e ligar diretamente para você.',
      screen: {
        bg: 'linear-gradient(135deg, #052e16, #14532d)',
        avatarBg: 'linear-gradient(135deg, #22c55e, #059669)',
        photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop',
        title: 'Fred',
        subtitle: 'Macho · Golden Retriever · 3 anos',
        items: [
          { label: 'Dono', val: 'Roberto Souza', color: 'bg-white/10 text-white', icon: <UserRound size={14} /> },
          { label: 'Telefone', val: '(11) 99999-8888', color: 'bg-emerald-500/20 text-emerald-300', icon: <Phone size={14} /> },
          { label: 'Clínica Vet', val: 'VetCare Jardins', color: 'bg-white/10 text-white', icon: <Building2 size={14} /> }
        ],
        btn: 'Ligar para o Dono'
      }
    },
    {
      title: 'Mesa de Restaurante',
      shortTitle: 'Cardápio Digital',
      icon: <QrCode size={24} className="text-amber-300" />,
      desc: 'Centraliza cardápio digital, senha do Wi-Fi e demais informações da casa em um único toque — sem precisar chamar o garçom para perguntar.',
      screen: {
        bg: 'linear-gradient(135deg, #7c2d12, #451a03)',
        avatarBg: 'linear-gradient(135deg, #f59e0b, #b45309)',
        // Sem foto externa: o avatar do restaurante é o ícone (nunca quebra se um site de imagens sair do ar).
        avatarIcon: <Utensils size={34} className="text-white" />,
        title: 'Bistro Paris',
        subtitle: 'Mesa 14 · Informações da casa',
        items: [
          { label: 'Wi-Fi da Casa', val: 'Senha: bistropass', color: 'bg-amber-500/20 text-amber-300', icon: <Wifi size={14} /> },
          { label: 'Cardápio Digital', val: 'Ver menu completo', color: 'bg-white/10 text-white', icon: <BookOpen size={14} /> },
          { label: 'Avaliar a Casa', val: 'Deixe sua avaliação', color: 'bg-white/10 text-white', icon: <Star size={14} /> }
        ],
        btn: 'Abrir Cardápio Digital'
      }
    },
    {
      title: 'Emergência de Saúde',
      shortTitle: 'Saúde & SOS',
      icon: <Shield size={24} className="text-red-300" />,
      desc: 'Pulseiras de identificação com dados médicos cruciais, tipo sanguíneo e alergias.',
      screen: {
        bg: 'linear-gradient(135deg, #7f1d1d, #450a0a)',
        avatarBg: 'linear-gradient(135deg, #ef4444, #b91c1c)',
        photo: 'https://images.pexels.com/photos/13936039/pexels-photo-13936039.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
        title: 'João Carlos',
        subtitle: 'Ficha médica de emergência',
        items: [
          { label: 'Tipo Sanguíneo', val: 'O Positivo (O+)', color: 'bg-red-500/20 text-red-300', icon: <Droplets size={14} /> },
          { label: 'Alergias', val: 'Penicilina, Glúten', color: 'bg-red-500/20 text-red-300', icon: <AlertTriangle size={14} /> },
          { label: 'Contato SOS', val: 'Esposa: (11) 97777-6666', color: 'bg-white/10 text-white', icon: <Phone size={14} /> }
        ],
        btn: 'Contato de Emergência'
      }
    }
  ];

  // Iniciais para o "avatar de perfil" do mockup — ex: "Ana Souza" -> "AS"
  const getInitials = (name: string) =>
    name.replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || 'AN';

  // Filtered products for search
  const filteredProducts = searchQuery
    ? PRODUCTS.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.tag.toLowerCase().includes(searchQuery.toLowerCase()))
    : PRODUCTS;

  return (
    <div className={`min-h-[100dvh] overflow-x-clip transition-colors duration-500 antialiased ${isDark ? 'bg-[#050505] text-white' : 'bg-[#fbfbfd] text-gray-900'}`}>

      {/* A fonte da marca (Lobster) é carregada uma única vez, sem bloquear a renderização, em main.tsx. */}

      {/* Ajustes globais e elegantes para os indicadores (bullets) de todos os carrosséis do site —
          ficam sempre abaixo dos blocos, nunca sobrepondo conteúdo. */}
      <style>{`
        .swiper { padding-bottom: 8px !important; }
        .swiper-pagination { position: static !important; margin-top: 22px; display: flex !important; align-items: center; justify-content: center; gap: 6px; }
        .swiper-pagination-bullet { width: 5px; height: 5px; margin: 0 !important; background: rgba(128,128,136,0.45); opacity: 1; border-radius: 9999px; transition: all .25s ease; }
        .swiper-pagination-bullet-active { width: 18px; border-radius: 9999px; background: #0071e3; }
      `}</style>
      
      {/* --- Scroll-driven Progress bar --- */}
      <div className="fixed top-0 left-0 h-[3px] z-[60] rounded-r-full bg-blue-500 transition-[width] duration-150 ease-out" style={{ width: `${scrollProgress}%` }} />

      {/* --- Navbar ---
          Mobile (< md): barra compacta, fixa no topo, escura e translúcida (estilo apple.com) com 4 ações:
          busca · sacola · login · menu (dois tracinhos). O alternador de tema fica dentro do menu.
          Desktop (>= md): mantém a barra flutuante arredondada original. */}
      <nav
        style={{ ['--nav-top' as string]: `${navTop}px` }}
        className={`fixed z-50 inset-x-0 top-[var(--nav-top)] md:top-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[95%] md:max-w-7xl transition-[background-color,box-shadow,border-color] duration-300 group/nav
          bg-black/90 backdrop-blur-xl border-b border-white/10 pt-[env(safe-area-inset-top)] md:pt-0 md:border-b-0 md:rounded-full md:border ${
          scrolled
            ? `${isDark ? 'md:bg-[#0a0a0a]/80 md:border-white/10' : 'md:bg-white/80 md:border-gray-200/70'} md:backdrop-blur-2xl md:shadow-md`
            : `${isDark ? 'md:bg-white/[0.04] md:border-white/10' : 'md:bg-white/50 md:border-gray-200/40'} md:backdrop-blur-md`
        }`}
      >
        <div className="relative px-4 md:px-6 h-[52px] md:h-[68px] flex items-center justify-between gap-3 md:gap-4">
          {/* Logo: no mobile a barra é sempre escura, então o "Air" fica branco */}
          <span className="md:hidden relative top-[3px]"><Logo size="sm" dark /></span>
          <span className="hidden md:block relative top-[3px]"><Logo size="md" dark={isDark} /></span>

          {/* Center nav links with animated underline on hover */}
          <div className="hidden xl:flex items-center gap-1">
            <Link
              to="/loja"
              className="relative mr-1 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0071e3] px-4 text-[12.5px] font-semibold tracking-tight text-white shadow-[0_6px_16px_-8px_rgba(0,113,227,0.9)] transition duration-200 hover:-translate-y-px hover:bg-[#0077ed] active:translate-y-0 active:scale-95"
            >
              <ShoppingBag size={14} aria-hidden="true" /> Loja
            </Link>
            {links.map(l => (
              <a
                key={l.label}
                href={l.href}
                onClick={(e) => goToSection(e, l.href)}
                className={`relative px-3.5 py-2 text-[12.5px] font-semibold tracking-tight rounded-full transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white hover:bg-white/[0.06]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-900/[0.04]'
                }`}
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-0.5 md:gap-2 flex-shrink-0">
            {/* Tema claro/escuro — só no desktop (no mobile fica dentro do menu) */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-all flex-shrink-0 ${
                isDark ? 'bg-white/[0.06] border-white/10 text-yellow-300 hover:bg-white/10' : 'bg-gray-900/[0.04] border-gray-200 text-gray-700 hover:bg-gray-900/[0.08]'
              }`}
              aria-label="Alternar tema"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Loja — atalho sempre visível a partir do tablet */}
            <Link
              to="/loja"
              className="hidden md:inline-flex xl:hidden items-center gap-1.5 h-9 px-4 rounded-full bg-[#0071e3] text-white text-xs font-semibold shadow-[0_6px_16px_-8px_rgba(0,113,227,0.9)] hover:bg-[#0077ed] hover:-translate-y-px active:translate-y-0 active:scale-95 transition duration-200 flex-shrink-0"
            >
              <ShoppingBag size={14} /> Loja
            </Link>

            {/* Busca */}
            <button onClick={() => setSearchOpen(true)} className={`flex-shrink-0 p-2.5 rounded-full transition-all text-white/90 active:bg-white/10 ${isDark ? 'md:text-gray-300 md:hover:bg-white/10' : 'md:text-gray-700 md:hover:bg-gray-900/[0.06]'}`} aria-label="Buscar">
              <Search size={18} />
            </button>

            {/* Sacola */}
            <button onClick={() => setCartOpen(true)} className={`relative flex-shrink-0 p-2.5 rounded-full transition-all text-white/90 active:bg-white/10 ${isDark ? 'md:text-gray-300 md:hover:bg-white/10' : 'md:text-gray-700 md:hover:bg-gray-900/[0.06]'}`} aria-label="Sacola">
              <ShoppingBag size={18} />
              {store.count > 0 && (
                <span className="absolute top-1 right-1 bg-[#0071e3] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {store.count}
                </span>
              )}
            </button>

            {/* Login */}
            <Link
              to="/login"
              title="Login"
              aria-label="Login"
              className={`flex-shrink-0 p-2.5 rounded-full transition-all text-white/90 active:bg-white/10 ${isDark ? 'md:text-gray-300 md:hover:bg-white/10' : 'md:text-gray-700 md:hover:bg-gray-900/[0.06]'}`}
            >
              <UserRound size={18} />
            </Link>

            {/* Divider */}
            <div className={`hidden md:block w-px h-6 mx-0.5 flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

            {/* Menu (dois tracinhos) */}
            <button onClick={() => setMobileOpen(true)} className={`xl:hidden flex-shrink-0 p-2.5 md:w-10 md:h-10 md:p-0 rounded-full flex items-center justify-center transition-all text-white/90 active:bg-white/10 ${isDark ? 'md:bg-white/[0.08] md:text-white md:hover:bg-white/[0.14]' : 'md:bg-gray-900/[0.06] md:text-gray-900 md:hover:bg-gray-900/[0.1]'}`} aria-label="Abrir menu">
              <MenuLines size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`absolute bottom-0 inset-x-0 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#121212] text-white' : 'bg-white text-gray-900'} rounded-t-[32px] p-6 pb-12 shadow-2xl`}
            >
              <div className="flex items-center justify-between mb-4 -mt-1 py-2">
                <div className="w-10 opacity-0" /> {/* Spacer for centering */}
                <div className={`w-12 h-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded-full`} />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fechar menu"
                  className={`p-2 rounded-full transition ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Dark / Light Mode Toggle — também disponível aqui no menu mobile, não só na navbar */}
              <button
                onClick={() => setIsDark(!isDark)}
                className={`w-full mb-3 flex items-center justify-between px-4 py-3 rounded-2xl border transition ${
                  isDark ? 'bg-white/[0.06] border-white/10 text-white' : 'bg-gray-900/[0.04] border-gray-200 text-gray-900'
                }`}
              >
                <span className="text-sm font-semibold flex items-center gap-2">
                  {isDark ? <Sun size={16} className="text-yellow-300" /> : <Moon size={16} />}
                  Modo {isDark ? 'Claro' : 'Escuro'}
                </span>
                <span className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition ${isDark ? 'bg-[#0071e3]' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
                </span>
              </button>

              <Link
                to="/loja"
                onClick={() => setMobileOpen(false)}
                className="w-full mb-3 py-3.5 rounded-full text-center font-semibold flex items-center justify-center gap-2 bg-[#0071e3] text-white active:scale-[0.98] transition"
              >
                <ShoppingBag size={16} /> Ir para a Loja
              </Link>

              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto px-2 no-scrollbar">
                {links.map(l => (
                  <a key={l.label} href={l.href} onClick={(e) => goToSection(e, l.href)} className={`text-lg font-semibold py-3 border-b ${isDark ? 'border-white/10 text-white' : 'border-gray-100 text-gray-900'} flex items-center justify-between`}>
                    {l.label} <ChevronRight size={18} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                  </a>
                ))}
              </div>
              <div className="px-2 flex flex-col gap-3">
                <Link to="/loja" onClick={() => setMobileOpen(false)} className={`mt-6 w-full py-4 rounded-full text-center font-semibold flex items-center justify-center gap-2 ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                  <ShoppingBag size={16} /> Comprar Agora
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className={`w-full py-4 rounded-full text-center font-semibold flex items-center justify-center gap-2 border ${
                    isDark ? 'border-white/20 text-white' : 'border-gray-300 text-gray-900'
                  }`}
                >
                  <UserRound size={16} /> Login
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 z-[100] ${isDark ? 'bg-[#050505] text-white' : 'bg-white text-gray-900'} overflow-y-auto p-6 md:p-12`}>
            <div className="max-w-4xl mx-auto">
              <div className={`flex items-center justify-between pb-6 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} mb-8`}>
                <div className="flex items-center gap-3 w-full max-w-lg">
                  <Search size={20} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                  <input aria-label="Buscar produtos"
                    autoFocus
                    type="text"
                    placeholder="O que você está procurando?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-lg font-medium bg-transparent border-none focus:outline-none"
                  />
                </div>
                <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className={`p-2 rounded-full transition ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}>
                  <X size={20} />
                </button>
              </div>

              {searchQuery && (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(p => (
                      <div key={p.id} onClick={() => { setSelectedProduct(p); setSearchOpen(false); }} className={`${isDark ? 'bg-[#121212] border-white/5' : 'bg-gray-50 border-gray-100'} border rounded-3xl p-4 cursor-pointer hover:shadow-lg transition`}>
                        <img loading="lazy" decoding="async" src={resolveImg(`search-${p.id}`, p.img)} alt={p.name} className="w-full aspect-[4/3] rounded-2xl object-cover mb-4" />
                        <h4 className="font-bold text-sm">{p.name}</h4>
                        <p className="text-xs text-gray-400 mt-1">{p.desc}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">Nenhum produto encontrado.</div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sacola e pedidos — mesma da Loja */}
      <SacolaDrawer isDark={isDark} lockScroll={false} />

      <main>
        {/* --- Hero: palco 3D com scroll (celular se aproxima da tag NFC) --- */}
        <HeroScroll3D isDark={isDark} />

        {/* --- Destaques: slider estilo Apple (imagem do produto + descrição + Saiba mais / Comprar) --- */}
        <section id="destaques" className="bg-white text-[#1d1d1f] pt-14 md:pt-20 pb-8 md:pb-12">
          <div className="max-w-[1400px] mx-auto px-5 md:px-6 mb-6 md:mb-8">
            <h2 className="text-[28px] md:text-5xl font-bold tracking-tight leading-tight">
              Produtos em destaque. <span className="text-[#6e6e73]">Escolha o seu.</span>
            </h2>
          </div>
          <LazyOnView id="destaques-slide" minHeight={640}>
          <ProductShowcase
            products={['hubgoogle', 'stand', 'pet', 'tag', 'pro']
              .map(id => PRODUCTS.find(x => x.id === id)!)
              .filter(Boolean)}
            getImage={(sp) => productImage(sp, resolveImg, ORIGINAL_LINE_IDS.includes(sp.id))}
            onBuy={(sp) => {
              const prod = PRODUCTS.find(x => x.id === sp.id);
              if (!prod) return;
              if (prod.price > 0) addToCart(prod); else setSelectedProduct(prod);
            }}
          />
          </LazyOnView>
          <div className="mt-8 md:mt-10 flex justify-center px-5">
            <Link
              to="/loja"
              className="group relative inline-flex h-[52px] items-center gap-2 overflow-hidden rounded-full border border-white/15 bg-black/75 px-8 text-[16px] font-semibold text-white shadow-[0_12px_32px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl transition duration-300 hover:bg-black/90 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.25)] active:scale-95"
            >
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent" />
              <span className="relative">Descubra mais</span>
              <svg className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
        </section>

        {/* --- Demo Carousel: AirNext em ação por linha de produto --- */}
        <LazyOnView id="demos" minHeight={900}>
        {((isDark: boolean) => (
        <section id="demos" className={`py-20 md:py-28 transition-colors duration-500 ${isDark ? 'bg-[#050505] text-white' : 'bg-white text-gray-900'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="eyebrow text-[#0071e3] mb-3">Veja Como Funciona na Prática</p>
              <h2 className="h2-apple mb-4">Veja o AirNext em ação.</h2>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'} max-w-2xl mx-auto`}>
                Um vislumbre real de como cada linha AirNext resolve um problema do dia a dia — foto ou vídeo, sem compromisso.
              </p>
            </div>

            <Swiper
              modules={[Pagination]}
              spaceBetween={20}
              slidesPerView={1.15}
              pagination={{ clickable: true }}
              breakpoints={{ 640: { slidesPerView: 2.2 }, 1024: { slidesPerView: 3.2 } }}
              className="pb-10"
            >
              {PRODUCTS.filter(p => ORIGINAL_LINE_IDS.includes(p.id)).map(p => {
                const demoSrc = resolveImg(`demo-${p.id}`, p.img);
                const demoIsVideo = isVideoUrl(demoSrc);
                return (
                <SwiperSlide key={p.id}>
                  <button
                    onClick={() => setDemoLightbox(p)}
                    className="group relative w-full aspect-[4/5] rounded-[28px] overflow-hidden block text-left"
                  >
                    {imagesLoading ? (
                      <div className="absolute inset-0 bg-white/5 animate-pulse" />
                    ) : demoIsVideo ? (
                      <video src={demoSrc} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" muted loop playsInline autoPlay />
                    ) : (
                      <img loading="lazy" decoding="async" src={demoSrc} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      
                    </div>
                    <div className="absolute bottom-0 inset-x-0 p-6">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${p.color}30`, color: p.color }}>
                        {p.icon}
                      </div>
                      <p className="text-white font-bold text-base leading-tight">{p.name}</p>
                      <p className="text-white/70 text-xs mt-1 leading-relaxed">{p.desc}</p>
                    </div>
                  </button>
                </SwiperSlide>
                );
              })}
            </Swiper>
            <SwipeIndicator isDark={isDark} />
          </div>

          {/* Lightbox — só imagem/vídeo, sem CTA de compra: esta seção é só demonstração */}
          <DemoLightbox product={demoLightbox} resolveImg={resolveImg} onClose={() => setDemoLightbox(null)} />
        </section>
        ))(false)}
        </LazyOnView>

        {/* --- Plaquinhas de avaliação Google (em alta) --- */}
        <LazyOnView id="plaquinhas-google"><GooglePlaquesSection
          isDark={isDark}
          whatsapp={AIRNEXT_WHATSAPP}
          onBuy={() => { const hub = PRODUCTS.find(x => x.id === 'hubgoogle'); if (hub) setSelectedProduct(hub); }}
        /></LazyOnView>

        {/* --- AirNext Stand: propósito, avaliações Google e integrações --- */}
        <LazyOnView id="stand"><StandStorySection
          whatsapp={AIRNEXT_WHATSAPP}
          onBuy={() => { const st = PRODUCTS.find(x => x.id === 'stand'); if (st) setSelectedProduct(st); }}
        /></LazyOnView>

        {/* --- AirNext Pet: coleira inteligente, identificação digital e Modo SOS --- */}
        <LazyOnView id="coleira-pet"><PetStorySection
          whatsapp={AIRNEXT_WHATSAPP}
          image={PRODUCTS.find(x => x.id === 'pet')?.img ?? ''}
          onBuy={() => { const pt = PRODUCTS.find(x => x.id === 'pet'); if (pt) setSelectedProduct(pt); }}
        /></LazyOnView>

        {/* --- AirNext Tag: demonstração interativa --- */}
        <LazyOnView id="airnext-tag"><TagShowcaseSection whatsapp={AIRNEXT_WHATSAPP} onBuy={() => { const tg = PRODUCTS.find(x => x.id === 'tag'); if (tg) setSelectedProduct(tg); }}
        /></LazyOnView>

        {/* --- Destaques + motivos para comprar (estilo apple.com) --- */}
        <LazyOnView id="destaques-airnext" minHeight={900}><AirNextHighlightsSection
          whatsapp={AIRNEXT_WHATSAPP}
          videoSrc={resolveImg('video-demo', 'https://assets.mixkit.co/videos/preview/mixkit-network-connection-lines-and-dots-31580-large.mp4')}
        /></LazyOnView>

        <AnimatePresence>
            {selectedProduct && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 z-[100] ${isDark ? 'bg-[#050505] text-white' : 'bg-white text-gray-900'} overflow-y-auto`}
              >
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 40, opacity: 0 }}
                  transition={{ duration: .4 }}
                >
                  <button onClick={() => setSelectedProduct(null)} className={`fixed top-6 right-6 z-[110] w-12 h-12 ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} backdrop-blur-md rounded-full flex items-center justify-center transition`}>
                    <X size={20} />
                  </button>

                  {selectedProduct.gallery || selectedProduct.combo ? (
                    <ProductHero
                      key={selectedProduct.id}
                      images={selectedProduct.gallery ?? [selectedProduct.img]}
                      name={selectedProduct.name}
                      isDark={isDark}
                    />
                  ) : (
                    <div className="w-full h-[50vh] md:h-[60vh] relative overflow-hidden">
                      <img loading="lazy" decoding="async" src={resolveImg(`modal-${selectedProduct.id}`, selectedProduct.img)} alt={selectedProduct.name} className="w-full h-full object-cover" />
                      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#050505]' : 'from-white'} via-transparent to-transparent`} />
                      <div className="pointer-events-none absolute top-6 left-6 z-10 flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/45 backdrop-blur-sm text-white">
                        <Nfc size={13} />
                        <span style={{ fontFamily: "'Lobster', cursive" }} className="text-xs tracking-wide leading-none translate-y-[1px]">AirNext</span>
                      </div>
                    </div>
                  )}

                  <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10 pb-20">
                    <span className="eyebrow mb-3 block" style={{ color: selectedProduct.color }}>{selectedProduct.tag}</span>
                    <h2 className="h1-apple mb-4">{selectedProduct.name}</h2>
                    <p className="text-3xl font-bold mb-8">
                      {priceLabel(selectedProduct.price)}
                      {selectedProduct.oldPrice && (
                        <>
                          <span className={`ml-3 text-lg font-medium line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>R$ {fmtPrice(selectedProduct.oldPrice)}</span>
                          <span className="ml-3 align-middle text-xs font-bold px-2.5 py-1 rounded-full bg-[#ff2d55] text-white">Economize R$ {fmtPrice(selectedProduct.oldPrice - selectedProduct.price)}</span>
                        </>
                      )}
                    </p>
                    <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-8 leading-relaxed max-w-2xl`}>{selectedProduct.longDesc}</p>

                    {/* Itens do combo */}
                    {selectedProduct.combo && (
                      <div className="mb-10">
                        <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>O que vem no combo</p>
                        <div className="flex flex-wrap gap-3">
                          {selectedProduct.comboItems?.map((it, idx) => (
                            <span key={it} className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold ${isDark ? 'border-white/15 text-gray-200' : 'border-gray-200 text-gray-800'}`}>
                              {idx === 0 ? <CreditCard size={16} /> : idx === 1 ? <TagIcon size={16} /> : <Watch size={16} />} {it}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Format picker */}
                    {!selectedProduct.combo && (
                    <div className="mb-10">
                      <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Escolha o formato</p>
                      <div className="flex flex-wrap gap-3">
                        {FORMATS.filter(f => selectedProduct.formats.includes(f.id)).map(f => {
                          const active = (modalFormatId && selectedProduct.formats.includes(modalFormatId) ? modalFormatId : selectedProduct.formats[0]) === f.id;
                          return (
                            <button
                              key={f.id}
                              onClick={() => setModalFormatId(f.id)}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold transition ${
                                active ? 'bg-[#0071e3] text-white border-[#0071e3]' : isDark ? 'border-white/15 text-gray-300 hover:border-white/30' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {f.icon} {f.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4 mb-12">
                      {selectedProduct.specs.map(s => (
                        <div key={s} className={`flex items-center gap-3 p-4 ${isDark ? 'bg-[#121212] border-white/5' : 'bg-gray-50 border-gray-100'} rounded-2xl border`}>
                          <Check size={18} className="text-green-500 flex-shrink-0" />
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{s}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => { addToCart(selectedProduct, modalFormatId || selectedProduct.formats[0]); setSelectedProduct(null); setModalFormatId(null); }}
                        className="bg-[#0071e3] text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#0077ed] transition flex items-center gap-2"
                      >
                        <ShoppingBag size={16} /> Adicionar à Sacola
                      </button>
                      <button onClick={() => { setSelectedProduct(null); setModalFormatId(null); }} className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} px-6 py-3 rounded-full text-sm font-semibold transition`}>
                        Voltar
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
        </AnimatePresence>

        {/* --- Funcionalidades AirNext: galeria horizontal com barra de scroll --- */}
        <FuncionalidadesSection isDark={false} />

        {/* --- NFC vs Papel: por que compartilhar contato por NFC muda tudo --- */}
        <NfcVsPaperSection isDark={isDark} />

        {/* --- Momentos Reais Gallery Carousel --- */}
        <LazyOnView id="galeria" minHeight={800}>
        {((isDark: boolean) => (
        <section id="galeria" className={`py-20 md:py-28 transition-colors duration-500 ${isDark ? 'bg-[#050505] text-white' : 'bg-[#f5f5f7] text-gray-900'} overflow-hidden`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="eyebrow text-[#0071e3] mb-3">Vida Real</p>
              <h2 className="h2-apple mb-4">Momentos AirNext.</h2>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'} max-w-2xl mx-auto`}>Um toque, uma conexão, uma história. Veja onde o AirNext já está fazendo a diferença.</p>
            </div>

            <Swiper
              modules={[Pagination]}
              spaceBetween={24}
              slidesPerView={1.15}
              pagination={{ clickable: true }}
              breakpoints={{ 640: { slidesPerView: 2.2 }, 1024: { slidesPerView: 3.2 } }}
              className="pb-10"
            >
              {[
                {
                  id: 'evento',
                  img: EVENTO_PARTICIPANTE_IMG,
                  title: 'Conexões que acontecem na hora',
                  caption: 'Compartilhe seu perfil profissional em segundos e transforme cada encontro em uma nova oportunidade.'
                },
                {
                  id: 'pet-passeio',
                  img: PET_CAVALIER_SENTADO_IMG,
                  title: 'Mais segurança em cada passeio',
                  caption: 'Informações importantes sempre acessíveis para ajudar seu pet a ser identificado e voltar para casa.'
                },
                {
                  id: 'pet-perfil',
                  img: PET_THOR_PERFIL_IMG,
                  title: 'O perfil completo do seu pet',
                  caption: 'Nome, raça, contato do tutor e muito mais — tudo na tela de quem encontrar, sem instalar nada.'
                },
                {
                  id: 'pet-resgate',
                  img: PET_FILHOTE_CHUVA_IMG,
                  title: 'Quem encontra, sabe para quem ligar',
                  caption: 'Mesmo em dias difíceis, um toque na tag leva direto ao contato de quem cuida dele.'
                },
              ].map((item, i) => (
                <SwiperSlide key={i}>
                  <div className="relative rounded-[28px] overflow-hidden aspect-[3/4] group">
                    {imagesLoading ? (
                      <div className="absolute inset-0 bg-white/5 animate-pulse" />
                    ) : (
                      <img loading="lazy" decoding="async" src={resolveImg(`moments-${item.id}`, item.img)} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-white text-lg font-bold mb-1.5">{item.title}</h3>
                      <p className="text-white/75 text-sm leading-relaxed">{item.caption}</p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            <SwipeIndicator isDark={isDark} />
          </div>
        </section>
        ))(false)}
        </LazyOnView>

        {/* --- Interactive Use Cases Simulator Section --- */}
        <LazyOnView id="casos-uso" minHeight={900}>
        <section id="casos-uso" className={`py-20 md:py-28 transition-colors duration-500 ${isDark ? 'bg-[#050505] border-white/10' : 'bg-white border-gray-100'} border-y`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="eyebrow text-[#0071e3] mb-3">Casos de Uso</p>
              <h2 className={`h2-apple mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Para cada momento, uma solução.</h2>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'} max-w-2xl mx-auto`}>
                Explore o simulador interativo abaixo e veja como a tecnologia AirNext NFC se adapta perfeitamente a diferentes necessidades do dia a dia.
              </p>
            </div>

            <div className="grid lg:grid-cols-5 gap-12 items-center">
              {/* Simulator Options (Left) */}
              <div className="lg:col-span-2 space-y-4">
                {useCaseScenarios.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveUseCase(i)}
                    className={`w-full text-left p-6 rounded-3xl border transition-all duration-300 flex items-center gap-4 ${
                      activeUseCase === i
                        ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-200'
                        : isDark
                          ? 'bg-[#121212] border-white/5 hover:bg-[#1a1a1a] hover:border-white/10'
                          : 'bg-[#fbfbfd] border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <span className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-500/10 flex-shrink-0">
                      {s.icon}
                    </span>
                    <div>
                      <h3 className={`font-bold text-base mb-1 ${activeUseCase === i ? 'text-[#0071e3]' : isDark ? 'text-white' : 'text-gray-900'}`}>{s.title}</h3>
                      <p className={`text-xs ${isDark && activeUseCase !== i ? 'text-gray-400' : 'text-gray-500'} leading-relaxed line-clamp-2 min-h-[32px]`}>{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Interactive Phone Mockup (Right) */}
              <div className="lg:col-span-3 flex justify-center">
                <div className="relative w-[310px] md:w-[360px] aspect-[9/18.5] rounded-[48px] p-[12px] bg-black shadow-2xl border border-white/10 flex flex-col justify-between overflow-hidden">
                  
                  {/* Dynamic screen background */}
                  <div
                    className="absolute inset-0 z-0 opacity-90 transition-all duration-500"
                    style={{ background: useCaseScenarios[activeUseCase].screen.bg }}
                  />

                  {/* Phone notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-20" />

                  {/* Phone status bar */}
                  <div className="relative z-10 pt-8 px-5 flex items-center justify-between text-white/80 text-[10px] font-semibold">
                    <span>12:00</span>
                    <div className="flex items-center gap-1.5">
                      <Zap size={12} />
                      <div className="w-5 h-2.5 rounded-[3px] border border-white/70 flex items-center p-[1px]">
                        <div className="h-full w-[80%] bg-white rounded-[1px]" />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic screen content */}
                  <div className="relative z-10 flex-1 flex flex-col justify-between px-6 pt-10 pb-8 text-white">
                    <div className="text-center">
                      <motion.div
                        key={activeUseCase}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative w-20 h-20 mx-auto mb-4"
                      >
                        {/* Imagem de perfil real no mockup */}
                        <div
                          className="w-20 h-20 rounded-full overflow-hidden shadow-lg border-2 border-white/25 flex items-center justify-center text-2xl font-extrabold text-white"
                          style={{ background: useCaseScenarios[activeUseCase].screen.avatarBg }}
                        >
                          <DemoAvatar
                            key={activeUseCase}
                            src={useCaseScenarios[activeUseCase].screen.photo}
                            alt={useCaseScenarios[activeUseCase].screen.title}
                            fallback={useCaseScenarios[activeUseCase].screen.avatarIcon ?? getInitials(useCaseScenarios[activeUseCase].screen.title)}
                          />
                        </div>
                        {/* Selinho com o ícone do cenário, sobre o avatar */}
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#111] border-2 border-white/20 flex items-center justify-center shadow-md">
                          {useCaseScenarios[activeUseCase].icon}
                        </div>
                      </motion.div>
                      <h3 className="text-xl font-extrabold mb-1">{useCaseScenarios[activeUseCase].screen.title}</h3>
                      <p className="text-xs text-blue-200/80 font-medium mb-8">{useCaseScenarios[activeUseCase].screen.subtitle}</p>

                      <div className="space-y-3">
                        {useCaseScenarios[activeUseCase].screen.items.map((item, idx) => (
                          <div key={idx} className={`p-3.5 rounded-2xl flex items-center justify-between text-xs border border-white/5 shadow-sm ${item.color}`}>
                            <span className="font-semibold flex items-center gap-2">{item.icon}{item.label}</span>
                            <span className="font-bold">{item.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button className="w-full bg-white text-black py-4 rounded-full text-xs font-extrabold shadow-lg hover:bg-gray-100 transition active:scale-98">
                      {useCaseScenarios[activeUseCase].screen.btn}
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>
        </LazyOnView>

        
        {/* --- Quem Usa Recomenda / Feedbacks Section --- */}
        {(fbSettings?.show_section === false || pubFeedbacks.length === 0) ? null : ((isDark: boolean) => (
        <section id="feedbacks" className={`py-20 md:py-28 transition-colors duration-500 ${isDark ? 'bg-[#121212] text-white' : 'bg-[#fbfbfd] text-gray-900'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="eyebrow text-[#0071e3] mb-3">{fbSettings?.eyebrow || 'Quem Usa Recomenda'}</p>
              <h2 className={`h2-apple mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{fbSettings?.title || 'Feedbacks de Clientes.'}</h2>
              {fbSettings?.subtitle && <p className={`mx-auto max-w-xl text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{fbSettings.subtitle}</p>}
              {fbSettings?.show_summary !== false && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} className="text-yellow-400" fill={i < Math.round(fbAvg) ? '#facc15' : 'transparent'} />
                  ))}
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-1`}>
                    {`${fbAvg.toFixed(1).replace('.', ',')}/5 · ${pubFeedbacks.length} avaliaç${pubFeedbacks.length === 1 ? 'ão' : 'ões'}`}
                  </span>
                </div>
              )}
            </div>

            <Swiper
              modules={[Pagination]}
              spaceBetween={20}
              slidesPerView={1}
              pagination={{ clickable: true }}
              breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
              className="pb-10"
            >
              {testimonialsList.map((t, i) => (
                <SwiperSlide key={i} className="!h-auto">
                  <div className={`p-8 rounded-[28px] ${isDark ? 'bg-[#050505] border-white/10' : 'bg-white border-gray-100'} border h-[300px] shadow-sm flex flex-col justify-between hover:shadow-lg transition-all`}>
                    <div>
                      <div className="flex mb-3">
                        {[...Array(t.rating)].map((_, j) => <Star key={j} size={12} className="text-yellow-400" fill="#facc15" />)}
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} leading-relaxed line-clamp-5`}>"{t.text}"</p>
                    </div>
                    <div className="flex items-center gap-3 border-t pt-4 border-white/5">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-blue-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 ring-2 ring-white/10">
                        {t.photo ? (
                          <img src={t.photo} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : t.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{t.name}</p>
                        <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.role}</p>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            <SwipeIndicator isDark={isDark} />

            <div className="mt-6 flex flex-col items-center gap-3 text-center">
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Já usa a AirNext? Conte como foi.</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] transition active:scale-[.97]">
                  <Star size={13} fill="currentColor" /> Avaliar no Google
                </a>
                <FeedbackLink source="seção feedbacks" className={`px-5 py-2.5 rounded-full text-xs font-semibold transition active:scale-[.97] ${isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-black/5 text-gray-900 hover:bg-black/10'}`}>
                  Deixar feedback
                </FeedbackLink>
              </div>
            </div>
          </div>
        </section>
        ))(false)}

        {/* --- Privacidade e segurança (estilo apple.com) --- */}
        <PrivacyShowcaseSection />

        {/* --- For Everyone --- */}
        <LazyOnView id="para-todos" minHeight={800}>
        {((isDark: boolean) => (
        <section id="para-todos" className={`py-20 md:py-28 transition-colors duration-500 ${isDark ? 'bg-[#121212] text-white' : 'bg-[#f5f5f7] text-gray-900'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="eyebrow text-[#0071e3] mb-3">Inclusão & Acessibilidade</p>
              <h2 className={`h2-apple mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>AirNext é para todos.</h2>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'} max-w-2xl mx-auto`}>Tecnologia que protege, conecta e empodera — de crianças a idosos, de profissionais a tutores de pets.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {everyoneData.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setActiveEveryone(i)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${
                    activeEveryone === i
                      ? 'bg-[#0071e3] text-white shadow-lg shadow-blue-500/30'
                      : isDark
                        ? 'bg-[#050505] text-gray-400 hover:text-white border border-white/10'
                        : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div className={`${isDark ? 'bg-[#050505] border-white/10' : 'bg-white border-gray-100'} rounded-[40px] overflow-hidden shadow-sm border`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeEveryone}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: .4 }}
                  className="grid lg:grid-cols-2"
                >
                  <div className="p-8 md:p-16 flex flex-col justify-center order-2 lg:order-1">
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: .15, duration: .4 }}
                    >
                      <span className="eyebrow text-[#0071e3] mb-3 block">{everyoneData[activeEveryone].label}</span>
                      <h3 className={`text-2xl md:text-3xl font-bold mb-6 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{everyoneData[activeEveryone].title}</h3>
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mb-8 leading-relaxed`}>{everyoneData[activeEveryone].text}</p>

                      <div className={`${isDark ? 'bg-[#121212] border-white/10' : 'bg-blue-50 border-blue-100'} rounded-2xl p-6 mb-8 border`}>
                        <p className="text-xs font-bold text-[#0071e3] uppercase tracking-widest mb-2">Como adquirir e usar</p>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>{everyoneData[activeEveryone].howTo}</p>
                      </div>

                      <Link to="/loja" className="inline-flex items-center gap-2 bg-[#0071e3] text-white px-8 py-3.5 rounded-full font-semibold hover:bg-[#0077ed] transition shadow-lg shadow-blue-500/20">
                        Ver Produto <ArrowRight size={16} />
                      </Link>
                    </motion.div>
                  </div>
                  <div className="aspect-[4/3] lg:aspect-auto relative overflow-hidden order-1 lg:order-2">
                    {imagesLoading ? (
                      <div className="absolute inset-0 bg-white/5 animate-pulse min-h-[300px]" />
                    ) : (
                      <motion.img
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: .8 }}
                        src={resolveImg(`everyone-${everyoneData[activeEveryone].id}`, everyoneData[activeEveryone].img)}
                        alt={everyoneData[activeEveryone].label}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover min-h-[300px]"
                      />
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
              {everyoneData[activeEveryone].id === 'tea' && <TeaTechSlider isDark={isDark} />}
            </div>
          </div>
        </section>
        ))(false)}
        </LazyOnView>

        {/* --- Quem Somos --- */}
        <LazyOnView id="quem-somos" minHeight={700}>
        <section id="quem-somos" className={`py-20 md:py-28 transition-colors duration-500 ${isDark ? 'bg-[#050505] text-white' : 'bg-white text-gray-900'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="eyebrow text-[#0071e3] mb-3">Sobre nós</p>
              <h2 className={`h2-apple mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Quem somos & o que nos move.</h2>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'} max-w-2xl mx-auto`}>Conheça nossa cultura, nossos objetivos e os pilares de nossa marca.</p>
            </div>

            <Swiper
              modules={[Pagination]}
              spaceBetween={20}
              slidesPerView={1}
              pagination={{ clickable: true }}
              breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 4 } }}
              className="pb-10"
            >
              {[
                { title: 'Nossa Missão', text: 'Conectar o mundo físico ao digital de forma invisível, rápida e segura.', icon: <Rocket size={40} />, color: '#0071e3' },
                { title: 'Nossa Visão', text: 'Ser a ponte universal para troca de informações em tempo real no Brasil.', icon: <Eye size={40} />, color: '#af52de' },
                { title: 'Nosso Objetivo', text: 'Reduzir o lixo de papel em 90% na indústria de networking até 2030.', icon: <Target size={40} />, color: '#ff9500' },
                { title: 'Nossos Valores', text: 'Privacidade absoluta, sustentabilidade real e design centrado no ser humano.', icon: <Heart size={40} />, color: '#ff3b30' },
              ].map((s, i) => (
                <SwiperSlide key={i}>
                  <div className={`p-8 rounded-[32px] ${isDark ? 'bg-[#121212] border-white/5' : 'bg-[#fbfbfd] border-gray-100'} border h-full flex flex-col items-center text-center hover:shadow-lg transition-all`}>
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ background: `${s.color}15`, color: s.color }}>
                      {s.icon}
                    </div>
                    <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.title}</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} leading-relaxed`}>{s.text}</p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            <SwipeIndicator isDark={isDark} />
          </div>
        </section>
        </LazyOnView>

        {/* --- B2B & Wholesale Section --- */}
        <LazyOnView id="b2b" minHeight={800}>
        {((isDark: boolean) => (
        <section id="b2b" className={`py-20 md:py-28 transition-colors duration-500 ${isDark ? 'bg-[#121212] text-white' : 'bg-[#f5f5f7] text-gray-900'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="eyebrow text-[#0071e3] mb-3">Empresas & Revenda</p>
                <h2 className={`h2-apple mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Soluções Corporativas personalizadas.</h2>
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-8 leading-relaxed`}>
                  Destaque a marca da sua empresa. Fornecemos cartões de visita corporativos digitais em grandes lotes, impressos com a sua identidade visual e logotipo.
                </p>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#050505] border-white/10' : 'bg-white border-gray-100'}`}>
                    <h3 className={`font-bold text-base mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard Administrativo</h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gerencie todos os perfis da sua equipe em um único painel e crie modelos corporativos.</p>
                  </div>
                  
                </div>
              </div>
              <div className={`${isDark ? 'bg-[#050505] border-white/10' : 'bg-white border-gray-200/60'} rounded-[40px] border p-8 md:p-12 shadow-sm`}>
                <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Fale com nosso time de vendas</h3>
                <form onSubmit={handleB2bSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="b2b-name" className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Seu nome</label>
                    <input id="b2b-name" required name="name" type="text" autoComplete="name" className={`w-full mt-1 px-4 py-3 ${isDark ? 'bg-[#121212] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition`} />
                  </div>
                  <div>
                    <label htmlFor="b2b-email" className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>E-mail corporativo</label>
                    <input id="b2b-email" required name="email" type="email" autoComplete="email" className={`w-full mt-1 px-4 py-3 ${isDark ? 'bg-[#121212] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition`} />
                  </div>
                  <div>
                    <label htmlFor="b2b-message" className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mensagem / Tamanho do lote</label>
                    <textarea id="b2b-message" required name="message" rows={3} placeholder="Quantos cartões ou produtos você precisa?" className={`w-full mt-1 px-4 py-3 ${isDark ? 'bg-[#121212] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none`} />
                  </div>
                  <button type="submit" disabled={b2bStatus === 'sending'} className="w-full bg-[#0071e3] text-white py-4 rounded-full text-sm font-bold hover:bg-[#0077ed] transition disabled:opacity-60 disabled:cursor-not-allowed">
                    {b2bStatus === 'sending' ? 'Enviando...' : 'Enviar Proposta B2B'}
                  </button>
                  {b2bStatus === 'success' && (
                    <p className="text-sm text-green-500 font-semibold text-center">Mensagem enviada! Entraremos em contato em até 24h.</p>
                  )}
                  {b2bStatus === 'error' && (
                    <p className="text-sm text-red-500 font-semibold text-center">Não foi possível enviar. Tente novamente ou fale pelo WhatsApp.</p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>
        ))(false)}
        </LazyOnView>

        {/* --- Help & Support --- */}
        <LazyOnView id="ajuda" minHeight={1100}>
        <section id="ajuda" className={`py-20 md:py-28 transition-colors duration-500 ${isDark ? 'bg-[#050505] text-white' : 'bg-white text-gray-900'}`}>
          <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
              <h2 className={`font-lobster text-6xl md:text-8xl leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Suporte
              </h2>

              <p className={`mt-4 max-w-xl mx-auto text-xl ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Estamos aqui para você. Manuais, ajuda e suporte técnico em tempo real.
              </p>
            </div>

            <Swiper
              modules={[Pagination]}
              spaceBetween={20}
              slidesPerView={1}
              pagination={{ clickable: true }}
              breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
              className="pb-10"
            >
              {[
                { icon: <BookOpen size={32} />, title: 'Manuais', desc: 'Guias passo a passo para configurar seu perfil, gravar o chip NFC e personalizar tudo.', link: 'Ver Manuais', to: '/suporte' },
                { icon: <HelpCircle size={32} />, title: 'Central de Ajuda', desc: 'Base de conhecimento com as dúvidas mais frequentes sobre nossos produtos e serviços.', link: 'Acessar FAQ', to: '/suporte' },
                { icon: <LifeBuoy size={32} />, title: 'Suporte ao Vivo', desc: 'Fale com nosso time técnico em tempo real pelo WhatsApp ou e-mail dedicado.', link: 'Falar Agora', to: `https://wa.me/${AIRNEXT_WHATSAPP}` },
              ].map((s, i) => {
                const supportCard = (
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    className={`p-8 rounded-[32px] ${isDark ? 'bg-[#121212] border-white/5' : 'bg-[#fbfbfd] border-gray-100'} border flex flex-col items-center text-center group cursor-pointer hover:shadow-xl transition-all h-full`}
                  >
                    <div className={`w-20 h-20 rounded-3xl ${isDark ? 'bg-[#050505]' : 'bg-white'} shadow-sm flex items-center justify-center mb-6 text-[#0071e3] group-hover:bg-[#0071e3] group-hover:text-white transition-all duration-300`}>
                      {s.icon}
                    </div>
                    <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.title}</h3>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mb-6 leading-relaxed`}>{s.desc}</p>
                    <span className="text-sm font-bold text-[#0071e3] flex items-center gap-1">
                      {s.link} <ArrowRight size={14} />
                    </span>
                  </motion.div>
                );
                return (
                  <SwiperSlide key={i} className="!h-auto">
                    {s.to.startsWith('/') ? (
                      <Link to={s.to} aria-label={`${s.title} — ${s.link}`} className="block h-full">{supportCard}</Link>
                    ) : (
                      <a href={s.to} target="_blank" rel="noopener noreferrer" aria-label={`${s.title} — ${s.link} (abre em nova aba)`} className="block h-full">{supportCard}</a>
                    )}
                  </SwiperSlide>
                );
              })}
            </Swiper>
            <SwipeIndicator isDark={isDark} />

            {/* FAQ + definição — otimizado para AI Overviews (resposta clara + schema FAQPage) */}
            <div className="mt-20 max-w-3xl mx-auto" id="faq">
              <div className={`mb-10 p-6 rounded-3xl border ${isDark ? 'bg-[#121212] border-white/10' : 'bg-[#f5f5f7] border-gray-100'}`}>
                <p className="eyebrow text-[#0071e3] mb-2">O que é AirNext</p>
                <p className={`ai-definition text-lg md:text-xl font-semibold leading-relaxed ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {AIRNEXT_DEFINITION}
                </p>
                <ol className={`mt-5 space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {AIRNEXT_HOW_IT_WORKS.map((step, i) => (
                    <li key={i} className="ai-howto-step flex gap-2">
                      <span className="font-bold text-[#0071e3] shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <h3 className={`text-2xl font-bold mb-2 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>Perguntas frequentes</h3>
              <p className={`text-center text-sm mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Respostas diretas sobre cartão NFC, perfil digital, mensalidade e compatibilidade.
              </p>
              <div className="space-y-3" itemScope itemType="https://schema.org/FAQPage">
                {AIRNEXT_FAQ.map((item, i) => (
                  <details
                    key={i}
                    className={`group rounded-2xl ${isDark ? 'bg-[#121212] border-white/5 text-white' : 'bg-[#f5f5f7] border-gray-100 text-gray-900'} border px-6 py-5 cursor-pointer transition-all`}
                    itemScope
                    itemProp="mainEntity"
                    itemType="https://schema.org/Question"
                  >
                    <summary className="flex items-center justify-between list-none font-semibold gap-3">
                      <span itemProp="name">{item.question}</span>
                      <span className="text-gray-400 text-xl transition-transform group-open:rotate-45 shrink-0">+</span>
                    </summary>
                    <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                      <p
                        itemProp="text"
                        className={`ai-faq-answer text-sm ${isDark ? 'text-gray-400 border-white/10' : 'text-gray-600 border-gray-100'} leading-relaxed mt-3 pt-3 border-t`}
                      >
                        {item.answer}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
        </LazyOnView>

        {/* --- Final CTA --- */}
        <section className="py-20 md:py-28 bg-black text-white relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          
          

          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <p className="eyebrow text-blue-400 mb-4">Comece Hoje</p>
            <h2 className="h2-apple mb-6">
              {['Aproxime.', 'Conecte.'].map((w, n) => (
                <motion.span key={w} className="mr-[0.25em] inline-block text-white" initial={{ opacity: 0, y: 32, filter: 'blur(14px)' }} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.9, delay: n * 0.18, ease: [0.22, 1, 0.36, 1] }}>{w}</motion.span>
              ))}
              <br />
              <motion.span className="inline-block bg-gradient-to-r from-white via-[#8ab8ff] to-[#2997ff] bg-clip-text text-transparent" initial={{ opacity: 0, y: 32, scale: 0.94, filter: 'blur(14px)' }} whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 1.1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}>Transforme.</motion.span>
            </h2>
            <motion.p
              className="text-lg text-gray-400 max-w-2xl mx-auto mb-10"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              Junte-se a milhares de pessoas e negócios que já simplificaram suas conexões com a AirNext. Sem mensalidade, sem fios, sem fricção.
            </motion.p>

            <motion.div
              className="flex flex-wrap justify-center gap-4 mb-12"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link to="/loja" className="bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-xl flex items-center gap-2 active:scale-95">
                <ShoppingBag size={18} /> Comprar Agora
              </Link>
              <a href="#destaques" className="bg-white/10 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition border border-white/20 flex items-center gap-2 active:scale-95">
                <Play size={18} /> Ver destaques
              </a>
            </motion.div>

           
            <p className="text-xs text-white/40 mt-3">Comece hoje sua jornada com a AirNext e leve sua presença digital para o próximo nível.</p>
          </div>
        </section>
      </main>

      {/* --- Adaptive Elegant Footer --- */}
      <footer className={`py-16 md:py-20 border-t relative overflow-hidden transition-colors duration-500 ${
        isDark 
          ? 'bg-[#030712] text-gray-400 border-gray-800' 
          : 'bg-[#f8faf8] text-gray-600 border-green-200/60'
      }`}>
        
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-5 gap-12 mb-16">
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <Logo dark={isDark} size="lg" />
                <div className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-full border ${
                  isDark ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                  <Recycle size={12} /> 100% Reciclável
                </div>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed max-w-sm`}>
                Tecnologia ao toque. Transformando conexões físicas em experiências digitais memoráveis, acessíveis e sustentáveis. 
                Comprometidos com o meio ambiente — cada produto AirNext elimina o desperdício de papel.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {[
                    { Icon: MessageCircle, href: 'https://wa.me/5547996287761', label: 'WhatsApp', external: true },
                    { Icon: Camera, href: 'https://www.instagram.com/airnext.com.br/', label: 'Instagram', external: true },
                    { Icon: AtSign, href: 'mailto:contato@airnext.com.br', label: 'E-mail', external: false },
                    { Icon: Globe, href: 'https://airnext.com.br', label: 'Site AirNext', external: false },
                  ].map(({ Icon, href, label, external }) => (
                    <a key={label} href={href} aria-label={label} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isDark 
                        ? 'bg-white/5 border border-white/10 text-gray-400 hover:border-green-400 hover:text-green-400' 
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700'
                    }`}>
                      <Icon size={16} />
                    </a>
                  ))}
                </div>
                <div className={`h-8 w-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
                <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full ${
                  isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'
                }`}>
                  <Leaf size={12} /> Carbono Neutro
                </div>
              </div>
            </div>
            {[
              { title: 'Produtos', items: [
                { label: 'Cartão NFC', href: '/produto/pro' }, { label: 'Coleira Inteligente', href: '/produto/pet' },
                { label: 'Tag NFC', href: '/produto/tag' }, { label: 'Stand AirNext', href: '/produto/stand' },
                { label: 'Pulseira NFC', href: '/produto/kids' }, { label: 'Placa Google', href: '/produto/hubgoogle' },
              ] },
              { title: 'Empresa', items: [
                { label: 'Quem Somos', href: '#quem-somos' }, { label: 'Segurança', href: '#seguranca' }, { label: 'Sobre a AirNext', href: '/sobre' }, { label: 'Carreiras', href: 'mailto:contato@airnext.com.br?subject=Carreiras' },
              ] },
              { title: 'Suporte', items: [
                { label: 'Manuais', href: '#ajuda' }, { label: 'Suporte e tutoriais', href: '/suporte' }, { label: 'FAQ', href: '#faq' },
                { label: 'Contato', href: '/contato' }, { label: 'WhatsApp', href: 'https://wa.me/5547996287761' },
                { label: 'contato@airnext.com.br', href: 'mailto:contato@airnext.com.br' },
                { label: 'Instagram @airnext.com.br', href: 'https://www.instagram.com/airnext.com.br/' },
                { label: 'Avaliar a AirNext no Google', href: GOOGLE_REVIEW_URL },
              ] },
            ].map(col => (
              <div key={col.title}>
                <h3 className={`font-bold text-sm mb-6 tracking-wide uppercase text-xs ${isDark ? 'text-white' : 'text-gray-800'}`}>{col.title}</h3>
                <ul className="space-y-3 text-sm">
                  {col.items.map(item => (
                    <li key={item.label}>
                      <a href={item.href} {...(item.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={`hover:translate-x-1 transition-all inline-block ${
                        isDark ? 'text-gray-400 hover:text-green-400' : 'text-gray-600 hover:text-green-700'
                      }`}>
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Environmental highlight bar */}
          <div className={`border rounded-2xl p-6 mb-10 flex flex-wrap items-center justify-center gap-6 md:gap-12 text-xs transition-colors ${
            isDark 
              ? 'bg-[#0b1319] border-green-500/20 text-green-400' 
              : 'bg-green-50 border-green-200/60 text-green-700'
          }`}>
            <div className="flex items-center gap-2.5 font-semibold">
              <TreePine size={18} className="text-green-500" />
              <span>+1.200 árvores plantadas</span>
            </div>
            <div className={`hidden md:block w-px h-6 ${isDark ? 'bg-green-500/20' : 'bg-green-200'}`} />
            <div className="flex items-center gap-2.5 font-semibold">
              <Recycle size={18} className="text-green-500" />
              <span>2.4 milhões de cartões de papel economizados</span>
            </div>
            <div className={`hidden md:block w-px h-6 ${isDark ? 'bg-green-500/20' : 'bg-green-200'}`} />
            <div className="flex items-center gap-2.5 font-semibold">
              <Leaf size={18} className="text-green-500" />
              <span>100% embalagens biodegradáveis</span>
            </div>
          </div>

          <div className={`border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] ${
            isDark ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600'
          }`}>
            <p>© 2026 AirNext Tecnologia LTDA. Todos os direitos reservados.</p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/sobre" className={`${isDark ? 'hover:text-green-400' : 'hover:text-green-700'} transition`}>Sobre</Link>
              <Link to="/contato" className={`${isDark ? 'hover:text-green-400' : 'hover:text-green-700'} transition`}>Contato</Link>
              <Link to="/politica-de-privacidade" className={`${isDark ? 'hover:text-green-400' : 'hover:text-green-700'} transition`}>Privacidade</Link>
              <Link to="/termos-de-uso" className={`${isDark ? 'hover:text-green-400' : 'hover:text-green-700'} transition`}>Termos de Uso</Link>
              <Link to="/politica-de-cookies" className={`${isDark ? 'hover:text-green-400' : 'hover:text-green-700'} transition`}>Cookies</Link>
              <button onClick={() => setCookieSettingsOpen(true)} className={`${isDark ? 'hover:text-green-400' : 'hover:text-green-700'} transition`}>Configurações de Cookies</button>
            </div>
          </div>
        </div>
      </footer>


      {/* Banner de consentimento de cookies (LGPD) */}
      <AnimatePresence>
        {cookieBannerVisible && !cookieSettingsOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={`fixed bottom-0 inset-x-0 z-[100] p-4 md:p-6 ${isDark ? 'bg-[#0a0a0a] border-t border-white/10' : 'bg-white border-t border-gray-200'}`}
          >
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-4">
              <p className={`text-sm flex-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Usamos cookies para melhorar sua experiência, entender como você usa o site e personalizar anúncios, em conformidade com a LGPD. Você pode aceitar tudo, recusar o que não for essencial, ou personalizar suas preferências.
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={rejectNonEssentialCookies} className={`px-4 py-2.5 rounded-full text-xs font-bold border transition ${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  Recusar
                </button>
                <button onClick={() => setCookieSettingsOpen(true)} className={`px-4 py-2.5 rounded-full text-xs font-bold border transition ${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  Personalizar
                </button>
                <button onClick={acceptAllCookies} className="px-4 py-2.5 rounded-full text-xs font-bold bg-[#0071e3] text-white hover:bg-[#0077ed] transition">
                  Aceitar todos
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Painel de personalização de cookies */}
      <AnimatePresence>
        {cookieSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
            onClick={() => setCookieSettingsOpen(false)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full md:max-w-lg rounded-t-[32px] md:rounded-[32px] p-6 md:p-8 ${isDark ? 'bg-[#121212] text-white' : 'bg-white text-gray-900'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Preferências de Cookies</h3>
                <button onClick={() => setCookieSettingsOpen(false)} className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  <X size={22} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                  <div>
                    <p className="text-sm font-bold">Essenciais</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Necessários para o site funcionar (carrinho, login). Sempre ativos.</p>
                  </div>
                  <div className="w-11 h-6 rounded-full bg-[#0071e3] flex items-center px-0.5 justify-end flex-shrink-0 opacity-50">
                    <div className="w-5 h-5 rounded-full bg-white" />
                  </div>
                </div>

                <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                  <div>
                    <p className="text-sm font-bold">Analíticos</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Nos ajudam a entender como o site é usado (Google Analytics).</p>
                  </div>
                  <button
                    onClick={() => setCookiePrefs(p => ({ ...p, analytics: !p.analytics }))}
                    className={`w-11 h-6 rounded-full flex items-center px-0.5 flex-shrink-0 transition ${cookiePrefs.analytics ? 'bg-[#0071e3] justify-end' : `justify-start ${isDark ? 'bg-white/20' : 'bg-gray-300'}`}`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white" />
                  </button>
                </div>

                <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                  <div>
                    <p className="text-sm font-bold">Marketing</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Usados para personalizar anúncios no Instagram/Facebook (Meta Pixel).</p>
                  </div>
                  <button
                    onClick={() => setCookiePrefs(p => ({ ...p, marketing: !p.marketing }))}
                    className={`w-11 h-6 rounded-full flex items-center px-0.5 flex-shrink-0 transition ${cookiePrefs.marketing ? 'bg-[#0071e3] justify-end' : `justify-start ${isDark ? 'bg-white/20' : 'bg-gray-300'}`}`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white" />
                  </button>
                </div>
              </div>

              <button onClick={() => saveCookieConsent(cookiePrefs)} className="w-full bg-[#0071e3] text-white py-3.5 rounded-full text-sm font-bold hover:bg-[#0077ed] transition">
                Salvar preferências
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- AirNext Feature catalogue used by FuncionalidadesSection ---
interface AirNextFeature {
  id: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  detail: string;
  color: string;
}

const FEATURES: AirNextFeature[] = [
  {
    id: 'personalizar', icon: <Palette size={22} />, color: '#0071e3',
    title: 'Personalize seu Perfil',
    desc: 'Cores, fotos, capa e textos do seu jeito.',
    detail: 'Monte um perfil público com a sua cara: foto de capa, avatar, cores, biografia e ordem dos blocos — tudo editável a qualquer momento, sem precisar de código.',
  },
  {
    id: 'links', icon: <Link2 size={22} />, color: '#34c759',
    title: 'Adicione Todos os seus Links',
    desc: 'Site, portfólio, cardápio, PIX e mais.',
    detail: 'Reúna quantos links quiser em um só lugar: WhatsApp, site, portfólio, cardápio digital, chave PIX, currículo — tudo a um toque de distância.',
  },
  {
    id: 'redes', icon: <Share2 size={22} />, color: '#ff9500',
    title: 'Redes Sociais & Apps',
    desc: 'Instagram, TikTok, LinkedIn e YouTube.',
    detail: 'Conecte suas redes sociais e apps favoritos direto no perfil, com ícones reconhecíveis — quem visita acessa seu conteúdo em um clique.',
  },
  {
    id: 'avaliacoes', icon: <Star size={22} />, color: '#ffd60a',
    title: 'Avaliações',
    desc: 'Receba e exiba avaliações reais.',
    detail: 'Colete avaliações de clientes e contatos direto no seu perfil público, construindo reputação e confiança a cada nova interação.',
  },
  {
    id: 'sos', icon: <AlertTriangle size={22} />, color: '#ff3b30',
    title: 'Modo SOS',
    desc: 'Emergência com um toque, a qualquer hora.',
    detail: 'Em situações de emergência, ative o Modo SOS e compartilhe instantaneamente sua localização e contatos de confiança com quem estiver por perto.',
  },
  {
    id: 'ocultar', icon: <EyeOff size={22} />, color: '#5e17eb',
    title: 'Oculte seu Perfil Quando Quiser',
    desc: 'Visibilidade sob seu controle total.',
    detail: 'Ative ou desative a visibilidade do seu perfil a qualquer momento — fique invisível quando quiser e volte a compartilhar quando preferir.',
  },
  {
    id: 'compartilhar', icon: <QrCode size={22} />, color: '#00d2ff',
    title: 'Compartilhe por Link ou QR Code',
    desc: 'Envie o link ou deixe escanear.',
    detail: 'Compartilhe seu perfil enviando o link direto por WhatsApp ou redes sociais, ou deixe que outra pessoa escaneie seu QR Code exclusivo — sem precisar de aproximação NFC.',
  },
  {
    id: 'salvar', icon: <Smartphone size={22} />, color: '#00c2a8',
    title: 'Salve Contato com Um Toque',
    desc: 'Aproxime o celular e pronto.',
    detail: 'Aproxime seu cartão, tag ou pulseira AirNext do celular da outra pessoa e o seu contato é salvo instantaneamente na agenda, sem instalar nenhum aplicativo.',
  },
  {
    id: 'mais', icon: <Sparkles size={22} />, color: '#af52de',
    title: 'E Muito Mais',
    desc: 'Estatísticas, temas e atualizações.',
    detail: 'Estatísticas de visualizações do seu perfil, temas exclusivos, múltiplos perfis na mesma conta, integração com WhatsApp Business e novidades constantes — tudo incluso.',
  },
];

function FuncionalidadesSection({ isDark }: { isDark: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollPct, setScrollPct] = useState(0);

  const updateFromScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const pct = maxScroll > 0 ? (el.scrollLeft / maxScroll) * 100 : 0;
    setScrollPct(pct);
    const cardWidth = el.scrollWidth / FEATURES.length;
    setActiveIndex(Math.round(el.scrollLeft / cardWidth));
  };

  const scrollToIndex = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(FEATURES.length - 1, i));
    const cardWidth = el.scrollWidth / FEATURES.length;
    el.scrollTo({ left: cardWidth * clamped, behavior: 'smooth' });
  };

  // Permite arrastar a barra de progresso para navegar direto até um trecho da galeria
  const handleTrackBarDrag = (clientX: number, barEl: HTMLDivElement) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = barEl.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const maxScroll = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: maxScroll * ratio, behavior: 'auto' });
  };

  return (
    <section id="funcionalidades" className={`py-20 md:py-28 transition-colors duration-500 overflow-hidden ${isDark ? 'bg-[#121212] text-white' : 'bg-white text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <p className="eyebrow text-[#0071e3] mb-3">Tudo em um só perfil</p>
            <h2 className="h2-apple">Funcionalidades feitas para o seu dia a dia.</h2>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
              Arraste, deslize ou role para conhecer cada recurso do AirNext.
            </p>
          </div>

          {/* Setas de navegação — visíveis a partir de tablet */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => scrollToIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-label="Recurso anterior"
              className={`w-11 h-11 rounded-full flex items-center justify-center border transition disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? 'border-white/15 hover:bg-white/10' : 'border-gray-200 hover:bg-gray-100'}`}
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={() => scrollToIndex(activeIndex + 1)}
              disabled={activeIndex === FEATURES.length - 1}
              aria-label="Próximo recurso"
              className={`w-11 h-11 rounded-full flex items-center justify-center border transition disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? 'border-white/15 hover:bg-white/10' : 'border-gray-200 hover:bg-gray-100'}`}
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Galeria horizontal com scroll-snap — cada card já mostra ícone, título, resumo e descrição completa */}
        <div
          ref={trackRef}
          onScroll={updateFromScroll}
          className="flex gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {FEATURES.map((f, i) => {
            const isFocused = activeIndex === i;
            return (
              <motion.div
                key={f.id}
                className={`snap-start flex-shrink-0 w-[78%] sm:w-[46%] lg:w-[28%] rounded-[28px] p-6 md:p-7 border transition-all duration-500 ${
                  isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#fbfbfd] border-gray-100'
                }`}
                animate={{
                  opacity: isFocused ? 1 : 0.45,
                  scale: isFocused ? 1 : 0.94,
                }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${f.color}1A`, color: f.color }}
                >
                  {f.icon}
                </div>

                <span className={`text-[12px] font-semibold tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {String(i + 1).padStart(2, '0')} / {String(FEATURES.length).padStart(2, '0')}
                </span>

                <h3 className={`text-[19px] md:text-[21px] font-semibold mt-2 mb-2 leading-snug ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {f.title}
                </h3>
                <p className={`text-[13px] font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {f.desc}
                </p>
                <p className={`text-[14px] leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {f.detail}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Barra de scroll / progresso — arrastável, mostra em que ponto da galeria você está */}
        <div className="flex items-center gap-4 mt-2 max-w-md mx-auto">
          <span className={`text-[11px] font-semibold tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {String(activeIndex + 1).padStart(2, '0')}
          </span>
          <div
            className={`relative flex-1 h-1.5 rounded-full cursor-pointer ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}
            onClick={(e) => handleTrackBarDrag(e.clientX, e.currentTarget)}
          >
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full bg-[#0071e3]"
              style={{ width: `${Math.max(8, 100 / FEATURES.length)}%` }}
              animate={{ left: `${scrollPct * (1 - Math.max(8, 100 / FEATURES.length) / 100)}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <span className={`text-[11px] font-semibold tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {String(FEATURES.length).padStart(2, '0')}
          </span>
        </div>
      </div>
    </section>
  );
}

// --- Comparação: cartão de papel tradicional x cartão digital AirNext (NFC) ---
const PAPER_PAINS = [
  'Acaba na hora que você menos espera',
  'Rasga, amassa e desbota na carteira',
  'Fica desatualizado assim que você troca de telefone ou cargo',
  'Precisa reimprimir (e pagar de novo) toda vez que algo muda',
  'Só carrega texto — sem fotos, links, redes ou WhatsApp',
];

const NFC_GAINS = [
  'Compartilha o perfil completo em 1 segundo, sem digitar nada',
  'Nunca acaba, nunca rasga — é só encostar o celular de novo',
  'Atualiza tudo em tempo real, direto pelo app, sem reimprimir',
  'Salva automaticamente na agenda da outra pessoa, com foto e links',
  'Funciona mesmo sem NFC no aparelho: basta escanear o QR Code',
];

function NfcVsPaperSection({ isDark }: { isDark: boolean }) {
  // Painel da esquerda (papel) e da direita (NFC): no tema claro branco × preto; no escuro, invertido.
  const paperPanel = isDark ? 'bg-[#1d1d1f] text-white' : 'bg-white text-[#1d1d1f]';
  const nfcPanel = isDark ? 'bg-white text-[#1d1d1f]' : 'bg-[#1d1d1f] text-white';
  const paperText = isDark ? 'text-[#a1a1a6]' : 'text-[#6e6e73]';
  const nfcText = isDark ? 'text-[#424245]' : 'text-[#d2d2d7]';

  return (
    <section className={`relative overflow-hidden py-20 md:py-28 transition-colors duration-500 ${isDark ? 'bg-black text-white' : 'bg-[#f5f5f7] text-[#1d1d1f]'}`}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <p className={`mb-2 text-[19px] font-semibold ${isDark ? 'text-[#86868b]' : 'text-[#6e6e73]'}`}>Papel vs. NFC</p>
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-tight">
            Seu contato, salvo em segundos.<br />Sem papel, sem perdas.
          </h2>
          <p className={`mx-auto mt-5 max-w-2xl text-[19px] leading-snug ${isDark ? 'text-[#a1a1a6]' : 'text-[#6e6e73]'}`}>
            Aproxime o AirNext do celular de qualquer pessoa: seu cartão digital abre na hora e o contato é salvo automaticamente.
          </p>
        </div>

        {/* Dois painéis lado a lado, no mesmo bloco arredondado */}
        <div className={`grid overflow-hidden rounded-[32px] md:grid-cols-2 ${isDark ? 'ring-1 ring-white/10' : 'shadow-[0_1px_2px_rgba(0,0,0,0.04)]'}`}>
          <div className={`flex flex-col p-8 md:p-12 ${paperPanel}`}>
            <span className="mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#ff9f0a] text-white"><CreditCard size={26} /></span>
            <h3 className="text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">Cartão de papel tradicional</h3>
            <ul className="mt-8 space-y-4">
              {PAPER_PAINS.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#ff3b30]/10 text-[#ff3b30]"><X size={12} strokeWidth={3} /></span>
                  <span className={`text-[16px] leading-snug ${paperText}`}>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`flex flex-col p-8 md:p-12 ${nfcPanel}`}>
            <span className="mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#0a84ff] text-white"><Nfc size={26} /></span>
            <h3 className="text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">Cartão digital AirNext</h3>
            <ul className="mt-8 space-y-4">
              {NFC_GAINS.map((g) => (
                <li key={g} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#34c759] text-white"><Check size={12} strokeWidth={3} /></span>
                  <span className={`text-[16px] leading-snug ${nfcText}`}>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Aproxime · Abre na hora · Contato salvo */}
        <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-6 md:mt-20">
          {[
            { icon: <Smartphone size={26} />, color: '#0a84ff', title: 'Aproxime', desc: 'Encoste o cartão, tag ou pulseira AirNext no celular da outra pessoa.' },
            { icon: <Zap size={26} />, color: '#ff9f0a', title: 'Abre na hora', desc: 'O perfil digital abre sozinho, sem instalar nenhum aplicativo.' },
            { icon: <Send size={26} />, color: '#30d158', title: 'Contato salvo', desc: 'Nome, foto, telefone e links vão direto para a agenda em um toque.' },
          ].map((step) => (
            <div key={step.title} className="text-center">
              <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ background: step.color }}>{step.icon}</span>
              <h4 className="mb-2 text-[21px] font-semibold tracking-tight">{step.title}</h4>
              <p className={`mx-auto max-w-[28ch] text-[15px] leading-snug ${isDark ? 'text-[#a1a1a6]' : 'text-[#6e6e73]'}`}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
