'use client';

// ⭐ Preferencias de la app. De momento: avisos de la Liga Oplora.

import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useMiLiga } from '@/components/liga/TarjetaLiga';
import AvisosLiga from '@/components/liga/AvisosLiga';

const TEXT_PRIMARY = '#111827';
const TEXT_MUTED = '#6B7280';

export default function PreferenciasPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { data, isLoading } = useMiLiga(!!usuario);

  if (!usuario) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#F4F5F7', paddingBottom: 40 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => router.back()}
            aria-label="Volver"
            style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={17} color={TEXT_PRIMARY} />
          </button>
          <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>Preferencias</div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Avisos de la Liga Oplora
          </div>
          {isLoading && <div style={{ fontSize: 13, color: TEXT_MUTED }}>Cargando…</div>}
          {data?.liga && <AvisosLiga avisos={data.avisos} titulo={null} />}
          {data && !data.liga && (
            <div style={{ background: 'white', borderRadius: 16, padding: 14, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5, border: '1px solid #F1F5F9' }}>
              Podrás configurar los avisos cuando entres en la liga de tu convocatoria.
            </div>
          )}
        </div>

        <button
          onClick={() => router.push('/app/alertas')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, cursor: 'pointer', textAlign: 'left' }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>Tus alertas</div>
            <div style={{ fontSize: 11, color: TEXT_MUTED }}>Retos, liga y avisos recibidos</div>
          </div>
          <ChevronRight size={16} color="#D1D5DB" />
        </button>
      </div>
    </div>
  );
}
