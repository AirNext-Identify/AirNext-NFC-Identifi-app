import {
  Scissors, Sparkles, Stethoscope, Smile, Brain, Utensils, Wrench, Glasses, Store,
  Dumbbell, Home, Scale, Briefcase, BedDouble, PawPrint, LayoutGrid,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Segmentos (ramos de atividade) da categoria BUSINESS.
 *
 * ONDE É SALVO: dentro de `products.profile_data` (JSONB) nas chaves
 * `__segment` (id abaixo) e `__segmentOutro` (texto livre quando id = 'outro').
 * Não há migração de banco: profile_data já é gravado por inteiro em
 * AuthContext.setupProfile / updateProfile e lido por publicApi.getPublicProfile.
 * Perfis antigos não têm `__segment` e continuam com a apresentação padrão.
 *
 * COMO EXPANDIR: para um novo ramo, adicione um item em SEGMENTS apontando para
 * um `preset` existente. Para um novo jeito de apresentar, crie um preset em
 * PRESETS. Nada além deste arquivo precisa mudar.
 *
 * REGRA: os presets só renomeiam e reorganizam recursos que JÁ existem (blocos,
 * link de catálogo, link de agendamento) e pedem campos de texto simples.
 * Nenhum preset cria funcionalidade nova.
 */

export type SegmentGroupId = 'beleza' | 'saude' | 'alimentacao' | 'comercio' | 'profissional' | 'turismo' | 'outros';

export const SEGMENT_GROUPS: { id: SegmentGroupId; label: string }[] = [
  { id: 'beleza', label: 'Beleza e bem-estar' },
  { id: 'saude', label: 'Saúde' },
  { id: 'alimentacao', label: 'Alimentação' },
  { id: 'comercio', label: 'Comércio e serviços' },
  { id: 'profissional', label: 'Serviços profissionais' },
  { id: 'turismo', label: 'Turismo e hospedagem' },
  { id: 'outros', label: 'Outros' },
];

export interface SegmentField {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'textarea';
}

/** Textos e organização que mudam de um ramo para outro. */
export interface SegmentPreset {
  /** Título do carrossel de "Destaques" (bloco `atracoes`). */
  highlightsTitle: string;
  /** Título do carrossel de promoções (bloco `promocoes`). */
  promotionsTitle: string;
  /** Botão do link de catálogo (campo `catalogo`). */
  catalogTitle: string;
  catalogSubtitle: string;
  /** Rótulo do campo de edição do link de catálogo. */
  catalogFieldLabel: string;
  /** Botão e rótulo do link de agendamento (campo `linkAgendamento`). */
  bookingCta: string;
  bookingFieldLabel: string;
  /** Título do bloco de campos específicos do ramo. */
  detailsTitle: string;
  /** Blocos que sobem para o topo quando o perfil não tem ordem própria. */
  blockPriority: string[];
  /** Campos extras (texto simples) mostrados só neste ramo. */
  fields: SegmentField[];
}

const BASE_PRIORITY = ['midia', 'businessStats'];

const PRESETS = {
  default: {
    highlightsTitle: 'Destaques',
    promotionsTitle: 'Promoções',
    catalogTitle: 'Ver Catálogo',
    catalogSubtitle: 'Produtos e serviços',
    catalogFieldLabel: 'Link do Catálogo',
    bookingCta: 'Agendar / Reservar',
    bookingFieldLabel: 'Link de Agendamento / Reserva',
    detailsTitle: 'Sobre o negócio',
    blockPriority: [],
    fields: [],
  },
  beleza: {
    highlightsTitle: 'Serviços em destaque',
    promotionsTitle: 'Promoções e pacotes',
    catalogTitle: 'Ver serviços e preços',
    catalogSubtitle: 'Tabela de serviços',
    catalogFieldLabel: 'Link da tabela de serviços e preços',
    bookingCta: 'Agendar horário',
    bookingFieldLabel: 'Link de agendamento de horário',
    detailsTitle: 'Nossa equipe',
    blockPriority: [...BASE_PRIORITY, 'atracoes', 'horarios', 'promocoes', 'catalogo', 'depoimentos'],
    fields: [
      { key: 'profissionais', label: 'Profissionais da equipe', type: 'textarea', placeholder: 'Ex: Ana (colorista), João (barbeiro)' },
    ],
  },
  saude: {
    highlightsTitle: 'Especialidades e serviços',
    promotionsTitle: 'Campanhas',
    catalogTitle: 'Ver serviços e exames',
    catalogSubtitle: 'Especialidades e procedimentos',
    catalogFieldLabel: 'Link de serviços e procedimentos',
    bookingCta: 'Agendar consulta',
    bookingFieldLabel: 'Link de agendamento de consulta',
    detailsTitle: 'Atendimento',
    blockPriority: [...BASE_PRIORITY, 'atracoes', 'horarios', 'depoimentos', 'sobreEmpresa'],
    fields: [
      { key: 'registroProfissional', label: 'Registro profissional', placeholder: 'Ex: CRM 12345/SP · CRO · CRP' },
      { key: 'profissionais', label: 'Corpo clínico / profissionais', type: 'textarea', placeholder: 'Nome e especialidade de cada profissional' },
      { key: 'convenios', label: 'Convênios e planos aceitos', type: 'textarea', placeholder: 'Ex: Unimed, Bradesco Saúde, particular' },
    ],
  },
  gastro: {
    highlightsTitle: 'Destaques do cardápio',
    promotionsTitle: 'Promoções do dia',
    catalogTitle: 'Ver cardápio',
    catalogSubtitle: 'Pratos e bebidas',
    catalogFieldLabel: 'Link do cardápio',
    bookingCta: 'Reservar mesa',
    bookingFieldLabel: 'Link de reserva de mesa',
    detailsTitle: 'Sobre o lugar',
    blockPriority: [...BASE_PRIORITY, 'atracoes', 'catalogo', 'horarios', 'promocoes', 'contato', 'wifi'],
    fields: [
      { key: 'culinaria', label: 'Tipo de culinária', placeholder: 'Ex: Italiana, cafés especiais, hambúrguer artesanal' },
      { key: 'modalidadesAtendimento', label: 'Como atendemos', placeholder: 'Ex: Salão, retirada, delivery' },
    ],
  },
  auto: {
    highlightsTitle: 'Serviços em destaque',
    promotionsTitle: 'Promoções',
    catalogTitle: 'Ver serviços',
    catalogSubtitle: 'Lista de serviços',
    catalogFieldLabel: 'Link da lista de serviços',
    bookingCta: 'Agendar serviço',
    bookingFieldLabel: 'Link de agendamento de serviço',
    detailsTitle: 'Especialidades',
    blockPriority: [...BASE_PRIORITY, 'atracoes', 'horarios', 'contato', 'depoimentos', 'promocoes'],
    fields: [
      { key: 'marcasAtendidas', label: 'Marcas e veículos atendidos', type: 'textarea', placeholder: 'Ex: Fiat, VW, Chevrolet, híbridos' },
    ],
  },
  varejo: {
    highlightsTitle: 'Produtos em destaque',
    promotionsTitle: 'Ofertas',
    catalogTitle: 'Ver produtos',
    catalogSubtitle: 'Catálogo completo',
    catalogFieldLabel: 'Link do catálogo de produtos',
    bookingCta: 'Agendar atendimento',
    bookingFieldLabel: 'Link de agendamento de atendimento',
    detailsTitle: 'Sobre a loja',
    blockPriority: [...BASE_PRIORITY, 'atracoes', 'promocoes', 'catalogo', 'horarios', 'contato'],
    fields: [
      { key: 'marcas', label: 'Marcas que trabalhamos', type: 'textarea', placeholder: 'Ex: Ray-Ban, Oakley, Nike' },
    ],
  },
  fitness: {
    highlightsTitle: 'Modalidades e treinos',
    promotionsTitle: 'Planos e promoções',
    catalogTitle: 'Ver planos',
    catalogSubtitle: 'Modalidades e valores',
    catalogFieldLabel: 'Link de planos e valores',
    bookingCta: 'Agendar aula experimental',
    bookingFieldLabel: 'Link de agendamento de aula',
    detailsTitle: 'Treinos',
    blockPriority: [...BASE_PRIORITY, 'atracoes', 'horarios', 'promocoes', 'depoimentos'],
    fields: [
      { key: 'registroProfissional', label: 'Registro profissional', placeholder: 'Ex: CREF 123456-G/SP' },
      { key: 'modalidades', label: 'Modalidades', type: 'textarea', placeholder: 'Ex: Musculação, funcional, pilates' },
    ],
  },
  imobiliario: {
    highlightsTitle: 'Imóveis em destaque',
    promotionsTitle: 'Oportunidades',
    catalogTitle: 'Ver imóveis',
    catalogSubtitle: 'Portfólio completo',
    catalogFieldLabel: 'Link do portfólio de imóveis',
    bookingCta: 'Agendar visita',
    bookingFieldLabel: 'Link de agendamento de visita',
    detailsTitle: 'Registro e atuação',
    blockPriority: [...BASE_PRIORITY, 'atracoes', 'catalogo', 'contato', 'depoimentos'],
    fields: [
      { key: 'creci', label: 'CRECI', placeholder: 'Ex: CRECI 12345-J' },
    ],
  },
  juridico: {
    highlightsTitle: 'Áreas de atuação',
    promotionsTitle: 'Novidades',
    catalogTitle: 'Ver áreas e serviços',
    catalogSubtitle: 'Como podemos ajudar',
    catalogFieldLabel: 'Link de áreas e serviços',
    bookingCta: 'Agendar consulta',
    bookingFieldLabel: 'Link de agendamento de consulta',
    detailsTitle: 'Registro profissional',
    blockPriority: [...BASE_PRIORITY, 'sobreEmpresa', 'atracoes', 'depoimentos', 'contato'],
    fields: [
      { key: 'oab', label: 'OAB', placeholder: 'Ex: OAB/SP 123.456' },
    ],
  },
  consultoria: {
    highlightsTitle: 'Serviços em destaque',
    promotionsTitle: 'Condições especiais',
    catalogTitle: 'Ver serviços',
    catalogSubtitle: 'Portfólio e soluções',
    catalogFieldLabel: 'Link de portfólio / serviços',
    bookingCta: 'Agendar conversa',
    bookingFieldLabel: 'Link de agendamento de conversa',
    detailsTitle: 'Sobre o trabalho',
    blockPriority: [...BASE_PRIORITY, 'sobreEmpresa', 'atracoes', 'depoimentos', 'contato'],
    fields: [],
  },
  hospedagem: {
    highlightsTitle: 'Acomodações e diferenciais',
    promotionsTitle: 'Pacotes e ofertas',
    catalogTitle: 'Ver acomodações',
    catalogSubtitle: 'Quartos e comodidades',
    catalogFieldLabel: 'Link das acomodações',
    bookingCta: 'Reservar hospedagem',
    bookingFieldLabel: 'Link de reserva de hospedagem',
    detailsTitle: 'Informações da hospedagem',
    blockPriority: [...BASE_PRIORITY, 'atracoes', 'catalogo', 'horarios', 'wifi', 'depoimentos'],
    fields: [
      { key: 'checkIn', label: 'Check-in', placeholder: 'Ex: a partir das 14h' },
      { key: 'checkOut', label: 'Check-out', placeholder: 'Ex: até as 12h' },
      { key: 'comodidades', label: 'Comodidades', type: 'textarea', placeholder: 'Ex: café da manhã, piscina, estacionamento' },
    ],
  },
  pet: {
    highlightsTitle: 'Serviços em destaque',
    promotionsTitle: 'Promoções',
    catalogTitle: 'Ver serviços e produtos',
    catalogSubtitle: 'Banho, tosa, consultas e mais',
    catalogFieldLabel: 'Link de serviços e produtos',
    bookingCta: 'Agendar atendimento',
    bookingFieldLabel: 'Link de agendamento (banho, tosa, consulta)',
    detailsTitle: 'Atendimento',
    blockPriority: [...BASE_PRIORITY, 'atracoes', 'horarios', 'promocoes', 'contato', 'depoimentos'],
    fields: [
      { key: 'crmv', label: 'CRMV (se houver veterinário responsável)', placeholder: 'Ex: CRMV-SP 12345' },
    ],
  },
} satisfies Record<string, SegmentPreset>;

export type PresetId = keyof typeof PRESETS;

export interface BusinessSegment {
  id: string;
  label: string;
  group: SegmentGroupId;
  icon: LucideIcon;
  preset: PresetId;
  /** Termos extras para a busca (sem acento, minúsculos). */
  keywords: string[];
}

export const SEGMENTS: BusinessSegment[] = [
  { id: 'salao', label: 'Salão de beleza', group: 'beleza', icon: Scissors, preset: 'beleza', keywords: ['cabelo', 'cabeleireiro', 'manicure', 'unha'] },
  { id: 'barbearia', label: 'Barbearia', group: 'beleza', icon: Scissors, preset: 'beleza', keywords: ['barba', 'corte masculino'] },
  { id: 'estetica', label: 'Estética', group: 'beleza', icon: Sparkles, preset: 'beleza', keywords: ['spa', 'depilacao', 'massagem', 'limpeza de pele'] },
  { id: 'clinica-medica', label: 'Clínica médica', group: 'saude', icon: Stethoscope, preset: 'saude', keywords: ['medico', 'consultorio', 'exames'] },
  { id: 'clinica-odonto', label: 'Clínica odontológica', group: 'saude', icon: Smile, preset: 'saude', keywords: ['dentista', 'odontologia', 'ortodontia'] },
  { id: 'psicologia', label: 'Psicologia e terapia', group: 'saude', icon: Brain, preset: 'saude', keywords: ['psicologo', 'terapeuta', 'psicanalise'] },
  { id: 'restaurante', label: 'Restaurante e cafeteria', group: 'alimentacao', icon: Utensils, preset: 'gastro', keywords: ['cafe', 'padaria', 'lanchonete', 'bar', 'pizzaria'] },
  { id: 'oficina', label: 'Oficina mecânica', group: 'comercio', icon: Wrench, preset: 'auto', keywords: ['carro', 'mecanico', 'auto', 'funilaria', 'moto'] },
  { id: 'otica', label: 'Ótica', group: 'comercio', icon: Glasses, preset: 'varejo', keywords: ['oculos', 'lentes'] },
  { id: 'loja', label: 'Loja e comércio', group: 'comercio', icon: Store, preset: 'varejo', keywords: ['varejo', 'boutique', 'comercio', 'moda'] },
  { id: 'petshop', label: 'Pet shop e veterinária', group: 'comercio', icon: PawPrint, preset: 'pet', keywords: ['petshop', 'veterinario', 'banho e tosa', 'animais'] },
  { id: 'academia', label: 'Academia e personal trainer', group: 'comercio', icon: Dumbbell, preset: 'fitness', keywords: ['treino', 'musculacao', 'crossfit', 'pilates', 'personal'] },
  { id: 'imobiliaria', label: 'Imobiliária', group: 'profissional', icon: Home, preset: 'imobiliario', keywords: ['imoveis', 'corretor', 'aluguel', 'venda'] },
  { id: 'advocacia', label: 'Advocacia', group: 'profissional', icon: Scale, preset: 'juridico', keywords: ['advogado', 'escritorio', 'juridico', 'direito'] },
  { id: 'consultoria', label: 'Consultoria e serviços profissionais', group: 'profissional', icon: Briefcase, preset: 'consultoria', keywords: ['contabilidade', 'marketing', 'coach', 'engenharia', 'arquitetura'] },
  { id: 'hotel', label: 'Hotel e hospedagem', group: 'turismo', icon: BedDouble, preset: 'hospedagem', keywords: ['pousada', 'hostel', 'resort', 'airbnb'] },
  // "Outro" fica sempre por último e usa o texto livre `__segmentOutro`.
  { id: 'outro', label: 'Outro segmento', group: 'outros', icon: LayoutGrid, preset: 'default', keywords: ['outro', 'outros', 'diferente'] },
];

export const OTHER_SEGMENT_ID = 'outro';

const BY_ID: Record<string, BusinessSegment> = Object.fromEntries(SEGMENTS.map((s) => [s.id, s]));

/** Retorna o segmento pelo id salvo, ou undefined (perfis antigos / id desconhecido). */
export function getSegment(id: unknown): BusinessSegment | undefined {
  return typeof id === 'string' ? BY_ID[id] : undefined;
}

/** Textos adaptados ao ramo; sem segmento (ou 'outro') devolve o padrão atual. */
export function getSegmentPreset(segment?: BusinessSegment): SegmentPreset {
  return PRESETS[segment?.preset ?? 'default'];
}

/** Nome para exibir: o ramo escolhido ou, em 'outro', o texto digitado (vazio = nada). */
export function getSegmentDisplayName(segment: BusinessSegment | undefined, otherText?: unknown): string {
  if (!segment) return '';
  if (segment.id === OTHER_SEGMENT_ID) return typeof otherText === 'string' ? otherText.trim() : '';
  return segment.label;
}

/**
 * Coloca no topo os blocos prioritários do ramo, mantendo a ordem relativa do resto.
 * Só reordena ids que existem em `currentOrder`; nunca cria nem remove blocos.
 */
export function suggestBlockOrder(segment: BusinessSegment | undefined, currentOrder: string[]): string[] {
  const priority = getSegmentPreset(segment).blockPriority.filter((id) => currentOrder.includes(id));
  return [...priority, ...currentOrder.filter((id) => !priority.includes(id))];
}

/** Agrupa os segmentos filtrando por texto (ignora acento e caixa). */
export function searchSegments(query: string): BusinessSegment[] {
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const q = norm(query);
  if (!q) return SEGMENTS;
  return SEGMENTS.filter((s) => norm(s.label).includes(q) || s.keywords.some((k) => norm(k).includes(q)));
}
