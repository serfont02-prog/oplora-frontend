'use client';

// ⭐ Simulacro OPLORA — elegir el ejercicio de tu convocatoria.

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ChevronRight, Shuffle } from 'lucide-react';
import { FooterNavegacion } from '@/app/app/dashboard/page';
import CabeceraPractica, { SOMBRA } from '@/components/entrenamiento/CabeceraPractica';
import { COLOR_SIMULACRO, COLOR_SIMULACRO_BG } from '@/components/entrenamiento/ExamenSimulacro';
import { BG_DASHBOARD as BG_APP, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '@/styles/tokens';

const TIPO_LABEL: Record<string, string> = { test: 'Test', desarrollo: 'Desarrollo', oral: 'Oral', practico: 'Práctico', mixto: 'Mixto' };

export default function SimulacroGeneradoSelectorPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const oposicionId = usuario?.oposicionActiva?.id;

  const { data: convocatoria, isLoading } = useQuery({
    queryKey: ['convocatoria-simulacro-generado', oposicionId],
    queryFn: async () => (await api.get(`/temas/examenes/mi-convocatoria/${oposicionId}`)).data.convocatoria,
    enabled: !!oposicionId,
  });

  if (!usuario) return null;

  // Solo se pueden generar ejercicios tipo test (los de desarrollo/oral no tienen preguntas de opciones)
  const ejercicios = (convocatoria?.ejercicios ?? []).filter((ej: any) => !ej.tipo || ej.tipo === 'test' || ej.tipo === 'mixto');

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 90 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <CabeceraPractica eyebrow="Simulacro OPLORA" titulo="¿Qué ejercicio quieres simular?" onVolver={() => router.push('/app/entrenamiento/simulacro')} />

        <div style={{ background: 'white', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
          {isLoading && <div style={{ padding: 16, fontSize: 13, color: TEXT_MUTED }}>Cargando…</div>}
          {!isLoading && ejercicios.length === 0 && (
            <div style={{ padding: 16, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5 }}>
              Tu convocatoria todavía no tiene ejercicios tipo test configurados.
            </div>
          )}
          {ejercicios.map((ej: any, i: number) => (
            <button
              key={ej.numero}
              onClick={() => router.push(`/app/entrenamiento/simulacro-oplora/${ej.numero}`)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', textAlign: 'left',
                background: 'none', border: 'none', borderBottom: i < ejercicios.length - 1 ? '1px solid #EEF0F3' : 'none', cursor: 'pointer',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: COLOR_SIMULACRO_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shuffle size={19} color={COLOR_SIMULACRO} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>
                  Ejercicio {ej.numero}{ej.tipo ? ` · ${TIPO_LABEL[ej.tipo] ?? ej.tipo}` : ''}
                </div>
                <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>
                  {[ej.numPreguntas ? `${ej.numPreguntas} preguntas` : null, ej.tiempoMinutos ? `${ej.tiempoMinutos} min` : null].filter(Boolean).join(' · ') || 'Estructura de tu convocatoria'}
                </div>
              </div>
              <ChevronRight size={16} color="#C4C9D2" style={{ flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>
      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} activo="practicar" />
    </div>
  );
}
