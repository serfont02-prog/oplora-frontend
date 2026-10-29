'use client';

// ⭐ Botón "Subrayar" para apuntes y artículos.
// En el móvil, el menú del sistema (Copiar, Seleccionar todo…) aparece encima del texto
// seleccionado y tapaba el botón de la app. Por eso, en pantallas táctiles el botón va en una
// barra fija abajo (encima de la navegación) y en el ordenador sigue flotando sobre la selección.
// Actúa al pulsar (pointerdown) para no perder la selección antes de guardarla.

import { useEffect, useState } from 'react';
import { Highlighter, X } from 'lucide-react';

export function esPantallaTactil(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
}

export default function BotonSubrayar({
  menu,
  onSubrayar,
  onCancelar,
}: {
  menu: { x: number; y: number } | null;
  onSubrayar: () => void;
  onCancelar: () => void;
}) {
  const [tactil, setTactil] = useState(false);
  useEffect(() => setTactil(esPantallaTactil()), []);
  if (!menu) return null;

  const pulsar = (accion: () => void) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    accion();
  };

  if (tactil) {
    return (
      <div
        data-menu-subrayado
        style={{
          position: 'fixed', left: 12, right: 12, bottom: 'calc(76px + env(safe-area-inset-bottom))', zIndex: 70,
          maxWidth: 520, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--c-superficie)', borderRadius: 16, padding: 8, boxShadow: '0 8px 28px rgba(15,23,42,0.22)',
          animation: 'oplora-subir-subrayar .16s ease-out',
        }}
      >
        <style>{`@keyframes oplora-subir-subrayar { from { transform: translateY(12px); opacity: .5 } to { transform: none; opacity: 1 } }`}</style>
        <button
          onPointerDown={pulsar(onSubrayar)}
          style={{ flex: 1, height: 46, border: 'none', borderRadius: 12, background: 'var(--c-primario)', color: 'var(--c-primario-texto)', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Highlighter size={17} /> Subrayar selección
        </button>
        <button
          onPointerDown={pulsar(onCancelar)}
          aria-label="Cancelar subrayado"
          style={{ width: 46, height: 46, border: 'none', borderRadius: 12, background: 'var(--c-superficie-2)', color: 'var(--c-texto-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div data-menu-subrayado style={{ position: 'fixed', left: menu.x, top: menu.y, transform: 'translateX(-50%)', zIndex: 50 }}>
      <button
        onPointerDown={pulsar(onSubrayar)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--c-primario)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 999, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(15,23,42,0.25)', whiteSpace: 'nowrap' }}
      >
        <Highlighter size={14} /> Subrayar
      </button>
    </div>
  );
}
