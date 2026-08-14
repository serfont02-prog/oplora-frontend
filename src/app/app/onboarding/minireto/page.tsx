'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Check } from 'lucide-react';

const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

function Logo() {
  return (
    <Image src="/prueba.svg" alt="Oplora" width={200} height={68} priority style={{ marginBottom: 2 }} />
  );
}

type Opcion = { icon: string; title: string; value: string; correcta: boolean; mensajeError: string };

const PREGUNTAS: Record<number, { pregunta: string; opciones: Opcion[] }> = {
  1: {
    pregunta: '¿Qué es lo más importante para avanzar en una oposición?',
    opciones: [
      { icon: '🔥', title: 'Constancia', value: 'constancia', correcta: true, mensajeError: '' },
      { icon: '🍀', title: 'Suerte', value: 'suerte', correcta: false, mensajeError: '🍀 La suerte ayuda... pero no aprueba exámenes 😄' },
      { icon: '☕', title: 'Café', value: 'cafe', correcta: false, mensajeError: '☕ Ayuda... pero no es suficiente 😄' },
    ],
  },
  2: {
    pregunta: 'Llevas tiempo estudiando. ¿Qué te ayudará a seguir avanzando?',
    opciones: [
      { icon: '🔥', title: 'Constancia', value: 'constancia', correcta: true, mensajeError: '' },
      { icon: '📚', title: 'Acumular apuntes', value: 'apuntes', correcta: false, mensajeError: '📚 Tener apuntes no sirve si no los repasas 😅' },
      { icon: '☕', title: 'Café', value: 'cafe', correcta: false, mensajeError: '☕ Ayuda... pero no es suficiente 😄' },
    ],
  },
  3: {
    pregunta: 'Cuando queda poco para el examen, ¿qué marca la diferencia?',
    opciones: [
      { icon: '🔥', title: 'Mantener la constancia', value: 'constancia', correcta: true, mensajeError: '' },
      { icon: '😰', title: 'Estudiar todo de golpe', value: 'atracon', correcta: false, mensajeError: '😰 El atracón de última hora casi nunca funciona' },
      { icon: '🍀', title: 'Tener suerte', value: 'suerte', correcta: false, mensajeError: '🍀 Mejor no dejarlo en manos de la suerte 😄' },
    ],
  },
};

export default function MiniRetoPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [acertado, setAcertado] = useState(false);
  const [shaking, setShaking] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const nivel = (usuario?.nivel as 1 | 2 | 3) ?? 1;
  const { pregunta, opciones } = PREGUNTAS[nivel] ?? PREGUNTAS[1];

  useEffect(() => {
    if (!shaking) return;
    const timer = setTimeout(() => setShaking(null), 400);
    return () => clearTimeout(timer);
  }, [shaking]);

  const handleSelect = (opcion: Opcion) => {
  if (acertado) return;

  if (opcion.correcta) {
    setAcertado(true);
    setMensajeError(null);
    setTimeout(() => {
      router.push('/app/onboarding/resumen');
    }, 900);
  } else {
    setShaking(opcion.value);
    setMensajeError(opcion.mensajeError);
  }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '1.5rem' }}>
      <style>{`
        @keyframes shakeCard {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>

      <main style={{ background: 'white', borderRadius: 20, padding: '2.25rem 2rem', width: '100%', maxWidth: 420 }}>

        <header style={{ marginBottom: 22, textAlign: 'center' }}>
          <Logo />

          <div style={{ marginTop: 12, marginBottom: 14 }}>
            <div style={{ height: 4, width: '100%', background: '#E5E7EB', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: '80%', height: '100%', background: '#1F7CFF', borderRadius: 999, transition: 'width 0.4s' }} />
            </div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 6 }}>
              Paso 4 de 5
            </div>
          </div>

          <h1 style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 4px' }}>
            Una última pregunta
          </h1>
          <p style={{ fontSize: 13, color: TEXT_SECONDARY, margin: '0 0 10px' }}>
            Antes de empezar, vamos a ponerte a prueba 👀
          </p>
          <p style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, margin: 0 }}>
            {pregunta}
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {opciones.map((opcion) => {
            const esCorrectaYaAcertada = acertado && opcion.correcta;

            return (
              <button
                key={opcion.value}
                onClick={() => handleSelect(opcion)}
                disabled={acertado}
                style={{
                  width: '100%', textAlign: 'left', padding: '13px 14px',
                  borderRadius: 12,
                  border: esCorrectaYaAcertada ? '2px solid #16A34A' : '1px solid #F1F5F9',
                  background: esCorrectaYaAcertada ? '#F0FDF4' : 'white',
                  cursor: acertado ? 'default' : 'pointer',
                  display: 'flex', gap: 12, alignItems: 'center',
                  animation: shaking === opcion.value ? 'shakeCard 0.4s ease' : 'none',
                  transition: 'border-color 0.2s ease, background 0.2s ease',
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
                  {opcion.icon}
                </div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{opcion.title}</div>
                {esCorrectaYaAcertada && <Check size={16} color="#16A34A" />}
              </button>
            );
          })}
        </div>

        {mensajeError && !acertado && (
          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: TEXT_SECONDARY }}>
            {mensajeError}
          </div>
        )}
      </main>
    </div>
  );
}