'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Search, ChevronDown } from 'lucide-react';

const CCAA = [
  'Andalucía', 'Aragón', 'Asturias', 'Baleares', 'Canarias',
  'Cantabria', 'Castilla-La Mancha', 'Castilla y León', 'Cataluña',
  'Extremadura', 'Galicia', 'La Rioja', 'Madrid', 'Murcia',
  'Navarra', 'País Vasco', 'Valencia',
];

export default function CatalogoPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<'todas' | 'age' | 'ccaa'>('todas');
  const [ccaaSeleccionada, setCcaaSeleccionada] = useState('');
  const [mostrarCcaa, setMostrarCcaa] = useState(false);

  const { data: oposiciones = [], isLoading } = useQuery({
    queryKey: ['oposiciones-catalogo', search],
    queryFn: async () => {
      const res = await api.get('/oposiciones', { params: search ? { search } : {} });
      return res.data;
    },
  });

  const oposicionesFiltradas = oposiciones.filter((op: any) => {
    if (filtro === 'age') return op.administracion?.toLowerCase().includes('estado') || op.administracion?.toLowerCase().includes('age');
    if (filtro === 'ccaa' && ccaaSeleccionada) return op.administracion?.includes(ccaaSeleccionada) || op.ministerio?.includes(ccaaSeleccionada);
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>OpositaAI</span>
          <nav style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => router.push('/app/catalogo')}
              style={{ fontSize: '13px', color: '#111827', background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer', fontWeight: 500, borderBottom: '2px solid #111827' }}
            >
              Oposiciones
            </button>
            <button
              onClick={() => router.push(usuario ? '/app/dashboard' : '/app/registro')}
              style={{ fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer', borderBottom: '2px solid transparent' }}
            >
              {usuario ? 'Mi estudio' : 'Planes'}
            </button>
          </nav>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {usuario ? (
            <button
              onClick={() => router.push('/app/dashboard')}
              style={{ fontSize: '13px', color: 'white', background: '#111827', border: 'none', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontWeight: 500 }}
            >
              Mi inicio →
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push('/app/login')}
                style={{ fontSize: '13px', color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer' }}
              >
                Acceder
              </button>
              <button
                onClick={() => router.push('/app/registro')}
                style={{ fontSize: '13px', color: 'white', background: '#111827', border: 'none', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontWeight: 500 }}
              >
                Empezar gratis
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
            Encuentra tu oposición
          </div>
          <div style={{ fontSize: '15px', color: '#6b7280' }}>
            Consulta el programa de cualquier oposición gratis · Estudia con IA desde 7€/mes
          </div>
        </div>

        {/* Buscador */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Buscar oposición..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 14px 12px 42px', fontSize: '14px', border: '1px solid #e5e7eb', borderRadius: '12px', outline: 'none', background: 'white', boxSizing: 'border-box' }}
          />
        </div>

        {/* Filtros — solo 3 opciones limpias */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem', position: 'relative' }}>
          <button
            onClick={() => { setFiltro('todas'); setCcaaSeleccionada(''); setMostrarCcaa(false); }}
            style={{ padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: filtro === 'todas' ? 'none' : '1px solid #e5e7eb', background: filtro === 'todas' ? '#111827' : 'white', color: filtro === 'todas' ? 'white' : '#6b7280' }}
          >
            Todas
          </button>
          <button
            onClick={() => { setFiltro('age'); setCcaaSeleccionada(''); setMostrarCcaa(false); }}
            style={{ padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: filtro === 'age' ? 'none' : '1px solid #e5e7eb', background: filtro === 'age' ? '#111827' : 'white', color: filtro === 'age' ? 'white' : '#6b7280' }}
          >
            AGE
          </button>
          <button
            onClick={() => { setFiltro('ccaa'); setMostrarCcaa(!mostrarCcaa); }}
            style={{ padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', border: filtro === 'ccaa' ? 'none' : '1px solid #e5e7eb', background: filtro === 'ccaa' ? '#111827' : 'white', color: filtro === 'ccaa' ? 'white' : '#6b7280' }}
          >
            {ccaaSeleccionada || 'CCAA'}
            <ChevronDown size={13} />
          </button>

          {/* Dropdown CCAA */}
          {mostrarCcaa && (
            <div style={{ position: 'absolute', top: '40px', left: '120px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '6px', zIndex: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', width: '280px' }}>
              {CCAA.map((ca) => (
                <button
                  key={ca}
                  onClick={() => { setCcaaSeleccionada(ca); setMostrarCcaa(false); }}
                  style={{ padding: '7px 10px', fontSize: '12px', textAlign: 'left', background: ccaaSeleccionada === ca ? '#f3f4f6' : 'none', border: 'none', borderRadius: '7px', cursor: 'pointer', color: '#374151', fontWeight: ccaaSeleccionada === ca ? 500 : 400 }}
                >
                  {ca}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lista */}
        {isLoading ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px', padding: '3rem' }}>Cargando...</div>
        ) : oposicionesFiltradas.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #f3f4f6', padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '4px' }}>No encontramos esa oposición</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1rem' }}>Puedes solicitar que la añadamos</div>
            <button
              onClick={() => router.push('/app/solicitar-oposicion')}
              style={{ fontSize: '13px', color: '#111827', background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' }}
            >
              Solicitar oposición →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {oposicionesFiltradas.map((op: any) => (
              <div
                key={op.id}
                onClick={() => router.push(`/app/catalogo/${op.id}`)}
                style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#f3f4f6')}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '3px' }}>{op.nombre}</div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{op.administracion}</span>
                    {op.totalConvocatorias > 0 && (
                      <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '20px', background: '#f0fdf4', color: '#15803d', fontWeight: 500 }}>
                        Convocatoria activa
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ color: '#d1d5db', fontSize: '18px' }}>›</span>
              </div>
            ))}

            <div
              onClick={() => router.push('/app/solicitar-oposicion')}
              style={{ background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '12px', padding: '1rem 1.25rem', cursor: 'pointer', textAlign: 'center' }}
            >
              <div style={{ fontSize: '13px', color: '#6b7280' }}>¿No encuentras tu oposición? <span style={{ color: '#111827', fontWeight: 500 }}>Solicítala →</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
