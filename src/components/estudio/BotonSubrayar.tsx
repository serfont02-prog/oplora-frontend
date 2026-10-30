'use client';

// ⭐ Botón "Subrayar" flotando sobre el texto seleccionado (apuntes y artículos).
// En el móvil la selección la hace la propia app (useSeleccionTactil), así que ya no aparece
// el menú de Chrome encima y el botón vuelve a estar junto al texto, con una ✕ para cancelar.
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
  /** x: centro de la selección; y: borde superior de la selección (coordenadas de pantalla). */
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

  // Encima de la selección; si no cabe (muy arriba), debajo. Sin salirse por los lados.
  const ancho = typeof window !== 'undefined' ? window.innerWidth : 400;
  const x = Math.min(Math.max(menu.x, 80), ancho - 80);
  const top = menu.y > 70 ? menu.y - (tactil ? 56 : 46) : menu.y + 34;

  return (
    <div
      data-menu-subrayado
      style={{
        position: 'fixed', left: x, top, transform: 'translateX(-50%)', zIndex: 70,
        display: 'flex', alignItems: 'center', gap: 2, background: 'var(--c-primario)', borderRadius: 999,
        boxShadow: '0 6px 18px rgba(15,23,42,0.28)', padding: 2, animation: 'oplora-aparecer-subrayar .14s ease-out',
      }}
    >
      <style>{`@keyframes oplora-aparecer-subrayar { from { transform: translate(-50%, 6px); opacity: .4 } to { transform: translate(-50%, 0); opacity: 1 } }`}</style>
      <button
        onPointerDown={pulsar(onSubrayar)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', color: 'var(--c-primario-texto)', border: 'none',
          borderRadius: 999, padding: tactil ? '10px 16px' : '6px 12px', fontSize: tactil ? 14 : 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <Highlighter size={tactil ? 16 : 14} /> Subrayar
      </button>
      {tactil && (
        <button
          onPointerDown={pulsar(onCancelar)}
          aria-label="Cancelar subrayado"
          style={{ width: 38, height: 38, borderRadius: 999, border: 'none', background: 'none', color: 'var(--c-primario-texto)', opacity: 0.75, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
