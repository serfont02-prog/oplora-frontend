'use client';

// ⭐ Cabecera común de las pantallas que cuelgan de Practicar: botón redondo de volver, antetítulo,
// título y (opcional) avatar. Misma que Flashcards y Psicotécnicos.

import { ArrowLeft } from 'lucide-react';
import { AvatarPerfil } from '@/components/AvatarUsuarioPerfil';
import { TEXT_PRIMARY, TEXT_MUTED } from '@/styles/tokens';

export const SOMBRA = '0 6px 18px rgba(15, 23, 42, 0.08)';

export default function CabeceraPractica({ eyebrow, titulo, onVolver, usuario, onPerfil }: {
  eyebrow: string; titulo: string; onVolver: () => void; usuario?: any; onPerfil?: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
      <button
        onClick={onVolver}
        aria-label="Volver"
        style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'white', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
      >
        <ArrowLeft size={18} color={TEXT_PRIMARY} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{eyebrow}</div>
        <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>{titulo}</div>
      </div>
      {usuario && onPerfil && (
        <button
          onClick={onPerfil}
          aria-label="Mi perfil"
          style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', overflow: 'visible', flexShrink: 0 }}
        >
          <AvatarPerfil usuario={usuario} size={44} />
        </button>
      )}
    </div>
  );
}
