'use client';

// ⭐ Piezas del onboarding con el diseño de la app (mismo fondo, logo y tarjeta que login/registro):
// barra de progreso por pasos, tarjetas de opción con icono lucide en caja de color y estado
// seleccionado con check.

import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import LogoOplora, { COLOR_MARCA } from '@/components/marca/LogoOplora';
import { BG_DASHBOARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '@/styles/tokens';
import { SOMBRA } from '@/components/auth/PantallaAuth';

export const PASOS_ONBOARDING = 5;

export function PantallaOnboarding({
  paso,
  titulo,
  subtitulo,
  atras,
  children,
}: {
  /** Paso actual (1..5). Sin paso no se muestra la barra. */
  paso?: number;
  titulo?: React.ReactNode;
  subtitulo?: React.ReactNode;
  /** Ruta del paso anterior: muestra el botón redondo de volver. */
  atras?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG_DASHBOARD,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.25rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes oplora-girar { to { transform: rotate(360deg); } }
        @keyframes oplora-temblar { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
        @keyframes oplora-aparecer { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>
      <div aria-hidden style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: 'rgba(31,124,255,0.10)', top: -160, right: -140 }} />
      <div aria-hidden style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'color-mix(in srgb, var(--c-superficie) 65%, transparent)', bottom: -120, left: -110 }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, minHeight: 38, position: 'relative' }}>
          {atras && (
            <button
              onClick={() => router.push(atras)}
              aria-label="Volver al paso anterior"
              style={{ position: 'absolute', left: 0, width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ArrowLeft size={18} color={TEXT_PRIMARY} />
            </button>
          )}
          <LogoOplora alto={38} />
        </div>

        <main style={{ background: 'var(--c-superficie)', borderRadius: 24, boxShadow: SOMBRA, padding: '22px 20px 22px', animation: 'oplora-aparecer 0.3s ease' }}>
          {paso != null && <BarraPasos paso={paso} />}
          {(titulo || subtitulo) && (
            <header style={{ marginBottom: 16 }}>
              {titulo && <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.3 }}>{titulo}</h1>}
              {subtitulo && <p style={{ fontSize: 13, color: TEXT_SECONDARY, margin: '4px 0 0', lineHeight: 1.5 }}>{subtitulo}</p>}
            </header>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

export function BarraPasos({ paso, total = PASOS_ONBOARDING }: { paso: number; total?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ flex: 1, height: 5, borderRadius: 999, background: i < paso ? COLOR_MARCA : 'var(--hx-e5e7eb)', transition: 'background 0.3s' }} />
      ))}
      <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, marginLeft: 4, flexShrink: 0 }}>{paso} de {total}</span>
    </div>
  );
}

type Icono = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

/** Tarjeta de opción: icono en caja de color + título + subtítulo + chevron/check. */
export function OpcionOnboarding({
  icono: IconoOpcion,
  etiquetaCaja,
  color = COLOR_MARCA,
  fondo = 'var(--hx-eaf0ff)',
  titulo,
  subtitulo,
  seleccionada = false,
  atenuada = false,
  correcta = false,
  temblar = false,
  onClick,
  disabled,
}: {
  icono?: Icono;
  /** Texto corto en lugar del icono (p. ej. "A1"). */
  etiquetaCaja?: string;
  color?: string;
  fondo?: string;
  titulo: React.ReactNode;
  subtitulo?: React.ReactNode;
  seleccionada?: boolean;
  atenuada?: boolean;
  /** Variante verde para el mini reto. */
  correcta?: boolean;
  temblar?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const acento = correcta ? 'var(--hx-16a34a)' : COLOR_MARCA;
  const activa = seleccionada || correcta;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '12px 12px',
        borderRadius: 16,
        border: `2px solid ${activa ? acento : 'var(--hx-eef0f3)'}`,
        background: activa ? (correcta ? 'var(--hx-f0fdf4)' : 'var(--hx-f5f8ff)') : 'var(--c-superficie)',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        opacity: atenuada ? 0.45 : 1,
        transform: activa ? 'scale(1.01)' : 'none',
        animation: temblar ? 'oplora-temblar 0.4s ease' : 'none',
        transition: 'transform 0.2s ease, opacity 0.2s ease, background 0.2s ease, border-color 0.2s ease',
      }}
    >
      <span style={{ width: 42, height: 42, borderRadius: 12, background: fondo, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 800, color }}>
        {IconoOpcion ? <IconoOpcion size={20} color={color} /> : etiquetaCaja}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: activa ? acento : TEXT_PRIMARY, lineHeight: 1.35 }}>{titulo}</span>
        {subtitulo && <span style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginTop: 2, lineHeight: 1.4 }}>{subtitulo}</span>}
      </span>
      {activa ? <Check size={17} color={acento} /> : <ChevronRight size={17} color="var(--hx-c4c9d2)" />}
    </button>
  );
}

export function ListaOpciones({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>;
}
