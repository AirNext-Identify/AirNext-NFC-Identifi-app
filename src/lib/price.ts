/** Formata preço em reais: inteiros sem centavos (89), quebrados com vírgula (219,90). */
export const fmtPrice = (n: number) => {
  const v = Math.round(n * 100) / 100;
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ',');
};

/** Texto de preço para vitrine: preço 0 significa "sob consulta" (ex.: Evento). */
export const priceLabel = (n: number) => (n > 0 ? `R$ ${fmtPrice(n)}` : 'Sob consulta');
