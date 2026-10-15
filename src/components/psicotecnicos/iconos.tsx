'use client';

// ⭐ Iconos de las modalidades de psicotécnicos (lucide). Sustituyen a los emojis que manda el
// servidor en `icono`, para que todas las pantallas usen la misma familia de iconos.

import { Brain, Calculator, Type, Puzzle, Shapes, Eye, BrainCircuit, Cog, Zap, Compass, Shuffle } from 'lucide-react';
import { COLOR_PSICO, COLOR_PSICO_BG } from '@/styles/tokens';

export const ICONO_PSICO: Record<string, any> = {
  numerico: Calculator,
  verbal: Type,
  logico: Puzzle,
  espacial: Shapes,
  atencion: Eye,
  memoria: BrainCircuit,
  mecanico: Cog,
  velocidad_precision: Zap,
  personalidad: Compass,
  mixto: Shuffle,
};

export function IconoModalidad({ tipo, size = 40, color = COLOR_PSICO, bg = COLOR_PSICO_BG }: { tipo?: string; size?: number; color?: string; bg?: string }) {
  const Icon = (tipo && ICONO_PSICO[tipo]) || Brain;
  return (
    <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={Math.round(size * 0.5)} color={color} />
    </div>
  );
}
