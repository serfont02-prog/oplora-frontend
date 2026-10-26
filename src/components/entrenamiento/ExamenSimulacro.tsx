'use client';

// ⭐ Examen de simulacro (oficial y OPLORA comparten pantalla): presentación → examen con tiempo →
// nota y revisión pregunta a pregunta. Mismo sistema que el resto de Practicar: tarjetas blancas con
// sombra, botones redondos, iconos lucide y el color de "Simulacro" (Timer, marrón).

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, X, Clock, Timer, CheckCircle2, XCircle, MinusCircle, ChevronDown, Lightbulb, Grid3x3, Send, Ban, AlertTriangle, BookX } from 'lucide-react';
import { BG_DASHBOARD as BG_APP, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '@/styles/tokens';
import { BotonSalirTest, ConfirmacionInferior } from '@/components/test/SalirTest';

export const COLOR_SIMULACRO = 'var(--hx-6b5f3e)';
export const COLOR_SIMULACRO_BG = 'var(--hx-ede9dd)';
const SOMBRA = 'var(--c-sombra)';
const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

// `anulada`: pregunta anulada por el tribunal (se muestra pero no puntúa). Solo en el simulacro oficial.
export type PreguntaSimulacro = { id: string; enunciado: string; opciones: string[]; anulada?: boolean };
export type RespuestaSimulacro = { preguntaId: string; opcionElegida: number | null };

type Props = {
  eyebrow: string;
  titulo: string;
  subtitulo?: string;
  preguntas: PreguntaSimulacro[];
  tiempoMinutos?: number | null;
  fraccionPenalizacion?: string | null;
  notaMinima?: number | string | null;
  aviso: string;
  onVolver: () => void;
  onCorregir: (respuestas: RespuestaSimulacro[], segundosUsados: number) => Promise<any>;
  onSalirFinal: () => void;
  onOtro?: () => void;
  textoOtro?: string;
};

const limpiar = (op: string) => (op ?? '').replace(/^[a-fA-F]\)\s*/, '');
const formatoReloj = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};

function BotonRedondo({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
    >
      {children}
    </button>
  );
}

export default function ExamenSimulacro({
  eyebrow, titulo, subtitulo, preguntas, tiempoMinutos, fraccionPenalizacion, notaMinima, aviso,
  onVolver, onCorregir, onSalirFinal, onOtro, textoOtro = 'Hacer otro',
}: Props) {
  const [fase, setFase] = useState<'intro' | 'examen' | 'resultado'>('intro');
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, number | null>>({});
  const [segundos, setSegundos] = useState(0); // transcurridos
  const [verMapa, setVerMapa] = useState(false);
  const [confirmar, setConfirmar] = useState<'entregar' | 'salir' | null>(null);
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [errorCorregir, setErrorCorregir] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const enviadoRef = useRef(false);

  const limiteSeg = tiempoMinutos ? tiempoMinutos * 60 : null;
  const restantes = limiteSeg !== null ? Math.max(0, limiteSeg - segundos) : null;
  const respondidas = preguntas.filter((p) => typeof respuestas[p.id] === 'number').length;
  const sinResponder = preguntas.length - respondidas;

  const entregar = async () => {
    if (enviadoRef.current) return;
    enviadoRef.current = true;
    setCorrigiendo(true);
    setErrorCorregir(false);
    setConfirmar(null);
    try {
      const lista = preguntas.map((p) => ({ preguntaId: p.id, opcionElegida: typeof respuestas[p.id] === 'number' ? (respuestas[p.id] as number) : null }));
      const r = await onCorregir(lista, segundos);
      setResultado(r);
      setFase('resultado');
      window.scrollTo({ top: 0 });
    } catch {
      setErrorCorregir(true);
      enviadoRef.current = false;
    } finally {
      setCorrigiendo(false);
    }
  };

  // Cronómetro (cuenta el tiempo usado; si hay límite, entrega sola al acabarse)
  useEffect(() => {
    if (fase !== 'examen') return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [fase]);

  useEffect(() => {
    if (fase === 'examen' && restantes === 0 && !enviadoRef.current) entregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restantes, fase]);

  // Aviso del navegador si se cierra la pestaña a mitad de examen
  useEffect(() => {
    if (fase !== 'examen') return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [fase]);

  /* ───────────── PRESENTACIÓN ───────────── */
  if (fase === 'intro') {
    const filas: [string, string][] = [
      ['Preguntas', String(preguntas.length)],
      ['Tiempo', tiempoMinutos ? `${tiempoMinutos} minutos` : 'Sin límite'],
      ['Penalización por error', fraccionPenalizacion ? `Resta ${fraccionPenalizacion}` : 'No resta'],
      ...(notaMinima != null && notaMinima !== '' ? [['Nota para aprobar', String(notaMinima)] as [string, string]] : []),
    ];
    return (
      <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 30 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
            <BotonRedondo onClick={onVolver} label="Volver"><ArrowLeft size={18} color={TEXT_PRIMARY} /></BotonRedondo>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{eyebrow}</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>{titulo}</div>
              {subtitulo && <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{subtitulo}</div>}
            </div>
          </div>

          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
            {filas.map(([k, v], i) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < filas.length - 1 ? '1px solid var(--hx-eef0f3)' : 'none' }}>
                <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, background: 'var(--c-superficie)', borderRadius: 14, padding: 14, boxShadow: SOMBRA, fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.55 }}>
            <Timer size={18} color={COLOR_SIMULACRO} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{aviso}</span>
          </div>

          <button
            onClick={() => { setFase('examen'); window.scrollTo({ top: 0 }); }}
            disabled={preguntas.length === 0}
            style={{ width: '100%', padding: 14, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: preguntas.length === 0 ? 0.5 : 1 }}
          >
            Empezar examen
          </button>
        </div>
      </div>
    );
  }

  /* ───────────── EXAMEN ───────────── */
  if (fase === 'examen') {
    const p = preguntas[indice];
    const elegida = respuestas[p?.id];
    const pocoTiempo = restantes !== null && restantes <= 300;

    return (
      <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 110 }}>
        {/* Confirmaciones: hoja inferior, visible desde cualquier punto de la pantalla */}
        <ConfirmacionInferior
          abierta={!!confirmar}
          titulo={confirmar === 'entregar' ? '¿Entregar el examen?' : '¿Salir del examen?'}
          texto={confirmar === 'entregar'
            ? (sinResponder > 0 ? `Te quedan ${sinResponder} ${sinResponder === 1 ? 'pregunta' : 'preguntas'} sin responder; contarán como en blanco.` : 'Has respondido todas las preguntas.')
            : 'No se guardará nada de este intento.'}
          textoConfirmar={confirmar === 'entregar' ? 'Entregar' : 'Salir'}
          peligro={confirmar !== 'entregar'}
          onCancelar={() => setConfirmar(null)}
          onConfirmar={() => (confirmar === 'entregar' ? entregar() : onVolver())}
        />
        {/* Barra superior fija */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: BG_APP, padding: '12px 1.25rem 10px' }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BotonRedondo onClick={() => setConfirmar('salir')} label="Salir del examen"><X size={17} color={TEXT_PRIMARY} /></BotonRedondo>
              <button
                onClick={() => setVerMapa((v) => !v)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, minWidth: 0 }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>{indice + 1} / {preguntas.length}</span>
                <span style={{ fontSize: 11, color: TEXT_MUTED }}>· {respondidas} respondidas</span>
                <Grid3x3 size={14} color={TEXT_MUTED} />
              </button>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 800,
                color: pocoTiempo ? 'var(--hx-dc2626)' : TEXT_PRIMARY, background: 'var(--c-superficie)', borderRadius: 999, padding: '6px 10px', boxShadow: SOMBRA,
              }}>
                <Clock size={14} />
                {formatoReloj(restantes ?? segundos)}
              </span>
              <button
                onClick={() => setConfirmar('entregar')}
                style={{ display: 'flex', alignItems: 'center', gap: 5, border: 'none', borderRadius: 999, padding: '8px 12px', background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                <Send size={13} /> Entregar
              </button>
            </div>
            <div style={{ height: 5, background: 'color-mix(in srgb, var(--c-superficie) 80%, transparent)', borderRadius: 999, overflow: 'hidden', marginTop: 10 }}>
              <div style={{ width: `${(respondidas / Math.max(1, preguntas.length)) * 100}%`, height: '100%', background: COLOR_SIMULACRO, borderRadius: 999, transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 560, margin: '0 auto', padding: '6px 1.25rem 0' }}>
          {(corrigiendo || errorCorregir) && (
            <div style={{ background: 'var(--c-superficie)', borderRadius: 14, padding: 12, boxShadow: SOMBRA, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: errorCorregir ? 'var(--hx-b91c1c)' : TEXT_SECONDARY }}>
              <span style={{ flex: 1 }}>{errorCorregir ? 'No se ha podido corregir el examen. Comprueba la conexión.' : 'Corrigiendo…'}</span>
              {errorCorregir && (
                <button onClick={entregar} style={{ border: 'none', background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Reintentar</button>
              )}
            </div>
          )}

          {/* Mapa de preguntas (plegable: con 100 preguntas ocupaba media pantalla) */}
          {verMapa && (
            <div style={{ background: 'var(--c-superficie)', borderRadius: 16, padding: 12, boxShadow: SOMBRA, marginBottom: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(34px, 1fr))', gap: 6 }}>
              {preguntas.map((q, i) => {
                const hecha = typeof respuestas[q.id] === 'number';
                const actual = i === indice;
                return (
                  <button
                    key={q.id}
                    onClick={() => { setIndice(i); setVerMapa(false); }}
                    style={{
                      height: 34, borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      border: actual ? `2px solid ${COLOR_SIMULACRO}` : '2px solid transparent',
                      background: hecha ? COLOR_SIMULACRO_BG : 'var(--hx-f3f4f6)',
                      color: hecha ? COLOR_SIMULACRO : TEXT_MUTED,
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          )}

          {p && (
            <>
              <div style={{ background: 'var(--c-superficie)', borderRadius: 18, padding: 18, boxShadow: SOMBRA, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED }}>Pregunta {indice + 1}</span>
                  {p.anulada && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: 'var(--hx-475569)', background: 'var(--hx-f1f5f9)', borderRadius: 999, padding: '2px 8px' }}>
                      <Ban size={11} /> Anulada por el tribunal · no puntúa
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.55, overflowWrap: 'break-word' }}>{p.enunciado}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {p.opciones.map((op, i) => {
                  const sel = elegida === i;
                  return (
                    <button
                      key={i}
                      // Tocar otra vez la elegida la deja en blanco
                      onClick={() => setRespuestas((prev) => ({ ...prev, [p.id]: prev[p.id] === i ? null : i }))}
                      style={{
                        textAlign: 'left', padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: TEXT_PRIMARY,
                        border: sel ? `2px solid ${COLOR_SIMULACRO}` : '2px solid transparent',
                        background: sel ? 'var(--hx-f7f4ec)' : 'var(--c-superficie)', boxShadow: SOMBRA,
                      }}
                    >
                      <span style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, background: sel ? COLOR_SIMULACRO : 'var(--hx-f3f4f6)', color: sel ? 'white' : TEXT_SECONDARY }}>
                        {LETRAS[i] ?? i + 1}
                      </span>
                      <span style={{ flex: 1, lineHeight: 1.45, minWidth: 0, overflowWrap: 'break-word' }}>{limpiar(op)}</span>
                    </button>
                  );
                })}
              </div>
              {typeof elegida === 'number' && (
                <div style={{ fontSize: 11, color: TEXT_MUTED, textAlign: 'center', marginTop: 8 }}>Toca otra vez tu respuesta para dejarla en blanco</div>
              )}
            </>
          )}
        </div>

        {/* Navegación inferior */}
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '12px 1.25rem', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', background: `linear-gradient(to top, ${BG_APP} 70%, transparent)` }}>
          <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', gap: 8 }}>
            <BotonSalirTest onClick={() => setConfirmar('salir')} alto={46} />
            <button
              onClick={() => setIndice((i) => Math.max(0, i - 1))}
              disabled={indice === 0}
              style={{ flex: 1, padding: 13, background: 'var(--c-superficie)', border: 'none', boxShadow: SOMBRA, borderRadius: 12, fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, cursor: indice === 0 ? 'default' : 'pointer', opacity: indice === 0 ? 0.4 : 1 }}
            >
              Anterior
            </button>
            {indice < preguntas.length - 1 ? (
              <button onClick={() => setIndice((i) => i + 1)} style={{ flex: 1, padding: 13, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Siguiente
              </button>
            ) : (
              <button onClick={() => setConfirmar('entregar')} style={{ flex: 1, padding: 13, background: COLOR_SIMULACRO, color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Entregar examen
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ───────────── RESULTADO ───────────── */
  return <ResultadoSimulacro resultado={resultado} preguntas={preguntas} respuestas={respuestas} segundos={segundos} titulo={titulo} eyebrow={eyebrow} onSalir={onSalirFinal} onOtro={onOtro} textoOtro={textoOtro} />;
}

function ResultadoSimulacro({ resultado, preguntas, respuestas, segundos, titulo, eyebrow, onSalir, onOtro, textoOtro }: any) {
  const [filtro, setFiltro] = useState<'todas' | 'falladas' | 'blanco'>('todas');
  const [abierta, setAbierta] = useState<string | null>(null);

  const nota = Number(resultado?.nota ?? 0);
  const notaMin = resultado?.notaMinima != null ? Number(resultado.notaMinima) : null;
  const aprueba = !!resultado?.aprobarias;
  const D = 140;
  const r = (D - 24 - 10) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, nota * 10));
  const color = aprueba ? 'var(--hx-16a34a)' : 'var(--hx-dc2626)';

  const revisionPorId = useMemo(() => {
    const m = new Map<string, any>();
    for (const d of resultado?.revision ?? []) m.set(d.preguntaId, d);
    return m;
  }, [resultado]);

  const filas = preguntas.map((p: PreguntaSimulacro, i: number) => {
    const d = revisionPorId.get(p.id);
    const sel = typeof respuestas[p.id] === 'number' ? respuestas[p.id] : null;
    const estado: 'correcta' | 'incorrecta' | 'blanco' | 'anulada' =
      d?.estadoPregunta === 'anulada' || (!d && p.anulada) ? 'anulada'
        : d ? (d.enBlanco ? 'blanco' : d.correcta ? 'correcta' : 'incorrecta') : (sel === null ? 'blanco' : 'incorrecta');
    return { p, i, d, sel, estado };
  });
  const visibles = filas.filter((f: any) => filtro === 'todas' || (filtro === 'falladas' ? f.estado === 'incorrecta' : f.estado === 'blanco'));
  const hayRevision = (resultado?.revision ?? []).length > 0;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 30 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
          <BotonRedondo onClick={onSalir} label="Salir"><ArrowLeft size={18} color={TEXT_PRIMARY} /></BotonRedondo>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{eyebrow}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>{titulo}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', width: D, height: D, borderRadius: '50%', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={D - 24} height={D - 24} style={{ position: 'absolute', top: 12, left: 12, transform: 'rotate(-90deg)' }}>
              <circle cx={(D - 24) / 2} cy={(D - 24) / 2} r={r} fill="none" stroke="var(--hx-eef0f3)" strokeWidth={10} />
              {pct > 0 && (
                <circle cx={(D - 24) / 2} cy={(D - 24) / 2} r={r} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
              )}
            </svg>
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1 }}>{nota.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>sobre 10</div>
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, padding: '6px 12px', borderRadius: 999, background: aprueba ? 'var(--hx-f0fdf4)' : 'var(--hx-fef2f2)', color: aprueba ? 'var(--hx-15803d)' : 'var(--hx-b91c1c)' }}>
            {aprueba ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            {aprueba ? 'Con esta nota aprobarías' : 'No llegarías al aprobado'}
            {notaMin != null && <span style={{ fontWeight: 500 }}>· mínimo {notaMin.toLocaleString('es-ES')}</span>}
          </div>
        </div>

        {Number(resultado?.anuladas ?? 0) > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: TEXT_SECONDARY, background: 'var(--c-superficie)', borderRadius: 14, boxShadow: SOMBRA, padding: '10px 12px' }}>
            <Ban size={15} color="var(--hx-64748b)" style={{ flexShrink: 0 }} />
            <span>
              {resultado.anuladas === 1 ? '1 pregunta fue anulada' : `${resultado.anuladas} preguntas fueron anuladas`} por el tribunal y no cuenta{resultado.anuladas === 1 ? '' : 'n'} en la nota, como en el examen real.
            </span>
          </div>
        )}

        <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '14px 4px' }}>
          {[
            { v: resultado?.correctas ?? 0, l: 'Aciertos', c: 'var(--hx-16a34a)' },
            { v: resultado?.incorrectas ?? 0, l: 'Fallos', c: 'var(--hx-dc2626)' },
            { v: resultado?.blancos ?? 0, l: 'En blanco', c: TEXT_SECONDARY },
            { v: formatoReloj(segundos), l: 'Tiempo', c: TEXT_PRIMARY },
          ].map((d, i) => (
            <div key={d.l} style={{ textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--hx-eef0f3)' : 'none' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: d.c }}>{d.v}</div>
              <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 2 }}>{d.l}</div>
            </div>
          ))}
        </div>

        {hayRevision && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY }}>Revisa el examen</span>
              <div style={{ display: 'flex', background: 'color-mix(in srgb, var(--c-superficie) 70%, transparent)', borderRadius: 999, padding: 3, gap: 2 }}>
                {([['todas', 'Todas'], ['falladas', 'Fallos'], ['blanco', 'En blanco']] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setFiltro(k)} style={{ border: 'none', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: filtro === k ? 'var(--hxbg-0f172a)' : 'transparent', color: filtro === k ? 'var(--c-primario-texto)' : TEXT_SECONDARY }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
              {visibles.length === 0 && <div style={{ padding: 16, fontSize: 13, color: TEXT_MUTED }}>No hay preguntas en este filtro.</div>}
              {visibles.map((f: any, k: number) => {
                const Icono = f.estado === 'correcta' ? CheckCircle2 : f.estado === 'incorrecta' ? XCircle : f.estado === 'anulada' ? Ban : MinusCircle;
                const colorEst = f.estado === 'correcta' ? 'var(--hx-16a34a)' : f.estado === 'incorrecta' ? 'var(--hx-dc2626)' : 'var(--hx-94a3b8)';
                const estadoPregunta = f.d?.estadoPregunta;
                const abiertaEsta = abierta === f.p.id;
                const idxCorrecta = f.d?.indiceCorrecta;
                return (
                  <div key={f.p.id} style={{ borderBottom: k < visibles.length - 1 ? '1px solid var(--hx-eef0f3)' : 'none' }}>
                    <button
                      onClick={() => setAbierta(abiertaEsta ? null : f.p.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <Icono size={18} color={colorEst} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, flexShrink: 0 }}>{f.i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.4, ...(abiertaEsta ? {} : { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }) }}>
                        {f.p.enunciado}
                      </span>
                      <ChevronDown size={15} color="var(--hx-c4c9d2)" style={{ flexShrink: 0, transform: abiertaEsta ? 'rotate(180deg)' : 'none' }} />
                    </button>
                    {abiertaEsta && (
                      <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {f.p.opciones.map((op: string, i: number) => {
                          const esCorrecta = i === idxCorrecta;
                          const esTuya = i === f.sel;
                          return (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 10, fontSize: 13,
                              background: esCorrecta ? 'var(--hx-f0fdf4)' : esTuya ? 'var(--hx-fef2f2)' : 'var(--hx-f8f9fa)',
                              color: TEXT_PRIMARY,
                            }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: esCorrecta ? 'var(--hx-16a34a)' : esTuya ? 'var(--hx-dc2626)' : TEXT_MUTED }}>{LETRAS[i] ?? i + 1}</span>
                              <span style={{ flex: 1, lineHeight: 1.4 }}>{limpiar(op)}</span>
                              {esCorrecta && <CheckCircle2 size={15} color="var(--hx-16a34a)" />}
                              {esTuya && !esCorrecta && <XCircle size={15} color="var(--hx-dc2626)" />}
                            </div>
                          );
                        })}
                        {f.estado === 'blanco' && <div style={{ fontSize: 12, color: TEXT_MUTED }}>La dejaste en blanco.</div>}
                        {estadoPregunta === 'anulada' && (
                          <AvisoPregunta Icono={Ban} color="var(--hx-475569)" fondo="var(--hx-f1f5f9)" texto="El tribunal anuló esta pregunta: no cuenta en la nota." />
                        )}
                        {estadoPregunta === 'fuera_temario' && (
                          <AvisoPregunta Icono={BookX} color="var(--hx-92400e)" fondo="var(--hx-fffbeb)" texto="Esta pregunta ya no entra en el temario actual." />
                        )}
                        {estadoPregunta === 'desactualizada' && (
                          <AvisoPregunta
                            Icono={AlertTriangle}
                            color="var(--hx-b45309)"
                            fondo="var(--hx-fff7ed)"
                            texto={`La normativa ha cambiado desde este examen: la respuesta marcada es la oficial de entonces.${f.d?.notaActualizacion ? ` ${f.d.notaActualizacion}` : ''}`}
                          />
                        )}
                        {f.d?.explicacion && (
                          <div style={{ display: 'flex', gap: 8, fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.5, background: 'var(--hx-f8f9fa)', borderRadius: 10, padding: '9px 11px', marginTop: 2 }}>
                            <Lightbulb size={14} color={COLOR_SIMULACRO} style={{ flexShrink: 0, marginTop: 2 }} />
                            <span>{f.d.explicacion}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {onOtro && (
            <button onClick={onOtro} style={{ width: '100%', padding: 14, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {textoOtro}
            </button>
          )}
          <button onClick={onSalir} style={{ width: '100%', padding: 13, background: 'var(--c-superficie)', border: 'none', boxShadow: SOMBRA, color: TEXT_PRIMARY, borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Volver a Practicar
          </button>
        </div>
      </div>
    </div>
  );
}

function AvisoPregunta({ Icono, color, fondo, texto }: { Icono: any; color: string; fondo: string; texto: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 12, color, lineHeight: 1.5, background: fondo, borderRadius: 10, padding: '9px 11px', marginTop: 2 }}>
      <Icono size={14} style={{ flexShrink: 0, marginTop: 2 }} />
      <span>{texto}</span>
    </div>
  );
}

/** Pantalla cuando no se puede cargar el simulacro (plan sin simulacros, sin preguntas, error). */
export function SimulacroNoDisponible({ error, onVolver, onPlanes }: { error: any; onVolver: () => void; onPlanes: () => void }) {
  let bloqueado = false;
  try { bloqueado = JSON.parse(error?.response?.data?.message ?? '{}')?.motivo === 'simulacro_bloqueado'; } catch { /* mensaje normal */ }
  const mensaje = typeof error?.response?.data?.message === 'string' && !bloqueado && !error.response.data.message.startsWith('{')
    ? error.response.data.message
    : null;
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem', background: BG_APP }}>
      <div style={{ background: 'var(--c-superficie)', borderRadius: 20, padding: '1.75rem 1.5rem', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: SOMBRA }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: COLOR_SIMULACRO_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <Timer size={24} color={COLOR_SIMULACRO} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>
          {bloqueado ? 'Los simulacros son de los planes de pago' : 'No se ha podido preparar el simulacro'}
        </div>
        <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 18, lineHeight: 1.5 }}>
          {bloqueado
            ? 'Mejora tu plan para hacer exámenes con tiempo y corrección como el día del examen.'
            : mensaje ?? 'Inténtalo de nuevo en unos minutos.'}
        </div>
        <button
          onClick={bloqueado ? onPlanes : onVolver}
          style={{ width: '100%', padding: 12, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          {bloqueado ? 'Ver planes' : 'Volver'}
        </button>
        {bloqueado && (
          <button onClick={onVolver} style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
            Volver
          </button>
        )}
      </div>
    </div>
  );
}

export function CargandoSimulacro({ texto = 'Preparando el examen…' }: { texto?: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: BG_APP }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Timer size={26} color={COLOR_SIMULACRO} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_SECONDARY }}>{texto}</div>
    </div>
  );
}
