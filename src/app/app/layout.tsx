'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

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
    pathname.startsWith('/app/registro');

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
    return null;
  }

  if (
    !usuario.onboardingGeneralCompletado &&
    !pathname.startsWith('/app/onboarding')
  ) {
    return null;
  }

  return <>{children}</>;
}
