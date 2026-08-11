'use client';

import { useRouter } from 'next/navigation';

type OnboardingPrimerRetoProps = {
  oposicionId: string | number;
  onNext: () => void;
};

export function OnboardingPrimerReto({ oposicionId, onNext }: OnboardingPrimerRetoProps) {
  const router = useRouter();

  const iniciarPrimerReto = () => {
    router.push(`/app/test/${oposicionId}?modo=primer_reto&n=5`);
    onNext();
  };

  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <h2 style={{ fontSize: 24, fontWeight: 800 }}>
        Tu primer test
      </h2>

      <p style={{ marginTop: 10, opacity: .8 }}>
        Serán solo 5 preguntas para que empieces a coger ritmo.
      </p>

      <button
        onClick={iniciarPrimerReto}
        style={{
          marginTop: 40,
          padding: "14px 20px",
          borderRadius: 16,
          background: "#4f46e5",
          color: "white",
          fontWeight: 700,
          border: "none",
          width: "100%",
        }}
      >
        Empezar ahora · 5 preguntas
      </button>
    </div>
  );
}
