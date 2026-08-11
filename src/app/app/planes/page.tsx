'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PlanesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/app/suscripciones');
  }, [router]);

  return null;
}
