'use client';

// ⭐ Simulacro oficial — lista de exámenes reales agrupados por convocatoria.

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ChevronRight, FileText } from 'lucide-react';
import { FooterNavegacion } from '@/components/ui/FooterNavegacion';
import CabeceraPractica, { SOMBRA } from '@/components/entrenamiento/CabeceraPractica';
import { COLOR_SIMULACRO, COLOR_SIMULACRO_BG } from '@/components/entrenamiento/ExamenSimulacro';
import { BG_DASHBOARD as BG_APP, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '@/styles/tokens';
import ErrorCarga from '@/components/ui/ErrorCarga';

export default function SimulacroOficialPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const oposicionId = usuario?.oposicionActiva?.id;

  const { data: examenes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['examenes-oficiales-todos', oposicionId],
    queryFn: async () => (await api.get(`/temas/examenes/oposicion/${oposicionId}`)).data,
    enabled: !!oposicionId,
  });

  if (!usuario) return null;

  const anyos = [...new Set(examenes.map((ex: any) => ex.convocatoria?.anyo))].sort((a: any, b: any) => b - a);

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 90 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <CabeceraPractica eyebrow="Simulacro oficial" titulo="Elige un examen real" onVolver={() => router.push('/app/entrenamiento/simulacro')} />

        {isLoading && <div style={{ background: 'var(--c-superficie)', borderRadius: 18, padding: 16, boxShadow: SOMBRA, fontSize: 13, color: TEXT_MUTED }}>Cargando…</div>}
        {isError && <ErrorCarga onReintentar={() => refetch()} />}
        {!isLoading && !isError && examenes.length === 0 && (
          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, padding: 16, boxShadow: SOMBRA, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5 }}>
            Todavía no hay exámenes oficiales de tu oposición. Mientras tanto puedes hacer un simulacro OPLORA.
          </div>
        )}

        {anyos.map((anyo: any) => {
          const delAnyo = examenes.filter((ex: any) => ex.convocatoria?.anyo === anyo);
          return (
            <section key={anyo}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 8, padding: '0 4px' }}>Convocatoria {anyo}</div>
              <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
                {delAnyo.map((ex: any, i: number) => {
                  const disponible = ex.totalPreguntas > 0;
                  return (
                    <button
                      key={ex.id}
                      onClick={() => disponible && router.push(`/app/entrenamiento/simulacro/${ex.id}`)}
                      disabled={!disponible}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', textAlign: 'left',
                        background: 'none', border: 'none', borderBottom: i < delAnyo.length - 1 ? '1px solid var(--hx-eef0f3)' : 'none',
                        cursor: disponible ? 'pointer' : 'default', opacity: disponible ? 1 : 0.5,
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: COLOR_SIMULACRO_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={19} color={COLOR_SIMULACRO} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.3 }}>
                          {ex.nombre}{ex.mes ? ` · ${ex.mes}` : ''}
                        </div>
                        <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>
                          Ejercicio {ex.parte} · {disponible ? `${ex.totalPreguntas} preguntas` : 'Sin preguntas todavía'}
                        </div>
                      </div>
                      {disponible && <ChevronRight size={16} color="var(--hx-c4c9d2)" style={{ flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} activo="practicar" />
    </div>
  );
}
