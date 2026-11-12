'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Layers, CheckCircle2, XCircle, Lightbulb, PartyPopper, BookOpen, X, ChevronRight } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { PuntosGanadosCard, GamificacionInfo } from '@/components/gamificacion/PuntosGanadosCard';

type EstadoRepaso = 'pregunta' | 'respuesta' | 'fin';

import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, COLOR_FC } from '@/styles/tokens';
import ErrorCarga from '@/components/ui/ErrorCarga';

const BG_APP = 'var(--c-bg-flashcards)';

export default function RepasarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oposicionId = searchParams.get('oposicionId') ?? '';
  const numFlashcards = Number(searchParams.get('n')) || 10;
  const { usuario, cargando } = useAuth();
  const queryClient = useQueryClient();
  const temaId = searchParams.get('temaId');
  const articuloId = searchParams.get('articuloId');
  const leyIdArticulo = searchParams.get('leyId');
  const [indice, setIndice] = useState(0);
  const [estado, setEstado] = useState<EstadoRepaso>('pregunta');
  const [respuestaVF, setRespuestaVF] = useState<boolean | null>(null);
  const [tiempoInicio, setTiempoInicio] = useState(Date.now());
  const [resultados, setResultados] = useState<{ id: string; calificacion: number }[]>([]);
  const [errorRegistro, setErrorRegistro] = useState('');
  const [gamificacionInfo, setGamificacionInfo] = useState<GamificacionInfo | null>(null);
  // ⭐ Tras fallar una tarjeta con artículo, se queda en pantalla con el artículo destacado
  const [pausaFallo, setPausaFallo] = useState(false);
  const [articuloAbierto, setArticuloAbierto] = useState<{ id: string; numero?: string } | null>(null);
  const numeroTema = searchParams.get('numeroTema');
  // ⭐ Si se entra desde el hub de Flashcards ("Por temas"), volver lleva al hub y no al tema.
  const desdeHub = searchParams.get('origen') === 'flashcards';
  // ⭐ Modo de la sesión con tema: 'nuevas' (las N primeras sin ver), 'repasar' (las que tocan
  // de ese tema) o, sin modo, todas las del tema (repasar el tema entero).
  const modo = searchParams.get('modo');

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  // Todo lo que muestra el estado de las flashcards (hub, atajo de Inicio, Practicar y límites).
  const invalidarEstadoFC = () => {
    for (const k of ['pendientes-fc', 'stats-fc', 'fc-pendientes-widget', 'fc-periodo', 'limites', 'resumen-temas-fc']) {
      queryClient.invalidateQueries({ queryKey: [k] });
    }
  };

  // ⭐ Invalidar el estado de FC (pendientes/stats) también al salir de la pantalla de repaso,
  // no solo al pulsar "Repasar de nuevo" — así el hub de flashcards y el resto de widgets
  // reflejan los repasos hechos en esta sesión aunque el usuario navegue fuera sin pulsar nada.
  useEffect(() => {
    return () => {
      invalidarEstadoFC();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: flashcards = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['fc-repaso', oposicionId, temaId, articuloId, numFlashcards, modo],
    queryFn: async () => {
      if (temaId && modo === 'nuevas') {
        return (await api.get(`/flashcards/tema/${temaId}/nuevas`, { params: { limite: numFlashcards } })).data;
      }
      if (temaId && modo === 'repasar' && oposicionId) {
        return (await api.get(`/flashcards/pendientes/${oposicionId}`, { params: { limite: numFlashcards, temaId } })).data;
      }
      if (temaId) {
        const res = await api.get(`/flashcards/tema/${temaId}`);
        return res.data;
      }
      if (articuloId) {
        // ⭐ Solo las de la oposición del usuario
        const res = await api.get(`/flashcards/articulo/${articuloId}`, { params: { oposicionId: oposicionId || undefined } });
        return res.data;
      }
      const res = await api.get(`/flashcards/pendientes/${oposicionId}?limite=${numFlashcards}`);
      return res.data;
    },
    enabled: !!(oposicionId || temaId || articuloId) && !!usuario,
    // ⭐ La lista de la sesión no se vuelve a pedir sola: al volver a la app desde otra,
    // se recargaba la lista de pendientes (ya más corta por las tarjetas valoradas) y el
    // índice saltaba tarjetas o la sesión acababa antes. Al salir se descarta (gcTime 0).
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const registrar = useMutation({
    mutationFn: async ({ flashcardId, calificacion, tiempoMs }: any) => {
      const res = await api.post('/flashcards/respuesta', { flashcardId, calificacion, tiempoMs });
      return res.data;
    },
  });

  const fc = flashcards[indice];
  const tiempoTranscurrido = () => Date.now() - tiempoInicio;

  const handleVerRespuesta = () => setEstado('respuesta');

  const handleVF = (respuesta: boolean) => {
    setRespuestaVF(respuesta);
    setEstado('respuesta');
  };

  const handleResultado = async (calificacion: number) => {
    const tiempoMs = tiempoTranscurrido();
    setErrorRegistro('');
    try {
      const res = await registrar.mutateAsync({ flashcardId: fc.id, calificacion, tiempoMs });
      if (res?.gamificacion) setGamificacionInfo(res.gamificacion);
    } catch (e: any) {
      setErrorRegistro(e?.response?.data?.message ?? 'No se pudo registrar la respuesta. Inténtalo de nuevo.');
      return;
    }
    setResultados(prev => [...prev, { id: fc.id, calificacion }]);

    // En las de autoevaluación, si se falla y hay artículo, se para para poder consultarlo
    if (calificacion < 3 && fc.articulo && !esVF(fc.tipo)) {
      setPausaFallo(true);
      return;
    }
    avanzar();
  };

  const avanzar = () => {
    setPausaFallo(false);
    if (indice + 1 >= flashcards.length) {
      setEstado('fin');
      invalidarEstadoFC();
    } else {
      setIndice(i => i + 1);
      setEstado('pregunta');
      setRespuestaVF(null);
      setTiempoInicio(Date.now());
    }
  };

  const volver = () => {
    if (desdeHub) {
      router.push('/app/flashcards');
    } else if (temaId && oposicionId && numeroTema) {
      router.push(`/app/tema/${oposicionId}/${numeroTema}`);
    } else if (articuloId) {
      router.push(`/app/articulo/${articuloId}?leyId=${leyIdArticulo ?? ''}&oposicionId=${oposicionId ?? ''}`);
    } else {
      router.push('/app/flashcards');
    }
  };


  if (cargando || isLoading) return null;

  if (isError && flashcards.length === 0) return <ErrorCarga pantalla onReintentar={() => refetch()} />;

  if (flashcards.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG_APP, padding: '1.5rem 1.25rem' }}>
        <EmptyState
          icon={<Layers size={28} />}
          eyebrow="Flashcards"
          title={modo === 'repasar' ? '¡Todo al día!' : modo === 'nuevas' ? 'No quedan nuevas' : temaId || articuloId ? 'Sin flashcards' : '¡Todo al día!'}
          description={
            modo === 'repasar'
              ? 'De este tema no te toca repasar ninguna hoy.'
              : modo === 'nuevas'
              ? 'Ya has empezado todas las flashcards de este tema.'
              : temaId
              ? 'Este tema no tiene flashcards disponibles todavía.'
              : articuloId
              ? 'Este artículo no tiene flashcards disponibles todavía.'
              : 'No tienes flashcards pendientes de repasar.'
          }
          actions={
            <button
              onClick={volver}
              style={{ width: '100%', padding: 13, background: 'var(--hxbg-111827)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              {desdeHub ? 'Volver a flashcards' : temaId ? 'Volver al tema' : articuloId ? 'Volver al artículo' : 'Volver'}
            </button>
          }
        />
      </div>
    );
  }

  const sabidas = resultados.filter(r => r.calificacion >= 4).length;
  const bien = resultados.filter(r => r.calificacion === 3).length;
  const dificil = resultados.filter(r => r.calificacion === 2).length;
  const falladas = resultados.filter(r => r.calificacion < 2).length;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 20 }}>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button
            onClick={volver}
            aria-label="Volver"
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--c-superficie)', boxShadow: 'var(--c-sombra)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={17} />
            </span>
            {desdeHub ? 'Flashcards' : temaId ? 'Tema' : articuloId ? 'Artículo' : 'Flashcards'}
          </button>
          {estado !== 'fin' && (
            <span style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 600 }}>{indice + 1} / {flashcards.length}</span>
          )}
        </div>

        {/* FIN */}
        {estado === 'fin' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--c-superficie)', boxShadow: 'var(--c-sombra)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <PartyPopper size={28} color={COLOR_FC} />
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>
              {modo === 'nuevas' ? '¡Tanda completada!' : '¡Repaso completado!'}
            </div>
            <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 20 }}>
              {modo === 'nuevas'
                ? `${resultados.length} ${resultados.length === 1 ? 'flashcard nueva' : 'flashcards nuevas'}. Volverán mañana para su primer repaso.`
                : `${resultados.length} flashcards repasadas`}
            </div>

            {gamificacionInfo && (
              <PuntosGanadosCard gamificacion={gamificacionInfo} />
            )}

            <div style={{ background: 'var(--c-superficie)', borderRadius: 16, padding: '1.25rem', marginBottom: 16, textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Resumen
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: 'Fácil', value: sabidas, color: 'var(--hx-15803d)', bg: 'var(--hx-f0fdf4)' },
                  { label: 'Bien', value: bien, color: 'var(--hx-2563eb)', bg: 'var(--hx-eff6ff)' },
                  { label: 'Difícil', value: dificil, color: 'var(--hx-d97706)', bg: 'var(--hx-fffbeb)' },
                  { label: 'Nada', value: falladas, color: 'var(--hx-dc2626)', bg: 'var(--hx-fef2f2)' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '10px 6px', background: bg, borderRadius: 12 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
                    <div style={{ fontSize: 10, color, marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--hx-faf5fb)', borderRadius: 12, fontSize: 12, color: TEXT_SECONDARY }}>
                <Lightbulb size={14} color={COLOR_FC} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                Las tarjetas difíciles o falladas aparecerán antes en tu próximo repaso
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* ⭐ Tras una tanda de nuevas: volver a la ficha del tema para elegir otra tanda
                  (repetir las mismas hoy las daría por sabidas demasiado pronto). */}
              {modo === 'nuevas' && temaId ? (
                <button
                  onClick={() => router.push(`/app/flashcards?tema=${temaId}`)}
                  style={{ width: '100%', padding: 13, background: 'var(--hxbg-111827)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  Seguir con más nuevas
                </button>
              ) : (
              <button
                onClick={() => {
                  setIndice(0);
                  setEstado('pregunta');
                  setPausaFallo(false);
                  setResultados([]);
                  setGamificacionInfo(null);
                  setErrorRegistro('');
                  setTiempoInicio(Date.now());
                  invalidarEstadoFC();
                }}
                style={{ width: '100%', padding: 13, background: 'var(--hxbg-111827)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                Repasar de nuevo
              </button>
              )}
              <button
                onClick={volver}
                style={{ width: '100%', padding: 13, background: 'var(--c-superficie)', color: TEXT_SECONDARY, border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {desdeHub ? 'Volver a flashcards' : temaId ? 'Volver al tema' : articuloId ? 'Volver al artículo' : 'Volver a flashcards'}
              </button>
            </div>
          </div>
        )}

        {/* TARJETA */}
        {estado !== 'fin' && fc && (() => {
          const vf = esVF(fc.tipo);
          const respuestaCorrectaVF = fc.respuesta === 'true';
          const acertadaVF = respuestaVF === respuestaCorrectaVF;
          const cita = fc.referencia || (fc.articulo ? `Art. ${fc.articulo.numero}` : null);
          const temaTarjeta = fc.tema?.numero ?? numeroTema;
          const abrirArticulo = () => fc.articulo && setArticuloAbierto({ id: fc.articulo.id, numero: fc.articulo.numero });
          const estructura = fc.tipo === 'comparativa' ? fc.estructura : null;
          return (
          <div>
            <div style={{ height: 4, background: 'var(--hx-eedcf0)', borderRadius: 2, overflow: 'hidden', marginBottom: 18 }}>
              <div style={{
                width: `${((indice + 1) / flashcards.length) * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${COLOR_FC}, #C084FC)`,
                borderRadius: 2,
                transition: 'width 0.3s',
              }} />
            </div>

            {/* Etiquetas: tipo, nivel, tema y cita */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              <Chip color={COLOR_FC} fondo="var(--hx-f3e8ff)">{TIPO_LABEL[fc.tipo] ?? fc.tipo}</Chip>
              {fc.nivel && <Chip color={NIVEL_COLOR[fc.nivel] ?? TEXT_SECONDARY}>{NIVEL_LABEL[fc.nivel] ?? fc.nivel}</Chip>}
              {temaTarjeta && <Chip color={TEXT_SECONDARY}>Tema {temaTarjeta}</Chip>}
              {cita && <Chip color="var(--hx-185fa5)" fondo="var(--hx-e6f1fb)">{cita}</Chip>}
            </div>

            <div style={{
              background: 'var(--c-superficie)',
              border: estado === 'respuesta' ? `2px solid ${COLOR_FC}` : '1px solid var(--hx-f1f5f9)',
              boxShadow: 'var(--c-sombra)',
              borderRadius: 18,
              padding: '1.4rem 1.3rem',
              marginBottom: 16,
              minHeight: 170,
              transition: 'border-color 0.3s',
            }}>
              <Rotulo>{fc.tipo === 'supuesto' ? 'Caso práctico' : fc.tipo === 'comparativa' ? 'Compara' : vf ? '¿Verdadero o falso?' : 'Pregunta'}</Rotulo>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                {fc.pregunta}
              </div>

              {estado === 'respuesta' && (
                <div style={{ borderTop: '1px solid var(--hx-f1f5f9)', marginTop: '1rem', paddingTop: '1rem', animation: 'fc-revelar .25s ease both' }}>
                  <style>{`@keyframes fc-revelar { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }`}</style>
                  <Rotulo color={COLOR_FC}>{fc.tipo === 'supuesto' ? 'Solución' : fc.tipo === 'comparativa' ? 'En resumen' : 'Respuesta'}</Rotulo>
                  <div style={{ fontSize: 14.5, color: TEXT_PRIMARY, lineHeight: 1.6, fontWeight: 600, whiteSpace: 'pre-line' }}>
                    {vf ? (respuestaCorrectaVF ? 'Verdadero' : 'Falso') : fc.respuesta}
                  </div>

                  {/* Comparativa: aspecto | A | B (en móvil, cada aspecto con sus dos columnas debajo) */}
                  {estructura && Array.isArray(estructura.diferencias) && (
                    <div style={{ marginTop: 14, border: '1px solid var(--hx-eef0f3)', borderRadius: 14, overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: COLOR_FC_BG_SUAVE }}>
                        {[estructura.conceptoA, estructura.conceptoB].map((c: string, k: number) => (
                          <div key={k} style={{ padding: '9px 11px', fontSize: 12, fontWeight: 800, color: COLOR_FC, borderLeft: k ? '1px solid var(--hx-eef0f3)' : 'none', lineHeight: 1.3 }}>{c}</div>
                        ))}
                      </div>
                      {estructura.diferencias.map((d: any, k: number) => (
                        <div key={k} style={{ borderTop: '1px solid var(--hx-eef0f3)' }}>
                          <div style={{ padding: '7px 11px 0', fontSize: 10.5, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.aspecto}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                            {[d.a, d.b].map((t: string, j: number) => (
                              <div key={j} style={{ padding: '4px 11px 9px', fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.45, borderLeft: j ? '1px solid var(--hx-eef0f3)' : 'none' }}>{t}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {fc.explicacion && (
                    <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 12, lineHeight: 1.6, background: 'var(--hx-faf5fb)', borderRadius: 12, padding: '10px 12px', whiteSpace: 'pre-line' }}>
                      <Lightbulb size={14} color={COLOR_FC} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                      {fc.explicacion}
                    </div>
                  )}

                  {fc.articulo && !(vf && !acertadaVF) && !pausaFallo && (
                    <button onClick={abrirArticulo}
                      style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, border: '1px solid var(--hx-e5e7eb)', background: 'transparent', color: TEXT_SECONDARY, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                      <BookOpen size={14} /> Ver artículo{cita ? ` · ${cita}` : ''}
                    </button>
                  )}
                </div>
              )}
            </div>

            {errorRegistro && (
              <div style={{ fontSize: 12, color: 'var(--hx-dc2626)', background: 'var(--hx-fef2f2)', border: '1px solid var(--hx-fecaca)', borderRadius: 10, padding: '8px 12px', marginBottom: 10 }}>
                {errorRegistro}
              </div>
            )}

            {/* V/F (vf y trampa) — pregunta */}
            {estado === 'pregunta' && vf && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => handleVF(true)}
                  style={{ flex: 1, padding: 15, background: 'var(--hx-f0fdf4)', border: '2px solid var(--hx-86efac)', borderRadius: 14, fontSize: 15, fontWeight: 700, color: 'var(--hx-15803d)', cursor: 'pointer' }}>
                  <CheckCircle2 size={17} style={{ verticalAlign: '-3px', marginRight: 6 }} />
                  Verdadero
                </button>
                <button onClick={() => handleVF(false)}
                  style={{ flex: 1, padding: 15, background: 'var(--hx-fef2f2)', border: '2px solid var(--hx-fca5a5)', borderRadius: 14, fontSize: 15, fontWeight: 700, color: 'var(--hx-dc2626)', cursor: 'pointer' }}>
                  <XCircle size={17} style={{ verticalAlign: '-3px', marginRight: 6 }} />
                  Falso
                </button>
              </div>
            )}

            {/* Resto — pensar y revelar */}
            {estado === 'pregunta' && !vf && (
              <button onClick={handleVerRespuesta}
                style={{ width: '100%', padding: 15, background: 'var(--hxbg-111827)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {fc.tipo === 'supuesto' ? 'Ver solución' : fc.tipo === 'comparativa' ? 'Ver comparativa' : 'Ver respuesta'}
              </button>
            )}

            {/* V/F — resultado */}
            {estado === 'respuesta' && vf && (
              <div>
                <div style={{
                  background: acertadaVF ? 'var(--hx-f0fdf4)' : 'var(--hx-fef2f2)',
                  border: `1px solid ${acertadaVF ? 'var(--hx-86efac)' : 'var(--hx-fca5a5)'}`,
                  borderRadius: 12, padding: '10px 14px', marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  {acertadaVF ? <CheckCircle2 size={17} color="var(--hx-15803d)" /> : <XCircle size={17} color="var(--hx-dc2626)" />}
                  <span style={{ fontSize: 13, fontWeight: 600, color: acertadaVF ? 'var(--hx-15803d)' : 'var(--hx-dc2626)' }}>
                    {acertadaVF ? '¡Correcto!' : `Incorrecto: es ${respuestaCorrectaVF ? 'verdadero' : 'falso'}`}
                  </span>
                </div>
                {!acertadaVF && fc.articulo && <RepasaArticulo cita={cita} onAbrir={abrirArticulo} />}
                <button onClick={() => handleResultado(acertadaVF ? 4 : 1)} disabled={registrar.isPending}
                  style={{ width: '100%', padding: 13, background: 'var(--hxbg-111827)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: registrar.isPending ? 'not-allowed' : 'pointer', opacity: registrar.isPending ? 0.6 : 1 }}>
                  {registrar.isPending ? 'Guardando...' : 'Siguiente →'}
                </button>
              </div>
            )}

            {/* Tras fallar una de autoevaluación con artículo */}
            {estado === 'respuesta' && !vf && pausaFallo && (
              <div>
                <RepasaArticulo cita={cita} onAbrir={abrirArticulo} />
                <button onClick={avanzar}
                  style={{ width: '100%', padding: 13, background: 'var(--hxbg-111827)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Siguiente →
                </button>
              </div>
            )}

            {/* Autoevaluación (hueco, articulo, supuesto, comparativa) */}
            {estado === 'respuesta' && !vf && !pausaFallo && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: TEXT_SECONDARY, marginBottom: 10, textAlign: 'center' }}>
                  ¿Cómo te ha ido?
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {[
                    { cal: 0, label: 'Nada', sub: 'Mañana', color: 'var(--hx-dc2626)', bg: 'var(--hx-fef2f2)', border: 'var(--hx-fca5a5)' },
                    { cal: 2, label: 'Difícil', sub: 'Mañana', color: 'var(--hx-d97706)', bg: 'var(--hx-fffbeb)', border: 'var(--hx-fde68a)' },
                    { cal: 3, label: 'Bien', sub: 'Varios días', color: 'var(--hx-2563eb)', bg: 'var(--hx-eff6ff)', border: 'var(--hx-bfdbfe)' },
                    { cal: 5, label: 'Fácil', sub: 'Semanas', color: 'var(--hx-15803d)', bg: 'var(--hx-f0fdf4)', border: 'var(--hx-86efac)' },
                  ].map(({ cal, label, sub, color, bg, border }) => (
                    <button key={cal} onClick={() => handleResultado(cal)} disabled={registrar.isPending}
                      style={{
                        padding: '12px 4px', borderRadius: 14, background: bg, border: `1.5px solid ${border}`,
                        cursor: registrar.isPending ? 'not-allowed' : 'pointer', textAlign: 'center', opacity: registrar.isPending ? 0.6 : 1,
                      }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
                      <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 3 }}>{sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {articuloAbierto && (
          <HojaArticulo
            articulo={articuloAbierto}
            oposicionId={oposicionId}
            onCerrar={() => setArticuloAbierto(null)}
            onAbrirEnLey={(id) => router.push(`/app/articulo/${id}?oposicionId=${oposicionId ?? ''}`)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Piezas de la pantalla ─────────────────────────────────────────────────────────────

const esVF = (tipo: string) => tipo === 'vf' || tipo === 'trampa';

const TIPO_LABEL: Record<string, string> = {
  vf: 'Verdadero / Falso',
  hueco: 'Completa el hueco',
  trampa: 'Detecta la trampa',
  articulo: '¿Qué artículo es?',
  supuesto: 'Supuesto práctico',
  comparativa: 'Comparativa',
};

// En la base de datos el nivel alto se llama "alto"; en pantalla, "Avanzado".
const NIVEL_LABEL: Record<string, string> = { basico: 'Básico', medio: 'Medio', alto: 'Avanzado' };

const NIVEL_COLOR: Record<string, string> = {
  basico: 'var(--hx-15803d)',
  medio: 'var(--hx-d97706)',
  alto: 'var(--hx-dc2626)',
};

const COLOR_FC_BG_SUAVE = 'var(--hx-faf5fb)';

function Chip({ children, color, fondo }: { children: React.ReactNode; color: string; fondo?: string }) {
  return (
    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: fondo ?? 'var(--c-superficie)', color, fontWeight: 600 }}>
      {children}
    </span>
  );
}

function Rotulo({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: color ?? TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
      {children}
    </div>
  );
}

/** Aviso destacado tras un fallo: repasar el artículo de la tarjeta. */
function RepasaArticulo({ cita, onAbrir }: { cita: string | null; onAbrir: () => void }) {
  return (
    <button onClick={onAbrir}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', marginBottom: 10,
        borderRadius: 14, border: '1.5px solid var(--hx-fde68a)', background: 'var(--hx-fffbeb)', cursor: 'pointer', textAlign: 'left',
      }}>
      <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-superficie)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <BookOpen size={18} color="var(--hx-b45309)" />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--hx-92400e)' }}>Repasa el artículo{cita ? ` · ${cita}` : ''}</span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--hx-b45309)', marginTop: 1 }}>Leerlo ahora es lo que más ayuda a no volver a fallarla</span>
      </span>
      <ChevronRight size={16} color="var(--hx-b45309)" />
    </button>
  );
}

/** Hoja inferior con el texto del artículo (sin salir del repaso, que perdería la sesión). */
function HojaArticulo({ articulo, oposicionId, onCerrar, onAbrirEnLey }: {
  articulo: { id: string; numero?: string }; oposicionId?: string | null;
  onCerrar: () => void; onAbrirEnLey: (id: string) => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['articulo-fc', articulo.id],
    queryFn: async () => (await api.get(`/normativa/articulo/${articulo.id}`)).data,
  });
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', alPulsar);
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', alPulsar); document.body.style.overflow = antes; };
  }, [onCerrar]);
  const ley = data?.capitulo?.tituloRef?.versionLey?.ley?.nombre ?? data?.seccion?.capitulo?.tituloRef?.versionLey?.ley?.nombre;
  return (
    <div role="dialog" aria-modal="true" aria-label={`Artículo ${articulo.numero ?? ''}`} style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <style>{`@keyframes fc-hoja-art { from { transform: translateY(100%); } to { transform: none; } }`}</style>
      <div onClick={onCerrar} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.45)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 560, maxHeight: '82vh', overflowY: 'auto', background: 'var(--c-superficie)',
        borderRadius: '22px 22px 0 0', boxShadow: '0 -8px 30px rgba(0,0,0,0.18)', padding: '10px 18px calc(18px + env(safe-area-inset-bottom))',
        animation: 'fc-hoja-art .25s cubic-bezier(.2,.8,.2,1) both',
      }}>
        <div style={{ width: 38, height: 4, borderRadius: 999, background: 'var(--hx-d1d5db)', margin: '0 auto 12px' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: TEXT_PRIMARY }}>Artículo {data?.numero ?? articulo.numero ?? ''}</div>
            {(ley || data?.titulo) && <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{[data?.titulo, ley].filter(Boolean).join(' · ')}</div>}
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--c-superficie-2, var(--hx-f3f4f6))', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <X size={16} color={TEXT_SECONDARY} />
          </button>
        </div>
        {isLoading && <div style={{ fontSize: 13, color: TEXT_MUTED, padding: '12px 0' }}>Cargando artículo…</div>}
        {isError && <div style={{ fontSize: 13, color: 'var(--hx-b91c1c)', padding: '12px 0' }}>No se ha podido cargar el artículo.</div>}
        {data?.contenido && (
          <div style={{ fontSize: 14.5, color: TEXT_PRIMARY, lineHeight: 1.75, whiteSpace: 'pre-line' }}>{data.contenido}</div>
        )}
        <button onClick={() => onAbrirEnLey(articulo.id)}
          style={{ marginTop: 16, width: '100%', padding: 12, borderRadius: 12, border: `1.5px solid ${COLOR_FC}`, background: 'transparent', color: COLOR_FC, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Abrir en la ley
        </button>
      </div>
    </div>
  );
}
