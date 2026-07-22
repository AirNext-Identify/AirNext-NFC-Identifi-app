import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPublicProfile, recordVisit } from '../lib/publicApi';

import {
  Wifi,
  Mail,
  Globe,
  Share2,
  UserPlus,
  Play,
  Copy,
  ArrowLeft,
  Lock,
  MapPin,
  AlertTriangle,
  Phone,
  Heart,
  ExternalLink,
  Download,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Star,
  PawPrint,
  Cake,
  Weight,
  Palette,
  Fingerprint,
  Droplet,
  Pill,
  Syringe,
  Stethoscope,
  Shield,
  ClipboardList,
  GraduationCap,
  MessageCircle,
  Info,
  ShoppingBag,
  X,
  Maximize2,
  Quote,
  Gift,
  Compass,
  Puzzle,
  Brain,
  MessageSquareWarning,
  HeartHandshake,
  Footprints,
  BadgeAlert,
  Sparkles,
  Clock,
  CreditCard,
  CalendarClock,
  Radio
} from 'lucide-react';

const DAY_LABELS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_LABELS_FULL = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  debito: 'Cartão de Débito',
  credito: 'Cartão de Crédito',
  vr_va: 'VR / VA',
  boleto: 'Boleto',
  transferencia: 'Transferência',
};

// Calcula se o estabelecimento está aberto agora com base em __horarios
// (array de 7 dias com open/close em HH:mm e flag closed). Se alwaysOpen for
// true, ignora os horários e considera sempre aberto (24h, todos os dias).
function computeOpenStatus(
  horarios: { day: number; open: string; close: string; closed: boolean }[] | undefined,
  alwaysOpen?: boolean
) {
  if (alwaysOpen) return { open: true, today: undefined, alwaysOpen: true };
  if (!Array.isArray(horarios) || horarios.length !== 7) return null;
  const now = new Date();
  const today = horarios.find(h => h.day === now.getDay());
  if (!today || today.closed) return { open: false, today };
  const [oh, om] = (today.open || '00:00').split(':').map(Number);
  const [ch, cm] = (today.close || '23:59').split(':').map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;
  const isOpen = closeMinutes > openMinutes
    ? nowMinutes >= openMinutes && nowMinutes < closeMinutes
    : (nowMinutes >= openMinutes || nowMinutes < closeMinutes); // atravessa a meia-noite
  return { open: isOpen, today };
}

import { QRCodeSVG } from 'qrcode.react';
import { BrandIcon } from '../components/Icons';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { useState, useEffect, useRef } from 'react';
import { getLayoutClasses, ProfileLayout } from '../lib/layout';
import { getFontOption, loadGoogleFont } from '../lib/fonts';
import { PUZZLE_PATTERN_BG } from '../lib/patterns';
import { isLightBackground, getDefaultBackground } from '../lib/background';

/*
 * Não existe mais um "tema" pré-definido separado das cores customizadas.
 * O fundo (gradiente / cor sólida / imagem) escolhido pelo usuário é a
 * única fonte de verdade, e a cor do texto (claro ou escuro) é derivada
 * automaticamente dele — isso elimina o desencontro entre o que é
 * configurado no editor e o que aparece no perfil público.
 */
const DARK_TH = { text: 'text-white', muted: 'text-zinc-400', accent: 'text-blue-400' };
const LIGHT_TH = { text: 'text-zinc-900', muted: 'text-zinc-500', accent: 'text-blue-600' };

/* ─── ÍCONE POR CAMPO (corrige ícones repetidos nas Informações) ─── */
const FIELD_ICONS: Record<string, any> = {
  raca: PawPrint,
  idade: Cake,
  peso: Weight,
  sexo: Info,
  cor: Palette,
  microchip: Fingerprint,
  tipoSanguineo: Droplet,
  alergias: AlertTriangle,
  medicamentos: Pill,
  medicacoes: Pill,
  vacinas: Syringe,
  veterinario: Stethoscope,
  clinica: Stethoscope,
  planoSaude: Shield,
  observacoes: ClipboardList,
  escola: GraduationCap,
  medicoResponsavel: Stethoscope,
  contatoEmergencia1: Phone,
  telefoneEmerg1: Phone,
  contatoEmergencia2: Phone,
  telefoneEmerg2: Phone,
  sensibilidades: AlertTriangle,
  preferenciaComunicacao: MessageCircle,
  comoAjudar: Heart,
  dataNascimento: Cake,
  enderecoTutor: MapPin,
  recompensa: Gift,
  localHabitual: Compass,
  grauSuporte: Puzzle,
  tipoTEA: Brain,
  cid: ClipboardList,
  nivelComunicacao: MessageSquareWarning,
  gatilhos: BadgeAlert,
  estrategiasAcalmar: HeartHandshake,
  itemConforto: Sparkles,
  riscoFuga: Footprints,
  comorbidades: Stethoscope,
  terapias: HeartHandshake,
};
const getFieldIcon = (key: string) => FIELD_ICONS[key] || Info;

const SOCIAL_KEYS = [
  'whatsapp','instagram','facebook','tiktok','threads','twitter','youtube',
  'discord','telegram','linkedin','pinterest','behance','dribbble','github',
  'gitlab','spotify','applemusic','soundcloud','twitch','kick','steam',
  'googlemaps','skype','teams','snapchat','calendly','patreon','kofi',
  'onlyfans','pix','hotmart','mercadolivre','shopee','amazon','ifood',
  'site','email','telefone','whatsappTutor','playlist','slack','signal',
];

const SOCIAL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp', whatsappTutor: 'WhatsApp Tutor', instagram: 'Instagram',
  facebook: 'Facebook', tiktok: 'TikTok', threads: 'Threads', twitter: 'X / Twitter',
  youtube: 'YouTube', discord: 'Discord', telegram: 'Telegram', linkedin: 'LinkedIn',
  pinterest: 'Pinterest', behance: 'Behance', dribbble: 'Dribbble', github: 'GitHub',
  gitlab: 'GitLab', spotify: 'Spotify', applemusic: 'Apple Music', soundcloud: 'SoundCloud',
  twitch: 'Twitch', kick: 'Kick', steam: 'Steam', googlemaps: 'Google Maps',
  skype: 'Skype', teams: 'Teams', snapchat: 'Snapchat', calendly: 'Calendly',
  patreon: 'Patreon', kofi: 'Ko-fi', onlyfans: 'OnlyFans', pix: 'PIX',
  hotmart: 'Hotmart', mercadolivre: 'Mercado Livre', shopee: 'Shopee',
  amazon: 'Amazon', ifood: 'iFood', site: 'Website', email: 'E-mail',
  telefone: 'Telefone', playlist: 'Playlist', slack: 'Slack', signal: 'Signal',
};

/* ─── SOCIAL URL ─────────────────────────────────────────── */
const getSocialUrl = (key: string, val: string): string => {
  if (!val) return '#';
  if (val.startsWith('http')) return val;
  switch (key) {
    case 'whatsapp': case 'whatsappTutor': return `https://wa.me/${val.replace(/\D/g, '')}`;
    case 'instagram': return `https://instagram.com/${val.replace('@', '')}`;
    case 'facebook': return `https://facebook.com/${val}`;
    case 'linkedin': return `https://linkedin.com/in/${val}`;
    case 'twitter': return `https://x.com/${val.replace('@', '')}`;
    case 'tiktok': return `https://tiktok.com/@${val.replace('@', '')}`;
    case 'threads': return `https://threads.net/@${val.replace('@', '')}`;
    case 'youtube': return `https://youtube.com/@${val.replace('@', '')}`;
    case 'telegram': return `https://t.me/${val.replace('@', '')}`;
    case 'github': return `https://github.com/${val}`;
    case 'gitlab': return `https://gitlab.com/${val}`;
    case 'discord': return `https://discord.gg/${val}`;
    case 'spotify': return `https://open.spotify.com/user/${val}`;
    case 'applemusic': return `https://music.apple.com/${val}`;
    case 'soundcloud': return `https://soundcloud.com/${val}`;
    case 'twitch': return `https://twitch.tv/${val}`;
    case 'kick': return `https://kick.com/${val}`;
    case 'steam': return `https://steamcommunity.com/id/${val}`;
    case 'pinterest': return `https://pinterest.com/${val}`;
    case 'behance': return `https://behance.net/${val}`;
    case 'dribbble': return `https://dribbble.com/${val}`;
    case 'snapchat': return `https://snapchat.com/add/${val}`;
    case 'skype': return `https://join.skype.com/invite/${val}`;
    case 'calendly': return `https://calendly.com/${val}`;
    case 'patreon': return `https://patreon.com/${val}`;
    case 'kofi': return `https://ko-fi.com/${val}`;
    case 'onlyfans': return `https://onlyfans.com/${val}`;
    case 'mercadolivre': return `https://mercadolivre.com.br/${val}`;
    case 'shopee': return `https://shopee.com.br/${val}`;
    case 'amazon': return `https://amazon.com.br/${val}`;
    case 'hotmart': return `https://hotmart.com/${val}`;
    case 'googlemaps': return `https://maps.google.com/?q=${encodeURIComponent(val)}`;
    case 'email': return `mailto:${val}`;
    case 'telefone': return `tel:${val}`;
    case 'pix': return '#';
    case 'site': return val.startsWith('http') ? val : `https://${val}`;
    default: return val.startsWith('http') ? val : `https://${val}`;
  }
};

/* ─── LOADING SCREEN ──────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 rounded-full bg-violet-600/15 blur-3xl" />
      </div>
      <div className="relative flex flex-col items-center gap-5 scale-in">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
          <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl" />
        </div>
        <p className="text-zinc-500 text-sm font-semibold tracking-wide">Carregando perfil...</p>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ──────────────────────────────────────── */
export default function PublicProfile() {
  const { slug } = useParams<{ slug: string }>();
  const toast = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [carIdx, setCarIdx] = useState(0);
  const carRef = useRef<HTMLDivElement>(null);
  const [depIdx, setDepIdx] = useState(0);
  const depRef = useRef<HTMLDivElement>(null);
  const [showPix, setShowPix] = useState(false);
  const [showWifi, setShowWifi] = useState(false);
  const [showHorarios, setShowHorarios] = useState(false);
  const [showWifiPass, setShowWifiPass] = useState(false);
  const [showApoioTEA, setShowApoioTEA] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightbox2Index, setLightbox2Index] = useState<number | null>(null);
  const [gal2Idx, setGal2Idx] = useState(0);
  const gal2Ref = useRef<HTMLDivElement>(null);
  const visitRecorded = useRef(false);

  useEffect(() => {
    const load = async () => {
      if (!slug) { setNotFound(true); setLoading(false); return; }
      setLoading(true);
      const p = await getPublicProfile(slug);
      if (!p) { setIsPrivate(true); setLoading(false); return; }
      setProduct(p);
      setLoading(false);
      if (!visitRecorded.current) {
        visitRecorded.current = true;
        const params = new URLSearchParams(window.location.search);
        const via = params.get('via');
        const type: 'nfc' | 'qr' | 'link' = via === 'qr' ? 'qr' : via === 'nfc' ? 'nfc' : 'link';
        await recordVisit(p.id, type, 'view');
      }
    };
    load();
  }, [slug, getPublicProfile, recordVisit]);

  useEffect(() => {
    if (!carRef.current) return;
    const handler = () => {
      if (!carRef.current) return;
      const idx = Math.round(carRef.current.scrollLeft / ((carRef.current.children[0] as HTMLElement)?.clientWidth + 12 || 1));
      setCarIdx(Math.max(0, Math.min(idx, (product?.mediaCarousel?.length || 1) - 1)));
    };
    carRef.current.addEventListener('scroll', handler, { passive: true });
    return () => carRef.current?.removeEventListener('scroll', handler);
  }, [product]);

  useEffect(() => {
    if (!depRef.current) return;
    const handler = () => {
      if (!depRef.current) return;
      const idx = Math.round(depRef.current.scrollLeft / ((depRef.current.children[0] as HTMLElement)?.clientWidth + 12 || 1));
      setDepIdx(Math.max(0, Math.min(idx, (product?.profileData?.depoimentos?.length || 1) - 1)));
    };
    depRef.current.addEventListener('scroll', handler, { passive: true });
    return () => depRef.current?.removeEventListener('scroll', handler);
  }, [product]);

  useEffect(() => {
    if (!gal2Ref.current) return;
    const handler = () => {
      if (!gal2Ref.current) return;
      const idx = Math.round(gal2Ref.current.scrollLeft / ((gal2Ref.current.children[0] as HTMLElement)?.clientWidth + 14 || 1));
      setGal2Idx(Math.max(0, Math.min(idx, (product?.profileData?.mediaCarousel2?.length || 1) - 1)));
    };
    gal2Ref.current.addEventListener('scroll', handler, { passive: true });
    return () => gal2Ref.current?.removeEventListener('scroll', handler);
  }, [product]);

  useEffect(() => {
    if (lightboxIndex === null && lightbox2Index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setLightboxIndex(null); setLightbox2Index(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, lightbox2Index]);

  useEffect(() => {
    loadGoogleFont(product?.profileData?.__fontFamily);
  }, [product]);

  if (loading) return <LoadingScreen />;

  if (isPrivate) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-blue-600/15 blur-3xl" />
      </div>
      <div className="relative text-center max-w-sm scale-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-white/10 to-white/[0.02] ring-1 ring-white/10 shadow-xl flex items-center justify-center mx-auto mb-6">
          <Lock className="h-9 w-9 text-zinc-500" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2 tracking-tight">Perfil Privado</h1>
        <p className="text-zinc-500 text-sm leading-relaxed">Este perfil está configurado como privado e não pode ser acessado publicamente.</p>
        <Link to="/" className="group inline-flex items-center gap-2 mt-8 px-5 py-2.5 bg-white/5 rounded-full text-sm text-zinc-400 hover:text-white border border-white/8 hover:border-white/20 transition-all">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Voltar para o início
        </Link>
      </div>
    </div>
  );

  if (notFound || !product) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-blue-600/15 blur-3xl" />
      </div>
      <div className="relative text-center max-w-sm scale-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-white/10 to-white/[0.02] ring-1 ring-white/10 shadow-xl flex items-center justify-center mx-auto mb-6">
          <Wifi className="h-9 w-9 text-zinc-500" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2 tracking-tight">Perfil não encontrado</h1>
        <p className="text-zinc-500 text-sm">Verifique se o link está correto.</p>
        <Link to="/" className="group inline-flex items-center gap-2 mt-8 px-5 py-2.5 bg-white/5 rounded-full text-sm text-zinc-400 hover:text-white border border-white/8 hover:border-white/20 transition-all">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Voltar
        </Link>
      </div>
    </div>
  );

  const d: any = product.profileData || {};
  const cat = product.category || 'PERSONAL';
  const wallpaperValue: string = d.__wallpaper || '';
  const isImageWallpaper = wallpaperValue.startsWith('http') || wallpaperValue.startsWith('data:');
  const bgClass = isImageWallpaper ? '' : (wallpaperValue || getDefaultBackground(cat));
  const isLightTheme = isLightBackground(wallpaperValue || getDefaultBackground(cat));
  const th = isLightTheme ? LIGHT_TH : DARK_TH;
  const bgStyle: { backgroundImage?: string; backgroundSize?: string; backgroundPosition?: string; backgroundRepeat?: string } = isImageWallpaper
    ? { backgroundImage: `url(${wallpaperValue})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
    : {};
  const textColorOverride: string = d.__textColor || '';
  const nameColorValue: string = d.__nameColor || textColorOverride;
  const bioColorValue: string = d.__bioColor || textColorOverride;
  const mainTextColorValue: string = d.__mainTextColor || textColorOverride;
  const nameStyle = nameColorValue ? { color: nameColorValue } : undefined;
  const bioStyle = bioColorValue ? { color: bioColorValue } : undefined;
  // Cor dos títulos/labels de seção (ex.: "Telefone", "Redes & Contato"),
  // independente da cor dos valores preenchidos pelo usuário.
  const labelColor: string = d.__labelColor || '';
  const labelStyle = labelColor ? { color: labelColor } : undefined;
  const mainTextStyle = mainTextColorValue ? { color: mainTextColorValue } : undefined;
  const name = d.nome || d.nomeEmpresa || '';
  const bio = d.bio || d.descricao || '';
  const cargo = d.cargo || '';
  const hidden = d.__hiddenFields || [];
  const borderRadius = d.__borderRadius ?? 20;
  const primaryColor = d.__primaryColor || '#3b82f6';
  const secondaryColor = d.__secondaryColor || '#8b5cf6';
  const buttonStyle = d.__buttonStyle || 'rounded-2xl';
  const buttonColor: string = d.__buttonColor || primaryColor;
  const appsColor: string = d.__appsColor || '';
  const layout: ProfileLayout = d.__layout || 'center';
  const layoutClasses = getLayoutClasses(layout);
  const fontOption = getFontOption(d.__fontFamily);
  const linkStyle = d.__linkStyle || 'grid';
  const verified = d.__verified || false;
  const sosMode = d.__sosMode || false;
  const carouselItems = product.mediaCarousel || [];
  const cardOpacity = d.__opacity ?? 90;
  const blurAmount = d.__blurAmount ?? 0;

  const visibleSocials = SOCIAL_KEYS.filter(s =>
    d[s] && !hidden.includes(s) && s !== 'site' && s !== 'email' && s !== 'telefone'
  );

  const customBr = `${borderRadius}px`;
  const cardAlpha = isLightTheme ? `rgba(255,255,255,${cardOpacity / 100 * 0.9})` : `rgba(255,255,255,${cardOpacity / 100 * 0.06})`;

  const trackClick = (action: string) => {
    // Fire-and-forget: não bloqueia a navegação do visitante.
    recordVisit(product.id, 'link', action).catch(() => {});
  };

  const share = async () => {
    trackClick('share');
    try {
      if (navigator.share) await navigator.share({ title: name, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); toast.show('Link copiado!', 'success'); }
    } catch {}
  };

  // Campos dedicados do "Salvar Contato", preenchidos no editor (Perfil.tsx).
  // Se o dono do perfil não configurar nada, cai de volta nos campos padrão
  // do perfil (nome, telefone, email etc.) para manter compatibilidade.
  const vcard = d.__vcard || {};

  // Confete comemorativo ao salvar o contato — leve, sem dependências novas
  // (evita instalar qualquer biblioteca externa). Usa a paleta oficial
  // AirNext + verde de sucesso, e se remove sozinho do DOM.
  const fireConfetti = () => {
    const colors = ['#2563EB', '#3B82F6', '#60A5FA', '#22C55E', '#F59E0B', '#FFFFFF'];
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
    document.body.appendChild(container);
    const total = 70;
    for (let i = 0; i < total; i++) {
      const piece = document.createElement('span');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const size = 6 + Math.random() * 6;
      const duration = 2.2 + Math.random() * 1.4;
      const delay = Math.random() * 0.35;
      const rotate = Math.random() * 360;
      const drift = Math.round((Math.random() - 0.5) * 220);
      const isCircle = Math.random() > 0.5;
      piece.style.cssText = `position:absolute;top:-10px;left:${left}%;width:${size}px;height:${size * (isCircle ? 1 : 0.4)}px;background:${color};opacity:0.95;border-radius:${isCircle ? '50%' : '2px'};transform:rotate(${rotate}deg);animation:ppConfettiFall ${duration}s ease-in ${delay}s forwards;--pp-drift:${drift}px;`;
      container.appendChild(piece);
    }
    window.setTimeout(() => container.remove(), 4200);
  };

  const saveContact = () => {
    trackClick('save_contact');
    const vName = vcard.nome || name;
    const vOrg = vcard.empresa || d.nomeEmpresa || '';
    const vTitle = vcard.cargo || cargo;
    const vTel = vcard.telefone || d.telefone || d.whatsapp || '';
    const vTel2 = vcard.telefone2 || '';
    const vEmail = vcard.email || d.email || '';
    const vSite = vcard.site || d.site || '';
    const vEndereco = vcard.endereco || d.endereco || '';
    const vObs = vcard.observacoes || '';

    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${vName}`,
      `FN:${vName}`,
      vTel && `TEL;TYPE=CELL:${vTel}`,
      vTel2 && `TEL;TYPE=WORK,VOICE:${vTel2}`,
      vEmail && `EMAIL:${vEmail}`,
      vSite && `URL:${vSite}`,
      vOrg && `ORG:${vOrg}`,
      vTitle && `TITLE:${vTitle}`,
      vEndereco && `ADR;TYPE=WORK:;;${vEndereco};;;;`,
      vObs && `NOTE:${vObs}`,
      'END:VCARD',
    ].filter(Boolean);

    const v = lines.join('\n');
    const blob = new Blob([v], { type: 'text/vcard' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${vName || name || 'contato'}.vcf`;
    a.click();
    toast.show('Contato salvo!', 'success');
    fireConfetti();
  };

  const hasCover = !!d.capa;

  const depoimentosList = Array.isArray(d.depoimentos) ? d.depoimentos : [];
  const defaultBlockOrder = ['midia', 'petStats', 'businessStats', 'social', 'contato', 'maisInfo', 'sobreEmpresa', 'catalogo', 'avaliacaoGoogle', 'depoimentos', 'contatoForm', 'wifi', 'horarios', 'pagamento', 'apoioTEA', 'pix'];
  const blockOrder: string[] = Array.isArray(d.__blockOrder) && d.__blockOrder.length ? d.__blockOrder : defaultBlockOrder;
  const hiddenBlockIds: string[] = Array.isArray(d.__hiddenBlocks) ? d.__hiddenBlocks : [];

  const mediaBlock = carouselItems.length > 0 ? (
    <div className="relative group/car" style={{ backgroundColor: isLightTheme ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.2)' }}>
      {cat === 'BUSINESS' && (
        <p className={`text-[10px] font-bold uppercase tracking-widest ${th.muted} px-4 pt-5 -mb-1`} style={labelStyle}>Fotos &amp; Produtos</p>
      )}
      <div
        ref={carRef}
        className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory hide-scrollbar px-4 py-5"
      >
        {carouselItems.map((m: any, i: number) => (
          <div key={m.id} className={`shrink-0 snap-center ${cat === 'BUSINESS' ? 'w-[90%] sm:w-[440px]' : 'w-[78%] sm:w-72'}`}>
            <button
              onClick={() => m.type === 'image' ? setLightboxIndex(i) : window.open(m.url, '_blank')}
              className={`group/img relative w-full overflow-hidden shadow-xl active:scale-[0.98] transition-transform block ${cat === 'BUSINESS' ? 'aspect-[4/3] sm:aspect-[16/11]' : 'aspect-[4/3]'}`}
              style={{ borderRadius: customBr }}
            >
              {m.type === 'image'
                ? <>
                    <img src={m.url} alt={m.caption || ''} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/img:scale-110" />
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                      <Maximize2 className="h-6 w-6 text-white drop-shadow-lg" />
                    </div>
                    {m.caption && (
                      <div className="absolute bottom-0 inset-x-0 px-3 py-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                        <p className="text-[11px] sm:text-xs text-white font-semibold text-left line-clamp-2 drop-shadow">{m.caption}</p>
                      </div>
                    )}
                  </>
                : <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-white group">
                      <div className="w-14 h-14 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-all">
                        <Play className="h-7 w-7 text-white ml-0.5" />
                      </div>
                      <span className="text-xs text-white/60">Ver vídeo</span>
                    </div>
                  </div>
              }
            </button>
          </div>
        ))}
      </div>

      {carouselItems.length > 1 && (
        <>
          <button
            onClick={() => {
              const el = carRef.current; if (!el) return;
              el.scrollBy({ left: -(el.children[0] as HTMLElement)?.clientWidth - 14, behavior: 'smooth' });
            }}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur items-center justify-center text-white opacity-0 group-hover/car:opacity-100 transition-opacity z-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const el = carRef.current; if (!el) return;
              el.scrollBy({ left: (el.children[0] as HTMLElement)?.clientWidth + 14, behavior: 'smooth' });
            }}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur items-center justify-center text-white opacity-0 group-hover/car:opacity-100 transition-opacity z-10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {carouselItems.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-4">
          {carouselItems.map((_: any, i: number) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: i === carIdx ? 20 : 6, backgroundColor: i === carIdx ? primaryColor : (isLightTheme ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)') }}
            />
          ))}
        </div>
      )}
    </div>
  ) : null;

  const socialBlock = visibleSocials.length > 0 ? (
    <div className="px-5 py-5" style={{ backgroundColor: isLightTheme ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.12)' }}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${th.muted} mb-4`} style={labelStyle}>Redes &amp; Contato</p>
      {linkStyle === 'grid' ? (
        <div className="grid grid-cols-4 gap-2.5">
          {visibleSocials.map(s => (
            <a
              key={s}
              href={getSocialUrl(s, d[s])}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick(s)}
              className="pp-social-chip flex flex-col items-center justify-center gap-1.5 py-3 transition-all active:scale-90 hover:scale-105"
              style={{ backgroundColor: appsColor ? `${appsColor}26` : (isLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)'), borderRadius: customBr }}
            >
              <BrandIcon name={s === 'whatsappTutor' ? 'whatsapp' : s} className="w-5 h-5" />
              <span className={`text-[9px] font-bold ${th.muted} truncate max-w-full px-1`}>
                {SOCIAL_LABELS[s] || s}
              </span>
            </a>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {visibleSocials.map(s => (
            <a
              key={s}
              href={getSocialUrl(s, d[s])}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick(s)}
              className={`pp-social-chip flex items-center gap-3.5 px-4 py-3.5 transition-all active:scale-[0.98] hover:opacity-90 ${buttonStyle}`}
              style={{ backgroundColor: appsColor ? `${appsColor}26` : (isLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)'), borderRadius: customBr }}
            >
              <BrandIcon name={s === 'whatsappTutor' ? 'whatsapp' : s} className="w-5 h-5 shrink-0" />
              <span className={`text-sm font-semibold ${th.text} flex-1`}>
                {SOCIAL_LABELS[s] || s}
              </span>
              <ExternalLink className={`h-3.5 w-3.5 ${th.muted}`} />
            </a>
          ))}
        </div>
      )}
    </div>
  ) : null;

  const contatoBlock = (d.telefone || d.email || d.site || d.endereco) ? (
    <div className="px-5 py-5 space-y-2.5" style={{ backgroundColor: isLightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.1)' }}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${th.muted} mb-4`} style={labelStyle}>Informações</p>
      {d.telefone && !hidden.includes('telefone') && (
        <a href={`tel:${d.telefone}`} onClick={() => trackClick('phone')}
          className="pp-row-hover flex items-center gap-4 px-4 py-3.5 transition-all active:scale-[0.98] hover:opacity-90"
          style={{ backgroundColor: isLightTheme ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', borderRadius: customBr }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <Phone className="h-4 w-4" style={{ color: primaryColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${th.muted}`} style={labelStyle}>Telefone</p>
            <p className={`text-sm font-semibold ${th.text} truncate`} style={mainTextStyle}>{d.telefone}</p>
          </div>
        </a>
      )}
      {d.email && !hidden.includes('email') && (
        <a href={`mailto:${d.email}`} onClick={() => trackClick('email')}
          className="pp-row-hover flex items-center gap-4 px-4 py-3.5 transition-all active:scale-[0.98] hover:opacity-90"
          style={{ backgroundColor: isLightTheme ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', borderRadius: customBr }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <Mail className="h-4 w-4" style={{ color: primaryColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${th.muted}`} style={labelStyle}>E-mail</p>
            <p className={`text-sm font-semibold ${th.text} truncate`} style={mainTextStyle}>{d.email}</p>
          </div>
        </a>
      )}
      {d.site && !hidden.includes('site') && (
        <a href={getSocialUrl('site', d.site)} target="_blank" rel="noopener noreferrer" onClick={() => trackClick('site')}
          className="pp-row-hover flex items-center gap-4 px-4 py-3.5 transition-all active:scale-[0.98] hover:opacity-90"
          style={{ backgroundColor: isLightTheme ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', borderRadius: customBr }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <Globe className="h-4 w-4" style={{ color: primaryColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${th.muted}`} style={labelStyle}>Website</p>
            <p className={`text-sm font-semibold ${th.text} truncate`} style={mainTextStyle}>{d.site}</p>
          </div>
          <ExternalLink className={`h-3.5 w-3.5 ${th.muted} shrink-0`} />
        </a>
      )}
      {d.endereco && !hidden.includes('endereco') && (
        <a href={`https://maps.google.com/?q=${encodeURIComponent(d.endereco)}`} target="_blank" rel="noopener noreferrer"
          className="pp-row-hover flex items-center gap-4 px-4 py-3.5 transition-all active:scale-[0.98] hover:opacity-90"
          style={{ backgroundColor: isLightTheme ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', borderRadius: customBr }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <MapPin className="h-4 w-4" style={{ color: primaryColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${th.muted}`} style={labelStyle}>Localização</p>
            <p className={`text-sm font-semibold ${th.text} truncate`} style={mainTextStyle}>{d.endereco}</p>
          </div>
          <ExternalLink className={`h-3.5 w-3.5 ${th.muted} shrink-0`} />
        </a>
      )}
    </div>
  ) : null;

  // Chaves promovidas para o grid de "Resumo Rápido" do perfil PET — ficam
  // de fora da lista detalhada de "Mais Informações" para não duplicar.
  const petStatKeys = ['idade', 'peso', 'raca', 'sexo'];
  const petStatLabels: Record<string, string> = { idade: 'Idade', peso: 'Peso', raca: 'Raça', sexo: 'Sexo' };
  const petStatIcons: Record<string, any> = { idade: Cake, peso: Weight, raca: PawPrint, sexo: Info };

  const maisInfoBlock = (() => {
    const infoFieldsByCategory: Record<string, { key: string; label: string }[]> = {
      PET: [
        { key: 'raca', label: 'Raça' },
        { key: 'idade', label: 'Idade' },
        { key: 'peso', label: 'Peso' },
        { key: 'sexo', label: 'Sexo' },
        { key: 'cor', label: 'Cor / Pelagem' },
        { key: 'microchip', label: 'Microchip' },
        { key: 'enderecoTutor', label: 'Bairro de Referência' },
        { key: 'tipoSanguineo', label: 'Tipo Sanguíneo' },
        { key: 'alergias', label: 'Alergias' },
        { key: 'medicamentos', label: 'Medicamentos' },
        { key: 'vacinas', label: 'Vacinas' },
        { key: 'veterinario', label: 'Veterinário' },
        { key: 'clinica', label: 'Clínica Veterinária' },
        { key: 'planoSaude', label: 'Plano de Saúde' },
        { key: 'observacoes', label: 'Observações' },
      ],
      KIDS: [
        { key: 'escola', label: 'Escola' },
        { key: 'tipoSanguineo', label: 'Tipo Sanguíneo' },
        { key: 'alergias', label: 'Alergias' },
        { key: 'medicamentos', label: 'Medicamentos' },
        { key: 'medicoResponsavel', label: 'Médico Responsável' },
        { key: 'planoSaude', label: 'Plano de Saúde' },
        { key: 'observacoes', label: 'Observações' },
      ],
      SENIOR: [
        { key: 'tipoSanguineo', label: 'Tipo Sanguíneo' },
        { key: 'alergias', label: 'Alergias' },
        { key: 'medicacoes', label: 'Medicações' },
        { key: 'medicoResponsavel', label: 'Médico Responsável' },
        { key: 'planoSaude', label: 'Plano de Saúde' },
        { key: 'contatoEmergencia1', label: 'Contato Emergência 1' },
        { key: 'telefoneEmerg1', label: 'Tel. Emergência 1' },
        { key: 'contatoEmergencia2', label: 'Contato Emergência 2' },
        { key: 'telefoneEmerg2', label: 'Tel. Emergência 2' },
        { key: 'observacoes', label: 'Observações' },
      ],
      TEA: [
        { key: 'cid', label: 'CID / Laudo' },
        { key: 'tipoSanguineo', label: 'Tipo Sanguíneo' },
        { key: 'alergias', label: 'Alergias' },
        { key: 'medicamentos', label: 'Medicamentos' },
        { key: 'comorbidades', label: 'Condições Associadas' },
        { key: 'terapias', label: 'Terapias em Acompanhamento' },
        { key: 'preferenciaComunicacao', label: 'Comunicação Preferida' },
        { key: 'medicoResponsavel', label: 'Médico / Terapeuta' },
        { key: 'planoSaude', label: 'Plano de Saúde' },
        { key: 'contatoEmergencia', label: 'Contato de Emergência' },
        { key: 'telefoneEmergencia', label: 'Tel. Emergência' },
        { key: 'observacoes', label: 'Observações' },
      ],
      BUSINESS: [],
    };
    const fields = (infoFieldsByCategory[cat] || []).filter(
      f => d[f.key] && !hidden.includes(f.key) && !(cat === 'PET' && petStatKeys.includes(f.key))
    );
    if (fields.length === 0) return null;
    return (
      <div className="px-5 py-5" style={{ backgroundColor: isLightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.1)' }}>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${th.muted} mb-3`} style={labelStyle}>Mais Informações</p>
        <div className="space-y-2">
          {fields.map(f => {
            const FIcon = getFieldIcon(f.key);
            return (
              <div
                key={f.key}
                className="group flex items-center gap-4 px-4 py-3.5 transition-all duration-300 hover:shadow-md"
                style={{ backgroundColor: isLightTheme ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', borderRadius: customBr }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${primaryColor}20` }}>
                  <FIcon className="h-4 w-4" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${th.muted}`} style={labelStyle}>{f.label}</p>
                  <p className={`text-sm font-semibold ${th.text}`} style={mainTextStyle}>{d[f.key]}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  })();

  // Grid de "Resumo Rápido" — cards tipo cubo com ícone, label e valor,
  // seguidos de um CTA direto para contatar o tutor. Só aparece no PET e
  // só quando houver ao menos um dos campos promovidos preenchido.
  const petStatsBlock = (() => {
    if (cat !== 'PET') return null;
    const stats = petStatKeys.filter(k => d[k] && !hidden.includes(k));
    if (stats.length === 0) return null;
    const tutorContact = d.whatsapp || d.telefone;
    return (
      <div className="px-5 py-5" style={{ backgroundColor: isLightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.1)' }}>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${th.muted} mb-3`} style={labelStyle}>Resumo Rápido</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(k => {
            const Icon = petStatIcons[k];
            return (
              <div
                key={k}
                className="group flex flex-col items-center text-center gap-2 py-5 px-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{
                  borderRadius: customBr,
                  background: isLightTheme
                    ? `linear-gradient(155deg, ${primaryColor}14, ${secondaryColor}0c)`
                    : `linear-gradient(155deg, ${primaryColor}22, ${secondaryColor}14)`,
                  border: `1px solid ${primaryColor}28`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-md"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-wide ${th.muted}`} style={labelStyle}>{petStatLabels[k]}</p>
                <p className={`text-base font-black ${th.text} leading-tight`} style={mainTextStyle}>{d[k]}</p>
              </div>
            );
          })}
        </div>
        {tutorContact && (
          <a
            href={`https://wa.me/${tutorContact.replace(/\D/g, '')}`}
            onClick={() => trackClick('pet_contact_tutor')}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 font-bold text-sm text-white shadow-lg transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            style={{ borderRadius: customBr, background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
          >
            <MessageCircle className="h-4 w-4" /> Encontrei este pet — falar com o tutor
          </a>
        )}
      </div>
    );
  })();

  // "Destaques" do negócio — anos de mercado (calculado a partir da Data de
  // Fundação), clientes atendidos e especialidade, se o dono preencheu.
  const businessStatsBlock = (() => {
    if (cat !== 'BUSINESS') return null;
    const yearMatch = String(d.dataFundacao || '').match(/(19|20)\d{2}/);
    const anos = yearMatch ? new Date().getFullYear() - parseInt(yearMatch[0], 10) : null;
    const stats: { label: string; value: string; icon: any }[] = [];
    if (anos !== null && anos >= 0 && anos < 150) {
      stats.push({
        label: anos === 0 ? 'No mercado' : anos === 1 ? 'Ano de mercado' : 'Anos de mercado',
        value: anos === 0 ? 'Novo' : `${anos}+`,
        icon: CalendarClock,
      });
    }
    if (d.numeroClientes) stats.push({ label: 'Clientes atendidos', value: d.numeroClientes, icon: UserPlus });
    if (d.especialidade) stats.push({ label: 'Especialidade', value: d.especialidade, icon: Star });
    if (stats.length === 0) return null;
    return (
      <div className="px-5 py-5" style={{ backgroundColor: isLightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.1)' }}>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${th.muted} mb-3`} style={labelStyle}>Destaques</p>
        <div className={`grid gap-3 ${stats.length === 1 ? 'grid-cols-1' : stats.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {stats.map((s, i) => (
            <div
              key={i}
              className="group flex flex-col items-center text-center gap-2 py-5 px-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{
                borderRadius: customBr,
                background: isLightTheme
                  ? `linear-gradient(155deg, ${primaryColor}14, ${secondaryColor}0c)`
                  : `linear-gradient(155deg, ${primaryColor}22, ${secondaryColor}14)`,
                border: `1px solid ${primaryColor}28`,
              }}
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-md"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-wide ${th.muted}`} style={labelStyle}>{s.label}</p>
              <p className={`text-base font-black ${th.text} leading-tight`} style={mainTextStyle}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  })();

  // "Fale com a Empresa" — formulário de contato/feedback do cliente. Sem
  // depender de nenhum backend novo: monta um `mailto:` com os dados
  // preenchidos e abre o app de e-mail do próprio visitante, endereçado ao
  // e-mail que o dono do perfil configurou em "E-mail para Receber Contatos
  // de Clientes" (ou o E-mail Comercial, se aquele não estiver preenchido).
  const contatoFormBlock = (() => {
    if (cat !== 'BUSINESS') return null;
    const receiverEmail = d.emailContato || d.email;
    if (!receiverEmail) return null;
    const fieldCls = `w-full px-4 py-3 text-sm ${th.text} placeholder:opacity-40 outline-none transition-all duration-200 focus:ring-2 focus:ring-offset-0`;
    const fieldStyle = {
      borderRadius: customBr,
      backgroundColor: isLightTheme ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
      ['--tw-ring-color' as any]: `${primaryColor}66`,
    };
    const handleSubmit = (e: any) => {
      e.preventDefault();
      trackClick('contact_form_submit');
      const subject = encodeURIComponent(`Contato via perfil — ${name}`);
      const body = encodeURIComponent(`Nome: ${contactName}\nE-mail para retorno: ${contactEmail}\n\nMensagem:\n${contactMessage}`);
      window.location.href = `mailto:${receiverEmail}?subject=${subject}&body=${body}`;
      setContactSent(true);
    };
    return (
      <div className="px-5 py-6" style={{ backgroundColor: isLightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.1)' }}>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${th.muted} mb-1`} style={labelStyle}>Fale com a Empresa</p>
        <p className={`text-xs ${th.muted} mb-4`}>Mande uma mensagem ou feedback direto por e-mail.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" required placeholder="Seu nome" value={contactName} onChange={e => setContactName(e.target.value)} className={fieldCls} style={fieldStyle} />
          <input type="email" required placeholder="Seu e-mail para retorno" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className={fieldCls} style={fieldStyle} />
          <textarea required placeholder="Sua mensagem ou feedback..." rows={4} value={contactMessage} onChange={e => setContactMessage(e.target.value)} className={`${fieldCls} resize-none`} style={fieldStyle} />
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 font-bold text-sm text-white shadow-lg transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            style={{ borderRadius: customBr, background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
          >
            <Mail className="h-4 w-4" /> Enviar mensagem
          </button>
          {contactSent && (
            <p className="text-xs text-emerald-500 font-semibold text-center pt-1">✓ Seu app de e-mail abriu com a mensagem pronta — é só confirmar o envio.</p>
          )}
        </form>
      </div>
    );
  })();

  const galeria2 = Array.isArray(d.mediaCarousel2) ? d.mediaCarousel2.filter((m: any) => m?.url) : [];
  const sobreEmpresaBlock = (cat === 'BUSINESS' && (d.descricao || d.dataFundacao || galeria2.length > 0)) ? (
    <div className="px-5 py-6" style={{ backgroundColor: isLightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.1)' }}>
      <div
        className="relative overflow-hidden px-6 py-7 group/car2"
        style={{
          borderRadius: customBr,
          background: isLightTheme
            ? `linear-gradient(155deg, ${primaryColor}12, ${secondaryColor}0f, #f59e0b08)`
            : `linear-gradient(155deg, ${primaryColor}20, ${secondaryColor}16, #f59e0b12)`,
          border: `1px solid ${primaryColor}26`,
        }}
      >
        {/* Blobs de gradiente: um frio (primary/secondary) e um quente (âmbar/rosa), reforçando o contraste frio x quente */}
        <div
          className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl opacity-30"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
        />
        <div
          className="absolute -bottom-14 -left-10 w-40 h-40 rounded-full blur-3xl opacity-25"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${primaryColor}33, #f59e0b22)` }}
            >
              <ShoppingBag className="h-4.5 w-4.5" style={{ color: primaryColor }} />
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${th.muted}`} style={labelStyle}>Sobre a Empresa</p>
              {d.dataFundacao && <p className="text-[11px] font-semibold" style={{ color: primaryColor }}>Desde {d.dataFundacao}</p>}
            </div>
          </div>
          {d.descricao && (
            <div className="relative pl-4" style={{ borderLeft: `2px solid ${primaryColor}40` }}>
              <Quote className="absolute -left-[9px] -top-1 h-4 w-4 rotate-180" style={{ color: primaryColor }} />
              <p className={`text-[15px] ${th.text} leading-[1.75] tracking-[0.005em] whitespace-pre-line`} style={mainTextStyle}>
                {d.descricao}
              </p>
            </div>
          )}

          {galeria2.length > 0 && (
            <div className="relative -mx-6 mt-7">
              <div
                ref={gal2Ref}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar px-6 pb-1"
              >
                {galeria2.map((m: any, i: number) => (
                  <button
                    key={m.id}
                    onClick={() => m.type === 'image' ? setLightbox2Index(i) : window.open(m.url, '_blank')}
                    className="group/img relative shrink-0 snap-center w-[82%] sm:w-[420px] aspect-[4/3] overflow-hidden shadow-xl active:scale-[0.98] transition-transform"
                    style={{ borderRadius: `${borderRadius / 1.2}px` }}
                  >
                    {m.type === 'image'
                      ? <img
                          src={m.url}
                          alt={m.caption || 'Foto da empresa'}
                          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/img:scale-110"
                        />
                      : <div className="w-full h-full bg-zinc-900 flex items-center justify-center"><Play className="h-7 w-7 text-white/70" /></div>
                    }

                    <div className="absolute inset-0 flex items-end justify-between p-3.5 pointer-events-none"
                      style={{ background: m.caption ? 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' : 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 45%)' }}
                    >
                      {m.caption && (
                        <p className="text-white text-xs sm:text-sm font-semibold leading-tight line-clamp-2 drop-shadow max-w-[85%]">
                          {m.caption}
                        </p>
                      )}
                      <span className="text-white/70 text-[10px] font-bold shrink-0 bg-black/30 rounded-full px-2 py-0.5 backdrop-blur">
                        {i + 1}/{galeria2.length}
                      </span>
                    </div>
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" style={{ borderRadius: `${borderRadius / 1.2}px` }} />
                  </button>
                ))}
              </div>

              {galeria2.length > 1 && (
                <>
                  <button
                    onClick={() => { const el = gal2Ref.current; if (!el) return; el.scrollBy({ left: -(el.children[0] as HTMLElement)?.clientWidth - 16, behavior: 'smooth' }); }}
                    className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur items-center justify-center text-white opacity-0 group-hover/car2:opacity-100 transition-opacity z-10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { const el = gal2Ref.current; if (!el) return; el.scrollBy({ left: (el.children[0] as HTMLElement)?.clientWidth + 16, behavior: 'smooth' }); }}
                    className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur items-center justify-center text-white opacity-0 group-hover/car2:opacity-100 transition-opacity z-10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="flex justify-center gap-1.5 mt-3">
                    {galeria2.map((_: any, i: number) => (
                      <div
                        key={i}
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: i === gal2Idx ? 20 : 6,
                          background: i === gal2Idx ? `linear-gradient(90deg, ${primaryColor}, #f59e0b)` : (isLightTheme ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)'),
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  const catalogoBlock = (cat === 'BUSINESS' && d.catalogo && !hidden.includes('catalogo')) ? (
    <div className="px-5 py-5" style={{ backgroundColor: isLightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.1)' }}>
      <a
        href={d.catalogo.startsWith('http') ? d.catalogo : `https://${d.catalogo}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackClick('catalogo')}
        className={`w-full flex items-center gap-4 px-4 py-4 transition-all active:scale-[0.98] hover:opacity-90 ${buttonStyle}`}
        style={{ backgroundColor: buttonColor, borderRadius: customBr }}
      >
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <ShoppingBag className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-white">Ver Catálogo</p>
          <p className="text-[11px] text-white/70">Produtos e serviços</p>
        </div>
        <ExternalLink className="h-4 w-4 text-white/80 shrink-0" />
      </a>
    </div>
  ) : null;

  const avaliacaoGoogleBlock = (cat === 'BUSINESS' && d.googleReview && !hidden.includes('googleReview')) ? (
    <div className="px-5 py-5" style={{ backgroundColor: isLightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.1)' }}>
      <a
        href={d.googleReview.startsWith('http') ? d.googleReview : `https://${d.googleReview}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackClick('googleReview')}
        className="w-full flex items-center gap-4 px-4 py-4 transition-all active:scale-[0.98] hover:shadow-md bg-white border border-zinc-200 shadow-sm"
        style={{ borderRadius: customBr }}
      >
        <div className="w-9 h-9 rounded-full bg-white shadow flex items-center justify-center shrink-0 ring-1 ring-black/5">
          <BrandIcon name="google" className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-zinc-800">Avalie-nos no Google</p>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-[#FBBC05] text-[#FBBC05]" />
              ))}
            </div>
            <span className="text-[11px] text-zinc-500">Sua opinião é muito importante</span>
          </div>
        </div>
        <ExternalLink className="h-4 w-4 text-zinc-400 shrink-0" />
      </a>
    </div>
  ) : null;

  const depoimentosBlock = (cat === 'BUSINESS' && depoimentosList.length > 0 && !hidden.includes('depoimentos')) ? (
    <div className="py-5 relative group/dep" style={{ backgroundColor: isLightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.1)' }}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${th.muted} mb-4 px-5`} style={labelStyle}>O que dizem de nós</p>
      <div ref={depRef} className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory hide-scrollbar px-5 pb-1">
        {depoimentosList.map((t: any) => (
          <div
            key={t.id}
            className="shrink-0 snap-center w-[84%] sm:w-80 px-5 py-5 relative flex flex-col"
            style={{ backgroundColor: isLightTheme ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', borderRadius: customBr }}
          >
            <Quote className="h-6 w-6 mb-2 opacity-20 shrink-0" style={{ color: primaryColor }} />
            {!!t.estrelas && (
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < t.estrelas ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`} />
                ))}
              </div>
            )}
            <p className={`text-sm ${th.text} leading-relaxed italic flex-1 line-clamp-6`} style={mainTextStyle}>&ldquo;{t.texto}&rdquo;</p>
            <div className="flex items-center gap-2.5 mt-4 pt-3 border-t" style={{ borderColor: isLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                {t.nome?.[0]?.toUpperCase() || '?'}
              </div>
              <p className={`text-xs font-bold ${th.muted} truncate`}>
                {t.nome}{t.cargo ? <span className="font-normal"> · {t.cargo}</span> : null}
              </p>
            </div>
          </div>
        ))}
      </div>

      {depoimentosList.length > 1 && (
        <>
          <button
            onClick={() => { const el = depRef.current; if (!el) return; el.scrollBy({ left: -(el.children[0] as HTMLElement)?.clientWidth - 14, behavior: 'smooth' }); }}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur items-center justify-center text-white opacity-0 group-hover/dep:opacity-100 transition-opacity z-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => { const el = depRef.current; if (!el) return; el.scrollBy({ left: (el.children[0] as HTMLElement)?.clientWidth + 14, behavior: 'smooth' }); }}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur items-center justify-center text-white opacity-0 group-hover/dep:opacity-100 transition-opacity z-10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="flex justify-center gap-1.5 mt-3">
            {depoimentosList.map((_: any, i: number) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: i === depIdx ? 20 : 6, backgroundColor: i === depIdx ? primaryColor : (isLightTheme ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)') }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  ) : null;

  const pixKeyType = (key: string) => {
    if (!key) return '';
    const clean = key.replace(/\D/g, '');
    if (key.includes('@')) return 'E-mail';
    if (clean.length === 11 && !key.includes('+')) return 'CPF';
    if (clean.length === 14) return 'CNPJ';
    if (clean.length >= 10 && clean.length <= 13) return 'Telefone';
    if (key.length >= 32) return 'Chave Aleatória';
    return 'Chave Pix';
  };

  const pixBlock = ((d.chavePix || d.__pixQrImage) && !hidden.includes('chavePix')) ? (
    <div className="px-5 py-5" style={{ backgroundColor: isLightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.1)' }}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${th.muted} mb-3`} style={labelStyle}>Pagamento</p>
      <button
        onClick={() => setShowPix(v => !v)}
        className="w-full flex items-center gap-4 px-4 py-4 transition-all active:scale-[0.98] hover:opacity-90"
        style={{ backgroundColor: isLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)', borderRadius: customBr }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #32BCAD, #0a8a7d)' }}>
          <span className="text-xl leading-none">💰</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className={`text-sm font-bold ${th.text}`}>Pagar via Pix</p>
          <p className={`text-[11px] ${th.muted}`}>{showPix ? 'Fechar' : (d.chavePix ? `${pixKeyType(d.chavePix)} · toque para ver o QR Code` : 'Ver QR Code')}</p>
        </div>
        <ChevronRight className={`h-4 w-4 ${th.muted} transition-transform shrink-0 ${showPix ? 'rotate-90' : ''}`} />
      </button>

      {showPix && (
        <div
          className="mt-3 p-5 rounded-2xl flex flex-col items-center gap-4 relative overflow-hidden"
          style={{ backgroundColor: isLightTheme ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', borderRadius: customBr, border: '1px solid rgba(50,188,173,0.25)' }}
        >
          <div className="flex items-center gap-1.5 self-stretch justify-center">
            <span className="text-[10px] font-black tracking-widest" style={{ color: '#32BCAD' }}>PIX</span>
            {d.chavePix && <span className={`text-[10px] font-bold ${th.muted}`}>· {pixKeyType(d.chavePix)}</span>}
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-lg ring-1 ring-black/5">
            {d.__pixQrImage
              ? <img src={d.__pixQrImage} alt="QR Code Pix" className="w-40 h-40 object-contain rounded-xl" />
              : <QRCodeSVG value={d.chavePix} size={160} fgColor="#0a0a0a" />
            }
          </div>
          <p className={`text-[11px] ${th.muted} text-center -mt-1`}>Abra o app do seu banco e escaneie para pagar</p>
          {d.chavePix && (
            <div className="w-full flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: isLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)', borderRadius: `${borderRadius / 1.5}px` }}>
              <span className={`text-xs ${th.muted} font-mono flex-1 truncate`}>{d.chavePix}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(d.chavePix); toast.show('Chave copiada!', 'success'); }}
                className="flex items-center gap-1.5 text-xs font-bold shrink-0 transition-colors"
                style={{ color: '#32BCAD' }}
              >
                <Copy className="h-3.5 w-3.5" /> Copiar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  ) : null;

  const wifiBlock = (cat === 'BUSINESS' && !hidden.includes('wifi') && (d.__wifiSsid || d.__wifiQrImage)) ? (
    <div className="px-5 py-5" style={{ backgroundColor: isLightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.1)' }}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${th.muted} mb-3`} style={labelStyle}>Wi-Fi</p>
      <button
        onClick={() => setShowWifi(v => !v)}
        className="w-full flex items-center gap-4 px-4 py-4 transition-all active:scale-[0.98] hover:opacity-90"
        style={{ backgroundColor: isLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)', borderRadius: customBr }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}20` }}>
          <Wifi className="h-4.5 w-4.5" style={{ color: primaryColor }} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className={`text-sm font-bold ${th.text} truncate`}>{d.__wifiSsid || 'Internet do local'}</p>
          <p className={`text-[11px] ${th.muted}`}>{showWifi ? 'Fechar' : 'Ver senha e QR Code'}</p>
        </div>
        <ChevronRight className={`h-4 w-4 ${th.muted} transition-transform shrink-0 ${showWifi ? 'rotate-90' : ''}`} />
      </button>

      {showWifi && (
        <div className="mt-3 p-5 rounded-2xl flex flex-col items-center gap-4" style={{ backgroundColor: isLightTheme ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', borderRadius: customBr }}>
          <div className="bg-white p-4 rounded-2xl shadow-lg">
            {d.__wifiQrImage
              ? <img src={d.__wifiQrImage} alt="QR Code Wi-Fi" className="w-40 h-40 object-contain rounded-xl" />
              : <QRCodeSVG value={`WIFI:T:WPA;S:${d.__wifiSsid || ''};P:${d.__wifiPassword || ''};;`} size={160} />
            }
          </div>
          <p className={`text-[11px] ${th.muted} text-center -mt-1`}>Aponte a câmera para conectar automaticamente</p>
          {d.__wifiPassword && (
            <div className="w-full flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: isLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)', borderRadius: `${borderRadius / 1.5}px` }}>
              <span className={`text-xs ${th.muted} font-mono flex-1 truncate`}>{showWifiPass ? d.__wifiPassword : '••••••••'}</span>
              <button onClick={() => setShowWifiPass(v => !v)} className="text-xs font-bold text-zinc-400 hover:text-white shrink-0 transition-colors">
                {showWifiPass ? 'Ocultar' : 'Mostrar'}
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(d.__wifiPassword); toast.show('Senha copiada!', 'success'); }}
                className="flex items-center gap-1.5 text-xs font-bold shrink-0 transition-colors"
                style={{ color: primaryColor }}
              >
                <Copy className="h-3.5 w-3.5" /> Copiar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  ) : null;

  const PAYMENT_METHOD_ICONS: Record<string, string> = {
    pix: '⚡',
    dinheiro: '💵',
    debito: '💳',
    credito: '💳',
    vr_va: '🍽️',
    boleto: '🧾',
    transferencia: '🏦',
  };

  const horariosArr = Array.isArray(d.__horarios) && d.__horarios.length === 7 ? d.__horarios : null;
  const horariosAlwaysOpen = !!d.__horariosAlwaysOpen;
  const horariosDisplayMode: 'tabela' | 'descricao' = d.__horariosDisplayMode === 'descricao' ? 'descricao' : 'tabela';
  const horariosDescricao: string = d.__horariosDescricao || '';
  const openStatus = computeOpenStatus(horariosArr || undefined, horariosAlwaysOpen);
  const todayIdx = new Date().getDay();

  const horariosBlock = (cat === 'BUSINESS' && !hidden.includes('horarios') && (horariosArr || horariosAlwaysOpen || horariosDescricao)) ? (
    <div className="px-5 py-5" style={{ backgroundColor: isLightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.1)' }}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${th.muted} mb-3`} style={labelStyle}>Horário de Funcionamento</p>
      <button
        onClick={() => setShowHorarios(v => !v)}
        className="w-full flex items-center gap-4 px-4 py-4 transition-all active:scale-[0.98] hover:opacity-90"
        style={{ backgroundColor: isLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)', borderRadius: customBr }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}20` }}>
          <Clock className="h-4.5 w-4.5" style={{ color: primaryColor }} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${openStatus?.open ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${openStatus?.open ? 'bg-emerald-500' : 'bg-red-500'}`} />
            </span>
            <p className={`text-sm font-bold ${openStatus?.open ? 'text-emerald-400' : 'text-red-400'}`}>
              {horariosAlwaysOpen ? 'Sempre aberto' : (openStatus?.open ? 'Aberto agora' : 'Fechado agora')}
            </p>
          </div>
          <p className={`text-[11px] ${th.muted} mt-0.5`}>
            {showHorarios ? 'Fechar' : (horariosAlwaysOpen ? 'Atendemos 24h, todos os dias' : (horariosDisplayMode === 'descricao' ? 'Ver detalhes' : 'Ver horários da semana'))}
          </p>
        </div>
        <ChevronRight className={`h-4 w-4 ${th.muted} transition-transform shrink-0 ${showHorarios ? 'rotate-90' : ''}`} />
      </button>

      {showHorarios && (
        <div
          className="mt-3 p-3 rounded-2xl space-y-1 animate-in fade-in slide-in-from-top-1 duration-300"
          style={{ backgroundColor: isLightTheme ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', borderRadius: customBr }}
        >
          {horariosAlwaysOpen ? (
            <p className={`text-xs font-semibold px-3.5 py-2.5 ${th.text}`}>
              {horariosDescricao || 'Atendimento 24 horas, todos os dias da semana.'}
            </p>
          ) : horariosDisplayMode === 'descricao' ? (
            <p className={`text-xs font-semibold px-3.5 py-2.5 ${th.text} whitespace-pre-line`}>
              {horariosDescricao || 'Horários não informados.'}
            </p>
          ) : horariosArr ? (
            horariosArr.map((h: any) => {
              const isToday = h.day === todayIdx;
              return (
                <div
                  key={h.day}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors"
                  style={isToday ? { backgroundColor: `${primaryColor}18` } : undefined}
                >
                  <span className={`text-xs font-bold ${isToday ? th.text : th.muted}`}>
                    {DAY_LABELS_FULL[h.day]}{isToday && <span style={{ color: primaryColor }}> · hoje</span>}
                  </span>
                  <span className={`text-xs font-semibold ${h.closed ? 'text-red-400' : th.text}`}>
                    {h.closed ? 'Fechado' : `${h.open} – ${h.close}`}
                  </span>
                </div>
              );
            })
          ) : null}
        </div>
      )}
    </div>
  ) : null;

  const paymentMethodsArr: string[] = Array.isArray(d.__formasPagamento) ? d.__formasPagamento : [];
  const pagamentoBlock = (cat === 'BUSINESS' && !hidden.includes('pagamento') && paymentMethodsArr.length > 0) ? (
    <div className="px-5 py-5" style={{ backgroundColor: isLightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.1)' }}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${th.muted} mb-3`} style={labelStyle}>Formas de Pagamento</p>
      <div className="flex flex-wrap gap-2">
        {paymentMethodsArr.map((m: string) => (
          <div
            key={m}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full transition-transform hover:scale-[1.04] active:scale-95"
            style={{ backgroundColor: isLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)' }}
          >
            <span className="text-sm leading-none">{PAYMENT_METHOD_ICONS[m] || '💳'}</span>
            <span className={`text-xs font-bold ${th.text}`}>{PAYMENT_METHOD_LABELS[m] || m}</span>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const TEA_ITEMS: { key: string; label: string; icon: any }[] = [
    { key: 'grauSuporte', label: 'Grau de Suporte', icon: Puzzle },
    { key: 'tipoTEA', label: 'Tipo / Perfil do TEA', icon: Brain },
    { key: 'nivelComunicacao', label: 'Nível de Comunicação', icon: MessageSquareWarning },
    { key: 'comoAjudar', label: 'Como me Ajudar', icon: HeartHandshake },
    { key: 'gatilhos', label: 'Gatilhos de Crise', icon: BadgeAlert },
    { key: 'estrategiasAcalmar', label: 'O que Ajuda a Acalmar', icon: HeartHandshake },
    { key: 'itemConforto', label: 'Item de Conforto', icon: Sparkles },
    { key: 'sensibilidades', label: 'Sensibilidades', icon: AlertTriangle },
    { key: 'riscoFuga', label: 'Risco de Fuga / Perambulação', icon: Footprints },
    { key: 'localHabitual', label: 'Local Habitual / Rotas', icon: Compass },
  ];
  const teaItemsFilled = TEA_ITEMS.filter(it => d[it.key]);

  const apoioTEABlock = (cat === 'TEA' && !hidden.includes('apoioTEA') && teaItemsFilled.length > 0) ? (
    <div className="px-5 py-5" style={{ backgroundColor: isLightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.1)' }}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${th.muted} mb-3`} style={labelStyle}>Cartão de Apoio · TEA</p>
      <button
        onClick={() => setShowApoioTEA(v => !v)}
        className="w-full flex items-center gap-4 px-4 py-4 transition-all active:scale-[0.98] hover:opacity-90"
        style={{ backgroundColor: isLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)', borderRadius: customBr }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}20` }}>
          <Puzzle className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className={`text-sm font-bold ${th.text}`}>{d.grauSuporte ? `Grau de Suporte: ${d.grauSuporte}` : 'Como me ajudar'}</p>
          <p className={`text-[11px] ${th.muted}`}>{showApoioTEA ? 'Fechar' : 'Toque para ver orientações importantes'}</p>
        </div>
        <ChevronRight className={`h-4 w-4 ${th.muted} transition-transform shrink-0 ${showApoioTEA ? 'rotate-90' : ''}`} />
      </button>

      {showApoioTEA && (
        <div className="mt-3 space-y-2.5">
          {teaItemsFilled.map(it => {
            const Icon = it.icon;
            return (
              <div
                key={it.key}
                className="flex items-start gap-3 p-3.5 rounded-2xl"
                style={{ backgroundColor: isLightTheme ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', borderRadius: customBr }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${primaryColor}18` }}>
                  <Icon className="h-4 w-4" style={{ color: primaryColor }} />
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] font-bold uppercase tracking-wide ${th.muted}`} style={labelStyle}>{it.label}</p>
                  <p className={`text-sm ${th.text} leading-relaxed mt-0.5`}>{d[it.key]}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  ) : null;

  const BLOCK_MAP: Record<string, any> = {
    midia: mediaBlock,
    petStats: petStatsBlock,
    businessStats: businessStatsBlock,
    social: socialBlock,
    contato: contatoBlock,
    maisInfo: maisInfoBlock,
    sobreEmpresa: sobreEmpresaBlock,
    catalogo: catalogoBlock,
    avaliacaoGoogle: avaliacaoGoogleBlock,
    depoimentos: depoimentosBlock,
    contatoForm: contatoFormBlock,
    wifi: wifiBlock,
    horarios: horariosBlock,
    pagamento: pagamentoBlock,
    apoioTEA: apoioTEABlock,
    pix: pixBlock,
  };
  const orderedBlockIds = [...new Set([...blockOrder, ...defaultBlockOrder])].filter(id => !hiddenBlockIds.includes(id));

  return (
    <div
      className={`min-h-screen ${bgClass} flex flex-col items-center sm:py-10 relative overflow-x-hidden`}
      style={{ fontFamily: fontOption.family }}
    >
      {/* Camada de fundo fixa ao viewport — evita que a imagem de fundo
          seja redimensionada/"esticada" com base na altura total (rolável)
          do perfil, o que fazia a imagem aparecer sempre ampliada/desalinhada. */}
      {isImageWallpaper && (
        <div className="fixed inset-0 -z-10" style={bgStyle} />
      )}

      {/* Overlay escuro para legibilidade quando o fundo é uma imagem */}
      {isImageWallpaper && (
        <div className="fixed inset-0 -z-10 bg-black/45 pointer-events-none" />
      )}

      {/* Estampa de quebra-cabeça — tema TEA */}
      {product.theme === 'tea-puzzle' && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ backgroundImage: `url("${PUZZLE_PATTERN_BG}")`, backgroundSize: '128px 128px', backgroundRepeat: 'repeat' }}
        />
      )}

      {/* Backdrop blur layer */}
      {blurAmount > 0 && (
        <div className="absolute inset-0 pointer-events-none" style={{ backdropFilter: `blur(${blurAmount / 8}px)` }} />
      )}

      {/* SOS Banner — alerta premium com gradiente, glass e CTA direto */}
      {sosMode && (() => {
        const sosPhone = d.telefoneResponsavel || d.telefoneEmerg1 || d.contatoEmergencia1 || d.telefoneResp2 || d.whatsapp || d.telefone;
        const sosLabel = cat === 'PET' ? 'Pet desaparecido'
          : cat === 'KIDS' ? 'Criança perdida'
          : 'Emergência';
        const sosSub = cat === 'PET' ? 'Ajude a reunir este pet com o tutor'
          : cat === 'KIDS' ? 'Contate os responsáveis imediatamente'
          : 'Contate os responsáveis imediatamente';
        return (
          <div className="sticky top-0 z-50 w-full">
            <div
              className="relative overflow-hidden px-4 py-3 sm:py-3.5 flex items-center justify-center gap-3 sm:gap-4 flex-wrap"
              style={{
                background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 45%, #dc2626 100%)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 4px 24px rgba(220,38,38,0.35)',
              }}
            >
              {/* leve textura de brilho para efeito glass */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              <div className="relative flex items-center gap-2.5">
                <span className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/25 opacity-75" />
                  <AlertTriangle className="relative h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
                </span>
                <div className="text-left leading-tight">
                  <p className="text-white font-black text-xs sm:text-sm uppercase tracking-wide">{sosLabel}</p>
                  <p className="text-white/85 text-[11px] sm:text-xs font-medium">{sosSub}</p>
                </div>
              </div>
              {sosPhone && (
                <a
                  href={`tel:${sosPhone}`}
                  onClick={() => trackClick('sos_call')}
                  className="relative flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-red-600 text-xs sm:text-sm font-black shadow-md hover:bg-white/90 active:scale-95 transition-all duration-200"
                >
                  <Phone className="h-3.5 w-3.5" /> Ligar agora
                </a>
              )}
            </div>
          </div>
        );
      })()}

      {/* Floating Share btn */}
      <div className="fixed top-4 right-4 z-40 flex gap-2">
        <button
          onClick={share}
          className="p-2.5 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-xl border border-white/10 hover:border-white/25 text-white transition-all hover:scale-110 active:scale-95 shadow-lg"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      {/* Main card wrapper — perfis BUSINESS ganham uma largura maior em
          telas médias/grandes, deixando as seções mais amplas e "SaaS-like". */}
      <div className={`${cat === 'BUSINESS' ? layoutClasses.wrapper.replace('max-w-[420px]', 'max-w-[420px] md:max-w-2xl lg:max-w-4xl').replace('sm:max-w-3xl', 'sm:max-w-3xl lg:max-w-5xl') : layoutClasses.wrapper} sm:pt-0 pt-4 fade-up`}>

        {/* ── PROFILE HEADER ── */}
        <div className="overflow-hidden shadow-2xl" style={{ borderRadius: `${borderRadius + 6}px` }}>

          {/* Cover Image — o editor (Perfil.tsx) já corta a foto em 3:1 no
              upload (aspect: 3, "Formato largo · 1200×400px"). O container
              aqui usa EXATAMENTE essa mesma proporção (aspect-[3/1]), então a
              imagem já cortada certinho preenche 100% do espaço, nítida, sem
              sobrar borda desfocada e sem cortar de novo. */}
          <div className={`relative overflow-hidden w-full bg-zinc-900 ${hasCover ? 'aspect-[3/1]' : 'h-0'}`}>
            {hasCover && (
              <>
                <img
                  src={d.capa}
                  alt="Capa"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  loading="eager"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
              </>
            )}
            {/* Status aberto/fechado — bolinha pulsante no canto superior esquerdo do banner */}
            {cat === 'BUSINESS' && horariosArr && (
              <div
                className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full backdrop-blur-xl border shadow-lg"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  borderColor: openStatus?.open ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)',
                }}
              >
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${openStatus?.open ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${openStatus?.open ? 'bg-emerald-500' : 'bg-red-500'}`} />
                </span>
                <span className="text-[11px] font-bold text-white tracking-wide">
                  {openStatus?.open ? 'Aberto' : 'Fechado'}
                </span>
              </div>
            )}
          </div>

          {/* Profile Info Section */}
          <div
            className={`px-6 pb-6 relative flex flex-col ${layoutClasses.header}`}
            style={{
              backgroundColor: cardAlpha,
              backdropFilter: 'blur(24px)',
              paddingTop: hasCover ? 0 : '2rem',
            }}
          >
            {/* Avatar */}
            <div className={`relative inline-block ${hasCover ? '-mt-14 sm:-mt-16 md:-mt-[4.5rem] mb-4' : 'mt-2 mb-4'} ${layout === 'left' ? 'self-start' : layout === 'right' ? 'self-end' : 'self-center'}`}>
              <div
                className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 p-[3px] transition-transform duration-300"
                style={{
                  borderRadius: customBr,
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.12), 0 12px 32px -8px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  className="w-full h-full p-[3px] overflow-hidden"
                  style={{ borderRadius: `calc(${customBr} - 3px)`, backgroundColor: isLightTheme ? '#ffffff' : '#0a0a0c' }}
                >
                  <div className="w-full h-full overflow-hidden" style={{ borderRadius: `calc(${customBr} - 6px)`, background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                    {d.foto
                      ? <img src={d.foto} alt={name} className="w-full h-full object-cover" loading="eager" />
                      : <div className="w-full h-full flex items-center justify-center text-4xl sm:text-5xl font-black text-white">
                          {name[0]?.toUpperCase() || '?'}
                        </div>
                    }
                  </div>
                </div>
              </div>
              {verified && (
                <div
                  className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-500 flex items-center justify-center shadow-lg"
                  style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.5)', border: `2.5px solid ${isLightTheme ? '#fff' : 'rgba(255,255,255,0.92)'}` }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-4 h-4 sm:w-4.5 sm:h-4.5"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              )}
            </div>

            <h1 className={`text-2xl font-black ${th.text} leading-tight tracking-tight`} style={nameStyle}>{name}</h1>
            {cargo && (
              <p className="text-sm font-semibold mt-1 tracking-wide" style={{ color: primaryColor }}>{cargo}</p>
            )}
            {d.nomeEmpresa && cat !== 'BUSINESS' && (
              <p className={`text-sm ${th.muted} mt-0.5`} style={bioStyle}>{d.nomeEmpresa}</p>
            )}
            {bio && (
              <p className={`text-sm ${th.muted} mt-4 leading-relaxed max-w-xs ${layout === 'left' || layout === 'right' ? '' : 'mx-auto'}`} style={bioStyle}>{bio}</p>
            )}

            {/* CTA Row */}
            <div className={`flex gap-2 mt-5 w-full ${layout === 'left' ? 'justify-start' : layout === 'right' ? 'justify-end' : 'justify-center'}`}>
              {(d.telefone || d.whatsapp) && (
                <button
                  onClick={saveContact}
                  className={`pp-btn-shine flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-white transition-all active:scale-95 shadow ${buttonStyle}`}
                  style={{ backgroundColor: buttonColor, borderRadius: customBr }}
                >
                  <UserPlus className="h-4 w-4" /> Salvar Contato
                </button>
              )}
              <button
                onClick={() => setShowQR(true)}
                className={`pp-btn-shine flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all active:scale-95 ${buttonStyle} backdrop-blur`}
                style={{ backgroundColor: isLightTheme ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.1)', borderRadius: customBr }}
              >
                <QrCode className={`h-4 w-4 ${th.accent}`} />
              </button>
            </div>
          </div>

          {/* ── BLOCOS REORDENÁVEIS (definidos pelo usuário no Estúdio de Perfil) ── */}
          {orderedBlockIds.map(id => (
            <div key={id}>{BLOCK_MAP[id]}</div>
          ))}


          {/* ── SOS EMERGENCY ── */}
          {sosMode && (
            <div className="px-5 py-5 bg-red-500/10 border-t border-red-500/20">
              <p className="text-red-400 font-black text-sm mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Contatos de Emergência
              </p>
              <div className="space-y-2">
                {cat === 'PET' && d.whatsappTutor && (
                  <a href={`https://wa.me/${d.whatsappTutor.replace(/\D/g, '')}`} target="_blank"
                    className="flex items-center gap-3.5 p-4 bg-red-500/15 rounded-2xl active:scale-98 border border-red-500/20">
                    <BrandIcon name="whatsapp" className="h-5 w-5 text-green-400 shrink-0" />
                    <div>
                      <p className="text-white font-bold text-sm">{d.tutor || 'Tutor'}</p>
                      <p className="text-white/60 text-xs">{d.whatsappTutor}</p>
                    </div>
                  </a>
                )}
                {(cat === 'KIDS' || cat === 'SENIOR' || cat === 'TEA') && d.telefoneResp1 && (
                  <a href={`tel:${d.telefoneResp1}`}
                    className="flex items-center gap-3.5 p-4 bg-red-500/15 rounded-2xl border border-red-500/20">
                    <Phone className="h-5 w-5 text-red-300 shrink-0" />
                    <div>
                      <p className="text-white font-bold text-sm">{d.responsavel1 || 'Responsável 1'}</p>
                      <p className="text-white/60 text-xs">{d.telefoneResp1}</p>
                    </div>
                  </a>
                )}
                {(cat === 'KIDS' || cat === 'SENIOR') && d.telefoneResp2 && (
                  <a href={`tel:${d.telefoneResp2}`}
                    className="flex items-center gap-3.5 p-4 bg-red-500/15 rounded-2xl border border-red-500/20">
                    <Phone className="h-5 w-5 text-red-300 shrink-0" />
                    <div>
                      <p className="text-white font-bold text-sm">{d.responsavel2 || 'Responsável 2'}</p>
                      <p className="text-white/60 text-xs">{d.telefoneResp2}</p>
                    </div>
                  </a>
                )}
                {cat === 'TEA' && d.telefoneResponsavel && (
                  <a href={`tel:${d.telefoneResponsavel}`}
                    className="flex items-center gap-3.5 p-4 bg-red-500/15 rounded-2xl border border-red-500/20">
                    <Phone className="h-5 w-5 text-red-300 shrink-0" />
                    <div>
                      <p className="text-white font-bold text-sm">{d.responsavel || 'Responsável'}</p>
                      <p className="text-white/60 text-xs">{d.telefoneResponsavel}</p>
                    </div>
                  </a>
                )}
                {cat === 'PET' && d.recompensa && (
                  <div className="p-4 rounded-2xl border-2 border-amber-400/40 flex items-center gap-3.5" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(245,158,11,0.1))' }}>
                    <span className="text-2xl shrink-0">🎁</span>
                    <div>
                      <p className="text-amber-300 font-black text-xs uppercase tracking-wide mb-0.5">Recompensa a quem encontrar</p>
                      <p className="text-white font-semibold text-sm leading-relaxed">{d.recompensa}</p>
                    </div>
                  </div>
                )}
                {cat === 'TEA' && d.localHabitual && (
                  <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <p className="text-blue-300 font-bold text-xs mb-1">Local habitual / rotas comuns:</p>
                    <p className="text-white/70 text-sm leading-relaxed">{d.localHabitual}</p>
                  </div>
                )}
                {d.comoAjudar && (
                  <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <p className="text-blue-300 font-bold text-xs mb-1">Como ajudar:</p>
                    <p className="text-white/70 text-sm leading-relaxed">{d.comoAjudar}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── RODAPÉ INSTITUCIONAL (CNPJ / Razão Social) — só BUSINESS ── */}
          {cat === 'BUSINESS' && (d.cnpj || d.razaoSocial) && (
            <div
              className="px-5 py-4 text-center border-t"
              style={{
                backgroundColor: isLightTheme ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)',
                borderColor: isLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)',
              }}
            >
              {d.razaoSocial && <p className={`text-[11px] font-semibold ${th.muted}`}>{d.razaoSocial}</p>}
              {d.cnpj && <p className={`text-[10px] ${th.muted} mt-0.5`}>CNPJ: {d.cnpj}</p>}
              {d.endereco && <p className={`text-[10px] ${th.muted} mt-0.5`}>{d.endereco}</p>}
            </div>
          )}

          {/* ── FOOTER ── */}
          <div
            className="px-5 py-4 flex items-center justify-center gap-2 border-t"
            style={{
              backgroundColor: isLightTheme ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.25)',
              borderColor: isLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)',
            }}
          >
            <span className="text-lg leading-none select-none" style={{ fontFamily: "'Lobster', cursive" }}>
              <span className={th.muted}>Air</span><span style={{ color: primaryColor }}>Next</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── QR MODAL ── */}
      {showQR && (
        <Modal isOpen={showQR} onClose={() => setShowQR(false)}>
          <div className="text-center p-6">
            <p className="text-white font-bold text-lg mb-1">QR Code do Perfil</p>
            <p className="text-zinc-500 text-sm mb-6">Escaneie para abrir o perfil</p>
            <div className="bg-white p-5 rounded-3xl inline-block shadow-2xl">
              <QRCodeSVG value={`${window.location.href}${window.location.search ? '&' : '?'}via=qr`} size={200} />
            </div>
            <div className="mt-5 flex gap-2 justify-center">
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); toast.show('Link copiado!', 'success'); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 rounded-full text-sm text-zinc-400 hover:text-white border border-white/8 transition-all"
              >
                <Copy className="h-3.5 w-3.5" /> Copiar link
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── LIGHTBOX (imagem em tela cheia) ── */}
      {lightboxIndex !== null && carouselItems[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {carouselItems.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i! - 1 + carouselItems.length) % carouselItems.length); }}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i! + 1) % carouselItems.length); }}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div className="flex flex-col items-center gap-3 max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
            <img
              src={carouselItems[lightboxIndex].url}
              alt={carouselItems[lightboxIndex].caption || ''}
              className="max-w-[92vw] max-h-[78vh] object-contain rounded-lg shadow-2xl"
            />
            {carouselItems[lightboxIndex].caption && (
              <p className="text-sm text-white/80 text-center max-w-md px-4">{carouselItems[lightboxIndex].caption}</p>
            )}
          </div>

          {carouselItems.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
              {carouselItems.map((_: any, i: number) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: i === lightboxIndex ? 20 : 6, backgroundColor: i === lightboxIndex ? '#fff' : 'rgba(255,255,255,0.35)' }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {lightbox2Index !== null && galeria2[lightbox2Index] && (
        <div
          className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setLightbox2Index(null)}
        >
          <button
            onClick={() => setLightbox2Index(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {galeria2.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox2Index(i => (i! - 1 + galeria2.length) % galeria2.length); }}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox2Index(i => (i! + 1) % galeria2.length); }}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div className="flex flex-col items-center gap-3 max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
            <img
              src={galeria2[lightbox2Index].url}
              alt={galeria2[lightbox2Index].caption || ''}
              className="max-w-[92vw] max-h-[78vh] object-contain rounded-lg shadow-2xl"
            />
            {galeria2[lightbox2Index].caption && (
              <p className="text-sm text-white/80 text-center max-w-md px-4">{galeria2[lightbox2Index].caption}</p>
            )}
          </div>

          {galeria2.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
              {galeria2.map((_: any, i: number) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: i === lightbox2Index ? 20 : 6, backgroundColor: i === lightbox2Index ? '#fff' : 'rgba(255,255,255,0.35)' }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}