'use client';

// ⭐ Pantalla de carga de Oplora: el logo completo (pincelada + nombre) "respirando" suavemente
// y una barrita debajo que se desliza, para que se note que está cargando y no parezca congelado.
// Aparece con un fundido corto para no dar un fogonazo en las cargas rápidas.

import LogoOplora, { COLOR_MARCA } from '@/components/marca/LogoOplora';
import { BG_DASHBOARD } from '@/styles/tokens';

export default function CargaOplora({ texto, fondo = BG_DASHBOARD }: { texto?: string; fondo?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={texto ?? 'Cargando'}
      style={{ minHeight: '100vh', background: fondo, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, animation: 'oplora-carga-entrar 0.35s ease both' }}
    >
      <style>{`
        @keyframes oplora-carga-entrar { from { opacity: 0; } to { opacity: 1; } }
        @keyframes oplora-carga-respirar { 0%, 100% { opacity: 0.35; transform: scale(0.985); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes oplora-carga-barra { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }
        @media (prefers-reduced-motion: reduce) {
          .oplora-carga-logo, .oplora-carga-seg { animation: none !important; }
        }
      `}</style>
      <div className="oplora-carga-logo" style={{ animation: 'oplora-carga-respirar 1.8s ease-in-out infinite' }}>
        <LogoOplora alto={40} />
      </div>
      <div style={{ width: 96, height: 4, borderRadius: 999, background: 'rgba(31,124,255,0.15)', overflow: 'hidden' }}>
        <div className="oplora-carga-seg" style={{ width: '40%', height: '100%', borderRadius: 999, background: COLOR_MARCA, animation: 'oplora-carga-barra 1.2s ease-in-out infinite' }} />
      </div>
      {texto && <div style={{ fontSize: 13, color: '#6B7280', marginTop: -8 }}>{texto}</div>}
    </div>
  );
}
