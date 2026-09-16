'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

const BG_APP = '#F4F5F7';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

const TIPO_LABEL: Record<string, string> = {
  test: 'Test',
  desarrollo: 'Desarrollo',
  oral: 'Oral',
  practico: 'Práctico',
  mixto: 'Mixto',
};

export default function SimulacroOficialPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const oposicionId = usuario?.oposicionActiva?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['examenes-oficiales', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/temas/examenes/mi-convocatoria/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId,
  });

  const convocatoria = data?.convocatoria;
  const examenes = data?.examenes ?? [];
  const ejercicios = convocatoria?.ejercicios ?? [];

  return (
    <div style={{ minHeight: '100vh', background: BG_APP }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.5rem' }}>

        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY, fontSize: 13, marginBottom: 20 }}>
          <ArrowLeft size={15} />
          Volver
        </button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Simulacro oficial
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>Elige un examen real</div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', fontSize: 13, color: TEXT_MUTED }}>Cargando...</div>
        ) : examenes.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: 13, color: TEXT_MUTED }}>Todavía no hay exámenes oficiales disponibles</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {ejercicios.map((ej: any) => {
              const examenesDelEjercicio = examenes.filter((ex: any) => ex.parte === ej.numero);
              if (examenesDelEjercicio.length === 0) return null;

              return (
                <div key={ej.numero}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 8, textTransform: 'capitalize' }}>
                    Ejercicio {ej.numero} — {TIPO_LABEL[ej.tipo] ?? ej.tipo}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {examenesDelEjercicio.map((ex: any) => (
                      <button
                        key={ex.id}
                        onClick={() => ex.totalPreguntas > 0 && router.push(`/app/entrenamiento/simulacro/${ex.id}`)}
                        disabled={ex.totalPreguntas === 0}
                        style={{
                          textAlign: 'left', background: 'white', border: '1px solid #F1F5F9', borderRadius: 14,
                          padding: '14px 16px', cursor: ex.totalPreguntas > 0 ? 'pointer' : 'not-allowed',
                          opacity: ex.totalPreguntas > 0 ? 1 : 0.5,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>
                            {ex.nombre} · {ex.anyo}{ex.mes ? ` (${ex.mes})` : ''}
                          </div>
                          <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>
                            {ex.totalPreguntas > 0 ? `${ex.totalPreguntas} preguntas` : 'Sin preguntas disponibles'}
                          </div>
                        </div>
                        <span style={{ fontSize: 18 }}>🎯</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}