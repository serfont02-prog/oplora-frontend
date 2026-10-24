'use client';

// ⭐ Invitar a un amigo (desde Ajustes). Mismo formulario que se usa al retar a alguien que no está.

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import FormInvitar from '@/components/invitar/FormInvitar';
import { BG_NEUTRAL, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, COLOR_RETOS, COLOR_RETOS_BG } from '@/styles/tokens';

const SOMBRA = 'var(--c-sombra)';
const TIPO: Record<string, string> = { app: 'Invitado a OPLORA', oposicion: 'Invitado a tu oposición', convocatoria: 'Avisado de tu convocatoria' };

export default function InvitarPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const oposicion = usuario?.oposicionActiva;

  const { data: enviadas = [] } = useQuery({
    queryKey: ['invitaciones-mias'],
    queryFn: async () => (await api.get('/invitaciones/mias')).data,
    enabled: !!usuario,
  });

  if (!usuario) return null;

  return (
    <div style={{ minHeight: '100vh', background: BG_NEUTRAL, paddingBottom: 40 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
          <button
            onClick={() => (oposicion?.id ? router.push(`/app/oposicion/${oposicion.id}/ajustes`) : router.back())}
            aria-label="Volver"
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={18} color={TEXT_PRIMARY} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Ajustes</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>Invitar a un amigo</div>
          </div>
        </div>

        <div style={{ background: 'var(--c-superficie)', borderRadius: 18, padding: 16, boxShadow: SOMBRA, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: COLOR_RETOS_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={22} color={COLOR_RETOS} />
          </div>
          <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
            Preparad juntos {oposicion?.nombre ? <strong style={{ color: TEXT_PRIMARY }}>{oposicion.nombre}</strong> : 'la oposición'} y retaos en test, flashcards y psicotécnicos.
          </div>
        </div>

        <FormInvitar oposicionId={oposicion?.id} oposicionNombre={oposicion?.nombre} motivo="amigo" />

        {enviadas.length > 0 && (
          <section>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 8, padding: '0 4px' }}>Invitaciones enviadas</div>
            <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
              {enviadas.map((i: any, k: number) => (
                <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: k < enviadas.length - 1 ? '1px solid var(--hx-eef0f3)' : 'none' }}>
                  <Mail size={16} color={TEXT_MUTED} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{i.email}</div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED }}>{TIPO[i.tipo] ?? 'Invitado'}</div>
                  </div>
                  <span style={{ fontSize: 11, color: TEXT_MUTED }}>{new Date(i.creadoEn).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
