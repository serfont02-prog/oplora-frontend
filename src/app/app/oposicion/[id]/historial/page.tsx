'use client';

// ⭐ Histórico de convocatorias — mismo sistema que el resto de la app.

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ArrowLeft, ChevronRight, CalendarRange } from 'lucide-react';
import { BG_NEUTRAL as BG_APP, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '@/styles/tokens';

const SOMBRA = 'var(--c-sombra)';

export default function HistoricoPage() {
  const params = useParams();
  const router = useRouter();
  const { usuario } = useAuth();
  const oposicionId = params.id as string;

  const { data: convocatorias = [], isPending, isError } = useQuery({
    queryKey: ['convocatorias-historico', oposicionId],
    queryFn: async () => (await api.get(`/convocatorias/oposicion/${oposicionId}`)).data,
  });

  const ordenadas = [...convocatorias].sort((a: any, b: any) => b.anyo - a.anyo);
  const convocatoriaActivaId = usuario?.oposicionActiva?.convocatoriaActiva?.id;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 40 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
          <button onClick={() => router.push('/app/dashboard')} aria-label="Volver a Inicio" style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <ArrowLeft size={18} color={TEXT_PRIMARY} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Histórico</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>Convocatorias de tu oposición</div>
          </div>
        </div>

        <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5, padding: '0 4px' }}>
          Consulta plazas, fechas, ejercicios y exámenes de cada año. Los exámenes con preguntas se pueden hacer como simulacro.
        </div>

        <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
          {isPending && <div style={{ padding: 16, fontSize: 13, color: TEXT_MUTED }}>Cargando…</div>}
          {isError && <div style={{ padding: 16, fontSize: 13, color: 'var(--hx-b91c1c)' }}>No se han podido cargar las convocatorias.</div>}
          {!isPending && !isError && ordenadas.length === 0 && (
            <div style={{ padding: 16, fontSize: 13, color: TEXT_MUTED }}>Todavía no hay convocatorias de esta oposición.</div>
          )}
          {ordenadas.map((c: any, i: number) => {
            const esActual = c.id === convocatoriaActivaId;
            const activa = c.estado === 'activa';
            return (
              <button
                key={c.id}
                onClick={() => router.push(`/app/oposicion/${oposicionId}/convocatoria?convocatoriaId=${c.id}`)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: esActual ? 'var(--hx-f5f8ff)' : 'none', border: 'none', borderBottom: i < ordenadas.length - 1 ? '1px solid var(--hx-eef0f3)' : 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 12, background: activa ? 'var(--hx-eaf0ff)' : 'var(--hx-f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CalendarRange size={20} color={activa ? 'var(--hx-1f7cff)' : TEXT_SECONDARY} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Convocatoria {c.anyo}</span>
                    {esActual && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: '#1F7CFF', color: 'white' }}>La tuya</span>}
                    {activa && !esActual && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'var(--hx-dcfce7)', color: 'var(--hx-15803d)' }}>Activa</span>}
                  </div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>
                    {c.plazas ? `${Number(c.plazas).toLocaleString('es-ES')} plazas` : 'Plazas sin publicar'}
                    {c.estado === 'cerrada' ? ' · Cerrada' : ''}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--hx-c4c9d2)" style={{ flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
