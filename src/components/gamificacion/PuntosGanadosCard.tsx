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

const DURACION_VISIBLE_MS = 4200;
const DURACION_FADE_MS = 550;

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
    const duracionContador = 650;
    const inicio = performance.now();
    let raf = 0;
    const tick = (ahora: number) => {
      const progreso = Math.min(1, (ahora - inicio) / duracionContador);
      setContador(Math.round(progreso * total));
      if (progreso < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const tVisible = setTimeout(() => setFase('visible'), 40);
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
    <div
      className={`puntos-toast ${conNivel ? 'puntos-toast--nivel' : ''} puntos-toast--${fase}`}
      role="status"
      aria-live="polite"
    >
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

      <style jsx>{`
        @keyframes oploBounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(-4deg); }
        }

        .puntos-toast {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(239, 246, 255, 0.92);
          backdrop-filter: blur(6px);
          border: 1px solid #dbeafe;
          overflow: hidden;
          opacity: 0;
          transform: translateY(-6px) scale(0.98);
          transition: opacity ${DURACION_FADE_MS}ms ease, transform ${DURACION_FADE_MS}ms ease;
        }
        .puntos-toast--nivel {
          background: rgba(255, 251, 235, 0.94);
          border: 1px solid #fcd34d;
        }
        .puntos-toast--visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .puntos-toast--saliendo {
          opacity: 0;
          transform: translateY(-6px) scale(0.98);
        }

        .puntos-toast__oplo-wrap {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          overflow: hidden;
          background: white;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.1);
        }
        .puntos-toast__oplo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          animation: oploBounce 1.7s ease-in-out infinite;
          animation-play-state: ${fase === 'visible' ? 'running' : 'paused'};
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
          font-size: 14px;
          font-weight: 800;
          color: #1F7CFF;
        }
        .puntos-toast__num {
          font-size: 18px;
          font-weight: 800;
          color: #1F7CFF;
        }
        .puntos-toast__label {
          font-size: 11px;
          font-weight: 600;
          color: #1F7CFF;
          margin-right: 6px;
        }
        .puntos-toast--nivel .puntos-toast__mas,
        .puntos-toast--nivel .puntos-toast__num,
        .puntos-toast--nivel .puntos-toast__label {
          color: #b45309;
        }
        .puntos-toast__nivel-badge {
          font-size: 10.5px;
          font-weight: 700;
          color: #92400e;
          background: rgba(255, 255, 255, 0.75);
          padding: 2px 8px;
          border-radius: 999px;
        }
        .puntos-toast__frase {
          margin-top: 2px;
          font-size: 12px;
          color: #374151;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
