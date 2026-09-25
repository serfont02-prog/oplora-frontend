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
  const [mostrarConfirmSalir, setMostrarConfirmSalir] = useState(false);

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
    // ⭐ El CTA de abajo es "position: fixed" y puede llegar a medir ~160-190px de alto (dos
    // botones + su padding), pero este contenedor solo reservaba 120px de paddingBottom. La
    // diferencia (40-70px) quedaba tapada por el CTA fijo: la última opción (o la explicación,
    // tras responder) se escondía detrás del overlay, dando la sensación de que "no se ven las
    // preguntas" mientras lo único claramente visible era el botón grande del CTA. Se sube el
    // margen a un valor con colchón de sobra (y se añade el inset de la barra inferior del
    // móvil, "notch"/gesture bar en iOS, que tampoco se tenía en cuenta).
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 52px)',
      paddingBottom: 'calc(200px + env(safe-area-inset-bottom))',
    }}>

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
          onClick={() => setMostrarConfirmSalir(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', flexShrink: 0 }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Modal de confirmación al salir del test */}
      {mostrarConfirmSalir && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '1.5rem', width: '100%', maxWidth: '400px', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
              ¿Seguro que quieres salir?
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.5, marginBottom: '20px' }}>
              Perderás el progreso del test.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => setMostrarConfirmSalir(false)}
                style={{
                  width: '100%', height: '48px', borderRadius: '14px', border: 'none',
                  background: '#111827', color: 'white', fontSize: '14px', fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Seguir con el test
              </button>
              <button
                onClick={() => window.history.back()}
                style={{
                  width: '100%', height: '48px', borderRadius: '14px',
                  border: '1px solid #e5e7eb', background: 'white',
                  color: '#6b7280', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Salir del test
              </button>
            </div>
          </div>
        </div>
      )}

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
      {/* ⭐ fontSize fijo en 24px se veía desproporcionado en pantallas de móvil estrechas
          (donde 24px en negrita ocupa mucho más ancho relativo que en un monitor de escritorio,
          dando la sensación de "letras enormes"). Con clamp() escala entre 18px (móviles
          pequeños, <360px) y 22px (pantallas más anchas), sin depender de media queries.
          overflowWrap evita que una palabra larga (términos legales, "inconstitucionalidad")
          desborde el contenedor y fuerce un scroll horizontal que agranda visualmente el texto. */}
      <div style={{
        fontSize: 'clamp(18px, 5vw, 22px)', lineHeight: 1.35, fontWeight: 700, color: '#111827',
        marginBottom: '28px', overflowWrap: 'break-word', wordBreak: 'break-word',
      }}>
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
                {/* ⭐ minWidth: 0 es necesario en un hijo flex con texto largo: por defecto un
                    flex item tiene min-width:auto, así que un texto sin espacios de sobra
                    (un enlace, un número de artículo largo) puede forzar al item a crecer
                    más allá del ancho del botón y desbordar la fila en vez de hacer wrap. */}
                <div style={{ flex: 1, minWidth: 0, fontSize: '15px', lineHeight: 1.5, fontWeight: 500, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                  {/* ⭐ Algunas preguntas importadas llevan el prefijo "a) "/"b) "... ya escrito
                      dentro del propio texto, y el badge de arriba (A/B/C/D) ya lo representa
                      visualmente, así que salía duplicado ("A" + "a) ..."). Lo quitamos aquí
                      en el render, sin tocar los datos guardados. */}
                  {opcion.replace(/^[a-dA-D]\)\s*/, '')}
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
    {/* ⭐ Antes "bottom: 76px" — esa pantalla no tiene barra de navegación inferior (se
        comprobó en app/app/layout.tsx), así que ese hueco no dejaba sitio para nada real:
        solo empujaba el CTA 76px por encima del borde inferior real de la pantalla, dejando
        una franja vacía y reduciendo aún más la parte visible del cuestionario en pantallas
        bajas. Se ancla a bottom: 0 con el inset de zona segura del móvil (barra de gestos/
        notch de iOS) en vez de un número fijo inventado. */}
<div style={{
  position: 'fixed', bottom: 0, left: 0, right: 0,
  padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
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
            {convocatoria?.fraccionPenalizacion === false && (
              <span style={{ fontSize: '11px', color: '#16A34A', marginLeft: '6px' }}>· sin penalización</span>
            )}
            {convocatoria?.fraccionPenalizacion === true && convocatoria?.fraccionPenalizacion && (
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