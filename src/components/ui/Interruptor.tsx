'use client';

// ⭐ Interruptor único de la app (avisos, retos al azar, Liga…): mismo tamaño y colores en todas partes.
// Activado = azul de la marca; desactivado = gris.

export const INTERRUPTOR_ON = '#1F7CFF';
export const INTERRUPTOR_OFF = '#CBD5E1';

export default function Interruptor({
  activo,
  onCambiar,
  etiqueta,
  deshabilitado = false,
}: {
  activo: boolean;
  onCambiar: (nuevo: boolean) => void;
  etiqueta: string;
  deshabilitado?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      disabled={deshabilitado}
      onClick={() => onCambiar(!activo)}
      style={{
        width: 46, height: 28, borderRadius: 999, border: 'none', padding: 3, flexShrink: 0,
        background: activo ? INTERRUPTOR_ON : INTERRUPTOR_OFF,
        cursor: deshabilitado ? 'default' : 'pointer', opacity: deshabilitado ? 0.6 : 1,
        transition: 'background 0.2s ease',
      }}
    >
      <span
        style={{
          display: 'block', width: 22, height: 22, borderRadius: '50%', background: 'white',
          boxShadow: '0 1px 3px rgba(15,23,42,0.25)',
          transform: activo ? 'translateX(18px)' : 'translateX(0)', transition: 'transform 0.2s ease',
        }}
      />
    </button>
  );
}
