export interface ProductStats {
  views: number;
  nfcTaps: number;
  qrScans: number;
  shares: number;
}

export interface ProfileData {
  nome?: string;
  nomeEmpresa?: string;
  bio?: string;
  descricao?: string;
  cargo?: string;
  foto?: string;
  capa?: string;
  telefone?: string;
  email?: string;
  site?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  tiktok?: string;
  snapchat?: string;
  youtube?: string;
  telegram?: string;
  spotify?: string;
  playlist?: string;
  discord?: string;
  pinterest?: string;
  threads?: string;
  github?: string;
  googlemaps?: string;
  slack?: string;
  skype?: string;
  signal?: string;
  whatsappTutor?: string;
  chavePix?: string;
  contatoEmergencia?: string;
  veterinario?: string;
  vacinas?: string;
  alergias?: string;
  medicamentos?: string;
  linkAgendamento?: string;
  ultimoLocalVisto?: string;
  caracteristicasMarcantes?: string;
  contatoAlternativo?: string;
  valorRecompensa?: string;
  raca?: string;
  tipoSanguineo?: string;
  planoSaude?: string;
  medicoResponsavel?: string;
  medicacoes?: string;
  responsavel1?: string;
  responsavel2?: string;
  responsavel?: string;
  escola?: string;
  preferenciaComunicacao?: string;
  sensibilidades?: string;
  comoAjudar?: string;
  grauSuporte?: string;
  tipoTEA?: string;
  nivelComunicacao?: string;
  gatilhos?: string;
  estrategiasAcalmar?: string;
  comorbidades?: string;
  riscoFuga?: string;
  terapias?: string;
  cid?: string;
  localHabitual?: string;
  itemConforto?: string;
  telefoneResp1?: string;
  telefoneResp2?: string;
  telefoneEmerg1?: string;
  telefoneEmerg2?: string;
  telefoneResponsavel?: string;
  telefoneEmergencia?: string;
  catalogo?: string;
  endereco?: string;
  dataFundacao?: string;
  depoimentos?: { id: string; nome: string; cargo?: string; texto: string; estrelas?: number }[];
  __hiddenFields?: string[];
  __blockOrder?: string[];
  __hiddenBlocks?: string[];
  __primaryColor?: string;
  __secondaryColor?: string;
  __borderRadius?: number;
  __opacity?: number;
  __blurAmount?: number;
  __buttonStyle?: string;
  __buttonColor?: string;
  __appsColor?: string;
  __wallpaper?: string;
  __linkStyle?: string;
  __verified?: boolean;
  __sosMode?: boolean;
  /** @deprecated use __nameColor / __bioColor / __mainTextColor */
  __textColor?: string;
  __nameColor?: string;
  __bioColor?: string;
  __mainTextColor?: string;
  /** Cor dos títulos/labels de seção (ex.: "Telefone", "Redes & Contato"), independente da cor dos valores. */
  __labelColor?: string;
  /** Campos dedicados usados pelo botão "Salvar Contato" (vCard). Se vazios, cai nos campos padrão do perfil. */
  __vcard?: {
    nome?: string;
    empresa?: string;
    cargo?: string;
    telefone?: string;
    telefone2?: string;
    email?: string;
    site?: string;
    endereco?: string;
    observacoes?: string;
  };
  __layout?: 'center' | 'left' | 'right' | 'split';
  __fontFamily?: string;
  __wifiSsid?: string;
  __wifiPassword?: string;
  __wifiQrImage?: string;
  __pixQrImage?: string;
  __horarios?: { day: number; open: string; close: string; closed: boolean }[];
  /** Quando true, ignora os horários por dia e mostra sempre "Aberto agora" (24h/7 dias). */
  __horariosAlwaysOpen?: boolean;
  /** 'tabela' mostra a lista completa dos 7 dias; 'descricao' mostra apenas um texto livre. */
  __horariosDisplayMode?: 'tabela' | 'descricao';
  __horariosDescricao?: string;
  __formasPagamento?: string[];
  mediaCarousel2?: { id: string; type: 'image' | 'video'; url: string; caption?: string }[];
  /** Cartões grandes e clicáveis de destaques/atrações do negócio (ex.: um novo espaço, serviço-carro-chefe, diferencial). */
  atracoes?: { id: string; titulo: string; subtitulo?: string; imagem?: string; link?: string; tag?: string }[];
  /** Carrossel de promoções/ofertas com preço De/Por e validade. */
  promocoes?: { id: string; titulo: string; descricao?: string; imagem?: string; precoDe?: string; precoPor?: string; validade?: string; link?: string; tag?: string }[];
  /** Carrossel de notícias/novidades da empresa. */
  noticias?: { id: string; titulo: string; resumo?: string; imagem?: string; data?: string; link?: string }[];
  [key: string]: any;
}

export interface Product {
  id: string;
  activationCode?: string;
  status?: 'NAO_PROGRAMADO' | 'DISPONIVEL' | 'ATIVO' | 'EXPIRADO' | 'BLOQUEADO' | 'CANCELADO';
  ownerId?: string | null;
  category?: string | null;
  activatedAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  productType?: string;
  slug?: string;
  profileData?: ProfileData;
  theme?: string;
  stats?: ProductStats;
  visibility?: 'public' | 'private' | 'hidden';
  loteName?: string;
  mediaCarousel?: { id: string; type: 'image' | 'video'; url: string; caption?: string }[];
  mediaCarousel2?: { id: string; type: 'image' | 'video'; url: string; caption?: string }[];
}
