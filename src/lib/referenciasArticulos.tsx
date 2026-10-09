// Lógica compartida para detectar y enlazar referencias a artículos legales
// dentro de un texto plano, convirtiéndolas en botones clicables que abren el
// artículo correspondiente. Usado tanto en la página de Apuntes OPLORA como en
// la página de estudio del Tema, para no duplicar la misma regex en dos sitios.
//
// Formatos admitidos (la palabra "artículo"/"art." es opcional):
//  - "[CC articulo 17.2]", "[CC art. 14]", "[CC 17.2]"           → siglas de una palabra
//  - "[CP Artículo 31 bis]", "[CP Artículo 140 bis]"              → sufijos bis, ter, quater…
//  - "[LO 4/2015 Artículo 16]", "[Ley 5/2014 Artículo 18]",
//    "[RD 704/2011 Artículo 7]", "[RDL 12/2018 Artículo 1]"       → tipo de norma + número/año
//
// Las siglas se resuelven contra las leyes de la oposición por dos vías:
//  1. Las siglas guardadas en la ley ("CP", "LOPSC"…), sin distinguir mayúsculas,
//     espacios ni puntos.
//  2. El tipo y número/año que aparecen en el nombre de la ley ("Ley Orgánica
//     4/2015, de 30 de marzo…" → "LO4/2015"). Así "[LO 4/2015 Artículo 16]"
//     funciona aunque en la app la ley tenga otras siglas.

export type ParteReferencia = string | { siglas: string; numero: string };

const SUFIJOS = '(?:bis|ter|qu[aá]ter|quinquies|sexies|septies|octies|nonies|decies)';

// Grupo 1: siglas → una palabra (CP, LOPSC, LECrim…) opcionalmente seguida de un
// número/año (LO 4/2015, Ley 5/2014, RD 704/2011).
// Grupo 2: número del artículo, con apartado opcional (17.2) y sufijo opcional (31 bis).
const REGEX_REFERENCIA_ARTICULO = new RegExp(
  '\\[([A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:\\s+\\d+\\/\\d{4})?)\\s+(?:art[ií]culo\\s+|art\\.?\\s+)?' +
    `(\\d+(?:\\s+${SUFIJOS})?(?:\\.\\d+)*)\\]`,
  'gi',
);

export function partesReferencias(texto: string): ParteReferencia[] {
  const regex = new RegExp(REGEX_REFERENCIA_ARTICULO.source, REGEX_REFERENCIA_ARTICULO.flags);
  const partes: ParteReferencia[] = [];
  let ultimoIndex = 0;
  let match;

  while ((match = regex.exec(texto)) !== null) {
    if (match.index > ultimoIndex) {
      partes.push(texto.slice(ultimoIndex, match.index));
    }
    partes.push({ siglas: match[1], numero: match[2].replace(/\s+/g, ' ').toLowerCase().replace('quáter', 'quater') });
    ultimoIndex = match.index + match[0].length;
  }
  if (ultimoIndex < texto.length) {
    partes.push(texto.slice(ultimoIndex));
  }
  return partes;
}

// "LO 4/2015" → "LO4/2015", "Ley 5/2014" → "LEY5/2014", "C.P." → "CP"
export function normalizarSiglas(siglas: string): string {
  return siglas
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[\s.]+/g, '');
}

// Deduce, del nombre oficial de la ley, la clave "TIPO + número/año".
function clavesDesdeNombre(nombre: string): string[] {
  const n = (nombre ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
  const num = n.match(/(\d+)\/(\d{4})/);
  if (!num) return [];
  const numero = `${num[1]}/${num[2]}`;
  const claves: string[] = [];
  if (/^ley organica/.test(n)) claves.push(`LO${numero}`);
  else if (/^real decreto-? ?ley/.test(n)) claves.push(`RDL${numero}`, `RDLEY${numero}`);
  else if (/^real decreto legislativo/.test(n)) claves.push(`RDLEG${numero}`, `RDLEGISLATIVO${numero}`);
  else if (/^real decreto/.test(n)) claves.push(`RD${numero}`);
  else if (/^orden/.test(n)) claves.push(`ORDEN${numero}`);
  else if (/^ley/.test(n)) claves.push(`LEY${numero}`, `L${numero}`);
  return claves;
}

export function renderReferencias(
  texto: string,
  mapaSiglas: Record<string, string>,
  onAbrirArticulo: (numero: string, versionLeyId: string) => void,
  keyPrefix: string,
) {
  return partesReferencias(texto).map((parte, j) => {
    const key = `${keyPrefix}-${j}`;
    if (typeof parte === 'string') {
      return <span key={key}>{parte}</span>;
    }
    const versionLeyId = mapaSiglas[normalizarSiglas(parte.siglas)];
    if (!versionLeyId) {
      return <span key={key}>{parte.siglas} art. {parte.numero}</span>;
    }
    return (
      <button
        key={key}
        title={`${parte.siglas} · art. ${parte.numero}`}
        onClick={() => onAbrirArticulo(parte.numero, versionLeyId)}
        style={{
          display: 'inline', background: 'none', border: 'none', padding: 0,
          color: '#1F7CFF', fontWeight: 600, cursor: 'pointer',
          textDecoration: 'underline', textDecorationStyle: 'dotted',
          fontSize: 'inherit', fontFamily: 'inherit',
        }}
      >
        Artículo {parte.numero}
      </button>
    );
  });
}

// Construye, a partir del listado de "leyes por oposición" (respuesta de
// GET /leyes/oposicion/:id), el mapa clave → versionLeyId que necesita
// renderReferencias para resolver cada referencia. Cada ley se indexa por sus
// siglas y por el tipo + número/año de su nombre. Si dos leyes comparten una
// clave deducida del nombre, esa clave se descarta para no abrir la que no es.
export function construirMapaSiglas(leyesOposicion: any[]): Record<string, string> {
  const mapa: Record<string, string> = {};
  const deducidas: Record<string, string | null> = {};
  for (const ol of leyesOposicion ?? []) {
    const versionLeyId = ol.versionLey?.id;
    if (!versionLeyId) continue;
    if (ol.ley?.siglas) {
      mapa[normalizarSiglas(ol.ley.siglas)] = versionLeyId;
    }
    for (const clave of clavesDesdeNombre(ol.ley?.nombre)) {
      deducidas[clave] = clave in deducidas && deducidas[clave] !== versionLeyId ? null : versionLeyId;
    }
  }
  for (const [clave, versionLeyId] of Object.entries(deducidas)) {
    if (versionLeyId && !(clave in mapa)) mapa[clave] = versionLeyId;
  }
  return mapa;
}

// versionLeyId → nombre de la ley, para mostrarlo en el modal del artículo.
export function construirMapaNombres(leyesOposicion: any[]): Record<string, string> {
  const mapa: Record<string, string> = {};
  for (const ol of leyesOposicion ?? []) {
    if (ol.versionLey?.id && ol.ley?.nombre) {
      mapa[ol.versionLey.id] = ol.ley.nombre;
    }
  }
  return mapa;
}
