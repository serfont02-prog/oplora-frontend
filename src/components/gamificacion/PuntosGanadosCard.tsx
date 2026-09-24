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
  if (porcentaje === undefined) return 'Puntos sumados a tu progreso. Cada test cuenta.';
  if (porcentaje >= 80) return '¡Menuda puntería! Así se prepara una plaza.';
  if (porcentaje >= 60) return 'Buen ritmo. Sigue sumando puntos cada día.';
  return 'Puntos en el bolsillo. Repasa lo fallado y a por el siguiente.';
}

const DURACION_VISIBLE_MS = 3600;
const DURACION_FADE_MS = 420;

/**
 * Notificación flotante (emergente) que se superpone a la pantalla, no forma
 * parte del flujo del contenido. Aparece arriba, se mantiene unos segundos
 * y se difumina sola. No requiere ninguna interacción del usuario.
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
    const duracionContador = 550;
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
      <div className={`puntos-toast ${conNivel ? 'puntos-toast--nivel' : ''}`} role="status" aria-live="polite">
        <div className="puntos-toast__oplo-wrap">
          <img
            src={getOploUrl(gamificacion!.nivelNuevo)}
            alt="OPLO"
            className="puntos-toast__oplo-img"
          />
        </div>

        <div className="puntos-toast__contenido">
          <div className="puntos-toast__linea-puntos">
            <span className="puntos-toast__mas">+</span>
            <span className="puntos-toast__num">{contador}</span>
            <span className="puntos-toast__label">puntos</span>
            {conNivel && (
              <span className="puntos-toast__nivel-badge">
                {gamificacion!.badgeNivel} {gamificacion!.nombreNivel}
              </span>
            )}
          </div>
          <div className="puntos-toast__frase">{frase}</div>
        </div>
      </div>

      <style jsx>{`
        .puntos-overlay {
          position: fixed;
          top: max(14px, env(safe-area-inset-top));
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          padding: 0 16px;
          z-index: 200;
          pointer-events: none;
        }

        .puntos-toast {
          pointer-events: none;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(8px);
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);
          max-width: 420px;
          width: 100%;
          opacity: 0;
          transform: translateY(-14px);
          transition: opacity ${DURACION_FADE_MS}ms ease, transform ${DURACION_FADE_MS}ms ease;
        }
        .puntos-toast--nivel {
          background: rgba(120, 53, 15, 0.94);
        }
        .puntos-overlay--visible .puntos-toast {
          opacity: 1;
          transform: translateY(0);
        }
        .puntos-overlay--saliendo .puntos-toast {
          opacity: 0;
          transform: translateY(-10px);
        }

        .puntos-toast__oplo-wrap {
          flex-shrink: 0;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          overflow: hidden;
          background: white;
          border: 2px solid white;
        }
        .puntos-toast__oplo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .puntos-toast__contenido {
          flex: 1;
          min-width: 0;
        }
        .puntos-toast__linea-puntos {
          display: flex;
          align-items: baseline;
          gap: 3px;
          flex-wrap: wrap;
        }
        .puntos-toast__mas {
          font-size: 13px;
          font-weight: 800;
          color: #7dd3fc;
        }
        .puntos-toast__num {
          font-size: 16px;
          font-weight: 800;
          color: white;
        }
        .puntos-toast__label {
          font-size: 11px;
          font-weight: 600;
          color: #cbd5e1;
          margin-right: 6px;
        }
        .puntos-toast--nivel .puntos-toast__mas {
          color: #fde68a;
        }
        .puntos-toast__nivel-badge {
          font-size: 10.5px;
          font-weight: 700;
          color: #78350f;
          background: #fde68a;
          padding: 2px 8px;
          border-radius: 999px;
        }
        .puntos-toast__frase {
          margin-top: 2px;
          font-size: 12px;
          color: #e2e8f0;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
