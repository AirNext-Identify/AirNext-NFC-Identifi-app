// Artes vetoriais dos novos produtos AirNext (placas Google, Personalizado e
// Combo). São SVGs inline (data URI) — carregam instantaneamente, ficam nítidos
// em qualquer tela e podem ser trocados por fotos reais a qualquer momento.

const svg = (body: string, bg1: string, bg2: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">` +
      `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient>` +
      `<filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#000" flood-opacity=".28"/></filter>` +
      `<linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>` +
      `<rect width="1200" height="900" fill="url(#bg)"/>` +
      `<circle cx="1020" cy="140" r="260" fill="#fff" opacity=".07"/><circle cx="150" cy="780" r="220" fill="#fff" opacity=".06"/>` +
      body +
      `</svg>`,
  );

const stars = (cx: number, y: number, size: number, color: string) =>
  [0, 1, 2, 3, 4]
    .map((i) => {
      const x = cx + (i - 2) * (size * 1.25);
      return `<polygon transform="translate(${x} ${y}) scale(${size / 24})" points="0,-24 7,-8 24,-7 11,5 15,23 0,14 -15,23 -11,5 -24,-7 -7,-8" fill="${color}"/>`;
    })
    .join('');

const nfcIcon = (cx: number, cy: number, color: string, s = 1) =>
  `<g transform="translate(${cx} ${cy}) scale(${s})" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round">` +
  `<path d="M-30 -34 C-8 -14 -8 14 -30 34"/><path d="M-6 -52 C28 -22 28 22 -6 52"/><path d="M18 -70 C64 -28 64 28 18 70"/></g>`;

const plaque = (x: number, y: number, w: number, h: number, fill: string, inner: string) =>
  `<g filter="url(#sh)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="36" fill="${fill}"/>` +
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="36" fill="url(#gl)"/></g>${inner}`;

// AirNext Hub — Google Avaliações
export const HUB_GOOGLE_ART = svg(
  plaque(
    300, 190, 600, 520, '#ffffff',
    `<text x="600" y="300" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="38" font-weight="700" fill="#5f6368" letter-spacing="3">AVALIE NO GOOGLE</text>` +
      stars(600, 390, 54, '#fbbc04') +
      `<text x="600" y="500" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="58" font-weight="800" fill="#202124">Gostou? Aproxime</text>` +
      `<text x="600" y="565" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="58" font-weight="800" fill="#202124">o celular.</text>` +
      `<rect x="470" y="605" width="260" height="56" rx="28" fill="#4285f4"/><text x="600" y="643" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="26" font-weight="700" fill="#fff">1 toque · 5 estrelas</text>` +
      nfcIcon(842, 262, '#4285f4', 0.55),
  ),
  '#1a73e8', '#0b3d91',
);

// Personalizado AirNext
export const CUSTOM_PLATE_ART = svg(
  plaque(
    300, 190, 600, 520, '#16161a',
    `<rect x="340" y="230" width="520" height="150" rx="26" fill="#ffffff" opacity=".08"/>` +
      `<circle cx="430" cy="305" r="46" fill="#fff" opacity=".9"/><text x="430" y="322" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="46" font-weight="800" fill="#16161a">A</text>` +
      `<text x="510" y="298" font-family="Helvetica,Arial,sans-serif" font-size="40" font-weight="800" fill="#fff">Sua marca aqui</text>` +
      `<text x="510" y="338" font-family="Helvetica,Arial,sans-serif" font-size="26" fill="#9a9aa2">Logo · cores · texto</text>` +
      ['#0071e3', '#34c759', '#ff9500', '#ff2d55', '#af52de', '#ffd60a']
        .map((c, i) => `<circle cx="${400 + i * 80}" cy="470" r="28" fill="${c}" stroke="#fff" stroke-opacity=".25" stroke-width="4"/>`)
        .join('') +
      `<text x="600" y="570" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="44" font-weight="800" fill="#fff">100% do seu jeito</text>` +
      `<text x="600" y="615" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="26" fill="#9a9aa2">Placa NFC personalizada AirNext</text>` +
      nfcIcon(600, 662, '#0071e3', 0.42),
  ),
  '#5e17eb', '#1d0b52',
);

// Combo: Card Pro + Tag + Pulseira
export const COMBO_ART = svg(
  // cartão
  `<g transform="rotate(-8 400 420)">` +
    plaque(190, 290, 420, 265, '#0071e3', `<text x="230" y="360" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="800" fill="#fff" opacity=".95">AirNext Pro</text>` + nfcIcon(540, 330, '#fff', 0.5) + `<rect x="230" y="480" width="150" height="14" rx="7" fill="#fff" opacity=".5"/><rect x="230" y="506" width="100" height="14" rx="7" fill="#fff" opacity=".3"/>`) +
  `</g>` +
  // tag
  `<g transform="rotate(7 800 360)">` +
    plaque(690, 190, 230, 300, '#ffd60a', `<circle cx="805" cy="245" r="20" fill="#1a1a1a" opacity=".85"/>` + nfcIcon(805, 360, '#1a1a1a', 0.8) + `<text x="805" y="450" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="800" fill="#1a1a1a">TAG</text>`) +
  `</g>` +
  // pulseira
  `<g transform="rotate(-3 600 690)" filter="url(#sh)"><rect x="250" y="620" width="700" height="130" rx="65" fill="#34c759"/><rect x="250" y="620" width="700" height="130" rx="65" fill="url(#gl)"/>` +
    `<rect x="520" y="640" width="160" height="90" rx="26" fill="#fff" opacity=".92"/>` + nfcIcon(600, 685, '#34c759', 0.5) +
    `<text x="780" y="700" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="800" fill="#fff">PULSEIRA</text></g>` +
  `<g transform="translate(600 120)"><rect x="-150" y="-30" width="300" height="60" rx="30" fill="#fff"/><text x="0" y="12" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="800" fill="#c2185b">COMBO AIRNEXT</text></g>`,
  '#ff2d55', '#7a0f2e',
);
