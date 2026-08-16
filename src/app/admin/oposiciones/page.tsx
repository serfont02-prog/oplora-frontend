'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Search, Plus, ChevronRight } from 'lucide-react';
import { api, Oposicion } from '@/lib/api';

export default function OposicionesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: oposiciones = [], isLoading } = useQuery({
    queryKey: ['oposiciones', search],
    queryFn: async () => {
      const res = await api.get('/oposiciones', { params: search ? { search } : {} });
      return res.data as any[];
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Oposiciones</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{oposiciones.length} registradas</div>
        </div>
        <button
          onClick={() => router.push('/admin/oposiciones/nueva')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
        >
          <Plus size={14} />
          Nueva oposición
        </button>
      </div>

      {/* Buscador */}
      <div style={{ padding: '12px 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white' }}>
        <div style={{ position: 'relative', maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Buscar oposición..."
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
        ) : oposiciones.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎯</div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>No hay oposiciones registradas</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                {['Nombre', 'Subgrupo', 'Administración', 'Estado', 'Convocatorias', 'Leyes', ''].map((h) => (
                  <th key={h} style={{ textAlign: h === 'Convocatorias' || h === 'Leyes' ? 'center' : 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f9fafb' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {oposiciones.map((op) => (
                <tr
                  key={op.id}
                  onClick={() => router.push(`/admin/oposiciones/${op.id}`)}
                  style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: 'white' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{op.nombre}</div>
                    {op.ministerio && (
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{op.ministerio}</div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {(op as any).subgrupo ? (
                      <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: '#f3f4f6', color: '#374151', fontWeight: 500 }}>
                        {(op as any).subgrupo}
                      </span>
                    ) : <span style={{ fontSize: '13px', color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
  {op.tipoAdministracion === 'estado' ? 'Estado'
    : op.tipoAdministracion === 'empresa_publica' ? 'Empresa pública'
    : op.tipoAdministracion === 'ccaa' ? (op.administracion || 'Comunidad Autónoma')
    : '—'}
</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', fontWeight: 500, background: (op as any).convocatoriasActivas > 0 ? '#f0fdf4' : '#f3f4f6', color: (op as any).convocatoriasActivas > 0 ? '#15803d' : '#6b7280' }}>
                      {(op as any).convocatoriasActivas > 0 ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                    {(op as any).totalConvocatorias ?? 0}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                    {(op as any).totalLeyes ?? 0}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <ChevronRight size={14} color="#d1d5db" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}