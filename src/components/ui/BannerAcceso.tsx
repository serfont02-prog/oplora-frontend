'use client';

// ⭐ Aviso en Inicio del estado de acceso: días de prueba que quedan, o que sin suscripción
// solo está el Tema 1, o que el pago único termina en 5 días o menos.
// Con renovación automática, regalo o admin no se enseña nada.

import { useRouter } from 'next/navigation';
import { Crown, ChevronRight } from 'lucide-react';
import { useAcceso, diasHasta, TEMA_GRATIS } from '@/lib/acceso';
import { TEXT_PRIMARY, TEXT_MUTED, SOMBRA } from '@/styles/tokens';

export default function BannerAcceso() {
  const router = useRouter();
  const { acceso } = useAcceso();
  if (!acceso) return null;
  const finPago = acceso.motivo === 'pago' && !acceso.renovacionAutomatica ? diasHasta(acceso.accesoHasta) : null;
  if (finPago !== null && finPago <= 5) {
    return (
      <button onClick={() => router.push('/app/suscripciones')}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, cursor: 'pointer', textAlign: 'left',
          background: 'var(--c-superficie)', boxShadow: SOMBRA, border: finPago <= 1 ? '1.5px solid var(--hx-fde68a)' : '1px solid transparent',
        }}>
        <span style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--c-azul-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Crown size={18} color="var(--c-azul)" />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: TEXT_PRIMARY }}>
            {finPago <= 1 ? 'Tu acceso a OPLORA termina muy pronto' : `Tu acceso a OPLORA termina en ${finPago} días`}
          </span>
          <span style={{ display: 'block', fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>
            Renueva con tarjeta o Bizum: se suma al tiempo que te queda.
          </span>
        </span>
        <ChevronRight size={16} color="var(--c-chevron)" />
      </button>
    );
  }
  if (acceso.motivo !== 'prueba' && acceso.motivo !== 'gratis') return null;
  const dias = diasHasta(acceso.pruebaHasta);
  const enPrueba = acceso.motivo === 'prueba';
  return (
    <button onClick={() => router.push('/app/suscripciones')}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, cursor: 'pointer', textAlign: 'left',
        background: 'var(--c-superficie)', boxShadow: SOMBRA, border: enPrueba && dias <= 1 ? '1.5px solid var(--hx-fde68a)' : '1px solid transparent',
      }}>
      <span style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--c-azul-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Crown size={18} color="var(--c-azul)" />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: TEXT_PRIMARY }}>
          {enPrueba ? (dias <= 1 ? 'Tu prueba gratuita termina hoy' : `Prueba gratuita: te quedan ${dias} días`) : `Tienes gratis el Tema ${TEMA_GRATIS}`}
        </span>
        <span style={{ display: 'block', fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>
          {enPrueba ? 'Ahora tienes todo desbloqueado. Sigue con OPLORA desde 6,66 €/mes.' : 'Desbloquea todos los temas, simulacros y la Liga con OPLORA.'}
        </span>
      </span>
      <ChevronRight size={16} color="var(--c-chevron)" />
    </button>
  );
}
