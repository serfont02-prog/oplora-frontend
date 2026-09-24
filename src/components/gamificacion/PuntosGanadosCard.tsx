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

// ⭐ Frases de OPLO — tono de "compañero de estudio" profesional, nunca infantil.
// Se eligen según si hay subida de nivel y, si no, según el % de acierto del test/reto.
function fraseOplo(g: GamificacionInfo, porcentaje?: number): string {
  if (g.subioNivel) {
    return `¡Has subido a ${g.badgeNivel ? g.badgeNivel + ' ' : ''}${g.nombreNivel}! Sigue así, vas a por la plaza.`;
  }
  if (porcentaje === undefined) return 'Puntos sumados a tu progreso. Cada test cuenta.';
  if (porcentaje >= 80) return '¡Menuda puntería! Así se prepara una plaza.';
  if (porcentaje >= 60) return 'Buen ritmo. Sigue sumando puntos cada día.';
  return 'Puntos en el bolsillo. Repasa lo fallado y a por el siguiente.';
}

export function PuntosGanadosCard({
  gamificacion,
  porcentaje,
}: {
  gamificacion: GamificacionInfo | null | undefined;
  porcentaje?: number;
}) {
  const [contador, setContador] = useState(0);

  useEffect(() => {
    if (!gamificacion || gamificacion.puntosGanados <= 0) return;
    const total = gamificacion.puntosGanados;
    const duracion = 650;
    const inicio = performance.now();
    let raf = 0;
    const tick = (ahora: number) => {
      const progreso = Math.min(1, (ahora - inicio) / duracion);
      setContador(Math.round(progreso * total));
      if (progreso < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gamificacion?.puntosGanados]);

  if (!gamificacion || gamificacion.puntosGanados <= 0) return null;

  const frase = fraseOplo(gamificacion, porcentaje);

  return (
    <div className={`puntos-card ${gamificacion.subioNivel ? 'puntos-card--nivel' : ''}`}>
      {gamificacion.subioNivel && (
        <div className="puntos-card__confeti" aria-hidden="true">
          {['✨', '🎉', '⭐', '✨', '🎉'].map((e, i) => (
            <span key={i} className="puntos-card__confeti-item" style={{ left: `${12 + i * 18}%`, animationDelay: `${i * 0.12}s` }}>
              {e}
            </span>
          ))}
        </div>
      )}

      <div className="puntos-card__oplo">
        <img
          src={getOploUrl(gamificacion.nivelNuevo)}
          alt="OPLO"
          className="puntos-card__oplo-img"
        />
      </div>

      <div className="puntos-card__contenido">
        <div className="puntos-card__puntos">
          <span className="puntos-card__mas">+</span>
          <span className="puntos-card__num">{contador}</span>
          <span className="puntos-card__label">puntos</span>
        </div>

        {gamificacion.subioNivel && (
          <div className="puntos-card__nivel-badge">
            {gamificacion.badgeNivel} Nuevo nivel: {gamificacion.nombreNivel}
          </div>
        )}

        <div className="puntos-card__bocadillo">
          {frase}
        </div>
      </div>

      <style jsx>{`
        @keyframes puntosPopIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes oploBounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(-3deg); }
        }
        @keyframes confetiCaida {
          0% { opacity: 0; transform: translateY(-6px) rotate(0deg); }
          15% { opacity: 1; }
          100% { opacity: 0; transform: translateY(46px) rotate(50deg); }
        }
        .puntos-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border-radius: 16px;
          background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%);
          border: 1px solid #dbeafe;
          overflow: hidden;
          animation: puntosPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .puntos-card--nivel {
          background: linear-gradient(135deg, #fef9c3 0%, #fee2e2 50%, #ede9fe 100%);
          border: 1px solid #fcd34d;
        }
        .puntos-card__confeti {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .puntos-card__confeti-item {
          position: absolute;
          top: -8px;
          font-size: 16px;
          animation: confetiCaida 1.1s ease-in forwards;
        }
        .puntos-card__oplo {
          flex-shrink: 0;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          overflow: hidden;
          background: white;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
          animation: oploBounce 1.6s ease-in-out infinite;
        }
        .puntos-card__oplo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .puntos-card__contenido {
          flex: 1;
          min-width: 0;
        }
        .puntos-card__puntos {
          display: flex;
          align-items: baseline;
          gap: 3px;
          line-height: 1;
        }
        .puntos-card__mas {
          font-size: 16px;
          font-weight: 800;
          color: #1F7CFF;
        }
        .puntos-card__num {
          font-size: 22px;
          font-weight: 800;
          color: #1F7CFF;
        }
        .puntos-card__label {
          font-size: 12px;
          font-weight: 600;
          color: #1F7CFF;
          margin-left: 2px;
        }
        .puntos-card--nivel .puntos-card__mas,
        .puntos-card--nivel .puntos-card__num,
        .puntos-card--nivel .puntos-card__label {
          color: #b45309;
        }
        .puntos-card__nivel-badge {
          margin-top: 4px;
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          color: #92400e;
          background: rgba(255, 255, 255, 0.7);
          padding: 3px 9px;
          border-radius: 999px;
        }
        .puntos-card__bocadillo {
          margin-top: 6px;
          font-size: 12.5px;
          color: #374151;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
