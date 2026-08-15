'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';

const SUBGRUPOS = ['A1', 'A2', 'C1', 'C2', 'E'];

const CCAA_LIST = [
  'Galicia', 'Asturias', 'Cantabria', 'País Vasco', 'Navarra', 'La Rioja',
  'Aragón', 'Cataluña', 'Castilla y León', 'Madrid', 'Castilla-La Mancha',
  'Extremadura', 'Comunidad Valenciana', 'Murcia', 'Andalucía', 'Baleares', 'Canarias',
];

const CATEGORIAS_POR_TIPO: Record<string, { value: string; label: string }[]> = {
  estado: [
    { value: 'administracion_general', label: 'AGE' },
    { value: 'seguridad', label: 'Seguridad' },
    { value: 'justicia', label: 'Justicia' },
    { value: 'sanidad', label: 'Sanidad' },
  ],
  ccaa: [
    { value: 'administracion_general', label: 'Administración' },
    { value: 'seguridad', label: 'Seguridad' },
    { value: 'sanidad', label: 'Sanidad' },
  ],
};

export default function NuevaOposicionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    nombre: '',
    cuerpo: '',
    administracion: '', // guarda el nombre de la CCAA/empresa, según el tipo
    ministerio: '',
    subgrupo: '',
    tipoAdministracion: '',
    categoria: '',
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
    if (!form.tipoAdministracion) e.tipoAdministracion = 'El tipo de administración es obligatorio';
    if (form.tipoAdministracion === 'ccaa' && !form.administracion) e.administracion = 'Selecciona la comunidad autónoma';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const cambiarTipo = (tipo: string) => {
    setForm({ ...form, tipoAdministracion: tipo, administracion: '', categoria: '', subgrupo: form.subgrupo });
  };

  const categoriasDisponibles = CATEGORIAS_POR_TIPO[form.tipoAdministracion] ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

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

            {/* Tipo administración */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                Administración <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={form.tipoAdministracion}
                onChange={(e) => cambiarTipo(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: `1px solid ${errores.tipoAdministracion ? '#fca5a5' : '#e5e7eb'}`, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="">Selecciona...</option>
                <option value="estado">Estado</option>
                <option value="ccaa">Comunidad Autónoma</option>
                <option value="empresa_publica">Empresa pública</option>
              </select>
              {errores.tipoAdministracion && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '3px' }}>{errores.tipoAdministracion}</p>}
            </div>

            {/* CCAA — solo si tipo === ccaa */}
            {form.tipoAdministracion === 'ccaa' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Comunidad Autónoma <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={form.administracion}
                  onChange={(e) => setForm({ ...form, administracion: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: `1px solid ${errores.administracion ? '#fca5a5' : '#e5e7eb'}`, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="">Selecciona...</option>
                  {CCAA_LIST.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errores.administracion && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '3px' }}>{errores.administracion}</p>}
              </div>
            )}

            {/* Ministerio — solo si tipo === estado */}
            {form.tipoAdministracion === 'estado' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Ministerio / Organismo <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.ministerio}
                  onChange={(e) => setForm({ ...form, ministerio: e.target.value })}
                  placeholder="Ej: Ministerio para la Transformación Digital y de la Función Pública"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            {/* Categoría — para estado o ccaa, tras haber elegido lo anterior */}
            {(form.tipoAdministracion === 'estado' || (form.tipoAdministracion === 'ccaa' && form.administracion)) && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Categoría
                </label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="">Sin categoría</option>
                  {categoriasDisponibles.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Subgrupo — para estado o ccaa */}
            {(form.tipoAdministracion === 'estado' || (form.tipoAdministracion === 'ccaa' && form.administracion)) && (
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
            )}
          </div>
        </div>
      </div>

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
          <span style={{ fontSize: '12px', color: '#dc2626' }}>
            {(crear.error as any)?.response?.data?.message ?? 'Error al guardar. Inténtalo de nuevo.'}
          </span>
        )}
      </div>

    </div>
  );
}