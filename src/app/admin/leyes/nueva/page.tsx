'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';

const tiposNorma = [
  'Ley orgánica',
  'Ley ordinaria',
  'Real Decreto Legislativo',
  'Real Decreto',
  'Instrucción / Circular',
  'Otra',
];

export default function NuevaLeyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<any>(null);
  const [oposicionesSeleccionadas, setOposicionesSeleccionadas] = useState<string[]>([]);
  const [form, setForm] = useState({
    nombre: '',
    siglas: '',
    referenciaBoe: '',
    tipoNorma: '',
    fechaPublicacion: '',
  });
  const [errores, setErrores] = useState<Record<string, string>>({});

  const { data: oposiciones = [] } = useQuery({
    queryKey: ['oposiciones'],
    queryFn: async () => {
      const res = await api.get('/oposiciones');
      return res.data;
    },
  });

  const subir = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('nombre', form.nombre);
      if (form.siglas) formData.append('siglas', form.siglas.toUpperCase());
      if (oposicionesSeleccionadas.length > 0) {
        formData.append('oposicionIds', JSON.stringify(oposicionesSeleccionadas));
      }
      if (form.referenciaBoe) formData.append('referenciaBoe', form.referenciaBoe);
      if (form.tipoNorma) formData.append('tipoNorma', form.tipoNorma);
      if (form.fechaPublicacion) formData.append('fechaPublicacion', form.fechaPublicacion);
      if (archivo) formData.append('archivo', archivo);

      const res = await api.post('/leyes/subir', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return res.data;
    },
    onSuccess: async (data) => {
      setResultado(data);

      for (const oposicionId of oposicionesSeleccionadas) {
        await api.post('/leyes/vincular', {
          leyId: data.ley.id,
          oposicionId,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['leyes'] });
    },
  });

  const validar = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (!archivo) e.archivo = 'Selecciona un archivo PDF o TXT';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setArchivo(f);
      setErrores((prev) => ({ ...prev, archivo: '' }));

      if (!form.nombre) {
        const nombre = f.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        setForm((prev) => ({ ...prev, nombre }));
      }
    }
  };

  const toggleOposicion = (id: string) => {
    setOposicionesSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (resultado) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '10px 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => router.push('/admin/leyes')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={14} />
            Leyes
          </button>
          <span style={{ color: '#d1d5db' }}>/</span>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Ley subida</span>
        </div>

        <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <CheckCircle size={48} color="#16A34A" style={{ marginBottom: '1rem' }} />
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
            Ley subida correctamente
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '1.5rem' }}>{resultado.ley?.nombre}</div>

          <button
            onClick={() => router.push('/admin/leyes')}
            style={{ padding: '9px 20px', fontSize: '13px', background: '#111827', color: 'white', borderRadius: '9px', border: 'none', cursor: 'pointer' }}
          >
            Volver a Leyes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      <div style={{ padding: '10px 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => router.push('/admin/leyes')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          Leyes
        </button>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>Nueva Ley</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '1.5rem' }}>Nueva ley</div>

          <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Nombre + Siglas */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Nombre <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: `1px solid ${errores.nombre ? '#fca5a5' : '#e5e7eb'}`, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                />
                {errores.nombre && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '3px' }}>{errores.nombre}</p>}
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Siglas <span style={{ color: '#9ca3af', fontWeight: 400 }}>(ej: CE)</span>
                </label>
                <input
                  type="text"
                  value={form.siglas}
                  onChange={(e) => setForm({ ...form, siglas: e.target.value.toUpperCase() })}
                  placeholder="CE"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Archivo */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Archivo</label>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ padding: '11px 14px', border: `1px solid ${errores.archivo ? '#fca5a5' : '#e5e7eb'}`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'white' }}
              >
                <Upload size={16} color="#6b7280" />
                <span style={{ fontSize: '13px', color: '#374151' }}>
                  {archivo ? archivo.name : 'Seleccionar archivo'}
                </span>
              </div>
              <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".pdf,.txt" onChange={handleFile} />
              {errores.archivo && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '3px' }}>{errores.archivo}</p>}
            </div>

            {/* Tipo de norma */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Tipo de norma</label>
              <select
                value={form.tipoNorma}
                onChange={(e) => setForm({ ...form, tipoNorma: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="">Seleccionar...</option>
                {tiposNorma.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Fecha publicación */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Fecha publicación</label>
              <input
                type="date"
                value={form.fechaPublicacion}
                onChange={(e) => setForm({ ...form, fechaPublicacion: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Oposiciones */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '8px' }}>Vincular a oposiciones</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {oposiciones.map((o: any) => (
                  <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={oposicionesSeleccionadas.includes(o.id)}
                      onChange={() => toggleOposicion(o.id)}
                      style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                    />
                    {o.nombre}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => validar() && subir.mutate()}
            disabled={subir.isPending}
            style={{ marginTop: '1.25rem', padding: '10px 20px', background: '#111827', color: 'white', borderRadius: '9px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', opacity: subir.isPending ? 0.4 : 1 }}
          >
            {subir.isPending ? 'Subiendo...' : 'Subir Ley'}
          </button>
        </div>
      </div>
    </div>
  );
}