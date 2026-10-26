/** Link oficial de avaliação no Google (Perfil da Empresa AirNext). */
export const GOOGLE_REVIEW_URL = 'https://g.page/r/CZabGg8lfRicECE/review';

/** Destino do feedback privado (WhatsApp da AirNext, só números, com DDI). */
export const FEEDBACK_WHATSAPP = '5547996287761';
export const FEEDBACK_EMAIL = 'contato@airnext.com.br';

/** Momentos em que faz sentido mostrar o balão discreto. */
export type FeedbackMoment =
  | 'order_sent'     // pedido enviado pelo WhatsApp (sacola)
  | 'design_sent'    // projeto personalizado enviado para produção
  | 'activated'      // produto ativado no painel
  | 'profile_saved'  // perfil salvo/publicado
  | 'generic';

export const MOMENT_COPY: Record<FeedbackMoment, { title: string; text: string }> = {
  order_sent: {
    title: 'Pedido enviado!',
    text: 'Como foi sua experiência até aqui? Leva 10 segundos.',
  },
  design_sent: {
    title: 'Projeto enviado!',
    text: 'Gostou de personalizar? Conte pra gente.',
  },
  activated: {
    title: 'Produto ativado!',
    text: 'Tudo certo por aqui? Sua opinião nos ajuda a melhorar.',
  },
  profile_saved: {
    title: 'Perfil salvo!',
    text: 'Está curtindo a AirNext? Deixe sua avaliação.',
  },
  generic: {
    title: 'Sua opinião importa',
    text: 'Conte como está sendo sua experiência com a AirNext.',
  },
};

export const RATING_LABELS = ['Ruim', 'Poderia melhorar', 'Bom', 'Muito bom', 'Excelente'] as const;

/** Rotas onde NÃO mostramos nada (cartões públicos de clientes, login, admin etc.). */
export function isFeedbackHiddenRoute(pathname: string): boolean {
  const roots = ['/u', '/p', '/n', '/a', '/admin', '/admin-legacy', '/painel-imagens', '/login', '/register', '/onboarding'];
  return roots.some(r => pathname === r || pathname.startsWith(r + '/'));
}

/** Cooldowns (ms) para não incomodar. */
export const SNOOZE_AFTER_CLOSE = 7 * 24 * 60 * 60 * 1000;     // fechou o balão no X
export const SNOOZE_AFTER_TIMEOUT = 24 * 60 * 60 * 1000;       // balão sumiu sozinho
export const SNOOZE_AFTER_DONE = 60 * 24 * 60 * 60 * 1000;     // já avaliou/enviou
