import { useEffect, useState, useCallback } from 'react';

/**
 * Tema da UI interna (dashboard/admin) — diferente dos temas de perfil
 * público que já existem em PublicProfile.tsx.
 *
 * Funciona via atributo `data-theme` na <html>, lido pelas CSS variables
 * definidas em src/index.css (--ui-bg, --ui-surface, --ui-text, etc.).
 *
 * Uso em qualquer componente:
 *   const { theme, setTheme } = useUITheme();
 *   <select value={theme} onChange={e => setTheme(e.target.value as UITheme)}>...
 */
export type UITheme = 'dark' | 'light' | 'neon' | 'minimal';

const STORAGE_KEY = 'airnect-ui-theme';

export function applyUITheme(theme: UITheme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
}

export function getStoredUITheme(): UITheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as UITheme | null;
    if (stored) return stored;
  } catch {}
  return 'dark';
}

export function useUITheme() {
  const [theme, setThemeState] = useState<UITheme>(getStoredUITheme());

  useEffect(() => {
    applyUITheme(theme);
  }, [theme]);

  const setTheme = useCallback((t: UITheme) => setThemeState(t), []);

  return { theme, setTheme };
}
