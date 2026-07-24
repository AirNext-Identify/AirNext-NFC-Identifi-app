import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, ProfileTheme } from '../../contexts/AuthContext';

import {
  Save,
  X,
  Loader2,
  User,
  Palette,
  CheckCircle2,
  Smartphone,
  Globe,
  Image as ImageIcon,
  Link2,
  Download,
  Camera,
  Share2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Eye,
  EyeOff,
  Phone,
  Mail,
  MapPin,
  Wifi,
  ArrowLeft,
  Sparkles,
  Check,
  Lock,
  GripVertical,
  LayoutGrid,
  Trash2,
  Info,
  ShoppingBag,
  MessageCircle,
  Wallet,
  Star,
  Building2,
  Quote,
  Puzzle,
  Clock,
  CreditCard,
  CalendarClock,
  Signal,
  Megaphone,
  Newspaper,
  ArrowUpRight,
  Flame
} from 'lucide-react';

import { useToast } from '../../components/Toast';
import { BrandIcon } from '../../components/Icons';
import { QRCodeSVG } from 'qrcode.react';
import ImageUploadEditor from '../../components/upload/ImageUploadEditor';
import { LAYOUT_OPTIONS, ProfileLayout } from '../../lib/layout';
import { FONT_OPTIONS, loadGoogleFont, getFontOption } from '../../lib/fonts';
import { GRADIENT_OPTIONS as GRADIENTS, SOLID_COLOR_OPTIONS as SOLID_COLORS, isLightBackground, getDefaultBackground } from '../../lib/background';

const BUTTON_STYLES = [
  { id: 'rounded-full', label: 'Pílula' },
  { id: 'rounded-2xl', label: 'Suave' },
  { id: 'rounded-lg', label: 'Padrão' },
  { id: 'rounded-none', label: 'Reto' },
];

const SOCIAL_NETWORKS = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'threads', label: 'Threads' },
  { id: 'twitter', label: 'X / Twitter' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'discord', label: 'Discord' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'behance', label: 'Behance' },
  { id: 'dribbble', label: 'Dribbble' },
  { id: 'github', label: 'GitHub' },
  { id: 'gitlab', label: 'GitLab' },
  { id: 'spotify', label: 'Spotify' },
  { id: 'applemusic', label: 'Apple Music' },
  { id: 'soundcloud', label: 'SoundCloud' },
  { id: 'twitch', label: 'Twitch' },
  { id: 'kick', label: 'Kick' },
  { id: 'steam', label: 'Steam' },
  { id: 'snapchat', label: 'Snapchat' },
  { id: 'skype', label: 'Skype' },
  { id: 'teams', label: 'Teams' },
  { id: 'googlemaps', label: 'Google Maps' },
  { id: 'calendly', label: 'Calendly' },
  { id: 'patreon', label: 'Patreon' },
  { id: 'kofi', label: 'Ko-fi' },
  { id: 'onlyfans', label: 'OnlyFans' },
  { id: 'hotmart', label: 'Hotmart' },
  { id: 'mercadolivre', label: 'Mercado Livre' },
  { id: 'shopee', label: 'Shopee' },
  { id: 'amazon', label: 'Amazon' },
  { id: 'ifood', label: 'iFood' },
  { id: 'slack', label: 'Slack' },
  { id: 'signal', label: 'Signal' },
];

const FIELDS: Record<string, { key: string; label: string; type?: string; placeholder?: string }[]> = {
  PERSONAL: [
    { key: 'nome', label: 'Nome Completo', placeholder: 'Seu nome' },
    { key: 'cargo', label: 'Cargo / Profissão', placeholder: 'Ex: Designer' },
    { key: 'bio', label: 'Biografia', type: 'textarea', placeholder: 'Conte sobre você...' },
    { key: 'whatsapp', label: 'WhatsApp', placeholder: '5511999999999' },
    { key: 'telefone', label: 'Telefone', placeholder: '(11) 99999-9999' },
    { key: 'email', label: 'E-mail', type: 'email', placeholder: 'email@exemplo.com' },
    { key: 'site', label: 'Site', placeholder: 'https://seusite.com' },
    { key: 'endereco', label: 'Localização', placeholder: 'Cidade, Estado' },
    { key: 'chavePix', label: 'Chave Pix', placeholder: 'CPF, e-mail ou chave' },
  ],
  BUSINESS: [
    { key: 'nome', label: 'Nome / Responsável', placeholder: 'Seu nome' },
    { key: 'cargo', label: 'Cargo', placeholder: 'CEO, Diretor...' },
    { key: 'nomeEmpresa', label: 'Nome da Empresa', placeholder: 'Empresa Ltda.' },
    { key: 'dataFundacao', label: 'Data de Fundação', placeholder: 'Ex: 2019 ou 03/2019' },
    { key: 'bio', label: 'Bio Curta (aparece abaixo do nome)', type: 'textarea', placeholder: 'Frase curta de destaque, slogan...' },
    { key: 'descricao', label: 'Descrição / Sobre a Empresa', type: 'textarea', placeholder: 'O que a empresa faz, história, diferenciais...' },
    { key: 'whatsapp', label: 'WhatsApp Comercial', placeholder: '5511999999999' },
    { key: 'telefone', label: 'Telefone', placeholder: '(11) 3333-3333' },
    { key: 'email', label: 'E-mail Comercial', type: 'email', placeholder: 'contato@empresa.com' },
    { key: 'emailContato', label: 'E-mail para Receber Contatos de Clientes', type: 'email', placeholder: 'Ex: atendimento@empresa.com (se vazio, usa o E-mail Comercial acima)' },
    { key: 'site', label: 'Site', placeholder: 'https://empresa.com' },
    { key: 'endereco', label: 'Endereço', placeholder: 'Rua, número - Cidade' },
    { key: 'chavePix', label: 'Chave Pix', placeholder: 'CNPJ ou chave' },
    { key: 'catalogo', label: 'Link do Catálogo', placeholder: 'https://...' },
    { key: 'linkAgendamento', label: 'Link de Agendamento / Reserva', placeholder: 'https://calendly.com/sua-empresa' },
    { key: 'cnpj', label: 'CNPJ (aparece no rodapé do perfil)', placeholder: '00.000.000/0000-00' },
    { key: 'razaoSocial', label: 'Razão Social (aparece no rodapé)', placeholder: 'Empresa Comércio e Serviços Ltda' },
    { key: 'numeroClientes', label: 'Clientes Atendidos (opcional, para destaque)', placeholder: 'Ex: 500+' },
    { key: 'especialidade', label: 'Especialidade Principal (opcional, para destaque)', placeholder: 'Ex: Marketing Digital' },
  ],
  PET: [
    { key: 'nome', label: 'Nome do Pet', placeholder: 'Rex, Bolinha...' },
    { key: 'raca', label: 'Raça', placeholder: 'Golden Retriever...' },
    { key: 'idade', label: 'Idade', placeholder: '3 anos' },
    { key: 'peso', label: 'Peso', placeholder: '15kg' },
    { key: 'sexo', label: 'Sexo', placeholder: 'Macho / Fêmea' },
    { key: 'cor', label: 'Cor / Pelagem', placeholder: 'Dourado, preto...' },
    { key: 'tutor', label: 'Nome do Tutor', placeholder: 'João Silva' },
    { key: 'whatsappTutor', label: 'WhatsApp do Tutor', placeholder: '5511999999999' },
    { key: 'enderecoTutor', label: 'Endereço / Bairro de Referência', placeholder: 'Bairro ou região onde mora' },
    { key: 'recompensa', label: 'Recompensa a Quem Encontrar', placeholder: 'Ex: Recompensa de R$100 — combinar' },
    { key: 'valorRecompensa', label: 'Valor da Recompensa (R$)', placeholder: 'Ex: 100' },
    { key: 'ultimoLocalVisto', label: 'Último Local Visto', placeholder: 'Rua, bairro, data e horário' },
    { key: 'caracteristicasMarcantes', label: 'Características Marcantes', type: 'textarea', placeholder: 'Coleira, manchas, cicatrizes, comportamento...' },
    { key: 'contatoAlternativo', label: 'Contato Alternativo (WhatsApp)', placeholder: '5511999999999' },
    { key: 'veterinario', label: 'Veterinário', placeholder: 'Dr. Pedro' },
    { key: 'clinica', label: 'Clínica Veterinária', placeholder: 'Pet Clínica' },
    { key: 'vacinas', label: 'Vacinas', type: 'textarea', placeholder: 'Antirrábica, Múltipla...' },
    { key: 'alergias', label: 'Alergias', type: 'textarea', placeholder: 'Nenhuma conhecida' },
    { key: 'medicamentos', label: 'Medicamentos', type: 'textarea', placeholder: 'Lista de medicamentos' },
    { key: 'observacoes', label: 'Observações', type: 'textarea', placeholder: 'Informações importantes' },
    { key: 'microchip', label: 'Microchip', placeholder: '941000012345678' },
  ],
  KIDS: [
    { key: 'nome', label: 'Nome da Criança', placeholder: 'Nome completo' },
    { key: 'responsavel1', label: 'Responsável 1', placeholder: 'Pai / Mãe' },
    { key: 'telefoneResp1', label: 'Telefone Responsável 1', placeholder: '(11) 99999-9999' },
    { key: 'responsavel2', label: 'Responsável 2', placeholder: 'Outro responsável' },
    { key: 'telefoneResp2', label: 'Telefone Responsável 2', placeholder: '(11) 99999-9999' },
    { key: 'escola', label: 'Escola', placeholder: 'Nome da escola' },
    { key: 'alergias', label: 'Alergias', type: 'textarea', placeholder: 'Alergias conhecidas' },
    { key: 'tipoSanguineo', label: 'Tipo Sanguíneo', placeholder: 'A+, B-, O+...' },
    { key: 'medicoResponsavel', label: 'Médico Responsável', placeholder: 'Dr. Nome' },
    { key: 'planoSaude', label: 'Plano de Saúde', placeholder: 'Unimed, Bradesco...' },
    { key: 'observacoes', label: 'Observações', type: 'textarea', placeholder: 'Informações importantes' },
  ],
  SENIOR: [
    { key: 'nome', label: 'Nome Completo', placeholder: 'Nome completo' },
    { key: 'dataNascimento', label: 'Data de Nascimento', placeholder: 'DD/MM/AAAA' },
    { key: 'contatoEmergencia1', label: 'Contato Emergência 1', placeholder: 'Filho(a), cônjuge...' },
    { key: 'telefoneEmerg1', label: 'Telefone Emergência 1', placeholder: '(11) 99999-9999' },
    { key: 'contatoEmergencia2', label: 'Contato Emergência 2', placeholder: 'Outro familiar' },
    { key: 'telefoneEmerg2', label: 'Telefone Emergência 2', placeholder: '(11) 99999-9999' },
    { key: 'medicacoes', label: 'Medicações', type: 'textarea', placeholder: 'Lista de medicamentos e horários' },
    { key: 'medicoResponsavel', label: 'Médico Responsável', placeholder: 'Dr. Nome' },
    { key: 'tipoSanguineo', label: 'Tipo Sanguíneo', placeholder: 'A+, B-, O+...' },
    { key: 'planoSaude', label: 'Plano de Saúde', placeholder: 'Unimed - Cartão nº...' },
    { key: 'alergias', label: 'Alergias', type: 'textarea', placeholder: 'Alergias a medicamentos' },
    { key: 'observacoes', label: 'Observações', type: 'textarea', placeholder: 'Informações importantes' },
  ],
  TEA: [
    { key: 'nome', label: 'Nome Completo', placeholder: 'Nome completo' },
    { key: 'grauSuporte', label: 'Grau de Suporte (DSM-5)', placeholder: 'Nível 1 (leve), 2 (moderado) ou 3 (substancial)' },
    { key: 'tipoTEA', label: 'Tipo / Perfil do TEA', placeholder: 'Ex: Asperger, TEA clássico, Kanner...' },
    { key: 'cid', label: 'CID / Laudo', placeholder: 'Ex: CID-10 F84.0' },
    { key: 'nivelComunicacao', label: 'Nível de Comunicação', placeholder: 'Verbal, não-verbal, verbal parcial, usa CAA/PECS...' },
    { key: 'responsavel', label: 'Responsável', placeholder: 'Pai, mãe ou cuidador' },
    { key: 'telefoneResponsavel', label: 'Telefone do Responsável', placeholder: '(11) 99999-9999' },
    { key: 'contatoEmergencia', label: 'Contato de Emergência', placeholder: 'Outro contato' },
    { key: 'telefoneEmergencia', label: 'Telefone Emergência', placeholder: '(11) 99999-9999' },
    { key: 'preferenciaComunicacao', label: 'Forma de Comunicação', type: 'textarea', placeholder: 'Como prefere ser abordado...' },
    { key: 'sensibilidades', label: 'Sensibilidades Sensoriais', type: 'textarea', placeholder: 'Sons, texturas, luzes, multidões...' },
    { key: 'gatilhos', label: 'Gatilhos de Crise', type: 'textarea', placeholder: 'O que pode desencadear uma crise ou desregulação' },
    { key: 'estrategiasAcalmar', label: 'O que Ajuda a Acalmar', type: 'textarea', placeholder: 'Estratégias, objetos ou ações que ajudam a acalmar' },
    { key: 'itemConforto', label: 'Item de Conforto', placeholder: 'Ex: fone abafador, pelúcia, fidget...' },
    { key: 'comoAjudar', label: 'Como me Ajudar', type: 'textarea', placeholder: 'Instruções para quem o encontrar' },
    { key: 'riscoFuga', label: 'Risco de Fuga / Perambulação', placeholder: 'Sim / Não — se sim, descreva cuidados' },
    { key: 'localHabitual', label: 'Local Habitual / Rotas Comuns', type: 'textarea', placeholder: 'Escola, praça, trajeto que costuma fazer — ajuda muito em caso de desorientação' },
    { key: 'comorbidades', label: 'Condições Associadas', type: 'textarea', placeholder: 'TDAH, epilepsia, ansiedade...' },
    { key: 'medicamentos', label: 'Medicamentos', type: 'textarea', placeholder: 'Lista de medicamentos' },
    { key: 'terapias', label: 'Terapias em Acompanhamento', placeholder: 'ABA, fonoaudiologia, terapia ocupacional...' },
    { key: 'medicoResponsavel', label: 'Médico / Terapeuta', placeholder: 'Dr. Nome' },
    { key: 'observacoes', label: 'Observações Importantes', type: 'textarea', placeholder: 'Outras informações' },
  ],
};

const SOS_FIELDS: Record<string, { key: string; label: string }[]> = {
  PET: [
    { key: 'tutor', label: 'Tutor' },
    { key: 'whatsappTutor', label: 'WhatsApp Tutor' },
    { key: 'veterinario', label: 'Veterinário' },
    { key: 'alergias', label: 'Alergias' },
    { key: 'recompensa', label: 'Recompensa a Quem Encontrar' },
    { key: 'valorRecompensa', label: 'Valor da Recompensa' },
    { key: 'ultimoLocalVisto', label: 'Último Local Visto' },
    { key: 'caracteristicasMarcantes', label: 'Características Marcantes' },
    { key: 'contatoAlternativo', label: 'Contato Alternativo' },
  ],
  KIDS: [
    { key: 'responsavel1', label: 'Responsável 1' },
    { key: 'telefoneResp1', label: 'Tel. Responsável 1' },
    { key: 'responsavel2', label: 'Responsável 2' },
    { key: 'telefoneResp2', label: 'Tel. Responsável 2' },
  ],
  SENIOR: [
    { key: 'contatoEmergencia1', label: 'Emergência 1' },
    { key: 'telefoneEmerg1', label: 'Tel. Emergência 1' },
    { key: 'contatoEmergencia2', label: 'Emergência 2' },
    { key: 'telefoneEmerg2', label: 'Tel. Emergência 2' },
    { key: 'medicacoes', label: 'Medicações' },
    { key: 'tipoSanguineo', label: 'Tipo Sanguíneo' },
  ],
  TEA: [
    { key: 'grauSuporte', label: 'Grau de Suporte' },
    { key: 'responsavel', label: 'Responsável' },
    { key: 'telefoneResponsavel', label: 'Tel. Responsável' },
    { key: 'comoAjudar', label: 'Como Ajudar' },
    { key: 'gatilhos', label: 'Gatilhos de Crise' },
    { key: 'estrategiasAcalmar', label: 'O que Ajuda a Acalmar' },
    { key: 'sensibilidades', label: 'Sensibilidades' },
    { key: 'riscoFuga', label: 'Risco de Fuga' },
    { key: 'localHabitual', label: 'Local Habitual / Rotas Comuns' },
  ],
};

const DAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DEFAULT_BUSINESS_HOURS = [0, 1, 2, 3, 4, 5, 6].map(day => ({
  day,
  open: '09:00',
  close: '18:00',
  closed: day === 0, // domingo fechado por padrão
}));
const PAYMENT_METHOD_OPTIONS = [
  { id: 'pix', label: 'Pix' },
  { id: 'dinheiro', label: 'Dinheiro' },
  { id: 'debito', label: 'Cartão de Débito' },
  { id: 'credito', label: 'Cartão de Crédito' },
  { id: 'vr_va', label: 'VR / VA' },
  { id: 'boleto', label: 'Boleto' },
  { id: 'transferencia', label: 'Transferência' },
];

const HAS_SOS = ['PET', 'KIDS', 'SENIOR', 'TEA'];
const HAS_TESTIMONIALS = ['BUSINESS'];

const STEPS = [
  { id: 'foto', label: 'Fotos', icon: Camera },
  { id: 'info', label: 'Dados', icon: User },
  { id: 'visual', label: 'Visual', icon: Palette },
  { id: 'social', label: 'Redes', icon: Link2 },
  { id: 'midia', label: 'Galeria', icon: ImageIcon },
  { id: 'novidades', label: 'Destaques', icon: Sparkles },
  { id: 'depoimentos', label: 'Avaliações', icon: Quote },
  { id: 'organizar', label: 'Organizar', icon: LayoutGrid },
  { id: 'sos', label: 'SOS', icon: AlertTriangle },
  { id: 'publicar', label: 'Publicar', icon: Globe },
];

/* ─── BLOCOS DO PERFIL (grid arrastável, estilo Apple) ───── */
type BlockDef = { id: string; label: string; icon: any; catFilter?: (cat: string) => boolean };
const BLOCK_DEFS: BlockDef[] = [
  { id: 'midia', label: 'Galeria de Mídia', icon: ImageIcon },
  { id: 'social', label: 'Redes & Contato', icon: Link2 },
  { id: 'contato', label: 'Informações de Contato', icon: Phone },
  { id: 'maisInfo', label: 'Mais Informações', icon: Info },
  { id: 'sobreEmpresa', label: 'Sobre a Empresa', icon: ShoppingBag, catFilter: c => c === 'BUSINESS' },
  { id: 'atracoes', label: 'Destaques', icon: Sparkles, catFilter: c => c === 'BUSINESS' },
  { id: 'promocoes', label: 'Promoções', icon: Megaphone, catFilter: c => c === 'BUSINESS' },
  { id: 'noticias', label: 'Novidades', icon: Newspaper, catFilter: c => c === 'BUSINESS' },
  { id: 'catalogo', label: 'Catálogo', icon: ShoppingBag, catFilter: c => c === 'BUSINESS' },
  { id: 'avaliacaoGoogle', label: 'Avaliação Google', icon: Star, catFilter: c => c === 'BUSINESS' },
  { id: 'depoimentos', label: 'Depoimentos', icon: MessageCircle, catFilter: c => HAS_TESTIMONIALS.includes(c) },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi, catFilter: c => c === 'BUSINESS' },
  { id: 'horarios', label: 'Horário de Funcionamento', icon: Clock, catFilter: c => c === 'BUSINESS' },
  { id: 'pagamento', label: 'Formas de Pagamento', icon: CreditCard, catFilter: c => c === 'BUSINESS' },
  { id: 'apoioTEA', label: 'Cartão de Apoio TEA', icon: Puzzle, catFilter: c => c === 'TEA' },
  { id: 'pix', label: 'Pagamento Pix', icon: Wallet },
];
const DEFAULT_BLOCK_ORDER = BLOCK_DEFS.map(b => b.id);

/* ─── PHONE PREVIEW ─────────────────────────────────────── */
function PhonePreview({
  form, mediaItems, mediaItems2, depoimentos, atracoes, promocoes, noticias, wifiSsid, pixQrImage,
  blockOrder, hiddenBlocks, primaryColor, secondaryColor, borderRadius, buttonStyle,
  wallpaper, nameColor, bioColor, buttonColor, appsColor, fontFamily, linkStyle,
  verified, sosMode, cat,
}: any) {
  const wallpaperValue: string = wallpaper || '';
  const isImageWallpaper = wallpaperValue.startsWith('http') || wallpaperValue.startsWith('data:');
  const bgClass = isImageWallpaper ? '' : (wallpaperValue || getDefaultBackground(cat));
  const isLight = isLightBackground(wallpaperValue || getDefaultBackground(cat));
  const t = isLight
    ? { text: 'text-zinc-900', sub: 'text-zinc-500' }
    : { text: 'text-white', sub: 'text-zinc-400' };
  const bgStyle: { backgroundImage?: string; backgroundSize?: string; backgroundPosition?: string } = isImageWallpaper
    ? { backgroundImage: `url(${wallpaperValue})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};
  const nameStyle = nameColor ? { color: nameColor } : undefined;
  const bioStyle = bioColor ? { color: bioColor } : undefined;
  const cardBg = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)';
  const br = `${borderRadius || 16}px`;
  const name = form.nome || form.nomeEmpresa || 'Seu Nome';
  const bio = form.bio || form.descricao || '';
  const cargo = form.cargo || '';
  const socials = SOCIAL_NETWORKS.map(s => s.id).filter(k => form[k] || form[k + 'Tutor']);

  const fontStack = getFontOption(fontFamily).family;

  return (
    <div className={`min-h-full ${bgClass} ${t.text} flex flex-col items-center relative overflow-hidden`} style={{ ...bgStyle, fontFamily: fontStack }}>
      {isImageWallpaper && <div className="absolute inset-0 bg-black/40 pointer-events-none" />}
      {sosMode && (
        <div className="w-full py-1 bg-red-500 text-white text-center text-[7px] font-black uppercase tracking-wider animate-pulse">
          🚨 {cat === 'PET' ? 'PET DESAPARECIDO' : cat === 'KIDS' ? 'CRIANÇA PERDIDA' : 'EMERGÊNCIA'}
        </div>
      )}

      <div className="relative w-full flex flex-col items-center px-4 pt-8 pb-6 text-center">
        {form.capa && (
          <div className="w-full aspect-[3/1] -mx-4 -mt-8 mb-4 overflow-hidden relative">
            <img src={form.capa} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        <div className="relative mb-2 z-10">
          <div
            className="w-20 h-20 border-[3px] shadow-2xl flex items-center justify-center overflow-hidden"
            style={{ borderRadius: br, borderColor: isLight ? '#fff' : 'rgba(255,255,255,0.2)', background: `linear-gradient(135deg, ${primaryColor || '#3b82f6'}, ${secondaryColor || '#8b5cf6'})` }}
          >
            {form.foto
              ? <img src={form.foto} className="w-full h-full object-cover" />
              : <span className="text-2xl font-black text-white">{(name[0] || 'A').toUpperCase()}</span>
            }
          </div>
          {verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-blue-500 border-2 flex items-center justify-center shadow"
              style={{ borderColor: isLight ? '#fff' : '#09090b' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" className="w-2.5 h-2.5"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          )}
        </div>

        <p className="text-sm font-black leading-tight" style={nameStyle}>{name}</p>
        {cargo && <p className="text-[8px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: primaryColor || '#3b82f6' }}>{cargo}</p>}
        {bio && <p className={`text-[8px] mt-1 line-clamp-2 px-2 ${t.sub}`} style={bioStyle}>{bio}</p>}
      </div>

      {/* ── BLOCOS NA MESMA ORDEM/VISIBILIDADE DO PERFIL PÚBLICO ──
          Antes esta mini-prévia só mostrava mídia + redes + botão de
          WhatsApp fixos: reordenar blocos, ocultar seções, preencher
          Wi-Fi/Pix/Depoimentos/Catálogo/Sobre a Empresa não refletia aqui.
          Agora ela usa o MESMO blockOrder/hiddenBlocks do editor. */}
      <div className="w-full flex flex-col gap-3 px-4 pb-6">
        {(() => {
          const cardBgSoft = isLight ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.045)';
          const galeria2 = Array.isArray(mediaItems2) ? mediaItems2.filter((m: any) => m?.url) : [];
          const deps: any[] = Array.isArray(depoimentos) ? depoimentos.filter(t => t.texto) : [];
          const atracoesArr: any[] = Array.isArray(atracoes) ? atracoes.filter((a: any) => a?.titulo) : [];
          const promocoesArr: any[] = Array.isArray(promocoes) ? promocoes.filter((p: any) => p?.titulo) : [];
          const noticiasArr: any[] = Array.isArray(noticias) ? noticias.filter((n: any) => n?.titulo) : [];

          const midiaBlock = mediaItems?.length > 0 ? (
            <div className="w-full flex gap-1 overflow-hidden">
              {mediaItems.slice(0, 3).map((m: any) => (
                <div key={m.id} className="shrink-0 w-20 aspect-video bg-zinc-800 overflow-hidden" style={{ borderRadius: `${(borderRadius || 16) / 3}px` }}>
                  {m.type === 'image' && <img src={m.url} className="w-full h-full object-cover" />}
                  {m.type === 'video' && <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-[8px] text-zinc-400">▶</div>}
                </div>
              ))}
            </div>
          ) : null;

          const socialBlock = socials.length > 0 ? (
            <div className={linkStyle === 'grid' ? 'grid grid-cols-4 gap-1' : 'space-y-1'}>
              {socials.slice(0, linkStyle === 'grid' ? 8 : 4).map(s => (
                <div
                  key={s}
                  className={`flex items-center ${linkStyle === 'list' ? 'gap-2 px-2 py-1.5' : 'aspect-square justify-center'} border`}
                  style={{ backgroundColor: appsColor ? `${appsColor}26` : cardBg, borderColor: 'rgba(255,255,255,0.05)', borderRadius: br }}
                >
                  <BrandIcon name={s} className="w-3 h-3" />
                  {linkStyle === 'list' && <span className="text-[7px] font-bold capitalize truncate">{s}</span>}
                </div>
              ))}
            </div>
          ) : null;

          const contatoBlock = (form.telefone || form.email || form.site || form.endereco) ? (
            <div className="space-y-1">
              <p className={`text-[6px] font-bold uppercase tracking-widest ${t.sub}`}>Informações</p>
              {[
                { key: 'telefone', label: 'Telefone' },
                { key: 'email', label: 'E-mail' },
                { key: 'site', label: 'Website' },
                { key: 'endereco', label: 'Localização' },
              ].filter(f => form[f.key]).map(f => (
                <div key={f.key} className="flex items-center gap-1.5 px-2 py-1.5" style={{ backgroundColor: cardBgSoft, borderRadius: br }}>
                  <span className="text-[7px] font-bold uppercase tracking-wide" style={{ color: primaryColor || '#3b82f6' }}>{f.label}:</span>
                  <span className="text-[7px] truncate flex-1">{form[f.key]}</span>
                </div>
              ))}
            </div>
          ) : null;

          const maisInfoBlock = (() => {
            const skip = new Set(['nome', 'nomeEmpresa', 'cargo', 'bio', 'descricao', 'dataFundacao', 'catalogo', 'chavePix', 'telefone', 'email', 'emailContato', 'cnpj', 'razaoSocial', 'site', 'endereco', 'whatsapp', 'foto', 'capa', 'googleReview', 'grauSuporte', 'tipoTEA', 'nivelComunicacao', 'gatilhos', 'estrategiasAcalmar', 'comoAjudar', 'itemConforto', 'riscoFuga', 'localHabitual', 'sensibilidades', ...SOCIAL_NETWORKS.map(s => s.id)]);
            const extra = (FIELDS[cat] || []).filter(f => form[f.key] && !skip.has(f.key)).slice(0, 4);
            if (extra.length === 0) return null;
            return (
              <div className="space-y-1">
                <p className={`text-[6px] font-bold uppercase tracking-widest ${t.sub}`}>Mais Informações</p>
                {extra.map(f => (
                  <div key={f.key} className="flex items-center gap-1.5 px-2 py-1.5" style={{ backgroundColor: cardBgSoft, borderRadius: br }}>
                    <span className="text-[7px] font-bold uppercase tracking-wide" style={{ color: primaryColor || '#3b82f6' }}>{f.label}:</span>
                    <span className="text-[7px] truncate flex-1">{String(form[f.key]).slice(0, 40)}</span>
                  </div>
                ))}
              </div>
            );
          })();

          const sobreEmpresaBlock = (cat === 'BUSINESS' && (form.descricao || form.dataFundacao || galeria2.length > 0)) ? (
            <div
              className="relative overflow-hidden px-3 py-3.5"
              style={{ borderRadius: br, background: isLight ? `linear-gradient(155deg, ${primaryColor || '#3b82f6'}12, ${secondaryColor || '#8b5cf6'}12)` : `linear-gradient(155deg, ${primaryColor || '#3b82f6'}22, ${secondaryColor || '#8b5cf6'}18)`, border: `1px solid ${primaryColor || '#3b82f6'}30` }}
            >
              <p className={`text-[7px] font-bold uppercase tracking-widest ${t.sub}`}>Sobre a Empresa</p>
              {form.dataFundacao && <p className="text-[7px] font-semibold mt-0.5" style={{ color: primaryColor || '#3b82f6' }}>Desde {form.dataFundacao}</p>}
              {form.descricao && (
                <p className="text-[7px] mt-1.5 leading-relaxed line-clamp-4 pl-1.5" style={{ borderLeft: `2px solid ${primaryColor || '#3b82f6'}50` }}>{form.descricao}</p>
              )}
              {galeria2.length > 0 && (
                <div className="grid grid-cols-3 gap-1 mt-2">
                  {galeria2.slice(0, 6).map((m: any) => (
                    <div key={m.id} className="relative aspect-square overflow-hidden" style={{ borderRadius: `${(borderRadius || 16) / 3}px` }}>
                      {m.type === 'image'
                        ? <img src={m.url} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-[6px] text-zinc-400">▶</div>}
                      {m.caption && (
                        <div className="absolute inset-x-0 bottom-0 p-0.5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                          <p className="text-white text-[5px] font-semibold leading-none line-clamp-1">{m.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null;

          const atracoesBlockPreview = (cat === 'BUSINESS' && atracoesArr.length > 0) ? (
            <div className="space-y-1">
              <p className={`text-[6px] font-bold uppercase tracking-widest ${t.sub}`}>Destaques</p>
              <div className="flex gap-1.5 overflow-hidden">
                {atracoesArr.slice(0, 2).map(a => (
                  <div key={a.id} className="relative shrink-0 w-16 aspect-[4/5] overflow-hidden" style={{ borderRadius: `${(borderRadius || 16) / 3}px` }}>
                    {a.imagem ? <img src={a.imagem} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ background: `linear-gradient(155deg, ${primaryColor || '#3b82f6'}, ${secondaryColor || '#8b5cf6'})` }} />}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent 55%)' }} />
                    <p className="absolute bottom-1 left-1 right-1 text-white text-[6px] font-bold leading-tight line-clamp-2">{a.titulo}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null;

          const promocoesBlockPreview = (cat === 'BUSINESS' && promocoesArr.length > 0) ? (() => {
            const p = promocoesArr[0];
            return (
              <div className="space-y-1">
                <p className={`text-[6px] font-bold uppercase tracking-widest ${t.sub}`}>Promoções</p>
                <div className="overflow-hidden" style={{ backgroundColor: cardBgSoft, borderRadius: br }}>
                  {p.imagem && <div className="w-full aspect-video overflow-hidden"><img src={p.imagem} className="w-full h-full object-cover" /></div>}
                  <div className="p-2">
                    <p className="text-[7px] font-bold line-clamp-1">{p.titulo}</p>
                    {(p.precoDe || p.precoPor) && (
                      <div className="flex items-baseline gap-1 mt-0.5">
                        {p.precoDe && <span className="text-[6px] line-through opacity-60">{p.precoDe}</span>}
                        {p.precoPor && <span className="text-[8px] font-black" style={{ color: primaryColor || '#3b82f6' }}>{p.precoPor}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })() : null;

          const noticiasBlockPreview = (cat === 'BUSINESS' && noticiasArr.length > 0) ? (() => {
            const n = noticiasArr[0];
            return (
              <div className="space-y-1">
                <p className={`text-[6px] font-bold uppercase tracking-widest ${t.sub}`}>Novidades</p>
                <div className="flex items-center gap-2 px-2 py-1.5" style={{ backgroundColor: cardBgSoft, borderRadius: br }}>
                  <div className="shrink-0 w-8 h-8 rounded overflow-hidden bg-zinc-800">
                    {n.imagem ? <img src={n.imagem} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px]">📰</div>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[7px] font-bold line-clamp-1">{n.titulo}</p>
                    {n.data && <p className="text-[6px] opacity-60">{n.data}</p>}
                  </div>
                </div>
              </div>
            );
          })() : null;

          const catalogoBlock = (cat === 'BUSINESS' && form.catalogo) ? (
            <div className="w-full py-2 flex items-center justify-center gap-1.5" style={{ backgroundColor: buttonColor || primaryColor || '#3b82f6', borderRadius: br }}>
              <span className="text-[8px] font-bold text-white">Ver Catálogo</span>
            </div>
          ) : null;

          const avaliacaoGoogleBlock = (cat === 'BUSINESS' && form.googleReview) ? (
            <div className="w-full py-2 flex items-center justify-center gap-1.5 bg-white border border-zinc-200" style={{ borderRadius: br }}>
              <BrandIcon name="google" className="w-3 h-3" />
              <span className="text-[8px] font-bold text-zinc-700">Avalie-nos no Google</span>
            </div>
          ) : null;

          const depoimentosBlock = deps.length > 0 ? (
            <div className="space-y-1">
              <p className={`text-[6px] font-bold uppercase tracking-widest ${t.sub}`}>O que dizem de nós</p>
              <div className="p-2.5" style={{ backgroundColor: cardBgSoft, borderRadius: br }}>
                {!!deps[0].estrelas && (
                  <div className="flex gap-0.5 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-[7px] ${i < deps[0].estrelas ? 'text-amber-400' : 'text-zinc-600'}`}>★</span>
                    ))}
                  </div>
                )}
                <p className="text-[7px] italic line-clamp-3">&ldquo;{deps[0].texto}&rdquo;</p>
                <p className="text-[6px] font-bold mt-1 opacity-70">{deps[0].nome}{deps[0].cargo ? ` · ${deps[0].cargo}` : ''}</p>
              </div>
            </div>
          ) : null;

          const wifiBlock = (cat === 'BUSINESS' && wifiSsid) ? (
            <div className="w-full flex items-center gap-2 px-2.5 py-2" style={{ backgroundColor: cardBgSoft, borderRadius: br }}>
              <span className="text-[8px]">📶</span>
              <span className="text-[7px] font-bold flex-1 truncate">{wifiSsid}</span>
            </div>
          ) : null;

          const pixBlock = (form.chavePix || pixQrImage) ? (
            <div className="w-full flex items-center gap-2 px-2.5 py-2" style={{ backgroundColor: cardBgSoft, borderRadius: br }}>
              <span className="text-[8px]">💰</span>
              <span className="text-[7px] font-bold flex-1 truncate">Pagar via Pix</span>
            </div>
          ) : null;

          const apoioTEABlock = (cat === 'TEA' && (form.grauSuporte || form.comoAjudar || form.gatilhos || form.estrategiasAcalmar)) ? (
            <div
              className="relative overflow-hidden px-3 py-3"
              style={{ borderRadius: br, background: isLight ? `linear-gradient(155deg, ${primaryColor || '#3b82f6'}10, ${secondaryColor || '#8b5cf6'}10)` : `linear-gradient(155deg, ${primaryColor || '#3b82f6'}20, ${secondaryColor || '#8b5cf6'}16)`, border: `1px solid ${primaryColor || '#3b82f6'}30` }}
            >
              <p className={`text-[6px] font-bold uppercase tracking-widest ${t.sub}`}>🧩 Cartão de Apoio</p>
              {form.grauSuporte && <p className="text-[7px] font-semibold mt-1" style={{ color: primaryColor || '#3b82f6' }}>Grau de Suporte: {form.grauSuporte}</p>}
              {form.comoAjudar && <p className="text-[7px] mt-1 leading-relaxed line-clamp-2">{form.comoAjudar}</p>}
            </div>
          ) : null;

          const whatsappBlock = (form.whatsapp || form.telefone) ? (
            <div
              className={`w-full py-2 flex items-center justify-center gap-1.5 shadow ${buttonStyle || 'rounded-2xl'}`}
              style={{ backgroundColor: buttonColor || primaryColor || '#3b82f6', borderRadius: br }}
            >
              <span className="text-[8px] font-bold text-white">Botão de Contato</span>
            </div>
          ) : null;

          const BLOCK_MAP: Record<string, any> = {
            midia: midiaBlock,
            social: socialBlock,
            contato: contatoBlock,
            maisInfo: maisInfoBlock,
            sobreEmpresa: sobreEmpresaBlock,
            atracoes: atracoesBlockPreview,
            promocoes: promocoesBlockPreview,
            noticias: noticiasBlockPreview,
            catalogo: catalogoBlock,
            avaliacaoGoogle: avaliacaoGoogleBlock,
            depoimentos: depoimentosBlock,
            wifi: wifiBlock,
            pix: pixBlock,
            apoioTEA: apoioTEABlock,
          };

          const order: string[] = Array.isArray(blockOrder) && blockOrder.length ? blockOrder : DEFAULT_BLOCK_ORDER;
          const hidden: string[] = Array.isArray(hiddenBlocks) ? hiddenBlocks : [];
          const orderedIds = [...new Set([...order, ...DEFAULT_BLOCK_ORDER])].filter(id => !hidden.includes(id));

          return (
            <>
              {orderedIds.map(id => BLOCK_MAP[id] ? <div key={id}>{BLOCK_MAP[id]}</div> : null)}
              {whatsappBlock}
            </>
          );
        })()}

        <div className="flex flex-col items-center mt-1">
          <div className="bg-white p-1 rounded shadow" style={{ borderRadius: `${(borderRadius || 16) / 2}px` }}>
            <QRCodeSVG value="airnext.com" size={28} />
          </div>
          <p className="text-[6px] opacity-20 mt-1 tracking-[.2em] font-bold uppercase">AirNext</p>
        </div>
      </div>
    </div>
  );
}

/* ─── FORM FIELD ─────────────────────────────────────────── */
function FormField({ label, hint, icon: Icon, children }: { label: string; hint?: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="group/field">
      <label className="flex items-center gap-1.5 text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider mb-2 transition-colors group-focus-within/field:text-blue-400">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </label>
      {children}
      {hint && <p className="text-[10.5px] text-zinc-600 mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/20 hover:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:bg-white/[0.06] transition-all duration-200";
const textareaCls = `${inputCls} resize-none min-h-[90px] leading-relaxed`;

/* ─── CARTÃO DE SEÇÃO PREMIUM (agrupa campos relacionados) ───
   Wrapper visual usado para transformar blocos soltos de campos
   em cartões elegantes, com cabeçalho de ícone + título/descrição,
   inspirado no padrão Apple/Stripe de "grouped settings cards". */
function SectionCard({
  title, description, icon: Icon, tone = 'neutral', children,
}: { title?: string; description?: string; icon?: any; tone?: 'neutral' | 'blue' | 'emerald' | 'violet' | 'amber' | 'sky' | 'pink' | 'red'; children: React.ReactNode }) {
  const tones: Record<string, { ring: string; bg: string; icon: string }> = {
    neutral: { ring: 'border-white/8', bg: 'bg-white/[0.025]', icon: 'bg-white/8 text-zinc-300' },
    blue: { ring: 'border-blue-500/15', bg: 'bg-gradient-to-b from-blue-500/[0.06] to-transparent', icon: 'bg-blue-500/15 text-blue-400' },
    emerald: { ring: 'border-emerald-500/15', bg: 'bg-gradient-to-b from-emerald-500/[0.06] to-transparent', icon: 'bg-emerald-500/15 text-emerald-400' },
    violet: { ring: 'border-violet-500/15', bg: 'bg-gradient-to-b from-violet-500/[0.06] to-transparent', icon: 'bg-violet-500/15 text-violet-400' },
    amber: { ring: 'border-amber-500/15', bg: 'bg-gradient-to-b from-amber-500/[0.06] to-transparent', icon: 'bg-amber-500/15 text-amber-400' },
    sky: { ring: 'border-sky-500/15', bg: 'bg-gradient-to-b from-sky-500/[0.06] to-transparent', icon: 'bg-sky-500/15 text-sky-400' },
    pink: { ring: 'border-pink-500/15', bg: 'bg-gradient-to-b from-pink-500/[0.06] to-transparent', icon: 'bg-pink-500/15 text-pink-400' },
    red: { ring: 'border-red-500/20', bg: 'bg-gradient-to-b from-red-500/[0.06] to-transparent', icon: 'bg-red-500/15 text-red-400' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <div className={`rounded-2xl border ${t.ring} ${t.bg} p-4 shadow-sm shadow-black/20 space-y-4 scale-in`}>
      {(title || Icon) && (
        <div className="flex items-start gap-3">
          {Icon && (
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${t.icon}`}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0 pt-0.5">
            {title && <p className="text-xs font-bold text-white">{title}</p>}
            {description && <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{description}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── COLOR SWATCH FIELD (nome / bio / texto / botões / apps) ───────── */
const SWATCHES = ['#ffffff', '#0a0a0a', '#3b82f6', '#f59e0b', '#ec4899', '#10b981', '#ef4444'];
function ColorField({ label, hint, value, onChange, autoLabel = 'Automática' }: { label: string; hint?: string; value: string; onChange: (v: string) => void; autoLabel?: string }) {
  return (
    <div>
      <p className="text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider mb-2.5">{label}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onChange('')}
          className={`px-3.5 py-2 rounded-xl text-[11px] font-bold border-2 transition-all duration-200 ${!value ? 'border-blue-500 bg-blue-500/10 text-white shadow-sm shadow-blue-500/20' : 'border-white/8 bg-white/[0.02] text-zinc-500 hover:border-white/20 hover:text-zinc-300'}`}
        >
          {autoLabel}
        </button>
        {SWATCHES.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-9 h-9 rounded-full border-2 transition-all duration-200 hover:scale-110 ${value === c ? 'border-blue-500 scale-110 shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/20' : 'border-white/10 hover:border-white/30'}`}
            style={{ backgroundColor: c }}
          />
        ))}
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl p-1.5 hover:border-white/20 transition-colors">
          <input type="color" value={value || '#ffffff'} onChange={e => onChange(e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0 outline-none" />
        </div>
      </div>
      {hint && <p className="text-[10.5px] text-zinc-600 mt-2 leading-relaxed">{hint}</p>}
    </div>
  );
}

/* ─── TOGGLE ─────────────────────────────────────────────── */
function Toggle({ value, onChange, danger }: { value: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full shadow-inner transition-all duration-300 ${value ? (danger ? 'bg-gradient-to-r from-red-500 to-rose-500 shadow-red-500/25' : 'bg-gradient-to-r from-blue-500 to-violet-500 shadow-blue-500/25') : 'bg-zinc-700/70'}`}
    >
      <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-300 ease-out ${value ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
  );
}

/* ─── SEÇÃO COLAPSÁVEL (aparência compacta) ─────────────────
   Mostra um cabeçalho clicável com uma prévia resumida; ao
   clicar, expande e revela todos os controles completos. Isso
   evita que a aba "Visual" fique gigante e difícil de rolar. */
function CollapsibleSection({
  title, subtitle, preview, defaultOpen = false, icon: Icon, children,
}: { title: string; subtitle?: string; preview?: React.ReactNode; defaultOpen?: boolean; icon?: any; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-2xl border transition-all duration-300 ${open ? 'border-blue-500/40 bg-gradient-to-b from-blue-500/[0.06] to-white/[0.02] shadow-lg shadow-blue-500/5' : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.03]'} overflow-hidden`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-4 text-left active:scale-[0.99] transition-transform">
        {Icon && (
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${open ? 'bg-blue-500/15 text-blue-400' : 'bg-white/6 text-zinc-500'}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white">{title}</p>
          {subtitle && <p className="text-[10.5px] text-zinc-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
        {preview && <div className="shrink-0 flex items-center gap-1">{preview}</div>}
        <ChevronRight className={`h-4 w-4 text-zinc-500 shrink-0 transition-transform duration-300 ${open ? 'rotate-90 text-blue-400' : ''}`} />
      </button>
      {open && <div className="p-4 pt-1 space-y-4 border-t border-white/5 scale-in">{children}</div>}
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────── */
export default function Perfil() {
  const { productId } = useParams<{ productId: string }>();
  const { products, updateProfile, updateTheme, updateVisibility } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const product = products.find(p => p.id === productId);

  const [step, setStep] = useState(0);
  const [mobileMode, setMobileMode] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [imageEditorKey, setImageEditorKey] = useState('');

  // Form
  const [form, setForm] = useState<Record<string, any>>({});
  const [mediaItems, setMediaItems] = useState<{ id: string; type: 'image' | 'video'; url: string; caption?: string }[]>([]);
  const [mediaItems2, setMediaItems2] = useState<{ id: string; type: 'image' | 'video'; url: string; caption?: string }[]>([]);

  // Visual
  const [theme, setTheme] = useState<ProfileTheme>('escuro');
  const [wallpaper, setWallpaper] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
  const [blurAmount, setBlurAmount] = useState(0);
  const [opacity, setOpacity] = useState(90);
  const [borderRadius, setBorderRadius] = useState(20);
  const [buttonStyle, setButtonStyle] = useState('rounded-2xl');
  const [linkStyle, setLinkStyle] = useState<'grid' | 'list'>('grid');
  const [sosMode, setSosMode] = useState(false);
  const [verified, setVerified] = useState(false);
  const [wallpaperTab, setWallpaperTab] = useState<'gradient' | 'solid' | 'imagem'>('gradient');
  const [textColor, setTextColor] = useState('');
  const [nameColor, setNameColor] = useState('');
  const [bioColor, setBioColor] = useState('');
  const [mainTextColor, setMainTextColor] = useState('');
  const [labelColor, setLabelColor] = useState('');
  const [buttonColor, setButtonColor] = useState('');
  const [appsColor, setAppsColor] = useState('');
  const [vcardNome, setVcardNome] = useState('');
  const [vcardEmpresa, setVcardEmpresa] = useState('');
  const [vcardCargo, setVcardCargo] = useState('');
  const [vcardTelefone, setVcardTelefone] = useState('');
  const [vcardTelefone2, setVcardTelefone2] = useState('');
  const [vcardEmail, setVcardEmail] = useState('');
  const [vcardSite, setVcardSite] = useState('');
  const [vcardEndereco, setVcardEndereco] = useState('');
  const [vcardObservacoes, setVcardObservacoes] = useState('');
  const [layout, setLayout] = useState<ProfileLayout>('center');
  const [fontFamily, setFontFamily] = useState('inter');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiQrImage, setWifiQrImage] = useState('');
  const [pixQrImage, setPixQrImage] = useState('');
  const [businessHours, setBusinessHours] = useState<{ day: number; open: string; close: string; closed: boolean }[]>(DEFAULT_BUSINESS_HOURS);
  const [horariosAlwaysOpen, setHorariosAlwaysOpen] = useState(false);
  const [horariosDisplayMode, setHorariosDisplayMode] = useState<'tabela' | 'descricao'>('tabela');
  const [horariosDescricao, setHorariosDescricao] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [blockOrder, setBlockOrder] = useState<string[]>(DEFAULT_BLOCK_ORDER);
  const [hiddenBlocks, setHiddenBlocks] = useState<string[]>([]);
  const [hiddenFields, setHiddenFields] = useState<string[]>([]);

  // Pré-carrega todas as fontes do catálogo (usadas nos botões do seletor
  // de Fonte, na aba Visual) para que cada opção já mostre sua própria
  // tipografia em tempo real, sem esperar o clique.
  useEffect(() => {
    FONT_OPTIONS.forEach(f => loadGoogleFont(f.id));
  }, []);

  useEffect(() => {
    if (product) {
      const data: any = product.profileData ? { ...(product.profileData as any) } : {};
      setForm(data);
      setTheme((product.theme as ProfileTheme) || 'escuro');
      setWallpaper(data.__wallpaper || '');
      setTextColor(data.__textColor || '');
      setNameColor(data.__nameColor || data.__textColor || '');
      setBioColor(data.__bioColor || data.__textColor || '');
      setMainTextColor(data.__mainTextColor || data.__textColor || '');
      setLabelColor(data.__labelColor || '');
      setButtonColor(data.__buttonColor || '');
      setAppsColor(data.__appsColor || '');
      setVcardNome(data.__vcard?.nome || '');
      setVcardEmpresa(data.__vcard?.empresa || '');
      setVcardCargo(data.__vcard?.cargo || '');
      setVcardTelefone(data.__vcard?.telefone || '');
      setVcardTelefone2(data.__vcard?.telefone2 || '');
      setVcardEmail(data.__vcard?.email || '');
      setVcardSite(data.__vcard?.site || '');
      setVcardEndereco(data.__vcard?.endereco || '');
      setVcardObservacoes(data.__vcard?.observacoes || '');
      setLayout((data.__layout as ProfileLayout) || 'center');
      setFontFamily(data.__fontFamily || 'inter');
      setWifiSsid(data.__wifiSsid || '');
      setWifiPassword(data.__wifiPassword || '');
      setWifiQrImage(data.__wifiQrImage || '');
      setPixQrImage(data.__pixQrImage || '');
      setBusinessHours(Array.isArray(data.__horarios) && data.__horarios.length === 7 ? data.__horarios : DEFAULT_BUSINESS_HOURS);
      setHorariosAlwaysOpen(!!data.__horariosAlwaysOpen);
      setHorariosDisplayMode(data.__horariosDisplayMode === 'descricao' ? 'descricao' : 'tabela');
      setHorariosDescricao(data.__horariosDescricao || '');
      setPaymentMethods(Array.isArray(data.__formasPagamento) ? data.__formasPagamento : []);
      setPrimaryColor(data.__primaryColor || '#3b82f6');
      setSecondaryColor(data.__secondaryColor || '#8b5cf6');
      setBlurAmount(data.__blurAmount ?? 0);
      setOpacity(data.__opacity ?? 90);
      setBorderRadius(data.__borderRadius ?? 20);
      setButtonStyle(data.__buttonStyle || 'rounded-2xl');
      setLinkStyle(data.__linkStyle || 'grid');
      setSosMode(data.__sosMode || false);
      setVerified(data.__verified || false);
      setMediaItems(product.mediaCarousel || []);
      // BUGFIX: "Sobre a Empresa" (galeria2/mediaCarousel2) é persistido dentro
      // de profile_data (é assim que PublicProfile.tsx já lê: d.mediaCarousel2),
      // e NÃO como coluna própria do produto — mapProduct() nunca populou
      // product.mediaCarousel2, então ao recarregar a página o array voltava
      // sempre vazio e as fotos "somiam" mesmo tendo sido salvas corretamente.
      setMediaItems2(Array.isArray(data.mediaCarousel2) ? data.mediaCarousel2 : []);
      const cat0 = product.category || 'PERSONAL';
      const allowedIds = BLOCK_DEFS.filter(b => !b.catFilter || b.catFilter(cat0)).map(b => b.id);
      const savedOrder: string[] = Array.isArray(data.__blockOrder) ? data.__blockOrder.filter((id: string) => allowedIds.includes(id)) : [];
      const missing = allowedIds.filter(id => !savedOrder.includes(id));
      setBlockOrder([...savedOrder, ...missing]);
      setHiddenBlocks(Array.isArray(data.__hiddenBlocks) ? data.__hiddenBlocks : []);
      setHiddenFields(Array.isArray(data.__hiddenFields) ? data.__hiddenFields : []);
    }
  }, [product?.id]);

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
        <p className="text-zinc-500 text-sm">Carregando perfil...</p>
      </div>
    </div>
  );

  const cat = product.category || 'PERSONAL';
  const catLabel = { PERSONAL: 'Personal', BUSINESS: 'Business', PET: 'Pet', KIDS: 'Kids', SENIOR: 'Senior', TEA: 'TEA' }[cat] || cat;
  const visibility = product.visibility || 'public';
  const fields = FIELDS[cat] || FIELDS.PERSONAL;
  const hasSOS = HAS_SOS.includes(cat);
  const hasTestimonials = HAS_TESTIMONIALS.includes(cat);
  const activeSteps = STEPS.filter(s => (s.id !== 'sos' || hasSOS) && (s.id !== 'depoimentos' || hasTestimonials) && (s.id !== 'novidades' || cat === 'BUSINESS'));

  const setField = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleBlockDrop = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setBlockOrder(prev => {
      const next = [...prev];
      const from = next.indexOf(sourceId);
      const to = next.indexOf(targetId);
      if (from === -1 || to === -1) return prev;
      next.splice(from, 1);
      next.splice(to, 0, sourceId);
      return next;
    });
  };
  const toggleBlockHidden = (id: string) => setHiddenBlocks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleFieldHidden = (key: string) => setHiddenFields(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);

  const depoimentos: { id: string; nome: string; cargo?: string; texto: string; estrelas?: number }[] = Array.isArray(form.depoimentos) ? form.depoimentos : [];
  const addDepoimento = () => setField('depoimentos', [...depoimentos, { id: `d${Date.now()}`, nome: '', cargo: '', texto: '', estrelas: 5 }]);
  const updateDepoimento = (id: string, patch: any) => setField('depoimentos', depoimentos.map(t => t.id === id ? { ...t, ...patch } : t));
  const removeDepoimento = (id: string) => setField('depoimentos', depoimentos.filter(t => t.id !== id));

  const atracoes: { id: string; titulo: string; subtitulo?: string; imagem?: string; link?: string; tag?: string }[] = Array.isArray(form.atracoes) ? form.atracoes : [];
  const addAtracao = () => setField('atracoes', [...atracoes, { id: `atr${Date.now()}`, titulo: '', subtitulo: '', imagem: '', link: '', tag: '' }]);
  const updateAtracao = (id: string, patch: any) => setField('atracoes', atracoes.map(a => a.id === id ? { ...a, ...patch } : a));
  const removeAtracao = (id: string) => setField('atracoes', atracoes.filter(a => a.id !== id));

  const promocoes: { id: string; titulo: string; descricao?: string; imagem?: string; precoDe?: string; precoPor?: string; validade?: string; link?: string; tag?: string }[] = Array.isArray(form.promocoes) ? form.promocoes : [];
  const addPromocao = () => setField('promocoes', [...promocoes, { id: `promo${Date.now()}`, titulo: '', descricao: '', imagem: '', precoDe: '', precoPor: '', validade: '', link: '', tag: '' }]);
  const updatePromocao = (id: string, patch: any) => setField('promocoes', promocoes.map(p => p.id === id ? { ...p, ...patch } : p));
  const removePromocao = (id: string) => setField('promocoes', promocoes.filter(p => p.id !== id));

  const noticias: { id: string; titulo: string; resumo?: string; imagem?: string; data?: string; link?: string }[] = Array.isArray(form.noticias) ? form.noticias : [];
  const addNoticia = () => setField('noticias', [...noticias, { id: `news${Date.now()}`, titulo: '', resumo: '', imagem: '', data: '', link: '' }]);
  const updateNoticia = (id: string, patch: any) => setField('noticias', noticias.map(n => n.id === id ? { ...n, ...patch } : n));
  const removeNoticia = (id: string) => setField('noticias', noticias.filter(n => n.id !== id));

  const updateBusinessHour = (day: number, patch: Partial<{ open: string; close: string; closed: boolean }>) =>
    setBusinessHours(prev => prev.map(h => h.day === day ? { ...h, ...patch } : h));
  const togglePaymentMethod = (id: string) =>
    setPaymentMethods(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveState('saving');
    const result = await updateProfile(product.id, {
      ...form,
      __wallpaper: wallpaper,
      __textColor: nameColor, // mantém compatibilidade com leitores antigos do campo
      __nameColor: nameColor,
      __bioColor: bioColor,
      __mainTextColor: mainTextColor,
      __labelColor: labelColor,
      __buttonColor: buttonColor,
      __appsColor: appsColor,
      __vcard: {
        nome: vcardNome,
        empresa: vcardEmpresa,
        cargo: vcardCargo,
        telefone: vcardTelefone,
        telefone2: vcardTelefone2,
        email: vcardEmail,
        site: vcardSite,
        endereco: vcardEndereco,
        observacoes: vcardObservacoes,
      },
      __layout: layout,
      __fontFamily: fontFamily,
      __wifiSsid: wifiSsid,
      __wifiPassword: wifiPassword,
      __wifiQrImage: wifiQrImage,
      __pixQrImage: pixQrImage,
      __horarios: businessHours,
      __horariosAlwaysOpen: horariosAlwaysOpen,
      __horariosDisplayMode: horariosDisplayMode,
      __horariosDescricao: horariosDescricao,
      __formasPagamento: paymentMethods,
      __primaryColor: primaryColor,
      __secondaryColor: secondaryColor,
      __blurAmount: blurAmount,
      __opacity: opacity,
      __borderRadius: borderRadius,
      __buttonStyle: buttonStyle,
      __linkStyle: linkStyle,
      __sosMode: sosMode,
      __verified: verified,
      __blockOrder: blockOrder,
      __hiddenBlocks: hiddenBlocks,
      __hiddenFields: hiddenFields,
      mediaCarousel: mediaItems,
      mediaCarousel2: mediaItems2,
    });
    await updateTheme(product.id, theme);
    setIsSaving(false);
    if (result?.ok !== false) {
      setSaveState('saved');
      toast.show('Perfil salvo! ✨', 'success');
      setTimeout(() => setSaveState('idle'), 3000);
    } else {
      setSaveState('error');
      toast.show('Erro ao salvar. Tente novamente.', 'error');
      setTimeout(() => setSaveState('idle'), 3000);
    }
  };

  const openImageEditor = (key: string) => { setImageEditorKey(key); setImageEditorOpen(true); };
  const handleImageSave = (url: string) => {
    if (imageEditorKey === '__galeria') {
      setMediaItems(prev => [...prev, { id: `m${Date.now()}`, type: 'image', url }]);
    } else if (imageEditorKey === '__galeria2') {
      setMediaItems2(prev => [...prev, { id: `m2${Date.now()}`, type: 'image', url }]);
    } else if (imageEditorKey === '__wallpaperImage') {
      setWallpaper(url);
    } else if (imageEditorKey === '__pixQr') {
      setPixQrImage(url);
    } else if (imageEditorKey === '__wifiQr') {
      setWifiQrImage(url);
    } else if (imageEditorKey.startsWith('__atracaoImg__')) {
      updateAtracao(imageEditorKey.replace('__atracaoImg__', ''), { imagem: url });
    } else if (imageEditorKey.startsWith('__promocaoImg__')) {
      updatePromocao(imageEditorKey.replace('__promocaoImg__', ''), { imagem: url });
    } else if (imageEditorKey.startsWith('__noticiaImg__')) {
      updateNoticia(imageEditorKey.replace('__noticiaImg__', ''), { imagem: url });
    } else {
      setField(imageEditorKey, url);
    }
    setImageEditorOpen(false);
  };

  const IMAGE_EDITOR_CONFIG: Record<string, { aspect: number; title: string; helperText: string }> = {
    foto: { aspect: 1, title: 'Foto de Perfil', helperText: 'Formato quadrado · recomendado 1080×1080px' },
    capa: { aspect: 3, title: 'Foto de Capa', helperText: 'Formato largo (3:1) · recomendado 1200×400px' },
    __galeria: { aspect: 4 / 3, title: 'Foto da Galeria', helperText: 'Formato 4:3 · recomendado 1200×900px' },
    __galeria2: { aspect: 1, title: 'Foto — Sobre a Empresa', helperText: 'Formato quadrado · recomendado 900×900px' },
    __wallpaperImage: { aspect: 9 / 16, title: 'Imagem de Fundo', helperText: 'Retrato (9:16) · recomendado 1080×1920px' },
    __pixQr: { aspect: 1, title: 'QR Code do Pix', helperText: 'Envie o print/foto do QR gerado pelo seu banco' },
    __wifiQr: { aspect: 1, title: 'QR Code do Wi-Fi', helperText: 'Envie o print/foto do QR do seu roteador, se preferir' },
  };
  const getImageEditorConfig = (key: string) => {
    if (key.startsWith('__atracaoImg__')) return { aspect: 4 / 5, title: 'Foto do Destaque', helperText: 'Retrato (4:5) · recomendado 1000×1250px' };
    if (key.startsWith('__promocaoImg__')) return { aspect: 16 / 9, title: 'Foto da Promoção', helperText: 'Formato largo (16:9) · recomendado 1200×675px' };
    if (key.startsWith('__noticiaImg__')) return { aspect: 4 / 3, title: 'Foto da Notícia', helperText: 'Formato 4:3 · recomendado 1000×750px' };
    return IMAGE_EDITOR_CONFIG[key] || { aspect: 1, title: 'Imagem', helperText: '' };
  };

  const addVideoMedia = () => {
    const url = prompt('Cole a URL do vídeo (YouTube, Vimeo):');
    if (url) setMediaItems(prev => [...prev, { id: `m${Date.now()}`, type: 'video', url }]);
  };

  const isLastStep = step === activeSteps.length - 1;
  const currentStep = activeSteps[step];

  /* ─── STEP RENDERS ─── */
  const renderStep = () => {
    const sid = currentStep?.id;

    /* FOTO */
    if (sid === 'foto') return (
      <div className="space-y-5">
        {/* Avatar Upload */}
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Foto de Perfil</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => openImageEditor('foto')}
              className="relative group w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-white/[0.03] border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden hover:border-blue-500/50 transition-all shrink-0"
            >
              {form.foto
                ? (<><img src={form.foto} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Camera className="h-6 w-6 text-white" /></div></>)
                : (<><Camera className="h-7 w-7 text-zinc-600 mb-1" /><span className="text-[10px] text-zinc-600">Adicionar</span></>)
              }
            </button>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{form.foto ? 'Foto adicionada ✓' : 'Sem foto'}</p>
              <p className="text-[11px] text-zinc-600 mt-1">Toque para adicionar ou alterar. Recomendamos quadrado, mínimo 400×400px.</p>
              {form.foto && (
                <button onClick={() => setField('foto', '')} className="mt-2 text-[11px] text-red-400 hover:text-red-300 transition-colors">
                  Remover foto
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cover Upload */}
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Foto de Capa</p>
          <button
            onClick={() => openImageEditor('capa')}
            className="relative group w-full aspect-[3/1] rounded-2xl bg-white/[0.03] border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden hover:border-blue-500/50 transition-all"
          >
            {form.capa
              ? (<><img src={form.capa} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Camera className="h-6 w-6 text-white" /></div></>)
              : (<><ImageIcon className="h-6 w-6 text-zinc-600 mb-1.5" /><span className="text-[11px] text-zinc-600">Adicionar Capa · 3:1 recomendado</span></>)
            }
          </button>
          {form.capa && <button onClick={() => setField('capa', '')} className="mt-1.5 text-[11px] text-red-400 hover:text-red-300 transition-colors">Remover capa</button>}
        </div>

        {/* Verified badge */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Emblema Verificado</p>
              <p className="text-[10px] text-zinc-600">Selo azul na foto de perfil</p>
            </div>
          </div>
          <Toggle value={verified} onChange={setVerified} />
        </div>
      </div>
    );

    /* INFO */
    if (sid === 'info') return (
      <div className="space-y-3">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-500/[0.07] to-violet-500/[0.02] border border-violet-500/15 shadow-sm shadow-violet-500/5">
          <p className="text-xs font-bold text-white mb-0.5">📝 Informações · {catLabel}</p>
          <p className="text-[11px] text-zinc-500">Preencha os dados que aparecerão no perfil.</p>
        </div>
        {fields.map(f => (
          <FormField key={f.key} label={f.label}>
            {f.type === 'textarea'
              ? <textarea value={form[f.key] || ''} onChange={e => setField(f.key, e.target.value)} placeholder={f.placeholder} className={textareaCls} rows={3} />
              : <input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setField(f.key, e.target.value)} placeholder={f.placeholder} className={inputCls} />
            }
          </FormField>
        ))}

        {fields.some(f => f.key === 'chavePix') && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/[0.07] to-emerald-500/[0.02] border border-emerald-500/15 shadow-sm shadow-emerald-500/5 space-y-3">
            <div>
              <p className="text-xs font-bold text-white mb-0.5">💰 QR Code do Pix (opcional)</p>
              <p className="text-[11px] text-zinc-500">Por padrão o QR é gerado automaticamente a partir da chave. Se preferir, envie o print do QR gerado pelo seu banco.</p>
            </div>
            {pixQrImage ? (
              <div className="flex items-center gap-3">
                <img src={pixQrImage} className="w-16 h-16 rounded-xl object-contain bg-white p-1" />
                <button onClick={() => setPixQrImage('')} className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors">Remover e usar QR automático</button>
              </div>
            ) : (
              <button
                onClick={() => openImageEditor('__pixQr')}
                className="w-full p-3 rounded-xl border-2 border-dashed border-white/10 hover:border-emerald-500/40 bg-white/[0.02] flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <ImageIcon className="h-4 w-4 text-zinc-600" />
                <span className="text-xs text-zinc-500 font-bold">Enviar QR Code do Pix</span>
              </button>
            )}
          </div>
        )}

        {cat === 'BUSINESS' && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-500/[0.07] to-sky-500/[0.02] border border-sky-500/15 shadow-sm shadow-sky-500/5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0">
                <Signal className="h-4 w-4 text-sky-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white mb-0.5">Wi-Fi do Estabelecimento (opcional)</p>
                <p className="text-[11px] text-zinc-500">Exibe um bloco com a senha da rede e um QR Code para os clientes se conectarem automaticamente.</p>
              </div>
            </div>
            <FormField label="Nome da Rede (SSID)">
              <input value={wifiSsid} onChange={e => setWifiSsid(e.target.value)} placeholder="Ex: Loja_5G" className={inputCls} />
            </FormField>
            <FormField label="Senha da Rede">
              <input value={wifiPassword} onChange={e => setWifiPassword(e.target.value)} placeholder="Senha do Wi-Fi" className={inputCls} />
            </FormField>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">QR Code do Wi-Fi</p>
              {wifiQrImage ? (
                <div className="flex items-center gap-3">
                  <img src={wifiQrImage} className="w-16 h-16 rounded-xl object-contain bg-white p-1" />
                  <button onClick={() => setWifiQrImage('')} className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors">Remover e usar QR automático</button>
                </div>
              ) : (
                <button
                  onClick={() => openImageEditor('__wifiQr')}
                  className="w-full p-3 rounded-xl border-2 border-dashed border-white/10 hover:border-sky-500/40 bg-white/[0.02] flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <ImageIcon className="h-4 w-4 text-zinc-600" />
                  <span className="text-xs text-zinc-500 font-bold">Enviar QR Code do roteador (opcional)</span>
                </button>
              )}
              <p className="text-[10px] text-zinc-600 mt-1.5">Se não enviar, geramos automaticamente a partir do nome e senha da rede.</p>
            </div>
          </div>
        )}

        {cat === 'BUSINESS' && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/[0.07] to-amber-500/[0.02] border border-amber-500/15 shadow-sm shadow-amber-500/5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white mb-0.5">Horário de Funcionamento</p>
                <p className="text-[11px] text-zinc-500">O perfil mostra automaticamente "Aberto agora" ou "Fechado agora" com base nesses horários.</p>
              </div>
            </div>

            {/* Sempre aberto */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/8 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white">Sempre Aberto</p>
                <p className="text-[10px] text-zinc-600">Atendimento 24h, todos os dias. Ignora os horários abaixo.</p>
              </div>
              <Toggle value={horariosAlwaysOpen} onChange={setHorariosAlwaysOpen} />
            </div>

            {/* Modo de exibição: tabela completa ou apenas descrição */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/8 space-y-2">
              <p className="text-xs font-bold text-white">Como exibir no perfil</p>
              <div className="flex gap-0.5 bg-white/5 p-0.5 rounded-lg border border-white/5 w-fit">
                <button
                  onClick={() => setHorariosDisplayMode('tabela')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${horariosDisplayMode === 'tabela' ? 'bg-amber-500 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Tabela completa
                </button>
                <button
                  onClick={() => setHorariosDisplayMode('descricao')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${horariosDisplayMode === 'descricao' ? 'bg-amber-500 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Somente descrição
                </button>
              </div>
              {(horariosDisplayMode === 'descricao' || horariosAlwaysOpen) && (
                <textarea
                  className={textareaCls}
                  value={horariosDescricao}
                  onChange={e => setHorariosDescricao(e.target.value)}
                  placeholder={horariosAlwaysOpen ? 'Ex.: Atendimento 24 horas, todos os dias da semana.' : 'Ex.: Segunda a sexta, das 9h às 18h. Sábados, das 9h às 13h.'}
                />
              )}
            </div>

            {horariosDisplayMode === 'tabela' && !horariosAlwaysOpen && (
            <div className="space-y-1.5">
              {businessHours.map(h => (
                <div key={h.day} className="flex items-center gap-2 py-1.5">
                  <span className="text-[11px] font-bold text-zinc-400 w-16 shrink-0">{DAY_LABELS[h.day].slice(0, 3)}</span>
                  <button
                    onClick={() => updateBusinessHour(h.day, { closed: !h.closed })}
                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg shrink-0 transition-colors ${h.closed ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}
                  >
                    {h.closed ? 'Fechado' : 'Aberto'}
                  </button>
                  {!h.closed && (
                    <>
                      <input
                        type="time"
                        value={h.open}
                        onChange={e => updateBusinessHour(h.day, { open: e.target.value })}
                        className="flex-1 min-w-0 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-[11px] focus:outline-none focus:border-amber-500/40"
                      />
                      <span className="text-zinc-600 text-[11px]">–</span>
                      <input
                        type="time"
                        value={h.close}
                        onChange={e => updateBusinessHour(h.day, { close: e.target.value })}
                        className="flex-1 min-w-0 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-[11px] focus:outline-none focus:border-amber-500/40"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {cat === 'BUSINESS' && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/[0.07] to-emerald-500/[0.02] border border-emerald-500/15 shadow-sm shadow-emerald-500/5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <CreditCard className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white mb-0.5">Formas de Pagamento Aceitas</p>
                <p className="text-[11px] text-zinc-500">Selecione as opções que seu negócio aceita.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHOD_OPTIONS.map(m => {
                const active = paymentMethods.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => togglePaymentMethod(m.id)}
                    className={`text-[11px] font-bold px-3 py-2 rounded-xl border transition-all active:scale-95 ${active ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-white/[0.03] border-white/10 text-zinc-500'}`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );

    /* VISUAL */
    if (sid === 'visual') return (
      <div className="space-y-3">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-500/[0.07] to-pink-500/[0.02] border border-pink-500/15 shadow-sm shadow-pink-500/5">
          <p className="text-xs font-bold text-white mb-0.5">🎨 Aparência</p>
          <p className="text-[11px] text-zinc-500">Toque em cada seção para abrir e personalizar. Fica mais compacto e fácil de navegar.</p>
        </div>

        {/* Fonte */}
        <CollapsibleSection
          title="Fonte do Perfil"
          subtitle={getFontOption(fontFamily).label}
          preview={<span className="text-sm font-bold text-white" style={{ fontFamily: getFontOption(fontFamily).family }}>Aa</span>}
        >
          <div className="grid grid-cols-2 gap-2">
            {FONT_OPTIONS.map(f => (
              <button
                key={f.id}
                onClick={() => setFontFamily(f.id)}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${fontFamily === f.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/8 bg-white/[0.02] hover:border-white/20'}`}
                style={{ fontFamily: f.family }}
              >
                <p className="text-base font-bold text-white leading-none">Aa</p>
                <p className="text-[10px] text-zinc-500 mt-1.5 truncate">{f.label}</p>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-zinc-600 mt-2">Aplicada em tempo real ao nome, textos e botões do perfil.</p>
        </CollapsibleSection>

        {/* Custom Background */}
        <CollapsibleSection
          title="Fundo Customizado"
          subtitle={wallpaper ? 'Personalizado' : 'Automático (padrão da categoria)'}
          preview={
            wallpaper
              ? (wallpaper.startsWith('http') || wallpaper.startsWith('data:')
                  ? <div className="w-7 h-7 rounded-full border border-white/20 bg-cover bg-center" style={{ backgroundImage: `url(${wallpaper})` }} />
                  : <div className={`w-7 h-7 rounded-full border border-white/20 ${wallpaper}`} />)
              : <div className="w-7 h-7 rounded-full border border-white/20 bg-zinc-800" />
          }
        >
          <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl mb-3 border border-white/5">
            {(['gradient', 'solid', 'imagem'] as const).map(t => (
              <button
                key={t}
                onClick={() => setWallpaperTab(t)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${wallpaperTab === t ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                {t === 'gradient' ? 'Gradientes' : t === 'solid' ? 'Cores Sólidas' : 'Imagem'}
              </button>
            ))}
          </div>

          {wallpaperTab === 'imagem' ? (
            <div>
              <button
                onClick={() => openImageEditor('__wallpaperImage')}
                className="relative group w-full h-32 rounded-2xl bg-white/[0.03] border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden hover:border-blue-500/50 transition-all"
              >
                {wallpaper && (wallpaper.startsWith('http') || wallpaper.startsWith('data:'))
                  ? (<><img src={wallpaper} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Camera className="h-6 w-6 text-white" /></div></>)
                  : (<><ImageIcon className="h-6 w-6 text-zinc-600 mb-1.5" /><span className="text-[11px] text-zinc-600">Enviar imagem de fundo · Retrato 9:16 recomendado</span></>)
                }
              </button>
              {wallpaper && (wallpaper.startsWith('http') || wallpaper.startsWith('data:')) && (
                <button onClick={() => setWallpaper('')} className="mt-1.5 text-[11px] text-red-400 hover:text-red-300 transition-colors">Remover imagem de fundo</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-1.5">
              <button
                onClick={() => setWallpaper('')}
                className={`aspect-square rounded-xl flex items-center justify-center bg-zinc-900 border-2 transition-all ${!wallpaper ? 'border-blue-500' : 'border-white/5 hover:border-white/15'}`}
              >
                <span className="text-[8px] text-zinc-500 font-bold">Auto</span>
              </button>
              {(wallpaperTab === 'gradient' ? GRADIENTS : SOLID_COLORS).map(w => (
                <button
                  key={w.id}
                  onClick={() => setWallpaper(w.value)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 relative transition-all ${wallpaper === w.value ? 'border-blue-500 scale-[1.05]' : 'border-white/5 hover:border-white/15'}`}
                >
                  <div className={`absolute inset-0 ${w.value}`} />
                  {wallpaper === w.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-white drop-shadow" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* Colors */}
        <CollapsibleSection
          title="Cores & Textos"
          subtitle="Cor principal, secundária, nome, bio e texto"
          preview={
            <div className="flex -space-x-1.5">
              <div className="w-6 h-6 rounded-full border-2 border-[#141416]" style={{ backgroundColor: primaryColor }} />
              <div className="w-6 h-6 rounded-full border-2 border-[#141416]" style={{ backgroundColor: secondaryColor }} />
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Cor Principal">
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/8 rounded-xl p-2.5">
                <div className="w-8 h-8 rounded-lg border border-white/10 shrink-0" style={{ backgroundColor: primaryColor }} />
                <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1 h-8 rounded-lg cursor-pointer bg-transparent border-0 outline-none" />
              </div>
            </FormField>
            <FormField label="Cor Secundária">
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/8 rounded-xl p-2.5">
                <div className="w-8 h-8 rounded-lg border border-white/10 shrink-0" style={{ backgroundColor: secondaryColor }} />
                <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="flex-1 h-8 rounded-lg cursor-pointer bg-transparent border-0 outline-none" />
              </div>
            </FormField>
          </div>

          <div className="space-y-5 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-xs font-bold text-white -mb-1">🎨 Cores do Texto</p>
            <ColorField label="Cor do Nome" value={nameColor} onChange={setNameColor} hint="Aplica-se ao nome / nome da empresa exibido no topo do perfil." />
            <ColorField label="Cor da Bio" value={bioColor} onChange={setBioColor} hint="Aplica-se à bio curta e à descrição abaixo do nome." />
            <ColorField label="Cor do Texto Principal" value={mainTextColor} onChange={setMainTextColor} hint="Aplica-se aos textos de contato, mais informações e depoimentos." />
            <ColorField label="Cor dos Títulos de Seção" value={labelColor} onChange={setLabelColor} hint='Aplica-se apenas aos títulos das seções (ex.: "Telefone", "Redes & Contato", "Mais Informações"), separado da cor dos valores preenchidos.' />
          </div>
        </CollapsibleSection>

        {/* Opacity & Blur */}
        <CollapsibleSection
          title="Opacidade & Desfoque"
          subtitle={`Cartões ${opacity}% · Desfoque ${blurAmount}px`}
        >
          <div className="grid grid-cols-1 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Opacidade do Fundo dos Cartões</p>
                <span className="text-[11px] text-zinc-400 font-mono">{opacity}%</span>
              </div>
              <input type="range" min={10} max={100} value={opacity} onChange={e => setOpacity(Number(e.target.value))} className="w-full accent-blue-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Desfoque do Fundo</p>
                <span className="text-[11px] text-zinc-400 font-mono">{blurAmount}px</span>
              </div>
              <input type="range" min={0} max={40} value={blurAmount} onChange={e => setBlurAmount(Number(e.target.value))} className="w-full accent-blue-500" />
            </div>
          </div>
        </CollapsibleSection>

        {/* Button style */}
        <CollapsibleSection
          title="Botões & Apps"
          subtitle={BUTTON_STYLES.find(b => b.id === buttonStyle)?.label || 'Estilo dos botões'}
          preview={<div className={`w-9 h-5 border-2 border-white/20 ${buttonStyle}`} style={{ backgroundColor: buttonColor || primaryColor }} />}
        >
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Estilo dos Botões</p>
            <div className="grid grid-cols-4 gap-2">
              {BUTTON_STYLES.map(b => (
                <button
                  key={b.id}
                  onClick={() => setButtonStyle(b.id)}
                  className={`p-2.5 border-2 transition-all ${b.id} ${buttonStyle === b.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/[0.02] hover:border-white/10'}`}
                >
                  <div className={`h-3 w-full bg-white/20 ${b.id} mb-1`} />
                  <p className="text-[8px] text-zinc-500 font-bold">{b.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-xs font-bold text-white -mb-1">🔘 Cores dos Botões &amp; Apps</p>
            <ColorField label="Cor dos Botões" value={buttonColor} onChange={setButtonColor} autoLabel="Usar Cor Principal" hint="Aplica-se aos botões de ação (salvar contato, catálogo, avaliações etc). Se não escolher, usa a Cor Principal." />
            <ColorField label="Cor dos Apps" value={appsColor} onChange={setAppsColor} hint="Aplica-se aos ícones de redes sociais (grade de aplicativos) do perfil." />
          </div>
        </CollapsibleSection>

        {/* Border radius + Link style */}
        <CollapsibleSection
          title="Arredondamento & Layout dos Links"
          subtitle={`${borderRadius}px · ${linkStyle === 'grid' ? 'Grade' : 'Lista'}`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Arredondamento</p>
              <span className="text-[11px] text-zinc-400 font-mono">{borderRadius}px</span>
            </div>
            <input type="range" min={0} max={40} value={borderRadius} onChange={e => setBorderRadius(Number(e.target.value))} className="w-full accent-blue-500" />
          </div>

          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Layout dos Links</p>
              <p className="text-[10px] text-zinc-600">Grade ou listagem vertical</p>
            </div>
            <div className="flex gap-0.5 bg-white/5 p-0.5 rounded-lg border border-white/5">
              <button onClick={() => setLinkStyle('grid')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${linkStyle === 'grid' ? 'bg-blue-600 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>Grade</button>
              <button onClick={() => setLinkStyle('list')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${linkStyle === 'list' ? 'bg-blue-600 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>Lista</button>
            </div>
          </div>
        </CollapsibleSection>

        {/* Salvar Contato (vCard) */}
        <CollapsibleSection
          title="Botão Salvar Contato"
          subtitle={vcardNome || vcardTelefone ? 'Personalizado' : 'Usando dados padrão do perfil'}
        >
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/[0.07] to-blue-500/[0.02] border border-blue-500/15 shadow-sm shadow-blue-500/5">
            <p className="text-xs font-bold text-white mb-0.5">📇 Dados do Cartão de Contato</p>
            <p className="text-[11px] text-zinc-500">
              Preencha aqui o que deve ir no arquivo .vcf gerado quando o visitante toca em "Salvar Contato".
              Campos deixados em branco usam automaticamente os dados já preenchidos no perfil (nome, telefone, e-mail etc).
            </p>
          </div>
          <FormField label="Nome completo">
            <input className={inputCls} value={vcardNome} onChange={e => setVcardNome(e.target.value)} placeholder={form.nome || form.nomeEmpresa || 'Nome que aparecerá no contato salvo'} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Empresa">
              <input className={inputCls} value={vcardEmpresa} onChange={e => setVcardEmpresa(e.target.value)} placeholder="Nome da empresa" />
            </FormField>
            <FormField label="Cargo">
              <input className={inputCls} value={vcardCargo} onChange={e => setVcardCargo(e.target.value)} placeholder="Cargo / função" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Telefone principal">
              <input className={inputCls} value={vcardTelefone} onChange={e => setVcardTelefone(e.target.value)} placeholder="(11) 99999-9999" />
            </FormField>
            <FormField label="Telefone secundário">
              <input className={inputCls} value={vcardTelefone2} onChange={e => setVcardTelefone2(e.target.value)} placeholder="Opcional" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="E-mail">
              <input type="email" className={inputCls} value={vcardEmail} onChange={e => setVcardEmail(e.target.value)} placeholder="contato@email.com" />
            </FormField>
            <FormField label="Site">
              <input className={inputCls} value={vcardSite} onChange={e => setVcardSite(e.target.value)} placeholder="https://" />
            </FormField>
          </div>
          <FormField label="Endereço">
            <input className={inputCls} value={vcardEndereco} onChange={e => setVcardEndereco(e.target.value)} placeholder="Endereço completo (opcional)" />
          </FormField>
          <FormField label="Observações">
            <textarea className={textareaCls} value={vcardObservacoes} onChange={e => setVcardObservacoes(e.target.value)} placeholder="Nota extra salva junto ao contato (opcional)" />
          </FormField>
        </CollapsibleSection>
      </div>
    );
    if (sid === 'social') return (
      <div className="space-y-3">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/[0.07] to-emerald-500/[0.02] border border-emerald-500/15 shadow-sm shadow-emerald-500/5">
          <p className="text-xs font-bold text-white mb-0.5">🔗 Redes Sociais</p>
          <p className="text-[11px] text-zinc-500">Cole o link ou username de cada rede.</p>
        </div>
        {SOCIAL_NETWORKS.map(s => (
          <FormField key={s.id} label={s.label}>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <BrandIcon name={s.id} className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={form[s.id] || ''}
                onChange={e => setField(s.id, e.target.value)}
                placeholder={`Link ou @ do ${s.label}`}
                className={`${inputCls} pl-9`}
              />
            </div>
          </FormField>
        ))}
        {cat === 'PET' && (
          <FormField label="WhatsApp Tutor">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <BrandIcon name="whatsapp" className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={form.whatsappTutor || ''}
                onChange={e => setField('whatsappTutor', e.target.value)}
                placeholder="5511999999999"
                className={`${inputCls} pl-9`}
              />
            </div>
          </FormField>
        )}

        {cat === 'BUSINESS' && (
          <div className="pt-2">
            <div className="p-3.5 rounded-2xl mb-3" style={{ background: 'linear-gradient(135deg, rgba(251,188,5,0.12), rgba(234,67,53,0.12))', border: '1px solid rgba(251,188,5,0.25)' }}>
              <p className="text-xs font-bold text-white mb-0.5">⭐ Avaliação Google</p>
              <p className="text-[11px] text-zinc-500">Cole o link direto do formulário de avaliação do Google (Google Meu Negócio). Aparece como um botão de destaque no perfil.</p>
            </div>
            <FormField label="Link de Avaliação Google">
              <input
                type="text"
                value={form.googleReview || ''}
                onChange={e => setField('googleReview', e.target.value)}
                placeholder="https://g.page/r/SEU-CODIGO/review"
                className={inputCls}
              />
            </FormField>
          </div>
        )}
      </div>
    );

    /* MIDIA */
    if (sid === 'midia') return (
      <div className="space-y-4">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/[0.07] to-amber-500/[0.02] border border-amber-500/15 shadow-sm shadow-amber-500/5">
          <p className="text-xs font-bold text-white mb-0.5">🖼 Galeria de Mídia</p>
          <p className="text-[11px] text-zinc-500">
            {cat === 'BUSINESS'
              ? 'Fotos e vídeos dos seus produtos/ambiente. No perfil de negócios este bloco aparece maior e você pode adicionar uma descrição para cada item.'
              : 'Fotos e vídeos exibidos no perfil.'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => openImageEditor('__galeria')}
            className="p-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/40 bg-white/[0.02] flex flex-col items-center gap-2 transition-all active:scale-95"
          >
            <ImageIcon className="h-6 w-6 text-zinc-600" />
            <span className="text-xs text-zinc-500 font-bold">+ Foto</span>
          </button>
          <button
            onClick={addVideoMedia}
            className="p-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/40 bg-white/[0.02] flex flex-col items-center gap-2 transition-all active:scale-95"
          >
            <span className="text-2xl">▶</span>
            <span className="text-xs text-zinc-500 font-bold">+ Vídeo URL</span>
          </button>
        </div>
        {mediaItems.length === 0 && (
          <div className="text-center py-8 text-zinc-700">
            <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Nenhuma mídia adicionada</p>
          </div>
        )}
        <div className="space-y-3">
          {mediaItems.map((m, i) => (
            <div key={m.id} className="flex gap-3 p-2.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="relative w-24 aspect-[4/3] rounded-xl overflow-hidden bg-zinc-900 shrink-0 group">
                {m.type === 'image' && <img src={m.url} className="w-full h-full object-cover" />}
                {m.type === 'video' && <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">▶ Vídeo</div>}
                <button
                  onClick={() => setMediaItems(prev => prev.filter(x => x.id !== m.id))}
                  aria-label="Remover foto"
                  className="absolute top-1 right-1 h-6 w-6 bg-black/70 rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-500/80 active:scale-90"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
                <div className="absolute bottom-1 left-1 text-[9px] text-white/40 font-bold">{i + 1}</div>
              </div>
              <input
                value={m.caption || ''}
                onChange={e => setMediaItems(prev => prev.map(x => x.id === m.id ? { ...x, caption: e.target.value } : x))}
                placeholder={cat === 'BUSINESS' ? 'Descrição do produto/serviço (opcional)' : 'Legenda (opcional)'}
                className={`${inputCls} flex-1 self-center`}
              />
            </div>
          ))}
        </div>

        {cat === 'BUSINESS' && (
          <div className="pt-5 mt-2 border-t border-white/5 space-y-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/[0.07] to-blue-500/[0.02] border border-blue-500/15 shadow-sm shadow-blue-500/5">
              <p className="text-xs font-bold text-white mb-0.5">🏢 Galeria — Sobre a Empresa</p>
              <p className="text-[11px] text-zinc-500">Fotos extras (ambiente, equipe, bastidores) exibidas em grade dentro do bloco "Sobre a Empresa", no perfil público.</p>
            </div>
            <button
              onClick={() => openImageEditor('__galeria2')}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/40 bg-white/[0.02] flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <ImageIcon className="h-5 w-5 text-zinc-600" />
              <span className="text-xs text-zinc-500 font-bold">+ Adicionar Foto</span>
            </button>
            {mediaItems2.length > 0 && (
              <div className="space-y-3">
                {mediaItems2.map(m => (
                  <div key={m.id} className="flex gap-3 p-2.5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-900 shrink-0 group">
                      <img src={m.url} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setMediaItems2(prev => prev.filter(x => x.id !== m.id))}
                        aria-label="Remover foto"
                        className="absolute top-1 right-1 h-6 w-6 bg-black/70 rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-500/80 active:scale-90"
                      >
                        <X className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                    <input
                      value={m.caption || ''}
                      onChange={e => setMediaItems2(prev => prev.map(x => x.id === m.id ? { ...x, caption: e.target.value } : x))}
                      placeholder="Legenda elegante (ex: Nossa equipe, Ambiente, Bastidores...)"
                      className={`${inputCls} flex-1 self-center`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );

    /* NOVIDADES (Destaques / Promoções / Notícias — só BUSINESS) */
    if (sid === 'novidades') return (
      <div className="space-y-8">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/[0.07] to-amber-500/[0.02] border border-amber-500/15 shadow-sm shadow-amber-500/5">
          <p className="text-xs font-bold text-white mb-0.5">✨ Destaques do Negócio</p>
          <p className="text-[11px] text-zinc-500">Cartões grandes e clicáveis, em carrossel, para chamar atenção para atrações, promoções e novidades. Aparecem no perfil público como blocos que você pode reordenar em "Organizar".</p>
        </div>

        {/* ATRAÇÕES / DESTAQUES */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <p className="text-xs font-bold text-white">Atrações / Destaques</p>
          </div>
          <p className="text-[11px] text-zinc-500 -mt-1">Ex.: novo espaço, serviço-carro-chefe, diferencial da empresa.</p>

          {atracoes.length === 0 && (
            <div className="text-center py-6 text-zinc-700">
              <Sparkles className="h-7 w-7 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Nenhum destaque adicionado</p>
            </div>
          )}

          <div className="space-y-3">
            {atracoes.map(a => (
              <div key={a.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => openImageEditor(`__atracaoImg__${a.id}`)}
                    className="relative shrink-0 w-20 aspect-[4/5] rounded-xl overflow-hidden bg-white/[0.03] border-2 border-dashed border-white/10 hover:border-blue-500/40 flex items-center justify-center transition-all active:scale-95"
                  >
                    {a.imagem ? <img src={a.imagem} className="w-full h-full object-cover" /> : <ImageIcon className="h-5 w-5 text-zinc-600" />}
                  </button>
                  <div className="flex-1 space-y-2">
                    <input value={a.titulo} onChange={e => updateAtracao(a.id, { titulo: e.target.value })} placeholder="Título (ex: Conheça nosso novo espaço)" className={inputCls} />
                    <input value={a.tag || ''} onChange={e => updateAtracao(a.id, { tag: e.target.value })} placeholder="Selo (opcional, ex: NOVO)" className={inputCls} />
                  </div>
                </div>
                <textarea value={a.subtitulo || ''} onChange={e => updateAtracao(a.id, { subtitulo: e.target.value })} placeholder="Descrição curta (opcional)" className={textareaCls} rows={2} />
                <div className="flex gap-2 items-center">
                  <input value={a.link || ''} onChange={e => updateAtracao(a.id, { link: e.target.value })} placeholder="Link ao clicar (opcional)" className={`${inputCls} flex-1`} />
                  <button onClick={() => removeAtracao(a.id)} className="shrink-0 p-3 text-zinc-600 hover:text-red-400 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addAtracao}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/40 bg-white/[0.02] text-sm font-bold text-zinc-500 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" /> Adicionar Destaque
          </button>
        </div>

        {/* PROMOÇÕES */}
        <div className="space-y-3 pt-6 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-amber-400" />
            <p className="text-xs font-bold text-white">Promoções</p>
          </div>
          <p className="text-[11px] text-zinc-500 -mt-1">Ofertas com preço De/Por e validade, ótimo para gerar conversão.</p>

          {promocoes.length === 0 && (
            <div className="text-center py-6 text-zinc-700">
              <Megaphone className="h-7 w-7 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Nenhuma promoção adicionada</p>
            </div>
          )}

          <div className="space-y-3">
            {promocoes.map(p => (
              <div key={p.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => openImageEditor(`__promocaoImg__${p.id}`)}
                    className="relative shrink-0 w-24 aspect-video rounded-xl overflow-hidden bg-white/[0.03] border-2 border-dashed border-white/10 hover:border-blue-500/40 flex items-center justify-center transition-all active:scale-95"
                  >
                    {p.imagem ? <img src={p.imagem} className="w-full h-full object-cover" /> : <ImageIcon className="h-5 w-5 text-zinc-600" />}
                  </button>
                  <div className="flex-1 space-y-2">
                    <input value={p.titulo} onChange={e => updatePromocao(p.id, { titulo: e.target.value })} placeholder="Título da oferta" className={inputCls} />
                    <input value={p.tag || ''} onChange={e => updatePromocao(p.id, { tag: e.target.value })} placeholder="Selo (opcional, ex: -20%)" className={inputCls} />
                  </div>
                </div>
                <textarea value={p.descricao || ''} onChange={e => updatePromocao(p.id, { descricao: e.target.value })} placeholder="Descrição da promoção (opcional)" className={textareaCls} rows={2} />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input value={p.precoDe || ''} onChange={e => updatePromocao(p.id, { precoDe: e.target.value })} placeholder="Preço De (opcional)" className={inputCls} />
                  <input value={p.precoPor || ''} onChange={e => updatePromocao(p.id, { precoPor: e.target.value })} placeholder="Preço Por" className={inputCls} />
                  <input value={p.validade || ''} onChange={e => updatePromocao(p.id, { validade: e.target.value })} placeholder="Válido até" className={inputCls} />
                </div>
                <div className="flex gap-2 items-center">
                  <input value={p.link || ''} onChange={e => updatePromocao(p.id, { link: e.target.value })} placeholder="Link ao clicar (opcional)" className={`${inputCls} flex-1`} />
                  <button onClick={() => removePromocao(p.id)} className="shrink-0 p-3 text-zinc-600 hover:text-red-400 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addPromocao}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/40 bg-white/[0.02] text-sm font-bold text-zinc-500 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <Megaphone className="h-4 w-4" /> Adicionar Promoção
          </button>
        </div>

        {/* NOTÍCIAS */}
        <div className="space-y-3 pt-6 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-amber-400" />
            <p className="text-xs font-bold text-white">Notícias / Novidades</p>
          </div>
          <p className="text-[11px] text-zinc-500 -mt-1">Atualizações da empresa: lançamentos, eventos, conquistas.</p>

          {noticias.length === 0 && (
            <div className="text-center py-6 text-zinc-700">
              <Newspaper className="h-7 w-7 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Nenhuma notícia adicionada</p>
            </div>
          )}

          <div className="space-y-3">
            {noticias.map(n => (
              <div key={n.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => openImageEditor(`__noticiaImg__${n.id}`)}
                    className="relative shrink-0 w-20 aspect-[4/3] rounded-xl overflow-hidden bg-white/[0.03] border-2 border-dashed border-white/10 hover:border-blue-500/40 flex items-center justify-center transition-all active:scale-95"
                  >
                    {n.imagem ? <img src={n.imagem} className="w-full h-full object-cover" /> : <ImageIcon className="h-5 w-5 text-zinc-600" />}
                  </button>
                  <div className="flex-1 space-y-2">
                    <input value={n.titulo} onChange={e => updateNoticia(n.id, { titulo: e.target.value })} placeholder="Título da notícia" className={inputCls} />
                    <input value={n.data || ''} onChange={e => updateNoticia(n.id, { data: e.target.value })} placeholder="Data (ex: Jul/2026)" className={inputCls} />
                  </div>
                </div>
                <textarea value={n.resumo || ''} onChange={e => updateNoticia(n.id, { resumo: e.target.value })} placeholder="Resumo (opcional)" className={textareaCls} rows={2} />
                <div className="flex gap-2 items-center">
                  <input value={n.link || ''} onChange={e => updateNoticia(n.id, { link: e.target.value })} placeholder="Link para ler mais (opcional)" className={`${inputCls} flex-1`} />
                  <button onClick={() => removeNoticia(n.id)} className="shrink-0 p-3 text-zinc-600 hover:text-red-400 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addNoticia}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/40 bg-white/[0.02] text-sm font-bold text-zinc-500 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <Newspaper className="h-4 w-4" /> Adicionar Notícia
          </button>
        </div>
      </div>
    );

    /* DEPOIMENTOS */
    if (sid === 'depoimentos') return (
      <div className="space-y-4">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/[0.07] to-amber-500/[0.02] border border-amber-500/15 shadow-sm shadow-amber-500/5">
          <p className="text-xs font-bold text-white mb-0.5">💬 O que dizem de nós</p>
          <p className="text-[11px] text-zinc-500">Adicione avaliações e depoimentos de clientes. Aparecem como cartões no perfil público.</p>
        </div>

        {depoimentos.length === 0 && (
          <div className="text-center py-8 text-zinc-700">
            <Quote className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Nenhum depoimento adicionado</p>
          </div>
        )}

        <div className="space-y-3">
          {depoimentos.map((t) => (
            <div key={t.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => updateDepoimento(t.id, { estrelas: n })}>
                      <Star className={`h-4 w-4 ${(t.estrelas || 0) >= n ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`} />
                    </button>
                  ))}
                </div>
                <button onClick={() => removeDepoimento(t.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={t.nome} onChange={e => updateDepoimento(t.id, { nome: e.target.value })} placeholder="Nome do cliente" className={inputCls} />
                <input value={t.cargo || ''} onChange={e => updateDepoimento(t.id, { cargo: e.target.value })} placeholder="Empresa / Cargo (opcional)" className={inputCls} />
              </div>
              <textarea value={t.texto} onChange={e => updateDepoimento(t.id, { texto: e.target.value })} placeholder="O que o cliente disse..." className={textareaCls} rows={2} />
            </div>
          ))}
        </div>

        <button
          onClick={addDepoimento}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/40 bg-white/[0.02] text-sm font-bold text-zinc-500 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <Quote className="h-4 w-4" /> Adicionar Depoimento
        </button>
      </div>
    );

    /* ORGANIZAR (grid arrastável, estilo Apple) */
    if (sid === 'organizar') return (
      <div className="space-y-3">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/[0.07] to-blue-500/[0.02] border border-blue-500/15 shadow-sm shadow-blue-500/5">
          <p className="text-xs font-bold text-white mb-0.5">🧩 Organize seu perfil</p>
          <p className="text-[11px] text-zinc-500">Arraste os blocos para reordenar e use o interruptor para mostrar ou ocultar cada seção. A foto, nome e bio ficam sempre no topo.</p>
        </div>

        {/* Posição / alinhamento do layout */}
        <div className="mb-2">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Posição do Conteúdo</p>
          <div className="grid grid-cols-2 gap-2">
            {LAYOUT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setLayout(opt.id)}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${layout === opt.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/8 bg-white/[0.02] hover:border-white/20'}`}
              >
                <p className="text-xs font-bold text-white">{opt.label}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-zinc-600 mt-2">Deixe o layout do jeito que preferir: cada visitante verá o perfil exatamente na posição escolhida.</p>
        </div>

        {blockOrder.map(id => {
          const def = BLOCK_DEFS.find(b => b.id === id);
          if (!def) return null;
          const isHidden = hiddenBlocks.includes(id);
          const Icon = def.icon;
          return (
            <div
              key={id}
              draggable
              onDragStart={e => e.dataTransfer.setData('blockId', id)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleBlockDrop(e.dataTransfer.getData('blockId'), id)}
              className={`flex items-center gap-3 p-4 rounded-2xl border cursor-grab active:cursor-grabbing transition-all ${isHidden ? 'bg-transparent border-white/5 opacity-40' : 'bg-white/5 border-white/8 hover:bg-white/10'}`}
            >
              <GripVertical className="h-4 w-4 text-zinc-700 shrink-0" />
              <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-zinc-400" />
              </div>
              <span className="text-sm font-bold text-white flex-1 min-w-0 truncate">{def.label}</span>
              <button onClick={() => toggleBlockHidden(id)} className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${isHidden ? 'bg-zinc-700' : 'bg-blue-500'}`}>
                <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${isHidden ? 'translate-x-1' : 'translate-x-6'}`} />
              </button>
            </div>
          );
        })}

        {/* Campos individuais — mostrar/ocultar cada informação preenchida, para qualquer categoria */}
        {(() => {
          const alwaysCore = new Set(['nome', 'nomeEmpresa', 'foto', 'capa', 'bio', 'cargo']);
          const individualFields = fields.filter(f => !alwaysCore.has(f.key) && form[f.key]);
          if (individualFields.length === 0) return null;
          return (
            <div className="mt-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Campos Individuais · {catLabel}</p>
              <p className="text-[11px] text-zinc-600 mb-2.5">Oculte campos específicos preenchidos sem precisar apagar o conteúdo — útil para manter dados privados guardados, mas fora do perfil público.</p>
              <div className="space-y-2">
                {individualFields.map(f => {
                  const isHidden = hiddenFields.includes(f.key);
                  return (
                    <div
                      key={f.key}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isHidden ? 'bg-transparent border-white/5 opacity-40' : 'bg-white/[0.03] border-white/8'}`}
                    >
                      <span className="text-xs font-bold text-white flex-1 min-w-0 truncate">{f.label}</span>
                      <button onClick={() => toggleFieldHidden(f.key)} className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 ${isHidden ? 'bg-zinc-700' : 'bg-blue-500'}`}>
                        <div className={`absolute top-1 h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${isHidden ? 'translate-x-1' : 'translate-x-5'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    );

    /* SOS */
    if (sid === 'sos') return (
      <div className="space-y-4">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-red-500/[0.07] to-red-500/[0.02] border border-red-500/20 shadow-sm shadow-red-500/5">
          <p className="text-xs font-bold text-white mb-0.5">🚨 Modo SOS · {catLabel}</p>
          <p className="text-[11px] text-zinc-500">Exibe banner de emergência no topo do perfil.</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Modo SOS</p>
              <p className="text-[10px] text-zinc-600">Ativar modo de emergência</p>
            </div>
            <Toggle value={sosMode} onChange={setSosMode} danger />
          </div>
          {sosMode && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-[11px] text-red-300 font-bold">⚠️ Modo SOS ativo — banner visível no perfil público</p>
            </div>
          )}
        </div>
        {SOS_FIELDS[cat] && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Campos de emergência</p>
            {SOS_FIELDS[cat].map(f => {
              const fieldData = fields.find(ff => ff.key === f.key);
              return (
                <FormField key={f.key} label={f.label}>
                  <input
                    type="text"
                    value={form[f.key] || ''}
                    onChange={e => setField(f.key, e.target.value)}
                    placeholder={fieldData?.placeholder || ''}
                    className={inputCls.replace('focus:ring-blue-500/40', 'focus:ring-red-500/40').replace('focus:border-blue-500/30', 'focus:border-red-500/30')}
                  />
                </FormField>
              );
            })}
          </div>
        )}
      </div>
    );

    /* PUBLICAR */
    if (sid === 'publicar') return (
      <div className="space-y-4">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/[0.07] to-emerald-500/[0.02] border border-emerald-500/15 shadow-sm shadow-emerald-500/5">
          <p className="text-xs font-bold text-white mb-0.5">🚀 Publicar Perfil</p>
          <p className="text-[11px] text-zinc-500">Configure visibilidade e publique.</p>
        </div>

        {/* Visibility */}
        <div className="space-y-2">
  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
    Visibilidade
  </p>

  {[
    { id: 'public', label: 'Público', desc: 'Qualquer pessoa pode acessar', icon: Globe },
    { id: 'private', label: 'Privado', desc: 'Somente você consegue ver', icon: Lock },
    { id: 'hidden', label: 'Oculto', desc: 'Não aparece em buscas', icon: EyeOff },
  ].map(v => (
    <button
      key={v.id}
      onClick={() => updateVisibility(product.id, v.id as any)}
      className={`w-full p-3.5 rounded-2xl border-2 text-left flex items-center gap-3 transition-all ${
        visibility === v.id
          ? 'border-blue-500 bg-blue-500/8'
          : 'border-white/5 bg-white/[0.02] hover:border-white/10'
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          visibility === v.id ? 'bg-blue-500/20' : 'bg-white/5'
        }`}
      >
        <v.icon
          className={`h-4 w-4 ${
            visibility === v.id ? 'text-blue-400' : 'text-zinc-600'
          }`}
        />
      </div>

      <div className="flex-1">
        <p className="text-xs font-bold text-white">{v.label}</p>
        <p className="text-[10px] text-zinc-600">{v.desc}</p>
      </div>

      {visibility === v.id && (
        <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
      )}
    </button>
  ))}
</div>
        {/* URL */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">URL Pública</p>
          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/5">
            <Globe className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
            <span className="text-xs text-blue-400 font-mono flex-1 truncate">airnext.com/u/{product.slug || '...'}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/u/${product.slug}`); toast.show('Link copiado!', 'success'); }}
              className="text-[10px] text-zinc-500 hover:text-white transition-colors font-bold shrink-0"
            >Copiar</button>
          </div>
        </div>

        {/* QR Code */}
        {product.slug && (
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
            <div className="bg-white p-2.5 rounded-xl shrink-0">
              <QRCodeSVG value={`${window.location.origin}/u/${product.slug}?via=qr`} size={80} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">QR Code</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">Compartilhe ou imprima</p>
              <button
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/u/${product.slug}`); toast.show('Link copiado!', 'success'); }}
                className="mt-2 flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 font-bold transition-colors"
              >
                <Download className="h-3 w-3" /> Copiar Link
              </button>
            </div>
          </div>
        )}

        {/* Save CTA */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 text-white py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
        >
          {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : <><Save className="h-4 w-4" /> Salvar &amp; Publicar</>}
        </button>
      </div>
    );

    return null;
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-surface overflow-hidden">
      {/* Image Editor */}
      {imageEditorOpen && (
        <ImageUploadEditor
          initialImage={imageEditorKey === '__wallpaperImage' ? (wallpaper.startsWith('http') || wallpaper.startsWith('data:') ? wallpaper : '') : (['__galeria', '__galeria2', '__pixQr', '__wifiQr'].includes(imageEditorKey) || imageEditorKey.startsWith('__atracaoImg__') || imageEditorKey.startsWith('__promocaoImg__') || imageEditorKey.startsWith('__noticiaImg__') ? '' : form[imageEditorKey] || '')}
          onUploaded={handleImageSave}
          onCancel={() => setImageEditorOpen(false)}
          aspect={getImageEditorConfig(imageEditorKey).aspect}
          title={getImageEditorConfig(imageEditorKey).title}
          helperText={getImageEditorConfig(imageEditorKey).helperText}
        />
      )}

      {/* ── MOBILE HEADER ── */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-surface/95 backdrop-blur-xl sticky top-0 z-40 shrink-0">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-1 rounded-full hover:bg-white/5 text-zinc-500 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-full border border-white/5">
          <button onClick={() => setMobileMode('edit')} className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${mobileMode === 'edit' ? 'bg-white/15 text-white' : 'text-zinc-600'}`}>Editar</button>
          <button onClick={() => setMobileMode('preview')} className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${mobileMode === 'preview' ? 'bg-white/15 text-white' : 'text-zinc-600'}`}>Preview</button>
        </div>
        <div className="flex items-center gap-1">
          {saveState === 'saved' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          {saveState === 'saving' && <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />}
          <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all">
            <Save className="h-3 w-3" />
          </button>
        </div>
      </header>

      {/* ── EDITOR PANEL ── */}
      <aside className={`${mobileMode === 'preview' ? 'hidden' : 'flex'} lg:flex flex-1 lg:flex-none w-full lg:w-[460px] xl:w-[500px] flex-col border-r border-white/5 overflow-hidden min-h-0`}>
        {/* Desktop header */}
        <div className="hidden lg:flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full hover:bg-white/8 text-zinc-500 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Estúdio de Perfil</h1>
              <p className="text-[10.5px] text-zinc-600">{catLabel} · Preview ao vivo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saveState === 'saved' && <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Salvo</span>}
            {saveState === 'saving' && <span className="text-xs text-blue-400 font-semibold flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando</span>}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-blue-600/25"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative flex items-center gap-1.5"><Save className="h-3.5 w-3.5" /> Salvar</span>
            </button>
          </div>
        </div>

        {/* Step wizard nav */}
        <div className="px-4 py-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            {activeSteps.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === i;
              const isDone = step > i;
              return (
                <button
                  key={s.id}
                  onClick={() => setStep(i)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                    isActive ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-600/25 scale-[1.03]' :
                    isDone ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15' :
                    'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-32 hide-scrollbar space-y-4">
          {renderStep()}
        </div>

        {/* Nav footer */}
        <div className="shrink-0 px-4 py-3 border-t border-white/5 bg-surface/90 backdrop-blur flex items-center justify-between gap-3">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/8 text-xs font-bold text-zinc-500 hover:text-white hover:border-white/20 hover:bg-white/5 disabled:opacity-25 transition-all"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Anterior
          </button>
          <div className="flex gap-1">
            {activeSteps.map((_, i) => (
              <div
                key={i}
                onClick={() => setStep(i)}
                className="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
                style={{ width: step === i ? 20 : 6, backgroundColor: step === i ? '#3b82f6' : 'rgba(255,255,255,0.15)' }}
              />
            ))}
          </div>
          {isLastStep
            ? <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-xs font-bold text-white disabled:opacity-50 transition-all active:scale-95 shadow-md shadow-blue-600/20">
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Publicar
              </button>
            : <button onClick={() => setStep(s => Math.min(activeSteps.length - 1, s + 1))} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-xs font-bold text-white transition-all">
                Próximo <ChevronRight className="h-3.5 w-3.5" />
              </button>
          }
        </div>
      </aside>

      {/* ── PREVIEW PANEL ── */}
      <div className={`${mobileMode === 'edit' ? 'hidden' : 'flex'} lg:flex flex-1 items-center justify-center bg-zinc-950 p-4 sm:p-8 overflow-y-auto min-h-0 relative`}>
        {/* Ambient glow */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-56 h-56 rounded-full bg-violet-600/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center gap-5 z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/8 backdrop-blur">
            <Smartphone className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-[11px] text-zinc-500 font-semibold">Preview ao vivo</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Phone frame */}
          <div className="bg-[#0a0a0a] rounded-[3rem] border-[12px] border-[#1c1c1e] shadow-2xl shadow-black/70 overflow-hidden w-[280px] h-[580px] relative ring-1 ring-white/10">
            {/* Glass reflection */}
            <div className="absolute inset-0 z-40 pointer-events-none rounded-[2.2rem] bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
            {/* Notch */}
            <div className="absolute top-0 inset-x-0 h-9 z-50 flex justify-center pt-2.5">
              <div className="w-28 h-6 bg-black rounded-full" />
            </div>
            <div className="h-full overflow-y-auto hide-scrollbar pt-9">
              <PhonePreview
                form={form}
                theme={theme}
                mediaItems={mediaItems}
                mediaItems2={mediaItems2}
                depoimentos={depoimentos}
                atracoes={atracoes}
                promocoes={promocoes}
                noticias={noticias}
                wifiSsid={wifiSsid}
                pixQrImage={pixQrImage}
                blockOrder={blockOrder}
                hiddenBlocks={hiddenBlocks}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                borderRadius={borderRadius}
                buttonStyle={buttonStyle}
                wallpaper={wallpaper}
                nameColor={nameColor}
                bioColor={bioColor}
                buttonColor={buttonColor}
                appsColor={appsColor}
                fontFamily={fontFamily}
                linkStyle={linkStyle}
                verified={verified}
                sosMode={sosMode}
                cat={cat}
              />
            </div>
            {/* Home bar */}
            <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
              <div className="w-28 h-1 bg-white/20 rounded-full" />
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <button
              onClick={() => product.slug && window.open(`/u/${product.slug}`, '_blank')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/8 text-xs text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <Eye className="h-3.5 w-3.5" /> Ver público
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/u/${product.slug}`); toast.show('Link copiado!', 'success'); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/8 text-xs text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <Share2 className="h-3.5 w-3.5" /> Compartilhar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}