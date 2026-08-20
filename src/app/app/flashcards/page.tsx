'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChevronRight, Layers } from 'lucide-react';
import { FooterNavegacion } from '@/app/app/dashboard/page';

const BG_APP = '#FDF4FE';
const BG_WIDGET = '#F7F0F8';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';
const COLOR_FC = '#9333EA';
const COLOR_FC_BG = '#FADEF7';

function Donut({ porcentaje, color, size = 64, grosor = 7 }: { porcentaje: number; color: string; size?: number; grosor?: number }) {
  const radio = (size - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia - (Math.min(100, porcentaje) / 100) * circunferencia;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radio} fill="none" stroke="#E5D9E8" strokeWidth={grosor} />
      <circle cx={size / 2} cy={size / 2} r={radio} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round"
        strokeDasharray={circunferencia} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  );
}

export default function FlashcardsPage() {
  const router = useRouter();
  const { usuario, cargando } = useAuth();
  const [modalTemas, setModalTemas] = useState(false);
  const oposicionId = usuario?.oposicionActiva?.id;

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias-fc', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId,
  });
  const convocatoria = convocatorias.find((c: any) => c.estado === 'activa') ?? convocatorias[0];

  const { data: temas = [] } = useQuery({
    queryKey: ['temas-fc', convocatoria?.id],
    queryFn: async () => {
      const res = await api.get(`/temas/convocatoria/${convocatoria.id}`);
      return res.data;
    },
    enabled: !!convocatoria?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['stats-fc', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/flashcards/stats/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId,
  });

  const { data: pendientes = [] } = useQuery({
    queryKey: ['pendientes-fc', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/flashcards/pendientes/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId,
  });

  if (cargando) return null;

  const totalDominadas = stats?.dominadas ?? 0;
  const totalFC = stats?.total ?? 0;
  const pctDominadas = totalFC > 0 ? Math.round((totalDominadas / totalFC) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 90 }}>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Hero */}
        <div style={{ padding: '4px 4px 0' }}>
          <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Flashcards
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>
            Repasa y memoriza
          </div>
        </div>

        {/* CTA principal — repaso de hoy */}
        <div style={{ background: '#0f172a', borderRadius: 18, padding: '20px 18px', color: 'white', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', fontSize: 11, fontWeight: 700, width: 'fit-content' }}>
            <Layers size={12} />
            {pendientes.length} pendientes hoy
          </div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>
            {pendientes.length > 0 ? '¿Empezamos con el repaso de hoy?' : '¡Estás al día! 🎉'}
          </div>
          <button
            onClick={() => router.push(`/app/flashcards/repasar?oposicionId=${oposicionId}`)}
            disabled={pendientes.length === 0}
            style={{
              marginTop: 8, width: '100%', borderRadius: 999, border: 'none', padding: '13px 16px',
              background: pendientes.length > 0 ? 'white' : 'rgba(255,255,255,0.15)',
              color: pendientes.length > 0 ? '#0f172a' : 'rgba(255,255,255,0.5)',
              fontSize: 14, fontWeight: 700, cursor: pendientes.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            {pendientes.length > 0 ? `Repasar ${pendientes.length} tarjetas →` : 'Sin pendientes'}
          </button>
        </div>

        {/* Widget: Mi progreso */}
        {stats && totalFC > 0 && (
          <div style={{ background: BG_WIDGET, borderRadius: 18, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, paddingLeft: 2 }}>
              Mi progreso
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 8px' }}>
                <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Donut porcentaje={pctDominadas} color={COLOR_FC} />
                  <div style={{ position: 'absolute', fontSize: 15, fontWeight: 800, color: TEXT_PRIMARY }}>{pctDominadas}%</div>
                </div>
                <span style={{ fontSize: 11, color: TEXT_SECONDARY, fontWeight: 500 }}>Dominadas</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 8px' }}>
                <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Donut porcentaje={totalFC > 0 ? Math.round(((stats.dudosas ?? 0) / totalFC) * 100) : 0} color="#D97706" />
                  <div style={{ position: 'absolute', fontSize: 15, fontWeight: 800, color: TEXT_PRIMARY }}>{stats.dudosas ?? 0}</div>
                </div>
                <span style={{ fontSize: 11, color: TEXT_SECONDARY, fontWeight: 500 }}>Dudosas</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 4, fontSize: 11, color: TEXT_MUTED }}>
              <span>{totalFC} en total</span>
              <span>{stats.sinVer ?? 0} sin ver</span>
            </div>
          </div>
        )}

        {/* Widget: Repasar por tema */}
        <div style={{ background: BG_WIDGET, borderRadius: 18, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingLeft: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Por tema
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {temas.slice(0, 6).map((t: any) => (
              <button
                key={t.id}
                onClick={() => router.push(`/app/flashcards/repasar?temaId=${t.id}&oposicionId=${oposicionId}&numeroTema=${t.numero}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderRadius: 12, border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 9, background: COLOR_FC_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: COLOR_FC, flexShrink: 0 }}>
                  {t.numero}
                </div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.titulo}
                </div>
                <ChevronRight size={14} color="#D1D5DB" />
              </button>
            ))}
            {temas.length > 6 && (
              <button
                onClick={() => setModalTemas(true)}
                style={{ fontSize: 12, color: COLOR_FC, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '8px 4px', textAlign: 'center' }}
              >
                Ver todos los temas ({temas.length})
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Modal todos los temas */}
      {modalTemas && (
        <div onClick={() => setModalTemas(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 60 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: BG_APP, borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%', maxWidth: 560, maxHeight: '75vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 14 }}>Todos los temas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {temas.map((t: any) => (
                <button
                  key={t.id}
                  onClick={() => { setModalTemas(false); router.push(`/app/flashcards/repasar?temaId=${t.id}&oposicionId=${oposicionId}&numeroTema=${t.numero}`); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: COLOR_FC_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: COLOR_FC, flexShrink: 0 }}>
                    {t.numero}
                  </div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>{t.titulo}</div>
                  <ChevronRight size={14} color="#D1D5DB" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} activo="practicar" />
    </div>
  );
}