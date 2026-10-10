/* ─── PADRÕES DECORATIVOS ────────────────────────────────────
   Estampa de "quebra-cabeça" usada no tema TEA (Autismo).
   Gerada como SVG tileável, leve e sem dependências externas. */

function puzzlePiece(x: number, y: number, size: number, color: string, rotate: number) {
  const half = size / 2;
  const cx = x + half;
  const cy = y + half;
  const bump = size * 0.16;
  // Peça: quadrado arredondado com uma "aba" saliente (direita) e um "encaixe" (esquerda)
  const d = `
    M ${x + size * 0.15},${y}
    H ${x + size * 0.85}
    a ${size * 0.15},${size * 0.15} 0 0 1 ${size * 0.15},${size * 0.15}
    V ${y + size * 0.35}
    a ${bump},${bump} 0 0 0 0,${bump * 2}
    V ${y + size * 0.85}
    a ${size * 0.15},${size * 0.15} 0 0 1 -${size * 0.15},${size * 0.15}
    H ${x + size * 0.15}
    a ${size * 0.15},${size * 0.15} 0 0 1 -${size * 0.15},-${size * 0.15}
    V ${y + size * 0.65}
    a ${bump},${bump} 0 0 0 0,-${bump * 2}
    V ${y + size * 0.15}
    a ${size * 0.15},${size * 0.15} 0 0 1 ${size * 0.15},-${size * 0.15}
    Z
  `.replace(/\s+/g, ' ').trim();
  return `<path d="${d}" fill="${color}" transform="rotate(${rotate} ${cx} ${cy})" />`;
}

function buildPuzzlePatternSvg(opacity = 0.16) {
  const size = 46;
  const colors = ['#60a5fa', '#34d399', '#a78bfa', '#fbbf24'];
  const pieces = [
    puzzlePiece(6, 6, size, colors[0], 0),
    puzzlePiece(66, 10, size, colors[1], 90),
    puzzlePiece(10, 68, size, colors[2], 180),
    puzzlePiece(68, 66, size, colors[3], 270),
  ].join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" opacity="${opacity}">${pieces}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Data URI de um padrão de peças de quebra-cabeça, tileável, para o tema TEA. */
export const PUZZLE_PATTERN_BG = buildPuzzlePatternSvg();

/** Peça de quebra-cabeça única (usada como selo/ícone decorativo). */
export function puzzleBadgeSvg(color = '#3b82f6') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">${puzzlePiece(0, 0, 40, color, 0)}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
