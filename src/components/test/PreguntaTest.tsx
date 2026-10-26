'use client';

// ⭐ Pantalla de pregunta de los tests (general, por tema, por ley y repaso inteligente). Mismo
// sistema que el resto de Practicar: fondo azul OPLORA, tarjetas blancas con sombra, botón redondo
// para salir y color verde de "Test".

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, X, Lightbulb } from 'lucide-react';
import { BG_DASHBOARD as BG_APP, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '@/styles/tokens';
import { BotonSalirTest, ConfirmacionInferior } from '@/components/test/SalirTest';

const SOMBRA = 'var(--c-sombra)';
const COLOR_TEST = 'var(--hx-4d7c0f)';
const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface Pregunta {
  enunciado: string;
  opciones: string[];
  correcta?: number;
  explicacion?: string;
  articulo?: string;
  imagenUrl?: string | null; // psicotécnicos
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
  // ⭐ Duelos (retos): color de acento y texto del aviso al salir
  color?: string;
  avisoSalir?: string;
  enviando?: boolean;
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
  color = COLOR_TEST,
  avisoSalir = 'Perderás el progreso de este test.',
  enviando = false,
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
    ? tiempoRestante > 10 ? 'var(--hx-1f7cff)' : tiempoRestante > 5 ? 'var(--hx-d97706)' : 'var(--hx-dc2626)'
    : 'var(--hx-1f7cff)';

  // Penalización por dejar en blanco: solo si la convocatoria no permite blancos "gratis"
  const restaBlanco = convocatoria?.permiteBlancos === false && convocatoria?.fraccionPenalizacionBlanco
    ? convocatoria.fraccionPenalizacionBlanco
    : null;

  const ultima = preguntaActual + 1 >= preguntas.length;

  const estiloOpcion = (idx: number) => {
    if (!respondida) {
      const sel = seleccionada === idx;
      return { border: sel ? 'var(--hx-0f172a)' : 'transparent', bg: 'var(--c-superficie)', letraBg: sel ? 'var(--hxbg-0f172a)' : 'var(--hx-f3f4f6)', letraColor: sel ? 'var(--c-primario-texto)' : TEXT_SECONDARY, texto: TEXT_PRIMARY };
    }
    if (idx === pregunta.correcta) return { border: 'var(--hx-16a34a)', bg: 'var(--hx-f0fdf4)', letraBg: '#16A34A', letraColor: 'white', texto: 'var(--hx-14532d)' };
    if (idx === seleccionada) return { border: 'var(--hx-dc2626)', bg: 'var(--hx-fef2f2)', letraBg: '#DC2626', letraColor: 'white', texto: 'var(--hx-7f1d1d)' };
    return { border: 'transparent', bg: 'var(--c-superficie)', letraBg: 'var(--hx-f3f4f6)', letraColor: TEXT_MUTED, texto: TEXT_SECONDARY };
  };

  const salir = () => {
    if (onSalir) onSalir();
    else window.history.back();
  };

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 'calc(170px + env(safe-area-inset-bottom))' }}>
      <ConfirmacionInferior
        abierta={confirmarSalir}
        titulo="¿Salir del test?"
        texto={avisoSalir}
        onCancelar={() => setConfirmarSalir(false)}
        onConfirmar={salir}
      />

      {/* Cabecera fija: salir, progreso y tiempo */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: BG_APP, padding: '12px 1.25rem 12px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setConfirmarSalir(true)}
              aria-label="Salir del test"
              style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <X size={17} color={TEXT_PRIMARY} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY }}>
                  {titulo} · <span style={{ color: TEXT_SECONDARY, fontWeight: 600 }}>Pregunta {preguntaActual + 1} de {preguntas.length}</span>
                </span>
              </div>
              <div style={{ height: 6, background: 'color-mix(in srgb, var(--c-superficie) 85%, transparent)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${((preguntaActual + 1) / preguntas.length) * 100}%`, height: '100%', background: color, borderRadius: 999, transition: 'width .25s' }} />
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
        {/* Enunciado */}
        <div style={{ background: 'var(--c-superficie)', borderRadius: 18, padding: 18, boxShadow: SOMBRA, marginBottom: 12 }}>
          {pregunta.imagenUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pregunta.imagenUrl} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 14, display: 'block' }} />
          )}
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
                {respondida && idx === pregunta.correcta && <CheckCircle2 size={20} color="var(--hx-16a34a)" style={{ flexShrink: 0 }} />}
                {respondida && idx === seleccionada && idx !== pregunta.correcta && <XCircle size={20} color="var(--hx-dc2626)" style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>

        {/* Explicación */}
        {respondida && mostrarExplicaciones && pregunta.explicacion && (
          <div style={{ marginTop: 14, background: 'var(--c-superficie)', borderRadius: 16, padding: 16, boxShadow: SOMBRA, display: 'flex', gap: 10 }}>
            <Lightbulb size={17} color={COLOR_TEST} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 14, color: 'var(--hx-374151)', lineHeight: 1.65 }}>{pregunta.explicacion}</div>
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
                disabled={seleccionada === null || enviando}
                style={{
                  width: '100%', height: 52, borderRadius: 14, border: 'none',
                  background: seleccionada !== null ? 'var(--hxbg-0f172a)' : 'var(--hx-dde3ee)',
                  color: seleccionada !== null ? 'var(--c-primario-texto)' : TEXT_MUTED,
                  fontSize: 15, fontWeight: 700, cursor: seleccionada !== null ? 'pointer' : 'default',
                }}
              >
                {!mostrarExplicaciones
                  ? (ultima ? 'Finalizar y ver resultados' : 'Siguiente pregunta')
                  : 'Comprobar respuesta'}
              </button>

              {/* ⭐ Salir desde abajo (antes había que subir hasta la X) y, si se puede, dejar en blanco */}
              <div style={{ display: 'flex', gap: 8 }}>
                <BotonSalirTest onClick={() => setConfirmarSalir(true)} />
                {permitirBlancos && dejarEnBlanco && (
                  <button
                    disabled={enviando}
                    onClick={() => {
                      if (!mostrarExplicaciones) {
                        dejarEnBlanco(false);
                        setTimeout(siguiente, 100);
                        return;
                      }
                      dejarEnBlanco();
                    }}
                    style={{
                      flex: 1, height: 42, borderRadius: 12, border: 'none', boxShadow: SOMBRA,
                      background: 'var(--c-superficie)', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Dejar en blanco
                    <span style={{ fontSize: 11, color: restaBlanco ? 'var(--hx-d97706)' : 'var(--hx-16a34a)', marginLeft: 6, fontWeight: 500 }}>
                      · {restaBlanco ? `resta ${restaBlanco}` : 'no resta'}
                    </span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <BotonSalirTest onClick={() => setConfirmarSalir(true)} alto={52} />
              <button
                onClick={siguiente}
                style={{ flex: 1, height: 52, borderRadius: 14, border: 'none', background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
              >
                {ultima ? 'Ver resultados' : 'Siguiente pregunta'}
              </button>
            </div>
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
      style={{ position: 'relative', width: D, height: D, borderRadius: '50%', background: 'var(--c-superficie)', boxShadow: SOMBRA, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg width={D} height={D} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={D / 2} cy={D / 2} r={r - 2} fill="none" stroke="var(--hx-eef0f3)" strokeWidth={g} />
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
