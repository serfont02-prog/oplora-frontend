'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { FooterNavegacion } from '@/app/app/dashboard/page';

const BG_APP = '#F4F5F7';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

export default function HistoricoPage() {
  const params = useParams();
  const router = useRouter();
  const { usuario } = useAuth();
  const oposicionId = params.id as string;

  const { data: convocatorias = [], isLoading } = useQuery({
    queryKey: ['convocatorias-historico', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${oposicionId}`);
      return res.data;
    },
  });

  const ordenadas = [...convocatorias].sort((a, b) => b.anyo - a.anyo);
  const convocatoriaActivaId = usuario?.oposicionActiva?.convocatoriaActiva?.id;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 90 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem' }}>

        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY, fontSize: 13, marginBottom: 16 }}>
          <ArrowLeft size={15} />
          Atrás
        </button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Histórico
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>
            Convocatorias de tu oposición
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', fontSize: 13, color: TEXT_MUTED }}>Cargando...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ordenadas.map((c: any) => {
              const esActual = c.id === convocatoriaActivaId;
              return (
                <button
                  key={c.id}
                  onClick={() => router.push(`/app/oposicion/${oposicionId}/convocatoria?convocatoriaId=${c.id}`)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '14px 16px',
                    background: 'white', border: esActual ? '2px solid #1F7CFF' : '1px solid #F1F5F9',
                    borderRadius: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>
                      {c.anyo}
                      {esActual && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: '#EAF0FF', color: '#1F7CFF' }}>Tu convocatoria</span>}
                    </div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>
                      {c.plazas ? `${c.plazas} plazas` : 'Sin plazas registradas'}
                    </div>
                  </div>
                  <ChevronRight size={16} color="#D1D5DB" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} activo="estudiar" />
    </div>
  );
}