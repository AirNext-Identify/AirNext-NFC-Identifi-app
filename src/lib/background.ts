/**
 * Fundo & cores do perfil público — fonte única de verdade.
 *
 * Antes existiam dois sistemas sobrepostos (um "Tema" pré-definido +
 * um "Fundo Customizado" com gradientes/cores/imagem), o que fazia as
 * cores de texto e botões do editor não corresponderem ao perfil público.
 *
 * Agora só existe UM sistema: o usuário escolhe um gradiente, cor sólida
 * ou imagem de fundo, e o contraste do texto (claro/escuro) é calculado
 * automaticamente a partir do fundo escolhido — sem "tema" fixo por trás.
 */

export interface BgOption {
  id: string;
  value: string;
  label: string;
  /** Fundo claro? Usado para decidir a cor automática do texto. */
  light?: boolean;
}

export const GRADIENT_OPTIONS: BgOption[] = [
  { id: 'g-1', label: 'Índigo', value: 'bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700' },
  { id: 'g-2', label: 'Pôr do Sol', value: 'bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600' },
  { id: 'g-3', label: 'Esmeralda', value: 'bg-gradient-to-br from-emerald-500 to-cyan-600' },
  { id: 'g-4', label: 'Aurora', value: 'bg-gradient-to-br from-green-300 via-blue-500 to-purple-600' },
  { id: 'g-5', label: 'Fogo', value: 'bg-gradient-to-br from-red-600 via-orange-500 to-yellow-400' },
  { id: 'g-6', label: 'Oceano', value: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-800' },
  { id: 'g-7', label: 'Candy', value: 'bg-gradient-to-br from-pink-400 via-fuchsia-400 to-violet-500' },
  { id: 'g-8', label: 'Realeza', value: 'bg-gradient-to-br from-violet-900 via-purple-800 to-fuchsia-900' },
  { id: 'g-9', label: 'Menta', value: 'bg-gradient-to-br from-green-400 via-cyan-400 to-blue-500' },
  { id: 'g-10', label: 'Vinho', value: 'bg-gradient-to-br from-rose-900 via-red-800 to-rose-950' },
  { id: 'g-11', label: 'Ônix', value: 'bg-gradient-to-br from-slate-900 via-zinc-900 to-black' },
  { id: 'g-12', label: 'Marinho', value: 'bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950' },
  { id: 'g-13', label: 'Âmbar', value: 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-700' },
  { id: 'g-14', label: 'Floresta', value: 'bg-gradient-to-br from-teal-500 via-emerald-600 to-green-700' },
  { id: 'g-15', label: 'Magenta', value: 'bg-gradient-to-br from-fuchsia-600 via-pink-600 to-rose-600' },
  { id: 'g-16', label: 'Céu', value: 'bg-gradient-to-br from-indigo-500 via-sky-500 to-cyan-400' },
  { id: 'g-17', label: 'Carbono', value: 'bg-gradient-to-br from-zinc-900 via-neutral-800 to-zinc-950' },
  { id: 'g-18', label: 'Limão', value: 'bg-gradient-to-br from-lime-400 via-green-500 to-emerald-600' },
  { id: 'g-19', label: 'Cosmos', value: 'bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700' },
  { id: 'g-20', label: 'Coral', value: 'bg-gradient-to-br from-red-500 via-rose-600 to-pink-700' },
  { id: 'g-21', label: 'Grafite', value: 'bg-gradient-to-br from-neutral-800 via-zinc-800 to-stone-900' },
  { id: 'g-22', label: 'Safira', value: 'bg-gradient-to-br from-blue-800 via-indigo-800 to-violet-900' },
  { id: 'g-light-1', label: 'Creme', value: 'bg-gradient-to-br from-white via-zinc-100 to-amber-50', light: true },
  { id: 'g-light-2', label: 'Nuvem', value: 'bg-gradient-to-br from-sky-50 via-blue-100 to-indigo-100', light: true },
  { id: 'g-light-3', label: 'Algodão Doce', value: 'bg-gradient-to-br from-rose-50 via-pink-100 to-purple-100', light: true },
  { id: 'g-light-4', label: 'Areia', value: 'bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100', light: true },
  { id: 'g-light-5', label: 'Menta Clara', value: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50', light: true },
  { id: 'g-light-6', label: 'Pérola', value: 'bg-gradient-to-br from-zinc-50 via-slate-100 to-zinc-200', light: true },
  // ── Frios ──
  { id: 'g-23', label: 'Ártico', value: 'bg-gradient-to-br from-cyan-300 via-sky-500 to-blue-700' },
  { id: 'g-24', label: 'Glacial', value: 'bg-gradient-to-br from-slate-400 via-cyan-600 to-indigo-800' },
  { id: 'g-25', label: 'Meia-noite Azul', value: 'bg-gradient-to-br from-blue-900 via-slate-900 to-cyan-950' },
  { id: 'g-26', label: 'Ametista', value: 'bg-gradient-to-br from-violet-500 via-indigo-600 to-blue-900' },
  // ── Quentes ──
  { id: 'g-27', label: 'Lava', value: 'bg-gradient-to-br from-yellow-400 via-red-600 to-rose-900' },
  { id: 'g-28', label: 'Deserto', value: 'bg-gradient-to-br from-amber-300 via-orange-500 to-red-600' },
  { id: 'g-29', label: 'Brasa', value: 'bg-gradient-to-br from-orange-600 via-red-700 to-rose-950' },
  { id: 'g-30', label: 'Girassol', value: 'bg-gradient-to-br from-yellow-300 via-amber-500 to-orange-600' },
  // ── Frio + Quente (duotone) ──
  { id: 'g-31', label: 'Fusão', value: 'bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-amber-400' },
  { id: 'g-32', label: 'Contraste', value: 'bg-gradient-to-r from-blue-600 to-orange-500' },
  { id: 'g-33', label: 'Nascer do Sol', value: 'bg-gradient-to-br from-indigo-700 via-purple-600 to-orange-400' },
  { id: 'g-34', label: 'Gelo & Fogo', value: 'bg-gradient-to-br from-sky-400 via-slate-700 to-red-600' },
  { id: 'g-light-7', label: 'Pêssego', value: 'bg-gradient-to-br from-cyan-50 via-white to-orange-100', light: true },
  { id: 'g-light-8', label: 'Lavanda Quente', value: 'bg-gradient-to-br from-indigo-50 via-rose-50 to-amber-50', light: true },
];

export const SOLID_COLOR_OPTIONS: BgOption[] = [
  { id: 's-black', label: 'Preto', value: 'bg-black' },
  { id: 's-zinc', label: 'Grafite', value: 'bg-zinc-950' },
  { id: 's-white', label: 'Branco', value: 'bg-white', light: true },
  { id: 's-blue', label: 'Azul', value: 'bg-blue-600' },
  { id: 's-indigo', label: 'Índigo', value: 'bg-indigo-700' },
  { id: 's-purple', label: 'Roxo', value: 'bg-purple-700' },
  { id: 's-pink', label: 'Rosa', value: 'bg-pink-600' },
  { id: 's-rose', label: 'Rosê', value: 'bg-rose-600' },
  { id: 's-emerald', label: 'Esmeralda', value: 'bg-emerald-600' },
  { id: 's-teal', label: 'Verde-água', value: 'bg-teal-600' },
  { id: 's-amber', label: 'Âmbar', value: 'bg-amber-500' },
  { id: 's-orange', label: 'Laranja', value: 'bg-orange-500' },
  { id: 's-slate', label: 'Ardósia', value: 'bg-slate-800' },
  { id: 's-stone', label: 'Pedra', value: 'bg-stone-800' },
  { id: 's-red', label: 'Vermelho', value: 'bg-red-700' },
];

/** Fundo automático por categoria — usado quando o usuário não escolhe nada. */
export const DEFAULT_BACKGROUND_BY_CATEGORY: Record<string, string> = {
  PERSONAL: GRADIENT_OPTIONS[0].value,
  BUSINESS: 'bg-gradient-to-br from-slate-900 via-zinc-900 to-gray-900',
  PET: 'bg-gradient-to-br from-amber-200 via-orange-100 to-yellow-200',
  KIDS: 'bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400',
  SENIOR: 'bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950',
  TEA: 'bg-gradient-to-br from-sky-100 to-blue-200',
};

const LIGHT_VALUES = new Set<string>([
  ...GRADIENT_OPTIONS.filter(g => g.light).map(g => g.value),
  ...SOLID_COLOR_OPTIONS.filter(s => s.light).map(s => s.value),
  DEFAULT_BACKGROUND_BY_CATEGORY.PET,
  DEFAULT_BACKGROUND_BY_CATEGORY.TEA,
]);

function hexLuminance(hex: string): number | null {
  const raw = hex.replace('#', '').trim();
  if (![3, 6].includes(raw.length)) return null;
  const full = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return null;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Decide se o fundo é claro (para usar texto escuro por cima) ou escuro (texto claro). */
export function isLightBackground(value: string): boolean {
  if (!value) return false;
  if (value.startsWith('http') || value.startsWith('data:')) return false; // imagens usam overlay escuro p/ legibilidade
  if (value.startsWith('#')) {
    const lum = hexLuminance(value);
    return lum !== null && lum > 0.6;
  }
  return LIGHT_VALUES.has(value);
}

export function getDefaultBackground(cat?: string): string {
  return (cat && DEFAULT_BACKGROUND_BY_CATEGORY[cat]) || GRADIENT_OPTIONS[0].value;
}
