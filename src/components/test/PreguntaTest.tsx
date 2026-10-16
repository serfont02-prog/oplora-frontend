'use client';

// ⭐ Pantalla de pregunta de los tests (general, por tema, por ley y repaso inteligente). Mismo
// sistema que el resto de Practicar: fondo azul OPLORA, tarjetas blancas con sombra, botón redondo
// para salir y color verde de "Test".

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, X, Lightbulb } from 'lucide-react';
import { BG_DASHBOARD as BG_APP, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '@/styles/tokens';

const SOMBRA = '0 6px 18px rgba(15, 23, 42, 0.08)';
const COLOR_TEST = '#4D7C0F';
const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

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
  getColorOpcion?: (idx: number) => { bg: string; border: string; color: string };
  mostrarExplicaciones?: boolean;
  tiempoPorPregunta?: string | null;
  permitirBlancos?: boolean;
  convocatoria?: any;
  dejarEnBlanco?: (mostrarCorreccion?: boolean) => void;
  titulo?: string;
  onSalir?: () => void;
};

export default function PreguntaTest({
  preguntas,
  preguntaActual,
  seleccionada,
  setSeleccionada,
  respondida,
  comprobar,
  siguiente,
  mostrarExplicaciones = true,
  tiempoPorPregunta,
  permitirBlancos = true,
  convocatoria,
  dejarEnBlanco,
  titulo = 'Test',
  onSalir,
}: Props) {
  const pregunta = preguntas[preguntaActual];
  const [confirmarSalir, setConfirmarSalir] = useState(false);

  const tiempoTotal = tiempoPorPregunta === '30s' ? 30 : tiempoPorPregunta === '60s' ? 60 : null;
  const [tiempoRestante, setTiempoRestante] = useState<number | null>(tiempoTotal);
  const timeoutRef = useRef<any>(null);

  // Cuenta atrás por pregunta: el intervalo solo descuenta. Lo que pasa al llegar a 0 va en otro
  // efecto (antes se hacía dentro del setState, que React puede ejecutar dos veces).
  useEffect(() => {
    if (!tiempoTotal) return;
    setTiempoRestante(tiempoTotal);
    const t = setInterval(() => setTiempoRestante((prev) => (prev === null || prev <= 0 ? prev : prev - 1)), 1000);
    return () => { clearInterval(t); clearTimeout(timeoutRef.current); };
  }, [preguntaActual, tiempoTotal]);

  useEffect(() => {
    if (!tiempoTotal || tiempoRestante !== 0 || respondida) return;
    if (!mostrarExplicaciones) {
      dejarEnBlanco?.(false);
      siguiente();
      return;
    }
    dejarEnBlanco?.();
    timeoutRef.current = setTimeout(() => siguiente(), 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiempoRestante]);

  // (El avance automático tras agotar el tiempo se cancela solo al cambiar de pregunta: antes se
  // cancelaba al marcarse como respondida, que ocurre justo al agotarse, y nunca avanzaba.)

  if (!pregunta) return null;

  const pctTiempo = tiempoTotal && tiempoRestante !== null ? (tiempoRestante / tiempoTotal) * 100 : null;
  const colorTiempo = tiempoRestante !== null
    ? tiempoRestante > 10 ? '#1F7CFF' : tiempoRestante > 5 ? '#D97706' : '#DC2626'
    : '#1F7CFF';

  // Penalización por dejar en blanco: solo si la convocatoria no permite blancos "gratis"
  const restaBlanco = convocatoria?.permiteBlancos === false && convocatoria?.fraccionPenalizacionBlanco
    ? convocatoria.fraccionPenalizacionBlanco
    : null;

  const ultima = preguntaActual + 1 >= preguntas.length;

  const estiloOpcion = (idx: number) => {
    if (!respondida) {
      const sel = seleccionada === idx;
      return { border: sel ? '#0f172a' : 'transparent', bg: 'white', letraBg: sel ? '#0f172a' : '#F3F4F6', letraColor: sel ? 'white' : TEXT_SECONDARY, texto: TEXT_PRIMARY };
    }
    if (idx === pregunta.correcta) return { border: '#16A34A', bg: '#F0FDF4', letraBg: '#16A34A', letraColor: 'white', texto: '#14532D' };
    if (idx === seleccionada) return { border: '#DC2626', bg: '#FEF2F2', letraBg: '#DC2626', letraColor: 'white', texto: '#7F1D1D' };
    return { border: 'transparent', bg: 'white', letraBg: '#F3F4F6', letraColor: TEXT_MUTED, texto: TEXT_SECONDARY };
  };

  const salir = () => {
    if (onSalir) onSalir();
    else window.history.back();
  };

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 'calc(170px + env(safe-area-inset-bottom))' }}>

      {/* Cabecera fija: salir, progreso y tiempo */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: BG_APP, padding: '12px 1.25rem 12px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setConfirmarSalir(true)}
              aria-label="Salir del test"
              style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'white', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <X size={17} color={TEXT_PRIMARY} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY }}>
                  {titulo} · <span style={{ color: TEXT_SECONDARY, fontWeight: 600 }}>Pregunta {preguntaActual + 1} de {preguntas.length}</span>
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.85)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${((preguntaActual + 1) / preguntas.length) * 100}%`, height: '100%', background: COLOR_TEST, borderRadius: 999, transition: 'width .25s' }} />
              </div>
            </div>
            {/* ⭐ Cuenta atrás en un reloj circular aparte: antes era otra barra justo debajo de la
                de progreso, con el mismo formato, y se confundían. */}
            {pctTiempo !== null && tiempoRestante !== null && (
              <RelojPregunta segundos={tiempoRestante} pct={pctTiempo} color={colorTiempo} />
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '4px 1.25rem 0' }}>
        {/* Confirmar salida, en la propia pantalla */}
        {confirmarSalir && (
          <div style={{ background: 'white', borderRadius: 16, padding: 14, boxShadow: SOMBRA, marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>¿Salir del test?</div>
            <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 3 }}>Perderás el progreso de este test.</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => setConfirmarSalir(false)} style={{ flex: 1, border: 'none', background: '#F3F4F6', color: TEXT_SECONDARY, borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Seguir
              </button>
              <button onClick={salir} style={{ flex: 1, border: 'none', background: '#DC2626', color: 'white', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Salir
              </button>
            </div>
          </div>
        )}

        {/* Enunciado */}
        <div style={{ background: 'white', borderRadius: 18, padding: 18, boxShadow: SOMBRA, marginBottom: 12 }}>
          <div style={{
            fontSize: 'clamp(16px, 4.4vw, 19px)', lineHeight: 1.45, fontWeight: 700, color: TEXT_PRIMARY,
            overflowWrap: 'break-word', wordBreak: 'break-word',
          }}>
            {pregunta.enunciado}
          </div>
          {pregunta.articulo && (
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 8 }}>{pregunta.articulo}</div>
          )}
        </div>

        {/* Opciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pregunta.opciones.map((opcion, idx) => {
            const c = estiloOpcion(idx);
            return (
              <button
                key={idx}
                onClick={() => !respondida && setSeleccionada(idx)}
                style={{
                  width: '100%', padding: '13px 14px', borderRadius: 14,
                  border: `2px solid ${c.border}`, background: c.bg, color: c.texto, boxShadow: SOMBRA,
                  textAlign: 'left', cursor: respondida ? 'default' : 'pointer', transition: '.15s',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <span style={{
                  width: 30, height: 30, borderRadius: '50%', background: c.letraBg, color: c.letraColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0,
                }}>
                  {LETRAS[idx] ?? idx + 1}
                </span>
                {/* Algunas preguntas importadas traen "a) " delante: la letra ya lo indica */}
                <span style={{ flex: 1, minWidth: 0, fontSize: 15, lineHeight: 1.45, fontWeight: 500, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                  {opcion.replace(/^[a-fA-F]\)\s*/, '')}
                </span>
                {respondida && idx === pregunta.correcta && <CheckCircle2 size={20} color="#16A34A" style={{ flexShrink: 0 }} />}
                {respondida && idx === seleccionada && idx !== pregunta.correcta && <XCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>

        {/* Explicación */}
        {respondida && mostrarExplicaciones && pregunta.explicacion && (
          <div style={{ marginTop: 14, background: 'white', borderRadius: 16, padding: 16, boxShadow: SOMBRA, display: 'flex', gap: 10 }}>
            <Lightbulb size={17} color={COLOR_TEST} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.65 }}>{pregunta.explicacion}</div>
          </div>
        )}
      </div>

      {/* Botones fijos abajo */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '14px 1.25rem', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
        background: `linear-gradient(to top, ${BG_APP} 72%, transparent)`,
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!respondida ? (
            <>
              <button
                onClick={() => {
                  if (seleccionada === null) return;
                  // Sin explicaciones se avanza directamente (en la última, siguiente() finaliza)
                  if (!mostrarExplicaciones) {
                    comprobar(false);
                    setTimeout(siguiente, 100);
                    return;
                  }
                  comprobar();
                }}
                disabled={seleccionada === null}
                style={{
                  width: '100%', height: 52, borderRadius: 14, border: 'none',
                  background: seleccionada !== null ? '#0f172a' : '#DDE3EE',
                  color: seleccionada !== null ? 'white' : TEXT_MUTED,
                  fontSize: 15, fontWeight: 700, cursor: seleccionada !== null ? 'pointer' : 'default',
                }}
              >
                {!mostrarExplicaciones
                  ? (ultima ? 'Finalizar y ver resultados' : 'Siguiente pregunta')
                  : 'Comprobar respuesta'}
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
                    width: '100%', height: 42, borderRadius: 12, border: 'none', boxShadow: SOMBRA,
                    background: 'white', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Dejar en blanco
                  <span style={{ fontSize: 11, color: restaBlanco ? '#D97706' : '#16A34A', marginLeft: 6, fontWeight: 500 }}>
                    · {restaBlanco ? `resta ${restaBlanco}` : 'no resta'}
                  </span>
                </button>
              )}
            </>
          ) : (
            <button
              onClick={siguiente}
              style={{ width: '100%', height: 52, borderRadius: 14, border: 'none', background: '#0f172a', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              {ultima ? 'Ver resultados' : 'Siguiente pregunta'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Reloj circular de la cuenta atrás por pregunta (segundos dentro, aro que se vacía). */
function RelojPregunta({ segundos, pct, color }: { segundos: number; pct: number; color: string }) {
  const D = 46;
  const g = 4;
  const r = (D - g) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      aria-label={`Quedan ${segundos} segundos`}
      style={{ position: 'relative', width: D, height: D, borderRadius: '50%', background: 'white', boxShadow: SOMBRA, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg width={D} height={D} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={D / 2} cy={D / 2} r={r - 2} fill="none" stroke="#EEF0F3" strokeWidth={g} />
        <circle
          cx={D / 2} cy={D / 2} r={r - 2} fill="none" stroke={color} strokeWidth={g} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <span style={{ position: 'relative', fontSize: 14, fontWeight: 800, color, lineHeight: 1 }}>
        {segundos}<span style={{ fontSize: 9, fontWeight: 700 }}>s</span>
      </span>
    </div>
  );
}
