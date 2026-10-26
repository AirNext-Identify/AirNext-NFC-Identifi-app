// Gera páginas estáticas de SEO em dist/ após o `vite build`. Edite PAGES para mudar textos.
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://airnext.com.br';
const WA = 'https://wa.me/5547996287761';
const IG = 'https://www.instagram.com/airnext.com.br/';
const EMAIL = 'contato@airnext.com.br';
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
  { slug: 'tag-nfc-pet', title: 'Pet NFC AirNext: tag NFC para pet na coleira | AirNext',
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
  { slug: 'coleira-inteligente-airnext', title: 'Coleira Inteligente AirNext: coleira com tag NFC para pet',
    desc: 'Coleira inteligente AirNext com tag NFC e QR Code: quem encontrar seu pet aproxima o celular e vê seus contatos, sem bateria e sem aplicativo.',
    h1: 'Coleira inteligente AirNext para o seu pet', kind: 'Produto',
    body: [['O que é a coleira inteligente', 'É a coleira do seu pet com uma tag NFC e QR Code ligada a um perfil digital. Quem encontra o animal aproxima o celular e abre seus contatos para avisar você.'],
      ['Por que escolher a AirNext', 'A tag não usa bateria, funciona em celulares com NFC ou câmera e o perfil pode ser atualizado a qualquer momento, sem trocar a coleira.']],
    faq: [['Como funciona a coleira inteligente AirNext?', 'Uma tag NFC com QR Code abre o perfil do pet quando alguém aproxima o celular ou escaneia o código.'], ['Precisa carregar a coleira?', 'Não. O chip NFC é passivo e não usa bateria.']],
    links: ['tag-nfc-pet', 'stand-nfc-airnext'] },
  { slug: 'stand-nfc-airnext', title: 'Stand AirNext: stand NFC com QR Code para balcão e mesa',
    desc: 'Stand AirNext com NFC e QR Code: exponha seu perfil, contato ou página de avaliação e deixe o cliente acessar com um toque.',
    h1: 'Stand AirNext: seu perfil digital sempre à vista', kind: 'Produto',
    body: [['Para que serve o stand', 'O stand fica no balcão ou na mesa com chip NFC e QR Code. O cliente aproxima o celular e abre seu perfil, WhatsApp, redes sociais ou a página que você definir.'],
      ['Onde usar', 'Lojas, clínicas, restaurantes, salões e eventos, em qualquer lugar onde você queira ser encontrado com um toque.']],
    faq: [['O stand AirNext tem NFC e QR Code?', 'Sim. Os produtos AirNext trazem chip NFC e QR Code juntos.'], ['Posso mudar o destino depois?', 'Sim. O perfil é editável pelo painel, e o stand continua o mesmo.']],
    links: ['placa-google-avaliacao-nfc', 'cartao-nfc'] },
  { slug: 'sobre-a-airnext', title: 'AirNext: o que é, produtos e contato',
    desc: 'AirNext cria cartões, coleira inteligente, pet NFC, stand, pulseiras e placas NFC com QR Code ligados a perfis digitais. Conheça e fale com a gente.',
    h1: 'AirNext: conectando o físico ao digital', kind: 'Guia',
    body: [['Quem é a AirNext', 'A AirNext transforma objetos do dia a dia em perfis digitais com NFC e QR Code: cartões de visita, coleira inteligente para pets, stand, pulseiras e placas de avaliação.'],
      ['Contato', `Fale pelo WhatsApp, por e-mail em ${EMAIL} ou pelo Instagram @airnext.com.br.`]],
    links: ['cartao-nfc', 'coleira-inteligente-airnext'] },
];
const T = Object.fromEntries(PAGES.map(p => [p.slug, p.h1]));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const IMGS = {
  c1: ['/img/airnext-contato-1.webp', 720, 960, 'Duas pessoas trocando contato ao aproximar os celulares'],
  c2: ['/img/airnext-contato-2.webp', 720, 960, 'Cliente aproximando o celular da tag AirNext'],
  c3: ['/img/airnext-contato-3.webp', 720, 960, 'Celular lendo a tag NFC AirNext e abrindo o perfil digital'],
  c4: ['/img/airnext-contato-4.webp', 720, 960, 'Perfil digital AirNext aberto no celular'],
  google: ['/img/google-branca-parede.webp', 640, 640, 'Placa NFC AirNext para avaliações no Google'],
  stand: ['/img/stand-posto.webp', 640, 640, 'Stand AirNext com NFC e QR Code'],
};
const HERO = { 'cartao-nfc': 'c1', 'pulseira-nfc': 'c3', 'placa-google-avaliacao-nfc': 'google', 'stand-nfc-airnext': 'stand', 'sobre-a-airnext': 'c3', 'blog/como-funciona-cartao-nfc': 'c2', 'blog/nfc-ou-qr-code': 'c1' };
const THUMB = { ...HERO, 'tag-nfc-pet': 'c3', 'coleira-inteligente-airnext': 'c3' };
const GAL = new Set(['cartao-nfc', 'pulseira-nfc', 'sobre-a-airnext', 'blog/como-funciona-cartao-nfc', 'blog/nfc-ou-qr-code']);
const CAPS = [['c1', 'Seu contato a um toque', 'Aproxime e o perfil abre no celular.'], ['c2', 'Em qualquer lugar', 'Reuniões, eventos e balcões.'], ['c3', 'Tudo em uma tela', 'WhatsApp, e-mail, site e redes.'], ['c4', 'Sempre atualizado', 'Mude os dados quando quiser.']];
const img = (k, attrs = '') => { const [s, w, h, a] = IMGS[k]; return `<img src="${s}" width="${w}" height="${h}" alt="${esc(a)}" ${attrs}>`; };

const css = `:root{--bg:#04060d;--card:#0b1020;--line:#1b2440;--txt:#e6e9f2;--mut:#98a2bd;--blue:#3b82f6;--cy:#22d3ee}*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;font:16px/1.7 Inter,system-ui,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--txt)}a{color:inherit}
.top{position:sticky;top:0;z-index:20;backdrop-filter:blur(14px);background:#04060dcc;border-bottom:1px solid var(--line)}.top>div{max-width:1080px;margin:auto;padding:12px 20px;display:flex;justify-content:space-between;align-items:center}
.logo{font-weight:800;font-size:22px;text-decoration:none;font-style:italic}.logo b{color:var(--blue)}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:12px 24px;border-radius:999px;font-weight:700;text-decoration:none;color:#fff;background:#2563eb;transition:transform .2s}.btn:hover{transform:translateY(-2px)}.btn.alt{background:transparent;border:1px solid var(--line);box-shadow:none}.btn.sm{padding:8px 18px;font-size:14px}
main{max-width:1080px;margin:auto;padding:0 20px}.hero{display:grid;gap:32px;padding:44px 0 16px;align-items:center}@media(min-width:860px){.hero{grid-template-columns:1.1fr .9fr;padding:72px 0 32px}}
.eyebrow{display:inline-block;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--cy);border:1px solid var(--line);padding:4px 12px;border-radius:999px}
h1{font-size:clamp(2rem,5.4vw,3.4rem);line-height:1.08;margin:16px 0;font-weight:800;letter-spacing:-.02em}.lead{color:var(--mut);font-size:1.1rem;margin:0 0 20px}.acts{display:flex;gap:12px;flex-wrap:wrap}
.ph img{width:100%;height:auto;display:block;border-radius:28px;border:1px solid var(--line)}.ripple{aspect-ratio:1;border-radius:28px;border:1px solid var(--line);display:grid;place-items:center;font-size:56px;font-weight:800;letter-spacing:.06em;background:#0b1020}
.grid{display:grid;gap:16px;margin:28px 0}@media(min-width:760px){.grid{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}}.card{background:#0b1020;border:1px solid var(--line);border-radius:22px;padding:24px}.card h2{margin:0 0 8px;font-size:1.2rem}.card p{margin:0;color:var(--mut)}
h2.s{font-size:1.6rem;margin:44px 0 12px;letter-spacing:-.01em}.slides{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;padding:6px 0 14px;-webkit-overflow-scrolling:touch}.slide{flex:0 0 76%;max-width:330px;scroll-snap-align:center;margin:0}@media(min-width:860px){.slide{flex-basis:23%}}
.slide img{width:100%;height:auto;display:block;border-radius:22px;border:1px solid var(--line)}.slide figcaption{color:var(--mut);font-size:.92rem;padding:10px 4px}.slide b{display:block;color:var(--txt)}
details{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 18px;margin:10px 0}summary{cursor:pointer;font-weight:700}details p{margin:10px 0 0;color:var(--mut)}
.rel{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}.rel a{display:block;padding:18px;border:1px solid var(--line);border-radius:18px;text-decoration:none;background:var(--card);font-weight:600}.rel img{width:100%;height:150px;object-fit:cover;border-radius:12px;margin-bottom:12px;display:block}.rel span{display:block;color:var(--cy);font-size:14px;margin-top:6px}
.cta{margin:48px 0;padding:36px 24px;border-radius:28px;text-align:center;background:#0b1020;border:1px solid var(--line)}.cta h2{margin:0 0 6px;font-size:1.6rem}.cta p{color:var(--mut);margin:0 0 18px}
footer{max-width:1080px;margin:auto;padding:28px 20px 96px;color:var(--mut);font-size:14px;border-top:1px solid var(--line)}.sticky{position:fixed;left:0;right:0;bottom:0;padding:10px 16px;background:#04060dee;backdrop-filter:blur(12px);border-top:1px solid var(--line);z-index:30}.sticky .btn{width:100%}@media(min-width:860px){.sticky{display:none}}`;

function render(p) {
  const url = `${SITE}/${p.slug}/`;
  const loc = LOCAL && p.kind === 'Produto' ? `<p class="lead">Atendimento e vendas: ${esc(LOCAL)} e todo o Brasil.</p>` : '';
  const ld = [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'AirNext', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: p.h1, item: url }] }];
  if (p.faq) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  const hk = HERO[p.slug];
  const visual = hk ? `<div class="ph">${img(hk, 'fetchpriority="high"')}</div>` : '<div class="ripple" aria-hidden="true">NFC</div>';
  const gallery = GAL.has(p.slug) ? `<h2 class="s">Veja como funciona</h2><div class="slides">${CAPS.map(([k, t, d]) => `<figure class="slide">${img(k, 'loading="lazy" decoding="async"')}<figcaption><b>${esc(t)}</b>${esc(d)}</figcaption></figure>`).join('')}</div>` : '';
  const ogImg = hk ? SITE + IMGS[hk][0] : SITE + '/og-image.png';
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#04060d">
<title>${esc(p.title)}</title><meta name="description" content="${esc(p.desc)}"><link rel="canonical" href="${url}"><meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="article"><meta property="og:site_name" content="AirNext"><meta property="og:locale" content="pt_BR"><meta property="og:title" content="${esc(p.title)}"><meta property="og:description" content="${esc(p.desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${ogImg}">
<meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png"><link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><style>${css}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script></head><body>
<header class="top"><div><a class="logo" href="/">Air<b>Next</b></a><a class="btn sm" href="${WA}">WhatsApp</a></div></header>
<main><section class="hero"><div><span class="eyebrow">${esc(p.kind)}</span><h1>${esc(p.h1)}</h1><p class="lead">${esc(p.desc)}</p><div class="acts"><a class="btn" href="${WA}">Falar no WhatsApp</a><a class="btn alt" href="/#produtos">Ver produtos</a></div></div>${visual}</section>
<div class="grid">${p.body.map(([h, t]) => `<article class="card"><h2>${esc(h)}</h2><p>${esc(t)}</p></article>`).join('')}</div>${gallery}
${p.faq ? '<h2 class="s">Perguntas frequentes</h2>' + p.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('') : ''}
${loc}<section class="cta"><h2>Fale com a AirNext</h2><p>Tire dúvidas e peça o seu em poucos minutos.</p><a class="btn" href="${WA}">Chamar no WhatsApp</a></section>
<h2 class="s">Leia também</h2><div class="rel">${p.links.map(l => `<a href="/${l}/">${THUMB[l] ? img(THUMB[l], 'loading="lazy" decoding="async"') : ''}${esc(T[l])}<span>Ler agora</span></a>`).join('')}</div></main>
<footer>© AirNext — Cartões, coleira inteligente, pet NFC, stand e pulseiras NFC. <a href="/">Página inicial</a> · <a href="mailto:${EMAIL}">${EMAIL}</a> · <a href="${IG}">Instagram @airnext.com.br</a></footer>
<div class="sticky"><a class="btn" href="${WA}">Falar no WhatsApp</a></div></body></html>`;
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
