'use client';

// ⭐ Flashcards — mismo sistema que Inicio y Practicar: botón para volver a Practicar, tarjetas
// blancas con la sombra común directamente sobre el fondo, estadísticas en círculos flotantes,
// títulos suaves y solo iconos lucide (Layers = flashcards en toda la app).

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, ChevronRight, ChevronDown, Layers, CheckCircle2 } from 'lucide-react';
import { FooterNavegacion } from '@/app/app/dashboard/page';
import { AvatarPerfil } from '@/components/AvatarUsuarioPerfil';

import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, COLOR_FC, COLOR_FC_BG, BG_FLASHCARDS } from '@/styles/tokens';

const SOMBRA = '0 6px 18px rgba(15, 23, 42, 0.08)';
const BORDER = '#F3EEF5';
const COLOR_DUDOSA = '#D97706';
const TEMAS_VISIBLES = 6;
const MAX_SESION = 30;
const MAX_CONTEO = 99; // el endpoint devuelve 10 si no se le pasa límite

function TituloSeccion({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 8, padding: '0 4px' }}>{children}</div>;
}

function Donut({ porcentaje, color, size, grosor }: { porcentaje: number; color: string; size: number; grosor: number }) {
  const radio = (size - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia - (Math.max(0, Math.min(100, porcentaje)) / 100) * circunferencia;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={radio} fill="none" stroke="#EEF0F3" strokeWidth={grosor} />
      {porcentaje > 0 && (
        <circle cx={size / 2} cy={size / 2} r={radio} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round"
          strokeDasharray={circunferencia} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      )}
    </svg>
  );
}

/** Círculo flotante con aro (igual que las estadísticas de Practicar). */
function CirculoDato({ valor, porcentaje, color, label, sub }: { valor: string; porcentaje: number; color: string; label: string; sub: string }) {
  const D = 78;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <div style={{ position: 'relative', width: D, height: D, borderRadius: '50%', background: 'white', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 6 }}>
          <Donut porcentaje={porcentaje} color={color} size={D - 12} grosor={6} />
        </div>
        <span style={{ position: 'relative', fontSize: 16, fontWeight: 800, color: TEXT_PRIMARY }}>{valor}</span>
      </div>
      <span style={{ fontSize: 12, color: TEXT_PRIMARY, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
      <span style={{ fontSize: 10, color: TEXT_MUTED, marginTop: -3, textAlign: 'center' }}>{sub}</span>
    </div>
  );
}

export default function FlashcardsPage() {
  const router = useRouter();
  const { usuario, cargando } = useAuth();
  const [verTodos, setVerTodos] = useState(false);
  const oposicionId = usuario?.oposicionActiva?.id;

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias-fc', oposicionId],
    queryFn: async () => (await api.get(`/convocatorias/oposicion/${oposicionId}`)).data,
    enabled: !!oposicionId,
  });
  const convocatoria = convocatorias.find((c: any) => c.estado === 'activa') ?? convocatorias[0];

  const { data: temas = [], isLoading: cargandoTemas } = useQuery({
    queryKey: ['temas-fc', convocatoria?.id],
    queryFn: async () => (await api.get(`/temas/convocatoria/${convocatoria.id}`)).data,
    enabled: !!convocatoria?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['stats-fc', oposicionId],
    queryFn: async () => (await api.get(`/flashcards/stats/${oposicionId}`)).data,
    enabled: !!oposicionId,
  });

  const { data: pendientes = [] } = useQuery({
    queryKey: ['pendientes-fc', oposicionId],
    queryFn: async () => (await api.get(`/flashcards/pendientes/${oposicionId}?limite=${MAX_CONTEO}`)).data,
    enabled: !!oposicionId,
  });

  const { data: limites } = useQuery({
    queryKey: ['limites', usuario?.id],
    queryFn: async () => (await api.get('/usuarios/limites')).data,
    enabled: !!usuario,
  });

  if (cargando || !usuario) return null;

  // Límite diario de flashcards del plan (null = sin límite)
  const limiteDia = limites?.limites?.flashcardsDia;
  const hechasHoy = limites?.consumo?.flashcardsHoy ?? 0;
  const conLimite = limiteDia !== null && limiteDia !== undefined;
  const restantesHoy = conLimite ? Math.max(0, limiteDia - hechasHoy) : Infinity;
  const limiteAgotado = conLimite && restantesHoy === 0;

  const nPendientes = Array.isArray(pendientes) ? pendientes.length : 0;
  // La sesión pide exactamente las que se anuncian en el botón (antes decía "Repasar 37" y salían 10).
  const nSesion = Math.min(nPendientes, MAX_SESION, restantesHoy);

  const totalFC = stats?.total ?? 0;
  const dominadas = Math.min(stats?.dominadas ?? 0, totalFC);
  const dudosas = stats?.dudosas ?? 0;
  const sinVer = stats?.sinVer ?? 0;
  const pct = (n: number) => (totalFC > 0 ? Math.min(100, Math.round((n / totalFC) * 100)) : 0);

  const irATema = (t: any) =>
    router.push(`/app/flashcards/repasar?temaId=${t.id}&oposicionId=${oposicionId}&numeroTema=${t.numero}&origen=flashcards`);

  const temasVisibles = verTodos ? temas : temas.slice(0, TEMAS_VISIBLES);

  return (
    <div style={{ minHeight: '100vh', background: BG_FLASHCARDS, paddingBottom: 90 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Cabecera con vuelta a Practicar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
          <button
            onClick={() => router.push('/app/entrenamiento')}
            aria-label="Volver a Practicar"
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'white', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={18} color={TEXT_PRIMARY} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
              Practicar
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>Flashcards</div>
          </div>
          <button
            onClick={() => router.push('/app/perfil')}
            aria-label="Mi perfil"
            style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', overflow: 'visible', flexShrink: 0 }}
          >
            <AvatarPerfil usuario={usuario} size={44} />
          </button>
        </div>

        {/* Repaso de hoy — acción principal */}
        <section>
          <TituloSeccion>Repaso de hoy</TituloSeccion>
          <div style={{ background: 'white', borderRadius: 18, padding: 16, boxShadow: SOMBRA, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: COLOR_FC_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {nPendientes > 0 ? <Layers size={20} color={COLOR_FC} /> : <CheckCircle2 size={20} color="#16A34A" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>
                  {nPendientes > 0
                    ? `${nPendientes >= MAX_CONTEO ? `Más de ${MAX_CONTEO}` : nPendientes} ${nPendientes === 1 ? 'tarjeta pendiente' : 'tarjetas pendientes'}`
                    : 'Estás al día'}
                </div>
                <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>
                  {nPendientes > 0
                    ? 'Las que toca repasar hoy para no olvidarlas'
                    : 'No te toca repasar ninguna. Puedes practicar un tema abajo.'}
                </div>
              </div>
            </div>

            {conLimite && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: TEXT_MUTED }}>Flashcards de hoy</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: limiteAgotado ? '#DC2626' : TEXT_PRIMARY }}>
                    {hechasHoy} de {limiteDia}
                  </span>
                </div>
                <div style={{ height: 6, background: '#EEF0F3', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${limiteDia > 0 ? Math.min(100, (hechasHoy / limiteDia) * 100) : 0}%`, height: '100%', background: limiteAgotado ? '#DC2626' : COLOR_FC, borderRadius: 999, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            )}

            {nPendientes > 0 && (
              <button
                onClick={() => (limiteAgotado
                  ? router.push('/app/suscripciones')
                  : router.push(`/app/flashcards/repasar?oposicionId=${oposicionId}&n=${nSesion}`))}
                style={{ width: '100%', padding: 12, borderRadius: 12, border: 'none', background: '#0f172a', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                {limiteAgotado
                  ? 'Límite de hoy alcanzado · Ver planes'
                  : `Repasar ${nSesion} ${nSesion === 1 ? 'tarjeta' : 'tarjetas'}`}
              </button>
            )}
          </div>
        </section>

        {/* Mi progreso — círculos flotantes */}
        {totalFC > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY }}>Mi progreso</span>
              <span style={{ fontSize: 11, color: TEXT_MUTED }}>{totalFC.toLocaleString('es-ES')} flashcards en total</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '0 4px' }}>
              <CirculoDato valor={`${pct(dominadas)}%`} porcentaje={pct(dominadas)} color={COLOR_FC} label="Dominadas" sub={`${dominadas.toLocaleString('es-ES')} tarjetas`} />
              <CirculoDato valor={dudosas.toLocaleString('es-ES')} porcentaje={pct(dudosas)} color={COLOR_DUDOSA} label="Dudosas" sub="Necesitan repaso" />
              <CirculoDato valor={sinVer.toLocaleString('es-ES')} porcentaje={pct(sinVer)} color="#94A3B8" label="Sin ver" sub="Aún por estrenar" />
            </div>
          </section>
        )}

        {/* Practicar por tema */}
        <section>
          <TituloSeccion>Practicar por tema</TituloSeccion>
          <div style={{ background: 'white', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
            {cargandoTemas && (
              <div style={{ padding: 16, fontSize: 13, color: TEXT_MUTED }}>Cargando temas…</div>
            )}
            {!cargandoTemas && temas.length === 0 && (
              <div style={{ padding: 16, fontSize: 13, color: TEXT_MUTED }}>Todavía no hay temas con flashcards en tu convocatoria.</div>
            )}
            {temasVisibles.map((t: any, i: number) => (
              <button
                key={t.id}
                onClick={() => irATema(t)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  border: 'none', borderBottom: i < temasVisibles.length - 1 || temas.length > TEMAS_VISIBLES ? `1px solid ${BORDER}` : 'none',
                  background: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 10, background: COLOR_FC_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: COLOR_FC, flexShrink: 0 }}>
                  {t.numero}
                </div>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {t.titulo}
                </div>
                <ChevronRight size={16} color="#C4C9D2" style={{ flexShrink: 0 }} />
              </button>
            ))}
            {temas.length > TEMAS_VISIBLES && (
              <button
                onClick={() => setVerTodos(v => !v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: COLOR_FC }}
              >
                {verTodos ? 'Ver menos' : `Ver todos los temas (${temas.length})`}
                <ChevronDown size={14} style={{ transform: verTodos ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
              </button>
            )}
          </div>
        </section>

      </div>

      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} activo="practicar" />
    </div>
  );
}
