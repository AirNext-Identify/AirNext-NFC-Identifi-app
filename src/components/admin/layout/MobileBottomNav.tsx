import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, X, LogOut, ArrowLeftCircle, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/adminUtils';
import { menuItems, menuGroups } from '@/components/admin/layout/Sidebar';
import type { AdminModule } from '@/types/admin';

/** Abas fixas da barra inferior; o resto fica em "Mais". */
const PRIMARY: AdminModule[] = ['dashboard', 'orders', 'products', 'lots'];

interface MobileBottomNavProps {
  active: AdminModule;
  onNavigate: (module: AdminModule) => void;
  onLogout: () => void;
  badges?: Partial<Record<AdminModule, number>>;
}

/**
 * Barra de navegação fixa no rodapé — só no celular/tablet (some em lg+, onde
 * vale a Sidebar). Os 4 módulos mais usados ficam na barra; os demais abrem
 * numa folha "Mais" logo acima dela.
 */
export function MobileBottomNav({ active, onNavigate, onLogout, badges }: MobileBottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = PRIMARY.map((id) => menuItems.find((m) => m.id === id)!).filter(Boolean);
  const secondary = menuItems.filter((m) => !PRIMARY.includes(m.id));
  const moreActive = secondary.some((m) => m.id === active);
  const moreBadge = secondary.reduce((sum, m) => sum + (badges?.[m.id] || 0), 0);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoreOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const go = (id: AdminModule) => { setMoreOpen(false); onNavigate(id); };

  return (
    <div className="lg:hidden">
      {moreOpen && (
        <>
          <div className="fixed inset-0 z-[44] bg-black/60 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          <div
            role="dialog"
            aria-label="Mais opções"
            className="fixed inset-x-0 z-[45] max-h-[75dvh] overflow-y-auto overscroll-contain rounded-t-3xl border border-b-0 border-zinc-800 bg-zinc-950 p-4 shadow-2xl"
            style={{ bottom: 'calc(3.75rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-200">Mais opções</p>
              <button onClick={() => setMoreOpen(false)} aria-label="Fechar" className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {menuGroups.map((group) => {
                const items = secondary.filter((m) => group.ids.includes(m.id));
                if (items.length === 0) return null;
                return (
                  <div key={group.label}>
                    <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{group.label}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = active === item.id;
                        const badge = badges?.[item.id] || 0;
                        return (
                          <button
                            key={item.id}
                            onClick={() => go(item.id)}
                            className={cn(
                              'relative flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-[11px] font-medium leading-tight transition-colors',
                              isActive ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200' : 'border-zinc-800 bg-zinc-900 text-zinc-300 active:bg-zinc-800'
                            )}
                          >
                            <Icon className={cn('h-5 w-5', isActive ? 'text-indigo-400' : 'text-zinc-400')} />
                            {item.label}
                            {badge > 0 && (
                              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">{badge}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 space-y-1 border-t border-zinc-900 pt-3">
              <a href="/painel-imagens" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 active:bg-zinc-900">
                <ImageIcon className="h-4 w-4" /> Imagens do site
              </a>
              <Link to="/dashboard" onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 active:bg-zinc-900">
                <ArrowLeftCircle className="h-4 w-4" /> Voltar ao app do cliente
              </Link>
              <button onClick={() => { setMoreOpen(false); onLogout(); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 active:bg-red-500/10">
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </div>
          </div>
        </>
      )}

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-[46] border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <ul className="mx-auto flex h-[3.75rem] max-w-xl items-stretch justify-around px-1">
          {primary.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id || (item.id === 'lots' && active === 'google');
            const badge = badges?.[item.id] || 0;
            return (
              <li key={item.id} className="flex-1">
                <button
                  onClick={() => go(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className="relative flex h-full w-full flex-col items-center justify-center gap-0.5 transition-colors"
                >
                  <span className={cn('relative flex h-7 w-12 items-center justify-center rounded-full transition-colors', isActive && 'bg-indigo-500/15')}>
                    <Icon className={cn('h-[1.35rem] w-[1.35rem]', isActive ? 'text-indigo-400' : 'text-zinc-500')} />
                    {badge > 0 && (
                      <span className="absolute -right-0.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">{badge}</span>
                    )}
                  </span>
                  <span className={cn('text-[10px] font-medium', isActive ? 'text-zinc-100' : 'text-zinc-500')}>{item.label}</span>
                </button>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              className="relative flex h-full w-full flex-col items-center justify-center gap-0.5 transition-colors"
            >
              <span className={cn('relative flex h-7 w-12 items-center justify-center rounded-full transition-colors', (moreOpen || moreActive) && 'bg-indigo-500/15')}>
                <MoreHorizontal className={cn('h-[1.35rem] w-[1.35rem]', moreOpen || moreActive ? 'text-indigo-400' : 'text-zinc-500')} />
                {moreBadge > 0 && (
                  <span className="absolute -right-0.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">{moreBadge}</span>
                )}
              </span>
              <span className={cn('text-[10px] font-medium', moreOpen || moreActive ? 'text-zinc-100' : 'text-zinc-500')}>Mais</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
