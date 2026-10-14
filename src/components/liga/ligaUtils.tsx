'use client';

// ⭐ Liga Oplora — utilidades compartidas por las pantallas de la liga.

import { Trophy } from 'lucide-react';
import { getOploUrl } from '@/lib/oplo';

export const COLOR_LIGA = '#C2410C';
export const BG_LIGA = '#FCEEE8';

export const HEX_COPA: Record<string, string> = {
  oro: '#EAB308',
  plata: '#94A3B8',
  bronce: '#B45309',
  azul: '#2563EB',
  verde: '#16A34A',
  temporada: '#7C3AED',
};

export const NOMBRE_COPA: Record<string, string> = {
  oro: 'Copa de oro',
  plata: 'Copa de plata',
  bronce: 'Copa de bronce',
  azul: 'Copa azul',
  verde: 'Copa verde',
  temporada: 'Copa de temporada',
};

export const NOMBRE_DIVISION: Record<number, string> = {
  1: 'Primera',
  2: 'Segunda',
  3: 'Tercera',
  4: 'Cuarta',
  5: 'Quinta',
};

const TZ = 'Europe/Madrid';

/** "viernes 18:00" */
export function diaHora(fecha: string | Date): string {
  const d = new Date(fecha);
  const dia = new Intl.DateTimeFormat('es-ES', { timeZone: TZ, weekday: 'long' }).format(d);
  const hora = new Intl.DateTimeFormat('es-ES', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(d);
  return `${dia} ${hora}`;
}

/** "viernes 16 oct, 18:00" */
export function fechaCompleta(fecha: string | Date): string {
  const d = new Date(fecha);
  const dia = new Intl.DateTimeFormat('es-ES', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'short' }).format(d);
  const hora = new Intl.DateTimeFormat('es-ES', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(d);
  return `${dia}, ${hora}`;
}

/** "octubre 2026" a partir de "2026-10" */
export function nombreMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  if (!a || !m) return mes;
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(a, m - 1, 15)));
}

export function sumarMes(mes: string, delta: number): string {
  const [a, m] = mes.split('-').map(Number);
  const d = new Date(Date.UTC(a, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** 754000 → "12:34" */
export function formatoTiempo(ms: number | null | undefined): string {
  if (ms == null) return '—';
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/** "2 d 4 h", "3 h 12 min", "8 min" */
export function cuentaAtras(hasta: string | Date, ahora = Date.now()): string {
  const ms = new Date(hasta).getTime() - ahora;
  if (ms <= 0) return 'ya';
  const min = Math.floor(ms / 60000);
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const mm = min % 60;
  if (d > 0) return `${d} d ${h} h`;
  if (h > 0) return `${h} h ${mm} min`;
  return `${Math.max(1, mm)} min`;
}

export function formatoNota(nota: number | null | undefined): string {
  if (nota == null) return '—';
  return Number(nota).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatoPuntos(p: number | null | undefined): string {
  if (p == null) return '—';
  return Number(p).toLocaleString('es-ES', { maximumFractionDigits: 1 });
}

export function mensajeError(e: any, porDefecto = 'Ha ocurrido un error'): string {
  const m = e?.response?.data?.message;
  if (Array.isArray(m)) return m.join('. ');
  return typeof m === 'string' ? m : porDefecto;
}

/** Copa con número (la mejor que tiene el usuario y cuántas veces). */
export function CopaBadge({ color, veces, size = 22 }: { color: string | null; veces?: number; size?: number }) {
  if (!color) return null;
  const hex = HEX_COPA[color] ?? '#94A3B8';
  return (
    <span
      title={NOMBRE_COPA[color] ?? 'Copa'}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: '50%', background: 'white', boxShadow: '0 0 0 1.5px ' + hex, flexShrink: 0 }}
    >
      <Trophy size={Math.round(size * 0.6)} color={hex} strokeWidth={2.2} />
      {veces != null && veces > 1 && (
        <span style={{ position: 'absolute', right: -5, bottom: -4, minWidth: 14, height: 14, padding: '0 3px', borderRadius: 999, background: hex, color: 'white', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
          {veces}
        </span>
      )}
    </span>
  );
}

/**
 * Copa sobre el avatar (esquina superior derecha). `copa` es `usuario.copaLiga`:
 * { color, veces, total } o null. El contenedor del avatar debe ser position: relative
 * y no recortar (overflow visible).
 */
export function CopaEnAvatar({ copa, size }: { copa: any; size: number }) {
  if (!copa?.color) return null;
  const d = Math.max(16, Math.round(size * 0.4));
  return (
    <span style={{ position: 'absolute', top: -Math.round(d * 0.25), right: -Math.round(d * 0.25), pointerEvents: 'none' }}>
      <CopaBadge color={copa.color} veces={copa.veces} size={d} />
    </span>
  );
}

/** Avatar pequeño a partir de los datos públicos que devuelve la liga. */
export function AvatarMini({ usuario, size = 30 }: { usuario: any; size?: number }) {
  const src = usuario?.tipoAvatar === 'foto' && usuario?.avatarUrl ? usuario.avatarUrl : getOploUrl(1);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <img src={src} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', background: '#F1F5F9' }} />
      <CopaEnAvatar copa={usuario?.copaLiga} size={size} />
    </span>
  );
}

export function nombreVisible(usuario: any): string {
  return usuario?.nick || usuario?.nombre || 'Opositor';
}

/** Texto y acción de la jornada actual, a partir de GET /liga/mia. */
export function estadoJornada(data: any): {
  etiqueta: string;
  titulo: string;
  detalle: string;
  accion: { label: string; href: string } | null;
  destacado: boolean;
} {
  const j = data?.jornada;
  const r = data?.miResultado;
  if (!j) {
    return { etiqueta: 'Próximamente', titulo: 'Aún no hay jornadas', detalle: 'El lunes se anuncian los temas de la jornada del fin de semana.', accion: null, destacado: false };
  }
  const minutos = Math.round((j.tiempoLimiteSeg ?? 0) / 60);
  if (j.estado === 'programada') {
    return {
      etiqueta: 'Próxima jornada',
      titulo: j.descripcion || 'Jornada del fin de semana',
      detalle: `Abre el ${fechaCompleta(j.fechaApertura)} · ${j.numPreguntas} preguntas · ${minutos} min`,
      accion: null,
      destacado: false,
    };
  }
  if (j.estado === 'abierta') {
    if (r?.enviado) {
      return {
        etiqueta: 'Jornada entregada',
        titulo: `Nota ${formatoNota(r.nota)}`,
        detalle: `Clasificación y soluciones el ${diaHora(j.fechaCierre)}`,
        accion: { label: 'Ver clasificación', href: '/app/liga/clasificacion?tab=jornada' },
        destacado: false,
      };
    }
    if (r?.iniciado) {
      return {
        etiqueta: 'Jornada en curso',
        titulo: j.descripcion || 'Jornada del fin de semana',
        detalle: 'Tienes la jornada empezada: el tiempo sigue corriendo.',
        accion: { label: 'Continuar', href: `/app/liga/jugar/${j.id}` },
        destacado: true,
      };
    }
    return {
      etiqueta: '¡Jornada abierta!',
      titulo: j.descripcion || 'Jornada del fin de semana',
      detalle: `${j.numPreguntas} preguntas · ${minutos} min · cierra el ${diaHora(j.fechaCierre)}`,
      accion: { label: 'Jugar jornada', href: `/app/liga/jugar/${j.id}` },
      destacado: true,
    };
  }
  if (j.estado === 'cancelada') {
    return { etiqueta: 'Jornada cancelada', titulo: j.descripcion || 'Jornada cancelada', detalle: j.motivoCancelacion || 'Esta jornada no se ha disputado.', accion: null, destacado: false };
  }
  // cerrada
  if (r?.enviado) {
    return {
      etiqueta: 'Última jornada',
      titulo: `${r.posicion ?? '—'}º · +${formatoPuntos(r.puntos)} puntos`,
      detalle: `Nota ${formatoNota(r.nota)} · ${j.descripcion ?? ''}`.trim(),
      accion: { label: 'Ver revisión', href: `/app/liga/revision/${j.id}` },
      destacado: false,
    };
  }
  return {
    etiqueta: 'Última jornada',
    titulo: 'No la jugaste',
    detalle: 'El lunes se anuncian los temas de la siguiente.',
    accion: { label: 'Ver soluciones', href: `/app/liga/revision/${j.id}` },
    destacado: false,
  };
}
