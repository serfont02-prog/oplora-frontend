'use client';

// ⭐ Notificaciones y avisos (desde Perfil: son de la cuenta, no de la convocatoria).
// - Qué avisos quieres recibir: retos, repasos, noticias, convocatoria y normativa (todos activados por defecto).
// - Retos al azar: si otros opositores de tu convocatoria pueden retarte sin conocerte.
// - Avisos de la Liga Oplora.
// Las respuestas de soporte llegan siempre.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Shuffle, Bell, Swords, CalendarCheck, Newspaper, Megaphone, Scale } from 'lucide-react';
import Interruptor from '@/components/ui/Interruptor';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useMiLiga } from '@/components/liga/TarjetaLiga';
import AvisosLiga from '@/components/liga/AvisosLiga';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, BG_NEUTRAL, COLOR_RETOS, COLOR_RETOS_BG } from '@/styles/tokens';

const SOMBRA = 'var(--c-sombra)';

type Categoria = 'retos' | 'repasos' | 'noticias' | 'convocatoria' | 'normativa';

const CATEGORIAS: { clave: Categoria; titulo: string; sub: string; icono: any; color: string; fondo: string }[] = [
  { clave: 'retos', titulo: 'Retos y duelos', sub: 'Cuando te retan y cuando termina un duelo', icono: Swords, color: COLOR_RETOS, fondo: COLOR_RETOS_BG },
  { clave: 'repasos', titulo: 'Recordatorios de repaso', sub: 'Temas y flashcards que te toca repasar hoy', icono: CalendarCheck, color: 'var(--c-azul)', fondo: 'var(--c-azul-bg)' },
  { clave: 'noticias', titulo: 'Noticias', sub: 'Nuevas noticias de tu oposición', icono: Newspaper, color: 'var(--hx-1f7cff)', fondo: 'var(--hx-eaf0ff)' },
  { clave: 'convocatoria', titulo: 'Tu convocatoria', sub: 'Nuevas convocatorias, documentos y listas', icono: Megaphone, color: 'var(--hx-4f46e5)', fondo: 'var(--hx-e0e7ff)' },
  { clave: 'normativa', titulo: 'Cambios en la normativa', sub: 'Cuando cambia una ley de tu temario', icono: Scale, color: 'var(--hx-6b5f3e)', fondo: 'var(--hx-ede9dd)' },
];

function Seccion({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <section>
      <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 8, padding: '0 4px' }}>{titulo}</div>
      {children}
      {nota && <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 6, lineHeight: 1.45, padding: '0 4px' }}>{nota}</div>}
    </section>
  );
}

function FilaAviso({ icono: Icono, color, fondo, titulo, sub, activo, onCambiar, borde }: {
  icono: any; color: string; fondo: string; titulo: string; sub: string; activo: boolean; onCambiar: (v: boolean) => void; borde?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: borde ? '1px solid var(--hx-eef0f3)' : 'none' }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, background: fondo, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icono size={19} color={color} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{titulo}</div>
        <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1, lineHeight: 1.4 }}>{sub}</div>
      </div>
      <Interruptor activo={activo} onCambiar={onCambiar} etiqueta={titulo} />
    </div>
  );
}

export default function PreferenciasPage() {
  const router = useRouter();
  const { usuario, actualizarUsuario } = useAuth();
  const { data, isLoading } = useMiLiga(!!usuario);
  const [error, setError] = useState('');

  if (!usuario) return null;

  const u = usuario as any;
  const retosAzar = u.recibirRetosAleatorios !== false;
  const avisos: Record<Categoria, boolean> = Object.fromEntries(
    CATEGORIAS.map((c) => [c.clave, u.preferenciasAvisos?.[c.clave] !== false]),
  ) as Record<Categoria, boolean>;

  // Cambio inmediato en pantalla; si el servidor falla se deshace y se avisa.
  const guardar = async (cambio: { recibirRetosAleatorios?: boolean; avisos?: Partial<Record<Categoria, boolean>> }) => {
    setError('');
    const anterior = { recibirRetosAleatorios: u.recibirRetosAleatorios, preferenciasAvisos: u.preferenciasAvisos ?? null };
    actualizarUsuario({
      ...(cambio.recibirRetosAleatorios !== undefined ? { recibirRetosAleatorios: cambio.recibirRetosAleatorios } : {}),
      ...(cambio.avisos ? { preferenciasAvisos: { ...avisos, ...cambio.avisos } } : {}),
    } as any);
    try {
      const res = await api.patch('/usuarios/preferencias', cambio);
      actualizarUsuario({ recibirRetosAleatorios: res.data?.recibirRetosAleatorios, preferenciasAvisos: res.data?.avisos } as any);
    } catch {
      actualizarUsuario(anterior as any);
      setError('No se ha podido guardar el cambio. Comprueba la conexión e inténtalo de nuevo.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: BG_NEUTRAL, paddingBottom: 40 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
          <button
            onClick={() => router.push('/app/perfil')}
            aria-label="Volver a Perfil"
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={18} color={TEXT_PRIMARY} />
          </button>
          <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>Notificaciones y avisos</div>
        </div>

        {error && (
          <div style={{ background: 'var(--hx-fef2f2)', color: 'var(--hx-b91c1c)', borderRadius: 14, padding: '10px 12px', fontSize: 13, lineHeight: 1.45 }}>{error}</div>
        )}

        <Seccion titulo="Qué avisos quieres recibir" nota="Las respuestas de soporte te llegarán siempre.">
          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
            {CATEGORIAS.map((c, i) => (
              <FilaAviso
                key={c.clave}
                icono={c.icono}
                color={c.color}
                fondo={c.fondo}
                titulo={c.titulo}
                sub={c.sub}
                activo={avisos[c.clave]}
                onCambiar={(v) => guardar({ avisos: { [c.clave]: v } })}
                borde={i > 0}
              />
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Retos al azar">
          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
            <FilaAviso
              icono={Shuffle}
              color={COLOR_RETOS}
              fondo={COLOR_RETOS_BG}
              titulo="Recibir retos al azar"
              sub="Otros opositores de tu convocatoria podrán retarte aunque no te conozcan. Como mucho 3 al día."
              activo={retosAzar}
              onCambiar={(v) => guardar({ recibirRetosAleatorios: v })}
            />
          </div>
        </Seccion>

        <section>
          {(isLoading || (data && !data.liga)) && (
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 8, padding: '0 4px' }}>Liga Oplora</div>
          )}
          {isLoading && (
            <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: 14, fontSize: 13, color: TEXT_MUTED }}>Cargando…</div>
          )}
          {data?.liga && <AvisosLiga avisos={data.avisos} titulo="Liga Oplora" />}
          {data && !data.liga && (
            <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: 14, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5 }}>
              Podrás configurar los avisos de la Liga cuando entres en la liga de tu convocatoria.
            </div>
          )}
        </section>

        <button
          onClick={() => router.push('/app/alertas')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--c-superficie)', border: 'none', borderRadius: 18, boxShadow: SOMBRA, cursor: 'pointer', textAlign: 'left' }}
        >
          <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--hx-fdf8e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bell size={19} color="var(--hx-ca8a04)" />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>Tus alertas</div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>Todo lo que te ha llegado</div>
          </div>
          <ChevronRight size={16} color="var(--hx-c4c9d2)" />
        </button>
      </div>
    </div>
  );
}
