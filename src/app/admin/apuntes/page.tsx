'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Upload, Trash2, FileText, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function ApuntesAdminPage() {
  const [oposicionId, setOposicionId] = useState('');
  const [convocatoriaId, setConvocatoriaId] = useState('');
  const [temaId, setTemaId] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [orden, setOrden] = useState('0');
  const [subiendo, setSubiendo] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [temaExpandido, setTemaExpandido] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [vinculacion, setVinculacion] = useState<'tema' | 'oposicion'>('tema');

  
  const { data: oposiciones = [] } = useQuery({
    queryKey: ['oposiciones-admin'],
    queryFn: async () => {
      const res = await api.get('/oposiciones');
      return res.data;
    },
  });

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias-apuntes', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId,
  });

  const convocatoria = convocatorias.find((c: any) => c.estado === 'activa') ?? convocatorias[0];

  const { data: temas = [] } = useQuery({
    queryKey: ['temas-apuntes', convocatoriaId],
    queryFn: async () => {
      const res = await api.get(`/temas/convocatoria/${convocatoriaId}`);
      return res.data;
    },
    enabled: !!convocatoriaId,
  });

  const { data: apuntesDelTema = [] } = useQuery({
    queryKey: ['apuntes-oplora-tema', temaExpandido],
    queryFn: async () => {
      const res = await api.get(`/apuntes-oplora/tema/${temaExpandido}`);
      return res.data;
    },
    enabled: !!temaExpandido,
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/apuntes-oplora/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apuntes-oplora-tema', temaExpandido] });
    },
  });

const subir = async () => {
  console.log('oposicionId:', oposicionId, 'vinculacion:', vinculacion, 'temaId:', temaId);
  if (!archivo || !titulo || !oposicionId) {
    setError('Selecciona una oposición, un archivo y escribe un título');
    return;
  }
  if (vinculacion === 'tema' && !temaId) {
    setError('Selecciona un tema o cambia a "General de la oposición"');
    return;
  }
  setSubiendo(true);
  setError(null);
  setResultado(null);
  try {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('titulo', titulo);
    formData.append('descripcion', descripcion);
    formData.append('orden', orden);
    

    const endpoint = vinculacion === 'tema'
      ? `/apuntes-oplora/tema/${temaId}`
      : `/apuntes-oplora/oposicion/${oposicionId}`;

    await api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    setResultado('Apunte subido correctamente');
    setArchivo(null);
    setTitulo('');
    setDescripcion('');
    setOrden('0');
    if (vinculacion === 'tema') {
      queryClient.invalidateQueries({ queryKey: ['apuntes-oplora-tema', temaId] });
      if (temaExpandido !== temaId) setTemaExpandido(temaId);
    }
  } catch (e: any) {
    setError(e.message ?? 'Error al subir el archivo');
  } finally {
    setSubiendo(false);
  }
};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Apuntes OPLORA</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Sube apuntes oficiales por tema</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Mensajes */}
          {resultado && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px' }}>
              <CheckCircle size={16} color="#15803d" />
              <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 500 }}>{resultado}</span>
            </div>
          )}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px' }}>
              <AlertCircle size={16} color="#dc2626" />
              <span style={{ fontSize: '13px', color: '#dc2626' }}>{error}</span>
            </div>
          )}

{/* Selección oposición */}
<div>
  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Oposición</label>
  <select
    value={oposicionId}
    onChange={(e) => { setOposicionId(e.target.value); setConvocatoriaId(''); setTemaId(''); }}
    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151' }}
  >
    <option value="">Selecciona oposición</option>
    {oposiciones.map((op: any) => (
      <option key={op.id} value={op.id}>{op.nombre}</option>
    ))}
  </select>
</div>

{/* ⭐ Selector de vinculación */}
{oposicionId && (
  <div>
    <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Vincular a</label>
    <div style={{ display: 'flex', gap: '8px' }}>
      {[
        { key: 'tema', label: 'Un tema específico' },
        { key: 'oposicion', label: 'General de la oposición' },
      ].map(({ key, label }) => (
        <button
          key={key}
          onClick={() => { setVinculacion(key as any); setTemaId(''); setConvocatoriaId(''); }}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer',
            border: vinculacion === key ? 'none' : '1px solid #e5e7eb',
            background: vinculacion === key ? '#0f172a' : 'white',
            color: vinculacion === key ? 'white' : '#374151',
            fontWeight: vinculacion === key ? 600 : 400,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
)}

{/* Convocatoria automática — solo si vinculación es por tema */}
{vinculacion === 'tema' && oposicionId && convocatoria && !convocatoriaId && (
  <button
    onClick={() => setConvocatoriaId(convocatoria.id)}
    style={{ padding: '8px', background: '#EFF6FF', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '12px', color: '#185FA5', cursor: 'pointer', textAlign: 'left' }}
  >
    Cargar temas de convocatoria {convocatoria.anyo} →
  </button>
)}

{/* Selección tema — solo si vinculación es por tema */}
{vinculacion === 'tema' && temas.length > 0 && (
  <div>
    <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Tema</label>
    <select
      value={temaId}
      onChange={(e) => setTemaId(e.target.value)}
      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151' }}
    >
      <option value="">Selecciona tema</option>
      {temas.map((t: any) => (
        <option key={t.id} value={t.id}>T{t.numero} — {t.titulo}</option>
      ))}
    </select>
  </div>
)}

{/* Formulario de subida */}
{oposicionId && (vinculacion === 'oposicion' || temaId) && (
  <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

    <div>
      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Título</label>
      <input
        type="text"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Ej: Apuntes completos del tema 1"
        style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151', boxSizing: 'border-box' }}
      />
    </div>

    <div>
      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>
        Descripción <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span>
      </label>
      <textarea
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Descripción breve del contenido..."
        style={{ width: '100%', minHeight: '60px', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', resize: 'vertical', color: '#374151', fontFamily: 'inherit', boxSizing: 'border-box' }}
      />
    </div>
     <div>
      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Orden</label>
      <input
        type="number"
        value={orden}
        onChange={(e) => setOrden(e.target.value)}
        min="0"
        style={{ width: '80px', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151' }}
      />
    </div>

    <div>
      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>
        Archivo <span style={{ color: '#9ca3af', fontWeight: 400 }}>(PDF o imagen, máx. 50MB)</span>
      </label>
      <div
        onClick={() => document.getElementById('file-input-oplora')?.click()}
        style={{
          border: '2px dashed #e5e7eb', borderRadius: '10px', padding: '1.5rem',
          textAlign: 'center', cursor: 'pointer', background: archivo ? '#f0fdf4' : 'white',
          borderColor: archivo ? '#86efac' : '#e5e7eb',
        }}
      >
        <input
          id="file-input-oplora"
          type="file"
          accept=".pdf,image/*"
          style={{ display: 'none' }}
          onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
        />
        {archivo ? (
          <div>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>📄</div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#15803d' }}>{archivo.name}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
              {(archivo.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>☁️</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>Click para seleccionar archivo</div>
          </div>
        )}
      </div>
    </div>

    <button
      onClick={subir}
      disabled={subiendo || !archivo || !titulo}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '10px 16px', alignSelf: 'flex-start',
        background: archivo && titulo ? '#111827' : '#e5e7eb',
        color: archivo && titulo ? 'white' : '#9ca3af',
        border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500,
        cursor: archivo && titulo ? 'pointer' : 'not-allowed',
      }}
    >
      <Upload size={14} />
      {subiendo ? 'Subiendo...' : 'Subir apunte'}
    </button>
  </div>
)}
          {/* Lista apuntes por tema */}
          {temas.length > 0 && (
            <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Apuntes por tema</span>
              </div>
              {temas.map((tema: any) => (
                <div key={tema.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <div
                    onClick={() => setTemaExpandido(temaExpandido === tema.id ? null : tema.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#185FA5', flexShrink: 0 }}>
                      {tema.numero}
                    </div>
                    <div style={{ flex: 1, fontSize: '13px', color: '#111827', fontWeight: 500 }}>{tema.titulo}</div>
                    {temaExpandido === tema.id
                      ? <ChevronUp size={14} color="#9ca3af" />
                      : <ChevronDown size={14} color="#9ca3af" />
                    }
                  </div>

                  {temaExpandido === tema.id && (
                    <div style={{ padding: '8px 16px 12px', background: '#f9fafb' }}>
                      {apuntesDelTema.length === 0 ? (
                        <div style={{ fontSize: '12px', color: '#9ca3af', padding: '8px 0' }}>
                          Sin apuntes en este tema
                        </div>
                      ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {apuntesDelTema.map((ap: any) => (
                        <div key={ap.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'white', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
                        <FileText size={14} color="#185FA5" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{ap.titulo}</div>
                            {ap.descripcion && (
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{ap.descripcion}</div>
                            )}
                            <div style={{ fontSize: '10px', color: '#d1d5db', marginTop: '2px' }}>
                            {ap.tipo.toUpperCase()} · {ap.tamanoBytes ? `${(ap.tamanoBytes / 1024 / 1024).toFixed(2)} MB` : ''}
                            </div>
                        </div>
                        <a
                            href={ap.urlArchivo}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white', color: '#374151', textDecoration: 'none' }}
                        >
                            Ver
                        </a>
                        <button
                            onClick={() => confirm('¿Eliminar este apunte?') && eliminar.mutate(ap.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
                        >
                            <Trash2 size={14} />
                        </button>
                        </div>
                    ))}
                    </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}