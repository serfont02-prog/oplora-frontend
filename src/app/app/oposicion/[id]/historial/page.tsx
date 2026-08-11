'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, ExternalLink, ChevronDown, ChevronUp, BookOpen, Settings, FileText } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { FooterNavegacion } from '@/app/app/dashboard/page';

const TIPO_LABEL: Record<string, string> = {
  test: 'Test',
  desarrollo: 'Desarrollo',
  oral: 'Oral',
  practico: 'Práctico',
  mixto: 'Mixto',
};

const ESTADO_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  activa:   { bg: '#DCFCE7', color: '#16A34A', label: 'Abierta' },
  cerrada:  { bg: '#f3f4f6', color: '#6b7280', label: 'Cerrada' },
  borrador: { bg: '#fffbeb', color: '#92400e', label: 'Borrador' },
};

export default function HistorialPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { usuario } = useAuth();

  const [expandida, setExpandida] = useState<string | null>(null);
  const [modalCaracteristicas, setModalCaracteristicas] = useState<any>(null);
  const [modalTemario, setModalTemario] = useState<any>(null);
  const [temasConvocatoria, setTemasConvocatoria] = useState<any[]>([]);
  const [cargandoTemas, setCargandoTemas] = useState(false);

  const { data: oposicion } = useQuery({
    queryKey: ['oposicion', id],
    queryFn: async () => {
      const res = await api.get(`/oposiciones/${id}`);
      return res.data;
    },
    enabled: !!usuario,
  });

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias-historial', id],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${id}`);
      return res.data;
    },
    enabled: !!usuario,
  });

  const verTemario = async (convocatoriaId: string, convocatoria: any) => {
    setCargandoTemas(true);
    setModalTemario(convocatoria);
    try {
      const res = await api.get(`/temas/convocatoria/${convocatoriaId}`);
      setTemasConvocatoria(res.data);
    } finally {
      setCargandoTemas(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: '90px' }}>

      {/* ── HEADER STICKY ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'white', borderBottom: '1px solid #f3f4f6',
        padding: '0 1rem', height: '48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          Volver
        </button>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
          Convocatorias
        </span>
        <span style={{ width: '56px' }} />
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* ── HERO OPOSICIÓN ── */}
        <div style={{
          background: '#0f172a', borderRadius: '16px',
          padding: '18px 16px', color: 'white',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Historial de convocatorias
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.3 }}>
            {oposicion?.nombre ?? '—'}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {oposicion?.subgrupo && (
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 9px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                {oposicion.subgrupo}
              </span>
            )}
            {oposicion?.administracion && (
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 9px', borderRadius: '999px', background: 'rgba(31,124,255,0.2)', color: '#60a5fa' }}>
                {oposicion.administracion}
              </span>
            )}
            {oposicion?.ministerio && (
              <span style={{ fontSize: '10px', color: '#64748b' }}>{oposicion.ministerio}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#1F7CFF' }}>{convocatorias.length}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>convocatoria{convocatorias.length !== 1 ? 's' : ''} registrada{convocatorias.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* ── LISTA CONVOCATORIAS ── */}
        {convocatorias.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>📄</div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '4px' }}>Sin convocatorias</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>No hay convocatorias registradas para esta oposición</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {convocatorias.map((c: any) => {
              const badge = ESTADO_BADGE[c.estado] ?? ESTADO_BADGE.cerrada;
              const abierta = expandida === c.id;

              return (
                <div
                  key={c.id}
                  style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', overflow: 'hidden' }}
                >
                  {/* Cabecera */}
                  <button
                    onClick={() => setExpandida(abierta ? null : c.id)}
                    style={{
                      width: '100%', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '12px',
                        background: '#f9fafb', border: '1px solid #f3f4f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '14px', fontWeight: 800, color: '#111827',
                      }}>
                        {c.anyo}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '11px', fontWeight: 600,
                              padding: '2px 8px', borderRadius: '999px',
                              background: badge.bg, color: badge.color,
                            }}
                          >
                            {badge.label}
                          </span>
                          {c.plazas && (
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>
                              {c.plazas.toLocaleString()} plazas
                            </span>
                          )}
                        </div>
                        {c.fechaExamen && (
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>
                            Examen: {new Date(c.fechaExamen).toLocaleDateString('es-ES')}
                          </div>
                        )}
                      </div>
                    </div>
                    {abierta
                      ? <ChevronUp size={15} color="#9ca3af" style={{ flexShrink: 0 }} />
                      : <ChevronDown size={15} color="#9ca3af" style={{ flexShrink: 0 }} />
                    }
                  </button>

                  {/* Detalles expandidos */}
                  {abierta && (
                    <div style={{ borderTop: '1px solid #f3f4f6', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                      {/* Referencias */}
                      {(c.referenciaBoe || c.fechaExamen) && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {c.referenciaBoe && (
                            <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '999px', background: '#f3f4f6', color: '#6b7280' }}>
                              📄 {c.referenciaBoe}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Enlace INAP */}
                      {c.urlInap && (
                        <button
                          onClick={() => window.open(c.urlInap, '_blank')}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#1F7CFF', background: 'none', border: 'none', cursor: 'pointer', padding: 0, alignSelf: 'flex-start' }}
                        >
                          <ExternalLink size={12} />
                          Ver en INAP
                        </button>
                      )}

                      {/* Acciones */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        <button
                          onClick={() => verTemario(c.id, c)}
                          style={{
                            padding: '10px 6px', borderRadius: '10px',
                            border: '1px solid #EFF6FF', background: '#EFF6FF',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          <BookOpen size={14} color="#185FA5" />
                          <span style={{ fontSize: '11px', fontWeight: 500, color: '#185FA5' }}>Temario</span>
                        </button>

                        <button
                          onClick={() => setModalCaracteristicas(c)}
                          style={{
                            padding: '10px 6px', borderRadius: '10px',
                            border: '1px solid #f3f4f6', background: '#f9fafb',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          <Settings size={14} color="#374151" />
                          <span style={{ fontSize: '11px', fontWeight: 500, color: '#374151' }}>Características</span>
                        </button>

                        <button
                          onClick={() => router.push(`/app/oposicion/${id}/examenes?convocatoriaId=${c.id}`)}
                          style={{
                            padding: '10px 6px', borderRadius: '10px',
                            border: '1px solid #EEEDFE', background: '#EEEDFE',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          <FileText size={14} color="#3C3489" />
                          <span style={{ fontSize: '11px', fontWeight: 500, color: '#3C3489' }}>Exámenes</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL CARACTERÍSTICAS (bottom sheet) ── */}
      {modalCaracteristicas && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setModalCaracteristicas(null)}
        >
          <div
            style={{ background: 'white', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%', maxWidth: '560px', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Características</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>Convocatoria {modalCaracteristicas.anyo}</div>
              </div>
              <button onClick={() => setModalCaracteristicas(null)} style={{ background: '#f3f4f6', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '16px', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { label: 'Plazas', value: modalCaracteristicas.plazas ? modalCaracteristicas.plazas.toLocaleString() : null },
                { label: 'Tipo de ejercicio', value: modalCaracteristicas.tipoEjercicio ? TIPO_LABEL[modalCaracteristicas.tipoEjercicio] ?? modalCaracteristicas.tipoEjercicio : null },
                { label: 'Nº de ejercicios', value: modalCaracteristicas.numEjercicios },
                { label: 'Preguntas por ejercicio', value: modalCaracteristicas.numPreguntas },
                { label: 'Tiempo', value: modalCaracteristicas.tiempoMinutos ? `${modalCaracteristicas.tiempoMinutos} min` : null },
                { label: 'Penalización', value: modalCaracteristicas.penalizacion !== undefined ? (modalCaracteristicas.penalizacion ? `Sí · ${modalCaracteristicas.fraccionPenalizacion ?? ''}` : 'No') : null },
                { label: 'Nota mínima', value: modalCaracteristicas.notaMinimaAprobado ? `${modalCaracteristicas.notaMinimaAprobado} pts` : null },
                { label: 'Fecha de examen', value: modalCaracteristicas.fechaExamen ? new Date(modalCaracteristicas.fechaExamen).toLocaleDateString('es-ES') : null },
                { label: 'Referencia BOE', value: modalCaracteristicas.referenciaBoe },
              ].filter(({ value }) => value !== null && value !== undefined).map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f9fafb', borderRadius: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>{value}</span>
                </div>
              ))}
            </div>

            {modalCaracteristicas.urlInap && (
              <button
                onClick={() => window.open(modalCaracteristicas.urlInap, '_blank')}
                style={{ width: '100%', marginTop: '14px', padding: '12px', background: '#EFF6FF', border: 'none', borderRadius: '12px', fontSize: '13px', color: '#185FA5', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <ExternalLink size={13} />
                Ver en INAP
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL TEMARIO ── */}
      {modalTemario && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}
          onClick={() => { setModalTemario(null); setTemasConvocatoria([]); }}
        >
          <div
            style={{ background: 'white', borderRadius: '18px', width: '100%', maxWidth: '520px', maxHeight: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera modal */}
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Temario oficial</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>Convocatoria {modalTemario.anyo} · {temasConvocatoria.length} temas</div>
              </div>
              <button
                onClick={() => { setModalTemario(null); setTemasConvocatoria([]); }}
                style={{ background: '#f3f4f6', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '16px', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>

            {/* Lista temas */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '12px' }}>
              {cargandoTemas ? (
                <div style={{ textAlign: 'center', padding: '2rem', fontSize: '13px', color: '#9ca3af' }}>Cargando temario...</div>
              ) : temasConvocatoria.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', fontSize: '13px', color: '#9ca3af' }}>No hay temas registrados</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {temasConvocatoria.map((tema: any) => (
                    <div
                      key={tema.id}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', background: '#f9fafb', borderRadius: '10px' }}
                    >
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        background: '#EFF6FF', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 700, color: '#185FA5',
                      }}>
                        {tema.numero}
                      </div>
                      <div style={{ fontSize: '13px', color: '#111827', lineHeight: 1.4, paddingTop: '5px' }}>
                        {tema.titulo}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <FooterNavegacion usuario={usuario} oposicionId={id} />

    </div>
  );
}
