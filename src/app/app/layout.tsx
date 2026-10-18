'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import LogoOplora from '@/components/marca/LogoOplora';
import { BG_DASHBOARD } from '@/styles/tokens';

// ⭐ Mientras se comprueba la sesión (o se redirige) se muestra el logo en vez de una pantalla en blanco.
function PantallaCarga() {
  return (
    <div style={{ minHeight: '100vh', background: BG_DASHBOARD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes oplora-latir { 0%, 100% { opacity: 0.55; transform: scale(0.96); } 50% { opacity: 1; transform: scale(1); } }`}</style>
      <div style={{ animation: 'oplora-latir 1.4s ease-in-out infinite' }}>
        <LogoOplora variante="icono" alto={46} />
      </div>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { usuario, cargando } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const esRutaPublica =
  pathname.startsWith('/app/login') ||
  pathname.startsWith('/app/registro') ||
  pathname.startsWith('/app/recuperar-password') ||
  pathname.startsWith('/app/resetear-password');


  useEffect(() => {
    if (esRutaPublica || cargando) return;

    if (!usuario) {
      router.replace('/app/login');
      return;
    }

    if (usuario.onboardingGeneralCompletado) return;
    if (pathname.startsWith('/app/onboarding')) return;

    router.replace('/app/onboarding/objetivo');
  }, [usuario, cargando, pathname, router, esRutaPublica]);

  if (esRutaPublica) {
    return <>{children}</>;
  }

  if (cargando || !usuario) {
    return <PantallaCarga />;
  }

  if (
    !usuario.onboardingGeneralCompletado &&
    !pathname.startsWith('/app/onboarding')
  ) {
    return <PantallaCarga />;
  }

  return <>{children}</>;
}
