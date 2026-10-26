export interface ShowcaseProduct {
  id: string;
  name: string;
  tag: string;
  desc: string;
  price: number;
  img: string;
  color: string;
  gallery?: string[];
}

/**
 * Foto que combina com a categoria do produto: a mesma imagem que o site já usa
 * para aquele produto (vitrine "shop-" / "row2-", editável em /painel-imagens).
 * Produtos com galeria usam a primeira foto da galeria.
 */
export function productImage(
  p: ShowcaseProduct,
  resolve: (id: string, fallback?: string) => string,
  isMainLine: boolean,
): string {
  if (p.gallery?.length) return p.gallery[0];
  return resolve(`${isMainLine ? 'shop' : 'row2'}-${p.id}`, p.img);
}

/** "AirNext Pet" -> "Pet" (o logo AirNext já aparece ao lado). */
export function shortName(name: string): string {
  const n = name.replace(/air\s*next/i, '').replace(/\s+/g, ' ').trim();
  return n || name;
}

