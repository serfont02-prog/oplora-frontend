'use client';

// Esta ruta quedó obsoleta: la gestión de psicotécnicos ahora se hace SIEMPRE
// en el contexto de una convocatoria concreta (botón 🧠 en cada convocatoria),
// para poder activar tipos o subir preguntas solo para esa convocatoria sin
// afectar a las demás. Aquí solo redirigimos a la convocatoria más reciente.

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function AdminPsicotecnicosRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const oposicionId = params.id as string;

  const { data: convocatorias, isLoading } = useQuery({
    queryKey: ['convocatorias', oposicionId],
    queryFn: async () => (await api.get(`/convocatorias/oposicion/${oposicionId}`)).data as any[],
    enabled: !!oposicionId,
  });

  useEffect(() => {
    if (isLoading || !convocatorias) return;
    if (convocatorias.length > 0) {
      router.replace(`/admin/oposiciones/${oposicionId}/convocatorias/${convocatorias[0].id}/psicotecnicos`);
    } else {
      router.replace(`/admin/oposiciones/${oposicionId}`);
    }
  }, [isLoading, convocatorias, oposicionId, router]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
      Redirigiendo a la convocatoria...
    </div>
  );
}
