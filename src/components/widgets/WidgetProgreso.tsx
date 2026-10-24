'use client';

// ⭐ Estadísticas de Practicar flotando sobre el fondo (mismo estilo que los accesos de Inicio):
// cada dato es un círculo blanco con la sombra común y el aro de progreso dentro. El periodo se
// cambia con un selector en línea (antes abría una ventana) y se sigue guardando como preferencia.

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, COLOR_FC, COLOR_PSICO } from '@/styles/tokens';

const SOMBRA = 'var(--c-sombra)';
const COLOR_TEST = 'var(--c-verde)';

const VARIANTES: { clave: 'dia' | 'semana' | 'mes' | 'total'; corto: string }[] = [
  { clave: 'dia', corto: 'Hoy' },
  { clave: 'semana', corto: 'Semana' },
  { clave: 'mes', corto: 'Mes' },
  { clave: 'total', corto: 'Total' },
];

function Donut({ porcentaje, color, size, grosor }: { porcentaje: number; color: string; size: number; grosor: number }) {
  const radio = (size - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia - (Math.max(0, Math.min(100, porcentaje)) / 100) * circunferencia;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={radio} fill="none" stroke="var(--c-pista)" strokeWidth={grosor} />
      {porcentaje > 0 && (
        <circle
          cx={size / 2} cy={size / 2} r={radio} fill="none"
          stroke={color} strokeWidth={grosor} strokeLinecap="round"
          strokeDasharray={circunferencia} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      )}
    </svg>
  );
}

function CirculoDato({ porcentaje, color, label, sub, sinDatos }: { porcentaje: number; color: string; label: string; sub: string; sinDatos: boolean }) {
  const D = 78;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <div style={{ position: 'relative', width: D, height: D, borderRadius: '50%', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 6 }}>
          <Donut porcentaje={sinDatos ? 0 : porcentaje} color={color} size={D - 12} grosor={6} />
        </div>
        <span style={{ position: 'relative', fontSize: 16, fontWeight: 800, color: sinDatos ? TEXT_MUTED : TEXT_PRIMARY }}>
          {sinDatos ? '—' : `${porcentaje}%`}
        </span>
      </div>
      <span style={{ fontSize: 12, color: TEXT_PRIMARY, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
      <span style={{ fontSize: 10, color: TEXT_MUTED, marginTop: -3, textAlign: 'center' }}>{sub}</span>
    </div>
  );
}

const plural = (n: number, uno: string, varios: string) => `${n.toLocaleString('es-ES')} ${n === 1 ? uno : varios}`;

export default function WidgetProgreso({
  ubicacion,
  oposicionId,
  convocatoriaId,
}: {
  ubicacion: string; // ej: 'entrenamiento_progreso'
  oposicionId: string;
  convocatoriaId?: string;
}) {
  const queryClient = useQueryClient();

  const { data: variantePreferida = 'semana' } = useQuery({
    queryKey: ['preferencia-widget', ubicacion],
    queryFn: async () => (await api.get(`/preferencias-widget/${ubicacion}`)).data,
    enabled: !!ubicacion,
  });

  const { data: progresoPeriodo } = useQuery({
    queryKey: ['progreso-periodo', oposicionId],
    queryFn: async () => (await api.get(`/test/progreso-periodo/${oposicionId}`)).data,
    enabled: !!oposicionId,
  });

  const { data: fcPeriodo } = useQuery({
    queryKey: ['fc-periodo', oposicionId],
    queryFn: async () => (await api.get(`/flashcards/stats-periodo/${oposicionId}`)).data,
    enabled: !!oposicionId,
  });

  // Psicotécnicos: solo si hay alguna modalidad activa para esta oposición/convocatoria
  const { data: configPsico = [] } = useQuery({
    queryKey: ['psicotecnicos-config', oposicionId, convocatoriaId],
    queryFn: async () => (await api.get(`/psicotecnicos/config/${oposicionId}`, {
      params: convocatoriaId ? { convocatoriaId } : {},
    })).data,
    enabled: !!oposicionId,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const hayPsicotecnicos = configPsico.length > 0;

  const { data: psicoPeriodo } = useQuery({
    queryKey: ['psico-periodo', oposicionId],
    queryFn: async () => (await api.get(`/psicotecnicos/progreso-periodo/${oposicionId}`)).data,
    enabled: !!oposicionId && hayPsicotecnicos,
  });

  const clave = (VARIANTES.find((v) => v.clave === variantePreferida) ?? VARIANTES[1]).clave;

  const cambiarVariante = (nueva: string) => {
    if (nueva === clave) return;
    // Cambio inmediato en pantalla; la preferencia se guarda en segundo plano.
    queryClient.setQueryData(['preferencia-widget', ubicacion], nueva);
    api.post(`/preferencias-widget/${ubicacion}`, { variante: nueva }).catch(() => {
      queryClient.invalidateQueries({ queryKey: ['preferencia-widget', ubicacion] });
    });
  };

  const test = progresoPeriodo?.[clave] ?? { precision: 0, totalPreguntas: 0 };
  const fc = fcPeriodo?.[clave] ?? { porcentajeDominadas: 0, dominadas: 0 };
  const psico = psicoPeriodo?.[clave] ?? { precision: 0, totalPreguntas: 0 };

  const nTest = Number(test.totalPreguntas ?? 0);
  const nDominadas = Number(fc.dominadas ?? 0);
  const nPsico = Number(psico.totalPreguntas ?? 0);

  const items = [
    {
      key: 'test', label: 'Acierto en test', color: COLOR_TEST,
      porcentaje: Math.round(Number(test.precision ?? 0)), sinDatos: nTest === 0,
      sub: nTest === 0 ? 'Sin preguntas' : plural(nTest, 'pregunta', 'preguntas'),
    },
    {
      key: 'fc', label: 'Flashcards dominadas', color: COLOR_FC,
      porcentaje: Math.round(Number(fc.porcentajeDominadas ?? 0)), sinDatos: !fcPeriodo,
      sub: plural(nDominadas, 'dominada', 'dominadas'),
    },
    ...(hayPsicotecnicos ? [{
      key: 'psico', label: 'Acierto en psicotécnicos', color: COLOR_PSICO,
      porcentaje: Math.round(Number(psico.precision ?? 0)), sinDatos: nPsico === 0,
      sub: nPsico === 0 ? 'Sin preguntas' : plural(nPsico, 'pregunta', 'preguntas'),
    }] : []),
  ];

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY }}>Mi progreso</span>
        <div role="tablist" aria-label="Periodo" style={{ display: 'flex', background: 'var(--c-segmento)', borderRadius: 999, padding: 3, gap: 2 }}>
          {VARIANTES.map((v) => {
            const activo = v.clave === clave;
            return (
              <button
                key={v.clave}
                role="tab"
                aria-selected={activo}
                onClick={() => cambiarVariante(v.clave)}
                style={{
                  border: 'none', borderRadius: 999, padding: '5px 10px', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700,
                  background: activo ? 'var(--c-primario)' : 'transparent',
                  color: activo ? 'var(--c-primario-texto)' : TEXT_SECONDARY,
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
              >
                {v.corto}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 8, padding: '0 4px' }}>
        {items.map((item) => (
          <CirculoDato key={item.key} porcentaje={item.porcentaje} color={item.color} label={item.label} sub={item.sub} sinDatos={item.sinDatos} />
        ))}
      </div>
    </section>
  );
}
