import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_IMAGES } from '../config/site-images';

const STORAGE_KEY = 'airnext_site_images_v1';

function loadOverrides(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Hook único usado em dois lugares:
 *  1) Na LandingPage, para "resolver" cada <img src={...}> (usa o que foi
 *     salvo no admin, ou cai no valor padrão que já estava no código).
 *  2) No painel /admin/imagens, para listar, trocar e resetar cada imagem.
 */
export function useSiteImages() {
  const [overrides, setOverrides] = useState<Record<string, string>>(() => loadOverrides());

  // Mantém sincronizado se o admin for aberto em outra aba
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setOverrides(loadOverrides());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setImage = useCallback((id: string, url: string) => {
    setOverrides((prev) => {
      const next = { ...prev, [id]: url };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetImage = useCallback((id: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setOverrides({});
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
  };
}
