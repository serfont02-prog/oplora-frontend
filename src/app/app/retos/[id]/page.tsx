'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, CheckCircle, XCircle, ChevronRight, Trophy } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { DueloReto } from '@/app/app/retos/page';
import { useEffect, useState, useRef } from 'react';

const BG_APP = '#FCEEE8';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

export default function RetoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { usuario, cargando } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const directo = searchParams.get('directo') === 'true';
  const [estado, setEstado] = useState<'intro' | 'jugando' | 'resultado'>(directo ? 'jugando' : 'intro');
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [respondida, setRespondida] = useState(false);
  const [respuestas, setRespuestas] = useState<{
  enunciado: string;
  opciones: string[];
  correcta: number;
  seleccionada: number;
  esCorrecta: boolean;
  explicacion?: string;
  }[]>([]);
  const [tiempoInicio, setTiempoInicio] = useState(0);

  
  useEffect(() => {
    if (directo && estado === 'jugando' && tiempoInicio === 0) {
      setTiempoInicio(Date.now());
    }
  }, [directo, estado, tiempoInicio]);
  
  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  const { data: reto, isLoading } = useQuery({
    queryKey: ['reto', id],
    queryFn: async () => {
      const res = await api.get(`/retos/${id}`);
      return res.data;
    },
    enabled: !!usuario,
  });

  const miParticipacion = reto?.participaciones?.find(
    (p: any) => p.usuario?.id === (usuario as any)?.id
  );

  useEffect(() => {
    if (reto && miParticipacion?.completado) {
      setEstado('resultado');
    }
  }, [reto, miParticipacion]);

  const { data: ranking = [] } = useQuery({
    queryKey: ['ranking-reto', id],
    queryFn: async () => {
      const res = await api.get(`/retos/${id}/ranking`);
      return res.data;
    },
    enabled: estado === 'resultado',
  });

  const completar = useMutation({
    mutationFn: async () => {
      const tiempoTotal = Math.round((Date.now() - tiempoInicio) / 1000);
      const res = await api.post(`/retos/${id}/completar`, {
        respuestas,
        tiempoSegundos: tiempoTotal,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-retos'] });
      queryClient.invalidateQueries({ queryKey: ['ranking-reto', id] });
      queryClient.invalidateQueries({ queryKey: ['reto', id] });
      setEstado('resultado');
    },
  });

  const preguntas = reto?.preguntas ?? [];
  const pregunta = preguntas[preguntaActual];
  const correctas = respuestas.filter((r) => r.esCorrecta).length;
  const porcentaje = preguntas.length > 0 ? Math.round((correctas / preguntas.length) * 100) : 0;
  const yaCompleto = miParticipacion?.completado;

    const yaEnviado = useRef(false);

    const seleccionarYSiguiente = (idx: number) => {
      setSeleccionada(idx);
      setRespuestas((prev) => [...prev, {
        enunciado: pregunta.enunciado,
        opciones: pregunta.opciones,
        correcta: pregunta.correcta,
        seleccionada: idx,
        esCorrecta: idx === pregunta.correcta,
        explicacion: pregunta.explicacion,
      }]);

      if (preguntaActual + 1 >= preguntas.length) {
        if (yaEnviado.current) return; // ⭐ bloqueo inmediato
        yaEnviado.current = true;
        completar.mutate();
      } else {
        setTimeout(() => {
          setPreguntaActual((p) => p + 1);
          setSeleccionada(null);
        }, 200);
      }
    };

  

  const tipoLabel: Record<string, string> = {
    diario: 'Reto diario ⚡',
    semanal: 'Reto semanal 🏆',
    usuario: 'Reto entre usuarios 🎯',
  };

  if (cargando || isLoading) return null;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: '40px' }}>

      {/* Header simple */}
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.25rem 1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => router.push('/app/retos')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: TEXT_SECONDARY, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          Retos
        </button>
        {estado === 'jugando' && (
          <span style={{ fontSize: '12px', color: TEXT_MUTED, fontWeight: 600 }}>
            {preguntaActual + 1}/{preguntas.length}
          </span>
        )}
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.25rem' }}>

        {/* INTRO */}
        {estado === 'intro' && (
          <div>
            <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: '16px', padding: '1.5rem', marginBottom: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>
                {reto?.tipo === 'diario' ? '⚡' : reto?.tipo === 'semanal' ? '🏆' : '🎯'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: TEXT_PRIMARY, marginBottom: '4px' }}>
                {tipoLabel[reto?.tipo]}
              </div>
              {reto?.tema && (
                <div style={{ fontSize: '12px', color: TEXT_SECONDARY, marginBottom: '4px' }}>
                  Tema: {reto.tema.titulo}
                </div>
              )}
              <div style={{ fontSize: '13px', color: TEXT_MUTED, marginBottom: '1.25rem' }}>
                {preguntas.length} preguntas · Nivel {reto?.nivelRequerido}
              </div>

              {reto?.participaciones?.length > 0 && (
                <div style={{ background: BG_APP, borderRadius: '12px', padding: '10px', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '11px', color: TEXT_MUTED, marginBottom: '6px' }}>Participantes</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {reto.participaciones.map((p: any) => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: '#374151' }}>
                          {p.usuario?.nick ?? p.usuario?.nombre ?? 'Usuario'}
                          {p.usuario?.id === (usuario as any)?.id && ' (tú)'}
                        </span>
                        {p.completado
                          ? <CheckCircle size={14} color="#15803d" />
                          : <span style={{ color: TEXT_MUTED, fontSize: '11px' }}>Pendiente</span>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {yaCompleto ? (
                <div>
                  <div style={{ fontSize: '13px', color: '#15803d', fontWeight: 600, marginBottom: '8px' }}>
                    ✓ Ya completaste este reto — {miParticipacion?.porcentaje}% acierto
                  </div>
                  <button
                    onClick={() => setEstado('resultado')}
                    style={{ width: '100%', padding: '12px', background: '#111827', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Ver resultado y ranking
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setEstado('jugando'); setTiempoInicio(Date.now()); }}
                  style={{ width: '100%', padding: '13px', background: '#111827', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  ▶ Empezar reto
                </button>
              )}
            </div>
          </div>
        )}

        {/* JUGANDO */}
        {estado === 'jugando' && pregunta && (
          <div>
            <div style={{ height: '4px', background: 'rgba(0,0,0,0.06)', borderRadius: '2px', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ width: `${((preguntaActual + (respondida ? 1 : 0)) / preguntas.length) * 100}%`, height: '100%', background: '#3b82f6', borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>

            <div style={{ fontSize: '15px', fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {pregunta.enunciado}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
            {pregunta.opciones?.map((opcion: string, idx: number) => (
              <button
                key={idx}
                onClick={() => seleccionarYSiguiente(idx)}
                style={{
                  padding: '12px 14px', borderRadius: '12px',
                  border: seleccionada === idx ? '1.5px solid #3b82f6' : '1.5px solid #e5e7eb',
                  background: seleccionada === idx ? '#eff6ff' : 'white',
                  color: '#111827', fontSize: '13px', textAlign: 'left', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}
              >
                <span style={{ fontWeight: 700, minWidth: '20px' }}>{['A', 'B', 'C', 'D'][idx]}</span>
                <span style={{ flex: 1 }}>{opcion}</span>
              </button>
            ))}
          </div>

         </div>
        )}

        {/* RESULTADO */}
        {estado === 'resultado' && (
          <div>
            <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                🏆 Resultado
              </div>
              <div style={{ fontSize: '44px', fontWeight: 800, color: TEXT_PRIMARY }}>
                {yaCompleto ? miParticipacion?.porcentaje : porcentaje}%
              </div>
            </div>

            {/* Estadísticas rápidas */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: '#15803d' }}>✔️ {correctas} aciertos</span>
              <span style={{ fontSize: '13px', color: '#dc2626' }}>❌ {preguntas.length - correctas} errores</span>
              <span style={{ fontSize: '13px', color: TEXT_MUTED }}>⏱️ {Math.round((Date.now() - tiempoInicio) / 1000)}s</span>
            </div>

            {/* Duelo */}
            <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: '14px', padding: '16px', marginBottom: '10px' }}>
              <DueloReto reto={{ ...reto, participaciones: reto.participaciones }} usuarioActual={usuario} />
            </div>

            {/* Desglose de preguntas */}
            {respuestas.length > 0 && (
              <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: '14px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY }}>Desglose de preguntas</div>
                </div>
                {respuestas.map((r, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderBottom: i < respuestas.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px' }}>{r.esCorrecta ? '✅' : '❌'}</span>
                      <span style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>{r.enunciado}</span>
                    </div>
                    {!r.esCorrecta && (
                      <div style={{ fontSize: '11px', color: '#15803d', marginLeft: '20px', marginBottom: '2px' }}>
                        Correcta: {r.opciones[r.correcta]}
                      </div>
                    )}
                    {r.explicacion && (
                      <div style={{ fontSize: '11px', color: TEXT_MUTED, marginLeft: '20px', lineHeight: 1.5 }}>{r.explicacion}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Botones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {miParticipacion?.posicion > 1 && reto?.tipo === 'usuario' && (
                <button
                  onClick={async () => {
                    const oponente = reto.participaciones.find((p: any) => p.usuario?.id !== (usuario as any)?.id);
                    if (oponente) {
                      try {
                        const res = await api.post('/retos/usuario', {
                          retadoNickOEmail: oponente.usuario?.nick ?? oponente.usuario?.email,
                          oposicionId: reto.oposicion?.id,
                          numPreguntas: reto.preguntas?.length ?? 10,
                        });
                        router.push(`/app/retos/${res.data.id}`);
                      } catch (e) {
                        alert('Error enviando revancha');
                      }
                    }
                  }}
                  style={{ width: '100%', padding: '13px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  🔥 Pedir revancha
                </button>
              )}
              <button onClick={() => router.push('/app/retos')} style={{ width: '100%', padding: '13px', background: '#111827', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                Volver a retos
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
} 