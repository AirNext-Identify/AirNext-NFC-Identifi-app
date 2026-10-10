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
export async function uploadSiteMedia(
  slotId: string,
  file: File
): Promise<{ url: string | null; error?: string }> {
  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || (file.type.startsWith('video') ? 'mp4' : 'jpg');
    const path = `${slotId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
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
