'use client';

// ⭐ Resultado de un duelo (test o psicotécnico), con el mismo diseño que el resultado de los tests de
// Practicar: círculo con el acierto, cifras (aciertos, fallos, en blanco, tiempo), el marcador del duelo
// y la revisión de tus respuestas con filtro.

import { useMemo, useState } from 'react';
import { X, CheckCircle2, XCircle, MinusCircle, ChevronDown, Lightbulb } from 'lucide-react';
import { PuntosGanadosCard, GamificacionInfo } from '@/components/gamificacion/PuntosGanadosCard';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '@/styles/tokens';

const SOMBRA = 'var(--c-sombra)';
const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];
const limpiar = (op?: string) => (op ?? '').replace(/^[a-fA-F]\)\s*/, '');

export type RevisionDuelo = {
  enunciado: string;
  opciones?: string[];
  indiceCorrecta?: number | null;
  indiceSeleccionada?: number | null;
  correcta: boolean;
  enBlanco: boolean;
  explicacion?: string | null;
};

export default function ResultadoDuelo({
  fondo,
  eyebrow,
  titulo,
  subtitulo,
  total,
  correctas,
  fallos,
  blancos,
  tiempoSegundos,
  nota,
  estado,
  duelo,
  revision,
  gamificacion,
  acciones,
  onCerrar,
}: {
  fondo: string;
  eyebrow: string;
  titulo: string;
  subtitulo?: string;
  total: number;
  correctas: number;
  fallos: number;
  blancos: number;
  tiempoSegundos: number | null;
  nota?: { valor: number; texto: string } | null;
  estado: { texto: string; icono: any; color: string; fondo: string };
  duelo: React.ReactNode;
  revision: RevisionDuelo[];
  gamificacion?: GamificacionInfo | null;
  acciones: React.ReactNode;
  onCerrar: () => void;
}) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<'todas' | 'falladas' | 'blanco'>('todas');

  const pct = total > 0 ? Math.round((correctas / total) * 100) : 0;
  const t = Math.max(0, Math.round(tiempoSegundos ?? 0));
  const tiempoTexto = tiempoSegundos == null ? '—' : `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  const medio = total > 0 && tiempoSegundos != null ? Math.round(t / total) : null;
  const colorNota = pct >= 80 ? 'var(--hx-16a34a)' : pct >= 60 ? 'var(--hx-1f7cff)' : pct >= 40 ? 'var(--hx-d97706)' : 'var(--hx-dc2626)';
  const mensaje = pct >= 80 ? 'Excelente' : pct >= 60 ? 'Bien hecho' : pct >= 40 ? 'Sigue practicando' : 'Toca repasar';
  const IconoEstado = estado.icono;

  const visibles = useMemo(() => revision
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => filtro === 'todas' || (filtro === 'falladas' ? !d.correcta && !d.enBlanco : d.enBlanco)), [revision, filtro]);

  const D = 140;
  const r = (D - 24 - 10) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ minHeight: '100vh', background: fondo, paddingBottom: 40 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{eyebrow}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>{titulo}</div>
            {subtitulo && <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>{subtitulo}</div>}
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <X size={18} color={TEXT_PRIMARY} />
          </button>
        </div>

        {/* Acierto */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ position: 'relative', width: D, height: D, borderRadius: '50%', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={D - 24} height={D - 24} style={{ position: 'absolute', top: 12, left: 12, transform: 'rotate(-90deg)' }}>
              <circle cx={(D - 24) / 2} cy={(D - 24) / 2} r={r} fill="none" stroke="var(--hx-eef0f3)" strokeWidth={10} />
              {pct > 0 && (
                <circle cx={(D - 24) / 2} cy={(D - 24) / 2} r={r} fill="none" stroke={colorNota} strokeWidth={10} strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
              )}
            </svg>
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1 }}>{pct}%</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>de aciertos</div>
            </div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, marginTop: 6 }}>{mensaje}</div>
          {nota && (
            <div style={{ fontSize: 12, color: TEXT_SECONDARY, textAlign: 'center' }}>
              {nota.texto}: <strong style={{ color: TEXT_PRIMARY }}>{nota.valor.toLocaleString('es-ES', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</strong> / 10
            </div>
          )}
        </div>

        {/* Cifras */}
        <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '14px 4px' }}>
          {[
            { v: correctas, l: 'Aciertos', c: 'var(--hx-16a34a)' },
            { v: fallos, l: 'Fallos', c: 'var(--hx-dc2626)' },
            { v: blancos, l: 'En blanco', c: TEXT_SECONDARY },
            { v: tiempoTexto, l: medio != null ? `${medio}s / pregunta` : 'Tiempo', c: TEXT_PRIMARY },
          ].map((d, i) => (
            <div key={d.l} style={{ textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--hx-eef0f3)' : 'none' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: d.c }}>{d.v}</div>
              <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 2 }}>{d.l}</div>
            </div>
          ))}
        </div>

        {gamificacion && <PuntosGanadosCard gamificacion={gamificacion} porcentaje={pct} />}

        {/* Duelo */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY }}>El duelo</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: estado.fondo, color: estado.color }}>
              <IconoEstado size={12} /> {estado.texto}
            </span>
          </div>
          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: 16 }}>{duelo}</div>
        </section>

        {/* Revisión */}
        {revision.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY }}>Revisa tus respuestas</span>
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
              {visibles.map(({ d, i }, k) => {
                const Icono = d.enBlanco ? MinusCircle : d.correcta ? CheckCircle2 : XCircle;
                const colorEst = d.enBlanco ? 'var(--hx-94a3b8)' : d.correcta ? 'var(--hx-16a34a)' : 'var(--hx-dc2626)';
                const esta = abierta === i;
                return (
                  <div key={i} style={{ borderBottom: k < visibles.length - 1 ? '1px solid var(--hx-eef0f3)' : 'none' }}>
                    <button
                      onClick={() => setAbierta(esta ? null : i)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <Icono size={18} color={colorEst} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.4, ...(esta ? {} : { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }) }}>
                        {d.enunciado}
                      </span>
                      <ChevronDown size={15} color="var(--hx-c4c9d2)" style={{ flexShrink: 0, transform: esta ? 'rotate(180deg)' : 'none' }} />
                    </button>
                    {esta && (
                      <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {Array.isArray(d.opciones) && d.opciones.map((op, j) => {
                          const esCorrecta = j === d.indiceCorrecta;
                          const esTuya = j === d.indiceSeleccionada;
                          return (
                            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 10, fontSize: 13, color: TEXT_PRIMARY, background: esCorrecta ? 'var(--hx-f0fdf4)' : esTuya ? 'var(--hx-fef2f2)' : 'var(--hx-f8f9fa)' }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: esCorrecta ? 'var(--hx-16a34a)' : esTuya ? 'var(--hx-dc2626)' : TEXT_MUTED }}>{LETRAS[j] ?? j + 1}</span>
                              <span style={{ flex: 1, lineHeight: 1.4 }}>{limpiar(op)}</span>
                              {esCorrecta && <CheckCircle2 size={15} color="var(--hx-16a34a)" />}
                              {esTuya && !esCorrecta && <XCircle size={15} color="var(--hx-dc2626)" />}
                            </div>
                          );
                        })}
                        {d.enBlanco && <div style={{ fontSize: 12, color: TEXT_MUTED }}>La dejaste en blanco.</div>}
                        {d.explicacion && (
                          <div style={{ display: 'flex', gap: 8, fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.5, background: 'var(--hx-f8f9fa)', borderRadius: 10, padding: '9px 11px', marginTop: 2 }}>
                            <Lightbulb size={14} color="var(--hx-4d7c0f)" style={{ flexShrink: 0, marginTop: 2 }} />
                            <span>{d.explicacion}</span>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{acciones}</div>
      </div>
    </div>
  );
}
