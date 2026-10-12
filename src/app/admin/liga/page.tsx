'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, ChevronRight, Trophy, X } from 'lucide-react';
import { api } from '@/lib/api';
import { BG_NEUTRAL } from '@/styles/tokens';

// ⭐ Liga Oplora — listado de ligas (una por convocatoria) y alta de una nueva.

const NOMBRE_DIVISION: Record<number, string> = { 1: 'Primera', 2: 'Segunda', 3: 'Tercera', 4: 'Cuarta', 5: 'Quinta' };

const ESTILO_ESTADO: Record<string, { bg: string; color: string; texto: string }> = {
  activa: { bg: '#f0fdf4', color: '#15803d', texto: 'Activa' },
  pausada: { bg: '#fffbeb', color: '#b45309', texto: 'Pausada' },
  cerrada: { bg: '#f3f4f6', color: '#6b7280', texto: 'Cerrada' },
};

function mensajeError(e: any): string {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join('. ') : m ?? 'Ha ocurrido un error';
}

export default function LigasAdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [creando, setCreando] = useState(false);
  const [oposicionId, setOposicionId] = useState('');
  const [convocatoriaId, setConvocatoriaId] = useState('');

  const { data: ligas = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-ligas'],
    queryFn: async () => (await api.get('/liga/admin')).data as any[],
  });

  const { data: oposiciones = [] } = useQuery({
    queryKey: ['oposiciones', ''],
    queryFn: async () => (await api.get('/oposiciones')).data as any[],
    enabled: creando,
  });

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['admin-liga-convocatorias', oposicionId],
    queryFn: async () => (await api.get(`/convocatorias/oposicion/${oposicionId}`)).data as any[],
    enabled: creando && !!oposicionId,
  });

  const crear = useMutation({
    mutationFn: async () => (await api.post('/liga/admin', { convocatoriaId })).data,
    onSuccess: (liga: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ligas'] });
      router.push(`/admin/liga/${liga.id}`);
    },
  });

  const convocatoriasConLiga = new Set(ligas.map((l) => l.convocatoria?.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Cabecera */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Liga Oplora</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
            Una liga por convocatoria · jornadas cada fin de semana · {ligas.length} {ligas.length === 1 ? 'liga' : 'ligas'}
          </div>
        </div>
        <button
          onClick={() => { setCreando(true); crear.reset(); }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
        >
          <Plus size={14} />
          Nueva liga
        </button>
      </div>

      {/* Alta */}
      {creando && (
        <div style={{ padding: '1rem 1.5rem', background: 'white', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Crear liga para una convocatoria</div>
            <button onClick={() => setCreando(false)} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#374151' }}>
              Oposición
              <select
                value={oposicionId}
                onChange={(e) => { setOposicionId(e.target.value); setConvocatoriaId(''); }}
                style={{ minWidth: 260, padding: '8px 10px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8 }}
              >
                <option value="">Elige oposición…</option>
                {oposiciones.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#374151' }}>
              Convocatoria
              <select
                value={convocatoriaId}
                onChange={(e) => setConvocatoriaId(e.target.value)}
                disabled={!oposicionId}
                style={{ minWidth: 200, padding: '8px 10px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8 }}
              >
                <option value="">Elige convocatoria…</option>
                {convocatorias.map((c) => (
                  <option key={c.id} value={c.id} disabled={convocatoriasConLiga.has(c.id)}>
                    {c.anyo}{c.estado ? ` · ${c.estado}` : ''}{convocatoriasConLiga.has(c.id) ? ' · ya tiene liga' : ''}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => crear.mutate()}
              disabled={!convocatoriaId || crear.isPending}
              style={{ padding: '9px 16px', background: !convocatoriaId ? '#d1d5db' : '#111827', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: !convocatoriaId ? 'not-allowed' : 'pointer' }}
            >
              {crear.isPending ? 'Creando…' : 'Crear liga'}
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
            Se crea activa con los valores por defecto (5 divisiones, jornada de viernes 18:00 a domingo 22:00, asciende el 20 %). Todos los usuarios con esta convocatoria activa entran en Quinta automáticamente.
          </div>
          {crear.isError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>{mensajeError(crear.error)}</div>}
        </div>
      )}

      {/* Tabla */}
      <div style={{ flex: 1, overflowY: 'auto', background: BG_NEUTRAL }}>
        {isLoading ? (
          <div style={{ padding: '2rem', fontSize: '13px', color: '#6b7280' }}>Cargando…</div>
        ) : isError ? (
          <div style={{ padding: '2rem', fontSize: '13px', color: '#dc2626' }}>
            No se pudieron cargar las ligas.{' '}
            <button onClick={() => refetch()} style={{ background: 'none', border: 'none', color: '#111827', textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}>Reintentar</button>
          </div>
        ) : ligas.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Trophy size={28} color="#9ca3af" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: '13px', color: '#6b7280' }}>Todavía no hay ninguna liga. Crea la primera para una convocatoria.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                {['Convocatoria', 'Estado', 'Jugadores por división', 'Total', 'Examen', ''].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f9fafb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ligas.map((l) => {
                const est = ESTILO_ESTADO[l.estado] ?? ESTILO_ESTADO.cerrada;
                const porDiv: Record<number, number> = l.miembrosPorDivision ?? {};
                const total = Object.values(porDiv).reduce((a, b) => a + Number(b), 0);
                return (
                  <tr
                    key={l.id}
                    onClick={() => router.push(`/admin/liga/${l.id}`)}
                    style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: 'white' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{l.convocatoria?.oposicion?.nombre ?? 'Oposición'}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Convocatoria {l.convocatoria?.anyo}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', fontWeight: 500, background: est.bg, color: est.color }}>{est.texto}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#374151' }}>
                      {[1, 2, 3, 4, 5].map((d) => (
                        <span key={d} style={{ marginRight: 10 }}>
                          {NOMBRE_DIVISION[d].slice(0, 3)}. <strong>{porDiv[d] ?? 0}</strong>
                        </span>
                      ))}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#111827' }}>{total}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#6b7280' }}>
                      {l.convocatoria?.fechaExamen ? new Date(l.convocatoria.fechaExamen).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}><ChevronRight size={14} color="#d1d5db" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
