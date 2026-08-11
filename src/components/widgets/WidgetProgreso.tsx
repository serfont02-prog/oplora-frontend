'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const BG_WIDGET = '#F7F8FA';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

const VARIANTES: Record<string, { label: string; key: 'dia' | 'semana' | 'mes' | 'total' }> = {
  dia:    { label: 'Hoy', key: 'dia' },
  semana: { label: 'Esta semana', key: 'semana' },
  mes:    { label: 'Este mes', key: 'mes' },
  total:  { label: 'Total', key: 'total' },
};

function colorPorPrecision(porcentaje: number): string {
  if (porcentaje < 30) return '#DC2626';   // rojo
  if (porcentaje < 60) return '#D97706';   // naranja/ámbar
  if (porcentaje < 80) return '#1F7CFF';   // azul
  return '#16A34A';                         // verde
}

function Donut({ porcentaje, color, size = 64, grosor = 7 }: { porcentaje: number; color: string; size?: number; grosor?: number }) {
  const radio = (size - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia - (Math.min(100, porcentaje) / 100) * circunferencia;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radio} fill="none" stroke="#E5E7EB" strokeWidth={grosor} />
      <circle
        cx={size / 2} cy={size / 2} r={radio} fill="none"
        stroke={color} strokeWidth={grosor} strokeLinecap="round"
        strokeDasharray={circunferencia} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

export default function WidgetProgreso({
  ubicacion,
  oposicionId,
}: {
  ubicacion: string; // ej: 'entrenamiento_progreso', 'inicio_progreso'
  oposicionId: string;
}) {
  const [modalDetalle, setModalDetalle] = useState(false);
  const queryClient = useQueryClient();

  const { data: variantePreferida = 'semana' } = useQuery({
    queryKey: ['preferencia-widget', ubicacion],
    queryFn: async () => {
      const res = await api.get(`/preferencias-widget/${ubicacion}`);
      return res.data;
    },
    enabled: !!ubicacion,
  });

    const { data: progresoPeriodo } = useQuery({
    queryKey: ['progreso-periodo', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/test/progreso-periodo/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId,
  });

  const cambiarVariante = async (nuevaVariante: string) => {
    await api.post(`/preferencias-widget/${ubicacion}`, { variante: nuevaVariante });
    queryClient.invalidateQueries({ queryKey: ['preferencia-widget', ubicacion] });
    setModalDetalle(false);
  };

  const cfg = VARIANTES[variantePreferida] ?? VARIANTES.semana;
  const datos = progresoPeriodo?.[cfg.key] ?? { precision: 0, totalPreguntas: 0 };

    const { data: fcPeriodo } = useQuery({
    queryKey: ['fc-periodo', oposicionId],
    queryFn: async () => {
        const res = await api.get(`/flashcards/stats-periodo/${oposicionId}`);
        return res.data;
    },
    enabled: !!oposicionId,
    });

    const datosFC = fcPeriodo?.[cfg.key] ?? { porcentajeDominadas: 0, dominadas: 0 };

  return (
    <>
      <div style={{ background: BG_WIDGET, borderRadius: '18px', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingLeft: '2px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Mi progreso · {cfg.label.toLowerCase()}
          </span>
          <button
            onClick={() => setModalDetalle(true)}
            style={{ fontSize: '11px', color: '#111827', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Cambiar vista
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '14px 8px' }}>
            <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Donut porcentaje={datos.precision} color={colorPorPrecision(datos.precision)} />
              <div style={{ position: 'absolute', fontSize: '15px', fontWeight: 800, color: TEXT_PRIMARY }}>
                {datos.precision}%
              </div>
            </div>
            <span style={{ fontSize: '11px', color: TEXT_SECONDARY, fontWeight: 500, textAlign: 'center' }}>Precisión Test</span>
          </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '14px 8px' }}>
            <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Donut porcentaje={datosFC.porcentajeDominadas} color="#FADEF7" />
                <div style={{ position: 'absolute', fontSize: '15px', fontWeight: 800, color: TEXT_PRIMARY }}>
                {datosFC.porcentajeDominadas}%
                </div>
            </div>
            <span style={{ fontSize: '11px', color: TEXT_SECONDARY, fontWeight: 500, textAlign: 'center' }}>FC dominadas</span>
            </div>
        </div>
      </div>

      {modalDetalle && (
        <div
          onClick={() => setModalDetalle(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#EAF0FF', borderRadius: '20px', padding: '1.5rem', width: '100%', maxWidth: '420px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT_PRIMARY }}>Elige tu estadística</div>
              <button onClick={() => setModalDetalle(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: TEXT_MUTED }}>×</button>
            </div>

{Object.entries(VARIANTES).map(([key, v]) => {
  const datosVariante = progresoPeriodo?.[v.key] ?? { precision: 0, totalPreguntas: 0 };
  const datosFCVariante = fcPeriodo?.[v.key] ?? { porcentajeDominadas: 0, dominadas: 0 }; // ⭐ añadir esta línea
  const esActual = variantePreferida === key;

  return (
    <div
  key={key}
  onClick={() => !esActual && cambiarVariante(key)}
  style={{
    marginBottom: '12px', padding: '14px', borderRadius: '14px',
    border: esActual ? '2px solid #111827' : '1px solid #E9EAEC',
    background: esActual ? '#F9FAFB' : 'white',
    cursor: esActual ? 'default' : 'pointer',
  }}
>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: TEXT_SECONDARY }}>{v.label}</span>
        {esActual && (
          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: '#111827', color: 'white', fontWeight: 600 }}>
            Actual
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{ position: 'relative', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Donut porcentaje={datosVariante.precision} color={colorPorPrecision(datosVariante.precision)} size={52} grosor={6} />
            <div style={{ position: 'absolute', fontSize: '12px', fontWeight: 800, color: TEXT_PRIMARY }}>
              {datosVariante.precision}%
            </div>
          </div>
          <span style={{ fontSize: '10px', color: TEXT_MUTED }}>Precisión Test</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{ position: 'relative', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Donut porcentaje={datosFCVariante.porcentajeDominadas} color="#FADEF7" size={52} grosor={6} />
            <div style={{ position: 'absolute', fontSize: '12px', fontWeight: 800, color: TEXT_PRIMARY }}>
              {datosFCVariante.porcentajeDominadas}%
            </div>
          </div>
          <span style={{ fontSize: '10px', color: TEXT_MUTED }}>FC dominadas</span>
        </div>
      </div>
    </div>
  );
})}
          </div>
        </div>
      )}
    </>
  );
}