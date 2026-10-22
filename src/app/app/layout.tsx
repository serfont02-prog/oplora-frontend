'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import CargaOplora from '@/components/marca/CargaOplora';

// ⭐ Mientras se comprueba la sesión (o se redirige) se muestra el logo completo cargando, no una pantalla en blanco.
function PantallaCarga() {
  return <CargaOplora />;
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
