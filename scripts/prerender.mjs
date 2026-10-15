// Gera páginas estáticas de SEO em dist/ após o `vite build`. Edite PAGES para mudar textos.
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://airnext.com.br';
const WA = 'https://wa.me/5547996287761';
const LOCAL = ''; // Ex.: 'Itajaí, SC' — se preenchido, aparece nas páginas de produto.
const OUT = path.resolve('dist');

const PAGES = [
  { slug: 'cartao-nfc', title: 'Cartão NFC Digital: cartão de visita com um toque | AirNext',
    desc: 'Cartão de visita NFC AirNext: aproxime do celular e compartilhe contatos, redes sociais e WhatsApp, sem app e sem imprimir cartão novo.',
    h1: 'Cartão NFC: seu cartão de visita digital', kind: 'Produto',
    body: [['Como funciona', 'O cartão AirNext tem um chip NFC e um QR Code. Ao aproximar do celular, a pessoa abre o seu perfil digital com contatos, redes sociais, WhatsApp e localização. Você atualiza as informações quando quiser, sem reimprimir nada.'],
      ['Para quem é', 'Profissionais liberais, vendedores, clínicas, lojas e quem faz networking. Um único cartão substitui pilhas de cartões de papel e nunca fica desatualizado.']],
    faq: [['O cartão NFC precisa de aplicativo?', 'Não. O visitante só aproxima o celular ou escaneia o QR Code, e o perfil abre no navegador.'], ['Posso mudar meus dados depois?', 'Sim. O perfil é editável a qualquer momento pelo painel, e o cartão continua o mesmo.']],
    links: ['tag-nfc-pet', 'blog/como-funciona-cartao-nfc'] },
  { slug: 'tag-nfc-pet', title: 'Tag NFC para Pet: coleira que ajuda a encontrar seu animal | AirNext',
    desc: 'Tag NFC para pet AirNext: quem encontrar seu animal aproxima o celular e vê seu contato na hora. Sem bateria e sem aplicativo.',
    h1: 'Tag NFC para pet: seu animal de volta para casa', kind: 'Produto',
    body: [['Como ajuda a achar seu pet', 'A tag fica na coleira. Quem encontra o animal aproxima o celular (ou escaneia o QR Code) e vê o perfil do pet com seus contatos, para avisar você rapidamente.'],
      ['Vantagens', 'Não usa bateria, não precisa de aplicativo para quem encontra e o perfil pode ser atualizado a qualquer momento, por exemplo ao trocar de telefone.']],
    faq: [['A tag NFC para pet usa bateria?', 'Não. O chip NFC é passivo e funciona ao aproximar o celular.'], ['Quem encontra o pet precisa instalar algo?', 'Não. O perfil abre direto no navegador do celular.']],
    links: ['pulseira-nfc', 'blog/nfc-ou-qr-code'] },
  { slug: 'pulseira-nfc', title: 'Pulseira NFC: identificação com um toque | AirNext',
    desc: 'Pulseira NFC AirNext: identificação digital para pessoas e eventos. Aproxime o celular e abra o perfil, sem bateria e sem aplicativo.',
    h1: 'Pulseira NFC: identificação digital no pulso', kind: 'Produto',
    body: [['Para que serve', 'A pulseira guarda um chip NFC ligado a um perfil digital. Útil para identificação de crianças, idosos e pessoas com necessidades específicas, além de eventos e acessos.'],
      ['Como usar', 'Basta aproximar o celular da pulseira, ou escanear o QR Code, para abrir o perfil com as informações e os contatos cadastrados.']],
    faq: [['A pulseira NFC precisa de carga?', 'Não. O chip é passivo e não usa bateria.'], ['Quem lê precisa de aplicativo?', 'Não. O perfil abre no navegador.']],
    links: ['tag-nfc-pet', 'cartao-nfc'] },
  { slug: 'placa-google-avaliacao-nfc', title: 'Placa NFC de Avaliação Google: mais avaliações para seu negócio | AirNext',
    desc: 'Placa NFC AirNext para avaliações no Google: o cliente aproxima o celular e vai direto para a página de avaliar sua empresa.',
    h1: 'Placa NFC de avaliação Google para o seu negócio', kind: 'Produto',
    body: [['Mais avaliações, menos fricção', 'Com a placa no balcão ou na mesa, o cliente aproxima o celular ou escaneia o QR Code e cai direto na página de avaliação da sua empresa no Google.'],
      ['Onde usar', 'Restaurantes, clínicas, salões, lojas e qualquer negócio que dependa de reputação local. Há modelos de parede, mesa e com suporte.']],
    faq: [['A placa tem NFC e QR Code?', 'Sim. As placas AirNext vêm com chip NFC e QR Code.'], ['Como o cliente avalia?', 'Aproxima o celular da placa e abre a página de avaliação.']],
    links: ['cartao-nfc', 'blog/nfc-ou-qr-code'] },
  { slug: 'blog/como-funciona-cartao-nfc', title: 'Como funciona o cartão NFC? Guia simples | AirNext',
    desc: 'Entenda como funciona o cartão NFC: o chip, a leitura pelo celular e como um toque abre um perfil digital completo.',
    h1: 'Como funciona o cartão NFC', kind: 'Guia',
    body: [['O que é NFC', 'NFC (Near Field Communication) é uma tecnologia de comunicação por aproximação, a mesma do pagamento por aproximação. Um chip passivo guarda um endereço (link) e não precisa de bateria.'],
      ['O que acontece ao encostar', 'O celular emite um campo de curta distância que alimenta o chip e lê o link gravado nele. O navegador abre esse link, que no AirNext é o seu perfil digital.'],
      ['Compatibilidade', 'A maioria dos smartphones modernos, Android e iPhone, lê NFC. Para quem não tem, o QR Code do produto abre o mesmo perfil.']],
    links: ['cartao-nfc', 'blog/nfc-ou-qr-code'] },
  { slug: 'blog/nfc-ou-qr-code', title: 'NFC ou QR Code: qual escolher? | AirNext',
    desc: 'NFC ou QR Code? Veja as diferenças, vantagens de cada um e por que os produtos AirNext trazem os dois juntos.',
    h1: 'NFC ou QR Code: qual é melhor?', kind: 'Guia',
    body: [['NFC', 'Leitura por aproximação, rápida e sem abrir a câmera. Exige celular com NFC e o chip precisa estar à vista do usuário.'],
      ['QR Code', 'Funciona em qualquer celular com câmera e pode ser impresso em qualquer lugar, mas exige abrir a câmera e enquadrar o código.'],
      ['Por que os dois', 'Os produtos AirNext trazem chip NFC e QR Code juntos: quem tem NFC encosta, e quem não tem escaneia. O destino é o mesmo perfil digital.']],
    links: ['cartao-nfc', 'blog/como-funciona-cartao-nfc'] },
];
const T = Object.fromEntries(PAGES.map(p => [p.slug, p.h1]));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const css = `*{box-sizing:border-box}body{margin:0;font:17px/1.7 system-ui,Segoe UI,Roboto,sans-serif;background:#05070f;color:#e5e7eb}a{color:#4ade80}header,main,footer{max-width:760px;margin:auto;padding:20px}header a{font-weight:700;text-decoration:none;font-size:20px;color:#fff}h1{font-size:2rem;line-height:1.2;color:#fff}h2{margin-top:2rem;color:#fff}.cta{display:inline-block;background:#22c55e;color:#04210f;padding:12px 22px;border-radius:999px;font-weight:700;text-decoration:none;margin:12px 12px 0 0}.cta.alt{background:transparent;border:1px solid #4ade80;color:#4ade80}footer{color:#9ca3af;font-size:14px}`;

function render(p) {
  const url = `${SITE}/${p.slug}/`;
  const loc = LOCAL && p.kind === 'Produto' ? `<p>Atendimento e vendas: ${esc(LOCAL)} e todo o Brasil.</p>` : '';
  const ld = [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'AirNext', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: p.h1, item: url }] }];
  if (p.faq) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)}</title><meta name="description" content="${esc(p.desc)}"><link rel="canonical" href="${url}"><meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="article"><meta property="og:site_name" content="AirNext"><meta property="og:locale" content="pt_BR"><meta property="og:title" content="${esc(p.title)}"><meta property="og:description" content="${esc(p.desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.png"><style>${css}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script></head><body>
<header><a href="/">AirNext</a></header><main><h1>${esc(p.h1)}</h1><p>${esc(p.desc)}</p>
${p.body.map(([h, t]) => `<h2>${esc(h)}</h2><p>${esc(t)}</p>`).join('\n')}
${p.faq ? '<h2>Perguntas frequentes</h2>' + p.faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('') : ''}
${loc}<a class="cta" href="${WA}">Falar no WhatsApp</a><a class="cta alt" href="/#produtos">Ver produtos</a>
<h2>Leia também</h2><ul>${p.links.map(l => `<li><a href="/${l}/">${esc(T[l])}</a></li>`).join('')}</ul></main>
<footer>© AirNext — Cartões, tags e pulseiras NFC com perfis digitais. <a href="/">Página inicial</a></footer></body></html>`;
}

for (const p of PAGES) {
  const dir = path.join(OUT, p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), render(p));
}
const smPath = path.join(OUT, 'sitemap.xml');
let sm = fs.readFileSync(smPath, 'utf8');
const entries = PAGES.map(p => `  <url>\n    <loc>${SITE}/${p.slug}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${p.kind === 'Produto' ? '0.8' : '0.6'}</priority>\n  </url>\n`).join('');
fs.writeFileSync(smPath, sm.replace('</urlset>', entries + '</urlset>'));
console.log(`prerender: ${PAGES.length} páginas geradas`);
