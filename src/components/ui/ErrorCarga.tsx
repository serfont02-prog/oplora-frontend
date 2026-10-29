'use client';

// ⭐ Estado de error común: antes unas 20 pantallas se quedaban vacías (o cargando para siempre)
// si fallaba una petición. Tarjeta con el mensaje, "Reintentar" y, si se quiere, "Volver".

import { useRouter } from 'next/navigation';
import { WifiOff, RotateCw, ArrowLeft } from 'lucide-react';
import { TEXT_PRIMARY, TEXT_SECONDARY, BG_NEUTRAL } from '@/styles/tokens';

export default function ErrorCarga({
  titulo = 'No se ha podido cargar',
  texto = 'Revisa tu conexión y vuelve a intentarlo.',
  onReintentar,
  pantalla = false,
  volver = true,
  fondo = BG_NEUTRAL,
}: {
  titulo?: string;
  texto?: string;
  onReintentar?: () => void;
  /** Ocupa toda la pantalla (para cuando falla la carga principal). */
  pantalla?: boolean;
  /** Muestra "Volver" (solo a pantalla completa). */
  volver?: boolean;
  fondo?: string;
}) {
  const router = useRouter();
  const tarjeta = (
    <div
      role="alert"
      style={{
        background: 'var(--c-superficie)', borderRadius: 18, boxShadow: 'var(--c-sombra)', padding: '22px 18px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, width: '100%', boxSizing: 'border-box',
      }}
    >
      <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--c-superficie-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <WifiOff size={22} color={TEXT_SECONDARY} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginTop: 4 }}>{titulo}</div>
      <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5, maxWidth: 320 }}>{texto}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, width: '100%', maxWidth: 320 }}>
        {pantalla && volver && (
          <button
            onClick={() => (window.history.length > 1 ? router.back() : router.push('/app/dashboard'))}
            style={{ flex: 1, height: 46, border: 'none', borderRadius: 12, background: 'var(--c-superficie-2)', color: TEXT_PRIMARY, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <ArrowLeft size={16} /> Volver
          </button>
        )}
        {onReintentar && (
          <button
            onClick={onReintentar}
            style={{ flex: 1, height: 46, border: 'none', borderRadius: 12, background: 'var(--c-primario)', color: 'var(--c-primario-texto)', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <RotateCw size={16} /> Reintentar
          </button>
        )}
      </div>
    </div>
  );
  if (!pantalla) return tarjeta;
  return (
    <div style={{ minHeight: '100vh', background: fondo, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>{tarjeta}</div>
    </div>
  );
}
