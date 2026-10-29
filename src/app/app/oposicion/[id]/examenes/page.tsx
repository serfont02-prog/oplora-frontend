'use client';

// ⭐ Pantalla antigua (barra con emojis) que ya no enlaza nada: los exámenes anteriores están en
// "Convocatorias y exámenes". Solo redirige; se puede borrar la carpeta oposicion/[id]/examenes.
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CargaOplora from '@/components/marca/CargaOplora';

export default function ExamenesRetirado() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  useEffect(() => { router.replace(`/app/oposicion/${id}/historial`); }, [id, router]);
  return <CargaOplora />;
}
