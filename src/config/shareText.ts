/**
 * Textos de compartilhamento — AirNext.
 *  • SITE: o que aparece ao compartilhar airnext.com.br (descrição oficial).
 *  • PROFILE: convite padrão ao compartilhar o perfil de uma pessoa/pet/negócio.
 * Cada perfil tem prévia e convite próprios, diferentes dos do site.
 */

export const SITE_SHARE = {
  title: 'AirNext NFC | Conecta o físico ao digital',
  description:
    'NFC + QR Code em um único perfil: links, contato e muito mais. Feito para negócios, pets e pessoas. Saiba mais.',
  /** Mensagem pronta ao compartilhar o site. */
  message: 'Conheça a AirNext: NFC + QR Code em um único perfil — links, contato e muito mais, para negócios, pets e pessoas.',
};

type Cat = 'PERSONAL' | 'BUSINESS' | 'PET' | 'KIDS' | 'SENIOR' | 'TEA' | string;

interface ProfileShareInput {
  cat: Cat;
  name?: string;
  cargo?: string;
  bio?: string;
  segment?: string;
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trim()}…` : s);

/** Prévia (título + descrição do link) do perfil, por categoria. */
export function profilePreview({ cat, name, cargo, bio, segment }: ProfileShareInput) {
  const n = (name || '').trim();
  const b = clip((bio || '').trim(), 110);
  switch (cat) {
    case 'BUSINESS':
      return {
        title: n ? `${n} — cartão digital` : 'Cartão digital da empresa',
        description: b || `${segment ? `${segment} · ` : ''}Contatos, localização, horários e links em um só lugar. Toque para ver.`,
      };
    case 'PET':
      return {
        title: n ? `${n} — perfil do pet` : 'Perfil do pet',
        description: 'Identificação digital do pet: contato do tutor e informações importantes. Se encontrou, toque para ajudar.',
      };
    case 'KIDS':
      return {
        title: n ? `${n} — perfil de segurança` : 'Perfil de segurança infantil',
        description: 'Contatos de emergência dos responsáveis e informações importantes. Toque para ver.',
      };
    case 'SENIOR':
      return {
        title: n ? `${n} — perfil de cuidado` : 'Perfil de cuidado',
        description: 'Contatos de emergência e informações de saúde essenciais. Toque para ver.',
      };
    case 'TEA':
      return {
        title: n ? `${n} — cartão de apoio` : 'Cartão de apoio TEA',
        description: 'Como se comunicar e ajudar com respeito, e contatos dos responsáveis. Toque para ver.',
      };
    default:
      return {
        title: n ? `${n}${cargo ? ` · ${cargo}` : ''} — cartão digital` : 'Cartão digital',
        description: b || 'Contatos, redes e links em um só toque. Salve meu contato direto no celular.',
      };
  }
}

/** Convite padrão enviado junto com o link ao tocar em compartilhar o perfil. */
export function profileInvite({ cat, name }: ProfileShareInput) {
  const n = (name || '').trim();
  switch (cat) {
    case 'BUSINESS':
      return `Oi! Este é o cartão digital${n ? ` da ${n}` : ' da nossa empresa'}. Veja contatos, horários e links por aqui:`;
    case 'PET':
      return `Este é o perfil${n ? ` do ${n}` : ' do meu pet'} na AirNext, com contato do tutor e informações importantes:`;
    case 'KIDS':
    case 'SENIOR':
    case 'TEA':
      return `Perfil de segurança${n ? ` de ${n}` : ''} na AirNext, com contatos de emergência e informações importantes:`;
    default:
      return `Oi! Aqui está meu cartão digital${n ? ` (${n})` : ''}. Salve meu contato e veja meus links:`;
  }
}
