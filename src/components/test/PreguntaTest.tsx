'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface Pregunta {
  enunciado: string;
  opciones: string[];
  correcta: number;
  explicacion?: string;
  articulo?: string;
}

type Props = {
  preguntas: Pregunta[];
  preguntaActual: number;
  seleccionada: number | null;
  setSeleccionada: (v: number | null) => void;
  respondida: boolean;
  comprobar: (mostrarCorreccion?: boolean) => void;
  siguiente: () => void;
  getColorOpcion: (idx: number) => { bg: string; border: string; color: string };
  mostrarExplicaciones?: boolean;
  tiempoPorPregunta?: string | null;
  permitirBlancos?: boolean;
  convocatoria?: any;
  dejarEnBlanco?: (mostrarCorreccion?: boolean) => void;
};

export default function PreguntaTest({
  preguntas,
  preguntaActual,
  seleccionada,
  setSeleccionada,
  respondida,
  comprobar,
  siguiente,
  getColorOpcion,
  mostrarExplicaciones = true,
  tiempoPorPregunta,
  permitirBlancos = true,
  convocatoria,
  dejarEnBlanco,
}: Props) {
  const pregunta = preguntas[preguntaActual];

const tiempoTotal = tiempoPorPregunta === '30s' ? 30 : tiempoPorPregunta === '60s' ? 60 : null;
const [tiempoRestante, setTiempoRestante] = useState<number | null>(tiempoTotal);
const intervalRef = useRef<any>(null);
const timeoutRef = useRef<any>(null); // ⭐ añadir

// Refs para acceder a valores actuales dentro de callbacks
const respondidaRef = useRef(respondida);
useEffect(() => {
  respondidaRef.current = respondida;
}, [respondida]);

// Reset temporizador al cambiar de pregunta
useEffect(() => {
  if (!tiempoTotal) return;
  setTiempoRestante(tiempoTotal);

  intervalRef.current = setInterval(() => {
    setTiempoRestante((prev) => {
      if (prev === null) return null;
      if (prev <= 1) {
        clearInterval(intervalRef.current);
        console.log('tiempo agotado, respondida:', respondidaRef.current)
        if (!respondidaRef.current) {
          if (!mostrarExplicaciones) {
            dejarEnBlanco?.(false);
            siguiente();
            return 0;
          }
          dejarEnBlanco?.();
          timeoutRef.current = setTimeout(() => {
            siguiente();
          }, 2000);
        }
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => {
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current); // ⭐ limpiar timeout
  };
}, [preguntaActual, tiempoTotal]);

// Parar temporizador cuando se responde
useEffect(() => {
  if (respondida) {
    console.log('respondida=true, cancelando timeout:', timeoutRef.current);
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current); // ⭐ cancelar timeout si responde manualmente
  }
}, [respondida]);

  if (!pregunta) return null;

  const porcentajeTiempo = tiempoTotal && tiempoRestante !== null
    ? (tiempoRestante / tiempoTotal) * 100
    : null;

  const colorTiempo = tiempoRestante !== null
    ? tiempoRestante > 10 ? '#1F7CFF' : tiempoRestante > 5 ? '#d97706' : '#dc2626'
    : '#1F7CFF';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 52px)', paddingBottom: '120px' }}>

      {/* Header con progreso y cancelar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>
              Pregunta {preguntaActual + 1}
            </span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              {preguntas.length}
            </span>
          </div>
          <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              width: `${((preguntaActual + 1) / preguntas.length) * 100}%`,
              height: '100%',
              background: '#111827',
              borderRadius: '999px',
              transition: 'width .25s',
            }} />
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm('¿Seguro que quieres salir? Perderás el progreso del test.')) {
              window.history.back();
            }
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', flexShrink: 0 }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Temporizador */}
      {tiempoTotal && tiempoRestante !== null && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>Tiempo restante</span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: colorTiempo, transition: 'color 0.3s' }}>
              {tiempoRestante}s
            </span>
          </div>
          <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              width: `${porcentajeTiempo}%`,
              height: '100%',
              background: colorTiempo,
              borderRadius: '999px',
              transition: 'width 1s linear, background 0.3s',
            }} />
          </div>
        </div>
      )}


      {/* Pregunta */}
      <div style={{ fontSize: '24px', lineHeight: 1.3, fontWeight: 700, color: '#111827', marginBottom: '28px' }}>
        {pregunta.enunciado}
      </div>

      {/* Opciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {pregunta.opciones.map((opcion, idx) => {
          const c = getColorOpcion(idx);
          return (
            <button
              key={idx}
              onClick={() => !respondida && setSeleccionada(idx)}
              style={{
                width: '100%', padding: '18px', borderRadius: '18px',
                border: `2px solid ${c.border}`, background: c.bg, color: c.color,
                textAlign: 'left', cursor: respondida ? 'default' : 'pointer',
                transition: '.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: seleccionada === idx ? '#111827' : '#f3f4f6',
                  color: seleccionada === idx ? 'white' : '#6b7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '14px', flexShrink: 0,
                }}>
                  {['A', 'B', 'C', 'D'][idx]}
                </div>
                <div style={{ flex: 1, fontSize: '15px', lineHeight: 1.5, fontWeight: 500 }}>
                  {opcion}
                </div>
                {respondida && idx === pregunta.correcta && <CheckCircle size={20} color="#16a34a" />}
                {respondida && idx === seleccionada && idx !== pregunta.correcta && <XCircle size={20} color="#dc2626" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Explicación */}
      {respondida && mostrarExplicaciones && pregunta.explicacion && (
        <div style={{ marginTop: '22px', background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '18px', padding: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Explicación
          </div>
          <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7 }}>
            {pregunta.explicacion}
          </div>
        </div>
      )}

    {/* CTA fijo */}
<div style={{
  position: 'fixed', bottom: '76px', left: 0, right: 0,
  padding: '16px',
  background: 'linear-gradient(to top, #fff 70%, transparent)',
}}>
  <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {!respondida ? (
      <>
        <button
          onClick={() => {
            if (seleccionada === null) return;
            // Sin explicaciones → avanzar automáticamente
            // En la última pregunta, siguiente() llamará a finalizar()
           if (!mostrarExplicaciones) {
              comprobar(false);
              setTimeout(siguiente, 100);
              return;
            }
            comprobar();
          }}
          disabled={seleccionada === null}
          style={{
            width: '100%', height: '56px', borderRadius: '18px', border: 'none',
            background: seleccionada !== null ? '#111827' : '#e5e7eb',
            color: seleccionada !== null ? 'white' : '#9ca3af',
            fontSize: '15px', fontWeight: 700,
            cursor: seleccionada !== null ? 'pointer' : 'not-allowed',
          }}
        >
          {!mostrarExplicaciones && preguntaActual + 1 >= preguntas.length
          ? 'Finalizar y ver resultados'
          : mostrarExplicaciones
            ? 'Comprobar respuesta'
            : 'Siguiente pregunta'}
        </button>

        {permitirBlancos && dejarEnBlanco && (
          <button
            onClick={() => {
            if (!mostrarExplicaciones) {
              dejarEnBlanco(false);
              setTimeout(siguiente, 100);
              return;
            }

            dejarEnBlanco();
          }}
            style={{
              width: '100%', height: '44px', borderRadius: '14px',
              border: '1px solid #e5e7eb', background: 'white',
              color: '#9ca3af', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            ⬜ Dejar en blanco
            {convocatoria?.penalizacion === false && (
              <span style={{ fontSize: '11px', color: '#16A34A', marginLeft: '6px' }}>· sin penalización</span>
            )}
            {convocatoria?.penalizacion === true && convocatoria?.fraccionPenalizacion && (
              <span style={{ fontSize: '11px', color: '#d97706', marginLeft: '6px' }}>· penaliza {convocatoria.fraccionPenalizacion}</span>
            )}
          </button>
        )}
      </>
    ) : (
      <button
        onClick={siguiente}
        style={{
          width: '100%', height: '56px', borderRadius: '18px', border: 'none',
          background: '#111827', color: 'white', fontSize: '15px', fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {preguntaActual + 1 >= preguntas.length ? 'Ver resultados' : 'Siguiente pregunta'}
      </button>
    )}
  </div>
</div>
    </div>
  );
}