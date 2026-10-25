'use client';

// ⭐ Perfil — mismo sistema que el resto de la app: botón redondo a Inicio, tarjetas blancas con la
// sombra común, títulos suaves, solo iconos lucide y sin emojis. Nivel, puntos y racha aparecen una
// sola vez (antes salían en la cabecera y otra vez en la tarjeta de progreso).

import { useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getOploUrl } from '@/lib/oplo';
import { useMiLiga } from '@/components/liga/TarjetaLiga';
import { CopaEnAvatar, CopaBadge, COLOR_LIGA, BG_LIGA, nombreMes } from '@/components/liga/ligaUtils';
import {
  ArrowLeft, ChevronRight, ChevronDown, Camera, Image as ImageIcon, Bell, Settings, CreditCard, GraduationCap, ShieldCheck,
  LifeBuoy, LogOut, Flame, Check, Trophy, Lock, BookCopy,
} from 'lucide-react';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, BG_NEUTRAL } from '@/styles/tokens';
import SelectorApariencia from '@/components/ui/SelectorApariencia';
import { useTemarioPapel, visibleEn } from '@/components/temario/TemarioPapel';

const BG_APP = BG_NEUTRAL;
const SOMBRA = 'var(--c-sombra)';
const BORDER = 'var(--hx-eef0f3)';
const AZUL = 'var(--hx-1f7cff)';

const NIVELES = [
  { nivel: 1, nombre: 'Opositor', puntosMin: 0, puntosMax: 100 },
  { nivel: 2, nombre: 'Estudiante', puntosMin: 101, puntosMax: 300 },
  { nivel: 3, nombre: 'Preparado', puntosMin: 301, puntosMax: 700 },
  { nivel: 4, nombre: 'Experto', puntosMin: 701, puntosMax: 1500 },
  { nivel: 5, nombre: 'Élite', puntosMin: 1501, puntosMax: null },
];

const PLAN: Record<string, string> = { gratuito: 'Gratuito', esencial: 'Esencial', profesional: 'Profesional' };

function Seccion({ titulo, derecha, children }: { titulo: string; derecha?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY }}>{titulo}</span>
        {derecha}
      </div>
      <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>{children}</div>
    </section>
  );
}

function Fila({ Icon, color, bg, titulo, sub, onClick, ultima = false, peligro = false }: {
  Icon: any; color: string; bg: string; titulo: string; sub?: string; onClick: () => void; ultima?: boolean; peligro?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'none', border: 'none', borderBottom: ultima ? 'none' : `1px solid ${BORDER}`, cursor: 'pointer', textAlign: 'left' }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={19} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: peligro ? 'var(--hx-b91c1c)' : TEXT_PRIMARY }}>{titulo}</div>
        {sub && <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
      </div>
      {!peligro && <ChevronRight size={16} color="var(--hx-c4c9d2)" style={{ flexShrink: 0 }} />}
    </button>
  );
}

export default function PerfilPage() {
  const { usuario, logout, actualizarUsuario } = useAuth();
  const router = useRouter();
  const [modalAvatar, setModalAvatar] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [errorAvatar, setErrorAvatar] = useState('');
  const [verNiveles, setVerNiveles] = useState(false);
  const inputGaleria = useRef<HTMLInputElement>(null);
  const inputCamara = useRef<HTMLInputElement>(null);
  const { data: temarioPapel } = useTemarioPapel(usuario?.oposicionActiva?.id);

  if (!usuario) return null;

  const nivel = usuario.oposicionActiva?.nivel ?? 1;
  const puntos = usuario.oposicionActiva?.puntos ?? 0;
  const racha = usuario.rachaActual ?? 0;
  const nivelActual = NIVELES.find((n) => n.nivel === nivel) ?? NIVELES[0];
  const nivelSiguiente = NIVELES.find((n) => n.nivel === nivel + 1);
  const porcentaje = nivelSiguiente
    ? Math.max(0, Math.min(100, Math.round(((puntos - nivelActual.puntosMin) / (nivelSiguiente.puntosMin - nivelActual.puntosMin)) * 100)))
    : 100;
  const puntosParaSiguiente = nivelSiguiente ? Math.max(0, nivelSiguiente.puntosMin - puntos) : 0;
  const plan = PLAN[usuario.suscripcion ?? 'gratuito'] ?? 'Gratuito';

  const subirImagen = async (file: File) => {
    setSubiendo(true);
    setErrorAvatar('');
    try {
      const formData = new FormData();
      formData.append('archivo', file);
      const res = await api.post('/usuarios/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      actualizarUsuario(res.data);
      setModalAvatar(false);
    } catch (e: any) {
      // ⭐ Antes el error solo iba a la consola
      const m = e?.response?.data?.message;
      setErrorAvatar(typeof m === 'string' ? m : 'No se ha podido subir la foto. Prueba con otra imagen.');
    } finally {
      setSubiendo(false);
    }
  };

  const usarIconoOplo = async () => {
    setSubiendo(true);
    setErrorAvatar('');
    try {
      const res = await api.patch('/usuarios/avatar/tipo', { tipo: 'oplo' });
      actualizarUsuario(res.data);
      setModalAvatar(false);
    } catch {
      setErrorAvatar('No se ha podido cambiar. Inténtalo de nuevo.');
    } finally {
      setSubiendo(false);
    }
  };

  const avatarSrc = usuario.tipoAvatar === 'foto' && usuario.avatarUrl ? usuario.avatarUrl : getOploUrl(nivel);

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 40 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
          <button
            onClick={() => router.push('/app/dashboard')}
            aria-label="Volver a Inicio"
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={18} color={TEXT_PRIMARY} />
          </button>
          <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>Mi perfil</div>
        </div>

        {/* Quién eres */}
        <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => { setErrorAvatar(''); setModalAvatar(true); }}
              aria-label="Cambiar foto de perfil"
              style={{ position: 'relative', width: 72, height: 72, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', background: 'var(--hx-f1f5f9)', overflow: 'visible' }}
            >
              <img src={avatarSrc} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: usuario.tipoAvatar === 'foto' ? 'cover' : 'contain' }} />
              <span style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: '50%', background: AZUL, border: '2px solid var(--c-superficie)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={12} color="white" />
              </span>
            </button>
            <CopaEnAvatar copa={usuario.copaLiga} size={72} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario.nombre}</div>
            {usuario.nick && <div style={{ fontSize: 13, color: TEXT_SECONDARY, fontWeight: 600 }}>@{usuario.nick}</div>}
            <div style={{ fontSize: 12, color: TEXT_MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario.email}</div>
            <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: plan === 'Gratuito' ? 'var(--hx-f1f5f9)' : 'var(--hx-eaf0ff)', color: plan === 'Gratuito' ? TEXT_SECONDARY : AZUL }}>
              Plan {plan}
            </span>
          </div>
        </div>

        {/* Mi nivel — un solo sitio para nivel, puntos y racha */}
        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY }}>Mi nivel</span>
            {usuario.oposicionActiva?.nombre && <span style={{ fontSize: 11, color: TEXT_MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{usuario.oposicionActiva.nombre}</span>}
          </div>
          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
            <button onClick={() => setVerNiveles((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <img src={getOploUrl(nivel)} alt="" style={{ width: 60, height: 60, objectFit: 'contain', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600 }}>Nivel {nivel}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>{nivelActual.nombre}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1 }}>{puntos.toLocaleString('es-ES')}</div>
                    <div style={{ fontSize: 10, color: TEXT_MUTED }}>puntos</div>
                  </div>
                </div>
                <div style={{ height: 7, background: 'var(--hx-eef0f3)', borderRadius: 999, overflow: 'hidden', margin: '8px 0 6px' }}>
                  <div style={{ width: `${porcentaje}%`, height: '100%', background: `linear-gradient(90deg, ${AZUL}, #60a5fa)`, borderRadius: 999, transition: 'width 0.4s' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 11, color: TEXT_MUTED }}>
                    {nivelSiguiente ? `${puntosParaSiguiente} puntos para ${nivelSiguiente.nombre}` : 'Nivel máximo alcanzado'}
                  </span>
                  {racha > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: 'var(--hx-c2410c)', background: 'var(--hx-fff1e8)', borderRadius: 999, padding: '2px 8px', flexShrink: 0 }}>
                      <Flame size={11} /> {racha} {racha === 1 ? 'día' : 'días'}
                    </span>
                  )}
                </div>
              </div>
            </button>
            <button
              onClick={() => setVerNiveles((v) => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 10, background: 'none', border: 'none', borderTop: `1px solid ${BORDER}`, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: AZUL }}
            >
              {verNiveles ? 'Ocultar niveles' : 'Ver todos los niveles'}
              <ChevronDown size={14} style={{ transform: verNiveles ? 'rotate(180deg)' : 'none' }} />
            </button>
            {verNiveles && (
              <div style={{ borderTop: `1px solid ${BORDER}` }}>
                {NIVELES.map((n, i) => {
                  const conseguido = nivel >= n.nivel;
                  const esActual = nivel === n.nivel;
                  return (
                    <div key={n.nivel} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < NIVELES.length - 1 ? `1px solid ${BORDER}` : 'none', background: esActual ? 'var(--hx-f5f8ff)' : 'transparent' }}>
                      <img src={getOploUrl(n.nivel)} alt="" style={{ width: 40, height: 40, objectFit: 'contain', opacity: conseguido ? 1 : 0.35, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: conseguido ? TEXT_PRIMARY : TEXT_MUTED }}>{n.nivel}. {n.nombre}</div>
                        <div style={{ fontSize: 11, color: TEXT_MUTED }}>{n.puntosMax ? `${n.puntosMin}–${n.puntosMax} puntos` : `Desde ${n.puntosMin} puntos`}</div>
                      </div>
                      {esActual
                        ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: AZUL, color: 'white' }}>Actual</span>
                        : conseguido ? <Check size={16} color="var(--hx-16a34a)" /> : <Lock size={14} color="var(--hx-c4c9d2)" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <SeccionLiga />

        <Seccion titulo="Tu cuenta">
          <Fila
            Icon={GraduationCap} color={AZUL} bg="var(--hx-eaf0ff)"
            titulo="Mi oposición" sub={usuario.oposicionActiva?.nombre ?? 'Elige tu oposición'}
            onClick={() => router.push(usuario.oposicionActiva?.id ? `/app/oposicion/${usuario.oposicionActiva.id}/ajustes` : '/app/onboarding/oposicion')}
          />
          {/* ⭐ Antes decía "Plan Profesional" para cualquier plan de pago, también el Esencial */}
          <Fila
            Icon={CreditCard} color="var(--hx-4d7c0f)" bg="var(--hx-f3fae9)"
            titulo="Mi suscripción" sub={plan === 'Gratuito' ? 'Plan gratuito · Ver planes' : `Plan ${plan}`}
            onClick={() => router.push('/app/suscripciones')}
          />
          {visibleEn(temarioPapel?.producto, 'perfil') && (
            <Fila Icon={BookCopy} color={AZUL} bg="var(--c-azul-bg)" titulo="Temario en papel" sub={temarioPapel?.interesado ? 'Te avisaremos cuando puedas pedirlo' : 'El temario completo, impreso y encuadernado'} onClick={() => router.push('/app/temario-papel')} />
          )}
          <Fila Icon={Bell} color="var(--hx-ca8a04)" bg="var(--hx-fdf8e8)" titulo="Alertas" sub="Tus avisos y recordatorios" onClick={() => router.push('/app/alertas')} />
          <Fila
            Icon={Settings} color={TEXT_SECONDARY} bg="var(--hx-f1f5f9)"
            titulo="Notificaciones y avisos" sub="Elige qué avisos quieres recibir"
            onClick={() => router.push('/app/preferencias')}
            ultima={usuario.rol !== 'admin'}
          />
          {usuario.rol === 'admin' && (
            <Fila Icon={ShieldCheck} color={AZUL} bg="var(--hx-eaf0ff)" titulo="Panel de administración" sub="Oposiciones, usuarios y contenido" onClick={() => router.push('/admin')} ultima />
          )}
        </Seccion>

        {/* ⭐ Apariencia: claro, oscuro o automático (sigue al móvil, por defecto) */}
        {(
          <Seccion titulo="Apariencia">
            <SelectorApariencia />
            <div style={{ fontSize: 12, color: TEXT_MUTED, padding: '0 14px 12px', lineHeight: 1.45 }}>
              Automático sigue el modo de tu móvil. Se guarda en este dispositivo.
            </div>
          </Seccion>
        )}

        <Seccion titulo="Ayuda">
          <Fila Icon={LifeBuoy} color="var(--hx-0891b2)" bg="var(--hx-e0f7fa)" titulo="Contactar con soporte" sub="Estamos contigo durante el proceso" onClick={() => router.push('/app/soporte')} ultima />
        </Seccion>

        <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
          <Fila Icon={LogOut} color="var(--hx-dc2626)" bg="var(--hx-fef2f2)" titulo="Cerrar sesión" onClick={logout} peligro ultima />
        </div>
      </div>

      {/* Foto de perfil */}
      {modalAvatar && (
        <div onClick={() => !subiendo && setModalAvatar(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 60 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: BG_APP, borderRadius: '20px 20px 0 0', padding: '1.25rem', width: '100%', maxWidth: 480 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 14, textAlign: 'center' }}>Foto de perfil</div>

            <input ref={inputCamara} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) subirImagen(f); }} />
            <input ref={inputGaleria} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) subirImagen(f); }} />

            <div style={{ background: 'var(--c-superficie)', borderRadius: 16, boxShadow: SOMBRA, overflow: 'hidden' }}>
              <Fila Icon={Camera} color={AZUL} bg="var(--hx-eaf0ff)" titulo="Hacer un selfie" onClick={() => !subiendo && inputCamara.current?.click()} />
              <Fila Icon={ImageIcon} color="var(--hx-7c3aed)" bg="var(--hx-f3f0fc)" titulo="Elegir de la galería" onClick={() => !subiendo && inputGaleria.current?.click()} />
              <button
                onClick={() => !subiendo && usarIconoOplo()}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--hx-f1f5f9)', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={getOploUrl(nivel)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>Usar a OPLO de mi nivel</div>
                {usuario.tipoAvatar !== 'foto' && <Check size={16} color="var(--hx-16a34a)" />}
              </button>
            </div>

            {errorAvatar && <div style={{ fontSize: 12, color: 'var(--hx-b91c1c)', background: 'var(--hx-fef2f2)', borderRadius: 10, padding: '8px 10px', marginTop: 10 }}>{errorAvatar}</div>}

            <button onClick={() => setModalAvatar(false)} disabled={subiendo} style={{ width: '100%', marginTop: 10, padding: 12, background: 'none', border: 'none', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {subiendo ? 'Subiendo…' : 'Cancelar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   LIGA OPLORA: división actual y palmarés
------------------------------------------------------- */

function SeccionLiga() {
  const router = useRouter();
  const { data: liga } = useMiLiga();
  const { data: palmares } = useQuery({
    queryKey: ['liga-palmares'],
    queryFn: async () => (await api.get('/liga/palmares')).data,
    staleTime: 5 * 60_000,
  });

  const copas: any[] = palmares?.copas ?? [];
  if (!liga?.liga && !copas.length) return null;

  return (
    <Seccion
      titulo="Liga Oplora"
      derecha={copas.length > 0 ? <span style={{ fontSize: 11, color: TEXT_MUTED }}>{copas.length} {copas.length === 1 ? 'copa' : 'copas'}</span> : undefined}
    >
      {liga?.liga && (
        <button
          onClick={() => router.push('/app/liga')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'none', border: 'none', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer', textAlign: 'left' }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 12, background: BG_LIGA, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trophy size={19} color={COLOR_LIGA} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{liga.nombreDivision} división</div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>Convocatoria {liga.convocatoria?.anyo} · Ver la liga</div>
          </div>
          <ChevronRight size={16} color="var(--hx-c4c9d2)" style={{ flexShrink: 0 }} />
        </button>
      )}
      {copas.length === 0 ? (
        <div style={{ fontSize: 12, color: TEXT_MUTED, lineHeight: 1.5, padding: '12px 14px' }}>
          Aún no tienes copas. Gana tu división un mes y tu copa aparecerá aquí y sobre tu avatar.
        </div>
      ) : (
        copas.map((c: any, i: number) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: i < copas.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
            <CopaBadge color={c.color} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>
                {c.tipo === 'temporada' ? 'Campeón de la temporada' : `Campeón de ${c.nombreDivision}`}
              </div>
              <div style={{ fontSize: 11, color: TEXT_MUTED }}>
                {c.tipo === 'temporada' ? 'Clasificación general' : nombreMes(c.mes)}
                {c.convocatoria?.anyo ? ` · ${[c.convocatoria.oposicion, c.convocatoria.anyo].filter(Boolean).join(' ')}` : ''}
              </div>
            </div>
          </div>
        ))
      )}
    </Seccion>
  );
}
