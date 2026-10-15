'use client';

// ⭐ Carga del test con el mismo estilo que el resto de Practicar.

import { ClipboardCheck } from 'lucide-react';
import { BG_DASHBOARD as BG_APP, TEXT_PRIMARY, TEXT_MUTED } from '@/styles/tokens';

type Props = {
  total: number;
  texto?: string;
};

export default function CargandoTest({ total, texto = 'Preparando test…' }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: BG_APP, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
      <div style={{ position: 'relative', width: 72, height: 72, borderRadius: '50%', background: 'white', boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="op-spin" style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '3px solid #EEF0F3', borderTopColor: '#4D7C0F' }} />
        <ClipboardCheck size={24} color="#4D7C0F" />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY }}>{texto}</div>
      <div style={{ fontSize: 13, color: TEXT_MUTED, textAlign: 'center', lineHeight: 1.6 }}>
        {total > 0 ? `${total} preguntas · ` : ''}Esto puede tardar unos segundos
      </div>
      <style jsx>{`
        .op-spin { animation: opspin 0.9s linear infinite; }
        @keyframes opspin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
