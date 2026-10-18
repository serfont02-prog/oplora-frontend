// ⭐ Logo de OPLORA (pincelada + "Oplora") como componente, a partir de public/prueba.svg.
// Se dibuja en línea (sin petición extra) y se puede colorear:
//   <LogoOplora />                    → logo completo, icono azul y texto oscuro
//   <LogoOplora variante="icono" />   → solo la pincelada (cabeceras, carga, avatares…)
//   <LogoOplora colorTexto="white" /> → sobre fondos oscuros

const PATHS_ICONO = [
  'M180 793 c0 -154 125 -274 284 -273 l51 1 -43 21 c-85 41 -147 134 -166 250 -8 42 -34 58 -53 32 -12 -17 -13 -17 -13 0 0 25 -23 14 -31 -15 -7 -24 -7 -24 -8 4 -2 47 -21 29 -21 -20z',
  'M1015 802 c5 -13 3 -13 -11 -1 -16 13 -16 12 -4 -11 12 -23 12 -24 -3 -11 -13 10 -17 10 -17 1 0 -7 -44 -56 -98 -109 -146 -144 -288 -211 -447 -211 -81 0 -127 12 -179 48 -57 40 -97 94 -111 154 l-13 53 -1 -75 c-1 -94 19 -141 83 -197 75 -66 151 -87 295 -81 95 4 132 11 204 36 150 51 285 146 395 277 36 42 78 116 65 113 -5 0 -19 3 -33 9 -14 6 -49 13 -78 15 -44 4 -52 2 -47 -10z',
  'M1197 677 c-111 -162 -306 -301 -497 -353 -89 -25 -306 -26 -370 -2 l-45 17 47 -43 c123 -113 354 -162 522 -112 242 72 415 273 416 483 0 31 -5 45 -19 52 -16 9 -24 3 -54 -42z',
];

const PATHS_TEXTO = [
  'M1595 927 c-87 -41 -135 -128 -135 -241 0 -167 102 -271 262 -269 87 1 161 45 206 122 25 42 27 55 27 147 0 95 -2 104 -30 150 -46 73 -106 106 -203 111 -66 3 -84 1 -127 -20z m212 -68 c76 -47 104 -198 53 -289 -65 -117 -229 -118 -297 -2 -53 90 -29 239 46 289 56 36 139 37 198 2z',
  'M2420 684 l0 -265 33 3 32 3 3 263 2 262 -35 0 -35 0 0 -266z',
  'M2156 760 c-15 -5 -36 -16 -46 -25 -16 -15 -18 -14 -23 5 -4 15 -13 20 -36 20 l-31 0 0 -245 0 -245 35 0 35 0 0 95 0 95 33 -20 c41 -25 111 -26 157 -1 81 43 107 186 47 265 -15 20 -36 40 -46 46 -28 15 -93 20 -125 10z m103 -84 c46 -49 35 -157 -18 -186 -39 -20 -91 -12 -122 19 -25 25 -29 37 -29 84 0 75 29 107 98 107 39 0 53 -5 71 -24z',
  'M2681 760 c-74 -17 -122 -76 -129 -154 -4 -46 0 -62 22 -100 63 -107 235 -116 307 -15 27 38 36 113 20 162 -15 45 -68 93 -118 106 -43 12 -54 12 -102 1z m117 -77 c27 -17 42 -52 42 -100 0 -53 -53 -103 -110 -103 -35 0 -48 6 -77 35 -33 33 -35 39 -31 85 6 57 27 86 72 99 36 10 71 5 104 -16z',
  'M3094 756 c-18 -8 -36 -22 -42 -31 -8 -15 -10 -14 -16 9 -5 21 -12 26 -36 26 l-30 0 0 -171 0 -170 33 3 32 3 5 113 c5 109 6 115 33 138 18 15 41 24 63 24 32 0 34 2 34 35 0 30 -3 35 -22 35 -13 -1 -37 -7 -54 -14z',
  'M3295 764 c-33 -8 -95 -37 -95 -44 0 -4 8 -14 18 -23 17 -16 22 -16 59 -1 70 28 133 4 133 -50 0 -12 -11 -16 -46 -16 -136 0 -212 -67 -173 -153 25 -56 140 -78 192 -37 25 20 25 20 30 -1 4 -16 12 -20 34 -17 l28 3 3 111 c3 125 -9 177 -48 205 -26 19 -99 32 -135 23z m115 -208 c0 -61 -84 -105 -135 -72 -29 19 -32 47 -7 68 21 19 44 25 100 27 38 1 42 -1 42 -23z',
];

const VIEWBOX = { completo: '11 42 339 83', icono: '11 52 123 73' } as const;
const PROPORCION = { completo: 339 / 83, icono: 123 / 73 } as const;

export const COLOR_MARCA = '#1F7CFF';
export const COLOR_MARCA_TEXTO = '#0f172a';

type Props = {
  variante?: 'completo' | 'icono';
  /** Alto en píxeles; el ancho se calcula para mantener la proporción. */
  alto?: number;
  colorIcono?: string;
  colorTexto?: string;
  style?: React.CSSProperties;
};

export default function LogoOplora({
  variante = 'completo',
  alto = 40,
  colorIcono = COLOR_MARCA,
  colorTexto = COLOR_MARCA_TEXTO,
  style,
}: Props) {
  return (
    <svg
      viewBox={VIEWBOX[variante]}
      height={alto}
      width={Math.round(alto * PROPORCION[variante])}
      role="img"
      aria-label="Oplora"
      style={{ display: 'block', flexShrink: 0, ...style }}
    >
      <g transform="translate(0,139) scale(0.1,-0.1)">
        <g fill={colorIcono}>
          {PATHS_ICONO.map((d, i) => <path key={i} d={d} />)}
        </g>
        {variante === 'completo' && (
          <g fill={colorTexto}>
            {PATHS_TEXTO.map((d, i) => <path key={i} d={d} />)}
          </g>
        )}
      </g>
    </svg>
  );
}
