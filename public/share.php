<?php
// Prévia de links (WhatsApp, Instagram, Facebook, Telegram, LinkedIn, X, Discord, iMessage…)
// para cada perfil /u/:slug e /p/:slug. Os robôs desses apps NÃO executam JavaScript, então o
// .htaccess desvia só os robôs para este arquivo; pessoas comuns continuam vendo o site normal.
//
// ✏️ PREENCHA as 2 linhas abaixo com os MESMOS valores do seu .env (VITE_SUPABASE_URL e
// VITE_SUPABASE_ANON_KEY). A chave "anon" já é pública (vai no código do site), pode ficar aqui.
const SUPABASE_URL = 'COLE_AQUI_A_VITE_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'COLE_AQUI_A_VITE_SUPABASE_ANON_KEY';

const SITE = 'https://airnext.com.br';

function e($s) { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function clip($s, $n) { return mb_strlen($s) > $n ? rtrim(mb_substr($s, 0, $n - 1)) . '…' : $s; }

// ⚠️ Mantenha em sincronia com src/config/shareText.ts (profilePreview).
function preview($cat, $name, $cargo, $bio) {
  $n = trim($name); $b = clip(trim($bio), 110);
  switch ($cat) {
    case 'BUSINESS':
      return [$n ? "$n — cartão digital" : 'Cartão digital da empresa',
              $b ?: 'Contatos, localização, horários e links em um só lugar. Toque para ver.'];
    case 'PET':
      return [$n ? "$n — perfil do pet" : 'Perfil do pet',
              'Identificação digital do pet: contato do tutor e informações importantes. Se encontrou, toque para ajudar.'];
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
      return [$n ? ($n . ($cargo ? " · $cargo" : '') . ' — cartão digital') : 'Cartão digital',
              $b ?: 'Contatos, redes e links em um só toque. Salve meu contato direto no celular.'];
  }
}

$slug = $_GET['slug'] ?? '';
$prefix = (($_GET['p'] ?? 'u') === 'p') ? 'p' : 'u';
$url = SITE . "/$prefix/" . rawurlencode($slug);

$title = 'AirNext NFC | Conecta o físico ao digital';
$desc = 'NFC + QR Code em um único perfil: links, contato e muito mais. Feito para negócios, pets e pessoas. Saiba mais.';
$image = SITE . '/og-image.png';

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
    [$title, $desc] = preview($cat, $d['nome'] ?? ($d['nomeEmpresa'] ?? ''), $d['cargo'] ?? '', $d['bio'] ?? ($d['descricao'] ?? ''));
    // Privacidade: fotos de crianças, idosos e pessoas no espectro NÃO vão para a prévia pública.
    $photoOk = in_array($cat, ['PERSONAL', 'BUSINESS', 'PET'], true);
    $cand = $d['foto'] ?? ($d['capa'] ?? '');
    if ($photoOk && is_string($cand) && preg_match('#^https://#i', $cand)) $image = $cand;
  }
}

if (stripos($title, 'AirNext') === false) $title .= ' | AirNext';
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=300');
?><!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<title><?= e($title) ?></title>
<meta name="description" content="<?= e($desc) ?>"/>
<link rel="canonical" href="<?= e($url) ?>"/>
<meta property="og:site_name" content="AirNext"/><meta property="og:locale" content="pt_BR"/>
<meta property="og:type" content="profile"/><meta property="og:url" content="<?= e($url) ?>"/>
<meta property="og:title" content="<?= e($title) ?>"/><meta property="og:description" content="<?= e($desc) ?>"/>
<meta property="og:image" content="<?= e($image) ?>"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/>
<meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="<?= e($title) ?>"/>
<meta name="twitter:description" content="<?= e($desc) ?>"/><meta name="twitter:image" content="<?= e($image) ?>"/>
</head><body><h1><?= e($title) ?></h1><p><?= e($desc) ?></p><a href="<?= e($url) ?>">Abrir perfil</a></body></html>
