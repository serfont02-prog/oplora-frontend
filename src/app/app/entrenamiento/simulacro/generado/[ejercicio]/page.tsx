'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ArrowLeft, Clock } from 'lucide-react';

const BG_APP = '#F4F5F7';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';
const COLOR_SIMULACRO = '#7C3AED';

type Fase = 'intro' | 'examen' | 'resultado';

export default function SimulacroGeneradoPage() {
  const params = useParams();
  const router = useRouter();
  const { usuario } = useAuth();
  const ejercicioNumero = params.ejercicio as string;
  const oposicionId = usuario?.oposicionActiva?.id;

  const [fase, setFase] = useState<Fase>('intro');
  const [indiceActual, setIndiceActual] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, number | null>>({});
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null);
  const [resultado, setResultado] = useState<any>(null);
  const intervaloRef = useRef<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['simulacro-generado', oposicionId, ejercicioNumero],
    queryFn: async () => {
      const res = await api.get(`/temas/simulacro-oplora/${oposicionId}/${ejercicioNumero}`);
      return res.data;
    },
    enabled: !!oposicionId,
  });

  const tiempoMinutos = data?.ejercicio?.tiempoMinutos ?? null;

  const corregir = useMutation({
    mutationFn: async () => {
      const preguntaIds = data.preguntas.map((p: any) => p.id);
      const respuestasArray = Object.entries(respuestas).map(([preguntaId, opcionElegida]) => ({
        preguntaId,
        opcionElegida,
      }));
      const res = await api.post(`/temas/simulacro-oplora/${oposicionId}/corregir`, {
        preguntaIds,
        respuestas: respuestasArray,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setResultado(data);
      setFase('resultado');
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    },
  });

  useEffect(() => {
    if (fase !== 'examen' || segundosRestantes === null) return;
    if (segundosRestantes <= 0) {
      corregir.mutate();
      return;
    }
    intervaloRef.current = setTimeout(() => setSegundosRestantes((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(intervaloRef.current);
  }, [fase, segundosRestantes]);

  const empezar = () => {
    if (tiempoMinutos) setSegundosRestantes(tiempoMinutos * 60);
    setFase('examen');
  };

  const seleccionar = (preguntaId: string, opcion: number) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: prev[preguntaId] === opcion ? null : opcion }));
  };

  const formatearTiempo = (segundos: number) => {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) return null;
  if (!data) return null;

  const preguntas = data.preguntas ?? [];
  const preguntaActual = preguntas[indiceActual];

  return (
    <div style={{ minHeight: '100vh', background: BG_APP }}>

      {fase === 'intro' && (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '1.5rem' }}>
          <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY, fontSize: 13, marginBottom: 24 }}>
            <ArrowLeft size={15} />
            Volver
          </button>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 4 }}>
              Simulacro OPLORA
            </div>
            <div style={{ fontSize: 13, color: TEXT_MUTED, textTransform: 'capitalize' }}>
              Ejercicio {data.ejercicio.numero} — {data.ejercicio.tipo}
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: 18, marginBottom: 20 }}>
            <Fila label="Preguntas" valor={preguntas.length} />
            {tiempoMinutos && <Fila label="Tiempo" valor={`${tiempoMinutos} minutos`} />}
            <Fila label="Penalización" valor={data.convocatoria.fraccionPenalizacion || 'Sin penalización'} />
            {data.convocatoria.notaMinimaAprobado && <Fila label="Nota mínima" valor={data.convocatoria.notaMinimaAprobado} />}
          </div>

          <div style={{ background: '#F3E8FF', borderRadius: 14, padding: 14, marginBottom: 24, fontSize: 12, color: '#5B21B6', lineHeight: 1.6 }}>
            ⚡ Este examen se genera mezclando preguntas de todo tu temario y la normativa relacionada, con la misma estructura, tiempo y penalización que tendrías el día real.
          </div>

          <button
            onClick={empezar}
            style={{ width: '100%', padding: 15, background: COLOR_SIMULACRO, color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            Empezar examen
          </button>
        </div>
      )}

      {fase === 'examen' && preguntaActual && (
        <div>
          <div style={{ background: 'white', borderBottom: '1px solid #F1F5F9', padding: '0 1.25rem', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>
              Pregunta {indiceActual + 1} / {preguntas.length}
            </span>
            {segundosRestantes !== null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: segundosRestantes < 60 ? '#DC2626' : TEXT_PRIMARY }}>
                <Clock size={15} />
                {formatearTiempo(segundosRestantes)}
              </span>
            )}
          </div>

          <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {preguntas.map((p: any, i: number) => {
                const respondida = respuestas[p.id] !== undefined && respuestas[p.id] !== null;
                const esActual = i === indiceActual;
                return (
                  <button
                    key={p.id}
                    onClick={() => setIndiceActual(i)}
                    style={{
                      width: 28, height: 28, borderRadius: 8, border: esActual ? `2px solid ${COLOR_SIMULACRO}` : 'none',
                      background: respondida ? '#EDE9FE' : '#F1F5F9',
                      color: respondida ? COLOR_SIMULACRO : TEXT_MUTED,
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: 18, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.6, marginBottom: 16 }}>
                {preguntaActual.enunciado}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {preguntaActual.opciones.map((op: string, i: number) => {
                  const seleccionada = respuestas[preguntaActual.id] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => seleccionar(preguntaActual.id, i)}
                      style={{
                        textAlign: 'left', padding: '12px 14px', borderRadius: 12,
                        border: seleccionada ? `2px solid ${COLOR_SIMULACRO}` : '1px solid #E5E7EB',
                        background: seleccionada ? '#F3E8FF' : 'white',
                        cursor: 'pointer', fontSize: 13, color: TEXT_PRIMARY,
                      }}
                    >
                      <strong style={{ marginRight: 8 }}>{String.fromCharCode(65 + i)})</strong> {op}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setIndiceActual((i) => Math.max(0, i - 1))}
                disabled={indiceActual === 0}
                style={{ flex: 1, padding: 13, background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, cursor: indiceActual === 0 ? 'not-allowed' : 'pointer', opacity: indiceActual === 0 ? 0.4 : 1 }}
              >
                ← Anterior
              </button>

              {indiceActual < preguntas.length - 1 ? (
                <button
                  onClick={() => setIndiceActual((i) => i + 1)}
                  style={{ flex: 1, padding: 13, background: TEXT_PRIMARY, color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  onClick={() => { if (confirm('¿Finalizar el examen y ver tu resultado?')) corregir.mutate(); }}
                  disabled={corregir.isPending}
                  style={{ flex: 1, padding: 13, background: COLOR_SIMULACRO, color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  {corregir.isPending ? 'Corrigiendo...' : 'Finalizar examen'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {fase === 'resultado' && resultado && (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{resultado.aprobarias ? '🎉' : '📚'}</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: resultado.aprobarias ? '#15803D' : '#DC2626', marginBottom: 4 }}>
            {resultado.nota.toFixed(2)}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 24 }}>
            {resultado.aprobarias
              ? `¡Con esta nota aprobarías! (mínimo ${resultado.notaMinima})`
              : `No llegarías al aprobado (mínimo ${resultado.notaMinima})`}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
            <div style={{ background: '#F0FDF4', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#15803D' }}>{resultado.correctas}</div>
              <div style={{ fontSize: 10, color: '#15803D' }}>Correctas</div>
            </div>
            <div style={{ background: '#FEF2F2', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#DC2626' }}>{resultado.incorrectas}</div>
              <div style={{ fontSize: 10, color: '#DC2626' }}>Incorrectas</div>
            </div>
            <div style={{ background: '#F1F5F9', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_MUTED }}>{resultado.blancos}</div>
              <div style={{ fontSize: 10, color: TEXT_MUTED }}>En blanco</div>
            </div>
          </div>

          <button
            onClick={() => router.push('/app/entrenamiento')}
            style={{ width: '100%', padding: 14, background: TEXT_PRIMARY, color: 'white', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Volver a Practicar
          </button>
        </div>
      )}
    </div>
  );
}

function Fila({ label, valor }: { label: string; valor: any }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0' }}>
      <span style={{ color: TEXT_MUTED }}>{label}</span>
      <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>{valor}</span>
    </div>
  );
}