'use client';

import { useEffect, useState } from 'react';
import { getOploUrl } from '@/lib/oplo';

export interface GamificacionInfo {
  puntosGanados: number;
  puntosTotales?: number;
  nivelAnterior?: number;
  nivelNuevo: number;
  subioNivel: boolean;
  nombreNivel: string;
  badgeNivel: string;
}

function fraseOplo(g: GamificacionInfo, porcentaje?: number): string {
  if (g.subioNivel) {
    return `¡Has subido a ${g.badgeNivel ? g.badgeNivel + ' ' : ''}${g.nombreNivel}! Sigue así, vas a por la plaza.`;
  }
  if (porcentaje === undefined) return 'Puntos sumados a tu progreso.';
  if (porcentaje >= 80) return '¡Menuda puntería!';
  if (porcentaje >= 60) return 'Buen ritmo, sigue así.';
  return 'Repasa lo fallado y a por el siguiente.';
}

const DURACION_VISIBLE_MS = 6200; // ⭐ 3200 + 3000ms más, a petición
const DURACION_FADE_MS = 400;

/**
 * Notificación flotante (emergente) que aparece centrada en la pantalla,
 * como una píldora/botón compacto — no ocupa el ancho completo ni forma
 * parte del flujo del contenido. Se muestra unos segundos y se difumina sola.
 */
export function PuntosGanadosCard({
  gamificacion,
  porcentaje,
}: {
  gamificacion: GamificacionInfo | null | undefined;
  porcentaje?: number;
}) {
  const [contador, setContador] = useState(0);
  const [fase, setFase] = useState<'entrando' | 'visible' | 'saliendo' | 'oculto'>('entrando');

  const tienePuntos = !!gamificacion && gamificacion.puntosGanados > 0;

  useEffect(() => {
    if (!tienePuntos) return;
    setFase('entrando');
    const total = gamificacion!.puntosGanados;
    const duracionContador = 500;
    const inicio = performance.now();
    let raf = 0;
    const tick = (ahora: number) => {
      const progreso = Math.min(1, (ahora - inicio) / duracionContador);
      setContador(Math.round(progreso * total));
      if (progreso < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const tVisible = setTimeout(() => setFase('visible'), 30);
    const tSalir = setTimeout(() => setFase('saliendo'), DURACION_VISIBLE_MS);
    const tOculto = setTimeout(() => setFase('oculto'), DURACION_VISIBLE_MS + DURACION_FADE_MS);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(tVisible);
      clearTimeout(tSalir);
      clearTimeout(tOculto);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamificacion?.puntosGanados, gamificacion?.subioNivel]);

  if (!tienePuntos || fase === 'oculto') return null;

  const frase = fraseOplo(gamificacion!, porcentaje);
  const conNivel = gamificacion!.subioNivel;

  return (
    <div className={`puntos-overlay puntos-overlay--${fase}`}>
      <div className={`puntos-pill ${conNivel ? 'puntos-pill--nivel' : ''}`} role="status" aria-live="polite">
        <div className="puntos-pill__oplo-wrap">
          <img
            src={getOploUrl(gamificacion!.nivelNuevo)}
            alt="OPLO"
            className="puntos-pill__oplo-img"
          />
        </div>

        <div className="puntos-pill__contenido">
          <div className="puntos-pill__linea-puntos">
            <span className="puntos-pill__mas">+</span>
            <span className="puntos-pill__num">{contador}</span>
          </div>
          {conNivel ? (
            <div className="puntos-pill__nivel-badge">
              {gamificacion!.badgeNivel} {gamificacion!.nombreNivel}
            </div>
          ) : (
            <div className="puntos-pill__frase">{frase}</div>
          )}
        </div>
      </div>

      <style jsx>{`
        .puntos-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          pointer-events: none;
          padding: 0 24px;
        }

        .puntos-pill {
          pointer-events: none;
          display: inline-flex;
          align-items: center;
          gap: 14px;
          padding: 14px 24px 14px 14px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.94);
          backdrop-filter: blur(8px);
          box-shadow: 0 14px 38px rgba(15, 23, 42, 0.32);
          max-width: 360px;
          opacity: 0;
          transform: scale(0.85);
          transition: opacity ${DURACION_FADE_MS}ms ease, transform ${DURACION_FADE_MS}ms ease;
        }
        .puntos-pill--nivel {
          background: rgba(120, 53, 15, 0.95);
        }
        .puntos-overlay--visible .puntos-pill {
          opacity: 1;
          transform: scale(1);
        }
        .puntos-overlay--saliendo .puntos-pill {
          opacity: 0;
          transform: scale(0.92);
        }

        .puntos-pill__oplo-wrap {
          flex-shrink: 0;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          overflow: hidden;
          background: white;
          border: 3px solid white;
        }
        .puntos-pill__oplo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .puntos-pill__contenido {
          min-width: 0;
        }
        .puntos-pill__linea-puntos {
          display: flex;
          align-items: baseline;
          gap: 2px;
          line-height: 1;
        }
        .puntos-pill__mas {
          font-size: 17px;
          font-weight: 800;
          color: #7dd3fc;
        }
        .puntos-pill__num {
          font-size: 23px;
          font-weight: 800;
          color: white;
        }
        .puntos-pill--nivel .puntos-pill__mas {
          color: #fde68a;
        }
        .puntos-pill__nivel-badge {
          margin-top: 3px;
          font-size: 13px;
          font-weight: 700;
          color: #fde68a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .puntos-pill__frase {
          margin-top: 2px;
          font-size: 13px;
          color: #cbd5e1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}
