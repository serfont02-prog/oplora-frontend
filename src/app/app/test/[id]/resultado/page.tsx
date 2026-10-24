'use client';

// ⭐ Resultado del test — mismo sistema que el resto de Practicar: círculo flotante con el acierto,
// tarjetas blancas con sombra, iconos lucide (sin emojis) y, además, la nota con la penalización de
// tu convocatoria y accesos directos para seguir practicando.

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Share2, ChevronDown, ChevronRight, X, CheckCircle2, XCircle, MinusCircle, Lightbulb, Target, Layers } from 'lucide-react';
import { FooterNavegacion } from '@/app/app/dashboard/page';
import { PuntosGanadosCard } from '@/components/gamificacion/PuntosGanadosCard';
import { BG_DASHBOARD as BG_APP, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, COLOR_FC, COLOR_FC_BG } from '@/styles/tokens';

const SOMBRA = 'var(--c-sombra)';
const COLOR_TEST = 'var(--hx-4d7c0f)';
const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** "1/3" → 0.333…, "0,25" → 0.25, vacío → 0 */
function parseFraccion(f: any): number {
  if (f == null || f === '') return 0;
  const s = String(f).trim().replace(',', '.');
  if (s.includes('/')) {
    const [a, b] = s.split('/').map(Number);
    return b ? a / b : 0;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

const limpiar = (op?: string) => (op ?? '').replace(/^[a-fA-F]\)\s*/, '');

export default function ResultadoTestPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { usuario } = useAuth();
  const oposicionId = params.id as string;
  const modo = searchParams.get('modo');

  const [abierta, setAbierta] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<'todas' | 'falladas' | 'blanco'>('todas');
  const [toast, setToast] = useState<string | null>(null);

  const mostrarToast = (mensaje: string) => {
    setToast(mensaje);
    setTimeout(() => setToast(null), 2500);
  };

  const { data: resultado, isLoading } = useQuery({
    queryKey: ['ultimo-resultado'],
    queryFn: async () => (await api.get('/test/ultimo-resultado')).data,
    enabled: !!usuario,
  });

  const { data: convocatoria } = useQuery({
    queryKey: ['convocatoria-test', oposicionId],
    queryFn: async () => {
      const lista = (await api.get(`/convocatorias/oposicion/${oposicionId}`)).data;
      return lista.find((c: any) => c.estado === 'activa') ?? lista[0] ?? null;
    },
    enabled: !!usuario && !!oposicionId,
  });

  // Tras un Repaso inteligente, avisamos si además hay flashcards pendientes
  const { data: fcPendientes = [] } = useQuery({
    queryKey: ['fc-pendientes-tras-repaso', oposicionId],
    queryFn: async () => (await api.get(`/flashcards/pendientes/${oposicionId}`, { params: { limite: 20 } })).data ?? [],
    enabled: !!usuario && modo === 'repaso',
  });

  const detalle: any[] = resultado?.detallePreguntas ?? [];
  const visibles = useMemo(() => detalle
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => filtro === 'todas' || (filtro === 'falladas' ? !d.correcta && !d.enBlanco : !!d.enBlanco)), [detalle, filtro]);

  const compartir = async () => {
    const texto = `Acabo de hacer un test en OPLORA: ${resultado?.porcentaje}% de aciertos (${resultado?.correctas}/${resultado?.totalPreguntas}). ¡A por la plaza!`;
    try {
      if (navigator.share) await navigator.share({ title: 'Mi resultado en OPLORA', text: texto });
      else { await navigator.clipboard.writeText(texto); mostrarToast('Resultado copiado'); }
    } catch { /* compartir cancelado */ }
  };

  if (isLoading || !resultado) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: BG_APP }}>
        <div style={{ fontSize: 13, color: TEXT_MUTED }}>Cargando resultado…</div>
      </div>
    );
  }

  const total = resultado.totalPreguntas ?? 0;
  const correctas = resultado.correctas ?? 0;
  const blancos = resultado.blancos ?? 0;
  const falladas = resultado.falladas ?? Math.max(0, total - correctas - blancos);
  const pct = Math.max(0, Math.min(100, resultado.porcentaje ?? 0));
  const tSeg = resultado.tiempoSegundos ?? 0;
  const tiempoTexto = `${Math.floor(tSeg / 60)}:${String(tSeg % 60).padStart(2, '0')}`;
  const medio = total > 0 ? Math.round(tSeg / total) : 0;

  // ⭐ Nota sobre 10 aplicando la penalización de tu convocatoria (antes no se veía en los tests)
  const fraccion = parseFraccion(convocatoria?.fraccionPenalizacion);
  const fraccionBlanco = convocatoria?.permiteBlancos === false ? parseFraccion(convocatoria?.fraccionPenalizacionBlanco) : 0;
  const notaPenalizada = total > 0 ? Math.max(0, ((correctas - falladas * fraccion - blancos * fraccionBlanco) / total) * 10) : 0;
  const hayPenalizacion = fraccion > 0 || fraccionBlanco > 0;

  const colorNota = pct >= 80 ? 'var(--hx-16a34a)' : pct >= 60 ? 'var(--hx-1f7cff)' : pct >= 40 ? 'var(--hx-d97706)' : 'var(--hx-dc2626)';
  const mensaje = pct >= 80 ? 'Excelente' : pct >= 60 ? 'Bien hecho' : pct >= 40 ? 'Sigue practicando' : 'Toca repasar';
  const titulo = modo === 'repaso' ? 'Repaso inteligente' : modo === 'primer_reto' ? 'Primer reto' : 'Resultado del test';

  const nivel = usuario?.oposicionActiva?.nivel ?? 1;
  const puedeRepasar = falladas > 0 && nivel >= 2 && modo !== 'primer_reto';

  const media = Number.isFinite(resultado.mediaAcierto) ? resultado.mediaAcierto : null;
  const mejor = Number.isFinite(resultado.mejorResultado) ? resultado.mejorResultado : null;

  const D = 140;
  const r = (D - 24 - 10) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 90 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Practicar</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>{titulo}</div>
          </div>
          <button
            onClick={() => router.push('/app/entrenamiento')}
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
          {hayPenalizacion && (
            <div style={{ fontSize: 12, color: TEXT_SECONDARY }}>
              Nota con la penalización de tu convocatoria: <strong style={{ color: TEXT_PRIMARY }}>{notaPenalizada.toLocaleString('es-ES', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</strong> / 10
            </div>
          )}
        </div>

        {/* Cifras */}
        <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '14px 4px' }}>
          {[
            { v: correctas, l: 'Aciertos', c: 'var(--hx-16a34a)' },
            { v: falladas, l: 'Fallos', c: 'var(--hx-dc2626)' },
            { v: blancos, l: 'En blanco', c: TEXT_SECONDARY },
            { v: tiempoTexto, l: `${medio}s / pregunta`, c: TEXT_PRIMARY },
          ].map((d, i) => (
            <div key={d.l} style={{ textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--hx-eef0f3)' : 'none' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: d.c }}>{d.v}</div>
              <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 2 }}>{d.l}</div>
            </div>
          ))}
        </div>

        <PuntosGanadosCard gamificacion={resultado.gamificacion} porcentaje={resultado.porcentaje} />

        {/* Seguir practicando */}
        {(puedeRepasar || (modo === 'repaso' && fcPendientes.length > 0)) && (
          <section>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 8, padding: '0 4px' }}>Sigue practicando</div>
            <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
              {puedeRepasar && (
                <button
                  onClick={() => router.push(`/app/test/${oposicionId}?modo=repaso&n=10`)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: 'none', border: 'none', borderBottom: modo === 'repaso' && fcPendientes.length > 0 ? '1px solid var(--hx-eef0f3)' : 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--hx-f3fae9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Target size={20} color={COLOR_TEST} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>Repaso inteligente</div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>Vuelve sobre las preguntas que más fallas</div>
                  </div>
                  <ChevronRight size={16} color="var(--hx-c4c9d2)" />
                </button>
              )}
              {modo === 'repaso' && fcPendientes.length > 0 && (
                <button
                  onClick={() => router.push(`/app/flashcards/repasar?oposicionId=${oposicionId}`)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: COLOR_FC_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Layers size={20} color={COLOR_FC} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>Completa con flashcards</div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>
                      {fcPendientes.length} {fcPendientes.length === 1 ? 'tarjeta pendiente' : 'tarjetas pendientes'} de repaso
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--hx-c4c9d2)" />
                </button>
              )}
            </div>
          </section>
        )}

        {/* Historial */}
        {(media !== null || mejor !== null) && (
          <section>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 8, padding: '0 4px' }}>Comparado con tus tests</div>
            <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { l: 'Este test', v: pct, c: colorNota },
                ...(media !== null ? [{ l: 'Tu media', v: media, c: 'var(--hx-94a3b8)' }] : []),
                ...(mejor !== null ? [{ l: 'Tu mejor', v: mejor, c: 'var(--hx-16a34a)' }] : []),
              ].map(({ l, v, c }) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 74, fontSize: 12, color: TEXT_SECONDARY, flexShrink: 0 }}>{l}</div>
                  <div style={{ flex: 1, height: 8, background: 'var(--hx-eef0f3)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(0, Math.min(100, v))}%`, height: '100%', background: c, borderRadius: 999, transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ width: 38, fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY, textAlign: 'right' }}>{v}%</div>
                </div>
              ))}
              {resultado.totalTestsRealizados > 0 && (
                <div style={{ fontSize: 11, color: TEXT_MUTED }}>Según tus últimos {resultado.totalTestsRealizados} tests</div>
              )}
            </div>
          </section>
        )}

        {/* Revisión */}
        {detalle.length > 0 && (
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
                        {Array.isArray(d.opciones) && d.opciones.map((op: string, j: number) => {
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
                            <Lightbulb size={14} color={COLOR_TEST} style={{ flexShrink: 0, marginTop: 2 }} />
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

        {/* Acciones */}
        {modo === 'primer_reto' ? (
          <button
            onClick={() => router.push('/app/entrenamiento?step=flashcards')}
            style={{ width: '100%', padding: 14, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Continuar con las flashcards
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => router.push('/app/entrenamiento?abrir=test')}
              style={{ width: '100%', padding: 14, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              Hacer otro test
            </button>
            <button
              onClick={compartir}
              style={{ width: '100%', padding: 13, background: 'var(--c-superficie)', border: 'none', boxShadow: SOMBRA, borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: TEXT_PRIMARY }}
            >
              <Share2 size={15} /> Compartir resultado
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--hxbg-111827)', color: 'var(--c-primario-texto)', fontSize: 13, fontWeight: 600,
          padding: '10px 18px', borderRadius: 999, boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
          zIndex: 100, pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}

      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} activo="practicar" />
    </div>
  );
}
