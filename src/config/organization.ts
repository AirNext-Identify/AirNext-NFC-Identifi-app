/**
 * Organization (schema.org) da AirNext — fonte única, usada pelo <Seo /> e
 * espelhada no JSON-LD estático de public/index-html-snippet.html.
 * Todos os dados vêm de LEGAL_CONFIG: nada é inventado aqui.
 */
import { LEGAL_CONFIG } from './legal';
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from './seo';

export function buildOrganizationJsonLd() {
  const a = LEGAL_CONFIG.addressDetails;
  const address: Record<string, string> = { '@type': 'PostalAddress', addressCountry: a.country || 'BR' };
  if (a.street) address.streetAddress = a.street;
  if (a.locality) address.addressLocality = a.locality;
  if (a.region) address.addressRegion = a.region;
  if (a.postalCode) address.postalCode = a.postalCode;

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': absoluteUrl('/') + '#org',
    name: SITE_NAME,
    legalName: LEGAL_CONFIG.legalName,
    url: absoluteUrl('/'),
    logo: absoluteUrl('/favicon.png'),
    description: SITE_DESCRIPTION,
    slogan: LEGAL_CONFIG.tagline,
    email: LEGAL_CONFIG.supportEmail,
    telephone: LEGAL_CONFIG.phoneE164,
    address,
    ...(LEGAL_CONFIG.cnpj ? { taxID: LEGAL_CONFIG.cnpj } : {}),
    areaServed: { '@type': 'Country', name: 'Brasil' },
    knowsLanguage: 'pt-BR',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        telephone: LEGAL_CONFIG.phoneE164,
        email: LEGAL_CONFIG.supportEmail,
        availableLanguage: 'pt-BR',
        areaServed: 'BR',
        url: absoluteUrl('/contato'),
      },
      {
        '@type': 'ContactPoint',
        contactType: 'privacy',
        email: LEGAL_CONFIG.privacyEmail,
        availableLanguage: 'pt-BR',
        areaServed: 'BR',
      },
    ],
    sameAs: [LEGAL_CONFIG.instagramUrl],
  };
}
