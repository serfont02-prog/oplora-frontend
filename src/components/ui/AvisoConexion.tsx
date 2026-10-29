'use client';

// ⭐ Red de seguridad para toda la app: si una carga falla por la conexión o porque el servidor
// no responde (sin datos que enseñar), aparece un aviso arriba con "Reintentar", en vez de
// dejar huecos vacíos sin explicación. Reintenta solo lo que falló.

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { WifiOff, RotateCw, X } from 'lucide-react';

export const EVENTO_ERROR_CARGA = 'oplora:error-carga';

export default function AvisoConexion() {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);
  const [reintentando, setReintentando] = useState(false);

  useEffect(() => {
    const mostrar = () => setVisible(true);
    window.addEventListener(EVENTO_ERROR_CARGA, mostrar);
    return () => window.removeEventListener(EVENTO_ERROR_CARGA, mostrar);
  }, []);

  if (!visible) return null;

  const reintentar = async () => {
    setReintentando(true);
    await queryClient.refetchQueries({ type: 'active', predicate: (q) => q.state.status === 'error' });
    setReintentando(false);
    const siguenMal = queryClient.getQueryCache().findAll({ type: 'active' }).some((q) => q.state.status === 'error');
    if (!siguenMal) setVisible(false);
  };

  return (
    <div
      role="alert"
      style={{
        position: 'fixed', top: 'calc(10px + env(safe-area-inset-top))', left: 12, right: 12, zIndex: 9998,
        maxWidth: 520, margin: '0 auto', background: 'var(--c-hero, #0f172a)', color: 'white', borderRadius: 14,
        padding: '10px 10px 10px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(15,23,42,0.25)',
        fontSize: 13,
      }}
    >
      <WifiOff size={18} style={{ flexShrink: 0, opacity: 0.85 }} />
      <span style={{ flex: 1, lineHeight: 1.35 }}>No se ha podido cargar parte de la pantalla.</span>
      <button
        onClick={reintentar}
        disabled={reintentando}
        style={{ height: 36, padding: '0 12px', borderRadius: 10, border: 'none', background: 'white', color: '#0f172a', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
      >
        <RotateCw size={14} style={{ animation: reintentando ? 'oplora-girar 0.8s linear infinite' : undefined }} /> Reintentar
      </button>
      <button onClick={() => setVisible(false)} aria-label="Cerrar aviso" style={{ width: 36, height: 36, border: 'none', background: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <X size={16} />
      </button>
      <style>{`@keyframes oplora-girar { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
