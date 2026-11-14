'use client';

// ⭐ Acceso a OPLORA (planes de nov 2026): prueba de 5 días, pago o solo el Tema 1 gratis.
// El servidor es quien decide; esto solo sirve para enseñar candados y avisos.

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const TEMA_GRATIS = 1;
export const EVENTO_SUSCRIPCION = 'oplora:suscripcion';

export type MotivoAcceso = 'admin' | 'regalo' | 'pago' | 'prueba' | 'gratis';
export interface Acceso {
  completo: boolean;
  motivo: MotivoAcceso;
  accesoHasta: string | null;
  pruebaHasta: string | null;
  renovacionAutomatica: boolean;
  temaGratis: number;
}

/** Acceso del usuario (lee /usuarios/limites, la misma consulta que ya usan otras pantallas). */
export function useAcceso(activo = true) {
  const q = useQuery({
    queryKey: ['limites'],
    queryFn: async () => (await api.get('/usuarios/limites')).data,
    enabled: activo,
  });
  const acceso: Acceso | undefined = q.data?.acceso;
  return {
    acceso,
    cargando: q.isLoading,
    // Mientras no se sabe, no se enseñan candados (el servidor protege igualmente)
    completo: acceso ? acceso.completo : true,
    refetch: q.refetch,
  };
}

/** ¿Está bloqueado este tema para el usuario? */
export function temaBloqueado(acceso: Acceso | undefined, numeroTema: number | undefined | null): boolean {
  return !!acceso && !acceso.completo && Number(numeroTema) !== (acceso.temaGratis ?? TEMA_GRATIS);
}

/** Días que quedan (redondeando hacia arriba) hasta una fecha. */
export function diasHasta(fecha: string | null | undefined): number {
  if (!fecha) return 0;
  return Math.max(0, Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000));
}

/** Abre la hoja «Esto es de OPLORA» desde cualquier pantalla. */
export function pedirSuscripcion(motivo: 'requiere_suscripcion' | 'tema_bloqueado' = 'requiere_suscripcion', mensaje?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENTO_SUSCRIPCION, { detail: { motivo, mensaje } }));
}

/** Si un error del servidor es «hace falta OPLORA», devuelve su motivo y mensaje. */
export function motivoSuscripcion(error: any): { motivo: string; mensaje?: string } | null {
  if (error?.response?.status !== 403) return null;
  const m = error?.response?.data?.message;
  if (typeof m !== 'string' || !m.startsWith('{')) return null;
  try {
    const d = JSON.parse(m);
    return d?.motivo === 'requiere_suscripcion' || d?.motivo === 'tema_bloqueado' ? d : null;
  } catch {
    return null;
  }
}
