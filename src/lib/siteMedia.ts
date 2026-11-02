// ============================================================================
// siteMedia.ts
// ----------------------------------------------------------------------------
// Substitui o antigo esquema de localStorage do Admin de Mídia. Agora as
// trocas de imagem/vídeo ficam salvas numa tabela do Supabase (site_images),
// e os arquivos enviados do computador vão pro Supabase Storage (bucket
// "site-media") — assim a troca aparece pra QUALQUER visitante, em QUALQUER
// servidor onde o site for publicado, não só no navegador de quem editou.
//
// Requer rodar o script supabase/site_images.sql uma vez no seu projeto
// (cria a tabela, o bucket e as policies).
// ============================================================================

import { supabase } from './supabase';

const TABLE = 'site_images';
const BUCKET = 'site-media';

export interface SiteImageRow {
  id: string;
  url: string;
  updated_at: string;
}

/** Busca todas as trocas salvas (id do slot -> url). */
export async function fetchSiteImageOverrides(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from(TABLE).select('id, url');

  if (error) {
    console.error('Erro ao buscar imagens do site:', error.message);
    return {};
  }

  return Object.fromEntries((data ?? []).map((row) => [row.id, row.url]));
}

/** Salva/atualiza a url de um slot (id) na tabela. */
export async function saveSiteImageOverride(
  id: string,
  url: string
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id, url, updated_at: new Date().toISOString() });

  if (error) return { error: error.message };
  return {};
}

/** Remove a troca de um slot (volta a usar o padrão do código). */
export async function deleteSiteImageOverride(id: string): Promise<{ error?: string }> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) return { error: error.message };
  return {};
}

/** Remove TODAS as trocas salvas. */
export async function deleteAllSiteImageOverrides(): Promise<{ error?: string }> {
  // "id neq ''" pra apagar todas as linhas (o Supabase exige algum filtro no delete).
  const { error } = await supabase.from(TABLE).delete().neq('id', '');
  if (error) return { error: error.message };
  return {};
}

/**
 * Faz upload de um arquivo (enviado do computador) pro Storage e devolve a
 * URL pública já pronta pra salvar na tabela.
 */
const MAX_IMAGE_SIDE = 1600;       // mais que isso não aparece em nenhuma tela do site
const OPTIMIZE_ABOVE_BYTES = 300 * 1024;

/**
 * Foto grande (ex.: PNG de 1,8 MB) vira WebP com no máximo 1600px — a mesma imagem para o visitante,
 * mas ~10x mais leve. GIF/SVG/vídeo e imagens já pequenas passam direto. Se algo falhar, envia o original.
 */
async function optimizeImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || /gif|svg/.test(file.type) || file.size <= OPTIMIZE_ABOVE_BYTES) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/webp', 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
  } catch {
    return file;
  }
}

export async function uploadSiteMedia(
  slotId: string,
  originalFile: File
): Promise<{ url: string | null; error?: string }> {
  try {
    const file = await optimizeImage(originalFile);
    const ext = file.name.split('.').pop()?.toLowerCase() || (file.type.startsWith('video') ? 'mp4' : 'jpg');
    const path = `${slotId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      cacheControl: '31536000', // o nome do arquivo muda a cada envio, então pode ficar 1 ano no cache
      upsert: true,
    });

    if (uploadError) return { url: null, error: uploadError.message };

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return { url: publicUrl };
  } catch (err: any) {
    console.error(err);
    return { url: null, error: err?.message || 'Erro ao enviar arquivo.' };
  }
}
