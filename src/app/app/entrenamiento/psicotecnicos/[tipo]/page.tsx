'use client';

// ⭐ Entrenamiento de una modalidad de psicotécnicos (configurar → jugar → resultado), con el mismo
// diseño que el resto de Practicar: tarjetas blancas con sombra, botón redondo de volver, iconos
// lucide y color índigo de psicotécnicos.

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, X, Clock, CheckCircle2, XCircle, Lightbulb, Medal } from 'lucide-react';
import { IconoModalidad } from '@/components/psicotecnicos/iconos';
import { BG_DASHBOARD as BG_APP, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, COLOR_PSICO, COLOR_PSICO_BG } from '@/styles/tokens';
import { BotonSalirTest, ConfirmacionInferior } from '@/components/test/SalirTest';

const SOMBRA = 'var(--c-sombra)';
const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

const DIFICULTAD_LABEL: Record<string, string> = {
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil',
  experto: 'Experto',
};

type Fase = 'config' | 'jugando' | 'resultado';

function BotonVolver({ onClick, label = 'Volver' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
    >
      <ArrowLeft size={18} color={TEXT_PRIMARY} />
    </button>
  );
}

function Chip({ activo, onClick, children, ancho = false }: { activo: boolean; onClick: () => void; children: React.ReactNode; ancho?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: ancho ? 1 : undefined, padding: ancho ? '10px' : '8px 14px', borderRadius: ancho ? 12 : 999,
        fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
        background: activo ? 'var(--hxbg-0f172a)' : 'var(--hx-f3f4f6)',
        color: activo ? 'var(--c-primario-texto)' : TEXT_SECONDARY,
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
    >
      {children}
    </button>
  );
}

const formatearTiempo = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function PsicotecnicoTipoPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  const tipo = params.tipo as string;
  const oposicionId = usuario?.oposicionActiva?.id;
  const convocatoriaId = usuario?.oposicionActiva?.convocatoriaActiva?.id;

  const [fase, setFase] = useState<Fase>('config');
  const [numPreguntas, setNumPreguntas] = useState(10);
  const [dificultad, setDificultad] = useState<string | null>(null);
  const [errorInicio, setErrorInicio] = useState('');
  const [iniciando, setIniciando] = useState(false);
  const [confirmarSalida, setConfirmarSalida] = useState(false);

  const [preguntas, setPreguntas] = useState<any[]>([]);
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, number | null>>({});
  const [respuestasTexto, setRespuestasTexto] = useState<Record<string, string | null>>({});
  const [respuestaActual, setRespuestaActual] = useState<number | null>(null);
  const [mostrarCorreccion, setMostrarCorreccion] = useState(false);
  const [correctaTexto, setCorrectaTexto] = useState<string | null>(null);
  const [errorCorreccion, setErrorCorreccion] = useState(false);
  const [inicioPregunta, setInicioPregunta] = useState(0);
  const [tiempoPreguntaMs, setTiempoPreguntaMs] = useState<Record<string, number>>({});
  const [segundos, setSegundos] = useState(0);
  const [resultado, setResultado] = useState<any>(null);
  const intervalRef = useRef<any>(null);

  // ⭐ Misma consulta (y convocatoria) que la lista de modalidades: antes se pedía sin
  // convocatoria y podía mostrar dificultades que tu convocatoria no tiene.
  const { data: modalidades = [] } = useQuery({
    queryKey: ['psicotecnicos-config', oposicionId, convocatoriaId],
    queryFn: async () => (await api.get(`/psicotecnicos/config/${oposicionId}`, {
      params: convocatoriaId ? { convocatoriaId } : {},
    })).data,
    enabled: !!oposicionId,
  });
  const modalidad = modalidades.find((m: any) => m.tipo === tipo);

  useEffect(() => {
    if (fase === 'jugando') {
      intervalRef.current = setInterval(() => setSegundos((s) => s + 1), 1000);
      return () => clearInterval(intervalRef.current);
    }
    clearInterval(intervalRef.current);
  }, [fase]);

  const iniciar = async () => {
    setErrorInicio('');
    setIniciando(true);
    try {
      const res = await api.post('/psicotecnicos/generar', {
        oposicionId,
        convocatoriaId,
        tipo,
        dificultad: dificultad || undefined,
        numPreguntas,
      });
      setPreguntas(res.data);
      setIndice(0);
      setRespuestas({});
      setRespuestasTexto({});
      setTiempoPreguntaMs({});
      setSegundos(0);
      setInicioPregunta(Date.now());
      setRespuestaActual(null);
      setMostrarCorreccion(false);
      setCorrectaTexto(null);
      setErrorCorreccion(false);
      setConfirmarSalida(false);
      setFase('jugando');
    } catch (e: any) {
      // ⭐ Antes era un alert() del navegador.
      setErrorInicio(e?.response?.data?.message || 'No hay preguntas disponibles para esta modalidad todavía.');
    } finally {
      setIniciando(false);
    }
  };

  const enviarResultado = useMutation({
    mutationFn: async (payload: {
      respuestasFinal: Record<string, number | null>;
      respuestasTextoFinal: Record<string, string | null>;
      tiemposFinal: Record<string, number>;
    }) => {
      const { respuestasFinal, respuestasTextoFinal, tiemposFinal } = payload;
      const body = {
        oposicionId,
        tipo,
        dificultad: dificultad || undefined,
        tiempoSegundos: segundos,
        respuestas: preguntas.map((p) => ({
          preguntaId: p.id,
          respuesta: respuestasFinal[p.id] ?? null,
          // El servidor corrige por el texto de la opción (sobrevive al recorte/reordenado).
          respuestaTexto: respuestasTextoFinal[p.id] ?? null,
          tiempoMs: tiemposFinal[p.id],
        })),
      };
      return (await api.post('/psicotecnicos/resultado', body)).data;
    },
    onSuccess: (data) => {
      setResultado(data);
      setFase('resultado');
      // Estadísticas de Practicar y de la lista de modalidades
      for (const k of ['psico-periodo', 'psicotecnicos-config']) queryClient.invalidateQueries({ queryKey: [k] });
    },
  });

  const preguntaActual = preguntas[indice];

  const responder = (opcionIndex: number) => {
    if (mostrarCorreccion) return;
    const preguntaId = preguntaActual.id;
    setRespuestaActual(opcionIndex);
    setMostrarCorreccion(true);
    setCorrectaTexto(null);
    setErrorCorreccion(false);
    // ⭐ Tiempo de ESTA pregunta (antes se medía desde el inicio del entrenamiento y se acumulaba).
    setTiempoPreguntaMs((prev) => ({ ...prev, [preguntaId]: Date.now() - inicioPregunta }));

    // La solución solo se pide tras contestar esta pregunta concreta.
    api
      .get(`/psicotecnicos/preguntas/${preguntaId}/correcta`)
      .then((res) => setCorrectaTexto(res.data?.correctaTexto ?? null))
      .catch(() => setErrorCorreccion(true));
  };

  const siguiente = () => {
    const nuevasRespuestas = { ...respuestas, [preguntaActual.id]: respuestaActual };
    const nuevasRespuestasTexto = {
      ...respuestasTexto,
      [preguntaActual.id]: respuestaActual !== null ? preguntaActual.opciones[respuestaActual] : null,
    };
    setRespuestas(nuevasRespuestas);
    setRespuestasTexto(nuevasRespuestasTexto);

    if (indice + 1 < preguntas.length) {
      setRespuestaActual(null);
      setMostrarCorreccion(false);
      setCorrectaTexto(null);
      setErrorCorreccion(false);
      setIndice(indice + 1);
      setInicioPregunta(Date.now());
    } else {
      enviarResultado.mutate({ respuestasFinal: nuevasRespuestas, respuestasTextoFinal: nuevasRespuestasTexto, tiemposFinal: tiempoPreguntaMs });
    }
  };

  const irALista = () => router.push('/app/entrenamiento/psicotecnicos');

  if (!usuario) return null;

  /* ───────────────────────── CONFIG ───────────────────────── */
  if (fase === 'config') {
    return (
      <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 30 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
            <BotonVolver onClick={irALista} label="Volver a psicotécnicos" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                Psicotécnicos
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>{modalidad?.nombre ?? 'Entrenamiento'}</div>
            </div>
          </div>

          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, padding: 16, boxShadow: SOMBRA, display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconoModalidad tipo={tipo} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.45 }}>{modalidad?.descripcion}</div>
              {modalidad?.estadisticas?.realizadas > 0 && (
                <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>
                  {modalidad.estadisticas.realizadas} {modalidad.estadisticas.realizadas === 1 ? 'entrenamiento' : 'entrenamientos'} · Mejor {modalidad.estadisticas.mejorPorcentaje}%
                </div>
              )}
            </div>
          </div>

          <section>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 8, padding: '0 4px' }}>Número de preguntas</div>
            <div style={{ background: 'var(--c-superficie)', borderRadius: 18, padding: 12, boxShadow: SOMBRA, display: 'flex', gap: 8 }}>
              {[5, 10, 20].map((n) => (
                <Chip key={n} ancho activo={numPreguntas === n} onClick={() => setNumPreguntas(n)}>{n}</Chip>
              ))}
            </div>
          </section>

          {modalidad?.dificultadesDisponibles?.length > 0 && (
            <section>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 8, padding: '0 4px' }}>Dificultad</div>
              <div style={{ background: 'var(--c-superficie)', borderRadius: 18, padding: 12, boxShadow: SOMBRA, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Chip activo={!dificultad} onClick={() => setDificultad(null)}>Mixta</Chip>
                {modalidad.dificultadesDisponibles.map((d: string) => (
                  <Chip key={d} activo={dificultad === d} onClick={() => setDificultad(d)}>{DIFICULTAD_LABEL[d] ?? d}</Chip>
                ))}
              </div>
            </section>
          )}

          {errorInicio && (
            <div style={{ fontSize: 13, color: 'var(--hx-b91c1c)', background: 'var(--hx-fef2f2)', borderRadius: 12, padding: '10px 12px', lineHeight: 1.4 }}>
              {errorInicio}
            </div>
          )}

          <button
            onClick={iniciar}
            disabled={iniciando || !oposicionId}
            style={{ width: '100%', padding: 14, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: iniciando ? 'default' : 'pointer', opacity: iniciando ? 0.7 : 1 }}
          >
            {iniciando ? 'Preparando…' : 'Empezar a entrenar'}
          </button>
        </div>
      </div>
    );
  }

  /* ───────────────────────── JUGANDO ───────────────────────── */
  if (fase === 'jugando' && preguntaActual) {
    const corregida = mostrarCorreccion && correctaTexto != null;
    const esCorrecta =
      corregida && respuestaActual !== null && preguntaActual.opciones[respuestaActual]?.trim() === correctaTexto!.trim();

    return (
      <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 30 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem' }}>

          {/* Barra superior: salir, progreso y tiempo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <button
              onClick={() => setConfirmarSalida(true)}
              aria-label="Salir del entrenamiento"
              style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <X size={17} color={TEXT_PRIMARY} />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: TEXT_SECONDARY, fontWeight: 600, marginBottom: 6 }}>
                <span>Pregunta {indice + 1} de {preguntas.length}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} />{formatearTiempo(segundos)}</span>
              </div>
              <div style={{ height: 6, background: 'color-mix(in srgb, var(--c-superficie) 80%, transparent)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${((indice + 1) / preguntas.length) * 100}%`, height: '100%', background: COLOR_PSICO, borderRadius: 999, transition: 'width 0.3s' }} />
              </div>
            </div>
          </div>

          <ConfirmacionInferior
            abierta={confirmarSalida}
            titulo="¿Salir del entrenamiento?"
            texto="Este entrenamiento no se guardará."
            onCancelar={() => setConfirmarSalida(false)}
            onConfirmar={() => { setFase('config'); setConfirmarSalida(false); }}
          />

          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, padding: 18, boxShadow: SOMBRA, marginBottom: 14 }}>
            {preguntaActual.imagenUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preguntaActual.imagenUrl} alt="" style={{ width: '100%', borderRadius: 10, marginBottom: 14 }} />
            )}
            <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.55 }}>
              {preguntaActual.enunciado}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {preguntaActual.opciones.map((op: string, i: number) => {
              const esElegida = respuestaActual === i;
              const esLaCorrecta = corregida && op.trim() === correctaTexto!.trim();
              // Solo se marca el fallo cuando ya llegó la solución (antes parpadeaba en rojo).
              const esIncorrectaElegida = corregida && esElegida && !esCorrecta;
              const colorLetra = esLaCorrecta ? 'var(--hx-16a34a)' : esIncorrectaElegida ? 'var(--hx-dc2626)' : esElegida ? COLOR_PSICO : TEXT_SECONDARY;

              return (
                <button
                  key={i}
                  onClick={() => responder(i)}
                  disabled={mostrarCorreccion}
                  style={{
                    textAlign: 'left', padding: '12px 14px', borderRadius: 14, fontSize: 14, fontWeight: 500,
                    cursor: mostrarCorreccion ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12,
                    border: esLaCorrecta ? '2px solid var(--hx-16a34a)' : esIncorrectaElegida ? '2px solid var(--hx-dc2626)' : esElegida ? `2px solid ${COLOR_PSICO}` : '2px solid transparent',
                    background: esLaCorrecta ? 'var(--hx-f0fdf4)' : esIncorrectaElegida ? 'var(--hx-fef2f2)' : 'var(--c-superficie)',
                    boxShadow: SOMBRA,
                    color: TEXT_PRIMARY,
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: colorLetra,
                    background: esLaCorrecta ? 'var(--hx-dcfce7)' : esIncorrectaElegida ? 'var(--hx-fee2e2)' : esElegida ? COLOR_PSICO_BG : 'var(--hx-f3f4f6)',
                  }}>
                    {LETRAS[i] ?? i + 1}
                  </span>
                  <span style={{ flex: 1, lineHeight: 1.4 }}>{op}</span>
                  {esLaCorrecta && <CheckCircle2 size={18} color="var(--hx-16a34a)" style={{ flexShrink: 0 }} />}
                  {esIncorrectaElegida && <XCircle size={18} color="var(--hx-dc2626)" style={{ flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          {mostrarCorreccion && (
            <>
              {errorCorreccion && (
                <div style={{ fontSize: 12, color: TEXT_SECONDARY, background: 'var(--c-superficie)', borderRadius: 12, padding: '10px 12px', marginBottom: 12 }}>
                  No se ha podido mostrar la solución ahora. Tu respuesta se corregirá igualmente al terminar.
                </div>
              )}
              {preguntaActual.explicacion && corregida && (
                <div style={{ display: 'flex', gap: 8, background: 'var(--c-superficie)', borderRadius: 14, padding: 14, marginBottom: 14, fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5, boxShadow: SOMBRA }}>
                  <Lightbulb size={16} color={COLOR_PSICO} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{preguntaActual.explicacion}</span>
                </div>
              )}
              {enviarResultado.isError && (
                <div style={{ fontSize: 13, color: 'var(--hx-b91c1c)', background: 'var(--hx-fef2f2)', borderRadius: 12, padding: '10px 12px', marginBottom: 12 }}>
                  No se ha podido guardar el resultado. Comprueba la conexión y vuelve a intentarlo.
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
              <BotonSalirTest onClick={() => setConfirmarSalida(true)} alto={48} />
              <button
                onClick={siguiente}
                disabled={enviarResultado.isPending}
                style={{ flex: 1, padding: 14, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: enviarResultado.isPending ? 'default' : 'pointer', opacity: enviarResultado.isPending ? 0.7 : 1 }}
              >
                {indice + 1 < preguntas.length ? 'Siguiente' : enviarResultado.isPending ? 'Guardando…' : enviarResultado.isError ? 'Reintentar' : 'Ver resultado'}
              </button>
              </div>
            </>
          )}

          {/* ⭐ Salir desde abajo mientras se responde (antes solo con la X de arriba) */}
          {!mostrarCorreccion && (
            <div style={{ display: 'flex' }}>
              <BotonSalirTest onClick={() => setConfirmarSalida(true)} />
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ───────────────────────── RESULTADO ───────────────────────── */
  if (fase === 'resultado' && resultado) {
    const pct = resultado.porcentaje ?? 0;
    const D = 132;
    const radio = (D - 24 - 10) / 2;
    const circ = 2 * Math.PI * radio;
    const colorNota = pct >= 80 ? 'var(--hx-16a34a)' : pct >= 50 ? COLOR_PSICO : 'var(--hx-d97706)';
    const mensaje = pct >= 80 ? '¡Muy bien!' : pct >= 50 ? 'Buen entrenamiento' : 'Sigue practicando';

    return (
      <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 30 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
            <BotonVolver onClick={irALista} label="Volver a psicotécnicos" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                {modalidad?.nombre ?? 'Psicotécnicos'}
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>Resultado</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 6 }}>
            <div style={{ position: 'relative', width: D, height: D, borderRadius: '50%', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={D - 24} height={D - 24} style={{ position: 'absolute', top: 12, left: 12, transform: 'rotate(-90deg)' }}>
                <circle cx={(D - 24) / 2} cy={(D - 24) / 2} r={radio} fill="none" stroke="var(--hx-eef0f3)" strokeWidth={10} />
                {pct > 0 && (
                  <circle cx={(D - 24) / 2} cy={(D - 24) / 2} r={radio} fill="none" stroke={colorNota} strokeWidth={10} strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                )}
              </svg>
              <div style={{ position: 'relative', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1 }}>{pct}%</div>
                <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>de aciertos</div>
              </div>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: TEXT_PRIMARY, marginTop: 6 }}>{mensaje}</div>
            {resultado.esMejorMarca && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--hx-f0fdf4)', color: 'var(--hx-15803d)', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 999 }}>
                <Medal size={14} /> Nueva mejor marca
              </div>
            )}
          </div>

          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '14px 6px' }}>
            {[
              { valor: `${resultado.correctas}`, label: 'Aciertos', color: 'var(--hx-16a34a)' },
              { valor: `${(resultado.totalPreguntas ?? 0) - (resultado.correctas ?? 0)}`, label: 'Fallos', color: 'var(--hx-dc2626)' },
              { valor: formatearTiempo(segundos), label: 'Tiempo', color: TEXT_PRIMARY },
            ].map((d, i) => (
              <div key={d.label} style={{ textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--hx-eef0f3)' : 'none' }}>
                <div style={{ fontSize: 19, fontWeight: 800, color: d.color }}>{d.valor}</div>
                <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{d.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={iniciar}
              disabled={iniciando}
              style={{ width: '100%', padding: 14, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: iniciando ? 0.7 : 1 }}
            >
              {iniciando ? 'Preparando…' : 'Otra ronda igual'}
            </button>
            <button
              onClick={() => setFase('config')}
              style={{ width: '100%', padding: 13, background: 'var(--c-superficie)', border: 'none', boxShadow: SOMBRA, color: TEXT_PRIMARY, borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Cambiar preguntas o dificultad
            </button>
            <button
              onClick={irALista}
              style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Elegir otra modalidad
            </button>
            {errorInicio && (
              <div style={{ fontSize: 13, color: 'var(--hx-b91c1c)', background: 'var(--hx-fef2f2)', borderRadius: 12, padding: '10px 12px' }}>{errorInicio}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
