'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';

function NivelColor(nivel: number): string {
  if (nivel >= 80) return '#15803d';
  if (nivel >= 60) return '#3b82f6';
  if (nivel >= 40) return '#d97706';
  return '#dc2626';
}

function NivelTexto(nivel: number): string {
  if (nivel >= 80) return 'Excelente';
  if (nivel >= 60) return 'Bien';
  if (nivel >= 40) return 'Mejorando';
  return 'Necesita repaso';
}

export default function ProgresoPage() {
  const router = useRouter();
  const { usuario, cargando } = useAuth();
  const [oposicionId, setOposicionId] = useState<string | null>(null);

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  const { data: oposiciones = [] } = useQuery({
    queryKey: ['oposiciones-progreso'],
    queryFn: async () => {
      const res = await api.get('/oposiciones');
      return res.data;
    },
    enabled: !!usuario,
  });

  const { data: ultimoResultado } = useQuery({
    queryKey: ['ultimo-resultado'],
    queryFn: async () => {
      const res = await api.get('/test/ultimo-resultado');
      return res.data;
    },
    enabled: !!usuario,
  });

  useEffect(() => {
    if (ultimoResultado?.oposicionId) {
      setOposicionId(ultimoResultado.oposicionId);
    } else if (oposiciones.length > 0 && !oposicionId) {
      setOposicionId(oposiciones[0].id);
    }
  }, [oposiciones, ultimoResultado, oposicionId]);

  const { data: progreso, isLoading } = useQuery({
    queryKey: ['progreso', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/test/progreso/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId,
  });

  const { data: convocatoriasProgreso = [] } = useQuery({
  queryKey: ['convocatorias-progreso', oposicionId],
  queryFn: async () => {
    const res = await api.get(`/convocatorias/oposicion/${oposicionId}`);
    return res.data;
  },
  enabled: !!oposicionId,
  });

  const convocatoriaProgreso = convocatoriasProgreso.find((c: any) => c.estado === 'activa') ?? convocatoriasProgreso[0];

  const { data: temas = [] } = useQuery({
    queryKey: ['temas-progreso', convocatoriaProgreso?.id],
    queryFn: async () => {
    const res = await api.get(`/temas/convocatoria/${convocatoriaProgreso.id}`);
    return res.data;
  },
  enabled: !!convocatoriaProgreso?.id,
});

  if (cargando) return null;

  const oposicionActual = oposiciones.find((o: any) => o.id === oposicionId);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: '72px' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '0 1.25rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <button
          onClick={() => router.push('/app/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          Inicio
        </button>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>Mi progreso</span>
        <span />
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.25rem' }}>

        {/* Selector de oposición — solo si hay más de una */}
        {oposiciones.length > 1 && (
          <select
            value={oposicionId ?? ''}
            onChange={(e) => setOposicionId(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '13px', color: '#111827', background: 'white', marginBottom: '1rem' }}
          >
            {oposiciones.map((o: any) => (
              <option key={o.id} value={o.id}>{o.nombre}</option>
            ))}
          </select>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', fontSize: '13px', color: '#9ca3af' }}>Cargando...</div>
        ) : !progreso || progreso.totalTests === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '4px' }}>Sin datos todavía</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '1.5rem' }}>Completa algunos tests para ver tu progreso</div>
            <button
              onClick={() => oposicionId && router.push(`/app/test/${oposicionId}`)}
              style={{ padding: '10px 20px', background: '#111827', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              Hacer mi primer test →
            </button>
          </div>
        ) : (
          <>
            {/* Nivel global */}
            <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '16px', padding: '1.5rem', marginBottom: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Nivel estimado · {oposicionActual?.nombre}
              </div>
              <div style={{ fontSize: '56px', fontWeight: 700, color: NivelColor(progreso.nivelEstimado), marginBottom: '4px' }}>
                {progreso.nivelEstimado}%
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                {NivelTexto(progreso.nivelEstimado)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: '#9ca3af' }}>
                {progreso.tendencia === 'subiendo' && (
                  <><TrendingUp size={14} color="#15803d" /><span style={{ color: '#15803d' }}>Tendencia positiva</span></>
                )}
                {progreso.tendencia === 'bajando' && (
                  <><TrendingDown size={14} color="#dc2626" /><span style={{ color: '#dc2626' }}>Tendencia a la baja</span></>
                )}
                {progreso.tendencia === 'estable' && (
                  <><Minus size={14} /><span>Tendencia estable</span></>
                )}
                {progreso.tendencia === 'sin_datos' && (
                  <span>Completa más tests para ver tendencia</span>
                )}
              </div>
            </div>

            {/* Métricas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
              {[
                { label: 'Tests realizados', value: progreso.totalTests },
                { label: 'Acierto medio', value: `${progreso.promedioAcierto}%` },
                { label: 'Racha actual', value: `${usuario?.rachaActual ?? 0}d` },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>{value}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Actividad últimos 30 días */}
            {progreso.porDia?.length > 0 && (
              <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '1.25rem', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#111827', marginBottom: '12px' }}>Actividad últimos 30 días</div>
                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                  {Array.from({ length: 30 }, (_, i) => {
                    const fecha = new Date();
                    fecha.setDate(fecha.getDate() - (29 - i));
                    const key = fecha.toISOString().split('T')[0];
                    const dia = progreso.porDia.find((d: any) => d.fecha === key);
                    const intensidad = dia ? Math.min(1, dia.tests / 5) : 0;
                    return (
                      <div
                        key={key}
                        title={dia ? `${dia.tests} tests · ${dia.acierto}% acierto` : 'Sin actividad'}
                        style={{
                          width: '14px', height: '14px', borderRadius: '3px',
                          background: intensidad === 0 ? '#f3f4f6' :
                            intensidad < 0.3 ? '#bbf7d0' :
                            intensidad < 0.6 ? '#4ade80' : '#15803d',
                        }}
                      />
                    );
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '10px', color: '#9ca3af' }}>
                  <span>Menos</span>
                  {['#f3f4f6', '#bbf7d0', '#4ade80', '#15803d'].map((c) => (
                    <div key={c} style={{ width: '10px', height: '10px', borderRadius: '2px', background: c }} />
                  ))}
                  <span>Más</span>
                </div>
              </div>
            )}

            {/* Progreso por tema */}
            {temas.length > 0 && (
              <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '1.25rem', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#111827', marginBottom: '12px' }}>
                  Progreso por tema
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {temas.map((tema: any) => {
                    const dataTema = progreso.porTema?.find((t: any) => t.id === tema.id);
                    const acierto = dataTema?.acierto ?? 0;
                    const tests = dataTema?.tests ?? 0;
                    const color = NivelColor(acierto);
                    return (
                      <div key={tema.id}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div style={{ fontSize: '12px', color: '#374151', flex: 1, marginRight: '8px' }}>
                            <span style={{ color: '#9ca3af', marginRight: '4px' }}>T{tema.numero}</span>
                            {tema.titulo.slice(0, 40)}{tema.titulo.length > 40 ? '...' : ''}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {tests > 0 && (
                              <span style={{ fontSize: '10px', color: '#9ca3af' }}>{tests} tests</span>
                            )}
                            <span style={{ fontSize: '12px', fontWeight: 500, color: tests > 0 ? color : '#9ca3af' }}>
                              {tests > 0 ? `${acierto}%` : '—'}
                            </span>
                          </div>
                        </div>
                        <div style={{ height: '4px', background: '#f3f4f6', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${acierto}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Botón hacer test */}
            <button
              onClick={() => oposicionId && router.push(`/app/test/${oposicionId}`)}
              style={{ width: '100%', padding: '12px', background: '#111827', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
            >
              ▶ Hacer un test ahora
            </button>
          </>
        )}
      </div>

      {/* Navegación inferior */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #f3f4f6', display: 'flex', zIndex: 10 }}>
        {[
        { label: 'Inicio', icon: '🏠', path: '/app/dashboard', active: false },
        { label: 'Retos', icon: '⚡', path: '/app/retos', active: false },
        { label: 'Ranking', icon: '🏆', path: '/app/ranking', active: false },
        { label: 'Alertas', icon: '🔔', path: '/app/alertas', active: false },
        ].map(({ label, icon, path, active }) => (
          <button
            key={label}
            onClick={() => router.push(path)}
            style={{ flex: 1, padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', border: 'none', background: 'none', cursor: 'pointer', borderTop: active ? '2px solid #111827' : '2px solid transparent', marginTop: '-1px' }}
          >
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <span style={{ fontSize: '10px', color: active ? '#111827' : '#9ca3af', fontWeight: active ? 500 : 400 }}>{label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}