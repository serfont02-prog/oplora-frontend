// ⭐ Cómo se nombra una entrada de la ley en pantalla:
//   "5" → "Artículo 5" · "617 a 622" → "Artículos 617 a 622" · "Anexo" / "Anexo II" → tal cual
export function etiquetaArticulo(numero?: string | null): string {
  const n = (numero ?? '').trim();
  if (/^anexo\b/i.test(n)) return n;
  if (/^\d+\S*( \S+)? (a|y) \d+/.test(n)) return `Artículos ${n}`;
  return `Artículo ${n}`;
}
