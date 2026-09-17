'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';

const BG_APP = '#F4F5F7';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

const DIFICULTAD_LABEL: Record<string, string> = {
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil',
  experto: 'Experto',
};

type Fase = 'config' | 'jugando' | 'resultado';

export default function PsicotecnicoTipoPage() {
  const params = useParams();
  const router = useRouter();
  const { usuario } = useAuth();
  const tipo = params.tipo as string;
  const oposicionId = usuario?.oposicionActiva?.id;

  const [fase, setFase] = useState<Fase>('config');
  const [numPreguntas, setNumPreguntas] = useState(10);
  const [dificultad, setDificultad] = useState<string | null>(null);

  const [preguntas, setPreguntas] = useState<any[]>([]);
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, number | null>>({});
  const [respuestaActual, setRespuestaActual] = useState<number | null>(null);
  const [mostrarCorreccion, setMostrarCorreccion] = useState(false);
  const [tiempoInicio, setTiempoInicio] = useState(0);
  const [tiempoPreguntaMs, setTiempoPreguntaMs] = useState<Record<string, number>>({});
  const [segundos, setSegundos] = useState(0);
  const [resultado, setResultado] = useState<any>(null);
  const intervalRef = useRef<any>(null);

  const { data: modalidades = [] } = useQuery({
    queryKey: ['psicotecnicos-config-detalle', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/psicotecnicos/config/${oposicionId}`);
      return res.data;
    },
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
    try {
      const res = await api.post('/psicotecnicos/generar', {
        oposicionId,
        tipo,
        dificultad: dificultad || undefined,
        numPreguntas,
      });
      setPreguntas(res.data);
      setIndice(0);
      setRespuestas({});
      setTiempoPreguntaMs({});
      setSegundos(0);
      setTiempoInicio(Date.now());
      setRespuestaActual(null);
      setMostrarCorreccion(false);
      setFase('jugando');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'No hay preguntas disponibles para esta modalidad todavía.');
    }
  };

  const enviarResultado = useMutation({
    mutationFn: async (respuestasFinal: Record<string, number | null>) => {
      const body = {
        oposicionId,
        tipo,
        dificultad: dificultad || undefined,
        tiempoSegundos: segundos,
        respuestas: preguntas.map((p) => ({
          preguntaId: p.id,
          respuesta: respuestasFinal[p.id] ?? null,
          tiempoMs: tiempoPreguntaMs[p.id],
        })),
      };
      const res = await api.post('/psicotecnicos/resultado', body);
      return res.data;
    },
    onSuccess: (data) => {
      setResultado(data);
      setFase('resultado');
    },
  });

  const preguntaActual = preguntas[indice];

  const responder = (opcionIndex: number) => {
    if (mostrarCorreccion) return;
    setRespuestaActual(opcionIndex);
    setMostrarCorreccion(true);
    setTiempoPreguntaMs((prev) => ({ ...prev, [preguntaActual.id]: Date.now() - tiempoInicio }));
  };

  const siguiente = () => {
    const nuevasRespuestas = { ...respuestas, [preguntaActual.id]: respuestaActual };
    setRespuestas(nuevasRespuestas);
    setRespuestaActual(null);
    setMostrarCorreccion(false);

    if (indice + 1 < preguntas.length) {
      setIndice(indice + 1);
    } else {
      enviarResultado.mutate(nuevasRespuestas);
    }
  };

  const formatearTiempo = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!usuario) return null;

  /* ───────────────────────── CONFIG ───────────────────────── */
  if (fase === 'config') {
    return (
      <div style={{ minHeight: '100vh', background: BG_APP }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '1.5rem' }}>
          <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY, fontSize: 13, marginBottom: 24 }}>
            <ArrowLeft size={15} />
            Volver
          </button>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>{modalidad?.icono ?? '🧠'}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>{modalidad?.nombre ?? 'Psicotécnico'}</div>
            <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 4 }}>{modalidad?.descripcion}</div>
          </div>

          <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 18, padding: 20, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 10 }}>Número de preguntas</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[5, 10, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => setNumPreguntas(n)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: numPreguntas === n ? '2px solid #111827' : '1px solid #e5e7eb',
                    background: numPreguntas === n ? '#111827' : 'white',
                    color: numPreguntas === n ? 'white' : '#374151',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {modalidad?.dificultadesDisponibles?.length > 0 && (
            <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 18, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 10 }}>Dificultad</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setDificultad(null)}
                  style={{
                    padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: !dificultad ? '2px solid #111827' : '1px solid #e5e7eb',
                    background: !dificultad ? '#111827' : 'white',
                    color: !dificultad ? 'white' : '#374151',
                  }}
                >
                  Mixta
                </button>
                {modalidad.dificultadesDisponibles.map((d: string) => (
                  <button
                    key={d}
                    onClick={() => setDificultad(d)}
                    style={{
                      padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: dificultad === d ? '2px solid #111827' : '1px solid #e5e7eb',
                      background: dificultad === d ? '#111827' : 'white',
                      color: dificultad === d ? 'white' : '#374151',
                    }}
                  >
                    {DIFICULTAD_LABEL[d] ?? d}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={iniciar}
            style={{ width: '100%', padding: 15, background: '#111827', color: 'white', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Empezar a entrenar
          </button>
        </div>
      </div>
    );
  }

  /* ───────────────────────── JUGANDO ───────────────────────── */
  if (fase === 'jugando' && preguntaActual) {
    const esCorrecta = respuestaActual === preguntaActual.correcta;

    return (
      <div style={{ minHeight: '100vh', background: BG_APP }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '1.5rem' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: 600 }}>
              Pregunta {indice + 1}/{preguntas.length}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: TEXT_SECONDARY, fontWeight: 600 }}>
              <Clock size={13} />
              {formatearTiempo(segundos)}
            </div>
          </div>

          <div style={{ height: 4, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ width: `${((indice + 1) / preguntas.length) * 100}%`, height: '100%', background: '#111827', borderRadius: 999, transition: 'width 0.3s' }} />
          </div>

          <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 18, padding: 20, marginBottom: 16 }}>
            {preguntaActual.imagenUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preguntaActual.imagenUrl} alt="" style={{ width: '100%', borderRadius: 10, marginBottom: 14 }} />
            )}
            <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.5 }}>
              {preguntaActual.enunciado}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {preguntaActual.opciones.map((op: string, i: number) => {
              const esElegida = respuestaActual === i;
              const esLaCorrecta = mostrarCorreccion && i === preguntaActual.correcta;
              const esIncorrectaElegida = mostrarCorreccion && esElegida && !esCorrecta;

              return (
                <button
                  key={i}
                  onClick={() => responder(i)}
                  disabled={mostrarCorreccion}
                  style={{
                    textAlign: 'left', padding: '13px 16px', borderRadius: 12, fontSize: 13.5, fontWeight: 500,
                    cursor: mostrarCorreccion ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    border: esLaCorrecta ? '2px solid #16A34A' : esIncorrectaElegida ? '2px solid #DC2626' : esElegida ? '2px solid #111827' : '1px solid #e5e7eb',
                    background: esLaCorrecta ? '#F0FDF4' : esIncorrectaElegida ? '#FEF2F2' : 'white',
                    color: TEXT_PRIMARY,
                  }}
                >
                  <span>{op}</span>
                  {esLaCorrecta && <CheckCircle2 size={16} color="#16A34A" />}
                  {esIncorrectaElegida && <XCircle size={16} color="#DC2626" />}
                </button>
              );
            })}
          </div>

          {mostrarCorreccion && (
            <>
              {preguntaActual.explicacion && (
                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 12.5, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
                  {preguntaActual.explicacion}
                </div>
              )}
              <button
                onClick={siguiente}
                disabled={enviarResultado.isPending}
                style={{ width: '100%', padding: 15, background: '#111827', color: 'white', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                {indice + 1 < preguntas.length ? 'Continuar' : enviarResultado.isPending ? 'Guardando...' : 'Ver resultado'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ───────────────────────── RESULTADO ───────────────────────── */
  if (fase === 'resultado' && resultado) {
    return (
      <div style={{ minHeight: '100vh', background: BG_APP }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '1.5rem', textAlign: 'center' }}>

          <div style={{ fontSize: 40, marginTop: 20, marginBottom: 10 }}>
            {resultado.porcentaje >= 80 ? '🏆' : resultado.porcentaje >= 50 ? '👍' : '💪'}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: TEXT_PRIMARY }}>
            {resultado.correctas}/{resultado.totalPreguntas}
          </div>
          <div style={{ fontSize: 15, color: TEXT_SECONDARY, marginBottom: 4 }}>{resultado.porcentaje}% de aciertos</div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 18 }}>Tiempo: {formatearTiempo(segundos)}</div>

          {resultado.esMejorMarca && (
            <div style={{ display: 'inline-block', background: '#F0FDF4', color: '#15803D', fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 999, marginBottom: 20 }}>
              Nueva mejor marca en {modalidad?.nombre ?? 'esta modalidad'} 🎉
            </div>
          )}

          <button
            onClick={() => setFase('config')}
            style={{ width: '100%', padding: 15, background: '#111827', color: 'white', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 10, marginTop: resultado.esMejorMarca ? 0 : 12 }}
          >
            Volver a entrenar
          </button>
          <button
            onClick={() => router.push('/app/entrenamiento/psicotecnicos')}
            style={{ width: '100%', padding: 13, background: 'white', border: '1px solid #e5e7eb', color: TEXT_SECONDARY, borderRadius: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Cambiar de modalidad
          </button>
        </div>
      </div>
    );
  }

  return null;
}
