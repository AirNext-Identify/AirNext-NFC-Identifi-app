import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Controla o scroll do site inteiro:
 *  - voltar (botão do navegador / gesto) devolve a página exatamente onde o visitante parou,
 *    sem recarregar nem pular para o topo;
 *  - abrir uma página nova começa no topo; abrir "/#secao" rola até a seção;
 *  - links internos "#secao" rolam suavemente SEM empilhar entradas no histórico e SEM apagar
 *    o estado do React Router (era isso que fazia "clicar no menu e voltar" se perder).
 */
const STORAGE_KEY = 'airnext:scroll:v2';
const MAX_ENTRIES = 60;

type PositionMap = Record<string, number>;

function readMap(): PositionMap {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}') as PositionMap; } catch { return {}; }
}
function writeMap(map: PositionMap) {
  try {
    const keys = Object.keys(map);
    if (keys.length > MAX_ENTRIES) keys.slice(0, keys.length - MAX_ENTRIES).forEach((k) => delete map[k]);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch { /* storage indisponível: segue sem restaurar */ }
}

const jump = (top: number) => window.scrollTo({ top, left: 0, behavior: 'instant' as ScrollBehavior });

export default function ScrollManager() {
  const location = useLocation();
  const navType = useNavigationType();
  const keyRef = useRef(location.key);

  // Nós cuidamos da restauração (o navegador restauraria antes do conteúdo "preguiçoso" existir).
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);

  // Guarda a posição da entrada atual do histórico enquanto o visitante rola.
  useEffect(() => {
    let raf = 0;
    const save = () => {
      raf = 0;
      // Menu aberto: o <body> fica position:fixed e scrollY vira 0 — não é a posição real do visitante.
      if (document.body.style.position === 'fixed') return;
      const map = readMap();
      map[keyRef.current] = window.scrollY;
      writeMap(map);
    };
    const onScroll = () => { if (!raf) raf = window.requestAnimationFrame(save); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', save);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', save);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  // A cada mudança de página: restaura (voltar), rola até a seção (#hash) ou vai ao topo.
  useLayoutEffect(() => {
    keyRef.current = location.key;
    const hash = decodeURIComponent(location.hash.replace(/^#/, ''));
    const saved = navType === 'POP' ? readMap()[location.key] : undefined;

    if (saved === undefined && !hash) { jump(0); return; }

    let cancelled = false;
    let timer = 0;
    let tries = 0;
    const stop = () => { cancelled = true; window.clearTimeout(timer); };

    // Se o visitante mexer na tela enquanto esperamos o conteúdo carregar, não brigamos com ele.
    const events: Array<keyof WindowEventMap> = ['wheel', 'touchstart', 'keydown', 'mousedown'];
    events.forEach((e) => window.addEventListener(e, stop, { passive: true, once: true }));

    const tick = () => {
      if (cancelled) return;
      tries += 1;
      if (saved !== undefined) {
        // As seções da landing carregam sob demanda: a página cresce aos poucos, então repetimos
        // até ela ter altura suficiente para chegar na posição salva.
        const max = document.documentElement.scrollHeight - window.innerHeight;
        jump(Math.min(saved, Math.max(0, max)));
        if (Math.abs(window.scrollY - saved) <= 2 || tries > 50) return;
      } else {
        const el = document.getElementById(hash);
        if (el) { el.scrollIntoView({ block: 'start' }); return; }
        if (tries > 50) return;
      }
      timer = window.setTimeout(tick, 100);
    };
    tick();

    return () => {
      stop();
      events.forEach((e) => window.removeEventListener(e, stop));
    };
  }, [location.key, location.pathname, location.hash, navType]);

  // Links internos (#secao): rolagem suave, sem criar entrada no histórico e preservando o state do Router.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) return;
      const id = decodeURIComponent(url.hash.slice(1));
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try { window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash); } catch { /* ignore */ }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
