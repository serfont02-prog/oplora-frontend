'use client';

// ⭐ Piezas comunes de las pantallas de entrada (login, registro, recuperar y restablecer
// contraseña), con el mismo sistema que el resto de la app: fondo azul del Inicio, tarjeta
// blanca con sombra, iconos lucide, botón principal oscuro y enlaces en el azul de marca.

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import LogoOplora, { COLOR_MARCA } from '@/components/marca/LogoOplora';
import { BG_DASHBOARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '@/styles/tokens';

export const SOMBRA = '0 6px 18px rgba(15, 23, 42, 0.08)';
export const COLOR_ENLACE = COLOR_MARCA;

/* ───────────── Pantalla ───────────── */
export function PantallaAuth({
  titulo,
  subtitulo,
  encabezado,
  children,
  pie,
}: {
  titulo?: string;
  subtitulo?: string;
  /** Contenido opcional entre el título y el formulario (p. ej. la barra de pasos). */
  encabezado?: React.ReactNode;
  children: React.ReactNode;
  pie?: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG_DASHBOARD,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.25rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`@keyframes oplora-girar { to { transform: rotate(360deg); } }`}</style>

      {/* Fondo: dos círculos suaves, como los círculos flotantes del Inicio */}
      <div aria-hidden style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: 'rgba(31,124,255,0.10)', top: -160, right: -140 }} />
      <div aria-hidden style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.65)', bottom: -120, left: -110 }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <LogoOplora alto={44} />
        </div>

        <main style={{ background: 'white', borderRadius: 24, boxShadow: SOMBRA, padding: '26px 22px 24px' }}>
          {(titulo || subtitulo) && (
            <header style={{ marginBottom: 18 }}>
              {titulo && <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.3 }}>{titulo}</h1>}
              {subtitulo && <p style={{ fontSize: 13, color: TEXT_SECONDARY, margin: '4px 0 0', lineHeight: 1.5 }}>{subtitulo}</p>}
            </header>
          )}
          {encabezado}
          {children}
        </main>

        {pie && (
          <div style={{ textAlign: 'center', fontSize: 13, color: TEXT_SECONDARY, marginTop: 18 }}>
            {pie}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────── Campo ───────────── */
export function CampoAuth({
  icono: Icono,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  conOjo = false,
  prefijo,
  ayuda,
  maxLength,
  autoFocus,
  inputMode,
}: {
  icono?: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  /** Botón para mostrar u ocultar la contraseña. */
  conOjo?: boolean;
  /** Texto fijo delante del valor (p. ej. "@" en el nick). */
  prefijo?: string;
  ayuda?: React.ReactNode;
  maxLength?: number;
  autoFocus?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  const [foco, setFoco] = useState(false);
  const [visible, setVisible] = useState(false);
  const tipo = conOjo ? (visible ? 'text' : 'password') : type;

  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 5 }}>{label}</span>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: foco ? 'white' : '#F8FAFC',
          border: `1.5px solid ${foco ? COLOR_MARCA : '#E5E7EB'}`,
          boxShadow: foco ? '0 0 0 3px rgba(31,124,255,0.15)' : 'none',
          borderRadius: 12,
          padding: '0 12px',
          transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
        }}
      >
        {Icono && <Icono size={17} color={foco ? COLOR_MARCA : TEXT_MUTED} />}
        {prefijo && <span style={{ fontSize: 14, color: TEXT_MUTED, marginRight: -6 }}>{prefijo}</span>}
        <input
          type={tipo}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFoco(true)}
          onBlur={() => setFoco(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          autoFocus={autoFocus}
          inputMode={inputMode}
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', padding: '12px 0', fontSize: 15, color: TEXT_PRIMARY }}
        />
        {conOjo && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MUTED, padding: 4, display: 'flex', marginRight: -4 }}
          >
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </span>
      {ayuda && <span style={{ display: 'block', fontSize: 11, color: TEXT_MUTED, marginTop: 5 }}>{ayuda}</span>}
    </label>
  );
}

/* ───────────── Botones ───────────── */
export function BotonAuth({
  children,
  cargando = false,
  textoCargando,
  onClick,
  type = 'submit',
  variante = 'principal',
  disabled,
}: {
  children: React.ReactNode;
  cargando?: boolean;
  textoCargando?: string;
  onClick?: () => void;
  type?: 'submit' | 'button';
  variante?: 'principal' | 'secundario';
  disabled?: boolean;
}) {
  const principal = variante === 'principal';
  const bloqueado = cargando || disabled;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={bloqueado}
      style={{
        flex: 1,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 700,
        cursor: bloqueado ? 'default' : 'pointer',
        border: principal ? 'none' : '1.5px solid #E5E7EB',
        background: principal ? '#0f172a' : 'white',
        color: principal ? 'white' : TEXT_PRIMARY,
        opacity: bloqueado && !cargando ? 0.5 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {cargando && <Loader2 size={16} style={{ animation: 'oplora-girar 0.8s linear infinite' }} />}
      {cargando && textoCargando ? textoCargando : children}
    </button>
  );
}

/* ───────────── Avisos ───────────── */
const AVISOS = {
  error: { Icono: AlertCircle, color: '#B91C1C', bg: '#FEF2F2' },
  info: { Icono: Info, color: '#1E40AF', bg: '#EFF6FF' },
  ok: { Icono: CheckCircle2, color: '#15803D', bg: '#F0FDF4' },
} as const;

export function AvisoAuth({ tipo = 'error', children }: { tipo?: keyof typeof AVISOS; children: React.ReactNode }) {
  const { Icono, color, bg } = AVISOS[tipo];
  return (
    <div role={tipo === 'error' ? 'alert' : 'status'} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, lineHeight: 1.45, color, background: bg, borderRadius: 12, padding: '10px 12px' }}>
      <Icono size={15} color={color} />
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );
}

/* ───────────── Estado (enviado, completado, enlace caducado…) ───────────── */
export function EstadoAuth({
  icono: Icono,
  color,
  fondo,
  titulo,
  texto,
  children,
}: {
  icono: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  fondo: string;
  titulo: string;
  texto: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ textAlign: 'center', padding: '4px 0' }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: fondo, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <Icono size={26} color={color} />
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>{titulo}</div>
      <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6, marginBottom: 20 }}>{texto}</div>
      {children}
    </div>
  );
}

export function EnlaceAuth({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ color: COLOR_ENLACE, fontWeight: 600, textDecoration: 'none' }}>
      {children}
    </Link>
  );
}
