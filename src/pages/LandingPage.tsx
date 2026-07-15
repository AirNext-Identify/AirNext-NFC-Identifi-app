import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { useSiteImages } from '../hooks/useSiteImages';
import { isVideoUrl } from '../lib/media';
import {
  ChevronDown, ChevronRight, ShoppingBag, Nfc, QrCode,
  Shield, ArrowUp, Check, ArrowRight, ArrowLeft,
  Globe, MessageCircle, Camera, AtSign, Zap,
  Smartphone, Users, Send, X, Play,
  Leaf, Recycle, TreePine, Droplets, Heart,
  BookOpen, HelpCircle, LifeBuoy,
  Rocket, Eye, Target, Lock, Plus, Minus, Trash2, Search,
  Baby, Puzzle, Briefcase, Sun, Moon, Sparkles, Star, UserRound,
  Upload, Save, Palette, Image as ImageIcon, FolderOpen,
  CreditCard, KeyRound, Tag as TagIcon, Move, PawPrint, Building2,
  RotateCcw, RotateCw, ZoomIn, FlipHorizontal2, Share2, Loader2,
  Watch,
  Square,
  Circle,
  RectangleHorizontal,
  Monitor,
  Clipboard,
  ChevronUp,
  Phone, Wifi, AlertTriangle, Menu, Sparkle,
  Ticket, BedDouble, Gem, EyeOff, Link2
} from 'lucide-react';
type CP = React.CSSProperties & Record<string, string>;

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
interface CartItem {
  key: string;
  product: Product;
  formatId: string;
  formatLabel: string;
  quantity: number;
}

// --- Reusable Swipe Indicator ---
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

// --- Logo ---
function Logo({ dark = false, size = 'md' }: { dark?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
  return (
    <a href="#top" className={`flex items-center gap-0.5 font-lobster tracking-tight ${s}`}>
      <span className={dark ? 'text-white' : 'text-gray-900'}>Air</span>
      <span className="text-[#0071e3]">Next</span>
    </a>
  );
}

// --- AirNext product lines & physical formats ---
interface AirNextFormat {
  id: string;
  label: string;
  icon: React.ReactNode;
  shapeClass: string; // aspect + rounding for the live preview
}

const FORMATS: AirNextFormat[] = [
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
];

// Formatos que aceitam escolha livre de "corte" físico — quadrado, redondo ou
// retangular — usados por Tags e Adesivos (chaveiro, cartão e pulseira têm
// corte fixo por natureza do produto).
const SHAPEABLE_FORMATS = ['tag', 'adesivo'];

interface ShapeOption {
  id: 'quadrado' | 'redondo' | 'retangular';
  label: string;
  icon: React.ReactNode;
  shapeClass: string;
  dims: { radius: number; circle?: boolean; wRatio: number; hRatio: number };
}

const SHAPES: ShapeOption[] = [
  { id: 'quadrado', label: 'Quadrado', icon: <Square size={15} />, shapeClass: 'aspect-square rounded-[22px]', dims: { radius: 44, wRatio: 1, hRatio: 1 } },
  { id: 'redondo', label: 'Redondo', icon: <Circle size={15} />, shapeClass: 'aspect-square rounded-full', dims: { radius: 0, circle: true, wRatio: 1, hRatio: 1 } },
  { id: 'retangular', label: 'Retangular', icon: <RectangleHorizontal size={15} />, shapeClass: 'aspect-[3/4] rounded-[26px]', dims: { radius: 40, wRatio: 3, hRatio: 4 } },
];

interface Product {
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
}

const PRODUCTS: Product[] = [
  {
    id: 'pro', name: 'AirNext Pro', tag: 'Profissionais', price: 89,
    desc: 'Perfil digital para profissionais, autônomos e empreendedores.',
    longDesc: 'Compartilhe seu perfil completo — LinkedIn, portfólio, WhatsApp, Instagram e vCard — com uma simples aproximação. Ideal para quem vive de networking e quer causar impacto em reuniões e eventos.',
    img: 'https://images.pexels.com/photos/9122014/pexels-photo-9122014.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    color: '#0071e3', icon: <Briefcase size={22} />,
    formats: ['cartao', 'tag', 'chaveiro', 'pulseira', 'adesivo'], // todas as categorias disponíveis
    specs: ['Chip NFC NTAG216 · 888 bytes', 'QR Code Dinâmico', 'PVC Premium Matte', 'IP65 · À Prova d\'Água', 'Edição ilimitada do perfil'],
  },
  

  {
    id: 'stand', name: 'AirNext Stand', tag: 'Estabelecimentos', price: 129,
    desc: 'Centralizador de informações para estabelecimentos.',
    longDesc: 'Recepções, restaurantes e lojas concentram cardápio digital, Wi-Fi, avaliações e formas de pagamento em um único toque. Design minimalista com base antiderrapante para o balcão.',
    img: 'https://images.pexels.com/photos/5239822/pexels-photo-5239822.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    color: '#34c759', icon: <Building2 size={22} />,
    formats: ['cartao', 'tag', 'chaveiro', 'pulseira', 'adesivo'], // todas as categorias disponíveis
    specs: ['Base Acrílico Premium', 'Dual-Chip NFC', 'QR Code Estático + Dinâmico', 'Dashboard de analytics', 'Personalização com logo'],
  },
  {
    id: 'pet', name: 'AirNext Pet', tag: 'Pets', price: 69,
    desc: 'Identificação inteligente para pets.',
    longDesc: 'Se o seu pet se perder, qualquer pessoa pode ler a tag com o celular e ver contatos de emergência, informações de saúde e veterinário. Sem mensalidade, sem bateria.',
    img: 'https://images.pexels.com/photos/15075137/pexels-photo-15075137.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    color: '#ff9500', icon: <PawPrint size={22} />,
    formats: ['cartao', 'tag', 'chaveiro', 'pulseira', 'adesivo'], // todas as categorias disponíveis
    specs: ['Alumínio Aeronáutico', 'IP68 · Submersível', 'Argola de titânio', 'Dados veterinários', 'GPS compartilhável'],
  },
  {
    id: 'kids', name: 'AirNext Kids', tag: 'Crianças', price: 99,
    desc: 'Identificação digital para crianças.',
    longDesc: 'Segurança para crianças em parques, shoppings e eventos. Dados dos pais e contatos de emergência acessíveis por qualquer celular com um simples toque — sem apps.',
    img: 'https://images.pexels.com/photos/5275817/pexels-photo-5275817.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    color: '#af52de', icon: <Baby size={22} />,
    formats: ['cartao', 'tag', 'chaveiro', 'pulseira', 'adesivo'], // todas as categorias disponíveis
    specs: ['Silicone Hipoalergênico', 'Chip NFC NTAG213', 'Nome e foto de identificação', 'Resistente à água', 'Contato dos responsáveis'],
  },
  {
    id: 'senior', name: 'AirNext Senior', tag: 'Idosos', price: 99,
    desc: 'Identificação para idosos.',
    longDesc: 'Tecnologia acessível para idosos. Compartilhe endereço, contato de familiares, plano de saúde e dados médicos essenciais sem precisar de smartphone ou aplicativos.',
    img: 'https://images.pexels.com/photos/7394608/pexels-photo-7394608.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    color: '#ff3b30', icon: <Heart size={22} />,
    formats: ['cartao', 'tag', 'chaveiro', 'pulseira', 'adesivo'], // todas as categorias disponíveis
    specs: ['Dados do plano de saúde', 'Medicações em uso', 'Contato do médico', 'Endereço residencial', 'Leitura sem aplicativo'],
  },
  {
    id: 'tea', name: 'AirNext TEA', tag: 'Espectro Autista', price: 99,
    desc: 'Identificação para pessoas com Transtorno do Espectro Autista.',
    longDesc: 'Contém instruções de comunicação, sensibilidades sensoriais, contatos de emergência e dados médicos vitais para auxiliar pessoas no espectro autista em situações de crise.',
    img: 'https://images.pexels.com/photos/8944295/pexels-photo-8944295.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    color: '#00d2ff', icon: <Puzzle size={22} />,
    formats: ['cartao', 'tag', 'chaveiro', 'pulseira', 'adesivo'], // todas as categorias disponíveis
    specs: ['Instruções de comunicação', 'Sensibilidades sensoriais', 'Contato do cuidador', 'Dados médicos de emergência'],
  },
  // --- Segunda fileira: novas linhas AirNext, exibidas na seção própria logo
  // abaixo de "Produtos" (ver ORIGINAL_LINE_IDS / seção "Mais Produtos").
  // Continuam no mesmo array PRODUCTS de propósito: assim carrinho, busca e
  // personalizador funcionam normalmente para elas também, sem código extra.
  {
    id: 'tag', name: 'AirNext Tag', tag: 'Multiuso', price: 69,
    desc: 'Tag NFC universal para bagagens, mochilas, chaves e objetos do dia a dia.',
    longDesc: 'Compacta e resistente, a AirNext Tag identifica qualquer objeto — malas, mochilas, bicicletas, notebooks e muito mais. Quem encontrar aproxima o celular e acessa seus dados de contato na hora, sem precisar instalar nenhum aplicativo.',
    img: 'https://files.catbox.moe/ucabuc.png',
    color: '#eab308', icon: <TagIcon size={22} />,
    formats: ['cartao', 'tag', 'chaveiro', 'pulseira', 'adesivo'],
    specs: ['Chip NFC NTAG213', 'QR Code de backup', 'Resistente à água e riscos', 'Fácil de fixar em qualquer objeto', 'Ideal para bagagens, chaves e pets'],
  },
  {
    id: 'corporate', name: 'AirNext Corporate', tag: 'Empresas', price: 99,
    desc: 'Crachás e cartões NFC inteligentes para equipes e colaboradores.',
    longDesc: 'Emita identidade digital para toda a equipe: crachá com NFC, controle de acesso, perfil corporativo e dados de contato centralizados — tudo com a marca da sua empresa.',
    img: 'https://files.catbox.moe/m8gpmb.png',
    color: '#5e17eb', icon: <Users size={22} />,
    formats: ['cartao', 'tag', 'chaveiro', 'pulseira', 'adesivo'],
    specs: ['Emissão em lote para equipes', 'Perfil corporativo com marca própria', 'Chip NFC NTAG216 · 888 bytes', 'QR Code Dinâmico', 'Dashboard de gestão'],
  },
  
  {
    id: 'evento', name: 'AirNext Evento', tag: 'Eventos', price: 0,
    desc: 'Crachás inteligentes para congressos, feiras e eventos.',
    longDesc: 'Participantes trocam contato, acessam a programação e fazem check-in com um toque. Ideal para congressos, feiras e eventos corporativos que quere reduzir fricção.',
    img: 'https://files.catbox.moe/bp85o5.png',
    color: '#ff2d55', icon: <Ticket size={22} />,
    formats: ['cartao', 'tag', 'chaveiro', 'pulseira', 'adesivo'],
    specs: ['Check-in por aproximação', 'Programação e mapa do evento', 'QR Code de backup', 'Networking pós-evento', 'PVC Premium Matte'],
  },
  {
    id: 'hotel', name: 'AirNext Hotel', tag: 'Hotelaria', price: 129,
    desc: 'Centralize todas as informações da hospedagem em uma placa NFC inteligente no quarto.',
    longDesc: 'Com um simples toque, o hóspede acessa Wi-Fi, cardápio, serviços, avaliações, atrações locais, regras da hospedagem, checkout e outras informações importantes — tudo atualizado em tempo real, sem precisar imprimir materiais.',
    img: '//src/public/Hotel (1).png',
    color: '#00c2a8', icon: <BedDouble size={22} />,
    formats: ['placa', 'cartao', 'display'],
    specs: ['Wi-Fi e informações do quarto', 'Cardápio e Room Service', 'Solicitação de serviços', 'Avaliações e feedback dos hóspedes', 'Atrações, mapas e recomendações locais'],
  },
];

// IDs das 6 linhas originais — usados para manter a vitrine principal e o
// carrossel "Veja o AirNext em ação" exatamente como eram, mesmo com os
// novos produtos acima presentes no mesmo array PRODUCTS.
const ORIGINAL_LINE_IDS = ['pro', 'stand', 'pet', 'kids', 'senior', 'tea'];

// Curated colour palette offered in the customizer — kept separate from each
// line's default brand colour so a client can pick *any* card colour freely.
const CUSTOM_COLORS = [
  '#0071e3', '#34c759', '#ff9500', '#ff3b30', '#af52de', '#00d2ff',
  '#ff2d55', '#30d158', '#5856d6', '#ffd60a', '#1c1c1e', '#ffffff',
];

// =====================================================================
// --- Personalizador AirNext: interactive multi-format customizer ---
// Lets the client pick a product line, physical format, colour, and a
// freely-positionable/zoomable/rotatable photo for BOTH sides (frente e
// verso) of the piece, save the project locally, and send the finished
// mockup (both sides) straight to AirNext's WhatsApp for production.
// =====================================================================
interface SideState {
  image: string | null;
  offset: { x: number; y: number };
  scaleX: number;
  scaleY: number;
  rotation: number;
  text: string; // opcional — nome, telefone, instrução etc.
  textOffset: { x: number; y: number }; // cliente pode arrastar o texto livremente sobre a peça
  showQr: boolean; // opcional — cliente decide se quer QR Code impresso neste lado
  qrOffset: { x: number; y: number }; // cliente pode arrastar o QR Code livremente também
}

interface SavedProject {
  id: number;
  lineId: string;
  lineName: string;
  formatId: string;
  formatLabel: string;
  shapeId?: string;
  shapeLabel?: string;
  color: string;
  sides: { front: SideState; back: SideState };
  createdAt: string;
}

const CUSTOM_PROJECTS_KEY = 'airnext_custom_projects_v2';
const AIRNEXT_WHATSAPP = '5547996287761';

const emptySide = (): SideState => ({ image: null, offset: { x: 0, y: 0 }, scaleX: 1, scaleY: 1, rotation: 0, text: '', textOffset: { x: 0, y: 0 }, showQr: false, qrOffset: { x: 0, y: 0 } });

// Resize + compress an uploaded image client-side before it's ever stored,
// so previews stay high quality on screen while saved projects remain small
// enough to persist reliably (this is what was silently failing before).
function compressImage(dataUrl: string, maxDim = 1200, quality = 0.92): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else { width = Math.round((width * maxDim) / height); height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas indisponível')); return; }
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Falha ao carregar a imagem'));
    img.src = dataUrl;
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar imagem'));
    img.src = src;
  });
}

// Dimensões em alta definição — prontas para produção/impressão, não só tela.
const CANVAS_DIMS: Record<string, { w: number; h: number; radius: number; circle?: boolean }> = {
  cartao: { w: 1800, h: 1134, radius: 92 },
  tag: { w: 960, h: 1280, radius: 112 },
  placa: { w: 1800, h: 1134, radius: 92 },
  chaveiro: { w: 1040, h: 1040, radius: 104 },
  display: { w: 1800, h: 1134, radius: 92 },
  pulseira: { w: 1800, h: 500, radius: 250 },
  adesivo: { w: 1040, h: 1040, radius: 520, circle: true },
};
const FORMAT_ORDER = [
  'cartao',
  'placa',
  'display',
  'tag',
  'chaveiro',
  'pulseira',
  'adesivo',
];
// Tag e Adesivo aceitam um "corte" físico escolhido pelo cliente
// (quadrado, redondo ou retangular) — isso muda as dimensões do canvas final.
function getCanvasDims(formatId: string, shape?: ShapeOption): { w: number; h: number; radius: number; circle?: boolean } {
  const base = CANVAS_DIMS[formatId] || CANVAS_DIMS.cartao;
  if (!shape || !SHAPEABLE_FORMATS.includes(formatId)) return base;
  const size = 1120;
  if (shape.id === 'redondo') return { w: size, h: size, radius: size / 2, circle: true };
  if (shape.id === 'retangular') return { w: 960, h: 1280, radius: 80 };
  return { w: size, h: size, radius: 88 }; // quadrado
}

// Desenha um pequeno ícone de "ondas de aproximação" (NFC) no canvas —
// o símbolo padrão AirNext que aparece em toda peça personalizada.
function drawNfcGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineCap = 'round';
  [0.55, 0.95, 1.35].forEach((r, i) => {
    ctx.beginPath();
    ctx.lineWidth = scale * 0.16;
    ctx.arc(0, 0, r * scale, -0.95, -0.15);
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.arc(0, 0, scale * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Desenha um pequeno selo "QR incluso" — representação simplificada usada
// apenas na prévia/mockup; o QR real e funcional é gerado pela produção.
function drawQrBadge(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  const r = size * 0.14;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + size, y, x + size, y + size, r);
  ctx.arcTo(x + size, y + size, x, y + size, r);
  ctx.arcTo(x, y + size, x, y, r);
  ctx.arcTo(x, y, x + size, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#111';
  const cells = 5;
  const pad = size * 0.14;
  const cell = (size - pad * 2) / cells;
  const pattern = [
    [1, 1, 1, 0, 1], [1, 0, 1, 0, 1], [1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1], [1, 0, 1, 0, 1],
  ];
  for (let r0 = 0; r0 < cells; r0++) {
    for (let c0 = 0; c0 < cells; c0++) {
      if (pattern[r0][c0]) ctx.fillRect(x + pad + c0 * cell, y + pad + r0 * cell, cell * 0.9, cell * 0.9);
    }
  }
  ctx.restore();
}

function tracePath(ctx: CanvasRenderingContext2D, w: number, h: number, d: { radius: number; circle?: boolean }) {
  ctx.beginPath();
  if (d.circle) {
    ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
  } else {
    const r = d.radius;
    ctx.moveTo(r, 0);
    ctx.arcTo(w, 0, w, h, r);
    ctx.arcTo(w, h, 0, h, r);
    ctx.arcTo(0, h, 0, 0, r);
    ctx.arcTo(0, 0, w, 0, r);
  }
  ctx.closePath();
}

// Renders one face (frente/verso) to a high-resolution canvas, replicating
// exactly what the on-screen preview shows (same offset/scale/rotation math).
async function renderSideToCanvas(
  side: SideState,
  formatId: string,
  color: string,
  lineName: string,
  formatLabel: string,
  previewWidthPx: number,
  shape?: ShapeOption
): Promise<string> {
  const d = getCanvasDims(formatId, shape);
  const canvas = document.createElement('canvas');
  canvas.width = d.w;
  canvas.height = d.h;
  const ctx = canvas.getContext('2d')!;

  ctx.save();
  tracePath(ctx, d.w, d.h, d);
  ctx.clip();

  const grad = ctx.createLinearGradient(0, 0, d.w, d.h);
  grad.addColorStop(0, color);
  grad.addColorStop(1, `${color}cc`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, d.w, d.h);

  if (side.image) {
    const img = await loadImage(side.image);
    const scaleFactor = d.w / Math.max(previewWidthPx, 1);
    const baseScale = Math.max(d.w / img.width, d.h / img.height);
    ctx.save();
    ctx.translate(d.w / 2, d.h / 2);
    ctx.translate(side.offset.x * scaleFactor, side.offset.y * scaleFactor);
    ctx.rotate((side.rotation * Math.PI) / 180);
    ctx.scale(side.scaleX, side.scaleY);
    const drawW = img.width * baseScale;
    const drawH = img.height * baseScale;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    const overlay = ctx.createLinearGradient(0, d.h * 0.45, 0, d.h);
    overlay.addColorStop(0, 'rgba(0,0,0,0)');
    overlay.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, d.w, d.h);
  }

  // Símbolo de aproximação padrão AirNext + nome da marca, em fonte Lobster —
  // presente em TODAS as categorias/formatos, sempre no canto superior esquerdo.
  await document.fonts.load(`${Math.round(d.w * 0.04)}px Lobster`);
  drawNfcGlyph(ctx, d.w * 0.075, d.h * 0.085, d.w * 0.018);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = `${Math.round(d.w * 0.04)}px Lobster, cursive`;
  ctx.textBaseline = 'middle';
  ctx.fillText('AirNext', d.w * 0.115, d.h * 0.095);
  ctx.textBaseline = 'alphabetic';

  // Texto (nome/instrução) é opcional e segue exatamente a posição que o
  // cliente escolheu ao arrastar livremente na prévia — âncora central seleada
  // (igual à prévia), segura em qualquer formato, inclusive redondo.
  if (side.text) {
    const scaleFactor = d.w / Math.max(previewWidthPx, 1);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(d.w * 0.05)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const baseX = d.w * 0.5 + side.textOffset.x * scaleFactor;
    const baseY = d.h * 0.55 + side.textOffset.y * scaleFactor;
    ctx.fillText(side.text, baseX, baseY);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // QR Code também é opcional — só entra na peça se o cliente marcar a opção,
  // e respeita a posição livre escolhida pelo cliente.
  if (side.showQr) {
    const scaleFactor = d.w / Math.max(previewWidthPx, 1);
    const qrSize = Math.min(d.w, d.h) * 0.16;
    const centerX = d.w * 0.5 + side.qrOffset.x * scaleFactor;
    const centerY = d.h * 0.78 + side.qrOffset.y * scaleFactor;
    drawQrBadge(ctx, centerX - qrSize / 2, centerY - qrSize / 2, qrSize);
  }

  ctx.restore();
  return canvas.toDataURL('image/png');
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
}

function PersonalizadorSection({ isDark, preset }: { isDark: boolean; preset?: { lineId: string; formatId: string; nonce: number } | null }) {
  const [selectedLine, setSelectedLine] = useState<Product>(PRODUCTS[0]);
  const availableFormats = FORMATS.filter(f => selectedLine.formats.includes(f.id));
  const [selectedFormat, setSelectedFormat] = useState<AirNextFormat>(availableFormats[0]);
  const [shape, setShape] = useState<ShapeOption>(SHAPES[0]);
  const [color, setColor] = useState(selectedLine.color);
  const [sides, setSides] = useState<{ front: SideState; back: SideState }>({ front: emptySide(), back: emptySide() });
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lockAspect, setLockAspect] = useState(true);
  // No mobile a prévia fica "flutuando" fixa na tela enquanto o cliente edita,
  // e pode ser minimizada para não atrapalhar os campos de edição.
  const [mobilePreviewMinimized, setMobilePreviewMinimized] = useState(false);

  // --- Configurador em tela cheia ---------------------------------------
  // Inspirado no padrão usado por grandes marcas (ex.: Apple Watch Studio,
  // Nike By You): a ferramenta fica escondida por trás de uma vitrine/teaser
  // na página, e só assume a tela inteira — como uma "página dentro da
  // página" — quando o cliente decide personalizar. Dentro dela, o processo
  // vira um wizard guiado por etapas, com prévia ao vivo sempre visível.
  const [isOpen, setIsOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const WIZARD_STEPS = [
    { label: 'Linha', icon: <Briefcase size={14} /> },
    { label: 'Formato', icon: <TagIcon size={14} /> },
    { label: 'Cor', icon: <Palette size={14} /> },
    { label: 'Foto & Texto', icon: <ImageIcon size={14} /> },
    { label: 'Revisar', icon: <Check size={14} /> },
  ];
  const lastStep = WIZARD_STEPS.length - 1;
  const goToStep = (n: number) => setWizardStep(Math.max(0, Math.min(lastStep, n)));
  const openWizard = () => { setIsOpen(true); setWizardStep(0); };
  const closeWizard = () => setIsOpen(false);

  // Trava o scroll da página por trás enquanto o configurador em tela cheia
  // está aberto — reforça a sensação de "outra página" sobre a atual.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const isShapeable = SHAPEABLE_FORMATS.includes(selectedFormat.id);
  const effectiveShapeClass = isShapeable ? shape.shapeClass : selectedFormat.shapeClass;

  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const textDragState = useRef<{ startX: number; startY: number; origX: number; origY: number; side: 'front' | 'back' } | null>(null);
  const qrDragState = useRef<{ startX: number; startY: number; origX: number; origY: number; side: 'front' | 'back' } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const current = sides[activeSide];
  const updateSide = (patch: Partial<SideState>, side: 'front' | 'back' = activeSide) => {
    setSides(prev => ({ ...prev, [side]: { ...prev[side], ...patch } }));
  };

  // Load previously saved client projects on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_PROJECTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const migrated = parsed.map((p: any) => ({
          ...p,
          sides: {
            front: { ...emptySide(), ...p.sides?.front, scaleX: p.sides?.front?.scaleX ?? p.sides?.front?.scale ?? 1, scaleY: p.sides?.front?.scaleY ?? p.sides?.front?.scale ?? 1, textOffset: p.sides?.front?.textOffset ?? { x: 0, y: 0 }, qrOffset: p.sides?.front?.qrOffset ?? { x: 0, y: 0 }, showQr: p.sides?.front?.showQr ?? false },
            back: { ...emptySide(), ...p.sides?.back, scaleX: p.sides?.back?.scaleX ?? p.sides?.back?.scale ?? 1, scaleY: p.sides?.back?.scaleY ?? p.sides?.back?.scale ?? 1, textOffset: p.sides?.back?.textOffset ?? { x: 0, y: 0 }, qrOffset: p.sides?.back?.qrOffset ?? { x: 0, y: 0 }, showQr: p.sides?.back?.showQr ?? false },
          },
        }));
        setSavedProjects(migrated);
      }
    } catch (err) {
      console.error('Não foi possível carregar projetos salvos:', err);
    }
  }, []);

  const selectLine = (line: Product) => {
    setSelectedLine(line);
    const formatsForLine = FORMATS.filter(f => line.formats.includes(f.id));
    setSelectedFormat(formatsForLine[0]);
    setColor(line.color);
  };

  // When the shop/cart asks to personalize a specific line+format, jump straight to it.
  useEffect(() => {
    if (!preset) return;
    const line = PRODUCTS.find(l => l.id === preset.lineId);
    if (!line) return;
    const formatsForLine = FORMATS.filter(f => line.formats.includes(f.id));
    const format = formatsForLine.find(f => f.id === preset.formatId) || formatsForLine[0];
    setSelectedLine(line);
    setSelectedFormat(format);
    setColor(line.color);
    setWizardStep(0);
    setIsOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset?.nonce]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Selecione um arquivo de imagem válido.');
      return;
    }
    setUploadError(null);
    setUploading(true);
    const sideAtUploadTime = activeSide;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const raw = reader.result as string;
        const compressed = await compressImage(raw);
        updateSide({ image: compressed, offset: { x: 0, y: 0 }, scaleX: 1, scaleY: 1, rotation: 0 }, sideAtUploadTime);
      } catch (err) {
        console.error(err);
        setUploadError('Não foi possível processar essa imagem. Tente outra.');
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Falha ao ler o arquivo.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!current.image) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: current.offset.x, origY: current.offset.y };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    updateSide({ offset: { x: dragState.current.origX + dx, y: dragState.current.origY + dy } });
  };
  const onPointerUp = () => { dragState.current = null; };

  // Funcionalidade extra: zoom da foto direto com o scroll do mouse (desktop),
  // sem precisar usar o slider — some agilidade a mais no ajuste da imagem.
  const onImageWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!current.image) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const nextX = Math.min(3, Math.max(0.3, current.scaleX + delta));
    const nextY = lockAspect ? nextX : Math.min(3, Math.max(0.3, current.scaleY + delta));
    updateSide({ scaleX: nextX, scaleY: nextY });
  };

  // Funcionalidade extra: espelhar a foto horizontalmente (útil para fotos de rosto/logo invertidos)
  const flipImageHorizontal = () => updateSide({ scaleX: current.scaleX * -1 });

  // Arraste livre do texto — funciona igual ao da foto, mas move só o texto
  const onTextPointerDown = (e: React.PointerEvent<HTMLParagraphElement>, sideKey: 'front' | 'back') => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    textDragState.current = { startX: e.clientX, startY: e.clientY, origX: sides[sideKey].textOffset.x, origY: sides[sideKey].textOffset.y, side: sideKey };
  };
  const onTextPointerMove = (e: React.PointerEvent<HTMLParagraphElement>) => {
    if (!textDragState.current) return;
    e.stopPropagation();
    const dx = e.clientX - textDragState.current.startX;
    const dy = e.clientY - textDragState.current.startY;
    updateSide({ textOffset: { x: textDragState.current.origX + dx, y: textDragState.current.origY + dy } }, textDragState.current.side);
  };
  const onTextPointerUp = () => { textDragState.current = null; };

  // Arraste livre do QR Code — mesma lógica, elemento independente
  const onQrPointerDown = (e: React.PointerEvent<HTMLDivElement>, sideKey: 'front' | 'back') => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    qrDragState.current = { startX: e.clientX, startY: e.clientY, origX: sides[sideKey].qrOffset.x, origY: sides[sideKey].qrOffset.y, side: sideKey };
  };
  const onQrPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!qrDragState.current) return;
    e.stopPropagation();
    const dx = e.clientX - qrDragState.current.startX;
    const dy = e.clientY - qrDragState.current.startY;
    updateSide({ qrOffset: { x: qrDragState.current.origX + dx, y: qrDragState.current.origY + dy } }, qrDragState.current.side);
  };
  const onQrPointerUp = () => { qrDragState.current = null; };

  const saveProject = () => {
    try {
      const project: SavedProject = {
        id: Date.now(),
        lineId: selectedLine.id,
        lineName: selectedLine.name,
        formatId: selectedFormat.id,
        formatLabel: selectedFormat.label,
        shapeId: isShapeable ? shape.id : undefined,
        shapeLabel: isShapeable ? shape.label : undefined,
        color,
        sides,
        createdAt: new Date().toISOString(),
      };
      const updated = [project, ...savedProjects].slice(0, 12);
      localStorage.setItem(CUSTOM_PROJECTS_KEY, JSON.stringify(updated));
      setSavedProjects(updated);
      setSaveStatus('success');
    } catch (err) {
      console.error('Erro ao salvar projeto:', err);
      setSaveStatus('error');
    } finally {
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const loadProject = (p: SavedProject) => {
    const line = PRODUCTS.find(l => l.id === p.lineId) || PRODUCTS[0];
    const formatsForLine = FORMATS.filter(f => line.formats.includes(f.id));
    const format = formatsForLine.find(f => f.id === p.formatId) || formatsForLine[0];
    setSelectedLine(line);
    setSelectedFormat(format);
    if (p.shapeId) setShape(SHAPES.find(s => s.id === p.shapeId) || SHAPES[0]);
    setColor(p.color);
    setSides(p.sides);
    setActiveSide('front');
    setWizardStep(3);
    setIsOpen(true);
  };

  const deleteProject = (id: number) => {
    const updated = savedProjects.filter(p => p.id !== id);
    setSavedProjects(updated);
    try {
      localStorage.setItem(CUSTOM_PROJECTS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Gera um número de pedido curto e legível a partir do timestamp.
  const genOrderNumber = () => `AN-${Date.now().toString().slice(-6)}`;

  const handleSendWhatsApp = async () => {
    setSending(true);
    setSendError(null);
    try {
      const previewWidth = previewRef.current?.getBoundingClientRect().width || 400;
      const frontDataUrl = await renderSideToCanvas(sides.front, selectedFormat.id, color, selectedLine.name, selectedFormat.label, previewWidth, shape);
      const backDataUrl = await renderSideToCanvas(sides.back, selectedFormat.id, color, selectedLine.name, selectedFormat.label, previewWidth, shape);

      const now = new Date();
      const orderNumber = genOrderNumber();
      const dataHora = now.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

      // Resumo completo do pedido — gerado automaticamente com todas as
      // informações do projeto (linha, formato, corte, cor, textos
      // opcionais, QR opcional) mais número do pedido e data/hora.
      const summary =
        `Olá! Finalizei a personalização do meu projeto AirNext e quero enviar para produção:\n\n` +
        `🧾 Pedido: ${orderNumber}\n` +
        `📅 Data/Hora: ${dataHora}\n\n` +
        `• Linha: ${selectedLine.name}\n` +
        `• Formato: ${selectedFormat.label}${isShapeable ? ` (corte ${shape.label.toLowerCase()})` : ''}\n` +
        `• Cor: ${color}\n` +
        `• Texto (frente): ${sides.front.text || 'não informado (opcional)'}\n` +
        `• QR Code (frente): ${sides.front.showQr ? 'Sim, incluir' : 'Não incluir'}\n` +
        `• Texto (verso): ${sides.back.text || 'não informado (opcional)'}\n` +
        `• QR Code (verso): ${sides.back.showQr ? 'Sim, incluir' : 'Não incluir'}\n\n` +
        `Seguem as imagens de frente e verso do projeto completo.`;

      const frontFile = await dataUrlToFile(frontDataUrl, `airnext-${orderNumber}-frente.png`);
      const backFile = await dataUrlToFile(backDataUrl, `airnext-${orderNumber}-verso.png`);

      const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean; share?: (data: ShareData) => Promise<void> };

      if (nav.canShare && nav.share && nav.canShare({ files: [frontFile, backFile] })) {
        await nav.share({ files: [frontFile, backFile], title: `Pedido AirNext ${orderNumber}`, text: summary });
      } else {
        // Browsers can't attach files to a wa.me link directly, so we download
        // both mockups and open WhatsApp with the message ready to send.
        downloadDataUrl(frontDataUrl, `airnext-${orderNumber}-frente.png`);
        downloadDataUrl(backDataUrl, `airnext-${orderNumber}-verso.png`);
        const waUrl = `https://wa.me/${AIRNEXT_WHATSAPP}?text=${encodeURIComponent(
          `${summary}\n\n(As duas imagens foram baixadas no seu dispositivo — é só anexá-las aqui na conversa)`
        )}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Erro ao preparar envio:', err);
        setSendError('Não foi possível preparar o envio. Tente novamente.');
      }
    } finally {
      setSending(false);
    }
  };

  const cardShapeExtra =
    selectedFormat.id === 'chaveiro' ? 'max-w-[200px] sm:max-w-[240px]' :
    selectedFormat.id === 'pulseira' ? 'max-w-[300px] sm:max-w-[360px]' :
    isShapeable ? 'max-w-[200px] sm:max-w-[240px]' : // tag / adesivo, quadrado/redondo/retangular
    'max-w-sm sm:max-w-md'; // cartão

  const renderFace = (sideKey: 'front' | 'back') => {
    const s = sides[sideKey];
    const isActive = activeSide === sideKey;
    return (
      <div
        className={`absolute inset-0 ${effectiveShapeClass} overflow-hidden select-none border shadow-2xl`}
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
          touchAction: 'none',
          backfaceVisibility: 'hidden',
          transform: sideKey === 'back' ? 'rotateY(180deg)' : undefined,
          pointerEvents: isActive ? 'auto' : 'none',
        }}
        onPointerDown={isActive ? onPointerDown : undefined}
        onPointerMove={isActive ? onPointerMove : undefined}
        onPointerUp={isActive ? onPointerUp : undefined}
        onPointerLeave={isActive ? onPointerUp : undefined}
        onWheel={isActive ? onImageWheel : undefined}
      >
        {s.image ? (
          <img
            src={s.image}
            alt={`Personalização — ${sideKey === 'front' ? 'frente' : 'verso'}`}
            draggable={false}
            className={`absolute inset-0 w-full h-full object-cover ${isActive ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={{ transform: `translate(${s.offset.x}px, ${s.offset.y}px) rotate(${s.rotation}deg) scale(${s.scaleX}, ${s.scaleY})`, transition: dragState.current ? 'none' : 'transform 0.05s linear' }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/90 p-6 text-center">
            <ImageIcon size={28} className="opacity-70" />
            <p className="text-xs font-semibold opacity-80">Envie uma foto para o {sideKey === 'front' ? 'frente' : 'verso'}</p>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/10 pointer-events-none" />

        {selectedFormat.id === 'chaveiro' && (
          <div className={`absolute top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 ${isDark ? 'border-white/50 bg-[#121212]' : 'border-white/70 bg-white'}`} />
        )}
        {selectedFormat.id === 'tag' && (
          <div className={`absolute top-4 right-4 w-4 h-4 rounded-full border-2 ${isDark ? 'border-white/50 bg-[#121212]' : 'border-white/70 bg-white'}`} />
        )}

        <div className="absolute top-4 left-4 flex items-center gap-1.5 text-white/90">
          <Nfc size={16} />
          <span style={{ fontFamily: "'Lobster', cursive" }} className="text-sm tracking-wide leading-none translate-y-[1px]">AirNext</span>
        </div>

        {/* Indicador de lado — só um pontinho discreto, sem texto poluindo a peça */}
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${sideKey === 'front' ? 'bg-white' : 'bg-white/35'}`} />
          <span className={`w-1.5 h-1.5 rounded-full ${sideKey === 'back' ? 'bg-white' : 'bg-white/35'}`} />
        </div>

        {/* QR Code opcional — âncora sempre no centro visível da peça (segura em qualquer
            formato, inclusive redondo), e arrastável livremente pelo cliente a partir daí */}
        {s.showQr && (
          <div
            onPointerDown={isActive ? (e) => onQrPointerDown(e, sideKey) : undefined}
            onPointerMove={isActive ? onQrPointerMove : undefined}
            onPointerUp={isActive ? onQrPointerUp : undefined}
            onPointerLeave={isActive ? onQrPointerUp : undefined}
            className={`absolute w-9 h-9 rounded-lg bg-white/95 flex items-center justify-center shadow-lg ${isActive ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={{
              left: '50%',
              top: '78%',
              transform: `translate(-50%, -50%) translate(${s.qrOffset.x}px, ${s.qrOffset.y}px)`,
              transition: qrDragState.current ? 'none' : 'transform 0.05s linear',
              touchAction: 'none',
              pointerEvents: isActive ? 'auto' : 'none',
            }}
          >
            <QrCode size={18} className="text-black" />
          </div>
        )}

        {/* Texto totalmente opcional e arrastável livremente pelo cliente — âncora central
            visível (segura em qualquer formato, inclusive redondo). Some por completo quando
            vazio, sem placeholder poluindo a peça. */}
        {s.text && (
          <p
            onPointerDown={isActive ? (e) => onTextPointerDown(e, sideKey) : undefined}
            onPointerMove={isActive ? onTextPointerMove : undefined}
            onPointerUp={isActive ? onTextPointerUp : undefined}
            onPointerLeave={isActive ? onTextPointerUp : undefined}
            className={`absolute max-w-[80%] text-center text-white text-lg font-bold leading-tight drop-shadow-md whitespace-nowrap ${isActive ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={{
              left: '50%',
              top: '55%',
              transform: `translate(-50%, -50%) translate(${s.textOffset.x}px, ${s.textOffset.y}px)`,
              transition: textDragState.current ? 'none' : 'transform 0.05s linear',
              touchAction: 'none',
              pointerEvents: isActive ? 'auto' : 'none',
            }}
          >
            {s.text}
          </p>
        )}
      </div>
    );
  };

  return (
    <section id="personalizado" className={`relative transition-colors duration-500 ${isDark ? 'bg-[#121212] text-white' : 'bg-white text-gray-900'}`}>
      {/* ---------------- Vitrine / gatilho (a ferramenta fica "escondida" aqui) ----------------
          Mesmo padrão usado por grandes marcas para configuradores de produto (ex.: Apple
          Watch Studio, Nike By You): na página só existe um convite elegante — o construtor
          completo só assume a tela, como uma "página dentro da página", quando o cliente
          decide personalizar. */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-20 md:py-28 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="eyebrow text-[#0071e3] mb-3">Personalização Total</p>
            <h2 className="h2-apple mb-5">Monte o seu AirNext, ao vivo.</h2>
            <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'} max-w-lg mb-8`}>
              Escolha a linha, o formato físico, a cor e a sua própria foto de frente e verso.
              Acompanhe o resultado em tempo real, num configurador em tela cheia — a mesma
              experiência que marcas como Apple e Nike usam para personalizar produtos — e
              envie direto para produção pelo WhatsApp.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <button
                onClick={openWizard}
                className="inline-flex items-center gap-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white px-8 py-4 rounded-full text-sm font-bold transition shadow-xl shadow-blue-500/25"
              >
                <Palette size={17} /> Personalizar agora
              </button>
              <span className={`text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                5 linhas · 5 formatos · cor e foto 100% livres
              </span>
            </div>

            {/* Meus projetos salvos — retomar de onde parou, sem abrir a ferramenta inteira */}
            {savedProjects.length > 0 && (
              <div className={`mt-10 pt-8 border-t border-dashed ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FolderOpen size={14} /> Meus projetos salvos ({savedProjects.length})
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {savedProjects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => loadProject(p)}
                      className={`flex-shrink-0 w-28 rounded-2xl border overflow-hidden text-left transition hover:-translate-y-0.5 ${isDark ? 'bg-[#050505] border-white/10' : 'bg-white border-gray-100'}`}
                    >
                      <div className="relative h-16" style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)` }}>
                        {p.sides.front.image && <img src={p.sides.front.image} alt={p.lineName} className="absolute inset-0 w-full h-full object-cover opacity-90" />}
                      </div>
                      <div className="p-2">
                        <p className={`text-[10px] font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.lineName}</p>
                        <p className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{p.formatLabel}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Vitrine visual — várias peças/formatos, convite para abrir o configurador */}
          <button
            onClick={openWizard}
            className={`group relative w-full aspect-[4/3] rounded-[32px] overflow-hidden border text-left transition-shadow shadow-lg hover:shadow-2xl ${isDark ? 'border-white/10' : 'border-gray-200'}`}
            style={{ background: `linear-gradient(135deg, ${selectedLine.color}, ${selectedLine.color}99)` }}
          >
            <div className="absolute inset-0 flex items-center justify-center gap-5 sm:gap-7 p-8">
              {FORMATS.slice(0, 3).map((f, i) => (
                <div
                  key={f.id}
                  className={`bg-white/15 backdrop-blur-sm border border-white/25 shadow-xl flex items-center justify-center text-white/90 ${f.shapeClass}`}
                  style={{ width: i === 1 ? '34%' : '24%', transform: `rotate(${i === 0 ? -8 : i === 2 ? 8 : 0}deg) translateY(${i === 1 ? '-6px' : '0'})` }}
                >
                  {f.icon}
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/10" />
            <div className="absolute top-5 left-5 flex items-center gap-1.5 text-white/90">
              <Nfc size={15} />
              <span style={{ fontFamily: "'Lobster', cursive" }} className="text-xs tracking-wide leading-none translate-y-[1px]">AirNext</span>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-6 flex items-center justify-between gap-3">
              <span className="text-white font-bold text-sm">Toque para abrir o configurador</span>
              <span className="w-10 h-10 rounded-full bg-white/20 group-hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white transition">
                <ArrowRight size={16} />
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ---------------- Configurador em tela cheia (wizard guiado por etapas) ---------------- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`fixed inset-0 z-[200] flex flex-col ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}`}
          >
            {/* Top bar — fechar + progresso das etapas, como num configurador Apple/Nike */}
            <div className={`flex-shrink-0 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
                <button
                  onClick={closeWizard}
                  className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-full transition ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                >
                  <X size={16} /> <span className="hidden sm:inline">Fechar</span>
                </button>

                <div className="hidden md:flex items-center gap-1">
                  {WIZARD_STEPS.map((s, i) => (
                    <button
                      key={s.label}
                      onClick={() => goToStep(i)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition ${
                        i === wizardStep
                          ? 'bg-[#0071e3] text-white'
                          : i < wizardStep
                            ? (isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                            : (isDark ? 'text-gray-600' : 'text-gray-300')
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${i === wizardStep ? 'bg-white/25' : isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                        {i < wizardStep ? <Check size={10} /> : i + 1}
                      </span>
                      {s.label}
                    </button>
                  ))}
                </div>

                <p className={`text-xs font-bold truncate max-w-[40%] text-right ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedLine.name} · {selectedFormat.label}
                </p>
              </div>
              {/* Barra de progresso — visível no mobile no lugar dos labels */}
              <div className={`md:hidden h-1 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                <div className="h-full bg-[#0071e3] transition-all duration-300" style={{ width: `${((wizardStep + 1) / WIZARD_STEPS.length) * 100}%` }} />
              </div>
            </div>

            {/* Corpo — prévia ao vivo + conteúdo da etapa atual */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 md:py-10 grid lg:grid-cols-5 gap-10 md:gap-12 items-start">
                {/* ---------------- Prévia ao vivo ---------------- */}
                <div className="lg:col-span-2 order-1 lg:sticky lg:top-8 self-start">
                  <div className={`rounded-[28px] transition-all ${mobilePreviewMinimized ? 'p-2' : 'p-3 pb-4'} lg:p-0 lg:bg-transparent lg:border-0 lg:shadow-none ${isDark ? 'bg-[#121212] border border-white/10' : 'bg-[#f5f5f7] border border-gray-200'}`}>
                    <button
                      onClick={() => setMobilePreviewMinimized(v => !v)}
                      className={`lg:hidden w-full flex items-center justify-between gap-2 px-2 py-1 mb-1 rounded-xl text-[11px] font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Eye size={13} /> Prévia ao vivo
                      </span>
                      <motion.span animate={{ rotate: mobilePreviewMinimized ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronUp size={15} />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {!mobilePreviewMinimized && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden lg:!h-auto lg:!opacity-100"
                        >
                          <div className="flex flex-col items-center gap-4 lg:gap-6 pt-1 lg:pt-0">
                            <div className="w-full flex justify-center" style={{ perspective: '1500px' }}>
                              <motion.div
                                ref={previewRef}
                                animate={{ rotateY: activeSide === 'front' ? 0 : 180 }}
                                transition={{ duration: 0.6, ease: 'easeInOut' }}
                                className={`w-full ${cardShapeExtra} mx-auto relative ${effectiveShapeClass} max-h-[34vh] lg:max-h-none`}
                                style={{ transformStyle: 'preserve-3d' }}
                              >
                                {renderFace('front')}
                                {renderFace('back')}
                              </motion.div>
                            </div>

                            <button
                              onClick={() => setActiveSide(activeSide === 'front' ? 'back' : 'front')}
                              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-200'}`}
                            >
                              <FlipHorizontal2 size={14} /> Virar para {activeSide === 'front' ? 'o verso' : 'a frente'}
                            </button>

                            <p className={`hidden lg:block text-xs text-center max-w-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              Arraste a foto, ajuste zoom e rotação para o enquadramento perfeito em cada lado.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ---------------- Conteúdo da etapa atual ---------------- */}
                <div className="lg:col-span-3 order-2 min-h-[380px] flex flex-col">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={wizardStep}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.25 }}
                      className="flex-1"
                    >
                      {/* Etapa 1 — Linha */}
                      {wizardStep === 0 && (
                        <div>
                          <h3 className="text-xl font-bold mb-1.5">Escolha a linha AirNext</h3>
                          <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cada linha tem um propósito — a personalização se adapta a ela.</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {PRODUCTS.map(line => (
                              <button
                                key={line.id}
                                onClick={() => selectLine(line)}
                                className={`p-4 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                                  selectedLine.id === line.id
                                    ? 'ring-2 ring-offset-2 shadow-md'
                                    : isDark ? 'border-white/10 hover:border-white/25' : 'border-gray-200 hover:border-gray-300'
                                }`}
                                style={selectedLine.id === line.id ? {
                                  borderColor: line.color,
                                  // @ts-ignore -- ring offset colour follows theme
                                  '--tw-ring-color': line.color,
                                  '--tw-ring-offset-color': isDark ? '#0a0a0a' : '#ffffff',
                                  background: isDark ? `${line.color}14` : `${line.color}0d`,
                                } as CP : undefined}
                              >
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${line.color}25`, color: line.color }}>
                                  {line.icon}
                                </div>
                                <div>
                                  <p className={`text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{line.name}</p>
                                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{line.tag}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Etapa 2 — Formato + corte físico */}
                      {wizardStep === 1 && (
                        <div>
                          <h3 className="text-xl font-bold mb-1.5">Escolha o formato</h3>
                          <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cartão, tag, chaveiro, pulseira ou adesivo NFC.</p>
                          <div className="flex flex-wrap gap-3">
                            {availableFormats.map(f => (
                              <button
                                key={f.id}
                                onClick={() => setSelectedFormat(f)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold transition ${
                                  selectedFormat.id === f.id
                                    ? 'bg-[#0071e3] text-white border-[#0071e3]'
                                    : isDark ? 'border-white/15 text-gray-300 hover:border-white/30' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                }`}
                              >
                                {f.icon} {f.label}
                              </button>
                            ))}
                          </div>

                          {isShapeable && (
                            <div className="mt-6">
                              <p className={`text-[11px] font-semibold mb-2.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Formato do corte da {selectedFormat.label.toLowerCase()}
                              </p>
                              <div className="flex flex-wrap gap-2.5">
                                {SHAPES.map(sh => (
                                  <button
                                    key={sh.id}
                                    onClick={() => setShape(sh)}
                                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[11px] font-bold transition ${
                                      shape.id === sh.id
                                        ? 'bg-[#0071e3] text-white border-[#0071e3]'
                                        : isDark ? 'border-white/15 text-gray-300 hover:border-white/30' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                    }`}
                                  >
                                    {sh.icon} {sh.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Etapa 3 — Cor */}
                      {wizardStep === 2 && (
                        <div>
                          <h3 className="text-xl font-bold mb-1.5">Escolha a cor</h3>
                          <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Uma paleta curada — ou qualquer cor que você preferir.</p>
                          <div className="flex flex-wrap items-center gap-3">
                            {CUSTOM_COLORS.map(c => (
                              <button
                                key={c}
                                onClick={() => setColor(c)}
                                aria-label={`Cor ${c}`}
                                className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2' : 'border-black/10'}`}
                                style={{
                                  background: c,
                                  borderColor: color === c ? c : undefined,
                                  // @ts-ignore
                                  '--tw-ring-color': c,
                                  '--tw-ring-offset-color': isDark ? '#0a0a0a' : '#ffffff',
                                } as CP}
                              />
                            ))}
                            <label className={`relative w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer overflow-hidden ${isDark ? 'border-white/20 bg-white/5' : 'border-gray-300 bg-gray-50'}`}>
                              <Palette size={16} className={isDark ? 'text-gray-300' : 'text-gray-600'} />
                              <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                aria-label="Escolher cor personalizada"
                              />
                            </label>
                            <span className={`text-xs font-mono px-2 py-1 rounded-lg ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{color}</span>
                          </div>
                        </div>
                      )}

                      {/* Etapa 4 — Foto (frente/verso) + texto opcional + QR */}
                      {wizardStep === 3 && (
                        <div className="space-y-8">
                          <div>
                            <h3 className="text-xl font-bold mb-1.5">Foto — frente e verso</h3>
                            <p className={`text-sm mb-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Envie, arraste, gire e dê zoom até ficar do seu jeito.</p>

                            <div className={`inline-flex p-1 rounded-full mb-4 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                              {(['front', 'back'] as const).map(k => (
                                <button
                                  key={k}
                                  onClick={() => setActiveSide(k)}
                                  className={`px-5 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                                    activeSide === k
                                      ? 'bg-[#0071e3] text-white shadow'
                                      : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                  }`}
                                >
                                  <FlipHorizontal2 size={13} /> {k === 'front' ? 'Frente' : 'Verso'}
                                  {sides[k].image && <Check size={12} className="text-green-400" />}
                                </button>
                              ))}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                              <label className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-dashed cursor-pointer text-sm font-semibold transition flex-1 ${
                                isDark ? 'border-white/20 text-gray-300 hover:border-[#0071e3] hover:bg-white/5' : 'border-gray-300 text-gray-700 hover:border-[#0071e3] hover:bg-blue-50/40'
                              }`}>
                                <Upload size={16} />
                                {uploading ? 'Processando imagem...' : current.image ? `Trocar imagem (${activeSide === 'front' ? 'frente' : 'verso'})` : `Enviar imagem do ${activeSide === 'front' ? 'frente' : 'verso'} em alta qualidade`}
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                              </label>
                              {current.image && (
                                <button
                                  onClick={() => updateSide({ image: null, offset: { x: 0, y: 0 }, scaleX: 1, scaleY: 1, rotation: 0 })}
                                  className={`flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition ${isDark ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                  <Trash2 size={14} /> Remover
                                </button>
                              )}
                            </div>
                            {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}

                            {current.image && (
                              <div className="mt-5 space-y-4">
                                <div className={`flex items-center gap-3 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  <Move size={14} /> Arraste a imagem dentro do preview para posicionar livremente
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <ZoomIn size={13} /> Ajuste da imagem
                                  </span>
                                  <button
                                    onClick={() => setLockAspect(v => !v)}
                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition ${lockAspect ? (isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600') : 'bg-[#0071e3] text-white'}`}
                                  >
                                    {lockAspect ? 'Destravar e esticar livremente' : 'Ajuste livre ativado'}
                                  </button>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className={`text-xs font-bold w-14 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}><ZoomIn size={13} /> Zoom</span>
                                  <input
                                    type="range"
                                    min={0.2}
                                    max={4}
                                    step={0.01}
                                    value={current.scaleX}
                                    onChange={(e) => {
                                      const v = parseFloat(e.target.value);
                                      updateSide(lockAspect ? { scaleX: v, scaleY: v } : { scaleX: v });
                                    }}
                                    className="w-full accent-[#0071e3]"
                                  />
                                  <span className={`text-[10px] font-mono w-10 text-right ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{Math.round(current.scaleX * 100)}%</span>
                                </div>

                                {!lockAspect && (
                                  <div className="flex items-center gap-3">
                                    <span className={`text-xs font-bold w-14 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Altura</span>
                                    <input
                                      type="range"
                                      min={0.2}
                                      max={4}
                                      step={0.01}
                                      value={current.scaleY}
                                      onChange={(e) => updateSide({ scaleY: parseFloat(e.target.value) })}
                                      className="w-full accent-[#0071e3]"
                                    />
                                    <span className={`text-[10px] font-mono w-10 text-right ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{Math.round(current.scaleY * 100)}%</span>
                                  </div>
                                )}
                                {!lockAspect && (
                                  <p className={`text-[11px] -mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Modo livre: estique a largura e a altura de forma independente até a imagem ficar exatamente do seu jeito.
                                  </p>
                                )}

                                <div className="flex items-center gap-3">
                                  <span className={`text-xs font-bold w-14 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}><RotateCw size={13} /> Girar</span>
                                  <input
                                    type="range"
                                    min={-180}
                                    max={180}
                                    step={1}
                                    value={current.rotation}
                                    onChange={(e) => updateSide({ rotation: parseFloat(e.target.value) })}
                                    className="w-full accent-[#0071e3]"
                                  />
                                  <span className={`text-[10px] font-mono w-10 text-right ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{current.rotation}°</span>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  <button onClick={() => updateSide({ rotation: current.rotation - 90 })} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-bold transition ${isDark ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    <RotateCcw size={13} /> -90°
                                  </button>
                                  <button onClick={() => updateSide({ rotation: current.rotation + 90 })} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-bold transition ${isDark ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    <RotateCw size={13} /> +90°
                                  </button>
                                  <button onClick={flipImageHorizontal} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-bold transition ${isDark ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    <FlipHorizontal2 size={13} /> Espelhar
                                  </button>
                                  <button onClick={() => updateSide({ offset: { x: 0, y: 0 }, scaleX: 1, scaleY: 1, rotation: 0 })} className={`px-3 py-2 rounded-full text-[11px] font-bold transition ${isDark ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    Redefinir ajuste
                                  </button>
                                </div>
                                <p className={`text-[10px] mt-2 flex items-center gap-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  <Move size={11} /> Arraste a foto na prévia para posicionar · role o scroll do mouse para dar zoom
                                </p>
                              </div>
                            )}
                          </div>

                          <div>
                            <p className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Nome ou texto do {activeSide === 'front' ? 'frente' : 'verso'}
                              <span className={`normal-case font-medium tracking-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>(opcional)</span>
                            </p>
                            <input
                              type="text"
                              maxLength={28}
                              placeholder={activeSide === 'front' ? 'Ex: João Silva, ou Nome do seu Pet — pode deixar em branco' : 'Ex: Telefone, endereço ou instrução — pode deixar em branco'}
                              value={current.text}
                              onChange={(e) => updateSide({ text: e.target.value })}
                              className={`w-full px-5 py-3.5 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition ${
                                isDark ? 'bg-[#121212] border-white/10 text-white placeholder:text-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                              }`}
                            />

                            {current.text && (
                              <div className="flex items-center justify-between mt-2.5 px-1">
                                <p className={`text-[11px] flex items-center gap-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  <Move size={12} /> Arraste o texto na prévia para posicionar
                                </p>
                                <button
                                  onClick={() => updateSide({ textOffset: { x: 0, y: 0 } })}
                                  className={`text-[11px] font-semibold underline underline-offset-2 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                  Centralizar
                                </button>
                              </div>
                            )}
                            <label className={`mt-3 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border cursor-pointer transition ${isDark ? 'bg-[#121212] border-white/10 hover:border-white/20' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                              <span className="flex items-center gap-2.5">
                                <QrCode size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                                <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Incluir QR Code no {activeSide === 'front' ? 'frente' : 'verso'} <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>(opcional)</span>
                                </span>
                              </span>
                              <span className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition ${current.showQr ? 'bg-[#0071e3]' : isDark ? 'bg-white/15' : 'bg-gray-300'}`}>
                                <input
                                  type="checkbox"
                                  checked={current.showQr}
                                  onChange={(e) => updateSide({ showQr: e.target.checked })}
                                  className="sr-only"
                                />
                                <span className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${current.showQr ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
                              </span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Etapa 5 — Revisar e enviar */}
                      {wizardStep === 4 && (
                        <div>
                          <h3 className="text-xl font-bold mb-1.5">Revisar e enviar</h3>
                          <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Confira o resumo do seu projeto antes de salvar ou enviar para produção.</p>

                          <div className={`rounded-2xl border p-6 mb-6 space-y-2.5 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-[#f5f5f7]'}`}>
                            <div className="flex items-center justify-between text-sm">
                              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Linha</span>
                              <span className="font-semibold">{selectedLine.name}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Formato</span>
                              <span className="font-semibold">{selectedFormat.label}{isShapeable ? ` · corte ${shape.label.toLowerCase()}` : ''}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Cor</span>
                              <span className="font-semibold flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full border border-black/10" style={{ background: color }} /> {color}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Frente</span>
                              <span className="font-semibold">{sides.front.image ? 'Foto enviada' : 'Sem foto'}{sides.front.text ? ` · "${sides.front.text}"` : ''}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Verso</span>
                              <span className="font-semibold">{sides.back.image ? 'Foto enviada' : 'Sem foto'}{sides.back.text ? ` · "${sides.back.text}"` : ''}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                              <button
                                onClick={saveProject}
                                className="inline-flex items-center justify-center gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white px-8 py-4 rounded-full text-sm font-bold transition shadow-lg shadow-blue-500/25 w-full sm:w-auto"
                              >
                                <Save size={16} /> Salvar meu projeto
                              </button>
                              <button
                                onClick={handleSendWhatsApp}
                                disabled={sending}
                                className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-bold transition shadow-lg w-full sm:w-auto ${
                                  sending ? 'opacity-60 cursor-wait' : ''
                                } bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-green-500/25`}
                              >
                                {sending ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                                {sending ? 'Preparando envio...' : 'Enviar pelo WhatsApp'}
                              </button>
                            </div>
                            <AnimatePresence>
                              {saveStatus === 'success' && (
                                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm font-semibold text-green-500 flex items-center gap-1.5">
                                  <Check size={16} /> Projeto salvo com sucesso!
                                </motion.p>
                              )}
                              {saveStatus === 'error' && (
                                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm font-semibold text-red-500">
                                  Não foi possível salvar. Tente uma imagem menor.
                                </motion.p>
                              )}
                              {sendError && (
                                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm font-semibold text-red-500">
                                  {sendError}
                                </motion.p>
                              )}
                            </AnimatePresence>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              O envio gera as imagens de frente e verso do seu projeto e abre o compartilhamento nativo (ou o WhatsApp) já com tudo pronto.
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Navegação entre etapas */}
                  <div className={`flex items-center justify-between gap-4 mt-10 pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                    <button
                      onClick={() => goToStep(wizardStep - 1)}
                      disabled={wizardStep === 0}
                      className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition ${
                        wizardStep === 0
                          ? 'opacity-0 pointer-events-none'
                          : isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      <ArrowLeft size={15} /> Voltar
                    </button>
                    {wizardStep < lastStep && (
                      <button
                        onClick={() => goToStep(wizardStep + 1)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-[#0071e3] hover:bg-[#0077ed] text-white transition shadow-lg shadow-blue-500/20"
                      >
                        Continuar <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function WhatsAppButton() {
  return (
    <a href="https://wa.me/5547996287761" target="_blank" rel="noopener noreferrer" 
       className="fixed bottom-8 left-8 z-[100] bg-[#25D366] text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform hover:shadow-2xl flex items-center justify-center"
       aria-label="Fale conosco no WhatsApp">
      <MessageCircle size={28} />
    </a>
  );
}

export default function LandingPage() {
  const { resolve: resolveImg } = useSiteImages();
  const [isDark, setIsDark] = useState(true); // Default Black theme, toggleable to White
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'form' | 'sent'>('cart');
  const [checkoutInfo, setCheckoutInfo] = useState({ nome: '', telefone: '', obs: '' });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalFormatId, setModalFormatId] = useState<string | null>(null);
  const [configuratorPreset, setConfiguratorPreset] = useState<{ lineId: string; formatId: string; nonce: number } | null>(null);
  const [treeCount, setTreeCount] = useState(10);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [activeEveryone, setActiveEveryone] = useState(0);

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
      window.scrollTo(0, scrollY);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [anyOverlayOpen]);

  // Use Case Tab State
  const [activeUseCase, setActiveUseCase] = useState(0);

  // Products section — filter by physical format/category, makes the section functional
  const [productFormatFilter, setProductFormatFilter] = useState<string>('todos');
  const mainLineProducts = PRODUCTS.filter(p => ORIGINAL_LINE_IDS.includes(p.id));
  const shopProducts = productFormatFilter === 'todos'
    ? mainLineProducts
    : mainLineProducts.filter(p => p.formats.includes(productFormatFilter));
  // Segunda fileira — novas linhas AirNext, exibidas na seção própria abaixo de "Produtos"
  const row2Products = PRODUCTS.filter(p => !ORIGINAL_LINE_IDS.includes(p.id));

  // "Veja como funciona na prática" — lightbox de imagem/vídeo, sem levar para produtos
  const [demoLightbox, setDemoLightbox] = useState<Product | null>(null);

  useEffect(() => {
    const h = () => {
      setScrolled(window.scrollY > 30);
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

  const links = [
    { label: 'Produtos', href: '#produtos' },
    { label: 'Funcionalidades', href: '#funcionalidades' },
    { label: 'Galeria', href: '#galeria' },
    { label: 'Casos', href: '#casos-uso' },
    { label: 'Dispositivos', href: '#dispositivos' },
    { label: 'Segurança', href: '#seguranca' },
    { label: 'Inclusão', href: '#para-todos' },
    { label: 'Sobre', href: '#quem-somos' },
    { label: 'Empresas', href: '#b2b' },
    { label: 'Suporte', href: '#ajuda' },
  ];

  const addToCart = (product: Product, formatId?: string) => {
    const format = FORMATS.find(f => f.id === (formatId || product.formats[0])) || FORMATS.find(f => f.id === product.formats[0])!;
    const key = `${product.id}::${format.id}`;
    setCart(prev => {
      const existing = prev.find(item => item.key === key);
      if (existing) {
        return prev.map(item =>
          item.key === key
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { key, product, formatId: format.id, formatLabel: format.label, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (key: string) => {
    setCart(prev => prev.filter(item => item.key !== key));
  };

  const updateQuantity = (key: string, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.key === key) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
    );
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const goPersonalize = (product: Product, formatId?: string) => {
    setConfiguratorPreset({ lineId: product.id, formatId: formatId || product.formats[0], nonce: Date.now() });
    setCartOpen(false);
    setSelectedProduct(null);
    requestAnimationFrame(() => {
      document.getElementById('personalizado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const buildOrderWhatsAppMessage = () => {
    const now = new Date();
    const orderNumber = `AN-${now.getTime().toString().slice(-6)}`;
    const dataHora = now.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    const totalItens = cart.reduce((acc, item) => acc + item.quantity, 0);

    const lines = [
      'Olá! Gostaria de finalizar o pedido completo abaixo:',
      '',
      `🧾 Pedido: ${orderNumber}`,
      `📅 Data/Hora: ${dataHora}`,
      `📦 Itens: ${totalItens}`,
      '',
    ];
    cart.forEach(item => {
      lines.push(`• ${item.product.name} (${item.formatLabel}) — ${item.quantity}x — R$ ${item.product.price * item.quantity}`);
    });
    lines.push('', `Subtotal: R$ ${cartSubtotal}`);
    lines.push('', '— Dados de contato —');
    lines.push(`Nome: ${checkoutInfo.nome || 'não informado'}`);
    lines.push(`Telefone: ${checkoutInfo.telefone || 'não informado'}`);
    if (checkoutInfo.obs) lines.push(`Observações: ${checkoutInfo.obs}`);
    return lines.join('\n');
  };

  const handleFinalizeOrder = () => {
    const msg = encodeURIComponent(buildOrderWhatsAppMessage());
    window.open(`https://wa.me/${AIRNEXT_WHATSAPP}?text=${msg}`, '_blank', 'noopener,noreferrer');
    setCheckoutStep('sent');
  };

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
        avatarBg: 'linear-gradient(135deg, #3b82f6, #6366f1)',
        title: 'Ana Souza',
        subtitle: 'Connect to Profile',
        items: [
          { label: 'WhatsApp', val: '(11) 98765-4321', color: 'bg-green-500/20 text-green-300', icon: <Phone size={14} /> },
          { label: 'LinkedIn', val: 'linkedin.com/in/anasouza', color: 'bg-blue-500/20 text-blue-300', icon: <Globe size={14} /> },
          { label: 'Instagram', val: '@ana.design', color: 'bg-pink-500/20 text-pink-300', icon: <Camera size={14} /> }
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
        title: 'Achei o Fred',
        subtitle: 'Macho · Golden Retriever',
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
        title: 'Mesa 14 · Bistro Paris',
        subtitle: 'Informações da Mesa',
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
        title: 'Ficha Médica de Emergência',
        subtitle: 'Paciente: João Carlos',
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
    <div className={`min-h-screen transition-colors duration-500 antialiased ${isDark ? 'bg-[#050505] text-white' : 'bg-[#fbfbfd] text-gray-900'}`}>

      {/* Fonte da marca — usada no "AirNext" gravado em cada peça personalizada */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Lobster&display=swap" rel="stylesheet" />

      {/* Ajustes globais e elegantes para os indicadores (bullets) de todos os carrosséis do site —
          ficam sempre abaixo dos blocos, nunca sobrepondo conteúdo. */}
      <style>{`
        .swiper { padding-bottom: 8px !important; }
        .swiper-pagination { position: static !important; margin-top: 22px; display: flex !important; align-items: center; justify-content: center; gap: 6px; }
        .swiper-pagination-bullet { width: 5px; height: 5px; margin: 0 !important; background: ${isDark ? 'rgba(255,255,255,0.25)' : 'rgba(17,17,17,0.18)'}; opacity: 1; border-radius: 9999px; transition: all .25s ease; }
        .swiper-pagination-bullet-active { width: 18px; border-radius: 9999px; background: ${isDark ? '#ffffff' : '#111111'}; }
      `}</style>
      
      {/* Upper Announcement Bar */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0a1128] via-[#0071e3] to-[#5e17eb] text-white text-center py-2.5 px-4 text-[11px] font-bold tracking-wider uppercase flex items-center justify-center gap-2">
        <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.18),transparent)] bg-[length:200%_100%] animate-[shine_5s_linear_infinite]" />
        <Sparkle size={13} className="relative shrink-0" />
        <span className="relative">Frete grátis para todo o Brasil em compras acima de R$150 · Parcele em até 12x</span>
        <style>{`@keyframes shine { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      </div>

      {/* --- Scroll-driven Progress bar --- */}
      <div className="fixed top-0 left-0 h-[3px] z-[60] rounded-r-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-[width] duration-150 ease-out" style={{ width: `${scrollProgress}%` }} />

      {/* --- Navbar --- */}
      <nav className={`fixed top-12 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 group/nav ${
        scrolled
          ? `w-[95%] max-w-6xl ${isDark ? 'bg-[#0a0a0a]/80 border-white/10' : 'bg-white/80 border-gray-200/70'} backdrop-blur-2xl rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border`
          : `w-[95%] max-w-7xl ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white/50 border-gray-200/40'} backdrop-blur-md rounded-full border`
      }`}>
        {/* Subtle animated gradient ring on hover — a small "alive" touch instead of a static bar */}
        <div className="pointer-events-none absolute -inset-px rounded-full opacity-0 group-hover/nav:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-purple-500/0 blur-sm" />

        <div className="relative px-5 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Logo size="md" dark={isDark} />

          {/* Center nav links with animated underline on hover */}
          <div className="hidden xl:flex items-center gap-1">
            {links.map(l => (
              <a
                key={l.label}
                href={l.href}
                className={`relative px-3.5 py-2 text-[12.5px] font-semibold tracking-tight rounded-full transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white hover:bg-white/[0.06]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-900/[0.04]'
                }`}
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Dark / Light Mode Toggle Button — sempre visível, em qualquer tamanho de tela */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-all flex-shrink-0 ${
                isDark ? 'bg-white/[0.06] border-white/10 text-yellow-300 hover:bg-white/10' : 'bg-gray-900/[0.04] border-gray-200 text-gray-700 hover:bg-gray-900/[0.08]'
              }`}
              aria-label="Alternar tema"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Search Trigger */}
            <button onClick={() => setSearchOpen(true)} className={`flex-shrink-0 p-2.5 rounded-full transition-all ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-900/[0.06] text-gray-700'}`} aria-label="Buscar">
              <Search size={17} />
            </button>

            {/* Cart Trigger */}
            <button onClick={() => setCartOpen(true)} className={`relative flex-shrink-0 p-2.5 rounded-full transition-all ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-900/[0.06] text-gray-700'}`} aria-label="Carrinho">
              <ShoppingBag size={17} />
              {cart.length > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-[#0071e3] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* Login -> rota interna do app (dashboard). Ícone sempre visível, ao lado da sacola, igual tema/busca/carrinho. */}
            <Link
              to="/login"
              title="Login"
              aria-label="Login"
              className={`flex-shrink-0 p-2.5 rounded-full transition-all ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-900/[0.06] text-gray-700'}`}
            >
              <UserRound size={17} />
            </Link>

            {/* Divider */}
            <div className={`hidden sm:block w-px h-6 mx-0.5 flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

            {/* Mobile Menu Trigger */}
            <button onClick={() => setMobileOpen(true)} className={`xl:hidden w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDark ? 'bg-white/[0.08] text-white hover:bg-white/[0.14]' : 'bg-gray-900/[0.06] text-gray-900 hover:bg-gray-900/[0.1]'}`} aria-label="Abrir menu">
              <ChevronDown size={20} />
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

              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto px-2 no-scrollbar">
                {links.map(l => (
                  <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className={`text-lg font-semibold py-3 border-b ${isDark ? 'border-white/10 text-white' : 'border-gray-100 text-gray-900'} flex items-center justify-between`}>
                    {l.label} <ChevronRight size={18} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                  </a>
                ))}
              </div>
              <div className="px-2 flex flex-col gap-3">
                <a href="#produtos" onClick={() => setMobileOpen(false)} className={`mt-6 w-full py-4 rounded-full text-center font-semibold flex items-center justify-center gap-2 ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                  <ShoppingBag size={16} /> Comprar Agora
                </a>
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
                  <input
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
                        <img src={resolveImg(`search-${p.id}`, p.img)} alt={p.name} className="w-full aspect-[4/3] rounded-2xl object-cover mb-4" />
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

      {/* Shopping Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setCartOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`absolute right-0 top-0 bottom-0 w-full max-w-md ${isDark ? 'bg-[#121212] text-white border-white/10' : 'bg-white text-gray-900 border-gray-200'} shadow-2xl flex flex-col p-6 z-10 border-l`}
            >
              <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                <div className="flex items-center gap-2">
                  {checkoutStep === 'form' && (
                    <button onClick={() => setCheckoutStep('cart')} className={`p-1.5 -ml-1.5 rounded-full transition ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-800'}`}>
                      <ArrowLeft size={16} />
                    </button>
                  )}
                  <ShoppingBag className="text-[#0071e3]" size={20} />
                  <h3 className="text-lg font-bold">
                    {checkoutStep === 'form' ? 'Finalizar pedido' : checkoutStep === 'sent' ? 'Pedido enviado' : 'Sua Sacola'}
                  </h3>
                </div>
                <button onClick={() => { setCartOpen(false); setCheckoutStep('cart'); }} className={`p-2 rounded-full transition ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-800'}`}>
                  <X size={20} />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <ShoppingBag size={48} className="text-gray-600 mb-4 animate-bounce" />
                  <p className="text-base font-semibold mb-1">Sua sacola está vazia</p>
                  <p className="text-xs text-gray-500 mb-6">Explore nossos produtos premium e adicione itens inovadores.</p>
                  <button onClick={() => { setCartOpen(false); window.location.hash = '#produtos'; }} className={`px-6 py-2.5 rounded-full text-xs font-bold transition ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}>
                    Ver Coleção
                  </button>
                </div>
              ) : checkoutStep === 'sent' ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-green-500/15 text-green-500 flex items-center justify-center mb-4">
                    <Check size={28} />
                  </div>
                  <p className="text-base font-semibold mb-1">Pedido enviado para o WhatsApp!</p>
                  <p className="text-xs text-gray-500 mb-6">Nossa equipe vai confirmar os detalhes e o prazo de produção com você por lá.</p>
                  <button
                    onClick={() => { setCart([]); setCheckoutStep('cart'); setCheckoutInfo({ nome: '', telefone: '', obs: '' }); setCartOpen(false); }}
                    className={`px-6 py-2.5 rounded-full text-xs font-bold transition ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
                  >
                    Concluir
                  </button>
                </div>
              ) : checkoutStep === 'form' ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                    <div className={`rounded-2xl border p-4 space-y-1.5 text-xs ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                      {cart.map(item => (
                        <div key={item.key} className="flex justify-between">
                          <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{item.quantity}x {item.product.name} ({item.formatLabel})</span>
                          <span className="font-bold">R$ {item.product.price * item.quantity}</span>
                        </div>
                      ))}
                      <div className={`flex justify-between pt-2 mt-1 border-t font-bold ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                        <span>Subtotal</span>
                        <span>R$ {cartSubtotal}</span>
                      </div>
                    </div>

                    <input
                      type="text" placeholder="Seu nome"
                      value={checkoutInfo.nome}
                      onChange={(e) => setCheckoutInfo(c => ({ ...c, nome: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${isDark ? 'bg-[#050505] border-white/10 text-white placeholder:text-gray-500' : 'bg-white border-gray-200 placeholder:text-gray-400'}`}
                    />
                    <input
                      type="tel" placeholder="Seu telefone / WhatsApp"
                      value={checkoutInfo.telefone}
                      onChange={(e) => setCheckoutInfo(c => ({ ...c, telefone: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${isDark ? 'bg-[#050505] border-white/10 text-white placeholder:text-gray-500' : 'bg-white border-gray-200 placeholder:text-gray-400'}`}
                    />
                    <textarea
                      rows={2} placeholder="Observações (opcional)"
                      value={checkoutInfo.obs}
                      onChange={(e) => setCheckoutInfo(c => ({ ...c, obs: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${isDark ? 'bg-[#050505] border-white/10 text-white placeholder:text-gray-500' : 'bg-white border-gray-200 placeholder:text-gray-400'}`}
                    />
                  </div>
                  <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                    <button
                      onClick={handleFinalizeOrder}
                      disabled={!checkoutInfo.nome || !checkoutInfo.telefone}
                      className="w-full py-4 rounded-full text-sm font-bold transition shadow-lg bg-[#25D366] hover:bg-[#20bd5a] text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={16} /> Enviar pedido pelo WhatsApp
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                    {cart.map(item => (
                      <div key={item.key} className={`flex gap-4 p-3 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                        <img src={resolveImg(`cart-${item.product.id}`, item.product.img)} alt={item.product.name} className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate">{item.product.name}</h4>
                          <p className="text-xs text-gray-400 mb-2">Formato: {item.formatLabel}</p>
                          <div className="flex items-center justify-between">
                            <div className={`flex items-center gap-2.5 border rounded-full px-2 py-1 ${isDark ? 'bg-black border-white/10' : 'bg-white border-gray-200'}`}>
                              <button onClick={() => updateQuantity(item.key, -1)} className={`p-1 rounded-full ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
                                <Minus size={10} />
                              </button>
                              <span className="text-xs font-bold">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.key, 1)} className={`p-1 rounded-full ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
                                <Plus size={10} />
                              </button>
                            </div>
                            <span className="text-sm font-bold">R$ {item.product.price * item.quantity}</span>
                          </div>
                          <button
                            onClick={() => goPersonalize(item.product, item.formatId)}
                            className="mt-2 text-[10px] font-bold text-[#0071e3] hover:underline flex items-center gap-1"
                          >
                            <Palette size={11} /> Personalizar este item antes de enviar
                          </button>
                        </div>
                        <button onClick={() => removeFromCart(item.key)} className="text-gray-500 hover:text-red-500 p-1 self-start transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'} space-y-4`}>
                    <div className="flex justify-between text-sm font-bold">
                      <span>Subtotal</span>
                      <span>R$ {cartSubtotal}</span>
                    </div>
                    <div className={`p-4 rounded-2xl border flex gap-3 ${isDark ? 'bg-blue-900/20 border-blue-900/50 text-blue-200/80' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                      <Zap size={18} className={`${isDark ? 'text-blue-400' : 'text-blue-600'} flex-shrink-0`} />
                      <p className="text-[11px] leading-relaxed font-semibold">
                        Você está a poucos passos de simplificar suas conexões e ajudar o meio ambiente com zero papel!
                      </p>
                    </div>
                    <button onClick={() => setCheckoutStep('form')} className={`w-full py-4 rounded-full text-sm font-bold transition shadow-lg ${isDark ? 'bg-white text-black hover:bg-gray-100 shadow-white/5' : 'bg-black text-white hover:bg-gray-800 shadow-black/10'}`}>
                      Finalizar Compra
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* --- Hero --- */}
        <section id="top" className={`relative pt-32 md:pt-40 pb-12 md:pb-16 overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#050505]' : 'bg-[#fbfbfd]'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8 }}>
                <p className="eyebrow text-[#0071e3] mb-4 flex items-center justify-center gap-2">
                  <Nfc size={12} /> NFC + QR Code · Tecnologia Premium
                </p>
                <h1 className={`h1-apple mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Aproxime-se<br />do futuro.</h1>
                <p className={`text-xl md:text-2xl ${isDark ? 'text-gray-400' : 'text-gray-500'} max-w-3xl mx-auto mb-10 font-medium leading-relaxed`}>
                  AirNext simplifica conexões. Um toque para compartilhar,<br className="hidden md:block" /> um gesto para impactar.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <a href="#produtos" className={`group px-8 py-3.5 rounded-full flex items-center gap-3 transition-all shadow-xl text-[15px] font-semibold ${
                    isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'
                  }`}>
                    Explorar Produtos
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center transition ${isDark ? 'bg-black/10 group-hover:bg-black/20' : 'bg-white/20 group-hover:bg-white/30'}`}>
                      <ChevronDown size={14} className={isDark ? 'text-black' : 'text-white'} />
                    </span>
                  </a>
                  <a href="#video-demo" className={`group px-8 py-3.5 rounded-full flex items-center gap-3 transition-all border text-[15px] font-semibold shadow-sm ${
                    isDark ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : 'bg-white text-black border-gray-200 hover:bg-gray-50'
                  }`}>
                    <Play size={16} /> Assistir Demo
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Floating Products */}
            <div className="relative h-[520px] md:h-[600px] max-w-6xl mx-auto">
              {/* AirNext Card */}
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: .3, duration: .9 }}
                className="absolute left-[2%] md:left-[8%] top-[5%] w-[260px] md:w-[360px] float-anim"
                style={{ '--r': '-8deg' } as CP}
              >
                <div className="rounded-[24px] p-6 md:p-8 text-white shadow-2xl shadow-blue-900/30 relative overflow-hidden"
                  style={{ background: 'linear-gradient(145deg, #0a1f3d, #06101f)' }}>
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/15 rounded-full blur-3xl" />
                  <div className="relative z-10 flex items-center justify-between mb-12 md:mb-20">
                    <Logo dark size="sm" />
                    <div className="nfc-pulse relative w-10 h-10 rounded-full flex items-center justify-center bg-white/5 backdrop-blur">
                      <Nfc size={14} className="text-blue-300" />
                    </div>
                  </div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex gap-1">
                      <div className="w-8 h-5 rounded" style={{ background: 'linear-gradient(135deg, #d4af37, #ffd700)' }} />
                    </div>
                    <p className="text-[10px] tracking-[.3em] text-blue-200/70 font-medium">TAP TO CONNECT</p>
                  </div>
                </div>
              </motion.div>

              {/* Phone */}
              <motion.div
                initial={{ opacity: 0, y: 80 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: .5, duration: .9 }}
                className="absolute right-[2%] md:right-[10%] top-0 w-[200px] md:w-[260px] float-anim float-delay-1"
                style={{ '--r': '5deg' } as CP}
              >
                <div className="rounded-[40px] p-[8px] shadow-2xl shadow-black/30" style={{ background: 'linear-gradient(160deg, #1c1c1e, #000)' }}>
                  <div className="rounded-[32px] overflow-hidden bg-gradient-to-b from-[#0b1326] to-[#050810] text-white">
                    <div className="relative pt-8 pb-6 px-5 text-center">
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full" />
                      <Logo dark size="sm" />
                      <p className="text-[8px] tracking-[.3em] text-slate-500 mt-1 mb-4">TECNOLOGIA AO TOQUE</p>
                      <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl ring-2 ring-blue-400/30">
                        A
                      </div>
                      <p className="text-[11px] font-semibold">Ana Souza</p>
                      <p className="text-[9px] text-slate-400 mb-4">Designer de Produto</p>
                      <div className="space-y-1.5 text-left">
                        {[
                          { icon: <MessageCircle size={10} className="text-green-400" />, label: 'WhatsApp' },
                          { icon: <Camera size={10} className="text-pink-400" />, label: 'Instagram' },
                          { icon: <Globe size={10} className="text-blue-400" />, label: 'Portfólio' },
                        ].map(item => (
                          <div key={item.label} className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5 text-[9px]">
                            {item.icon} {item.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Pet Tag */}
              <motion.div
                initial={{ opacity: 0, scale: .8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: .7, duration: .9 }}
                className="absolute left-1/2 -translate-x-1/2 bottom-[5%] md:bottom-[8%] float-anim float-delay-2"
                style={{ '--r': '0deg' } as CP}
              >
                <div className="w-36 h-36 md:w-44 md:h-44 rounded-full flex items-center justify-center shadow-2xl shadow-black/20 relative"
                  style={{ background: 'radial-gradient(circle at 30% 30%, #2a2a2e, #0a0a0f)' }}>
                  <div className="absolute inset-3 rounded-full border border-white/10" />
                  <div className="text-center relative z-10">
                    <div className="mb-1">
                      <Heart size={28} className="text-rose-300 mx-auto" fill="#f43f5e44" />
                    </div>
                    <p className="text-[9px] tracking-[.2em] text-blue-300 font-bold">PET TAG</p>
                  </div>
                </div>
              </motion.div>

              {/* QR desk tag */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: .9, duration: .8 }}
                className="absolute left-[5%] bottom-[20%] md:bottom-[25%] float-anim float-delay-3"
                style={{ '--r': '6deg' } as CP}
              >
                <div className="w-28 h-20 md:w-36 md:h-24 rounded-2xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white shadow-xl">
                  <div className="text-center">
                    <QrCode size={22} className="mx-auto mb-1" />
                    <p className="text-[7px] tracking-[.2em] text-blue-300 font-semibold">MENU</p>
                  </div>
                </div>
              </motion.div>

              {/* Wristband */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: .8 }}
                className="absolute right-[5%] bottom-[25%] md:bottom-[30%] float-anim"
                style={{ '--r': '-4deg' } as CP}
              >
                
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- Video Demo Section --- */}
        <section id="video-demo" className="py-20 md:py-28 bg-black text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center mb-14">
              <p className="eyebrow text-blue-400 mb-3">Demonstração</p>
              <h2 className="h2-apple mb-4">Veja a mágica acontecer.</h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">Assista como o AirNext conecta pessoas em menos de 1 segundo. Sem fio. Sem app. Sem fricção.</p>
            </div>

            <div className="relative mx-auto rounded-[28px] md:rounded-[40px] overflow-hidden bg-black aspect-[4/5] sm:aspect-video lg:aspect-[21/9]">
              <video
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                src={resolveImg('video-demo', 'https://assets.mixkit.co/videos/preview/mixkit-network-connection-lines-and-dots-31580-large.mp4')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/10 pointer-events-none" />
              <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 pointer-events-none">
                <p className="text-[11px] font-bold tracking-[0.2em] text-white/60 uppercase mb-1">AirNext em ação</p>
                <p className="text-xl md:text-2xl font-bold text-white">Um toque. Uma conexão.</p>
              </div>
            </div>

            <div className="mt-16">
              <Swiper
                modules={[Pagination]}
                spaceBetween={20}
                slidesPerView={1}
                pagination={{ clickable: true }}
                breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
                className="pb-10 dark-swiper"
              >
                {[
                  { icon: <Zap size={28} />, title: 'Aproxime o Celular', desc: 'Basta encostar o celular no produto AirNext. O NFC faz o resto automaticamente.' },
                  { icon: <Smartphone size={28} />, title: 'Link Instantâneo', desc: 'Uma notificação aparece na tela. Toque para abrir o perfil completo em segundos.' },
                  { icon: <QrCode size={28} />, title: 'QR Code Backup', desc: 'Sem NFC? Escaneie o QR Code com a câmera nativa. Funciona em qualquer dispositivo.' },
                  { icon: <Users size={28} />, title: 'Compartilhe Tudo', desc: 'WhatsApp, Instagram, LinkedIn, portfólio, vCard — tudo em um único perfil editável.' },
                  { icon: <Shield size={28} />, title: '100% Seguro', desc: 'Criptografia NFC Forum. Você controla todas as informações do seu perfil.' },
                ].map((c, i) => (
                  <SwiperSlide key={i}>
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur h-full hover:bg-white/10 transition">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-300 mb-5">{c.icon}</div>
                      <h4 className="text-lg font-bold mb-2">{c.title}</h4>
                      <p className="text-sm text-gray-400 leading-relaxed">{c.desc}</p>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
              <SwipeIndicator isDark={true} />
            </div>
          </div>
        </section>

        {/* --- Demo Carousel: AirNext em ação por linha de produto --- */}
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
                    {demoIsVideo ? (
                      <video src={demoSrc} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" muted loop playsInline autoPlay />
                    ) : (
                      <img src={demoSrc} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
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
          <AnimatePresence>
            {demoLightbox && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDemoLightbox(null)}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
              >
                <button onClick={() => setDemoLightbox(null)} className="fixed top-6 right-6 z-[110] w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition text-white">
                  <X size={20} />
                </button>
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-2xl aspect-[4/5] sm:aspect-video rounded-[28px] overflow-hidden shadow-2xl"
                >
                  {isVideoUrl(resolveImg(`demo-${demoLightbox.id}`, demoLightbox.img)) ? (
                    <video
                      src={resolveImg(`demo-${demoLightbox.id}`, demoLightbox.img)}
                      className="absolute inset-0 w-full h-full object-cover"
                      autoPlay loop controls playsInline
                    />
                  ) : (
                    <img src={resolveImg(`demo-${demoLightbox.id}`, demoLightbox.img)} alt={demoLightbox.name} className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-black/10 pointer-events-none" />
                  <div className="absolute bottom-0 inset-x-0 p-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${demoLightbox.color}30`, color: demoLightbox.color }}>
                      {demoLightbox.icon}
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg leading-tight">{demoLightbox.name}</p>
                      <p className="text-white/70 text-xs mt-0.5">{demoLightbox.desc}</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* --- Products Section --- */}
        <section id="produtos" className={`py-20 md:py-28 transition-colors duration-500 ${isDark ? 'bg-[#050505] text-white' : 'bg-[#f5f5f7] text-gray-900'}`}>
          <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-14">
              <p className="eyebrow text-[#0071e3] mb-3">Feito para o seu estilo</p>
              <h2 className="h2-apple">Projetado para cada ocasião</h2>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'} max-w-2xl mx-auto mt-2`}>Encontre o modelo ideal para o seu estilo, com a tecnologia AirNext presente em todas as versões.</p>
            </div>

            {/* Filtro por categoria — estilo minimalista, texto com sublinhado, rolável no mobile */}
            <style>{`.airnext-filter-scroll::-webkit-scrollbar{display:none}`}</style>
      
            {/* Carrossel de produtos */}
            <Swiper
              modules={[Pagination]}
              spaceBetween={20}
              slidesPerView={1}
              pagination={{ clickable: true }}
              breakpoints={{
                640: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                1024: { slidesPerView: 4 }
              }}
              className="pb-10"
            >
              {shopProducts.map(p => (
                <SwiperSlide key={p.id}>
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    onClick={() => setSelectedProduct(p)}
                    className="group cursor-pointer h-[420px] flex flex-col"
                  >
                    {/* Imagem — grande, sem selos ou ruído visual, foco total no produto */}
                    <div className={`aspect-square rounded-[28px] overflow-hidden mb-5 relative ${isDark ? 'bg-[#111]' : 'bg-white'}`}>
                      <img src={resolveImg(`shop-${p.id}`, p.img)} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out" />

                      {/* Botão de sacola — sempre visível (antes só aparecia no hover) */}
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                        aria-label={`Adicionar ${p.name} à sacola`}
                        className={`absolute top-3.5 right-3.5 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition ${
                          isDark ? 'bg-black/50 text-white hover:bg-black/70' : 'bg-white/90 text-gray-900 hover:bg-white shadow-md'
                        }`}
                      >
                        <ShoppingBag size={15} />
                      </button>
                    </div>

                    {/* Texto — hierarquia limpa, uma linha por informação, sem excesso de badges */}
                    <div className="flex flex-col flex-1">
                      <span className={`text-[11px] font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{p.tag}</span>
                      <h3 className={`text-[17px] font-semibold mb-1.5 leading-snug tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.name}</h3>
                      <p className={`text-[13px] ${isDark ? 'text-gray-500' : 'text-gray-500'} leading-relaxed mb-4 line-clamp-1`}>{p.desc}</p>

                      <div className="mt-auto flex items-center justify-between gap-3">
                        <p className={`text-[15px] font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>R$ {p.price}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); goPersonalize(p); }}
                          className={`inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors ${
                            isDark ? 'text-white hover:text-[#4da3ff]' : 'text-gray-900 hover:text-[#0071e3]'
                          }`}
                        >
                          Personalizar <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
            <SwipeIndicator isDark={isDark} />

            {shopProducts.length === 0 && (
              <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Search size={40} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm font-semibold">Nenhum produto nessa categoria ainda.</p>
              </div>
            )}

          
          </div>
          
        {/* --- Second Products Row: new AirNext lines (Corporate, Evento, Hotel, Black) --- */}
        <section id="mais-produtos" className={`py-20 md:py-28 transition-colors duration-500 ${isDark ? 'bg-[#050505] text-white' : 'bg-white text-gray-900'}`}>
          <div className="max-w-7xl mx-auto px-6">
            

            <Swiper
              modules={[Pagination]}
              spaceBetween={20}
              slidesPerView={1}
              pagination={{ clickable: true }}
              breakpoints={{
                640: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                1024: { slidesPerView: 4 }
              }}
              className="pb-10"
            >
              {row2Products.map(p => (
                <SwiperSlide key={p.id}>
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    onClick={() => setSelectedProduct(p)}
                    className="group cursor-pointer h-[420px] flex flex-col"
                  >
                    <div className={`aspect-square rounded-[28px] overflow-hidden mb-5 relative ${isDark ? 'bg-[#111]' : 'bg-white'}`}>
                      <img src={resolveImg(`row2-${p.id}`, p.img)} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out" />

                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                        aria-label={`Adicionar ${p.name} à sacola`}
                        className={`absolute top-3.5 right-3.5 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition ${
                          isDark ? 'bg-black/50 text-white hover:bg-black/70' : 'bg-white/90 text-gray-900 hover:bg-white shadow-md'
                        }`}
                      >
                        <ShoppingBag size={15} />
                      </button>

                      <span className={`absolute top-3.5 left-3.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${isDark ? 'bg-white/10 text-white' : 'bg-gray-900/90 text-white'}`}>
                        Novo
                      </span>
                    </div>

                    <div className="flex flex-col flex-1">
                      <span className={`text-[11px] font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{p.tag}</span>
                      <h3 className={`text-[17px] font-semibold mb-1.5 leading-snug tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.name}</h3>
                      <p className={`text-[13px] ${isDark ? 'text-gray-500' : 'text-gray-500'} leading-relaxed mb-4 line-clamp-1`}>{p.desc}</p>

                      <div className="mt-auto flex items-center justify-between gap-3">
                        <p className={`text-[15px] font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>R$ {p.price}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); goPersonalize(p); }}
                          className={`inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors ${
                            isDark ? 'text-white hover:text-[#4da3ff]' : 'text-gray-900 hover:text-[#0071e3]'
                          }`}
                        >
                          Personalizar <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
            <SwipeIndicator isDark={isDark} />
          </div>
        </section>
           {/* Personalized products promo block */}
            <div className={`mt-10 rounded-[32px] p-8 md:p-12 border relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-blue-950/40 via-[#0a0a0a] to-purple-950/20 border-white/10' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50 border-blue-100/60'}`}>
              <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="relative grid md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={18} className="text-[#0071e3]" />
                    <p className={`eyebrow ${isDark ? 'text-blue-300' : 'text-[#0071e3]'}`}>100% Personalizado</p>
                  </div>
                  <h3 className={`text-xl md:text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Não achou o padrão perfeito? Monte o seu do zero.
                  </h3>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Escolha a linha AirNext, o formato (cartão, tag, chaveiro, pulseira ou adesivo), a cor e a sua própria foto — ajuste tudo
                    do seu jeito e envie direto para produção pelo WhatsApp.
                  </p>
                </div>
                <div className="flex md:justify-end">
                  <button
                    onClick={() => goPersonalize(PRODUCTS[0])}
                    className="inline-flex items-center gap-2 bg-[#0071e3] text-white px-7 py-3.5 rounded-full font-bold text-sm hover:bg-[#0077ed] transition shadow-xl shadow-blue-500/20"
                  >
                    <Palette size={16} /> Ir para o Personalizador
                  </button>
                </div>
              </div>
            </div>
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

                  <div className="w-full h-[50vh] md:h-[60vh] relative overflow-hidden">
                    <img src={resolveImg(`modal-${selectedProduct.id}`, selectedProduct.img)} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#050505]' : 'from-white'} via-transparent to-transparent`} />
                    <div className="absolute top-6 left-6 flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/45 backdrop-blur-sm text-white">
                      <Nfc size={13} />
                      <span style={{ fontFamily: "'Lobster', cursive" }} className="text-xs tracking-wide leading-none translate-y-[1px]">AirNext</span>
                    </div>
                  </div>

                  <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10 pb-20">
                    <span className="eyebrow mb-3 block" style={{ color: selectedProduct.color }}>{selectedProduct.tag}</span>
                    <h2 className="h1-apple mb-4">{selectedProduct.name}</h2>
                    <p className="text-3xl font-bold mb-8">R$ {selectedProduct.price}</p>
                    <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-8 leading-relaxed max-w-2xl`}>{selectedProduct.longDesc}</p>

                    {/* Format picker */}
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

                    <div className="grid sm:grid-cols-2 gap-4 mb-12">
                      {selectedProduct.specs.map(s => (
                        <div key={s} className={`flex items-center gap-3 p-4 ${isDark ? 'bg-[#121212] border-white/5' : 'bg-gray-50 border-gray-100'} rounded-2xl border`}>
                          <Check size={18} className="text-green-500 flex-shrink-0" />
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{s}</span>
                        </div>
                      ))}
                    </div>

                    <div className={`mb-10 p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-4 justify-between ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                      <div>
                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Quer deixar do seu jeito?</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Personalize cor, foto e texto — ou leve o modelo padrão AirNext, pronto para usar.</p>
                      </div>
                      <button
                        onClick={() => goPersonalize(selectedProduct, modalFormatId || selectedProduct.formats[0])}
                        className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition border ${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-800 hover:bg-white'}`}
                      >
                        <Palette size={16} /> Personalizar produto
                      </button>
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
        </section>

        {/* --- Funcionalidades AirNext: galeria horizontal com barra de scroll --- */}
        <FuncionalidadesSection isDark={isDark} />

        {/* --- NFC vs Papel: por que compartilhar contato por NFC muda tudo --- */}
        <NfcVsPaperSection isDark={isDark} />

        {/* --- AirNext Personalizador: interactive multi-format customizer --- */}
        <PersonalizadorSection isDark={isDark} preset={configuratorPreset} />

        {/* --- Momentos Reais Gallery Carousel --- */}
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
                { id: 'pro', img: PRODUCTS[0].img, title: 'Feiras & Congressos', caption: 'Cartões AirNext Pro trocados em segundos, sem fila e sem papel.' },
                { id: 'pet', img: PRODUCTS[2].img, title: 'Passeios com o Pet', caption: 'Tranquilidade extra em cada caminhada pelo bairro com AirNext Pet.' },
                { id: 'stand', img: PRODUCTS[1].img, title: 'Recepções & Restaurantes', caption: 'Cardápios e check-ins que impressionam com AirNext Stand.' },
                { id: 'kids', img: PRODUCTS[3].img, title: 'Parques & Passeios em Família', caption: 'Pais localizados em segundos com AirNext Kids.' },
                { id: 'senior', img: PRODUCTS[4].img, title: 'Cuidado com quem a gente ama', caption: 'Independência e segurança com AirNext Senior.' },
                { id: 'tea', img: PRODUCTS[5].img, title: 'Comunicação Assistida', caption: 'Informações vitais sempre à mão com AirNext TEA.' },
              ].map((item, i) => (
                <SwiperSlide key={i}>
                  <div className="relative rounded-[28px] overflow-hidden aspect-[3/4] group">
                    <img src={resolveImg(`moments-${item.id}`, item.img)} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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

        {/* --- Interactive Use Cases Simulator Section --- */}
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
                      <h4 className={`font-bold text-base mb-1 ${activeUseCase === i ? 'text-[#0071e3]' : isDark ? 'text-white' : 'text-gray-900'}`}>{s.title}</h4>
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
                        {/* Imagem de perfil (avatar com iniciais) */}
                        <div
                          className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-2 border-white/25 text-2xl font-extrabold text-white"
                          style={{ background: useCaseScenarios[activeUseCase].screen.avatarBg }}
                        >
                          {getInitials(useCaseScenarios[activeUseCase].screen.title)}
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

        {/* --- Devices Section --- */}
        <DeviceCompatibilitySection isDark={isDark} />
        
        {/* --- Quem Usa Recomenda / Feedbacks Section --- */}
        <section id="feedbacks" className={`py-20 md:py-28 transition-colors duration-500 ${isDark ? 'bg-[#121212] text-white' : 'bg-[#fbfbfd] text-gray-900'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="eyebrow text-[#0071e3] mb-3">Quem Usa Recomenda</p>
              <h2 className={`h2-apple mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Feedbacks de Clientes.</h2>
              <div className="flex items-center justify-center gap-2 mt-3">
                {[...Array(5)].map((_, i) => <Star key={i} size={18} className="text-yellow-400" fill="#facc15" />)}
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-1`}>4.9/5 · 1.200+ avaliações</span>
              </div>
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
                { name: 'Marina Costa', role: 'Arquiteta', text: 'Em feiras de arquitetura o cartão AirNext me salvou. As pessoas chegam em casa com meu portfólio salvo no celular. Nunca mais imprimi cartão de papel.', avatar: 'MC', rating: 5 },
                { name: 'Rafael Andrade', role: 'Restaurante', text: 'Colocamos as tags NFC nas mesas e os pedidos pelo cardápio digital aumentaram 34% no primeiro mês. Os clientes adoram a experiência.', avatar: 'RA', rating: 5 },
                { name: 'Carla Menezes', role: 'Veterinária', text: 'Indico para todos os tutores. A tag pet é genial — se o animal fugir, qualquer um acessa os dados. Já ajudou 3 pets perdidos a voltarem para casa.', avatar: 'CM', rating: 5 },
                { name: 'Lucas Pereira', role: 'Eventos', text: 'Usamos pulseiras em um festival com 3 mil pessoas. O check-in foi 3x mais rápido e os convidados amaram trocar contatos na hora.', avatar: 'LP', rating: 5 },
                { name: 'Juliana Lima', role: 'Marketing', text: 'Economizamos uma fortuna com cartões impressos. A experiência premium do AirNext impressiona os clientes na primeira reunião.', avatar: 'JL', rating: 5 },
                { name: 'Pedro Souza', role: 'Designer', text: 'Zero fricção. Aproximo o celular do cliente e já compartilho portfólio, Instagram e LinkedIn. Networking evoluído.', avatar: 'PS', rating: 5 },
                { name: 'Amanda Rocha', role: 'Médica Pediatra', text: 'Comprei as pulseiras kids para meus filhos e recomendo demais. Em parques me sinto muito mais segura sabendo que qualquer pessoa consegue me ligar.', avatar: 'AR', rating: 5 },
                { name: 'Thiago Menezes', role: 'CEO Startup', text: 'Equipamos toda a equipe com AirNext Card Pro e a troca de informações em eventos de tecnologia ficou muito mais profissional.', avatar: 'TM', rating: 5 },
                { name: 'Fernanda Azevedo', role: 'Tutora de PET', text: 'A tag pet salvou meu cachorro quando ele fugiu no Ano Novo. Quem achou ligou na hora! Produto essencial.', avatar: 'FA', rating: 5 },
              ].map((t, i) => (
                <SwiperSlide key={i} className="!h-auto">
                  <div className={`p-8 rounded-[28px] ${isDark ? 'bg-[#050505] border-white/10' : 'bg-white border-gray-100'} border h-[300px] shadow-sm flex flex-col justify-between hover:shadow-lg transition-all`}>
                    <div>
                      <div className="flex mb-3">
                        {[...Array(t.rating)].map((_, j) => <Star key={j} size={12} className="text-yellow-400" fill="#facc15" />)}
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} leading-relaxed line-clamp-5`}>"{t.text}"</p>
                    </div>
                    <div className="flex items-center gap-3 border-t pt-4 border-white/5">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0`}>
                        {t.avatar}
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
          </div>
        </section>

        {/* --- Security Section --- */}
        <section id="seguranca" className="py-20 md:py-28 bg-[#050810] text-white relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-10" />
          <div className="absolute top-0 right-0 w-[520px] h-[520px] bg-blue-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[110px]" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            {/* Header banner */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
                </span>
                <p className="text-[11px] font-bold tracking-wider uppercase text-blue-300">Privacidade por padrão · Segurança de nível bancário</p>
              </div>
              <h2 className="h2-apple mb-5 text-white">
                Seus dados. Suas regras. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Inteligência que protege.</span>
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed">
                O AirNext foi construído com uma arquitetura <strong className="text-gray-200">privacy-first</strong>: criptografia de nível militar, conformidade total
                com a LGPD e monitoramento contínuo — para que você compartilhe o que quiser, com quem quiser, e nada além disso.
              </p>
            </div>

            <div className="grid lg:grid-cols-5 gap-6 items-stretch">
              {/* Left: feature cards */}
              <div className="lg:col-span-3 grid sm:grid-cols-2 gap-5">
                {[
                  { icon: <Lock size={20} />, title: 'Criptografia ponta a ponta', desc: 'Cada chip NFC é gravado com criptografia AES-256 e chaves seguindo o padrão oficial do fórum NFC — praticamente impossível de clonar.', accent: 'from-blue-500/20 to-blue-500/5 text-blue-300' },
                  { icon: <Eye size={20} />, title: 'Você no controle total', desc: 'Ative, edite ou oculte qualquer link do seu perfil em segundos. Nada aparece sem sua permissão explícita.', accent: 'from-purple-500/20 to-purple-500/5 text-purple-300' },
                  { icon: <Target size={20} />, title: 'Zero rastreamento comercial', desc: 'Não vendemos, não compartilhamos e não monitoramos o comportamento de quem escaneia seu perfil. Ponto final.', accent: 'from-emerald-500/20 to-emerald-500/5 text-emerald-300' },
                  { icon: <Zap size={20} />, title: 'Monitoramento 24/7', desc: 'Infraestrutura com detecção automática de anomalias e resposta a incidentes em tempo real, todos os dias do ano.', accent: 'from-amber-500/20 to-amber-500/5 text-amber-300' },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -4 }}
                    className="p-6 rounded-[24px] bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all"
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.accent} flex items-center justify-center mb-4`}>
                      {s.icon}
                    </div>
                    <h4 className="font-bold text-[15px] mb-2 text-white">{s.title}</h4>
                    <p className="text-[13px] text-gray-400 leading-relaxed">{s.desc}</p>
                  </motion.div>
                ))}
              </div>

              {/* Right: compliance seal card */}
              <div className="lg:col-span-2 bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-[32px] border border-white/10 p-8 md:p-12 relative overflow-hidden flex flex-col">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="relative flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-300 flex-shrink-0">
                    <Shield size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">Selo de Conformidade</h3>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Auditado e certificado</p>
                  </div>
                </div>

                <div className="relative space-y-3.5 text-sm text-gray-300 mb-6">
                  {[
                    'Criptografia AES de 256 bits em todos os chips',
                    'Conformidade com LGPD e GDPR',
                    'Armazenamento seguro em nuvem, com backup redundante',
                    'Exclusão definitiva e irreversível de conta em 1 clique',
                    'Certificação ISO 27001 em andamento',
                  ].map((t, i) => (
                    <p key={i} className="flex items-start gap-2.5">
                      <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-400/15 flex items-center justify-center flex-shrink-0">
                        <Check size={11} className="text-emerald-400" />
                      </span>
                      {t}
                    </p>
                  ))}
                </div>

                <div className="relative mt-auto grid grid-cols-2 gap-3 pt-6 border-t border-white/10">
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-white">99.9%</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Uptime AWS</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-white">Anti-DDoS</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Proteção ativa</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Sustainability Section --- */}
        <section id="sustentabilidade" className="py-20 md:py-28 bg-gradient-to-b from-[#0a1a0f] via-[#0d2616] to-[#0a1a0f] text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wIDBoLTJ2LTJoMnYyem0wIDBoLTJ2LTJoMnYyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <p className="eyebrow text-green-400 mb-3">Compromisso com o Planeta</p>
              <h2 className="h2-apple mb-4">Sustentabilidade que transforma.</h2>
              <p className="text-lg text-green-100/50 max-w-3xl mx-auto mb-8">
                Trocando o papel pelo NFC, ajudamos o ecossistema do planeta e reduzimos o desperdício. 
                Cada produto AirNext é uma escolha consciente pelo meio ambiente.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                {[
                  { val: '2.4M', label: 'Cartões de Papel\nEconomizados', icon: <Recycle size={20} /> },
                  { val: '18t', label: 'CO₂ não emitido\nna atmosfera', icon: <Leaf size={20} /> },
                  { val: '1.200+', label: 'Árvores plantadas\nem parceria com ONGs', icon: <TreePine size={20} /> },
                  { val: '100%', label: 'Embalagens\nBiodegradáveis', icon: <Droplets size={20} /> },
                ].map((s, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm min-w-0 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 mx-auto mb-3">
                      {s.icon}
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-green-300 tabular-nums break-words">{s.val}</p>
                    <p className="text-[10px] text-green-100/50 whitespace-pre-line leading-relaxed">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Process Timeline */}
            <div className="mb-16">
              <Swiper
                modules={[Pagination]}
                spaceBetween={20}
                slidesPerView={1}
                pagination={{ clickable: true }}
                breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 4 } }}
                className="pb-10 dark-swiper"
              >
                {[
                  { step: '01', title: 'Produção Limpa', desc: 'Fabricamos com energia renovável e matéria-prima reciclada. Zero resíduos tóxicos.', icon: <Zap size={24} /> },
                  { step: '02', title: 'Uso Inteligente', desc: 'Um único chip substitui milhares de cartões. Sem papel, sem tinta, sem água desperdiçada.', icon: <Nfc size={24} /> },
                  { step: '03', title: 'Logística Verde', desc: 'Entregamos com embalagens 100% biodegradáveis e compensação total da pegada de carbono.', icon: <Globe size={24} /> },
                  { step: '04', title: 'Fim da Vida Útil', desc: 'Todo produto AirNext é reciclável. Devolva para ganharmos desconto no próximo.', icon: <Recycle size={24} /> },
                ].map((s, i) => (
                  <SwiperSlide key={i}>
                    <div className="text-center p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition group h-full">
                      <div className="text-4xl font-bold text-white/10 mb-4">{s.step}</div>
                      <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400 mx-auto mb-4 group-hover:scale-110 transition">
                        {s.icon}
                      </div>
                      <h4 className="text-lg font-bold mb-2">{s.title}</h4>
                      <p className="text-sm text-green-100/40 leading-relaxed">{s.desc}</p>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
              <SwipeIndicator isDark={true} />
            </div>

            {/* Ecological Calculator Enhanced */}
            <div className="mt-12 p-8 md:p-12 rounded-[40px] bg-gradient-to-br from-white/10 via-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm">
              <div className="grid lg:grid-cols-5 gap-10 items-center">
                <div className="lg:col-span-3">
                  <div className="flex items-center gap-3 mb-4">
                    <Leaf size={24} className="text-green-400" />
                    <h3 className="text-2xl font-bold">Calculadora de Impacto Ambiental</h3>
                  </div>
                  <p className="text-sm text-green-100/50 mb-6 leading-relaxed">
                    Arraste o controle deslizante para simular quantos cartões de papel e árvores sua 
                    empresa deixa de consumir ao adotar o AirNext como solução oficial de networking.
                  </p>
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-green-300 uppercase tracking-widest flex items-center gap-2">
                      <Users size={14} /> Colaboradores na sua empresa
                    </label>
                    <div className="relative">
                      <input
                        type="range"
                        min="1"
                        max="500"
                        step="1"
                        value={treeCount}
                        onChange={(e) => setTreeCount(parseInt(e.target.value))}
                        className="w-full h-2.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-green-400 outline-none"
                      />
                      <div className="flex justify-between text-[10px] text-green-100/40 mt-2">
                        <span>1 colaborador</span>
                        <span className="font-bold text-green-300 text-xs">{treeCount}</span>
                        <span>500 colaboradores</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* min-w-0 evita que números grandes estourem a coluna e "sobreponham" o bloco vizinho */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-4 min-w-0">
                  <div className="p-4 sm:p-6 bg-white/10 rounded-2xl border border-white/10 text-center overflow-hidden min-w-0">
                    <Recycle size={26} className="text-green-400 mx-auto mb-3" />
                    <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-green-300 tabular-nums leading-tight break-words">{(treeCount * 300).toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] uppercase text-green-100/50 mt-1 leading-relaxed">Cartões de Papel<br />poupados por ano</p>
                  </div>
                  <div className="p-4 sm:p-6 bg-white/10 rounded-2xl border border-white/10 text-center overflow-hidden min-w-0">
                    <TreePine size={26} className="text-green-400 mx-auto mb-3" />
                    <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-green-300 tabular-nums leading-tight break-words">{(treeCount * 0.3).toFixed(1)}</p>
                    <p className="text-[10px] uppercase text-green-100/50 mt-1 leading-relaxed">Árvores Salvas<br />por ano</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- For Everyone --- */}
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

                      <a href="#produtos" className="inline-flex items-center gap-2 bg-[#0071e3] text-white px-8 py-3.5 rounded-full font-semibold hover:bg-[#0077ed] transition shadow-lg shadow-blue-500/20">
                        Ver Produto <ArrowRight size={16} />
                      </a>
                    </motion.div>
                  </div>
                  <div className="aspect-[4/3] lg:aspect-auto relative overflow-hidden order-1 lg:order-2">
                    <motion.img
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: .8 }}
                      src={resolveImg(`everyone-${everyoneData[activeEveryone].id}`, everyoneData[activeEveryone].img)}
                      alt={everyoneData[activeEveryone].label}
                      className="w-full h-full object-cover min-h-[300px]"
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* --- Quem Somos --- */}
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

        {/* --- B2B & Wholesale Section --- */}
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
                    <h4 className={`font-bold text-base mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard Administrativo</h4>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gerencie todos os perfis da sua equipe em um único painel e crie modelos corporativos.</p>
                  </div>
                  <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#050505] border-white/10' : 'bg-white border-gray-100'}`}>
                    <h4 className={`font-bold text-base mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Revenda & Parcerias</h4>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Torne-se um parceiro AirNext e ganhe margens incríveis revendendo nossa tecnologia.</p>
                  </div>
                </div>
              </div>
              <div className={`${isDark ? 'bg-[#050505] border-white/10' : 'bg-white border-gray-200/60'} rounded-[40px] border p-8 md:p-12 shadow-sm`}>
                <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Fale com nosso time de vendas</h3>
                <form onSubmit={(e) => { e.preventDefault(); alert('Mensagem enviada com sucesso! Entraremos em contato em até 24h.'); }} className="space-y-4">
                  <div>
                    <label className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Seu nome</label>
                    <input required type="text" className={`w-full mt-1 px-4 py-3 ${isDark ? 'bg-[#121212] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition`} />
                  </div>
                  <div>
                    <label className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>E-mail corporativo</label>
                    <input required type="email" className={`w-full mt-1 px-4 py-3 ${isDark ? 'bg-[#121212] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition`} />
                  </div>
                  <div>
                    <label className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mensagem / Tamanho do lote</label>
                    <textarea rows={3} placeholder="Quantos cartões ou produtos você precisa?" className={`w-full mt-1 px-4 py-3 ${isDark ? 'bg-[#121212] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none`} />
                  </div>
                  <button type="submit" className="w-full bg-[#0071e3] text-white py-4 rounded-full text-sm font-bold hover:bg-[#0077ed] transition">
                    Enviar Proposta B2B
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* --- Help & Support --- */}
        <section id="ajuda" className={`py-20 md:py-28 transition-colors duration-500 ${isDark ? 'bg-[#050505] text-white' : 'bg-white text-gray-900'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className={`text-4xl md:text-6xl font-extrabold tracking-tight mb-4 flex items-center justify-center gap-3 flex-wrap ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span>Suporte</span>
                <span className="font-lobster text-6xl md:text-8xl leading-none">
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>Air</span>
                  <span className="text-[#0071e3]">Next</span>
                </span>
              </p>
              <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-500'} max-w-xl mx-auto`}>Estamos aqui para você. Manuais, ajuda e suporte técnico em tempo real.</p>
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
                { icon: <BookOpen size={32} />, title: 'Manuais', desc: 'Guias passo a passo para configurar seu perfil, gravar o chip NFC e personalizar tudo.', link: 'Ver Manuais' },
                { icon: <HelpCircle size={32} />, title: 'Central de Ajuda', desc: 'Base de conhecimento com as dúvidas mais frequentes sobre nossos produtos e serviços.', link: 'Acessar FAQ' },
                { icon: <LifeBuoy size={32} />, title: 'Suporte ao Vivo', desc: 'Fale com nosso time técnico em tempo real pelo WhatsApp ou e-mail dedicado.', link: 'Falar Agora' },
              ].map((s, i) => (
                <SwiperSlide key={i} className="!h-auto">
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
                </SwiperSlide>
              ))}
            </Swiper>
            <SwipeIndicator isDark={isDark} />

            {/* FAQ inline */}
            <div className="mt-20 max-w-3xl mx-auto">
              <h3 className={`text-2xl font-bold mb-8 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>Perguntas Frequentes</h3>
              <div className="space-y-3">
                {[
                  { q: 'Preciso instalar algum aplicativo?', a: 'Não. Todos os celulares modernos já suportam NFC e QR Code nativamente. Basta aproximar o celular — sem baixar nada.' },
                  { q: 'Posso editar meu perfil depois de comprar?', a: 'Sim! O chip aponta para seu perfil online. Você edita quantas vezes quiser pelo painel — o produto físico continua o mesmo.' },
                  { q: 'Qual a durabilidade do chip?', a: 'Nossos chips têm 100.000+ ciclos de gravação e duração superior a 10 anos. Resistentes à água (IP65) e impacto.' },
                  { q: 'Tem mensalidade?', a: 'Zero mensalidade. O plano básico é gratuito para sempre. Upgrade opcional para analytics e domínio personalizado.' },
                  { q: 'Funciona em celulares sem NFC?', a: 'Sim! Todo produto vem com QR Code backup. Funciona em qualquer dispositivo com câmera — inclusive tablets e notebooks.' },
                  { q: 'Fazem personalização para empresas?', a: 'Sim! Cartões com logo, cores corporativas, gravação em lote e dashboard administrativo. Fale conosco: 0800suport@gmail.com' },
                ].map((item, i) => (
                  <details key={i} className={`group rounded-2xl ${isDark ? 'bg-[#121212] border-white/5 text-white' : 'bg-[#f5f5f7] border-gray-100 text-gray-900'} border px-6 py-5 cursor-pointer transition-all`}>
                    <summary className="flex items-center justify-between list-none font-semibold">
                      {item.q}
                      <span className="text-gray-400 text-xl transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className={`text-sm ${isDark ? 'text-gray-400 border-white/10' : 'text-gray-600 border-gray-100'} leading-relaxed mt-3 pt-3 border-t`}>{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- Final CTA --- */}
        <section className="py-20 md:py-28 bg-black text-white relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />

          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <p className="eyebrow text-blue-400 mb-4">Comece Hoje</p>
            <h2 className="h2-apple shimmer-text mb-6">Aproxime. Conecte.<br />Transforme.</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
              Junte-se a milhares de pessoas e negócios que já simplificaram suas conexões com a AirNext. Sem mensalidade, sem fios, sem fricção.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <a href="#produtos" className="bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-xl flex items-center gap-2">
                <ShoppingBag size={18} /> Comprar Agora
              </a>
              <a href="#video-demo" className="bg-white/10 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition border border-white/20 flex items-center gap-2">
                <Play size={18} /> Ver Demo
              </a>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); if (email) { setSent(true); setEmail(''); setTimeout(() => setSent(false), 3000); } }}
              className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 p-2 bg-white/5 border border-white/15 rounded-full backdrop-blur"
            >
              <input
                type="email"
                required
                placeholder="Seu melhor e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent px-5 py-2.5 text-sm placeholder:text-white/40 focus:outline-none text-white"
              />
              <button type="submit" className="bg-white text-black rounded-full px-6 py-2.5 text-sm font-bold hover:bg-blue-50 transition flex items-center justify-center gap-1.5 flex-shrink-0">
                {sent ? <><Check size={14} /> Inscrito!</> : <>10% off <Send size={14} /></>}
              </button>
            </form>
            <p className="text-xs text-white/40 mt-3">Cadastre-se e ganhe 10% na primeira compra. Sem spam.</p>
          </div>
        </section>
      </main>

      {/* --- Adaptive Elegant Footer --- */}
      <footer className={`py-16 md:py-20 border-t relative overflow-hidden transition-colors duration-500 ${
        isDark 
          ? 'bg-[#030712] text-gray-400 border-gray-800' 
          : 'bg-[#f8faf8] text-gray-600 border-green-200/60'
      }`}>
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-green-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-emerald-400/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-5 gap-12 mb-16">
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <Logo dark={isDark} />
                <div className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-full border ${
                  isDark ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                  <Recycle size={12} /> 100% Reciclável
                </div>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} leading-relaxed max-w-sm`}>
                Tecnologia ao toque. Transformando conexões físicas em experiências digitais memoráveis, acessíveis e sustentáveis. 
                Comprometidos com o meio ambiente — cada produto AirNext elimina o desperdício de papel.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {[Camera, MessageCircle, AtSign, Globe].map((Icon, i) => (
                    <a key={i} href="#" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isDark 
                        ? 'bg-white/5 border border-white/10 text-gray-400 hover:border-green-400 hover:text-green-400' 
                        : 'bg-white border border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-600'
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
              { title: 'Produtos', items: ['Cartão Pro', 'Pet Tag', 'Pulseira', 'Hub Desk', 'Anel Inteligente', 'Adesivo NFC'] },
              { title: 'Empresa', items: ['Quem Somos', 'Sustentabilidade', 'Segurança', 'Carreiras'] },
              { title: 'Suporte', items: ['Manuais', 'FAQ', 'Contato', 'WhatsApp'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className={`font-bold text-sm mb-6 tracking-wide uppercase text-xs ${isDark ? 'text-white' : 'text-gray-800'}`}>{col.title}</h4>
                <ul className="space-y-3 text-sm">
                  {col.items.map(item => (
                    <li key={item}>
                      <a href="#" className={`hover:translate-x-1 transition-all inline-block ${
                        isDark ? 'text-gray-400 hover:text-green-400' : 'text-gray-500 hover:text-green-700'
                      }`}>
                        {item}
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
              : 'bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-green-200/60 text-green-700'
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
            isDark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'
          }`}>
            <p>© 2026 AirNext Tecnologia LTDA. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <a href="#" className={`hover:text-green-500 transition`}>Privacidade</a>
              <a href="#" className={`hover:text-green-500 transition`}>Termos de Uso</a>
              <a href="#" className={`hover:text-green-500 transition`}>Configurações de Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      <ScrollUI isDark={isDark} />
      <WhatsAppButton />
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
  return (
    <section className={`py-20 md:py-28 transition-colors duration-500 relative overflow-hidden ${isDark ? 'bg-[#050505] text-white' : 'bg-[#f5f5f7] text-gray-900'}`}>
      {/* Ondas NFC decorativas ao fundo */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className={`absolute rounded-full border-2 ${isDark ? 'border-white' : 'border-black'}`}
            style={{ width: 200 + i * 220, height: 200 + i * 220 }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.15, 0.4] }}
            transition={{ repeat: Infinity, duration: 4, delay: i * 0.6, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="text-center mb-14">
          <p className="eyebrow text-[#0071e3] mb-3">Papel vs. NFC</p>
          <h2 className="h2-apple">Seu contato, salvo em segundos. Sem papel, sem perdas.</h2>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'} max-w-2xl mx-auto mt-2`}>
            Basta aproximar o AirNext do celular de qualquer pessoa: seu cartão digital abre na hora e o contato é salvo automaticamente — sem imprimir, sem app e sem correr o risco de acabar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Cartão de papel tradicional */}
          <div className={`rounded-[28px] p-7 md:p-9 border ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                <CreditCard size={20} />
              </div>
              <h3 className={`text-[17px] font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Cartão de papel tradicional</h3>
            </div>
            <ul className="space-y-4">
              {PAPER_PAINS.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500'}`}>
                    <X size={12} strokeWidth={3} />
                  </span>
                  <span className={`text-[14px] leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cartão digital AirNext (NFC) */}
          <div className={`rounded-[28px] p-7 md:p-9 border relative overflow-hidden ${isDark ? 'bg-gradient-to-b from-[#0071e3]/10 to-[#0a0a0a] border-[#0071e3]/30' : 'bg-white border-[#0071e3]/20'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#0071e3]/15 text-[#0071e3]">
                <Nfc size={20} />
              </div>
              <h3 className={`text-[17px] font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Cartão digital AirNext</h3>
            </div>
            <ul className="space-y-4">
              {NFC_GAINS.map((g, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-[#0071e3]/15 text-[#0071e3]">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className={`text-[14px] leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3 passos rápidos: aproxime, abra, salve */}
        <div className="grid sm:grid-cols-3 gap-4 md:gap-6 mt-10">
          {[
            { icon: <Smartphone size={20} />, title: 'Aproxime', desc: 'Encoste o cartão, tag ou pulseira AirNext no celular da outra pessoa.' },
            { icon: <Zap size={20} />, title: 'Abre na hora', desc: 'O perfil digital abre sozinho, sem instalar nenhum aplicativo.' },
            { icon: <Send size={20} />, title: 'Contato salvo', desc: 'Nome, foto, telefone e links vão direto para a agenda em um toque.' },
          ].map((step, i) => (
            <div key={i} className={`rounded-[24px] p-6 border text-center ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-100'}`}>
              <div className="w-11 h-11 mx-auto rounded-2xl flex items-center justify-center bg-[#0071e3]/15 text-[#0071e3] mb-4">
                {step.icon}
              </div>
              <h4 className={`text-[15px] font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{step.title}</h4>
              <p className={`text-[13px] leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DeviceCompatibilitySection({ isDark }: { isDark: boolean }) {
  const [deviceSearch, setDeviceSearch] = useState('');
  const [expanded, setExpanded] = useState(false);
  
  const allDevicesData = {
    'Apple': { icon: <Smartphone size={24} />, devices: [
      { name: 'iPhone 16 Pro Max', nfc: true, qr: true },
      { name: 'iPhone 16 Pro', nfc: true, qr: true },
      { name: 'iPhone 16', nfc: true, qr: true },
      { name: 'iPhone 15 Pro Max', nfc: true, qr: true },
      { name: 'iPhone 15 Pro', nfc: true, qr: true },
      { name: 'iPhone 15', nfc: true, qr: true },
      { name: 'iPhone 14 Pro Max', nfc: true, qr: true },
      { name: 'iPhone 14', nfc: true, qr: true },
      { name: 'iPhone 13 Pro', nfc: true, qr: true },
      { name: 'iPhone 13', nfc: true, qr: true },
      { name: 'iPhone SE (3ª geração)', nfc: true, qr: true },
      { name: 'iPhone 12 Pro Max', nfc: true, qr: true },
      { name: 'iPhone 12', nfc: true, qr: true },
      { name: 'iPhone 11 Pro Max', nfc: true, qr: true },
      { name: 'iPhone 11', nfc: true, qr: true },
      { name: 'iPhone XR', nfc: true, qr: true },
      { name: 'iPhone XS', nfc: true, qr: true },
      { name: 'iPhone X', nfc: true, qr: true },
      { name: 'iPhone 8 Plus', nfc: true, qr: true },
      { name: 'iPhone 8', nfc: true, qr: true },
      { name: 'iPhone 7 Plus', nfc: true, qr: true },
      { name: 'iPhone 7', nfc: true, qr: true },
      { name: 'iPhone 6s / SE (1ª geração)', nfc: false, qr: true },
      { name: 'iPhone 6 ou anterior', nfc: false, qr: true },
      { name: 'Apple Watch Series 9', nfc: true, qr: false },
      { name: 'Apple Watch Ultra 2', nfc: true, qr: false },
      { name: 'Apple Watch Series 3 a 6', nfc: true, qr: false },
      { name: 'iPad Pro (todas gerações)', nfc: false, qr: true },
      { name: 'iPad Air', nfc: false, qr: true },
      { name: 'iPad Mini', nfc: false, qr: true },
      { name: 'iPad (6ª geração ou superior)', nfc: false, qr: true },
      { name: 'MacBook Pro', nfc: false, qr: true },
      { name: 'MacBook Air', nfc: false, qr: true },
      { name: 'iMac', nfc: false, qr: true },
    ]},
    'Samsung': { icon: <Smartphone size={24} />, devices: [
      { name: 'Galaxy S24 Ultra', nfc: true, qr: true },
      { name: 'Galaxy S24+', nfc: true, qr: true },
      { name: 'Galaxy S24', nfc: true, qr: true },
      { name: 'Galaxy S23 Ultra', nfc: true, qr: true },
      { name: 'Galaxy Z Fold 6', nfc: true, qr: true },
      { name: 'Galaxy Z Flip 6', nfc: true, qr: true },
      { name: 'Galaxy A55 5G', nfc: true, qr: true },
      { name: 'Galaxy A35 5G', nfc: true, qr: true },
      { name: 'Galaxy A15', nfc: true, qr: true },
      { name: 'Galaxy A05', nfc: false, qr: true },
      { name: 'Galaxy S22 Ultra', nfc: true, qr: true },
      { name: 'Galaxy S21', nfc: true, qr: true },
      { name: 'Galaxy S20', nfc: true, qr: true },
      { name: 'Galaxy Note 20 Ultra', nfc: true, qr: true },
      { name: 'Galaxy Note 10', nfc: true, qr: true },
      { name: 'Galaxy S10', nfc: true, qr: true },
      { name: 'Galaxy S9', nfc: true, qr: true },
      { name: 'Galaxy A54', nfc: true, qr: true },
      { name: 'Galaxy A20s', nfc: true, qr: true },
      { name: 'Galaxy J7 (2017) ou anterior', nfc: false, qr: true },
      { name: 'Galaxy Tab S9', nfc: false, qr: true },
      { name: 'Galaxy Tab A (todas)', nfc: false, qr: true },
      { name: 'Galaxy Watch 6', nfc: true, qr: false },
      { name: 'Galaxy Watch 6 Classic', nfc: true, qr: false },
      { name: 'Galaxy Watch 4 / 5', nfc: true, qr: false },
      { name: 'Galaxy Book 4', nfc: false, qr: true },
    ]},
    'Google': { icon: <Smartphone size={24} />, devices: [
      { name: 'Pixel 9 Pro XL', nfc: true, qr: true },
      { name: 'Pixel 9 Pro', nfc: true, qr: true },
      { name: 'Pixel 9', nfc: true, qr: true },
      { name: 'Pixel 8 Pro', nfc: true, qr: true },
      { name: 'Pixel 8', nfc: true, qr: true },
      { name: 'Pixel 7a', nfc: true, qr: true },
      { name: 'Pixel Fold', nfc: true, qr: true },
      { name: 'Pixel 6 Pro', nfc: true, qr: true },
      { name: 'Pixel 6', nfc: true, qr: true },
      { name: 'Pixel 5', nfc: true, qr: true },
      { name: 'Pixel 4a', nfc: true, qr: true },
      { name: 'Pixel 3 ou anterior', nfc: true, qr: true },
      { name: 'Pixel Tablet', nfc: false, qr: true },
      { name: 'Pixel Watch 3', nfc: true, qr: false },
      { name: 'Pixel Watch 2', nfc: true, qr: false },
      { name: 'Chromebook (todos)', nfc: false, qr: true },
    ]},
    'Xiaomi': { icon: <Smartphone size={24} />, devices: [
      { name: 'Xiaomi 14 Ultra', nfc: true, qr: true },
      { name: 'Xiaomi 14 Pro', nfc: true, qr: true },
      { name: 'Xiaomi 14', nfc: true, qr: true },
      { name: 'Xiaomi 13T Pro', nfc: true, qr: true },
      { name: 'Xiaomi 13T', nfc: true, qr: true },
      { name: 'Redmi Note 13 Pro+', nfc: true, qr: true },
      { name: 'Redmi Note 13', nfc: false, qr: true },
      { name: 'Redmi Note 9', nfc: false, qr: true },
      { name: 'Redmi Note 8', nfc: false, qr: true },
      { name: 'Mi 11', nfc: true, qr: true },
      { name: 'Mi 9', nfc: true, qr: true },
      { name: 'Mi A2 / A1', nfc: false, qr: true },
      { name: 'POCO F5 Pro', nfc: true, qr: true },
      { name: 'POCO F5', nfc: true, qr: true },
      { name: 'POCO X6', nfc: true, qr: true },
      { name: 'POCO C65', nfc: false, qr: true },
      { name: 'Xiaomi Pad 6', nfc: false, qr: true },
    ]},
    'Motorola': { icon: <Smartphone size={24} />, devices: [
      { name: 'Edge 50 Pro', nfc: true, qr: true },
      { name: 'Edge 50 Fusion', nfc: true, qr: true },
      { name: 'Edge 50 Neo', nfc: true, qr: true },
      { name: 'Edge 40 Pro', nfc: true, qr: true },
      { name: 'Razr 50 Ultra', nfc: true, qr: true },
      { name: 'Razr 40 Ultra', nfc: true, qr: true },
      { name: 'Moto G84', nfc: true, qr: true },
      { name: 'Moto G54', nfc: true, qr: true },
      { name: 'Moto G34', nfc: false, qr: true },
      { name: 'Moto G14', nfc: false, qr: true },
      { name: 'Moto G7', nfc: true, qr: true },
      { name: 'Moto G6', nfc: false, qr: true },
      { name: 'Moto Z3 / Z2', nfc: true, qr: true },
      { name: 'Moto E (5ª geração ou anterior)', nfc: false, qr: true },
    ]},
    'OnePlus': { icon: <Smartphone size={24} />, devices: [
      { name: 'OnePlus 12', nfc: true, qr: true },
      { name: 'OnePlus 12R', nfc: true, qr: true },
      { name: 'OnePlus 11', nfc: true, qr: true },
      { name: 'OnePlus Nord 4', nfc: true, qr: true },
      { name: 'OnePlus Nord 3', nfc: true, qr: true },
      { name: 'OnePlus 9', nfc: true, qr: true },
      { name: 'OnePlus 7T', nfc: true, qr: true },
      { name: 'OnePlus 6', nfc: false, qr: true },
      { name: 'OnePlus Pad', nfc: false, qr: true },
    ]},
    'Huawei': { icon: <Smartphone size={24} />, devices: [
      { name: 'Huawei Pura 70 Ultra', nfc: true, qr: true },
      { name: 'Huawei Pura 70 Pro', nfc: true, qr: true },
      { name: 'Huawei P60 Pro', nfc: true, qr: true },
      { name: 'Huawei Mate 60 Pro', nfc: true, qr: true },
      { name: 'Huawei Nova 12', nfc: true, qr: true },
      { name: 'Huawei P30 / P20', nfc: true, qr: true },
      { name: 'Huawei Mate 20', nfc: true, qr: true },
      { name: 'Huawei P Smart (todas)', nfc: false, qr: true },
      { name: 'Huawei MatePad Pro', nfc: false, qr: true },
    ]},
    'Realme': { icon: <Smartphone size={24} />, devices: [
      { name: 'Realme GT 5 Pro', nfc: true, qr: true },
      { name: 'Realme GT 5', nfc: true, qr: true },
      { name: 'Realme 12 Pro+', nfc: true, qr: true },
      { name: 'Realme 12', nfc: false, qr: true },
      { name: 'Realme 8 / 7', nfc: false, qr: true },
      { name: 'Realme C67', nfc: false, qr: true },
      { name: 'Realme C25 ou anterior', nfc: false, qr: true },
    ]},
    'LG': { icon: <Smartphone size={24} />, devices: [
      { name: 'LG Velvet', nfc: true, qr: true },
      { name: 'LG G8 ThinQ', nfc: true, qr: true },
      { name: 'LG G7 ThinQ', nfc: true, qr: true },
      { name: 'LG K52 / K42', nfc: false, qr: true },
      { name: 'LG K10 (2017) ou anterior', nfc: false, qr: true },
    ]},
    'Nokia': { icon: <Smartphone size={24} />, devices: [
      { name: 'Nokia X30 5G', nfc: true, qr: true },
      { name: 'Nokia G60', nfc: true, qr: true },
      { name: 'Nokia 8.1', nfc: true, qr: true },
      { name: 'Nokia 6.1 ou anterior', nfc: false, qr: true },
    ]},
  };

  const getFilteredBrands = () => {
    if (!deviceSearch.trim()) return Object.entries(allDevicesData);
    const q = deviceSearch.toLowerCase();
    return Object.entries(allDevicesData).filter(([_, data]) =>
      data.devices.some(d => d.name.toLowerCase().includes(q))
    ).map(([brand, data]) => [
      brand,
      { ...data, devices: data.devices.filter(d => d.name.toLowerCase().includes(q)) }
    ] as const);
  };

  const filteredBrands = getFilteredBrands();
  const totalDevices = Object.values(allDevicesData).reduce((acc, b) => acc + b.devices.length, 0);
  const totalBrands = Object.keys(allDevicesData).length;

  return (
    <section id="dispositivos" className={`py-20 md:py-28 transition-colors duration-500 ${isDark ? 'bg-[#121212] text-white' : 'bg-[#f5f5f7] text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <p className="eyebrow text-[#0071e3] mb-3">Dispositivos Compatíveis</p>
          <h2 className={`h2-apple mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Feito para o ecossistema moderno.</h2>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'} max-w-2xl mx-auto mb-8`}>O AirNext é universal. Compatível com dispositivos Apple, Android e leitores tradicionais.</p>

          {/* Barra de busca sempre visível — a lupa fica acessível mesmo antes de expandir a lista */}
          <div className={`max-w-2xl mx-auto rounded-[24px] border p-4 sm:p-6 flex flex-col gap-5 ${isDark ? 'bg-[#050505] border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="flex flex-col sm:flex-row items-center gap-5 justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>
                  <Smartphone size={22} />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalDevices}+ dispositivos testados</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{totalBrands} marcas · NFC e QR Code</p>
                </div>
              </div>
              <button
                onClick={() => setExpanded(v => !v)}
                className={`flex-shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition ${
                  isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {expanded ? 'Ocultar lista' : 'Ver dispositivos compatíveis'}
                <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={14} />
                </motion.span>
              </button>
            </div>

            {/* Lupa/busca — sempre disponível, digitar já abre a lista de resultados */}
            <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-all duration-300 ${
              isDark
                ? 'bg-[#121212] border-white/10 focus-within:border-[#0071e3] focus-within:ring-2 focus-within:ring-blue-500/20'
                : 'bg-[#f5f5f7] border-gray-200 focus-within:border-[#0071e3] focus-within:ring-2 focus-within:ring-blue-100/50'
            }`}>
              <Search size={18} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder='Pesquisar dispositivo... Ex: "iPhone 16" ou "Galaxy S24"'
                value={deviceSearch}
                onChange={(e) => { setDeviceSearch(e.target.value); if (e.target.value && !expanded) setExpanded(true); }}
                onFocus={() => setExpanded(true)}
                className={`w-full bg-transparent text-sm font-medium placeholder:text-gray-400 focus:outline-none ${isDark ? 'text-white' : 'text-gray-900'}`}
              />
              {deviceSearch && (
                <button onClick={() => setDeviceSearch('')} className="p-1.5 rounded-full hover:bg-gray-200/20 transition flex-shrink-0">
                  <X size={16} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {/* Results Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 pt-8 max-w-7xl mx-auto">
                {filteredBrands.map(([brand, data]) => (
                  <div key={brand} className={`p-6 rounded-[28px] ${isDark ? 'bg-[#050505] border-white/10' : 'bg-white border-gray-100'} border hover:shadow-md transition-all`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-2xl ${isDark ? 'bg-[#121212] text-gray-200' : 'bg-[#f5f5f7] text-gray-700'} shadow-sm flex items-center justify-center`}>
                        {data.icon}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{brand}</p>
                        <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider font-semibold`}>{data.devices.length} dispositivos</p>
                      </div>
                    </div>
                    
                    <div className={`border-t ${isDark ? 'border-white/5' : 'border-gray-100'} pt-4 space-y-1.5 max-h-[260px] overflow-y-auto pr-1 no-scrollbar`}>
                      {data.devices.map(d => (
                        <div key={d.name} className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition ${
                          isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                        }`}>
                          <span className={`font-medium truncate pr-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{d.name}</span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {d.nfc && (
                              <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-50 text-blue-700'} uppercase tracking-wider`}>
                                <Nfc size={10} /> NFC
                              </span>
                            )}
                            {d.qr && (
                              <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-50 text-purple-700'} uppercase tracking-wider`}>
                                <QrCode size={10} /> QR
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {filteredBrands.length === 0 && (
                <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Globe size={48} className="text-gray-400 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-bold mb-2">Nenhum dispositivo encontrado</p>
                  <p className="text-sm">Tente pesquisar por um modelo diferente. Ex: "iPhone", "Galaxy", "Pixel".</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Banner — Universal Compatibility Notice (always visible, compact) */}
        <div className={`mt-10 rounded-[28px] p-8 md:p-12 border relative overflow-hidden ${
          isDark ? 'bg-gradient-to-br from-blue-950/40 via-[#050505] to-purple-950/30 border-white/10' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50 border-blue-100/60'
        }`}>
          <div className="absolute top-0 right-0 w-60 h-60 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative grid md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                  <Zap size={20} />
                </div>
                <p className={`eyebrow ${isDark ? 'text-blue-300' : 'text-[#0071e3]'}`}>Compatibilidade Universal</p>
              </div>
              <h3 className={`text-xl md:text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Funciona em todos os dispositivos com NFC e QR Code.
              </h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Se o seu dispositivo não aparece na lista acima, não se preocupe — ele provavelmente também é compatível.
                Consulte as especificações do seu aparelho ou entre em contato direto com o fabricante para confirmar
                se o seu dispositivo possui o chip <strong>NFC</strong>. <span className={isDark ? 'text-blue-300' : 'text-[#0071e3]'}>O leitor de QR Code está presente em 100% dos smartphones, tablets e notebooks modernos.</span>
              </p>
            </div>
            <div className="flex md:flex-col gap-3">
              <div className={`flex-1 rounded-2xl p-4 text-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                <Nfc size={24} className="text-blue-500 mx-auto mb-2" />
                <p className={`text-[10px] uppercase tracking-widest font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>NFC</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Maioria dos smartphones modernos</p>
              </div>
              <div className={`flex-1 rounded-2xl p-4 text-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                <QrCode size={24} className="text-purple-500 mx-auto mb-2" />
                <p className={`text-[10px] uppercase tracking-widest font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>QR Code</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>100% de todos os celulares</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScrollUI({ isDark }: { isDark: boolean }) {
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const h = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <AnimatePresence>
      {showTop && (
        <motion.button
          initial={{ opacity: 0, scale: .8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: .8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: .9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full flex items-center justify-center border shadow-2xl transition-all ${
            isDark 
              ? 'bg-[#121212] border-white/20 text-white hover:border-[#0071e3] hover:bg-[#1a1a1a] shadow-black' 
              : 'bg-white border-gray-200 text-gray-800 hover:border-[#0071e3] hover:text-[#0071e3] shadow-xl'
          }`}
          aria-label="Voltar ao topo"
        >
          <ArrowUp size={22} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}