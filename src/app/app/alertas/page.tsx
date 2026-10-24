'use client';

// ⭐ Alertas con el diseño actual de la app (fondo azul claro, tarjetas blancas, iconos lucide).
// - Antes usaba el fondo crema antiguo y emojis; los tipos Liga, Noticias y Soporte salían sin icono.
// - Marcar como leída es inmediato (no espera a la respuesta) y la campana de Inicio se actualiza.
// - Estado de error con "Reintentar" (antes se quedaba en "Sin alertas" si fallaba la carga).
// - Los textos antiguos que traían emojis se muestran sin ellos.

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCheck, Bell, BellOff, CircleCheck, CircleX, FilePenLine, FileText, Megaphone, AlarmClock,
  Zap, Swords, Flag, Award, Flame, Newspaper, LifeBuoy, Trophy, ChevronRight, RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { FooterNavegacion } from '@/app/app/dashboard/page';
import { AvatarPerfil } from '@/components/AvatarUsuarioPerfil';
import { BG_DASHBOARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '@/styles/tokens';

const SOMBRA = 'var(--c-sombra)';
const AZUL = 'var(--hx-1f7cff)';

type Notificacion = {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  prioridad?: 'alta' | 'media' | 'baja';
  leida: boolean;
  urlAccion?: string | null;
  creadoEn: string;
};

const RETOS = { color: 'var(--hx-c2410c)', fondo: 'var(--hx-fceee8)' };
const ROJO = { color: 'var(--hx-dc2626)', fondo: 'var(--hx-fee2e2)' };
const AZUL_SUAVE = { color: AZUL, fondo: 'var(--hx-eaf0ff)' };
const ORO = { color: 'var(--hx-ca8a04)', fondo: 'var(--hx-fdf8e8)' };

const TIPO: Record<string, { icono: any; color: string; fondo: string }> = {
  admitido: { icono: CircleCheck, color: 'var(--hx-15803d)', fondo: 'var(--hx-dcfce7)' },
  excluido: { icono: CircleX, ...ROJO },
  cambio_normativo: { icono: FilePenLine, color: 'var(--hx-6b5f3e)', fondo: 'var(--hx-ede9dd)' },
  nuevo_documento: { icono: FileText, ...AZUL_SUAVE },
  nueva_convocatoria: { icono: Megaphone, color: 'var(--hx-4f46e5)', fondo: 'var(--hx-e0e7ff)' },
  plazo_importante: { icono: AlarmClock, ...ROJO },
  reto_diario: { icono: Zap, ...RETOS },
  reto_recibido: { icono: Swords, ...RETOS },
  reto_resultado: { icono: Flag, ...RETOS },
  logro: { icono: Award, ...ORO },
  racha_peligro: { icono: Flame, ...ROJO },
  nueva_noticia: { icono: Newspaper, ...AZUL_SUAVE },
  respuesta_soporte: { icono: LifeBuoy, color: 'var(--hx-4d7c0f)', fondo: 'var(--hx-ecfccb)' },
  liga: { icono: Trophy, ...ORO },
};
const TIPO_DEFECTO = { icono: Bell, color: 'var(--hx-64748b)', fondo: 'var(--hx-f1f5f9)' };

const EMOJIS = new RegExp('[\\p{Extended_Pictographic}\\u{1F1E6}-\\u{1F1FF}\\uFE0F\\u200D]', 'gu');
const sinEmojis = (t: string) => String(t ?? '').replace(EMOJIS, '').replace(/\s{2,}/g, ' ').replace(/\s+([!?.,:])/g, '$1').trim();

function inicioDia(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function agruparPorFecha(lista: Notificacion[]) {
  const hoy = inicioDia(new Date());
  const ayer = hoy - 86_400_000;
  const anyoActual = new Date().getFullYear();
  const grupos: { titulo: string; items: Notificacion[] }[] = [];
  for (const n of lista) {
    const f = new Date(n.creadoEn);
    const dia = inicioDia(f);
    const titulo =
      dia === hoy ? 'Hoy'
        : dia === ayer ? 'Ayer'
          : f.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', ...(f.getFullYear() !== anyoActual ? { year: 'numeric' } : {}) });
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.titulo === titulo) ultimo.items.push(n);
    else grupos.push({ titulo, items: [n] });
  }
  return grupos;
}

function hora(fecha: string): string {
  const f = new Date(fecha);
  const diff = Date.now() - f.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  if (diff < 6 * 3_600_000) return `Hace ${Math.floor(diff / 3_600_000)} h`;
  return f.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export default function AlertasPage() {
  const router = useRouter();
  const { usuario, cargando } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<Notificacion[]>({
    queryKey: ['notificaciones'],
    queryFn: async () => (await api.get('/notificaciones')).data ?? [],
    enabled: !!usuario,
    staleTime: 0,
    refetchOnMount: true,
  });
  const notificaciones = data ?? [];

  // Actualización inmediata en pantalla y en el contador de la campana
  const marcarLocal = (id?: string) => {
    queryClient.setQueryData<Notificacion[]>(['notificaciones'], (prev) =>
      (prev ?? []).map((n) => (!id || n.id === id ? { ...n, leida: true } : n)),
    );
    queryClient.setQueryData<{ count: number }>(['notificaciones-count'], (prev) =>
      id ? { count: Math.max(0, (prev?.count ?? 1) - 1) } : { count: 0 },
    );
  };
  const sincronizar = () => {
    queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    queryClient.invalidateQueries({ queryKey: ['notificaciones-count'] });
  };

  const marcarLeida = useMutation({
    mutationFn: async (id: string) => { await api.patch(`/notificaciones/${id}/leer`); },
    onMutate: (id) => marcarLocal(id),
    onError: sincronizar,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notificaciones-count'] }),
  });

  const marcarTodas = useMutation({
    mutationFn: async () => { await api.patch('/notificaciones/leer-todas'); },
    onMutate: () => marcarLocal(),
    onError: sincronizar,
    onSettled: sincronizar,
  });

  const noLeidas = notificaciones.filter((n) => !n.leida).length;
  const grupos = useMemo(() => agruparPorFecha(notificaciones), [notificaciones]);

  const abrir = (n: Notificacion) => {
    if (!n.leida) marcarLeida.mutate(n.id);
    const url = n.urlAccion?.trim();
    if (url && url.startsWith('/')) router.push(url);
  };

  if (cargando || !usuario) return null;

  return (
    <div style={{ minHeight: '100vh', background: BG_DASHBOARD, paddingBottom: 96 }}>
      <style>{`@keyframes oplora-girar { to { transform: rotate(360deg); } } @keyframes oplora-brillo { 0%,100% { opacity: .55 } 50% { opacity: 1 } }`}</style>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: TEXT_PRIMARY }}>Alertas</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 2 }}>
              {isLoading ? 'Cargando…' : noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día'}
            </div>
          </div>
          <button
            onClick={() => router.push('/app/perfil')}
            aria-label="Mi perfil"
            style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', overflow: 'visible', flexShrink: 0 }}
          >
            <AvatarPerfil usuario={usuario} size={44} />
          </button>
        </div>

        {noLeidas > 0 && (
          <button
            onClick={() => marcarTodas.mutate()}
            disabled={marcarTodas.isPending}
            style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: AZUL, background: 'var(--c-superficie)', border: 'none', borderRadius: 999, padding: '8px 14px', cursor: 'pointer', boxShadow: SOMBRA, marginTop: -6 }}
          >
            <CheckCheck size={14} /> Marcar todas como leídas
          </button>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ height: 78, borderRadius: 20, background: 'var(--c-superficie)', boxShadow: SOMBRA, animation: 'oplora-brillo 1.2s ease-in-out infinite' }} />
            ))}
          </div>
        ) : isError ? (
          <div style={{ background: 'var(--c-superficie)', borderRadius: 24, boxShadow: SOMBRA, padding: '2rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }}>No se han podido cargar tus alertas</div>
            <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 14 }}>Comprueba la conexión e inténtalo de nuevo.</div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <RefreshCw size={14} style={isFetching ? { animation: 'oplora-girar 0.8s linear infinite' } : undefined} /> Reintentar
            </button>
          </div>
        ) : notificaciones.length === 0 ? (
          <div style={{ background: 'var(--c-superficie)', borderRadius: 24, boxShadow: SOMBRA, padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <span style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--hx-eaf0ff)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <BellOff size={24} color={AZUL} />
            </span>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 4 }}>No tienes alertas</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
              Aquí te avisaremos de novedades de tu convocatoria, cambios en la normativa, retos y la Liga.
            </div>
          </div>
        ) : (
          grupos.map(({ titulo, items }) => (
            <section key={titulo}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 4px 8px' }}>
                {titulo}
              </div>
              <div style={{ background: 'var(--c-superficie)', borderRadius: 24, boxShadow: SOMBRA, overflow: 'hidden' }}>
                {items.map((n, i) => {
                  const c = TIPO[n.tipo] ?? TIPO_DEFECTO;
                  const Icono = c.icono;
                  const navegable = !!n.urlAccion?.trim().startsWith('/');
                  return (
                    <button
                      key={n.id}
                      onClick={() => abrir(n)}
                      style={{
                        width: '100%', textAlign: 'left', border: 'none', cursor: navegable || !n.leida ? 'pointer' : 'default',
                        display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 14px 14px 16px',
                        background: n.leida ? 'var(--c-superficie)' : 'var(--hx-f5f8ff)',
                        borderTop: i ? '1px solid var(--hx-eef0f3)' : 'none',
                        font: 'inherit',
                      }}
                    >
                      <span style={{ width: 40, height: 40, borderRadius: 12, background: c.fondo, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icono size={19} color={c.color} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: n.leida ? 600 : 700, color: TEXT_PRIMARY, lineHeight: 1.35 }}>{sinEmojis(n.titulo)}</span>
                          {n.prioridad === 'alta' && !n.leida && (
                            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: 'var(--hx-fee2e2)', color: 'var(--hx-dc2626)', fontWeight: 700 }}>Importante</span>
                          )}
                        </span>
                        <span style={{ display: 'block', fontSize: 12.5, color: TEXT_SECONDARY, lineHeight: 1.5, marginTop: 2 }}>{sinEmojis(n.mensaje)}</span>
                        <span style={{ display: 'block', fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>{hora(n.creadoEn)}</span>
                      </span>
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, alignSelf: 'stretch', justifyContent: navegable ? 'space-between' : 'flex-start', paddingTop: 4 }}>
                        <span aria-label={n.leida ? undefined : 'Sin leer'} style={{ width: 8, height: 8, borderRadius: '50%', background: n.leida ? 'transparent' : AZUL }} />
                        {navegable && <ChevronRight size={16} color="var(--hx-cbd5e1)" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))
        )}

        {notificaciones.length >= 50 && (
          <div style={{ textAlign: 'center', fontSize: 12, color: TEXT_MUTED }}>Se muestran las 50 alertas más recientes.</div>
        )}
      </div>

      <FooterNavegacion usuario={usuario} oposicionId={usuario?.oposicionActiva?.id} activo="alertas" />
    </div>
  );
}
