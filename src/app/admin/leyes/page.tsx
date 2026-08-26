'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Search, Plus, ChevronRight, BookOpen } from 'lucide-react';
import { api } from '@/lib/api';

export default function LeyesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: leyes = [], isLoading } = useQuery({
    queryKey: ['leyes', search],
    queryFn: async () => {
      const res = await api.get('/leyes', { params: search ? { search } : {} });
      return res.data;
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Leyes</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{leyes.length} cargadas</div>
        </div>
        <button
          onClick={() => router.push('/admin/leyes/nueva')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
        >
          <Plus size={14} />
          Añadir ley
        </button>
      </div>

      {/* Buscador */}
      <div style={{ padding: '12px 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white' }}>
        <div style={{ position: 'relative', maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Buscar ley..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Tabla */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f9fafb' }}>
        {isLoading ? (
          <div style={{ padding: '2rem', fontSize: '13px', color: '#9ca3af' }}>Cargando...</div>
        ) : leyes.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <BookOpen size={32} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '12px' }}>No hay leyes cargadas</div>
            <button
              onClick={() => router.push('/admin/leyes/nueva')}
              style={{ fontSize: '13px', color: '#374151', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '8px', background: 'white', cursor: 'pointer' }}
            >
              Subir primera ley
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                {['Nombre', 'Tipo', 'Última modificación', 'Versión activa', 'Versiones', 'Oposiciones', ''].map((h) => (
                  <th key={h} style={{ textAlign: ['Versión activa', 'Versiones', 'Oposiciones'].includes(h) ? 'center' : 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f9fafb' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leyes.map((ley: any) => {
                const versionActiva = ley.versiones?.find((v: any) => v.activa);
                const totalVersiones = ley.versiones?.length ?? 0;
                return (
                  <tr
                    key={ley.id}
                    onClick={() => router.push(`/admin/leyes/${ley.id}`)}
                    style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: 'white' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{ley.nombre}</div>
                      {ley.descripcion && (
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{ley.descripcion}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {versionActiva?.tipoNorma ? (
                        <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: '#fffbeb', color: '#92400e', fontWeight: 500 }}>
                          {versionActiva.tipoNorma}
                        </span>
                      ) : <span style={{ fontSize: '13px', color: '#9ca3af' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                      {versionActiva?.fechaVigencia
                        ? new Date(versionActiva.fechaVigencia).toLocaleDateString('es-ES')
                        : versionActiva?.fechaPublicacion
                          ? new Date(versionActiva.fechaPublicacion).toLocaleDateString('es-ES')
                          : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {versionActiva ? (
                        <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: '#f0fdf4', color: '#15803d', fontWeight: 500 }}>
                          v{versionActiva.version}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#d1d5db' }}>Sin versión</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                      {totalVersiones}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                      {ley.oposicionLeyes?.length ?? 0}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <ChevronRight size={14} color="#d1d5db" />
                    </td>
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