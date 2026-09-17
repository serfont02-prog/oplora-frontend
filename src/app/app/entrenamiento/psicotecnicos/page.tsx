'use client';

import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';

const BG_APP = '#F4F5F7';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

export default function PsicotecnicosHubPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const oposicionId = usuario?.oposicionActiva?.id;
  const convocatoriaId = usuario?.oposicionActiva?.convocatoriaActiva?.id;

  const { data: modalidades = [], isLoading } = useQuery({
    queryKey: ['psicotecnicos-config', oposicionId, convocatoriaId],
    queryFn: async () => {
      const res = await api.get(`/psicotecnicos/config/${oposicionId}`, {
        params: convocatoriaId ? { convocatoriaId } : {},
      });
      return res.data;
    },
    enabled: !!oposicionId,
  });

  if (!usuario) return null;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '1.5rem 1.5rem 3rem' }}>

        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY, fontSize: 13, marginBottom: 24 }}>
          <ArrowLeft size={15} />
          Volver
        </button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🧠</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>Psicotécnicos</div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 4 }}>
            Entrena las aptitudes que evalúa tu proceso selectivo
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', fontSize: 13, color: TEXT_MUTED, padding: '2rem 0' }}>Cargando...</div>
        ) : modalidades.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 18, padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: TEXT_MUTED }}>
              Todavía no hay modalidades de psicotécnicos configuradas para tu oposición.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {modalidades.map((m: any) => (
              <button
                key={m.tipo}
                onClick={() => router.push(`/app/entrenamiento/psicotecnicos/${m.tipo}`)}
                style={{ textAlign: 'left', background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
              >
                <div style={{ fontSize: 26, flexShrink: 0 }}>{m.icono}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{m.nombre}</span>
                  </div>
                  <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2, lineHeight: 1.4 }}>
                    {m.descripcion}
                  </div>
                  {m.estadisticas?.realizadas > 0 && (
                    <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 6, display: 'flex', gap: 10 }}>
                      <span>{m.estadisticas.realizadas} entrenamientos</span>
                      <span>·</span>
                      <span>Mejor: {m.estadisticas.mejorPorcentaje}%</span>
                    </div>
                  )}
                </div>
                <ChevronRight size={16} color="#d1d5db" style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
