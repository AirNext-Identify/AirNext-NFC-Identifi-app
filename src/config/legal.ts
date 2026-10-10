/**
 * Configuração legal editável da AirNext.
 * Não inventar CNPJ/endereço: preencher quando houver dados oficiais.
 */
export const LEGAL_CONFIG = {
  companyName: 'AirNext',
  legalName: 'AirNext Tecnologia LTDA',
  /** Preencher quando disponível — deixar vazio para não exibir */
  cnpj: '',
  address: '',
  privacyEmail: 'airnext.oficial@gmail.com',
  supportEmail: 'airnext.oficial@gmail.com',
  dataControllerName: 'Pedro Veloso',
  tagline: 'Conectando o físico ao digital.',
  privacyHeadline: 'Privacidade, do seu jeito.',
  privacySubheadline:
    'Na AirNext, você escolhe o que compartilhar, com quem compartilhar e como suas informações são utilizadas.',
  termsHeadline: 'Feito para conectar. Criado para ser simples.',
  termsSubheadline:
    'Regras claras para que você use a AirNext com confiança — perfis, produtos e conexões sob o seu controle.',
  cookiesHeadline: 'Cookies, com transparência.',
  cookiesSubheadline:
    'Usamos tecnologias essenciais e, com o seu consentimento, recursos que melhoram a experiência.',
} as const;

/** Versões atuais dos documentos — ao publicar nova versão, incrementa e solicita novo aceite. */
export const DOCUMENT_VERSIONS = {
  privacy_policy: '1.0',
  terms_of_use: '1.0',
  cookies_policy: '1.0',
} as const;

export type DocumentType = keyof typeof DOCUMENT_VERSIONS;

export const DOCUMENT_META: Record<
  DocumentType,
  { title: string; path: string; lastUpdated: string }
> = {
  privacy_policy: {
    title: 'Política de Privacidade',
    path: '/politica-de-privacidade',
    lastUpdated: '27/07/2026',
  },
  terms_of_use: {
    title: 'Termos de Uso',
    path: '/termos-de-uso',
    lastUpdated: '27/07/2026',
  },
  cookies_policy: {
    title: 'Política de Cookies',
    path: '/politica-de-cookies',
    lastUpdated: '27/07/2026',
  },
};

export const PROFILE_TYPES = [
  {
    id: 'pro',
    name: 'AirNext Pro',
    desc: 'Perfil pessoal ou profissional para compartilhar contatos e presença digital.',
  },
  {
    id: 'stand',
    name: 'AirNext Stand',
    desc: 'Perfil empresarial com catálogo, horários, promoções e presença de negócio.',
  },
  {
    id: 'pet',
    name: 'AirNext Pet',
    desc: 'Identificação de animais de estimação com dados escolhidos pelo responsável.',
  },
  {
    id: 'kids',
    name: 'AirNext Kids',
    desc: 'Perfil para crianças e adolescentes, administrado por responsável legal.',
    sensitive: true,
  },
  {
    id: 'senior',
    name: 'AirNext Senior',
    desc: 'Facilita identificação e contato; o usuário ou responsável define o que é público.',
    sensitive: true,
  },
  {
    id: 'tea',
    name: 'AirNext TEA',
    desc: 'Comunicação assistida e identificação personalizada, com cuidado redobrado.',
    sensitive: true,
  },
] as const;
