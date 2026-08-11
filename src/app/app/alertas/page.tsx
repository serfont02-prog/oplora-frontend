'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CheckCheck } from 'lucide-react';
import { FooterNavegacion } from '@/app/app/dashboard/page';

const BG_APP = '#FDF8E8';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

const TIPO_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  admitido:          { emoji: '✅', color: '#15803d', bg: '#f0fdf4' },
  excluido:          { emoji: '❌', color: '#dc2626', bg: '#fef2f2' },
  cambio_normativo:  { emoji: '📝', color: '#854F0B', bg: '#FAEEDA' },
  nuevo_documento:   { emoji: '📄', color: '#185FA5', bg: '#E6F1FB' },
  nueva_convocatoria:{ emoji: '📢', color: '#3C3489', bg: '#EEEDFE' },
  plazo_importante:  { emoji: '⏰', color: '#dc2626', bg: '#fef2f2' },
  reto_diario:       { emoji: '⚡', color: '#854F0B', bg: '#FAEEDA' },
  reto_recibido:     { emoji: '🎯', color: '#185FA5', bg: '#E6F1FB' },
  reto_resultado:    { emoji: '🏁', color: '#3C3489', bg: '#EEEDFE' },
  logro:             { emoji: '🏆', color: '#854F0B', bg: '#FAEEDA' },
  racha_peligro:     { emoji: '🔥', color: '#dc2626', bg: '#fef2f2' },
};

function agruparPorFecha(notificaciones: any[]) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);

  const grupos: Record<string, any[]> = {};

  for (const n of notificaciones) {
    const fecha = new Date(n.creadoEn);
    fecha.setHours(0, 0, 0, 0);

    let grupo: string;
    if (fecha.getTime() === hoy.getTime()) grupo = 'Hoy';
    else if (fecha.getTime() === ayer.getTime()) grupo = 'Ayer';
    else grupo = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

    if (!grupos[grupo]) grupos[grupo] = [];
    grupos[grupo].push(n);
  }

  return grupos;
}

function tiempoRelativo(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  const horas = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins}m`;
  if (horas < 24) return `Hace ${horas}h`;
  return `Hace ${dias}d`;
}

export default function AlertasPage() {
  const router = useRouter();
  const { usuario, cargando } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  const { data: notificaciones = [], isLoading } = useQuery({
    queryKey: ['notificaciones'],
    queryFn: async () => {
      const res = await api.get('/notificaciones');
      return res.data;
    },
    enabled: !!usuario,
    staleTime: 0,
    refetchOnMount: true,
  });

  const marcarLeida = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notificaciones/${id}/leer`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones-count'] });
    },
  });

  const marcarTodasLeidas = useMutation({
    mutationFn: async () => {
      await api.patch('/notificaciones/leer-todas');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones-count'] });
    },
  });

  const noLeidas = notificaciones.filter((n: any) => !n.leida).length;
  const grupos = agruparPorFecha(notificaciones);

  if (cargando) return null;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: '90px' }}>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── HERO MINIMALISTA ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              Alertas
            </div>
            <div style={{ fontSize: '19px', fontWeight: 700, color: TEXT_PRIMARY }}>
              {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día'}
            </div>
          </div>
          {noLeidas > 0 ? (
            <button
              onClick={() => marcarTodasLeidas.mutate()}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: TEXT_SECONDARY, background: 'white', border: 'none', borderRadius: '999px', padding: '8px 12px', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}
            >
              <CheckCheck size={13} />
              Leer todas
            </button>
          ) : (
            <button
              onClick={() => router.push('/app/perfil')}
              style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}
            >
              <img
                src={`/oplo/oplo-${usuario?.nivel ?? 1}.jpg`}
                alt="Perfil"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            </button>
          )}
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', fontSize: '13px', color: TEXT_MUTED }}>Cargando...</div>
        ) : notificaciones.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: '14px', padding: '3rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔔</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT_PRIMARY, marginBottom: '4px' }}>Sin alertas</div>
            <div style={{ fontSize: '13px', color: TEXT_MUTED }}>Te avisaremos cuando haya novedades</div>
          </div>
        ) : (
          Object.entries(grupos).map(([grupo, items]) => (
            <div key={grupo}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                {grupo}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map((n: any) => {
                  const config = TIPO_CONFIG[n.tipo] ?? { emoji: '🔔', color: '#6b7280', bg: '#f3f4f6' };
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.leida) marcarLeida.mutate(n.id);
                        if (n.urlAccion) router.push(n.urlAccion);
                      }}
                      style={{
                        background: 'white',
                        border: '1px solid #F1F5F9',
                        borderRadius: '14px',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        position: 'relative',
                        minHeight: '70px',
                        boxSizing: 'border-box',
                      }}
                    >
                      {!n.leida && (
                        <div style={{ position: 'absolute', top: '16px', right: '16px', width: '7px', height: '7px', borderRadius: '50%', background: '#3b82f6' }} />
                      )}

                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                        {config.emoji}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '14px', fontWeight: n.leida ? 500 : 700, color: TEXT_PRIMARY }}>
                            {n.titulo}
                          </span>
                          {n.prioridad === 'alta' && (
                            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '20px', background: '#fef2f2', color: '#dc2626', fontWeight: 600 }}>
                              Importante
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: TEXT_SECONDARY, lineHeight: 1.5, marginBottom: '4px' }}>
                          {n.mensaje}
                        </div>
                        <div style={{ fontSize: '11px', color: TEXT_MUTED }}>
                          {tiempoRelativo(n.creadoEn)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

      </div>

      <FooterNavegacion usuario={usuario} oposicionId={usuario?.oposicionActiva?.id} activo="alertas" />

    </div>
  );
}