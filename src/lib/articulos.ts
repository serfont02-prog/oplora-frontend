// ⭐ Cómo se nombra una entrada de la ley en pantalla:
//   "5" → "Artículo 5" · "617 a 622" → "Artículos 617 a 622" · "Anexo" / "Anexo II" → tal cual
export function etiquetaArticulo(numero?: string | null): string {
  const n = (numero ?? '').trim();
  if (/^(anexo|itc)\b/i.test(n)) return n; // "Anexo II", "ITC 1" (Reglamento de Armas) tal cual
  if (/^\d+\S*( \S+)? (a|y) \d+/.test(n)) return `Artículos ${n}`;
  return `Artículo ${n}`;
}
