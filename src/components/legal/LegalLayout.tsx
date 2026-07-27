import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import Logo from '../Logo';
import { LEGAL_CONFIG } from '../../config/legal';
import { cn } from '../../utils/cn';

export interface LegalSection {
  id: string;
  label: string;
}

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  version: string;
  sections: LegalSection[];
  children: ReactNode;
}

export function LegalLayout({
  title,
  subtitle,
  lastUpdated,
  version,
  sections,
  children,
}: LegalLayoutProps) {
  const [active, setActive] = useState(sections[0]?.id || '');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(s.id);
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const activeLabel = useMemo(
    () => sections.find((s) => s.id === active)?.label || sections[0]?.label,
    [active, sections]
  );

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 antialiased">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2 opacity-90 transition hover:opacity-100">
            <Logo size="xs" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-zinc-400 sm:flex">
            <Link to="/politica-de-privacidade" className="transition hover:text-white">
              Privacidade
            </Link>
            <Link to="/termos-de-uso" className="transition hover:text-white">
              Termos
            </Link>
            <Link to="/politica-de-cookies" className="transition hover:text-white">
              Cookies
            </Link>
            <Link
              to="/login"
              className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-100"
            >
              Entrar
            </Link>
          </nav>
          <button
            type="button"
            className="rounded-full p-2 text-zinc-300 sm:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 pb-10 pt-16 text-center sm:px-8 sm:pt-24">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          {LEGAL_CONFIG.companyName}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl sm:leading-[1.1]">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-500 sm:text-lg">
          {subtitle}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-400">
          <span>Última atualização: {lastUpdated}</span>
          <span className="hidden h-1 w-1 rounded-full bg-zinc-300 sm:inline-block" />
          <span>Versão: {version}</span>
        </div>
      </section>

      <div className="sticky top-14 z-30 border-b border-zinc-200 bg-[#fafafa]/95 px-5 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-medium text-zinc-800 shadow-sm"
        >
          <span>{activeLabel}</span>
          <ChevronDown className={cn('h-4 w-4 text-zinc-400 transition', mobileOpen && 'rotate-180')} />
        </button>
        {mobileOpen && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className={cn(
                  'block w-full px-4 py-3 text-left text-sm transition',
                  active === s.id
                    ? 'bg-zinc-50 font-semibold text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-50'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-24 pt-6 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16 lg:pt-10">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition',
                  active === s.id
                    ? 'bg-zinc-900 font-medium text-white'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                )}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 space-y-16 sm:space-y-20">{children}</main>
      </div>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-lg font-semibold tracking-tight text-zinc-900">
                {LEGAL_CONFIG.companyName}
              </p>
              <p className="mt-1 text-sm text-zinc-500">{LEGAL_CONFIG.tagline}</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-500">
              <Link to="/politica-de-privacidade" className="hover:text-zinc-900">
                Privacidade
              </Link>
              <Link to="/termos-de-uso" className="hover:text-zinc-900">
                Termos de Uso
              </Link>
              <Link to="/politica-de-cookies" className="hover:text-zinc-900">
                Cookies
              </Link>
              <a href={`mailto:${LEGAL_CONFIG.privacyEmail}`} className="hover:text-zinc-900">
                Contato
              </a>
              <a
                href={`mailto:${LEGAL_CONFIG.privacyEmail}?subject=Solicitar%20meus%20dados`}
                className="hover:text-zinc-900"
              >
                Solicitar meus dados
              </a>
              <a
                href={`mailto:${LEGAL_CONFIG.privacyEmail}?subject=Excluir%20minha%20conta`}
                className="hover:text-zinc-900"
              >
                Excluir minha conta
              </a>
            </div>
          </div>
          <p className="mt-10 text-xs text-zinc-400">
            © {new Date().getFullYear()} {LEGAL_CONFIG.legalName}. Todos os direitos reservados.
          </p>
        </div>
            </footer>
    </div>
  );
}

export function LegalSectionBlock({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">{title}</h2>
      {lead && <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-500">{lead}</p>}
      <div className="mt-8 space-y-6 text-[15px] leading-[1.75] text-zinc-600">{children}</div>
    </section>
  );
}

export function LegalCard({
  title,
  children,
  icon,
}: {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-zinc-300 sm:p-6">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          <div className="mt-2 text-sm leading-relaxed text-zinc-500">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function LegalAccordion({
  items,
}: {
  items: { title: string; content: ReactNode }[];
}) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.title}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 sm:px-6"
              aria-expanded={isOpen}
            >
              {item.title}
              <ChevronDown
                className={cn('h-4 w-4 shrink-0 text-zinc-400 transition', isOpen && 'rotate-180')}
              />
            </button>
            <div
              className={cn(
                'grid transition-all duration-300 ease-out',
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5 text-sm leading-relaxed text-zinc-500 sm:px-6">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
