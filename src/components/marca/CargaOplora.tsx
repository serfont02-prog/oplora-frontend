'use client';

// ⭐ Pantalla de carga de Oplora. Está hecha para continuar la pantalla de inicio que pone
// Android al abrir la app instalada (icono en un círculo blanco, centrado, sobre el azul del
// manifiesto): el círculo aparece en el mismo sitio y al mismo tamaño, sin fundido, y debajo
// entran el nombre y la barrita. Así parece una sola pantalla que cobra vida, no dos seguidas.
// El fondo es el del inicio (#EAF0FF en claro, igual que background_color del manifiesto).

import LogoOplora, { COLOR_MARCA } from '@/components/marca/LogoOplora';
import { BG_DASHBOARD } from '@/styles/tokens';

// Android 12+ dibuja el icono de la app (el «maskable», 240 dp) recortado en un círculo de 160 dp
// en el centro de la pantalla. En ese icono la pincelada ocupa el 72 % del ancho (172 px de 240).
const CIRCULO = 160;
const ALTO_PINCELADA = Math.round((240 * 0.72) / (123 / 73));
// En la app instalada la barra de estado no forma parte de la página: el centro de Android
// queda un poco más arriba que el nuestro.
const AJUSTE_BARRA_ESTADO = 12;

export default function CargaOplora({ texto, fondo = BG_DASHBOARD }: { texto?: string; fondo?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={texto ?? 'Cargando'}
      style={{ position: 'fixed', inset: 0, background: fondo, overflow: 'hidden' }}
    >
      <style>{`
        @keyframes oplora-carga-entrar { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes oplora-carga-latir { 0%, 100% { transform: scale(1); } 50% { transform: scale(0.97); } }
        @keyframes oplora-carga-barra { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }
        .oplora-carga-circulo { animation: oplora-carga-latir 2s ease-in-out .6s infinite; }
        .oplora-carga-pie { animation: oplora-carga-entrar .45s ease .15s both; }
        @media (prefers-reduced-motion: reduce) {
          .oplora-carga-circulo, .oplora-carga-seg { animation: none !important; }
        }
      `}</style>

      {/* Icono: mismo círculo blanco que la pantalla de Android */}
      <div
        className="oplora-carga-circulo"
        style={{
          position: 'absolute',
          left: '50%',
          top: `calc(50% - ${AJUSTE_BARRA_ESTADO}px)`,
          width: CIRCULO,
          height: CIRCULO,
          marginLeft: -CIRCULO / 2,
          marginTop: -CIRCULO / 2,
          borderRadius: '50%',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <LogoOplora variante="icono" alto={ALTO_PINCELADA} />
      </div>

      {/* Nombre y barra: entran suavemente debajo del icono */}
      <div
        className="oplora-carga-pie"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `calc(50% - ${AJUSTE_BARRA_ESTADO}px + ${CIRCULO / 2 + 28}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <LogoOplora variante="texto" alto={30} />
        <div style={{ width: 96, height: 4, borderRadius: 999, background: 'rgba(31,124,255,0.15)', overflow: 'hidden' }}>
          <div className="oplora-carga-seg" style={{ width: '40%', height: '100%', borderRadius: 999, background: COLOR_MARCA, animation: 'oplora-carga-barra 1.2s ease-in-out infinite' }} />
        </div>
        {texto && <div style={{ fontSize: 13, color: 'var(--c-texto-2, #6B7280)', marginTop: -6 }}>{texto}</div>}
      </div>
    </div>
  );
}
