// Lógica compartida para detectar y enlazar referencias a artículos legales
// del tipo "[CC articulo 17.2]", "[CC art. 14]" o "[CC 17.2]" dentro de un
// texto plano, convirtiéndolas en botones clicables que abren el artículo
// correspondiente. Usado tanto en la página de Apuntes OPLORA como en la
// página de estudio del Tema, para no duplicar la misma regex en dos sitios.

export type ParteReferencia = string | { siglas: string; numero: string };

// Acepta, en una sola pasada:
//  - "[CC articulo 17.2]" / "[CC artículo 17.2]" (palabra completa)
//  - "[CC art. 14]" / "[CC art 14]" (abreviatura, con o sin punto)
//  - "[CC 17.2]" (siglas + número, sin ninguna palabra intermedia)
// El grupo de la palabra "artículo"/"art." es opcional y no captura, así que
// el grupo 1 siempre es las siglas y el grupo 2 siempre es el número, sea
// cual sea la variante que haya hecho match.
const REGEX_REFERENCIA_ARTICULO = /\[([A-ZÁÉÍÓÚÑ]+)\s+(?:art[ií]culo\s+|art\.?\s+)?([\d.]+)\]/gi;

export function partesReferencias(texto: string): ParteReferencia[] {
  const regex = new RegExp(REGEX_REFERENCIA_ARTICULO.source, REGEX_REFERENCIA_ARTICULO.flags);
  const partes: ParteReferencia[] = [];
  let ultimoIndex = 0;
  let match;

  while ((match = regex.exec(texto)) !== null) {
    if (match.index > ultimoIndex) {
      partes.push(texto.slice(ultimoIndex, match.index));
    }
    partes.push({ siglas: match[1].toUpperCase(), numero: match[2] });
    ultimoIndex = match.index + match[0].length;
  }
  if (ultimoIndex < texto.length) {
    partes.push(texto.slice(ultimoIndex));
  }
  return partes;
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
    const versionLeyId = mapaSiglas[parte.siglas];
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
// GET /leyes/oposicion/:id), el mapa siglas → versionLeyId que necesita
// renderReferencias para resolver cada referencia.
export function construirMapaSiglas(leyesOposicion: any[]): Record<string, string> {
  const mapa: Record<string, string> = {};
  for (const ol of leyesOposicion ?? []) {
    if (ol.ley?.siglas && ol.versionLey?.id) {
      mapa[ol.ley.siglas.toUpperCase()] = ol.versionLey.id;
    }
  }
  return mapa;
}
