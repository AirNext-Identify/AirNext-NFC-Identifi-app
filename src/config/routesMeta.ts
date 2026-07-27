/**
 * Meta tags padrão por rota — título, descrição, imagem e indexação.
 * Páginas específicas (ex.: PublicProfile) sobrescrevem via <Seo />.
 */

import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, type SeoProps } from './seo';

export type RouteMeta = SeoProps & { match: RegExp | string };

export const ROUTES_META: RouteMeta[] = [
  {
    match: /^\/$/,
    title: `${SITE_NAME} — Cartões NFC e Perfis Digitais`,
    description:
      'AirNext é uma plataforma de cartões, tags e pulseiras NFC que abrem um perfil digital com um toque, sem instalar app. Ideal para networking, pet, kids, TEA e negócios.',
    image: DEFAULT_OG_IMAGE,
    type: 'website',
  },
  {
    match: /^\/suporte\/?$/,
    title: 'Suporte e tutoriais',
    description:
      'Vídeos tutoriais AirNext: como ativar o produto, usar NFC e QR Code, personalizar o perfil, pet, TEA e privacidade.',
    image: DEFAULT_OG_IMAGE,
  },
  {
    match: /^\/politica-de-privacidade\/?$/,
    title: 'Política de Privacidade',
    description:
      'Como a AirNext coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.',
  },
  {
    match: /^\/termos-de-uso\/?$/,
    title: 'Termos de Uso',
    description: 'Condições de uso da plataforma AirNext, produtos NFC e perfis digitais.',
  },
  {
    match: /^\/politica-de-cookies\/?$/,
    title: 'Política de Cookies',
    description: 'Transparência sobre cookies e tecnologias semelhantes utilizados na AirNext.',
  },
  {
    match: /^\/u\/[^/]+\/?$/,
    title: `Perfil · ${SITE_NAME}`,
    description: 'Perfil digital AirNext — contatos e informações em um toque.',
    type: 'profile',
  },
  {
    match: /^\/p\/[^/]+\/?$/,
    title: `Perfil · ${SITE_NAME}`,
    description: 'Perfil digital AirNext — contatos e informações em um toque.',
    type: 'profile',
  },
  {
    match: /^\/login\/?$/,
    title: 'Entrar',
    description: 'Acesse sua conta AirNext.',
    noIndex: true,
  },
  {
    match: /^\/register\/?$/,
    title: 'Criar conta',
    description: 'Cadastre-se na AirNext e ative seu perfil digital NFC.',
    noIndex: true,
  },
  {
    match: /^\/ativar/,
    title: 'Ativar produto',
    description: 'Ative seu cartão, tag ou pulseira AirNext.',
    noIndex: true,
  },
  {
    match: /^\/onboarding/,
    title: 'Onboarding',
    description: 'Configure sua conta AirNext.',
    noIndex: true,
  },
  {
    match: /^\/dashboard/,
    title: 'Painel',
    description: 'Painel do usuário AirNext.',
    noIndex: true,
  },
  {
    match: /^\/admin/,
    title: 'Admin',
    description: 'Painel administrativo AirNext.',
    noIndex: true,
  },
  {
    match: /^\/painel-imagens/,
    title: 'Imagens do site',
    noIndex: true,
  },
];

export function metaForPath(pathname: string): SeoProps {
  const path = pathname.split('?')[0] || '/';
  for (const route of ROUTES_META) {
    const ok =
      typeof route.match === 'string' ? path === route.match : route.match.test(path);
    if (ok) {
      const { match: _m, ...meta } = route;
      return {
        description: SITE_DESCRIPTION,
        image: DEFAULT_OG_IMAGE,
        type: 'website',
        noIndex: false,
        ...meta,
      };
    }
  }
  return {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    image: DEFAULT_OG_IMAGE,
    type: 'website',
  };
}
