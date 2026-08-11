'use client';

import { useState } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { RotateCcw, Share2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { FooterNavegacion } from '@/app/app/dashboard/page';

export default function ResultadoTestPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { usuario } = useAuth();
  const oposicionId = params.id as string;
  const modo = searchParams.get('modo');

  const [preguntaExpandida, setPreguntaExpandida] = useState<number | null>(null);

  const { data: resultado, isLoading } = useQuery({
    queryKey: ['ultimo-resultado'],
    queryFn: async () => {
      const res = await api.get('/test/ultimo-resultado');
      return res.data;
    },
    enabled: !!usuario,
  });

  const compartir = async () => {
    const texto = `🎯 Acabo de hacer un test en Oplora y he obtenido un ${resultado?.porcentaje}% de aciertos (${resultado?.correctas}/${resultado?.totalPreguntas} correctas). ¡A por la plaza!`;
    if (navigator.share) {
      await navigator.share({ title: 'Mi resultado en Oplora', text: texto });
    } else {
      await navigator.clipboard.writeText(texto);
      alert('Resultado copiado al portapapeles');
    }
  };

  if (isLoading || !resultado) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f9fafb' }}>
        <div style={{ fontSize: '13px', color: '#9ca3af' }}>Cargando resultado...</div>
      </div>
    );
  }

  const tiempoMinutos = Math.floor(resultado.tiempoSegundos / 60);
  const tiempoSegundos = resultado.tiempoSegundos % 60;
  const tiempoMedioPregunta = resultado.totalPreguntas > 0
    ? Math.round(resultado.tiempoSegundos / resultado.totalPreguntas)
    : 0;

  const blancos = resultado.blancos ?? 0;
  const hayBlancos = blancos > 0;

  const getColorPorcentaje = (p: number) => {
    if (p >= 80) return { color: '#15803d', bg: '#f0fdf4', border: '#86efac' };
    if (p >= 60) return { color: '#1F7CFF', bg: '#eff6ff', border: '#bfdbfe' };
    if (p >= 40) return { color: '#d97706', bg: '#fffbeb', border: '#fcd34d' };
    return { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
  };

  const colores = getColorPorcentaje(resultado.porcentaje);

  const getColorDetalle = (detalle: any) => {
    if (detalle.enBlanco) return { bg: '#f8fafc', circle: '#94a3b8', simbolo: '⬜', color: '#64748b' };
    if (detalle.correcta) return { bg: '#f0fdf4', circle: '#15803d', simbolo: '✓', color: '#15803d' };
    return { bg: '#fef2f2', circle: '#dc2626', simbolo: '✗', color: '#dc2626' };
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: '90px' }}>

      {/* HERO */}
      <div style={{ background: '#0f172a', padding: '2rem 1.25rem 1.5rem' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
            Resultado del test
          </div>

          <div style={{
            width: '120px', height: '120px', borderRadius: '50%',
            background: colores.bg, border: `4px solid ${colores.border}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: colores.color, lineHeight: 1 }}>
              {resultado.porcentaje}%
            </span>
            <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>acierto</span>
          </div>

          <div style={{ fontSize: '22px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
            {resultado.porcentaje >= 80 ? '🏆 Excelente' :
             resultado.porcentaje >= 60 ? '👍 Bien hecho' :
             resultado.porcentaje >= 40 ? '💪 Sigue practicando' :
             '📚 A repasar'}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            {resultado.correctas} correctas · {resultado.falladas} falladas
            {hayBlancos && ` · ${blancos} en blanco`}
            {' · '}{resultado.totalPreguntas} preguntas
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Stats — 4 columnas si hay blancos, 3 si no */}
        <div style={{ display: 'grid', gridTemplateColumns: hayBlancos ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { label: 'Correctas', value: resultado.correctas, color: '#15803d', bg: '#f0fdf4' },
            { label: 'Falladas', value: resultado.falladas, color: '#dc2626', bg: '#fef2f2' },
            ...(hayBlancos ? [{ label: 'En blanco', value: blancos, color: '#64748b', bg: '#f8fafc' }] : []),
            { label: 'Tiempo', value: `${tiempoMinutos}m ${tiempoSegundos}s`, color: '#1F7CFF', bg: '#eff6ff' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: '12px', padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: hayBlancos ? '18px' : '20px', fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tiempo medio por pregunta */}
        <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Tiempo medio por pregunta</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              {tiempoMedioPregunta < 30 ? 'Muy rápido' : tiempoMedioPregunta < 60 ? 'Buen ritmo' : 'Tómate tu tiempo'}
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1F7CFF' }}>
            {tiempoMedioPregunta}s
          </div>
        </div>

        {/* Comparativa histórica */}
        <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '14px 16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
            Tu historial
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Este test', value: resultado.porcentaje, color: colores.color },
              { label: 'Tu media', value: resultado.mediaAcierto, color: '#6b7280' },
              { label: 'Tu mejor', value: resultado.mejorResultado, color: '#15803d' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '80px', fontSize: '12px', color: '#6b7280', flexShrink: 0 }}>{label}</div>
                <div style={{ flex: 1, height: '8px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.5s' }} />
                </div>
                <div style={{ width: '36px', fontSize: '12px', fontWeight: 600, color, textAlign: 'right' }}>{value}%</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '10px' }}>
            Basado en tus últimos {resultado.totalTestsRealizados} tests
          </div>
        </div>

        {/* Desglose preguntas */}
        {resultado.detallePreguntas?.length > 0 && (
          <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Desglose de preguntas</div>
            </div>
            {resultado.detallePreguntas.map((detalle: any, i: number) => {
              const estilo = getColorDetalle(detalle);
              return (
                <div key={i} style={{
                  borderBottom: i < resultado.detallePreguntas.length - 1 ? '1px solid #f3f4f6' : 'none',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <div
                    onClick={() => setPreguntaExpandida(preguntaExpandida === i ? null : i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '11px 16px',
                      background: estilo.bg,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                      background: estilo.circle,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', color: 'white', fontWeight: 700,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '12px', color: '#374151', lineHeight: 1.4,
                        overflow: preguntaExpandida === i ? 'visible' : 'hidden',
                        textOverflow: preguntaExpandida === i ? 'unset' : 'ellipsis',
                        whiteSpace: preguntaExpandida === i ? 'normal' : 'nowrap',
                      }}>
                        {detalle.enunciado}
                      </div>
                      {detalle.enBlanco && (
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Dejada en blanco</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: estilo.color }}>
                        {estilo.simbolo}
                      </span>
                      {preguntaExpandida === i
                        ? <ChevronUp size={13} color="#9ca3af" />
                        : <ChevronDown size={13} color="#9ca3af" />
                      }
                    </div>
                  </div>

                  {preguntaExpandida === i && (
                    <div style={{ padding: '12px 16px', background: 'white', borderTop: '1px solid #f3f4f6' }}>
                      {detalle.enBlanco ? (
                        <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '10px' }}>
                          Esta pregunta fue dejada en blanco
                        </div>
                      ) : null}

                      {detalle.opciones && detalle.indiceCorrecta !== undefined && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                            Respuesta correcta
                          </div>
                          <div style={{ fontSize: '12px', color: '#15803d', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '8px 10px', fontWeight: 500 }}>
                            {detalle.opciones[detalle.indiceCorrecta]}
                          </div>
                          {!detalle.correcta && !detalle.enBlanco && detalle.indiceSeleccionada !== undefined && detalle.indiceSeleccionada !== null && (
                            <div style={{ fontSize: '12px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 10px', fontWeight: 500, marginTop: '4px' }}>
                              Tu respuesta: {detalle.opciones[detalle.indiceSeleccionada]}
                            </div>
                          )}
                        </div>
                      )}

                      {detalle.explicacion ? (
                        <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.6, background: '#f9fafb', padding: '10px 12px', borderRadius: '8px' }}>
                          <strong style={{ color: '#374151' }}>Explicación:</strong> {detalle.explicacion}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
                          Sin explicación disponible
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {/* Acciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
        {modo === 'primer_reto' ? (
          <button
            onClick={() => router.push('/app/entrenamiento?step=flashcards')}
            style={{ width: '100%', padding: '14px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
          >
            Continuar con las flashcards de OPLORA →
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => router.push(`/app/test/${oposicionId}?modo=${modo ?? 'rapido'}`)}
              style={{ flex: 1, padding: '13px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <RotateCcw size={15} />
              Repetir
            </button>

            <button
              onClick={compartir}
              style={{ flex: 1, padding: '13px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#374151' }}
            >
              <Share2 size={15} />
              Compartir
            </button>

            <button
              onClick={() => router.push('/app/entrenamiento')}
              style={{ flex: 1, padding: '13px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#374151' }}
            >
              <X size={15} />
              Cerrar
            </button>
          </div>
        )}
      </div>

      </div>

      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} />
    </div>
  );
}