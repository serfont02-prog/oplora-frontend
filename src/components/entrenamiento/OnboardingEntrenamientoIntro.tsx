'use client';

import { Brain, CheckCircle2, Clock3, Layers3, Target, Zap } from 'lucide-react';

const BG_APP = '#EAF0FF';
const BG_WIDGET = '#F7F8FA';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

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
            <Zap size={12} />
            Práctica guiada
          </div>

          <h1 style={{ fontSize: 20, lineHeight: 1.25, fontWeight: 700, margin: 0 }}>
            Tu primer entrenamiento OPLORA
          </h1>

          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>
            En unos minutos verás cómo se entrena: preguntas cortas, corrección inmediata y repaso para convertir cada fallo en avance.
          </p>
        </div>

        {/* Métricas — widget gris con tarjetas blancas */}
        <div style={{ background: BG_WIDGET, borderRadius: '18px', padding: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <Metric icon={<Clock3 size={16} />} label="3 min" />
            <Metric icon={<Target size={16} />} label="5 preguntas" />
            <Metric icon={<CheckCircle2 size={16} />} label="Sin presión" />
          </div>
        </div>

        {/* Pasos — tarjeta plana única, sin cajas anidadas */}
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Step
            icon={<Brain size={18} />}
            title="Primero calibramos"
            text="Un mini test nos ayuda a entender tu punto de partida."
          />
          <Step
            icon={<Layers3 size={18} />}
            title="Luego repasas"
            text="Verás flashcards para fijar ideas clave sin saturarte."
          />
          <Step
            icon={<Target size={18} />}
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
    <div style={{
      minHeight: 68, borderRadius: '14px', background: 'white',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 6, color: TEXT_PRIMARY, fontSize: 12, fontWeight: 700,
    }}>
      <div style={{ color: '#1F7CFF' }}>{icon}</div>
      {label}
    </div>
  );
}

function Step({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '10px', background: '#EAF0FF', color: '#185FA5',
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