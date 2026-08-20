'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

type EstadoRepaso = 'pregunta' | 'respuesta' | 'fin';

const BG_APP = '#FDF4FE';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';
const COLOR_FC = '#9333EA';

export default function RepasarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oposicionId = searchParams.get('oposicionId') ?? '';
  const numFlashcards = Number(searchParams.get('n')) || 10;
  const { usuario, cargando } = useAuth();
  const queryClient = useQueryClient();
  const temaId = searchParams.get('temaId');
  const [indice, setIndice] = useState(0);
  const [estado, setEstado] = useState<EstadoRepaso>('pregunta');
  const [respuestaVF, setRespuestaVF] = useState<boolean | null>(null);
  const [tiempoInicio, setTiempoInicio] = useState(Date.now());
  const [resultados, setResultados] = useState<{ id: string; calificacion: number }[]>([]);
  const numeroTema = searchParams.get('numeroTema');

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  const { data: flashcards = [], isLoading } = useQuery({
    queryKey: ['fc-repaso', oposicionId, temaId, numFlashcards],
    queryFn: async () => {
      if (temaId) {
        const res = await api.get(`/flashcards/tema/${temaId}`);
        return res.data;
      }
      const res = await api.get(`/flashcards/pendientes/${oposicionId}?limite=${numFlashcards}`);
      return res.data;
    },
    enabled: !!(oposicionId || temaId) && !!usuario,
  });

  const registrar = useMutation({
    mutationFn: async ({ flashcardId, calificacion, tiempoMs }: any) => {
      await api.post('/flashcards/respuesta', { flashcardId, calificacion, tiempoMs });
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
    await registrar.mutateAsync({ flashcardId: fc.id, calificacion, tiempoMs });
    setResultados(prev => [...prev, { id: fc.id, calificacion }]);

    if (indice + 1 >= flashcards.length) {
      setEstado('fin');
    } else {
      setIndice(i => i + 1);
      setEstado('pregunta');
      setRespuestaVF(null);
      setTiempoInicio(Date.now());
    }
  };

  const volver = () => {
    if (temaId && oposicionId && numeroTema) {
      router.push(`/app/tema/${oposicionId}/${numeroTema}`);
    } else {
      router.push('/app/flashcards');
    }
  };

  const TIPO_LABEL: Record<string, string> = {
    vf: 'Verdadero / Falso',
    hueco: 'Completa el hueco',
    trampa: 'Detecta la trampa',
    articulo: '¿Qué artículo es?',
  };

  const NIVEL_COLOR: Record<string, string> = {
    basico: '#15803d',
    medio: '#d97706',
    alto: '#dc2626',
  };

  if (cargando || isLoading) return null;

  if (flashcards.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG_APP, padding: '1.5rem' }}>
        <div style={{ textAlign: 'center', background: 'white', borderRadius: 20, padding: '2.5rem 2rem', maxWidth: 360, width: '100%' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>
            {temaId ? '📚' : '✅'}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>
            {temaId ? 'Sin flashcards' : '¡Todo al día!'}
          </div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 20 }}>
            {temaId
              ? 'Este tema no tiene flashcards disponibles todavía'
              : 'No tienes flashcards pendientes de repasar'}
          </div>
          <button
            onClick={volver}
            style={{ width: '100%', padding: 13, background: '#111827', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            {temaId ? 'Volver al tema' : 'Volver'}
          </button>
        </div>
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
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: TEXT_SECONDARY, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={14} />
            {temaId ? 'Tema' : 'Flashcards'}
          </button>
          {estado !== 'fin' && (
            <span style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 600 }}>{indice + 1} / {flashcards.length}</span>
          )}
        </div>

        {/* FIN */}
        {estado === 'fin' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>¡Repaso completado!</div>
            <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 20 }}>
              {resultados.length} flashcards repasadas
            </div>

            <div style={{ background: 'white', borderRadius: 16, padding: '1.25rem', marginBottom: 16, textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Resumen
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: 'Fácil', value: sabidas, color: '#15803d', bg: '#f0fdf4' },
                  { label: 'Bien', value: bien, color: '#2563eb', bg: '#eff6ff' },
                  { label: 'Difícil', value: dificil, color: '#d97706', bg: '#fffbeb' },
                  { label: 'Nada', value: falladas, color: '#dc2626', bg: '#fef2f2' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '10px 6px', background: bg, borderRadius: 12 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
                    <div style={{ fontSize: 10, color, marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, padding: '10px 12px', background: '#FAF5FB', borderRadius: 12, fontSize: 12, color: TEXT_SECONDARY }}>
                💡 Las tarjetas difíciles o falladas aparecerán antes en tu próximo repaso
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => {
                  setIndice(0);
                  setEstado('pregunta');
                  setResultados([]);
                  setTiempoInicio(Date.now());
                  queryClient.invalidateQueries({ queryKey: ['pendientes-fc'] });
                  queryClient.invalidateQueries({ queryKey: ['stats-fc'] });
                }}
                style={{ width: '100%', padding: 13, background: '#111827', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                Repasar de nuevo
              </button>
              <button
                onClick={volver}
                style={{ width: '100%', padding: 13, background: 'white', color: TEXT_SECONDARY, border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {temaId ? 'Volver al tema' : 'Volver a flashcards'}
              </button>
            </div>
          </div>
        )}

        {/* TARJETA */}
        {estado !== 'fin' && fc && (
          <div>
            <div style={{ height: 4, background: '#EEDCF0', borderRadius: 2, overflow: 'hidden', marginBottom: 18 }}>
              <div style={{
                width: `${((indice + 1) / flashcards.length) * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${COLOR_FC}, #C084FC)`,
                borderRadius: 2,
                transition: 'width 0.3s',
              }} />
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#F3E8FF', color: COLOR_FC, fontWeight: 500 }}>
                {TIPO_LABEL[fc.tipo] ?? fc.tipo}
              </span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'white', color: NIVEL_COLOR[fc.nivel] ?? TEXT_SECONDARY, fontWeight: 500 }}>
                {fc.nivel}
              </span>
              {fc.articulo && (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#E6F1FB', color: '#185FA5', fontWeight: 500 }}>
                  Art. {fc.articulo.numero}
                </span>
              )}
            </div>

            <div style={{
              background: 'white',
              border: estado === 'respuesta' ? `2px solid ${COLOR_FC}` : '1px solid #F1F5F9',
              borderRadius: 18,
              padding: '1.5rem',
              marginBottom: 16,
              minHeight: 180,
              transition: 'border-color 0.3s',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Pregunta
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.7, marginBottom: estado === 'respuesta' ? '1rem' : 0 }}>
                {fc.pregunta}
              </div>

              {estado === 'respuesta' && (
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: COLOR_FC, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                    Respuesta
                  </div>
                  <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6, fontWeight: 500 }}>
                    {fc.tipo === 'vf'
                      ? (fc.respuesta === 'true' ? '✅ Verdadero' : '❌ Falso')
                      : fc.respuesta}
                  </div>
                  {fc.explicacion && (
                    <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 10, lineHeight: 1.6, background: '#FAF5FB', borderRadius: 10, padding: '8px 10px' }}>
                      💡 {fc.explicacion}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Controles VF — pregunta */}
            {estado === 'pregunta' && fc.tipo === 'vf' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => handleVF(true)}
                  style={{ flex: 1, padding: 14, background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 14, fontSize: 15, fontWeight: 700, color: '#15803d', cursor: 'pointer' }}
                >
                  ✅ Verdadero
                </button>
                <button
                  onClick={() => handleVF(false)}
                  style={{ flex: 1, padding: 14, background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: 14, fontSize: 15, fontWeight: 700, color: '#dc2626', cursor: 'pointer' }}
                >
                  ❌ Falso
                </button>
              </div>
            )}

            {/* Controles no VF — pregunta */}
            {estado === 'pregunta' && fc.tipo !== 'vf' && (
              <button
                onClick={handleVerRespuesta}
                style={{ width: '100%', padding: 14, background: '#111827', color: 'white', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                Ver respuesta
              </button>
            )}

            {/* VF — resultado tras ver respuesta */}
            {estado === 'respuesta' && fc.tipo === 'vf' && (
              <div>
                <div style={{
                  background: respuestaVF === (fc.respuesta === 'true') ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${respuestaVF === (fc.respuesta === 'true') ? '#86efac' : '#fca5a5'}`,
                  borderRadius: 12, padding: '10px 14px', marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 16 }}>
                    {respuestaVF === (fc.respuesta === 'true') ? '✅' : '❌'}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: respuestaVF === (fc.respuesta === 'true') ? '#15803d' : '#dc2626' }}>
                    {respuestaVF === (fc.respuesta === 'true') ? '¡Correcto!' : 'Incorrecto'}
                  </span>
                </div>
                <button
                  onClick={() => handleResultado(respuestaVF === (fc.respuesta === 'true') ? 4 : 1)}
                  style={{ width: '100%', padding: 12, background: '#111827', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Siguiente →
                </button>
              </div>
            )}

            {/* No VF — calificación SM-2 */}
            {estado === 'respuesta' && fc.tipo !== 'vf' && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: TEXT_SECONDARY, marginBottom: 10, textAlign: 'center' }}>
                  ¿Cómo te ha ido?
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {[
                    { cal: 0, label: 'Nada', sub: 'Hoy', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
                    { cal: 2, label: 'Difícil', sub: '1 día', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                    { cal: 3, label: 'Bien', sub: 'Varios días', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
                    { cal: 5, label: 'Fácil', sub: 'Semanas', color: '#15803d', bg: '#f0fdf4', border: '#86efac' },
                  ].map(({ cal, label, sub, color, bg, border }) => (
                    <button
                      key={cal}
                      onClick={() => handleResultado(cal)}
                      style={{
                        padding: '12px 4px', borderRadius: 14,
                        background: bg, border: `1.5px solid ${border}`,
                        cursor: 'pointer', textAlign: 'center',
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
                      <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 3 }}>{sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}