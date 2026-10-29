'use client';

// ⭐ Barra inferior única de la app. Antes vivía dentro de dashboard/page.tsx y 18 pantallas
// importaban la página entera de Inicio solo para usarla.

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Home as HomeIcon, BookOpen as BookOpenIcon, Swords as FireIcon, Bell as BellIcon,
  ClipboardCheck as ClipboardDocumentCheckIcon,
} from 'lucide-react';

const COLOR_ESTUDIO_MARRON = 'var(--c-marron)';
const COLOR_RETOS_FOOTER = 'var(--c-retos)';
const COLOR_ALERTAS_AMARILLO = 'var(--c-campana)';

export type SeccionFooter = 'inicio' | 'estudiar' | 'retos' | 'practicar' | 'alertas' | string;

export function FooterNavegacion({ usuario, oposicionId, activo = 'inicio' }: { usuario?: any; oposicionId?: string; activo?: SeccionFooter }) {
  const router = useRouter();

  const { data: countData } = useQuery({
    queryKey: ['notificaciones-count'],
    queryFn: async () => {
      const res = await api.get('/notificaciones/count');
      return res.data;
    },
    enabled: !!usuario,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const countNoLeidas = countData?.count ?? 0;

  const irAPracticar = () => {
    if (!oposicionId) { router.push('/app/onboarding/oposicion'); return; }
    router.push('/app/entrenamiento');
  };

  const items = [
    { key: 'inicio', label: 'Inicio', icon: HomeIcon, onClick: () => router.push('/app/dashboard'), color: 'var(--c-azul)' },
    { key: 'estudiar', label: 'Estudiar', icon: BookOpenIcon, onClick: () => oposicionId ? router.push(`/app/tema/${oposicionId}?modo=estudiar`) : router.push('/app/onboarding/oposicion'), color: COLOR_ESTUDIO_MARRON },
    { key: 'retos', label: 'Retos', icon: FireIcon, onClick: () => router.push('/app/retos'), color: COLOR_RETOS_FOOTER },
    { key: 'practicar', label: 'Practicar', icon: ClipboardDocumentCheckIcon, onClick: irAPracticar, color: 'var(--c-azul)' },
    { key: 'alertas', label: 'Alertas', icon: BellIcon, onClick: () => router.push('/app/alertas'), color: COLOR_ALERTAS_AMARILLO },
  ];

  return (
    <footer
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 64,
        background: 'var(--c-superficie)', borderTop: '1px solid var(--c-borde)',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 50,
      }}
    >
      {items.map(({ key, label, icon: Icon, onClick, color }) => {
        const esActivo = activo === key;
        return (
          <button
            key={key}
            onClick={onClick}
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', paddingTop: 6 }}
          >
            {esActivo && (
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 20, height: 3, borderRadius: '0 0 3px 3px', background: color }} />
            )}
            <div style={{ position: 'relative' }}>
              <Icon style={{ width: 23, height: 23, color: esActivo ? color : 'var(--c-icono-inactivo)' }} />
              {key === 'alertas' && countNoLeidas > 0 && ( // ⭐ nuevo: indicador
                <span style={{
                  position: 'absolute', top: '-2px', right: '-2px',
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#DC2626', border: '1.5px solid var(--c-superficie)',
                }} />
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: esActivo ? color : 'var(--c-icono-inactivo)' }}>{label}</span>
          </button>
        );
      })}
    </footer>
  );
}

export default FooterNavegacion;
