'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { OnboardingEntrenamientoIntro } from './OnboardingEntrenamientoIntro';
import OnboardingFlashcards from './OnboardingFlashcards';

type Props = {
  usuario: any;
  oposicionId: string | number;
  initialStep?: string | null;
};

const getInitialStep = (initialStep?: string | null) => {
  if (initialStep === 'flashcards') return 3;
  return 1;
};

export default function OnboardingEntrenamiento({
  usuario: _usuario,
  oposicionId,
  initialStep,
}: Props) {
  const router = useRouter();
  const { actualizarUsuario } = useAuth();
  const [step, setStep] = useState(() => getInitialStep(initialStep));

  const finalizar = async () => {
    const res = await api.post('/usuarios/onboarding-entrenamiento/completado');
    actualizarUsuario(res.data);
    router.replace('/app/dashboard');
  };

  if (step === 1) {
    return (
      <OnboardingEntrenamientoIntro
        onNext={() => router.push(`/app/test/${oposicionId}?modo=primer_reto&n=5`)}
      />
    );
  }

  if (step === 3) {
    return <OnboardingFlashcards onFinish={finalizar} />;
  }

  return null;
}
