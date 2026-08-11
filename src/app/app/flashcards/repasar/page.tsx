'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

type EstadoRepaso = 'pregunta' | 'respuesta' | 'fin';

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>
          {temaId ? '📚' : '✅'}
        </div>
        <div style={{ fontSize: '15px', fontWeight: 500, color: '#111827', marginBottom: '6px' }}>
          {temaId ? 'Sin flashcards' : '¡Todo al día!'}
        </div>
        <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '1.5rem' }}>
          {temaId
            ? 'Este tema no tiene flashcards disponibles todavía'
            : 'No tienes flashcards pendientes de repasar'}
        </div>
        <button
          onClick={() => {
            if (temaId && oposicionId && numeroTema) {
              router.push(`/app/tema/${oposicionId}/${numeroTema}`);
            } else {
              router.push('/app/flashcards');
            }
          }}
          style={{ padding: '10px 20px', background: '#111827', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}
        >
          {temaId ? 'Volver al tema' : 'Volver'}
        </button>
      </div>
    </div>
  );
}

  // Resumen final
  const sabidas = resultados.filter(r => r.calificacion >= 4).length;
  const bien = resultados.filter(r => r.calificacion === 3).length;
  const dificil = resultados.filter(r => r.calificacion === 2).length;
  const falladas = resultados.filter(r => r.calificacion < 2).length;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: '20px' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '0 1.25rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <button
          onClick={() => {
              if (temaId && oposicionId && numeroTema) {
                router.push(`/app/tema/${oposicionId}/${numeroTema}`);
              } else {
                router.push('/app/flashcards');
              }
            }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          {temaId ? 'Tema' : 'Flashcards'}
        </button>
        {estado !== 'fin' && (
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{indice + 1} / {flashcards.length}</span>
        )}
        {/* ⭐ título según modo */}
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
          {temaId ? 'Por tema' : 'Pendientes'}
        </span>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.25rem' }}>

        {/* FIN */}
        {estado === 'fin' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>¡Repaso completado!</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '1.5rem' }}>
              {resultados.length} flashcards repasadas
            </div>

            {/* Resumen SM-2 */}
            <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Resumen
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[
                  { label: 'Fácil', value: sabidas, color: '#15803d', bg: '#f0fdf4' },
                  { label: 'Bien', value: bien, color: '#2563eb', bg: '#eff6ff' },
                  { label: 'Difícil', value: dificil, color: '#d97706', bg: '#fffbeb' },
                  { label: 'Nada', value: falladas, color: '#dc2626', bg: '#fef2f2' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '10px 6px', background: bg, borderRadius: '10px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color }}>{value}</div>
                    <div style={{ fontSize: '10px', color, marginTop: '2px' }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '12px', padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', fontSize: '12px', color: '#6b7280' }}>
                💡 Las tarjetas difíciles o falladas aparecerán antes en tu próximo repaso
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => {
                  setIndice(0);
                  setEstado('pregunta');
                  setResultados([]);
                  setTiempoInicio(Date.now());
                  queryClient.invalidateQueries({ queryKey: ['pendientes-fc-repaso'] });
                }}
                style={{ width: '100%', padding: '12px', background: '#111827', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              >
                Repasar de nuevo
              </button>
              <button
                onClick={() => {
                  if (temaId && oposicionId && numeroTema) {
                    router.push(`/app/tema/${oposicionId}/${numeroTema}`);
                  } else {
                    router.push('/app/flashcards');
                  }
                }}
                style={{ width: '100%', padding: '12px', background: 'white', color: '#6b7280', border: '1px solid #f3f4f6', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}
              >
                {temaId ? 'Volver al tema' : 'Volver a flashcards'}
              </button>
            </div>
          </div>
        )}

        {/* TARJETA */}
        {estado !== 'fin' && fc && (
          <div>
            {/* Barra progreso */}
            <div style={{ height: '4px', background: '#f3f4f6', borderRadius: '2px', overflow: 'hidden', marginBottom: '1.25rem' }}>
              <div style={{
                width: `${((indice + 1) / flashcards.length) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #1F7CFF, #60a5fa)',
                borderRadius: '2px',
                transition: 'width 0.3s',
              }} />
            </div>

            {/* Tipo y nivel */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#f3f4f6', color: '#6b7280' }}>
                {TIPO_LABEL[fc.tipo] ?? fc.tipo}
              </span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'white', color: NIVEL_COLOR[fc.nivel] ?? '#6b7280', border: `1px solid ${NIVEL_COLOR[fc.nivel] ?? '#e5e7eb'}`, fontWeight: 500 }}>
                {fc.nivel}
              </span>
              {fc.articulo && (
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#eff6ff', color: '#185FA5' }}>
                  Art. {fc.articulo.numero}
                </span>
              )}
            </div>

            {/* Tarjeta con animación de volteo */}
            <div style={{
              background: 'white',
              border: estado === 'respuesta' ? '2px solid #1F7CFF' : '1px solid #e5e7eb',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '1rem',
              minHeight: '180px',
              transition: 'border-color 0.3s',
            }}>
              {/* Pregunta siempre visible */}
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Pregunta
              </div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: '#111827', lineHeight: 1.7, marginBottom: estado === 'respuesta' ? '1rem' : '0' }}>
                {fc.pregunta}
              </div>

              {/* Respuesta — visible solo tras voltear */}
              {estado === 'respuesta' && (
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#1F7CFF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Respuesta
                  </div>
                  <div style={{ fontSize: '14px', color: '#111827', lineHeight: 1.6, fontWeight: 500 }}>
                    {fc.tipo === 'vf'
                      ? (fc.respuesta === 'true' ? '✅ Verdadero' : '❌ Falso')
                      : fc.respuesta}
                  </div>
                  {fc.explicacion && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px', lineHeight: 1.6, background: '#f9fafb', borderRadius: '8px', padding: '8px 10px' }}>
                      💡 {fc.explicacion}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Controles VF — pregunta */}
            {estado === 'pregunta' && fc.tipo === 'vf' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleVF(true)}
                  style={{ flex: 1, padding: '14px', background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '12px', fontSize: '15px', fontWeight: 600, color: '#15803d', cursor: 'pointer' }}
                >
                  ✅ Verdadero
                </button>
                <button
                  onClick={() => handleVF(false)}
                  style={{ flex: 1, padding: '14px', background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: '12px', fontSize: '15px', fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}
                >
                  ❌ Falso
                </button>
              </div>
            )}

            {/* Controles no VF — pregunta */}
            {estado === 'pregunta' && fc.tipo !== 'vf' && (
              <button
                onClick={handleVerRespuesta}
                style={{ width: '100%', padding: '14px', background: '#111827', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
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
                  borderRadius: '10px', padding: '10px 14px', marginBottom: '10px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span style={{ fontSize: '16px' }}>
                    {respuestaVF === (fc.respuesta === 'true') ? '✅' : '❌'}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: respuestaVF === (fc.respuesta === 'true') ? '#15803d' : '#dc2626' }}>
                    {respuestaVF === (fc.respuesta === 'true') ? '¡Correcto!' : 'Incorrecto'}
                  </span>
                </div>
                <button
                  onClick={() => handleResultado(respuestaVF === (fc.respuesta === 'true') ? 4 : 1)}
                  style={{ width: '100%', padding: '12px', background: '#111827', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Siguiente →
                </button>
              </div>
            )}

            {/* No VF — calificación SM-2 */}
            {estado === 'respuesta' && fc.tipo !== 'vf' && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '10px', textAlign: 'center' }}>
                  ¿Cómo te ha ido?
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
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
                        padding: '12px 4px', borderRadius: '12px',
                        background: bg, border: `1.5px solid ${border}`,
                        cursor: 'pointer', textAlign: 'center',
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 700, color }}>{label}</div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '3px' }}>{sub}</div>
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