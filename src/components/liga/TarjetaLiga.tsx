'use client';

// ⭐ Liga Oplora — tarjeta resumen para Inicio y Retos. Si el usuario no tiene liga, no se pinta.

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Trophy, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { COLOR_LIGA, BG_LIGA, CopaBadge, estadoJornada } from './ligaUtils';

export function useMiLiga(enabled = true) {
  return useQuery({
    queryKey: ['liga-mia'],
    queryFn: async () => (await api.get('/liga/mia')).data,
    enabled,
    staleTime: 60_000,
  });
}

/**
 * `soloSiRelevante` (Inicio): solo se muestra si hay jornada próxima o abierta, o si la última
 * cerró hace menos de 2 días (para ver el resultado). El resto de la semana no ocupa sitio.
 */
export default function TarjetaLiga({ soloSiRelevante = false }: { soloSiRelevante?: boolean }) {
  const router = useRouter();
  const { data } = useMiLiga();

  if (!data?.liga) return null;
  if (soloSiRelevante) {
    const j = data.jornada;
    const recienCerrada = j?.estado === 'cerrada' && Date.now() - new Date(j.fechaCierre).getTime() < 2 * 86400000;
    if (!j || !(j.estado === 'programada' || j.estado === 'abierta' || recienCerrada)) return null;
  }
  const estado = estadoJornada(data);

  return (
    <div
      onClick={() => router.push('/app/liga')}
      style={{
        background: 'white',
        borderRadius: 18,
        padding: 14,
        border: estado.destacado ? `1.5px solid ${COLOR_LIGA}` : 'none',
        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: BG_LIGA, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Trophy size={19} color={COLOR_LIGA} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Liga Oplora</div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>{data.nombreDivision} división · Convocatoria {data.convocatoria?.anyo}</div>
        </div>
        <CopaBadge color={data.copas?.color ?? null} veces={data.copas?.veces} />
        <ChevronRight size={16} color="#9CA3AF" />
      </div>

      <div style={{ background: estado.destacado ? BG_LIGA : '#F8F9FA', borderRadius: 12, padding: '10px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: estado.destacado ? COLOR_LIGA : '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {estado.etiqueta}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginTop: 2 }}>{estado.titulo}</div>
        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{estado.detalle}</div>
      </div>

      {estado.accion && (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(estado.accion!.href); }}
          style={{
            width: '100%', border: 'none', borderRadius: 12, padding: '11px',
            background: estado.destacado ? COLOR_LIGA : '#111827', color: 'white',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {estado.accion.label}
        </button>
      )}
    </div>
  );
}
