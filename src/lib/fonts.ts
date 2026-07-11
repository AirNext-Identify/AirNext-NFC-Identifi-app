/**
 * Catálogo de fontes disponíveis para personalização do perfil (AirNect).
 * `id` é salvo em `profileData.__fontFamily`. `family` é o valor CSS usado
 * no `fontFamily` do perfil público e do preview. `google` é o nome exato
 * usado na URL do Google Fonts (quando aplicável).
 */
export type FontOption = {
  id: string;
  label: string;
  family: string;
  google?: string;
  weights?: string;
};

export const FONT_OPTIONS: FontOption[] = [
  { id: 'inter', label: 'Inter', family: "'Inter', sans-serif", google: 'Inter', weights: '400;500;600;700;800;900' },
  { id: 'poppins', label: 'Poppins', family: "'Poppins', sans-serif", google: 'Poppins', weights: '400;500;600;700;800;900' },
  { id: 'manrope', label: 'Manrope', family: "'Manrope', sans-serif", google: 'Manrope', weights: '400;500;600;700;800' },
  { id: 'plus-jakarta', label: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", google: 'Plus+Jakarta+Sans', weights: '400;500;600;700;800' },
  { id: 'sora', label: 'Sora', family: "'Sora', sans-serif", google: 'Sora', weights: '400;500;600;700;800' },
  { id: 'outfit', label: 'Outfit', family: "'Outfit', sans-serif", google: 'Outfit', weights: '400;500;600;700;800' },
  { id: 'space-grotesk', label: 'Space Grotesk', family: "'Space Grotesk', sans-serif", google: 'Space+Grotesk', weights: '400;500;600;700' },
  { id: 'dm-sans', label: 'DM Sans', family: "'DM Sans', sans-serif", google: 'DM+Sans', weights: '400;500;700;800;900' },
  { id: 'urbanist', label: 'Urbanist', family: "'Urbanist', sans-serif", google: 'Urbanist', weights: '400;500;600;700;800' },
  { id: 'lexend', label: 'Lexend', family: "'Lexend', sans-serif", google: 'Lexend', weights: '400;500;600;700;800' },
  { id: 'clash-display', label: 'Clash Grotesk', family: "'Familjen Grotesk', sans-serif", google: 'Familjen+Grotesk', weights: '400;500;600;700' },
  { id: 'general-sans', label: 'Onest', family: "'Onest', sans-serif", google: 'Onest', weights: '400;500;600;700;800' },
  { id: 'playfair', label: 'Playfair Display', family: "'Playfair Display', serif", google: 'Playfair+Display', weights: '400;600;700;800;900' },
  { id: 'fraunces', label: 'Fraunces', family: "'Fraunces', serif", google: 'Fraunces', weights: '400;500;600;700;800' },
];

export function getFontOption(id?: string): FontOption {
  return FONT_OPTIONS.find(f => f.id === id) || FONT_OPTIONS[0];
}

/** Injeta (uma única vez por família) a tag <link> do Google Fonts no <head>. */
export function loadGoogleFont(id?: string) {
  if (typeof document === 'undefined') return;
  const opt = getFontOption(id);
  if (!opt.google) return;
  const linkId = `airnect-font-${opt.id}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${opt.google}:wght@${opt.weights || '400;600;700'}&display=swap`;
  document.head.appendChild(link);
}
