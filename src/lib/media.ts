// ============================================================================
// media.ts
// ----------------------------------------------------------------------------
// Detecta se uma URL (ou base64 enviado do computador) é vídeo ou imagem,
// olhando a extensão do arquivo ou o prefixo do data URI. Usado nos blocos
// que agora aceitam foto OU vídeo no mesmo espaço (ex: "Veja o AirNext em
// ação"), pra decidir se renderiza <img> ou <video>.
// ============================================================================

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];

export function isVideoUrl(url: string | undefined | null): boolean {
  if (!url) return false;

  // Upload direto do computador vira base64: "data:video/mp4;base64,..."
  if (url.startsWith('data:')) {
    return url.startsWith('data:video');
  }

  // URL normal — verifica a extensão do arquivo, ignorando querystring (?...)
  const clean = url.split('?')[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(ext));
}
