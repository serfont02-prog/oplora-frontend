'use client';

// ⭐ Salir de un test / examen / entrenamiento desde abajo, sin tener que subir hasta la X.
// - BotonSalirTest: botón secundario para la barra inferior.
// - ConfirmacionInferior: hoja que sube desde abajo para confirmar (salir o entregar), visible
//   esté donde esté el usuario en la pantalla.

import { LogOut } from 'lucide-react';
import { TEXT_PRIMARY, TEXT_SECONDARY, SOMBRA } from '@/styles/tokens';

export function BotonSalirTest({ onClick, alto = 42, disabled }: { onClick: () => void; alto?: number; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label="Salir"
      style={{
        height: alto, padding: '0 14px', borderRadius: 12, border: 'none', boxShadow: SOMBRA, flexShrink: 0,
        background: 'var(--c-superficie)', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}
    >
      <LogOut size={15} /> Salir
    </button>
  );
}

export function ConfirmacionInferior({
  abierta, titulo, texto, textoConfirmar = 'Salir', peligro = true, onCancelar, onConfirmar, textoCancelar = 'Seguir',
}: {
  abierta: boolean; titulo: string; texto?: string; textoConfirmar?: string; peligro?: boolean;
  onCancelar: () => void; onConfirmar: () => void; textoCancelar?: string;
}) {
  if (!abierta) return null;
  return (
    <div
      onClick={onCancelar}
      style={{ position: 'fixed', inset: 0, background: 'var(--c-overlay)', zIndex: 90, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560, background: 'var(--c-superficie)', borderRadius: '22px 22px 0 0',
          padding: '18px 1.25rem', paddingBottom: 'calc(18px + env(safe-area-inset-bottom))',
          boxShadow: '0 -8px 30px rgba(15,23,42,0.18)', animation: 'oplora-subir .18s ease-out',
        }}
      >
        <style>{`@keyframes oplora-subir { from { transform: translateY(24px); opacity: .6 } to { transform: none; opacity: 1 } }`}</style>
        <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--c-borde)', margin: '0 auto 14px' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>{titulo}</div>
        {texto && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4, lineHeight: 1.5 }}>{texto}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            onClick={onCancelar}
            style={{ flex: 1, height: 48, border: 'none', background: 'var(--c-superficie-2)', color: TEXT_PRIMARY, borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            {textoCancelar}
          </button>
          <button
            onClick={onConfirmar}
            style={{
              flex: 1, height: 48, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              background: peligro ? '#DC2626' : 'var(--c-primario)', color: peligro ? 'white' : 'var(--c-primario-texto)',
            }}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
