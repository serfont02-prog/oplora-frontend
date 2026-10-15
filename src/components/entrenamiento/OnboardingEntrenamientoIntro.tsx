'use client';

import { CheckCircle2, Clock3, ClipboardCheck, Layers, Target, Sparkles, Home } from 'lucide-react';
import { TEXT_PRIMARY, TEXT_SECONDARY, COLOR_FC, COLOR_FC_BG } from '@/styles/tokens';

const BG_APP = '#EAF0FF';
const SOMBRA = '0 6px 18px rgba(15, 23, 42, 0.08)';

export function OnboardingEntrenamientoIntro({ onNext }: { onNext: () => void }) {
  return (
    <main style={{ minHeight: '100vh', background: BG_APP, padding: '1.25rem 1.25rem 96px' }}>
      <section style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Hero — mismo estilo oscuro sólido que el resto de la app */}
        <div style={{ background: '#0f172a', borderRadius: '18px', padding: '20px 18px', color: 'white', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 999,
            background: 'rgba(255,255,255,0.1)', fontSize: 11, fontWeight: 700,
            width: 'fit-content',
          }}>
            <Sparkles size={12} />
            Práctica guiada
          </div>

          <h1 style={{ fontSize: 20, lineHeight: 1.25, fontWeight: 700, margin: 0 }}>
            Tu primer entrenamiento OPLORA
          </h1>

          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>
            En unos minutos verás cómo se entrena: preguntas cortas, corrección inmediata y repaso para convertir cada fallo en avance.
          </p>
        </div>

        {/* Métricas — círculos flotantes sobre el fondo, como en Inicio y Practicar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '4px 0' }}>
          <Metric icon={<Clock3 size={19} />} label="3 min" />
          <Metric icon={<Target size={19} />} label="5 preguntas" />
          <Metric icon={<CheckCircle2 size={19} />} label="Sin presión" />
        </div>

        {/* Pasos — tarjeta plana única, sin cajas anidadas */}
        <div style={{ background: 'white', borderRadius: '18px', padding: '16px', boxShadow: SOMBRA, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Step
            icon={<ClipboardCheck size={18} color="#4D7C0F" />}
            bg="#F3FAE9"
            title="Primero calibramos"
            text="Un mini test nos ayuda a entender tu punto de partida."
          />
          <Step
            icon={<Layers size={18} color={COLOR_FC} />}
            bg={COLOR_FC_BG}
            title="Luego repasas"
            text="Verás flashcards para fijar ideas clave sin saturarte."
          />
          <Step
            icon={<Home size={18} color="#1F7CFF" />}
            bg="#EAF0FF"
            title="Después cambia tu inicio"
            text="Cuando acabes, pasarás a estado activo y OPLORA te mostrará el entrenamiento diario."
          />
        </div>

        <button
          onClick={onNext}
          style={{
            width: '100%', border: 'none', borderRadius: '12px', padding: '14px 18px',
            background: '#111827', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Empezar
        </button>
      </section>
    </main>
  );
}

function Metric({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: TEXT_PRIMARY, fontSize: 12, fontWeight: 600 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'white', boxShadow: SOMBRA, color: '#1F7CFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      {label}
    </div>
  );
}

function Step({ icon, title, text, bg }: { icon: React.ReactNode; title: string; text: string; bg: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '10px', background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>{title}</div>
        <div style={{ fontSize: 12, lineHeight: 1.5, color: TEXT_SECONDARY, marginTop: 2 }}>{text}</div>
      </div>
    </div>
  );
}