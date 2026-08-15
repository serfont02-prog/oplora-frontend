'use client';

import { useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getOploUrl } from '@/lib/oplo';

import {
  ArrowRightIcon,
  BellIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  ArrowLeftStartOnRectangleIcon,
  CameraIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

const BG_APP = '#F4F5F7';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

const NIVELES = [
  { nivel: 1, nombre: 'Opositor', puntosMin: 0, puntosMax: 100 },
  { nivel: 2, nombre: 'Estudiante', puntosMin: 101, puntosMax: 300 },
  { nivel: 3, nombre: 'Preparado', puntosMin: 301, puntosMax: 700 },
  { nivel: 4, nombre: 'Experto', puntosMin: 701, puntosMax: 1500 },
  { nivel: 5, nombre: 'Élite', puntosMin: 1501, puntosMax: null },
];

export default function PerfilPage() {
  const { usuario, logout, actualizarUsuario } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modalAvatar, setModalAvatar] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const inputGaleria = useRef<HTMLInputElement>(null);
  const inputCamara = useRef<HTMLInputElement>(null);

  if (!usuario) return null;

  const nivel = usuario.nivel ?? 1;
  const puntos = usuario.puntos ?? 0;
  const nivelActual = NIVELES.find(n => n.nivel === nivel) ?? NIVELES[0];
  const nivelSiguiente = NIVELES.find(n => n.nivel === nivel + 1);

  const porcentaje = nivelSiguiente
    ? Math.min(100, Math.round(((puntos - nivelActual.puntosMin) / (nivelSiguiente.puntosMin - nivelActual.puntosMin)) * 100))
    : 100;
  const puntosParaSiguiente = nivelSiguiente ? nivelSiguiente.puntosMin - puntos : 0;

  const subirImagen = async (file: File) => {
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('archivo', file);
      const res = await api.post('/usuarios/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      actualizarUsuario(res.data);
      setModalAvatar(false);
    } catch (e) {
      console.error('Error subiendo avatar:', e);
    } finally {
      setSubiendo(false);
    }
  };

  const usarIconoOplo = async () => {
    setSubiendo(true);
    try {
      const res = await api.patch('/usuarios/avatar/tipo', { tipo: 'oplo' });
      actualizarUsuario(res.data);
      setModalAvatar(false);
    } finally {
      setSubiendo(false);
    }
  };

  const avatarSrc = usuario.tipoAvatar === 'foto' && usuario.avatarUrl
    ? usuario.avatarUrl
    : getOploUrl(nivel);

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ background: '#0f172a', padding: '1rem 1.25rem 1.5rem' }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, padding: '6px 12px', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}
        >
          ← Volver
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => setModalAvatar(true)}
            style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, overflow: 'hidden', background: 'rgba(255,255,255,0.1)' }}
          >
            <img src={avatarSrc} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: '50%',
              background: '#1F7CFF', border: '2px solid #0f172a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CameraIcon style={{ width: 11, height: 11, color: 'white' }} />
            </div>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'white' }}>{usuario.nombre}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario.email}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: '#cbd5e1' }}>
              {nivelActual.nombre}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16 }}>
          {[
            { label: 'Puntos', value: puntos },
            { label: 'Racha', value: usuario.rachaActual ?? 0 },
            { label: 'Nivel', value: nivel },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>{value}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Progreso de nivel */}
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>Nivel {nivel} · {nivelActual.nombre}</div>
            <div style={{ fontSize: 12, color: '#1F7CFF', fontWeight: 700 }}>{puntos} pts</div>
          </div>
          <div style={{ height: 7, background: '#F4F5F7', borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ width: `${porcentaje}%`, height: '100%', background: 'linear-gradient(90deg, #1F7CFF, #60a5fa)', borderRadius: 999, transition: '0.4s' }} />
          </div>
          <div style={{ fontSize: 11, color: TEXT_MUTED }}>
            {nivelSiguiente ? `${puntosParaSiguiente} puntos para ${nivelSiguiente.nombre}` : '🏆 Nivel máximo alcanzado'}
          </div>
        </div>

        {/* Mapa de niveles */}
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 12 }}>Mapa de niveles</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {NIVELES.map((n) => {
              const conseguido = nivel >= n.nivel;
              const esActual = nivel === n.nivel;
              return (
                <div
                  key={n.nivel}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    flexShrink: 0, width: 78, padding: '10px 6px', borderRadius: 12,
                    background: esActual ? '#EAF0FF' : '#FAFAFA',
                    border: esActual ? '1px solid #bfdbfe' : '1px solid #F1F5F9',
                    opacity: conseguido ? 1 : 0.4,
                  }}
                >
                  <img src={getOploUrl(n.nivel)} alt={n.nombre} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8 }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: esActual ? '#1F7CFF' : TEXT_PRIMARY, textAlign: 'center' }}>{n.nombre}</div>
                  <div style={{ fontSize: 10, color: TEXT_MUTED }}>{n.puntosMax ? `${n.puntosMin}-${n.puntosMax}` : `${n.puntosMin}+`}</div>
                  {esActual && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 999, background: '#1F7CFF', color: 'white', fontWeight: 700 }}>Actual</span>}
                  {conseguido && !esActual && <span style={{ fontSize: 12, color: '#16A34A' }}>✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Menú */}
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, overflow: 'hidden' }}>
          {[
            { icon: <ShieldCheckIcon style={{ width: 17, height: 17, color: TEXT_SECONDARY }} />, title: 'Mi oposición', subtitle: usuario.oposicionActiva?.nombre, href: '/app/oposicion' },
            { icon: <CreditCardIcon style={{ width: 17, height: 17, color: TEXT_SECONDARY }} />, title: 'Mi suscripción', subtitle: usuario.suscripcion === 'gratuito' ? 'Descubre OPLORA PRO' : 'Plan Profesional', href: '/app/suscripciones' },
            { icon: <BellIcon style={{ width: 17, height: 17, color: TEXT_SECONDARY }} />, title: 'Notificaciones', subtitle: 'Alertas y recordatorios', href: '/app/alertas' },
            { icon: <Cog6ToothIcon style={{ width: 17, height: 17, color: TEXT_SECONDARY }} />, title: 'Preferencias', subtitle: 'Ajustes de la aplicación', href: '/app/preferencias' },
          ].map(({ icon, title, subtitle, href }, i, arr) => (
            <button
              key={title}
              onClick={() => router.push(href)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: 'none', border: 'none', borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{title}</div>
                {subtitle && <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>}
              </div>
              <ArrowRightIcon style={{ width: 14, height: 14, color: '#D1D5DB', flexShrink: 0 }} />
            </button>
          ))}
        </div>

        {/* Soporte */}
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
            💬
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>¿Necesitas ayuda?</div>
            <div style={{ fontSize: 11, color: TEXT_MUTED }}>Estamos contigo durante el proceso</div>
          </div>
          <button
            onClick={() => router.push('/app/soporte')}
            style={{ padding: '8px 13px', background: '#111827', color: 'white', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Contactar
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 13, background: 'white', border: '1px solid #F1F5F9', borderRadius: 14, color: '#dc2626', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          <ArrowLeftStartOnRectangleIcon style={{ width: 17, height: 17 }} />
          Cerrar sesión
        </button>

      </div>

      {/* Modal selección de avatar */}
      {modalAvatar && (
        <div
          onClick={() => !subiendo && setModalAvatar(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 60 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: BG_APP, borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%', maxWidth: 420 }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 16, textAlign: 'center' }}>
              Foto de perfil
            </div>

            <input
              ref={inputCamara}
              type="file"
              accept="image/*"
              capture="user"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && subirImagen(e.target.files[0])}
            />
            <input
              ref={inputGaleria}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && subirImagen(e.target.files[0])}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => inputCamara.current?.click()}
                disabled={subiendo}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'white', border: 'none', borderRadius: 14, cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EAF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CameraIcon style={{ width: 17, height: 17, color: '#1F7CFF' }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>Hacer un selfie</div>
              </button>

              <button
                onClick={() => inputGaleria.current?.click()}
                disabled={subiendo}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'white', border: 'none', borderRadius: 14, cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F0FC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhotoIcon style={{ width: 17, height: 17, color: '#8B5CF6' }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>Elegir de la galería</div>
              </button>

              <button
                onClick={usarIconoOplo}
                disabled={subiendo}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'white', border: 'none', borderRadius: 14, cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F4F5F7', overflow: 'hidden' }}>
                  <img src={getOploUrl(nivel)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>Usar icono OPLORA</div>
              </button>
            </div>

            <button
              onClick={() => setModalAvatar(false)}
              disabled={subiendo}
              style={{ width: '100%', marginTop: 12, padding: 13, background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              {subiendo ? 'Subiendo...' : 'Cancelar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}