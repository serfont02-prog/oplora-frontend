'use client';

import { useState } from 'react';
import { RotateCw } from 'lucide-react';

const BG_APP = '#EAF0FF';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

const flashcards = [
  {
    id: 1,
    front: '¿Cómo funcionan los tests?',
    back: 'Cada test tiene preguntas aleatorias del temario. Responde y aprende con explicaciones claras.',
  },
  {
    id: 2,
    front: '¿Qué son los puntos?',
    back: 'Ganas puntos al acertar preguntas. Subes de nivel y desbloqueas contenido.',
  },
  {
    id: 3,
    front: '¿Qué es el nivel?',
    back: 'Tu nivel determina la dificultad de los tests. Empiezas en nivel 1 y vas subiendo.',
  },
  {
    id: 4,
    front: '¿Qué pasa si fallo?',
    back: 'Nada. Aprenderás más rápido. Cada fallo te enseña algo nuevo.',
  },
];

type Props = {
  onFinish: () => void;
};

export default function OnboardingFlashcards({ onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  const card = flashcards[index];

  const next = () => {
    if (index === flashcards.length - 1) {
      onFinish();
      return;
    }
    setIndex(index + 1);
    setShowBack(false);
  };

  return (
    <main style={{ minHeight: '100vh', background: BG_APP, padding: '1.25rem 1.25rem 96px' }}>
      <section style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Flashcards
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>
            Conceptos clave de OPLORA
          </div>
        </div>

        {/* Progreso */}
        <div style={{ display: 'flex', gap: 6 }}>
          {flashcards.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: 4, borderRadius: 999,
                background: i <= index ? '#1F7CFF' : '#E5E7EB',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        {/* Tarjeta */}
        <div
          onClick={() => setShowBack(!showBack)}
          style={{
            background: 'white', borderRadius: '18px', padding: '2rem 1.5rem',
            cursor: 'pointer', minHeight: 200,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
            border: '1px solid #F1F5F9', textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 17, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.5 }}>
            {showBack ? card.back : card.front}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: TEXT_MUTED, marginTop: 8 }}>
            <RotateCw size={12} />
            Toca para {showBack ? 'ver la pregunta' : 'ver la respuesta'}
          </div>
        </div>

        <button
          onClick={next}
          style={{
            width: '100%', padding: '14px 18px', borderRadius: '12px',
            background: '#111827', color: 'white', fontSize: 14, fontWeight: 700,
            border: 'none', cursor: 'pointer',
          }}
        >
          {index === flashcards.length - 1 ? 'Finalizar' : 'Siguiente'}
        </button>
      </section>
    </main>
  );
}