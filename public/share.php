<?php
// Prévia de links (WhatsApp, Instagram, Facebook, Telegram, LinkedIn, X, Discord, iMessage…)
// para cada perfil /u/:slug e /p/:slug. Os robôs desses apps NÃO executam JavaScript, então o
// .htaccess desvia só os robôs para este arquivo; pessoas comuns continuam vendo o site normal.
//
// ✏️ PREENCHA as 2 linhas abaixo com os MESMOS valores do seu .env (VITE_SUPABASE_URL e
// VITE_SUPABASE_ANON_KEY). A chave "anon" já é pública (vai no código do site), pode ficar aqui.

// >>> SE as 2 linhas 'const SUPABASE_URL' e 'const SUPABASE_ANON_KEY' (com os seus valores) NÃO estiverem neste arquivo, COLE-AS AQUI <<<
const SUPABASE_URL = 'https://vojalkxquanqfaitwlmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvamFsa3hxdWFucWZhaXR3bG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MzQ1MTEsImV4cCI6MjA5OTAxMDUxMX0.Lb7toNZdPGUK-ZE0Oc_8PjE8_Uk3gma3Ksw80KBk3A0';

// Navegador interno de apps (Instagram, Snapchat...) NÃO é robô de prévia: entrega o site normal (index.html).
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
$isCrawler = preg_match('/facebookexternalhit|facebot|meta-externalagent|whatsapp|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|skypeuripreview|snap url preview|embedly|redditbot|iframely|vkshare|bitlybot|applebot|googlebot|bingbot|linkpreview/i', $ua);
if (!$isCrawler && preg_match('/instagram|snapchat|pinterest|viber|tumblr|fban|fbav/i', $ua) && is_file(__DIR__ . '/index.html')) {
  header('Content-Type: text/html; charset=utf-8');
  header('Cache-Control: private, no-store');
  header('Vary: User-Agent');
  readfile(__DIR__ . '/index.html');
  exit;
}

const SITE = 'https://airnext.com.br';

function e($s) { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function clip($s, $n) { return mb_strlen($s) > $n ? rtrim(mb_substr($s, 0, $n - 1)) . '…' : $s; }

// ⚠️ Mantenha em sincronia com src/config/shareText.ts (profilePreview).
function preview($cat, $name, $cargo, $bio) {
  $n = trim($name);
  // Texto do próprio perfil (sem quebras de linha); categorias sensíveis nunca usam a bio.
  $own = clip(trim(preg_replace('/\s+/u', ' ', (string)$bio)), 160);
  switch ($cat) {
    case 'BUSINESS':
      return [$n !== '' ? $n : 'Cartão de visita digital da empresa',
              $own !== '' ? $own : 'Contatos, localização, horários e links da empresa em um só lugar. Toque para ver.'];
    case 'PET':
      return [$n ? "$n — perfil do pet" : 'Perfil do pet',
              $own !== '' ? $own : 'Identificação digital do pet: contato do tutor e informações importantes. Se encontrou, toque para ajudar.'];
    case 'KIDS':
      return [$n ? "$n — perfil de segurança" : 'Perfil de segurança infantil',
              'Contatos de emergência dos responsáveis e informações importantes. Toque para ver.'];
    case 'SENIOR':
      return [$n ? "$n — perfil de cuidado" : 'Perfil de cuidado',
              'Contatos de emergência e informações de saúde essenciais. Toque para ver.'];
    case 'TEA':
      return [$n ? "$n — cartão de apoio" : 'Cartão de apoio TEA',
              'Como se comunicar e ajudar com respeito, e contatos dos responsáveis. Toque para ver.'];
    default:
      return [$n !== '' ? ($n . ($cargo ? " · $cargo" : '')) : 'Cartão de visita digital',
              $own !== '' ? $own : 'Veja meus contatos, redes e links e salve meu contato no celular com um toque.'];
  }
}

$slug = $_GET['slug'] ?? '';
$prefix = (($_GET['p'] ?? 'u') === 'p') ? 'p' : 'u';
$url = SITE . "/$prefix/" . rawurlencode($slug);

$title = 'AirNext NFC | Conecta o físico ao digital';
$desc = 'NFC + QR Code em um único perfil: links, contato e muito mais. Feito para negócios, pets e pessoas. Saiba mais.';
$image = SITE . '/og-image.png';
$imgW = 1200; $imgH = 630; $card = 'summary_large_image';
$siteName = 'AirNext';   // Perfis públicos trocam isto pelo nome do próprio perfil.
$hasImage = true;        // Perfis de criança/idoso/TEA ficam sem imagem (privacidade).
$isProfile = false;

// Só para o Instagram (página inicial): usa a arte quadrada "Seu mundo, com um toque".
if (($_GET['home'] ?? '') === '1') {
  $image = SITE . '/og-airnext.jpg'; $imgW = 1200; $imgH = 1200; $card = 'summary';
  $url = SITE . '/';
  $slug = '';
}

if (preg_match('/^[A-Za-z0-9_-]{1,80}$/', $slug) && strpos(SUPABASE_URL, 'COLE_AQUI') === false) {
  $q = SUPABASE_URL . '/rest/v1/products?slug=eq.' . rawurlencode($slug)
     . '&status=eq.ATIVO&select=category,visibility,expires_at,profile_data&limit=1';
  $ch = curl_init($q);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 4,
    CURLOPT_HTTPHEADER => ['apikey: ' . SUPABASE_ANON_KEY, 'Authorization: Bearer ' . SUPABASE_ANON_KEY],
  ]);
  $raw = curl_exec($ch);
  $ok = curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200;
  curl_close($ch);
  $rows = $ok ? json_decode($raw, true) : null;
  $row = $rows[0] ?? null;
  $expired = $row && !empty($row['expires_at']) && strtotime($row['expires_at']) < time();
  if ($row && !$expired && !in_array($row['visibility'] ?? '', ['private', 'hidden'], true)) {
    $d = $row['profile_data'] ?? [];
    $cat = $row['category'] ?? 'PERSONAL';
    $profName = trim((string)($d['nome'] ?? ($d['nomeEmpresa'] ?? '')));
    $bioTxt = !empty($d['bio']) ? $d['bio'] : ($d['descricao'] ?? '');
    [$title, $desc] = preview($cat, $profName, $d['cargo'] ?? '', $bioTxt);
    $isProfile = true;
    $siteName = $profName !== '' ? $profName : $title;
    // Privacidade: fotos de crianças, idosos e pessoas no espectro NÃO vão para a prévia pública.
    // Nesses casos a prévia fica só com texto (nunca cai na imagem da AirNext).
    $photoOk = in_array($cat, ['PERSONAL', 'BUSINESS', 'PET'], true);
    $hasImage = false;
    $imgW = 0; $imgH = 0; $card = 'summary';
    $foto = $d['foto'] ?? '';
    $capa = $d['capa'] ?? '';
    if ($photoOk && is_string($foto) && preg_match('#^https://#i', $foto)) {
      $image = $foto; $hasImage = true;                       // foto de perfil (normalmente quadrada)
    } elseif ($photoOk && is_string($capa) && preg_match('#^https://#i', $capa)) {
      $image = $capa; $hasImage = true; $card = 'summary_large_image';  // capa (3:1)
    }
  }
}

if (!$isProfile && stripos($title, 'AirNext') === false) $title .= ' | AirNext';
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: private, no-store');
header('Vary: User-Agent');
?><!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<title><?= e($title) ?></title>
<meta name="description" content="<?= e($desc) ?>"/>
<link rel="canonical" href="<?= e($url) ?>"/>
<meta property="og:site_name" content="<?= e($siteName) ?>"/><meta property="og:locale" content="pt_BR"/>
<meta property="og:type" content="<?= $isProfile ? 'profile' : 'website' ?>"/><meta property="og:url" content="<?= e($url) ?>"/>
<meta property="og:title" content="<?= e($title) ?>"/><meta property="og:description" content="<?= e($desc) ?>"/>
<?php if ($hasImage): ?><meta property="og:image" content="<?= e($image) ?>"/><?php if ($imgW): ?><meta property="og:image:width" content="<?= $imgW ?>"/><meta property="og:image:height" content="<?= $imgH ?>"/><?php endif; ?><meta property="og:image:alt" content="<?= e($title) ?>"/><?php endif; ?>
<meta name="twitter:card" content="<?= $card ?>"/><meta name="twitter:title" content="<?= e($title) ?>"/>
<meta name="twitter:description" content="<?= e($desc) ?>"/>
<?php if ($hasImage): ?><meta name="twitter:image" content="<?= e($image) ?>"/><?php endif; ?>
</head><body><h1><?= e($title) ?></h1><p><?= e($desc) ?></p><a href="<?= e($url) ?>">Abrir perfil</a></body></html>
