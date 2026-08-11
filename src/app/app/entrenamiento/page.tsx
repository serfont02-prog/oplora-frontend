'use client';

import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';

import OnboardingEntrenamiento from '@/components/entrenamiento/OnboardingEntrenamiento';
import EntrenamientoHub from '@/components/entrenamiento/EntrenamientoHub';
import { FooterNavegacion } from '@/app/app/dashboard/page';

export default function EntrenamientoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { usuario } = useAuth();

  const oposicionId = usuario?.oposicionActiva?.id;
  const initialStep = searchParams.get('step');

  const { data: limites } = useQuery({
    queryKey: ['limites', usuario?.id],
    queryFn: async () => {
      const res = await api.get('/usuarios/limites');
      return res.data;
    },
    enabled: !!usuario,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: oposicion } = useQuery({
    queryKey: ['oposicion', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/oposiciones/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId,
  });

  const { data: progreso } = useQuery({
    queryKey: ['progreso-entrenamiento', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/test/progreso/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias-entrenamiento', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId,
  });

  if (!usuario) return null;

  if (!oposicionId) {
    return (
      <>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px 24px 96px', textAlign: 'center' }}>
          <div style={{ maxWidth: 420 }}>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Elige una oposicion primero</h1>
            <p style={{ color: '#6b7280', marginBottom: 20 }}>
              Necesitamos saber que oposicion preparas para crear tu entrenamiento.
            </p>
            <button
              onClick={() => router.push('/app/onboarding/oposicion')}
              style={{
                border: 'none', borderRadius: 999, padding: '12px 18px',
                background: '#111827', color: 'white', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Elegir oposicion
            </button>
          </div>
        </main>
        <FooterNavegacion usuario={usuario} oposicionId={oposicionId} activo="practicar" />
      </>
    );
  }

  const convocatoriaActiva = convocatorias.find((c: any) => c.estado === 'activa') || convocatorias[0];

  if (usuario.estado === 'nuevo') {
    return (
      <>
        <OnboardingEntrenamiento
          usuario={usuario}
          oposicionId={oposicionId}
          initialStep={initialStep}
        />
        <FooterNavegacion usuario={usuario} oposicionId={oposicionId} activo="practicar" />
      </>
    );
  }

  return (
    <>
      <EntrenamientoHub
        usuario={usuario}
        oposicion={oposicion}
        progreso={progreso}
        convocatoria={convocatoriaActiva}
        limites={limites}
      />
      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} activo="practicar" />
    </>
  );
}