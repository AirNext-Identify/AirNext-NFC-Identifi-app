/**
 * Layout system do perfil público.
 *
 * Guardamos a escolha por produto em `profile_data.__layout` (mesmo padrão já
 * usado para __primaryColor, __borderRadius, __buttonStyle etc. em
 * src/types/product.ts), então não precisa de migração de banco nem de coluna
 * nova — é só mais um campo dentro do JSON que já existe.
 *
 * INTEGRAÇÃO em src/pages/PublicProfile.tsx (mudança mínima, ~3 linhas):
 *
 *   import { getLayoutClasses, ProfileLayout } from '../lib/layout';
 *   const layout: ProfileLayout = d.__layout || 'center';
 *   const layoutClasses = getLayoutClasses(layout);
 *
 *   // no container que hoje é:
 *   //   <div className="w-full max-w-sm mx-auto px-4 pb-8 relative z-10">
 *   // troca para:
 *   <div className={layoutClasses.wrapper}>
 *
 *   // e no bloco do cabeçalho (cover+avatar+nome), troca o `text-center`
 *   // fixo por `layoutClasses.header`.
 *
 * INTEGRAÇÃO no editor (Perfil.tsx, aba "Tema" por exemplo): adicionar um
 * seletor visual igual ao de THEMES, mas chamando setField('__layout', id).
 */

export type ProfileLayout = 'center' | 'left' | 'right' | 'split';

export const LAYOUT_OPTIONS: { id: ProfileLayout; label: string; desc: string }[] = [
  { id: 'center', label: 'Centralizado', desc: 'Estilo Linktree clássico' },
  { id: 'left', label: 'Esquerda', desc: 'Conteúdo alinhado à esquerda' },
  { id: 'right', label: 'Direita', desc: 'Conteúdo alinhado à direita' },
  { id: 'split', label: 'Dividido', desc: 'Foto de um lado, info do outro (telas largas)' },
];

interface LayoutClasses {
  /** Container externo do card de perfil */
  wrapper: string;
  /** Cabeçalho: cover + avatar + nome/bio */
  header: string;
  /** Lista de links/redes/contatos */
  content: string;
}

export function getLayoutClasses(layout: ProfileLayout): LayoutClasses {
  switch (layout) {
    case 'left':
      return {
        wrapper: 'w-full max-w-[420px] mx-auto px-4 pb-12 relative z-10',
        header: 'text-left items-start',
        content: 'text-left',
      };
    case 'right':
      return {
        wrapper: 'w-full max-w-[420px] mx-auto px-4 pb-12 relative z-10',
        header: 'text-right items-end',
        content: 'text-right',
      };
    case 'split':
      // Em telas largas (tablet/desktop), foto fica fixa à esquerda e o
      // conteúdo rola à direita — em mobile cai para o padrão centralizado.
      return {
        wrapper: 'w-full max-w-[420px] sm:max-w-3xl mx-auto px-4 pb-12 relative z-10 sm:grid sm:grid-cols-[280px_1fr] sm:gap-6 sm:items-start',
        header: 'text-center sm:sticky sm:top-8 items-center',
        content: 'text-center sm:text-left',
      };
    case 'center':
    default:
      return {
        wrapper: 'w-full max-w-[420px] mx-auto px-4 pb-12 relative z-10',
        header: 'text-center items-center',
        content: 'text-center',
      };
  }
}
