'use client';

// ⭐ Carga de "Estudiar" (al abrir un apunte o un tema): un libro abierto con marcapáginas al que
// se le pasa una página, en bucle. Hecho con HTML/CSS (sin GIF): fluido, sin fondo propio (se
// adapta a claro y oscuro) y casi sin peso. Si el móvil tiene "reducir movimiento", no anima.

const AZUL = '#1F7CFF';
const NARANJA = '#F2711C';

export default function CargaLibro({
  texto = 'Cargando…',
  fondo,
  pantalla = true,
}: {
  texto?: string;
  /** Fondo de la pantalla de carga (el de la sección). */
  fondo?: string;
  /** Ocupa toda la pantalla, centrado. */
  pantalla?: boolean;
}) {
  const libro = (
    <div role="status" aria-live="polite" aria-label={texto} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <style>{CSS}</style>
      <div className="ol-libro" aria-hidden="true">
        <div className="ol-sombra" />
        <div className="ol-tapa" />
        <div className="ol-pagina ol-izq"><Lineas /></div>
        <div className="ol-pagina ol-der"><Lineas /></div>
        <div className="ol-cinta" />
        <div className="ol-hoja">
          <div className="ol-cara ol-frente"><Lineas /></div>
          <div className="ol-cara ol-dorso"><Lineas /></div>
        </div>
        <div className="ol-lomo" />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-texto-2)' }}>{texto}</span>
    </div>
  );

  if (!pantalla) return libro;
  return (
    <div style={{ minHeight: '100vh', background: fondo, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem', animation: 'ol-entrar .3s ease both' }}>
      {libro}
    </div>
  );
}

function Lineas() {
  return (
    <div className="ol-lineas">
      {[100, 88, 96, 80, 92, 70].map((w, i) => <i key={i} style={{ width: `${w}%` }} />)}
    </div>
  );
}

const CSS = `
@keyframes ol-entrar { from { opacity: 0 } to { opacity: 1 } }
@keyframes ol-pasar {
  0%, 12% { transform: rotateY(0deg); }
  62%, 100% { transform: rotateY(-180deg); }
}
@keyframes ol-luz {
  0%, 12% { opacity: 0; }
  37% { opacity: .22; }
  62%, 100% { opacity: 0; }
}
@keyframes ol-respirar { 0%, 100% { transform: scaleX(1); opacity: .22 } 50% { transform: scaleX(.92); opacity: .16 } }

.ol-libro { position: relative; width: 132px; height: 92px; perspective: 520px; }
.ol-sombra { position: absolute; left: 10px; right: 10px; bottom: -10px; height: 10px; border-radius: 50%;
  background: #0f172a; filter: blur(6px); animation: ol-respirar 1.8s ease-in-out infinite; }
.ol-tapa { position: absolute; left: 0; right: 0; top: 12px; bottom: 0; background: ${AZUL};
  border-radius: 10px 10px 18px 18px / 10px 10px 26px 26px; }
.ol-pagina, .ol-cara { background: var(--c-libro-pagina, #FFFFFF); }
.ol-pagina { position: absolute; top: 4px; bottom: 9px; width: 58px; overflow: hidden; }
.ol-izq { left: 8px; border-radius: 6px 2px 2px 10px; transform: skewY(4deg); transform-origin: right bottom; }
.ol-der { right: 8px; border-radius: 2px 6px 10px 2px; transform: skewY(-4deg); transform-origin: left bottom; }
.ol-lomo { position: absolute; left: 50%; top: 6px; bottom: 9px; width: 2px; margin-left: -1px; background: var(--c-libro-linea, #D5DAE3); opacity: .9; }
.ol-cinta { position: absolute; left: 76px; top: -2px; width: 11px; height: 36px; background: ${NARANJA};
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%); border-radius: 2px 2px 0 0; }
.ol-hoja { position: absolute; left: 66px; top: 4px; bottom: 9px; width: 58px; transform-origin: left center;
  transform-style: preserve-3d; animation: ol-pasar 1.8s cubic-bezier(.45,.05,.35,1) infinite; }
.ol-cara { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 2px 6px 10px 2px; overflow: hidden; }
.ol-cara::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, #0f172a, transparent 70%); opacity: 0; animation: ol-luz 1.8s ease-in-out infinite; }
.ol-dorso { transform: rotateY(180deg); border-radius: 6px 2px 2px 10px; }
.ol-lineas { position: absolute; left: 9px; right: 9px; top: 13px; display: flex; flex-direction: column; gap: 7px; }
.ol-lineas i { display: block; height: 3px; border-radius: 3px; background: var(--c-libro-linea, #D5DAE3); }
.ol-der .ol-lineas { top: 30px; }
@media (prefers-reduced-motion: reduce) {
  .ol-hoja, .ol-sombra, .ol-cara::after { animation: none; }
  .ol-hoja { display: none; }
}
`;
