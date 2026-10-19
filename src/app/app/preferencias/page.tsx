'use client';

// ⭐ Notificaciones y avisos (desde Perfil: son de la cuenta, no de la convocatoria).
// - Retos al azar: si otros opositores de tu convocatoria pueden retarte sin conocerte (activado por defecto).
// - Avisos de la Liga Oplora.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Shuffle, Bell, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useMiLiga } from '@/components/liga/TarjetaLiga';
import AvisosLiga from '@/components/liga/AvisosLiga';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, BG_NEUTRAL, COLOR_RETOS, COLOR_RETOS_BG } from '@/styles/tokens';

const SOMBRA = '0 6px 18px rgba(15, 23, 42, 0.08)';

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 8, padding: '0 4px' }}>{titulo}</div>
      {children}
    </section>
  );
}

function Interruptor({ activo, onClick, etiqueta }: { activo: boolean; onClick: () => void; etiqueta: string }) {
  return (
    <button
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      onClick={onClick}
      style={{ width: 46, height: 28, borderRadius: 999, border: 'none', padding: 3, background: activo ? '#16A34A' : '#CBD5E1', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
    >
      <span style={{ display: 'block', width: 22, height: 22, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transform: activo ? 'translateX(18px)' : 'none', transition: 'transform 0.2s' }} />
    </button>
  );
}

export default function PreferenciasPage() {
  const router = useRouter();
  const { usuario, actualizarUsuario } = useAuth();
  const { data, isLoading } = useMiLiga(!!usuario);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  if (!usuario) return null;

  const retosAzar = (usuario as any).recibirRetosAleatorios !== false;

  const cambiarRetosAzar = async () => {
    const nuevo = !retosAzar;
    setGuardando(true);
    setError('');
    actualizarUsuario({ recibirRetosAleatorios: nuevo } as any);
    try {
      const res = await api.patch('/usuarios/preferencias', { recibirRetosAleatorios: nuevo });
      actualizarUsuario({ recibirRetosAleatorios: res.data?.recibirRetosAleatorios ?? nuevo } as any);
    } catch {
      actualizarUsuario({ recibirRetosAleatorios: !nuevo } as any);
      setError('No se ha podido guardar. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: BG_NEUTRAL, paddingBottom: 40 }}>
      <style>{`@keyframes oplora-girar { to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
          <button
            onClick={() => router.push('/app/perfil')}
            aria-label="Volver a Perfil"
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'white', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={18} color={TEXT_PRIMARY} />
          </button>
          <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>Notificaciones y avisos</div>
        </div>

        <Seccion titulo="Retos">
          <div style={{ background: 'white', borderRadius: 18, boxShadow: SOMBRA, padding: 14, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: COLOR_RETOS_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shuffle size={19} color={COLOR_RETOS} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>Recibir retos al azar</div>
              <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2, lineHeight: 1.45 }}>
                Otros opositores de tu convocatoria podrán retarte aunque no te conozcan. Como mucho 3 al día.
              </div>
              {error && <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 6 }}>{error}</div>}
            </div>
            {guardando
              ? <Loader2 size={20} color={TEXT_MUTED} style={{ animation: 'oplora-girar 0.8s linear infinite', marginTop: 4 }} />
              : <Interruptor activo={retosAzar} onClick={cambiarRetosAzar} etiqueta="Recibir retos al azar" />}
          </div>
        </Seccion>

        <Seccion titulo="Liga Oplora">
          {isLoading && (
            <div style={{ background: 'white', borderRadius: 18, boxShadow: SOMBRA, padding: 14, fontSize: 13, color: TEXT_MUTED }}>Cargando…</div>
          )}
          {data?.liga && <AvisosLiga avisos={data.avisos} titulo={null} />}
          {data && !data.liga && (
            <div style={{ background: 'white', borderRadius: 18, boxShadow: SOMBRA, padding: 14, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5 }}>
              Podrás configurar los avisos de la Liga cuando entres en la liga de tu convocatoria.
            </div>
          )}
        </Seccion>

        <button
          onClick={() => router.push('/app/alertas')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'white', border: 'none', borderRadius: 18, boxShadow: SOMBRA, cursor: 'pointer', textAlign: 'left' }}
        >
          <span style={{ width: 40, height: 40, borderRadius: 12, background: '#FDF8E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bell size={19} color="#CA8A04" />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>Tus alertas</div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>Retos, liga y avisos recibidos</div>
          </div>
          <ChevronRight size={16} color="#C4C9D2" />
        </button>
      </div>
    </div>
  );
}
