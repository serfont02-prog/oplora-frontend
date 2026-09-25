'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

export default function AdminPsicotecnicosConvocatoriaPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const oposicionId = params.id as string;
  const convocatoriaId = params.convocatoriaId as string;

  const { data: catalogo = [] } = useQuery({
    queryKey: ['psicotecnicos-catalogo'],
    queryFn: async () => (await api.get('/psicotecnicos/catalogo')).data,
  });

  const { data: config = [], isLoading } = useQuery({
    queryKey: ['psicotecnicos-admin-config', oposicionId],
    queryFn: async () => (await api.get(`/psicotecnicos/admin/config/${oposicionId}`)).data,
  });

  // Por cada tipo: la fila propia de esta convocatoria manda; si no existe,
  // se muestra (de forma informativa) la config por defecto de la oposición.
  const configPorTipo: Record<string, { propia?: any; porDefecto?: any }> = {};
  for (const c of config) {
    const entry = (configPorTipo[c.tipo] ??= {});
    if (c.convocatoria?.id === convocatoriaId) entry.propia = c;
    else if (!c.convocatoria) entry.porDefecto = c;
  }

  const upsert = useMutation({
    mutationFn: async (datos: any) => (await api.post('/psicotecnicos/admin/config', { oposicionId, convocatoriaId, ...datos })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['psicotecnicos-admin-config', oposicionId] }),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '10px 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => router.push(`/admin/oposiciones/${oposicionId}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          Volver
        </button>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>Psicotécnicos</span>
      </div>

      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Psicotécnicos de esta convocatoria</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
          Activa solo las modalidades que corresponden a esta convocatoria. Si cambia algo en la siguiente, se copiará
          igualmente y aquí solo tocarás lo que cambie (sin afectar a convocatorias anteriores).
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {isLoading ? (
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>Cargando...</div>
          ) : (
            catalogo.map((t: any) => {
              const entry = configPorTipo[t.tipo];
              const efectiva = entry?.propia ?? entry?.porDefecto;
              const habilitado = efectiva?.habilitado ?? false;
              const esHeredada = !entry?.propia && !!entry?.porDefecto;

              return (
                <div key={t.tipo} style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '22px', flexShrink: 0 }}>{t.icono}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{t.nombre}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{t.descripcion}</div>
                      {esHeredada && (
                        <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '3px', fontStyle: 'italic' }}>
                          Heredado de la config de la oposición
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => upsert.mutate({ tipo: t.tipo, habilitado: !habilitado })}
                      style={{
                        flexShrink: 0, padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none',
                        background: habilitado ? '#111827' : '#f3f4f6',
                        color: habilitado ? 'white' : '#6b7280',
                      }}
                    >
                      {habilitado ? 'Activado' : 'Activar'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
