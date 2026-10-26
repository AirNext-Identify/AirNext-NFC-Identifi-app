import type { CSSProperties } from 'react';

/**
 * Temas de layout do CARD do perfil público (moldura, vidro, brilho, borda).
 * Diferente do tema de cores (`product.theme`) e do alinhamento (`__layout`):
 * este controla o "material" do card. Guardado em `profile_data.__cardTheme`.
 *
 * Aplicação: `cardThemeClass(id)` no container do card (ativa as regras de
 * .pp-theme-* em index.css para os botões/links) e `getCardThemeStyle()` no estilo inline.
 */
export type CardTheme = 'glass' | 'frosted' | 'solid' | 'outline' | 'gradient' | 'neon' | 'aurora' | 'minimal';

export const CARD_THEMES: { id: CardTheme; label: string; desc: string }[] = [
  { id: 'glass', label: 'Vidro', desc: 'Translúcido clássico (padrão)' },
  { id: 'frosted', label: 'Vidro fosco', desc: 'Desfoque forte, estilo Apple' },
  { id: 'solid', label: 'Sólido', desc: 'Card opaco e limpo' },
  { id: 'outline', label: 'Contorno', desc: 'Borda na cor do perfil' },
  { id: 'gradient', label: 'Degradê', desc: 'Cores do perfil suaves' },
  { id: 'neon', label: 'Neon', desc: 'Brilho ao redor do card' },
  { id: 'aurora', label: 'Aurora', desc: 'Borda em degradê colorido' },
  { id: 'minimal', label: 'Minimal', desc: 'Plano, sem sombra' },
];

export const isCardTheme = (v: unknown): v is CardTheme =>
  typeof v === 'string' && CARD_THEMES.some(t => t.id === v);

export const cardThemeClass = (id?: string) => `pp-theme-${isCardTheme(id) ? id : 'glass'}`;

export function getCardThemeStyle(
  id: string | undefined,
  o: { primary: string; secondary: string; light: boolean },
): CSSProperties {
  const { primary, secondary, light } = o;
  const base = light ? '#ffffff' : '#101014';
  const vars = { ['--pp-accent' as any]: primary, ['--pp-accent2' as any]: secondary } as CSSProperties;
  switch (isCardTheme(id) ? id : 'glass') {
    case 'frosted':
      return {
        ...vars,
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.22)',
        boxShadow: '0 30px 80px -25px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
      };
    case 'solid':
      return { ...vars, background: base, border: light ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)' };
    case 'outline':
      return { ...vars, border: `1.5px solid ${primary}`, boxShadow: 'none' };
    case 'gradient':
      return {
        ...vars,
        background: `linear-gradient(160deg, ${primary}59, ${secondary}40)`,
        border: `1px solid ${primary}55`,
      };
    case 'neon':
      return {
        ...vars,
        border: `1px solid ${primary}`,
        boxShadow: `0 0 0 1px ${primary}33, 0 0 45px ${primary}66, inset 0 0 30px ${primary}14`,
      };
    case 'aurora':
      return {
        ...vars,
        border: '2px solid transparent',
        background: `linear-gradient(${base}, ${base}) padding-box, linear-gradient(135deg, ${primary}, ${secondary}, #22d3ee) border-box`,
      };
    case 'minimal':
      return { ...vars, boxShadow: 'none', border: light ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)' };
    case 'glass':
    default:
      return vars;
  }
}
