'use client';

// ⭐ Liga Oplora — jugar la jornada. El reloj lo lleva el servidor: al entrar se pide
// /empezar, que devuelve los segundos que quedan (aunque se haya salido de la app).
// Las respuestas se guardan sobre la marcha y se entregan solas al acabarse el tiempo.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { COLOR_LIGA, BG_LIGA, formatoNota, formatoTiempo, diaHora, mensajeError } from '@/components/liga/ligaUtils';

const TEXT_PRIMARY = 'var(--hx-111827)';
const TEXT_MUTED = 'var(--hx-6b7280)';
const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

type Resultado = {
  nota: number;
  aciertos: number;
  fallos: number;
  blancos: number;
  tiempoMs: number;
  tiempoAgotado: boolean;
  posicionProvisional: number;
  participantes: number;
};

export default function JugarJornadaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { usuario } = useAuth();

  // POST /empezar crea la partida o la retoma; no debe repetirse por foco o reconexión.
  const { data, isLoading, error } = useQuery({
    queryKey: ['liga-jugar', id],
    queryFn: async () => (await api.post(`/liga/jornadas/${id}/empezar`)).data,
    enabled: !!usuario && !!id,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const [respuestas, setRespuestas] = useState<(number | null)[]>([]);
  const [actual, setActual] = useState(0);
  // Centra en el mapa inferior la pregunta actual (solo al cambiar de pregunta)
  const mapaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const boton = mapaRef.current?.children[actual] as HTMLElement | undefined;
    if (boton && mapaRef.current) {
      const caja = mapaRef.current;
      caja.scrollTo({ left: boton.offsetLeft - caja.clientWidth / 2 + boton.clientWidth / 2, behavior: 'smooth' });
    }
  }, [actual]);
  const [restante, setRestante] = useState<number | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [salir, setSalir] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const finRef = useRef<number | null>(null);
  const enviadoRef = useRef(false);
  const respuestasRef = useRef<(number | null)[]>([]);
  const guardadoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const preguntas: any[] = useMemo(() => (data && !data.terminado ? data.preguntas ?? [] : []), [data]);

  // Estado inicial a partir de lo que diga el servidor
  useEffect(() => {
    if (!data) return;
    if (data.terminado) {
      enviadoRef.current = true;
      setResultado(data.resultado);
      qc.invalidateQueries({ queryKey: ['liga-mia'] });
      return;
    }
    const iniciales = (data.preguntas ?? []).map((_: any, i: number) => {
      const r = data.respuestas?.[i];
      return typeof r === 'number' ? r : null;
    });
    setRespuestas(iniciales);
    respuestasRef.current = iniciales;
    const primeraSinResponder = iniciales.findIndex((r: number | null) => r == null);
    setActual(primeraSinResponder >= 0 ? primeraSinResponder : 0);
    finRef.current = Date.now() + (data.segundosRestantes ?? 0) * 1000;
    setRestante(data.segundosRestantes ?? 0);
  }, [data, qc]);

  const entregar = useCallback(
    async (porTiempo: boolean) => {
      if (enviadoRef.current) return;
      enviadoRef.current = true;
      setEnviando(true);
      setErrorEnvio(null);
      if (guardadoTimer.current) clearTimeout(guardadoTimer.current);
      try {
        const res = await api.post(`/liga/jornadas/${id}/enviar`, { respuestas: respuestasRef.current });
        setResultado({ ...res.data, tiempoAgotado: res.data.tiempoAgotado || porTiempo });
        setConfirmar(false);
        qc.invalidateQueries({ queryKey: ['liga-mia'] });
        qc.invalidateQueries({ queryKey: ['liga-jornada-clasif'] });
      } catch (e: any) {
        const msg = mensajeError(e, 'No se ha podido entregar. Revisa tu conexión e inténtalo de nuevo.');
        // Si ya estaba entregada (p. ej. desde otra pestaña), no se puede reintentar
        if (/ya has enviado|ya ha cerrado/i.test(msg)) {
          setErrorEnvio(msg);
        } else {
          enviadoRef.current = false;
          setErrorEnvio(msg);
        }
      } finally {
        setEnviando(false);
      }
    },
    [id, qc],
  );

  // Reloj
  useEffect(() => {
    if (resultado || finRef.current == null) return;
    const t = setInterval(() => {
      const s = Math.max(0, Math.ceil(((finRef.current ?? 0) - Date.now()) / 1000));
      setRestante(s);
      if (s <= 0) {
        clearInterval(t);
        entregar(true);
      }
    }, 500);
    return () => clearInterval(t);
  }, [data, resultado, entregar]);

  const guardarYa = useCallback(() => {
    if (enviadoRef.current) return;
    api.post(`/liga/jornadas/${id}/progreso`, { respuestas: respuestasRef.current }).catch(() => { /* se reintenta en el siguiente cambio */ });
  }, [id]);

  // Guardar al salir de la app
  useEffect(() => {
    const alOcultar = () => { if (document.visibilityState === 'hidden') guardarYa(); };
    document.addEventListener('visibilitychange', alOcultar);
    return () => document.removeEventListener('visibilitychange', alOcultar);
  }, [guardarYa]);

  const responder = (opcion: number) => {
    if (enviadoRef.current) return;
    const nuevas = [...respuestasRef.current];
    nuevas[actual] = nuevas[actual] === opcion ? null : opcion; // volver a pulsar = dejar en blanco
    respuestasRef.current = nuevas;
    setRespuestas(nuevas);
    if (guardadoTimer.current) clearTimeout(guardadoTimer.current);
    guardadoTimer.current = setTimeout(guardarYa, 1200);
  };

  /* ---------------- pantallas ---------------- */

  if (!usuario) return null;

  if (resultado) return <PantallaResultado resultado={resultado} fechaCierre={data?.jornada?.fechaCierre} onVolver={() => router.push('/app/liga')} />;

  if (isLoading) {
    return <Centro><div style={{ fontSize: 14, color: TEXT_MUTED }}>Preparando la jornada…</div></Centro>;
  }

  if (error || !data) {
    return (
      <Centro>
        <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>No puedes jugar ahora</div>
        <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 16 }}>{mensajeError(error, 'No se ha podido cargar la jornada')}</div>
        <BotonPrincipal onClick={() => router.push('/app/liga')}>Volver a la liga</BotonPrincipal>
      </Centro>
    );
  }

  if (!preguntas.length) {
    return (
      <Centro>
        <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 16 }}>Esta jornada no tiene preguntas.</div>
        <BotonPrincipal onClick={() => router.push('/app/liga')}>Volver a la liga</BotonPrincipal>
      </Centro>
    );
  }

  const p = preguntas[actual];
  const total = preguntas.length;
  const enBlanco = respuestas.filter((r) => r == null).length;
  const urgente = restante != null && restante <= 60;
  const minutos = Math.floor((restante ?? 0) / 60);
  const segundos = (restante ?? 0) % 60;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg-neutral)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1rem 1.25rem 11rem', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Barra superior */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setSalir(true)}
            aria-label="Salir"
            style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <X size={18} color={TEXT_PRIMARY} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Liga Oplora · {data.jornada?.nombreDivision} división
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Pregunta {actual + 1} de {total}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 999, background: urgente ? 'var(--hx-fee2e2)' : BG_LIGA, color: urgente ? 'var(--hx-b91c1c)' : COLOR_LIGA, fontSize: 14, fontWeight: 800, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
            <Clock size={14} />
            {minutos}:{String(segundos).padStart(2, '0')}
          </div>
        </div>

        {/* Progreso */}
        <div style={{ height: 4, background: 'var(--hx-e5e7eb)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((total - enBlanco) / total) * 100}%`, background: COLOR_LIGA, transition: 'width .2s' }} />
        </div>

        {/* Pregunta */}
        <div style={{ background: 'var(--c-superficie)', borderRadius: 18, padding: 16, border: '1px solid var(--hx-f1f5f9)' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{p.enunciado}</div>
          {p.imagenUrl && (
            <img src={p.imagenUrl} alt="" style={{ display: 'block', maxWidth: '100%', margin: '12px auto 0', borderRadius: 10 }} />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(p.opciones ?? []).map((op: string, i: number) => {
            const elegida = respuestas[actual] === i;
            return (
              <button
                key={i}
                onClick={() => responder(i)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left', width: '100%',
                  padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                  background: elegida ? BG_LIGA : 'var(--c-superficie)',
                  border: elegida ? `1.5px solid ${COLOR_LIGA}` : '1px solid var(--hx-e5e7eb)',
                }}
              >
                <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, background: elegida ? COLOR_LIGA : 'var(--hx-f3f4f6)', color: elegida ? 'var(--c-primario-texto)' : TEXT_MUTED }}>
                  {LETRAS[i] ?? i + 1}
                </span>
                <span style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.45, paddingTop: 2 }}>{op}</span>
              </button>
            );
          })}
          <div style={{ fontSize: 11, color: TEXT_MUTED, textAlign: 'center' }}>
            Vuelve a pulsar tu respuesta para dejarla en blanco. Los fallos restan.
          </div>
        </div>

      </div>

      {/* Navegación inferior */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: 'var(--c-superficie)', borderTop: '1px solid var(--hx-f1f5f9)', padding: '10px 1.25rem calc(10px + env(safe-area-inset-bottom))' }}>
        {/* ⭐ Mapa de preguntas fijo abajo: antes iba debajo de las respuestas y se movía con
            el largo de cada pregunta. Se desliza en horizontal y centra la pregunta actual. */}
        <div ref={mapaRef} style={{ position: 'relative', maxWidth: 560, margin: '0 auto 10px', display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 2px 4px', scrollbarWidth: 'none' }}>
          {preguntas.map((_, i) => (
            <button
              key={i}
              onClick={() => setActual(i)}
              aria-label={`Ir a la pregunta ${i + 1}`}
              aria-current={i === actual ? 'step' : undefined}
              style={{
                flex: '0 0 auto', width: 32, height: 32, borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                border: i === actual ? `2px solid ${TEXT_PRIMARY}` : '1px solid var(--hx-e5e7eb)',
                background: respuestas[i] != null ? COLOR_LIGA : 'var(--c-superficie)',
                color: respuestas[i] != null ? 'var(--c-primario-texto)' : TEXT_MUTED,
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActual((a) => Math.max(0, a - 1))}
            disabled={actual === 0}
            style={{ flex: 1, border: '1px solid var(--hx-e5e7eb)', background: 'var(--c-superficie)', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, cursor: actual === 0 ? 'default' : 'pointer', opacity: actual === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          {actual < total - 1 ? (
            <button
              onClick={() => setActual((a) => Math.min(total - 1, a + 1))}
              style={{ flex: 1, border: 'none', background: 'var(--hxbg-111827)', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, color: 'var(--c-primario-texto)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => setConfirmar(true)}
              style={{ flex: 1, border: 'none', background: COLOR_LIGA, borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, color: 'var(--c-primario-texto)', cursor: 'pointer' }}
            >
              Entregar
            </button>
          )}
        </div>
        {actual < total - 1 && (
          <div style={{ maxWidth: 560, margin: '6px auto 0', textAlign: 'center' }}>
            <button onClick={() => setConfirmar(true)} style={{ border: 'none', background: 'none', color: COLOR_LIGA, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Entregar ya
            </button>
          </div>
        )}
      </div>

      {confirmar && (
        <Modal onCerrar={() => !enviando && setConfirmar(false)}>
          <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>¿Entregar la jornada?</div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6, lineHeight: 1.5 }}>
            {enBlanco > 0
              ? `Tienes ${enBlanco} ${enBlanco === 1 ? 'pregunta' : 'preguntas'} en blanco. `
              : 'Has respondido todas las preguntas. '}
            Solo hay un intento: después no podrás cambiar nada.
          </div>
          {errorEnvio && <div style={{ fontSize: 12, color: 'var(--hx-b91c1c)', marginTop: 8 }}>{errorEnvio}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              onClick={() => setConfirmar(false)}
              disabled={enviando}
              style={{ flex: 1, border: '1px solid var(--hx-e5e7eb)', background: 'var(--c-superficie)', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, cursor: 'pointer' }}
            >
              Seguir
            </button>
            <button
              onClick={() => entregar(false)}
              disabled={enviando}
              style={{ flex: 1, border: 'none', background: COLOR_LIGA, borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, color: 'var(--c-primario-texto)', cursor: 'pointer', opacity: enviando ? 0.6 : 1 }}
            >
              {enviando ? 'Entregando…' : 'Entregar'}
            </button>
          </div>
        </Modal>
      )}

      {!confirmar && errorEnvio && (
        <Modal onCerrar={() => setErrorEnvio(null)}>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>No se ha podido entregar</div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6 }}>{errorEnvio}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => router.push('/app/liga')} style={{ flex: 1, border: '1px solid var(--hx-e5e7eb)', background: 'var(--c-superficie)', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, cursor: 'pointer' }}>
              Ir a la liga
            </button>
            {!enviadoRef.current && (
              <button onClick={() => entregar(true)} disabled={enviando} style={{ flex: 1, border: 'none', background: COLOR_LIGA, borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, color: 'var(--c-primario-texto)', cursor: 'pointer' }}>
                Reintentar
              </button>
            )}
          </div>
        </Modal>
      )}

      {salir && (
        <Modal onCerrar={() => setSalir(false)}>
          <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>¿Salir de la jornada?</div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6, lineHeight: 1.5 }}>
            Tus respuestas quedan guardadas, pero el reloj sigue corriendo. Si se acaba el tiempo, se entregará lo que tengas.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              onClick={() => { guardarYa(); router.push('/app/liga'); }}
              style={{ flex: 1, border: '1px solid var(--hx-e5e7eb)', background: 'var(--c-superficie)', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, cursor: 'pointer' }}
            >
              Salir
            </button>
            <button
              onClick={() => setSalir(false)}
              style={{ flex: 1, border: 'none', background: 'var(--hxbg-111827)', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, color: 'var(--c-primario-texto)', cursor: 'pointer' }}
            >
              Seguir jugando
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Centro({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg-neutral)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>{children}</div>
    </div>
  );
}

function BotonPrincipal({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: '100%', border: 'none', background: 'var(--hxbg-111827)', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, color: 'var(--c-primario-texto)', cursor: 'pointer' }}>
      {children}
    </button>
  );
}

function Modal({ children, onCerrar }: { children: React.ReactNode; onCerrar: () => void }) {
  return (
    <div onClick={onCerrar} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, padding: 12 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--c-superficie)', borderRadius: 20, padding: 20, width: '100%', maxWidth: 520, marginBottom: 'env(safe-area-inset-bottom)' }}>
        {children}
      </div>
    </div>
  );
}

function PantallaResultado({ resultado, fechaCierre, onVolver }: { resultado: Resultado; fechaCierre?: string; onVolver: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: BG_LIGA, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
      <div style={{ maxWidth: 440, width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: 'var(--c-superficie)', borderRadius: 20, padding: '22px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLOR_LIGA, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {resultado.tiempoAgotado ? 'Tiempo agotado · jornada entregada' : 'Jornada entregada'}
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, color: TEXT_PRIMARY, marginTop: 6, lineHeight: 1 }}>{formatoNota(resultado.nota)}</div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4 }}>tu nota</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 18 }}>
            {[
              ['Aciertos', resultado.aciertos, 'var(--hx-16a34a)'],
              ['Fallos', resultado.fallos, 'var(--hx-dc2626)'],
              ['En blanco', resultado.blancos, TEXT_MUTED],
              ['Tiempo', formatoTiempo(resultado.tiempoMs), TEXT_PRIMARY],
            ].map(([label, valor, color]) => (
              <div key={label as string} style={{ background: 'var(--hx-f8f9fa)', borderRadius: 10, padding: '9px 4px' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: color as string }}>{valor as any}</div>
                <div style={{ fontSize: 10, color: TEXT_MUTED }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, background: BG_LIGA, borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: COLOR_LIGA }}>
              {resultado.posicionProvisional}º de {resultado.participantes}
            </div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>posición provisional en tu división</div>
          </div>

          <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 14, lineHeight: 1.5 }}>
            La clasificación definitiva, los puntos y las soluciones se publican al cerrar la jornada
            {fechaCierre ? ` (${diaHora(fechaCierre)})` : ''}.
          </div>
        </div>
        <BotonPrincipal onClick={onVolver}>Volver a la liga</BotonPrincipal>
      </div>
    </div>
  );
}
