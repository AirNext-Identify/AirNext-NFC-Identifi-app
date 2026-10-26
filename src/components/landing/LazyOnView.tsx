import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';

// Seções que o visitante já viu nesta sessão: ao voltar de outra página elas montam na hora,
// então a página tem a altura de antes e a rolagem volta exatamente onde estava.
const seen = new Set<string>();

/** Só monta (e baixa) o conteúdo quando a seção está perto da tela. Reduz JS inicial e trabalho no celular. */
export default function LazyOnView({ id, minHeight = 700, children }: { id: string; minHeight?: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(() => seen.has(id));
  useEffect(() => {
    if (show) { seen.add(id); return; }
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setShow(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); io.disconnect(); } }, { rootMargin: '900px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [show, id]);
  if (show) return <Suspense fallback={<div style={{ minHeight }} />}>{children}</Suspense>;
  return <div ref={ref} id={id} style={{ minHeight }} />;
}
