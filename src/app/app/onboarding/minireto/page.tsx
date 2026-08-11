'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState } from 'react';
import confetti from 'canvas-confetti';

export default function MiniRetoPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    setSelected(value);

    if (value === 'constancia') {
      confetti({ particleCount: 80, spread: 60 });
      setTimeout(() => router.push('/app/onboarding/resumen'), 900);
    }
  };

  const Card = ({ icon, title, value }: any) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => handleSelect(value)}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '18px 20px',
        borderRadius: 14,
        border: selected === value ? '2px solid #1F7CFF' : '1px solid #e5e7eb',
        background: 'white',
        cursor: 'pointer',
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ fontSize: 26 }}>{icon}</div>
      <div style={{ fontWeight: 600, color: '#0A2A43' }}>{title}</div>
    </motion.button>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0A2A43 0%, #0F3A63 100%)',
        padding: '2rem',
      }}
    >
      <main
        style={{
          background: 'white',
          borderRadius: 20,
          border: '1px solid #e5e7eb',
          padding: '3rem 2.5rem',
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
        }}
      >
        <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <Image
            src="/prueba.svg"
            alt="Oplora"
            width={200}
            height={70}
            priority
            style={{ marginBottom: 10 }}
          />

          {/* PROGRESO */}
          <div style={{ marginTop: 10, marginBottom: 14 }}>
            <div
              style={{
                height: 6,
                width: '100%',
                background: '#e5e7eb',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '80%' }} // Paso 4 de 5
                transition={{ duration: 0.4 }}
                style={{
                  height: '100%',
                  background: '#1F7CFF',
                }}
              />
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#9ca3af',
                marginTop: 6,
              }}
            >
              Paso 4 de 5
            </div>
          </div>

          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: '#0A2A43',
              margin: '10px 0 8px',
            }}
          >
            Mini‑reto
          </h1>

          <p style={{ fontSize: 15, color: '#6b7280', margin: 0 }}>
            ¿Qué es lo más importante para aprobar una oposición?
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card icon="🔥" title="Constancia" value="constancia" />
          <Card icon="🍀" title="Suerte" value="suerte" />
          <Card icon="☕" title="Café" value="cafe" />
        </div>
      </main>
    </div>
  );
}
