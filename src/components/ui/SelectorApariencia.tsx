'use client';

// ⭐ Selector de apariencia: Claro / Oscuro / Automático (sigue al modo del móvil).
// La elección se guarda en este dispositivo.

import { Sun, Moon, Smartphone } from 'lucide-react';
import { useTema, type PreferenciaTema } from '@/lib/tema';

const OPCIONES: { valor: PreferenciaTema; etiqueta: string; Icono: any }[] = [
  { valor: 'claro', etiqueta: 'Claro', Icono: Sun },
  { valor: 'oscuro', etiqueta: 'Oscuro', Icono: Moon },
  { valor: 'auto', etiqueta: 'Automático', Icono: Smartphone },
];

export default function SelectorApariencia() {
  const { preferencia, cambiar } = useTema();
  return (
    <div role="radiogroup" aria-label="Apariencia" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: 10 }}>
      {OPCIONES.map(({ valor, etiqueta, Icono }) => {
        const activo = preferencia === valor;
        return (
          <button
            key={valor}
            role="radio"
            aria-checked={activo}
            onClick={() => cambiar(valor)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 6px',
              borderRadius: 14, cursor: 'pointer',
              border: activo ? '1.5px solid var(--c-azul)' : '1px solid var(--c-borde)',
              background: activo ? 'var(--c-azul-bg)' : 'var(--c-superficie)',
              color: activo ? 'var(--c-azul)' : 'var(--c-texto-2)',
              fontSize: 12, fontWeight: 700,
            }}
          >
            <Icono size={19} />
            {etiqueta}
          </button>
        );
      })}
    </div>
  );
}
