// api/og.mjs
//
// Por que isso existe:
// A AirNext é uma SPA (React/Vite). As meta tags de cada perfil público
// (/u/:slug e /p/:slug) são escritas no <head> via JavaScript (ver
// src/components/Seo.tsx). Isso funciona perfeitamente para quem abre o
// link no navegador — mas o WhatsApp, Facebook, Instagram, Telegram,
// LinkedIn etc. NÃO executam JavaScript quando geram a prévia do link:
// eles só leem o HTML bruto que o servidor devolve. Como o index.html é
// sempre o mesmo (genérico), toda vez que alguém compartilhava um perfil
// específico, a prévia mostrava só "AirNext" genérico — nunca a foto, o
// nome ou a descrição daquela pessoa/perfil.
//
// Esta função roda só para bots de rede social (ver BOT_UA abaixo) e
// devolve um HTML mínimo, sem JS, já com as meta tags corretas (og:title,
// og:description, og:image) buscando os dados reais do Supabase. Pessoas
// normais nunca caem aqui — o vercel.json só manda o bot para esta rota;
// o navegador comum continua indo direto para a SPA de sempre.

const SITE_URL = (process.env.VITE_SITE_URL || 'https://airnext-xi.vercel.app').replace(/\/$/, '');
const SITE_NAME = 'AirNext';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION =
  'AirNext transforma cartões, tags e pulseiras NFC em perfis digitais inteligentes. Compartilhe contatos, pet, kids, TEA e negócios com um toque.';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveImage(src) {
  if (!src || typeof src !== 'string' || src.startsWith('data:')) return DEFAULT_OG_IMAGE;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('//')) return `https:${src}`;
  return `${SITE_URL}${src.startsWith('/') ? src : `/${src}`}`;
}

async function fetchProfile(slug) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !slug) return null;

  const url =
    `${SUPABASE_URL}/rest/v1/products` +
    `?slug=eq.${encodeURIComponent(slug)}` +
    `&status=eq.ATIVO` +
    `&select=status,expires_at,category,visibility,profile_data`;

  const resp = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!resp.ok) return null;
  const rows = await resp.json();
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;

  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return null;
  if (row.visibility === 'private' || row.visibility === 'hidden') return null;

  return { category: row.category, data: row.profile_data || {} };
}

function buildMeta({ slug, type, profile }) {
  const path = `/${type}/${slug}`;
  const canonicalUrl = `${SITE_URL}${path}`;

  if (!profile) {
    return {
      title: `${SITE_NAME} — Cartões NFC e Perfis Digitais`,
      description: DEFAULT_DESCRIPTION,
      image: DEFAULT_OG_IMAGE,
      url: canonicalUrl,
    };
  }

  const d = profile.data || {};
  const name = d.name || d.nome || '';
  const cargo = d.cargo || d.jobTitle || '';
  const bio = (d.bio && String(d.bio).trim()) || (d.descricao && String(d.descricao).trim());

  const title = name ? `${name}${cargo ? ` — ${cargo}` : ''} · ${SITE_NAME}` : `Perfil · ${SITE_NAME}`;

  let description;
  if (bio) {
    description = bio;
  } else if (profile.category === 'PET' && d.raca) {
    description = `Pet ${name || ''} · ${d.raca}. Contato do tutor e dados no perfil AirNext.`;
  } else if (profile.category === 'TEA') {
    description = `Perfil TEA de ${name || 'usuário'} — orientações de apoio e contatos no AirNext.`;
  } else {
    description = `Perfil digital ${name || ''} na ${SITE_NAME}. Contatos e informações em um toque.`;
  }
  description = description.slice(0, 180);

  const image = resolveImage(d.foto || d.capa);

  return { title, description, image, url: canonicalUrl };
}

function renderHtml({ title, description, image, url }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${t}</title>
<meta name="description" content="${d}" />
<link rel="canonical" href="${url}" />

<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:type" content="profile" />
<meta property="og:title" content="${t}" />
<meta property="og:description" content="${d}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:secure_url" content="${image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="pt_BR" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${d}" />
<meta name="twitter:image" content="${image}" />

<meta http-equiv="refresh" content="0; url=${url}" />
</head>
<body>
<p><a href="${url}">${t}</a></p>
</body>
</html>`;
}

export default async function handler(req, res) {
  try {
    const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
    const slug = searchParams.get('slug') || '';
    const type = searchParams.get('type') === 'p' ? 'p' : 'u';

    const profile = await fetchProfile(slug);
    const meta = buildMeta({ slug, type, profile });
    const html = renderHtml(meta);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400');
    res.status(200).send(html);
  } catch (err) {
    // Em qualquer erro, cai para uma prévia genérica em vez de quebrar o link
    const meta = buildMeta({ slug: '', type: 'u', profile: null });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(renderHtml(meta));
  }
}
