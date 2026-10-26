import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_IMAGES } from '../config/site-images';
import { supabase } from '../lib/supabase';
import {
  deleteAllSiteImageOverrides,
  deleteSiteImageOverride,
  fetchSiteImageOverrides,
  saveSiteImageOverride,
} from '../lib/siteMedia';

/**
 * Hook único usado em dois lugares:
 *  1) Na LandingPage, para "resolver" cada <img src={...}> (usa o que foi
 *     salvo no admin, ou cai no valor padrão que já estava no código).
 *  2) No painel /admin/imagens, para listar, trocar e resetar cada imagem.
 *
 * As trocas ficam salvas no Supabase (tabela `site_images`), não mais no
 * localStorage — assim aparecem pra qualquer visitante, em qualquer servidor
 * onde o site for publicado (veja src/lib/siteMedia.ts e supabase/site_images.sql).
 */
export function useSiteImages(options: { realtime?: boolean } = {}) {
  const realtime = options.realtime === true;
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    fetchSiteImageOverrides().then((data) => {
      if (mounted.current) {
        setOverrides(data);
        setLoading(false);
      }
    });
    return () => {
      mounted.current = false;
    };
  }, []);

  // Mantém sincronizado em tempo real — se alguém trocar uma imagem no admin
  // (em outra aba, outro navegador ou outro servidor), quem já está com o
  // site aberto recebe a atualização sozinho, sem precisar recarregar.
  // Só o painel de imagens precisa disso. No site público o WebSocket só gerava erro no console
  // (e custo de conexão) para o visitante, que já recebe as imagens atuais ao abrir a página.
  useEffect(() => {
    if (!realtime) return;
    // Conexão em tempo real só depois do carregamento inicial (não compete com o primeiro desenho da tela).
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const timer = window.setTimeout(() => {
    channel = supabase
      .channel('site_images_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_images' }, (payload) => {
        setOverrides((prev) => {
          const next = { ...prev };
          if (payload.eventType === 'DELETE') {
            delete next[(payload.old as any).id];
          } else {
            const row = payload.new as { id: string; url: string };
            next[row.id] = row.url;
          }
          return next;
        });
      })
      .subscribe();
    }, 4000);

    return () => {
      window.clearTimeout(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [realtime]);

  const setImage = useCallback(async (id: string, url: string) => {
    // Atualiza a tela na hora (otimista) e só depois confirma no servidor.
    setOverrides((prev) => ({ ...prev, [id]: url }));
    const { error } = await saveSiteImageOverride(id, url);
    if (error) {
      console.error('Erro ao salvar imagem:', error);
      throw new Error(error);
    }
  }, []);

  const resetImage = useCallback(async (id: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    const { error } = await deleteSiteImageOverride(id);
    if (error) console.error('Erro ao restaurar imagem:', error);
  }, []);

  const resetAll = useCallback(async () => {
    setOverrides({});
    const { error } = await deleteAllSiteImageOverrides();
    if (error) console.error('Erro ao restaurar todas as imagens:', error);
  }, []);

  /** Usado dentro da LandingPage: resolve(id, fallbackQueJaEstavaNoCodigo) */
  const resolve = useCallback(
    (id: string, fallback?: string) => overrides[id] || DEFAULT_IMAGES[id] || fallback || '',
    [overrides]
  );

  return {
    images: { ...DEFAULT_IMAGES, ...overrides },
    resolve,
    setImage,
    resetImage,
    resetAll,
    loading,
  };
}
