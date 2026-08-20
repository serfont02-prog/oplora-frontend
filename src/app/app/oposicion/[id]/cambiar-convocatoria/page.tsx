'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

const BG_APP = '#F4F5F7';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

export default function CambiarConvocatoriaPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const oposicionId = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ['convocatorias-disponibles', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/usuarios/convocatorias-disponibles/${oposicionId}`);
      return res.data;
    },
  });

  const cambiar = useMutation({
    mutationFn: async (convocatoriaId: string) => {
      await api.post('/usuarios/cambiar-convocatoria', { oposicionId, convocatoriaId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      router.push(`/app/oposicion/${oposicionId}`);
    },
  });

  if (isLoading) return null;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 40 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem' }}>

        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY, fontSize: 13, marginBottom: 16 }}>
          <ArrowLeft size={15} />
          Atrás
        </button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Convocatoria
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>
            Elige tu convocatoria
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data?.disponibles?.map((c: any) => {
            const esActual = c.id === data.actual?.id;
            return (
              <button
                key={c.id}
                onClick={() => !esActual && cambiar.mutate(c.id)}
                disabled={esActual || cambiar.isPending}
                style={{
                  width: '100%', textAlign: 'left', padding: '14px 16px',
                  background: 'white', border: esActual ? '2px solid #1F7CFF' : '1px solid #F1F5F9',
                  borderRadius: 14, cursor: esActual ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Convocatoria {c.anyo}</div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>
                    {c.plazas ? `${c.plazas} plazas` : ''} {c.estado === 'activa' ? '· Activa' : ''}
                  </div>
                </div>
                {esActual && <CheckCircle2 size={18} color="#1F7CFF" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}