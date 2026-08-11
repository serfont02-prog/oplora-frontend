'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';

const SUBGRUPOS = ['A1', 'A2', 'C1', 'C2', 'E'];

export default function NuevaOposicionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    nombre: '',
    cuerpo: '',
    administracion: 'AGE',
    ministerio: '',
    subgrupo: '',
  });

  const [errores, setErrores] = useState<Record<string, string>>({});

  const crear = useMutation({
    mutationFn: async () => {
      await api.post('/oposiciones', form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oposiciones'] });
      router.push('/admin/oposiciones');
    },
  });

  const validar = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (!form.administracion.trim()) e.administracion = 'La administración es obligatoria';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Breadcrumb */}
      <div style={{ padding: '10px 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => router.push('/admin/oposiciones')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          Oposiciones
        </button>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>Nueva oposición</span>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: '560px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '1.5rem' }}>Nueva oposición</div>

          <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Nombre */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                Nombre <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Cuerpo General Auxiliar de la Administración del Estado"
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: `1px solid ${errores.nombre ? '#fca5a5' : '#e5e7eb'}`, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
              />
              {errores.nombre && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '3px' }}>{errores.nombre}</p>}
            </div>

            {/* Subgrupo y Administración */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Subgrupo
                </label>
                <select
                  value={form.subgrupo}
                  onChange={(e) => setForm({ ...form, subgrupo: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="">Sin subgrupo</option>
                  {SUBGRUPOS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Administración <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={form.administracion}
                  onChange={(e) => setForm({ ...form, administracion: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: `1px solid ${errores.administracion ? '#fca5a5' : '#e5e7eb'}`, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="AGE">AGE — Administración General del Estado</option>
                  <option value="CCAA">Comunidad Autónoma</option>
                  <option value="Local">Administración Local</option>
                  <option value="Otra">Otra</option>
                </select>
              </div>
            </div>

            {/* Ministerio */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Ministerio / Organismo</label>
              <input
                type="text"
                value={form.ministerio}
                onChange={(e) => setForm({ ...form, ministerio: e.target.value })}
                placeholder="Ej: Ministerio para la Transformación Digital y de la Función Pública"
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => { if (validar()) crear.mutate(); }}
          disabled={crear.isPending}
          style={{ background: '#111827', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: crear.isPending ? 0.5 : 1 }}
        >
          {crear.isPending ? 'Guardando...' : 'Guardar oposición'}
        </button>
        <button
          onClick={() => router.push('/admin/oposiciones')}
          style={{ background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', cursor: 'pointer' }}
        >
          Cancelar
        </button>
        {crear.isError && (
          <span style={{ fontSize: '12px', color: '#dc2626' }}>Error al guardar. Inténtalo de nuevo.</span>
        )}
      </div>

    </div>
  );
}