'use client';

// ⭐ Liga Oplora — clasificaciones a pantalla completa: mensual (por división y mes), general
// de la liga y la de la jornada actual. Acepta ?tab=mensual|general|jornada.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { FooterNavegacion } from '@/app/app/dashboard/page';
import { useMiLiga } from '@/components/liga/TarjetaLiga';
import { COLOR_LIGA, mensajeError } from '@/components/liga/ligaUtils';
import { Caja, ClasificacionMensual, ClasificacionGeneral, ClasificacionJornada } from '@/components/liga/Clasificaciones';

const TEXT_PRIMARY = '#111827';
const TEXT_MUTED = '#6B7280';
const BG_APP = '#FCEEE8';

type Tab = 'mensual' | 'general' | 'jornada';

export default function ClasificacionesLigaPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const oposicionId = (usuario as any)?.oposicionActiva?.id;
  const { data, isLoading, error } = useMiLiga(!!usuario);
  const [tab, setTab] = useState<Tab>('mensual');

  useEffect(() => {
    try {
      const t = new URLSearchParams(window.location.search).get('tab');
      if (t === 'mensual' || t === 'general' || t === 'jornada') setTab(t);
    } catch { /* sin query */ }
  }, []);

  if (!usuario) return null;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 90 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => router.push('/app/liga')}
            aria-label="Volver"
            style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={17} color={TEXT_PRIMARY} />
          </button>
          <div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Liga Oplora{data?.convocatoria?.anyo ? ` · Convocatoria ${data.convocatoria.anyo}` : ''}
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>Clasificaciones</div>
          </div>
        </div>

        {isLoading && <Caja><div style={{ fontSize: 13, color: TEXT_MUTED }}>Cargando…</div></Caja>}
        {error && <Caja><div style={{ fontSize: 13, color: '#B91C1C' }}>{mensajeError(error, 'No se ha podido cargar la liga')}</div></Caja>}
        {data && !data.liga && (
          <Caja><div style={{ fontSize: 13, color: TEXT_MUTED }}>Todavía no participas en ninguna liga.</div></Caja>
        )}

        {data?.liga && (
          <>
            <div style={{ display: 'flex', background: 'white', borderRadius: 12, padding: 4, gap: 4, position: 'sticky', top: 8, zIndex: 5, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {([
                ['mensual', 'Mensual'],
                ['general', 'General'],
                ['jornada', 'Jornada'],
              ] as [Tab, string][]).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  style={{
                    flex: 1, border: 'none', borderRadius: 9, padding: '9px 0', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700,
                    background: tab === k ? COLOR_LIGA : 'transparent',
                    color: tab === k ? 'white' : TEXT_MUTED,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'mensual' && <ClasificacionMensual miDivision={data.division} />}
            {tab === 'general' && <ClasificacionGeneral />}
            {tab === 'jornada' && <ClasificacionJornada jornada={data.jornada} />}
          </>
        )}
      </div>

      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} activo="retos" />
    </div>
  );
}
