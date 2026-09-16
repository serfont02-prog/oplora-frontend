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

export default function SimulacroGeneradoSelectorPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const oposicionId = usuario?.oposicionActiva?.id;

  const { data: convocatoria, isLoading } = useQuery({
    queryKey: ['convocatoria-simulacro-generado', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/temas/examenes/mi-convocatoria/${oposicionId}`);
      return res.data.convocatoria;
    },
    enabled: !!oposicionId,
  });

  const ejercicios = convocatoria?.ejercicios ?? [];

  return (
    <div style={{ minHeight: '100vh', background: BG_APP }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '1.5rem' }}>

        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY, fontSize: 13, marginBottom: 20 }}>
          <ArrowLeft size={15} />
          Volver
        </button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Simulacro OPLORA
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>¿Qué ejercicio quieres simular?</div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', fontSize: 13, color: TEXT_MUTED }}>Cargando...</div>
        ) : ejercicios.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: TEXT_MUTED }}>Esta convocatoria no tiene ejercicios configurados</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ejercicios.map((ej: any) => (
              <button
                key={ej.numero}
                onClick={() => router.push(`/app/entrenamiento/simulacro/generado/${ej.numero}`)}
                style={{
                  textAlign: 'left', background: 'white', border: '1px solid #F1F5F9', borderRadius: 16,
                  padding: '16px 18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, textTransform: 'capitalize' }}>
                    Ejercicio {ej.numero} — {TIPO_LABEL[ej.tipo] ?? ej.tipo}
                  </div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>
                    {ej.numPreguntas ? `${ej.numPreguntas} preguntas` : ''}
                    {ej.numPreguntas && ej.tiempoMinutos ? ' · ' : ''}
                    {ej.tiempoMinutos ? `${ej.tiempoMinutos} min` : ''}
                  </div>
                </div>
                <span style={{ fontSize: 20 }}>⚡</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}