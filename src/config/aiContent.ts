/**
 * Conteúdo otimizado para AI Overviews / AI Mode (AEO).
 * Respostas curtas, factuais e citáveis — primeiro a resposta, depois o contexto.
 * Usado em FAQ visual + JSON-LD FAQPage / HowTo / Product.
 */

import { SITE_URL, SITE_NAME } from './seo';

/** Definição em uma frase — o que modelos de IA extraiem como “o que é X”. */
export const AIRNEXT_DEFINITION =
  'AirNext é uma plataforma brasileira de cartões, tags e pulseiras NFC que abrem um perfil digital personalizável com um toque no celular, sem instalar aplicativo.';

export const AIRNEXT_HOW_IT_WORKS = [
  'Aproxime o cartão, tag ou pulseira AirNext do celular (ou leia o QR Code).',
  'O perfil digital abre no navegador — contatos, redes, pet, kids, TEA ou negócio.',
  'Edite o perfil a qualquer momento no painel online; o produto físico continua o mesmo.',
];

/** FAQ citável — perguntas como usuários perguntam ao Google/IA. */
export const AIRNEXT_FAQ: { question: string; answer: string }[] = [
  {
    question: 'O que é AirNext?',
    answer:
      'AirNext é uma plataforma de cartões NFC, tags e pulseiras que compartilham um perfil digital com um toque no celular. Não precisa instalar app: funciona com NFC nativo ou QR Code. Serve para networking, pet, kids, TEA, idosos e negócios.',
  },
  {
    question: 'Como funciona o cartão NFC AirNext?',
    answer:
      'Cada produto AirNext tem um chip NFC e um QR Code ligados ao seu perfil online. Ao aproximar o celular, o perfil abre no navegador com seus contatos e informações. Você edita o conteúdo pelo painel web sem trocar o cartão físico.',
  },
  {
    question: 'Preciso instalar aplicativo para usar AirNext?',
    answer:
      'Não. Celulares modernos já leem NFC e QR Code sem baixar nada. O perfil abre no navegador do visitante.',
  },
  {
    question: 'Posso editar o perfil depois de comprar o cartão AirNext?',
    answer:
      'Sim. O chip aponta para o seu perfil online. Você altera textos, fotos, links e ordem dos blocos quantas vezes quiser no painel; o produto físico permanece o mesmo.',
  },
  {
    question: 'AirNext tem mensalidade?',
    answer:
      'Não há mensalidade mensal obrigatória. Cada produto AirNext inclui o perfil digital com validade de 2 anos. Ao final desse período, você pode renovar para continuar com o mesmo chip e histórico.',
  },
  {
    question: 'Qual a validade do produto AirNext?',
    answer:
      'Cada produto AirNext tem validade de 2 anos para o serviço de perfil digital vinculado. Depois desse prazo, é possível renovar por mais 2 anos sem precisar trocar o cartão, tag ou pulseira física.',
  },
  {
    question: 'AirNext funciona em iPhone e Android?',
    answer:
      'Sim. No Android o NFC costuma abrir o perfil automaticamente. No iPhone, o NFC lê a tag em modelos compatíveis e o QR Code funciona em qualquer iPhone com câmera.',
  },
  {
    question: 'O que fazer se o celular não tiver NFC?',
    answer:
      'Todo produto AirNext inclui QR Code de backup. Qualquer celular, tablet ou notebook com câmera acessa o perfil escaneando o código.',
  },
  {
    question: 'AirNext serve para pet perdido?',
    answer:
      'Sim. A tag pet AirNext mostra dados do animal e contato do tutor. Quem encontrar o pet pode ligar ou chamar no WhatsApp direto pelo perfil.',
  },
  {
    question: 'AirNext tem perfil para autismo (TEA)?',
    answer:
      'Sim. O perfil TEA inclui cartão de apoio com grau de suporte, como ajudar, gatilhos, estratégias para acalmar e contatos de emergência — pensado para quem está por perto em uma crise.',
  },
  {
    question: 'A AirNext é segura e está de acordo com a LGPD?',
    answer:
      'Sim. Você controla o que aparece no perfil. A AirNext trata dados conforme a LGPD; políticas de privacidade, termos e cookies estão publicadas no site.',
  },
  {
    question: 'Qual a durabilidade do chip NFC AirNext?',
    answer:
      'Os chips são projetados para mais de 100.000 ciclos de leitura e vida útil superior a 10 anos, com resistência à água (IP65) e ao uso diário.',
  },
  {
    question: 'A AirNext faz cartões personalizados para empresas?',
    answer:
      'Sim. A AirNext oferece soluções B2B com logo, cores da marca, gravação em lote e painel para equipes. Contato: airnext.oficial@gmail.com.',
  },
];

/** Schema.org FAQPage */
export function buildFaqPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: AIRNEXT_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/** Schema.org HowTo — “como usar AirNext” */
export function buildHowToJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Como usar o cartão ou tag NFC AirNext',
    description: AIRNEXT_DEFINITION,
    totalTime: 'PT1M',
    step: AIRNEXT_HOW_IT_WORKS.map((text, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: `Passo ${i + 1}`,
      text,
    })),
  };
}

/** SoftwareApplication / Product citável */
export function buildProductJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    url: SITE_URL,
    description: AIRNEXT_DEFINITION,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
      description: 'Perfil digital incluso com validade de 2 anos por produto',
    },
    featureList: [
      'Cartão NFC e QR Code',
      'Perfil digital editável',
      'Modos Pet, Kids, TEA, Senior e Business',
      'Sem aplicativo obrigatório',
      'Conformidade LGPD',
    ],
  };
}

/** Speakable — trechos ideais para leitura/resumo por IA */
export function buildSpeakableJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${SITE_NAME} — Cartões NFC e perfis digitais`,
    url: SITE_URL,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.ai-definition', '.ai-faq-answer', '.ai-howto-step'],
    },
    description: AIRNEXT_DEFINITION,
  };
}
