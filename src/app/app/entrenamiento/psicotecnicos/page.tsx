'use client';

// ⭐ Psicotécnicos — mismo sistema que Practicar y Flashcards: vuelta a Practicar, estadísticas en
// círculos flotantes, tarjetas blancas con la sombra común y solo iconos lucide (Brain = psicotécnicos
// en toda la app; cada modalidad tiene el suyo en components/psicotecnicos/iconos).

import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { FooterNavegacion } from '@/app/app/dashboard/page';
import { AvatarPerfil } from '@/components/AvatarUsuarioPerfil';
import { IconoModalidad } from '@/components/psicotecnicos/iconos';
import { BG_DASHBOARD as BG_APP, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, COLOR_PSICO } from '@/styles/tokens';

const SOMBRA = 'var(--c-sombra)';
const BORDER = 'var(--hx-eef0f3)';

function Donut({ porcentaje, color, size, grosor }: { porcentaje: number; color: string; size: number; grosor: number }) {
  const radio = (size - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia - (Math.max(0, Math.min(100, porcentaje)) / 100) * circunferencia;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={radio} fill="none" stroke="var(--hx-eef0f3)" strokeWidth={grosor} />
      {porcentaje > 0 && (
        <circle cx={size / 2} cy={size / 2} r={radio} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round"
          strokeDasharray={circunferencia} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      )}
    </svg>
  );
}

function CirculoDato({ valor, porcentaje = 0, label, sub }: { valor: string; porcentaje?: number; label: string; sub: string }) {
  const D = 78;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <div style={{ position: 'relative', width: D, height: D, borderRadius: '50%', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 6 }}>
          <Donut porcentaje={porcentaje} color={COLOR_PSICO} size={D - 12} grosor={6} />
        </div>
        <span style={{ position: 'relative', fontSize: 16, fontWeight: 800, color: valor === '—' ? TEXT_MUTED : TEXT_PRIMARY }}>{valor}</span>
      </div>
      <span style={{ fontSize: 12, color: TEXT_PRIMARY, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
      <span style={{ fontSize: 10, color: TEXT_MUTED, marginTop: -3, textAlign: 'center' }}>{sub}</span>
    </div>
  );
}

export default function PsicotecnicosHubPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const oposicionId = usuario?.oposicionActiva?.id;
  const convocatoriaId = usuario?.oposicionActiva?.convocatoriaActiva?.id;

  const { data: modalidades = [], isLoading } = useQuery({
    queryKey: ['psicotecnicos-config', oposicionId, convocatoriaId],
    queryFn: async () => (await api.get(`/psicotecnicos/config/${oposicionId}`, {
      params: convocatoriaId ? { convocatoriaId } : {},
    })).data,
    enabled: !!oposicionId,
  });

  const { data: progreso } = useQuery({
    queryKey: ['psico-periodo', oposicionId],
    queryFn: async () => (await api.get(`/psicotecnicos/progreso-periodo/${oposicionId}`)).data,
    enabled: !!oposicionId,
  });

  if (!usuario) return null;

  const total = progreso?.total ?? { totalPreguntas: 0, precision: 0 };
  const semana = progreso?.semana ?? { totalPreguntas: 0, precision: 0 };
  const entrenamientos = modalidades.reduce((acc: number, m: any) => acc + (m.estadisticas?.realizadas ?? 0), 0);
  const hayDatos = (total.totalPreguntas ?? 0) > 0;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 90 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Cabecera con vuelta a Practicar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
          <button
            onClick={() => router.push('/app/entrenamiento')}
            aria-label="Volver a Practicar"
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={18} color={TEXT_PRIMARY} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
              Practicar
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>Psicotécnicos</div>
          </div>
          <button
            onClick={() => router.push('/app/perfil')}
            aria-label="Mi perfil"
            style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', overflow: 'visible', flexShrink: 0 }}
          >
            <AvatarPerfil usuario={usuario} size={44} />
          </button>
        </div>

        {/* Mi progreso */}
        {modalidades.length > 0 && (
          <section>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 12, padding: '0 4px' }}>Mi progreso</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '0 4px' }}>
              <CirculoDato
                valor={hayDatos ? `${total.precision}%` : '—'}
                porcentaje={hayDatos ? total.precision : 0}
                label="Acierto"
                sub={hayDatos ? 'Desde el principio' : 'Sin entrenamientos'}
              />
              <CirculoDato
                valor={(semana.totalPreguntas ?? 0) > 0 ? `${semana.precision}%` : '—'}
                porcentaje={(semana.totalPreguntas ?? 0) > 0 ? semana.precision : 0}
                label="Esta semana"
                sub={`${(semana.totalPreguntas ?? 0).toLocaleString('es-ES')} preguntas`}
              />
              <CirculoDato
                valor={entrenamientos.toLocaleString('es-ES')}
                label="Entrenamientos"
                sub={`${(total.totalPreguntas ?? 0).toLocaleString('es-ES')} preguntas`}
              />
            </div>
          </section>
        )}

        {/* Modalidades */}
        <section>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 8, padding: '0 4px' }}>Elige una modalidad</div>
          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
            {isLoading && <div style={{ padding: 16, fontSize: 13, color: TEXT_MUTED }}>Cargando…</div>}
            {!isLoading && modalidades.length === 0 && (
              <div style={{ padding: 16, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5 }}>
                Tu convocatoria no tiene psicotécnicos o todavía no se han configurado.
              </div>
            )}
            {modalidades.map((m: any, i: number) => {
              const st = m.estadisticas;
              return (
                <button
                  key={m.tipo}
                  onClick={() => router.push(`/app/entrenamiento/psicotecnicos/${m.tipo}`)}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none', border: 'none',
                    borderBottom: i < modalidades.length - 1 ? `1px solid ${BORDER}` : 'none',
                    padding: '13px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <IconoModalidad tipo={m.tipo} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{m.nombre}</span>
                      {m.oficial && (
                        <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 999, background: 'var(--hx-e0e7ff)', color: COLOR_PSICO, fontWeight: 700 }}>En el examen</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1, lineHeight: 1.4 }}>{m.descripcion}</div>
                    {st?.realizadas > 0 && (
                      <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginTop: 4 }}>
                        {st.realizadas} {st.realizadas === 1 ? 'entrenamiento' : 'entrenamientos'} · Mejor {st.mejorPorcentaje}%
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} color="var(--hx-c4c9d2)" style={{ flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} activo="practicar" />
    </div>
  );
}
