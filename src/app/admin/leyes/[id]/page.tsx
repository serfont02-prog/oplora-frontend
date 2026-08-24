'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Link, Unlink, Plus, Upload, CheckCircle, FileText } from 'lucide-react';
import { api } from '@/lib/api';

const tiposNorma = [
  'Ley orgánica', 'Ley ordinaria', 'Real Decreto Legislativo',
  'Real Decreto', 'Instrucción / Circular', 'Otra',
];

const tiposCambio = [
  { value: 'inicial', label: 'Versión inicial' },
  { value: 'modificacion_parcial', label: 'Modificación parcial' },
  { value: 'modificacion_total', label: 'Modificación total' },
  { value: 'derogacion', label: 'Derogación' },
];

export default function LeyDetallePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const fileRefPreguntas = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<'info' | 'versiones' | 'oposiciones' | 'preguntas'>('info');
  const [guardado, setGuardado] = useState(false);
  const [modalVersion, setModalVersion] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultadoVersion, setResultadoVersion] = useState<any>(null);

  const [formLey, setFormLey] = useState({ nombre: '', siglas: '', descripcion: '' });
  const [formVersion, setFormVersion] = useState({
    version: '',
    referenciaBoe: '',
    tipoNorma: '',
    fechaPublicacion: '',
    fechaVigencia: '',
    tipoCambio: 'modificacion_parcial',
    notas: '',
    versionAnteriorId: '',
  });

  const [archivoPreguntas, setArchivoPreguntas] = useState<File | null>(null);
  const [previewPreguntas, setPreviewPreguntas] = useState<any[]>([]);
  const [resultadoPreguntas, setResultadoPreguntas] = useState<any>(null);
  const [importandoPreguntas, setImportandoPreguntas] = useState(false);
  const [errorPreguntas, setErrorPreguntas] = useState<string | null>(null);
  const [versionSeleccionada, setVersionSeleccionada] = useState<string>('');

  const { data: ley, isLoading } = useQuery({
    queryKey: ['ley', id],
    queryFn: async () => {
      const res = await api.get(`/leyes/${id}`);
      return res.data;
    },
  });

  const { data: versiones = [] } = useQuery({
    queryKey: ['versiones', id],
    queryFn: async () => {
      const res = await api.get(`/leyes/${id}/versiones`);
      return res.data;
    },
  });

  const { data: oposicionesVinculadas = [] } = useQuery({
    queryKey: ['ley-oposiciones', id],
    queryFn: async () => {
      const res = await api.get(`/leyes/${id}/oposiciones`);
      return res.data;
    },
  });

  //parseo con JSON
  const [modalImportarJson, setModalImportarJson] = useState(false);
  const [jsonTexto, setJsonTexto] = useState('');
  const [versionParaImportar, setVersionParaImportar] = useState<string | null>(null);

  const importarJson = useMutation({
    mutationFn: async () => {
      const estructura = JSON.parse(jsonTexto);
      const res = await api.post(`/leyes/${id}/versiones/${versionParaImportar}/importar-json`, { estructura });
      return res.data;
    },
    onSuccess: (data) => {
      alert(`Importado: ${data.totalTitulos} títulos, ${data.totalCapitulos} capítulos, ${data.totalArticulos} artículos`);
      setModalImportarJson(false);
      setJsonTexto('');
      queryClient.invalidateQueries({ queryKey: ['ley', id] });
    },
    onError: (e: any) => {
      alert('Error: ' + (e?.response?.data?.message ?? e.message ?? 'JSON inválido'));
    },
  });

  const { data: todasOposiciones = [] } = useQuery({
    queryKey: ['oposiciones'],
    queryFn: async () => {
      const res = await api.get('/oposiciones');
      return res.data;
    },
  });

  useEffect(() => {
  if (ley) {
    setFormLey({
      nombre: ley.nombre ?? '',
      siglas: ley.siglas ?? '',
      descripcion: ley.descripcion ?? '',
    });
  }
}, [ley]);

  useEffect(() => {
    if (versiones.length > 0) {
      setFormVersion((prev) => ({ ...prev, versionAnteriorId: versiones[0].id }));
    }
  }, [versiones]);

  const actualizar = useMutation({
    mutationFn: () => api.patch(`/leyes/${id}`, formLey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ley', id] });
      queryClient.invalidateQueries({ queryKey: ['leyes'] });
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    },
  });

  const eliminarLey = useMutation({
    mutationFn: async () => {
      await api.delete(`/leyes/${id}`);
    },
    onSuccess: () => {
      router.push('/admin/leyes');
    },
  });

  const subirVersion = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      Object.entries(formVersion).forEach(([k, v]) => {
        if (v) formData.append(k, v);
      });
      if (archivo) formData.append('archivo', archivo);
      const res = await api.post(`/leyes/${id}/versiones/subir`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setResultadoVersion(data);
      queryClient.invalidateQueries({ queryKey: ['versiones', id] });
      queryClient.invalidateQueries({ queryKey: ['leyes'] });
    },
  });

  const activarVersion = useMutation({
    mutationFn: (versionId: string) => api.patch(`/leyes/${id}/versiones/${versionId}/activar`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['versiones', id] }),
  });

  const parsear = useMutation({
    mutationFn: async (versionId: string) => {
      const res = await api.post(`/leyes/${id}/versiones/${versionId}/parsear`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['versiones', id] });
      alert(`Parseo completado. Títulos: ${data.resumen.totalTitulos}, Capítulos: ${data.resumen.totalCapitulos}, Artículos: ${data.resumen.totalArticulos}`);
    },
    onError: () => {
      alert('Error al parsear. Revisa que Ollama está corriendo.');
    },
  });

  const vincular = useMutation({
    mutationFn: async (oposicionId: string) => {
      const versionActiva = versiones.find((v: any) => v.activa);
      await api.post('/leyes/vincular', {
        leyId: id,
        oposicionId,
        versionLeyId: versionActiva?.id,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ley-oposiciones', id] }),
  });

  const desvincular = useMutation({
    mutationFn: (oposicionId: string) =>
      api.delete(`/leyes/${id}/oposicion/${oposicionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ley-oposiciones', id] }),
  });

  const handleArchivoPreguntas = (file: File) => {
    setArchivoPreguntas(file);
    setResultadoPreguntas(null);
    setErrorPreguntas(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!Array.isArray(json)) {
          setErrorPreguntas('El JSON debe ser un array de preguntas');
          setPreviewPreguntas([]);
          return;
        }
        setPreviewPreguntas(json.slice(0, 3));
      } catch {
        setErrorPreguntas('El archivo no es un JSON válido');
        setPreviewPreguntas([]);
      }
    };
    reader.readAsText(file);
  };

  const importarPreguntas = async () => {
    if (!archivoPreguntas || !versionSeleccionada) return;
    setImportandoPreguntas(true);
    setErrorPreguntas(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const preguntas = JSON.parse(e.target?.result as string);
          const res = await api.post(
            `/test/importar/version-ley/${versionSeleccionada}`,
            { preguntas }
          );
          setResultadoPreguntas(res.data);
          setArchivoPreguntas(null);
          setPreviewPreguntas([]);
        } catch {
          setErrorPreguntas('Error al importar. Revisa el formato del JSON.');
        } finally {
          setImportandoPreguntas(false);
        }
      };
      reader.readAsText(archivoPreguntas);
    } catch {
      setErrorPreguntas('Error al leer el archivo');
      setImportandoPreguntas(false);
    }
  };

  const oposicionesVinculadasIds = oposicionesVinculadas.map((v: any) => v.oposicion?.id);
  const oposicionesNoVinculadas = todasOposiciones.filter(
    (o: any) => !oposicionesVinculadasIds.includes(o.id)
  );

  const tabs = [
    { key: 'info', label: 'Información' },
    { key: 'versiones', label: `Versiones (${versiones.length})` },
    { key: 'oposiciones', label: `Oposiciones (${oposicionesVinculadas.length})` },
    { key: 'preguntas', label: 'Preguntas' },
  ];

  if (isLoading) return <div style={{ padding: '1.5rem', fontSize: '13px', color: '#9ca3af' }}>Cargando...</div>;
  if (!ley) return <div style={{ padding: '1.5rem', fontSize: '13px', color: '#9ca3af' }}>Ley no encontrada</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.push('/admin/leyes')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#6b7280', padding: '4px 0' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
          >
            <ArrowLeft size={14} />
            Leyes
          </button>
          <span style={{ color: '#d1d5db', fontSize: '13px' }}>/</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{ley.nombre}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              {versiones.length} versión{versiones.length !== 1 ? 'es' : ''}
            </div>
          </div>
        </div>
        {tab === 'info' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => actualizar.mutate()}
              disabled={actualizar.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 500, cursor: actualizar.isPending ? 'not-allowed' : 'pointer', opacity: actualizar.isPending ? 0.6 : 1 }}
            >
              <Save size={14} />
              {guardado ? 'Guardado' : actualizar.isPending ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={() => {
                if (confirm('¿Eliminar esta ley? Se eliminarán todas sus versiones y estructura.')) {
                  eliminarLey.mutate();
                }
              }}
              style={{ fontSize: '13px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #fecaca', color: '#dc2626', background: 'white', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
            >
              Eliminar
            </button>
          </div>
        )}
        {tab === 'versiones' && (
          <button
            onClick={() => { setModalVersion(true); setResultadoVersion(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            <Plus size={14} />
            Nueva versión
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex' }}>
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: tab === key ? 500 : 400,
              color: tab === key ? '#111827' : '#9ca3af',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${tab === key ? '#111827' : 'transparent'}`,
              cursor: 'pointer',
              marginBottom: '-1px',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f9fafb', padding: '1.5rem' }}>
        <div style={{ maxWidth: '580px' }}>

        {/* TAB: Información */}
        {tab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>Datos de la ley</div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Nombre</label>
                  <input
                    type="text"
                    value={formLey.nombre}
                    onChange={(e) => setFormLey({ ...formLey, nombre: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                    Siglas <span style={{ color: '#9ca3af', fontWeight: 400 }}>(ej: CE)</span>
                  </label>
                  <input
                    type="text"
                    value={formLey.siglas ?? ''}
                    onChange={(e) => setFormLey({ ...formLey, siglas: e.target.value.toUpperCase() })}
                    placeholder="CE"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Descripción</label>
                <textarea
                  value={formLey.descripcion}
                  onChange={(e) => setFormLey({ ...formLey, descripcion: e.target.value })}
                  rows={3}
                  placeholder="Descripción breve de la ley..."
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                />
              </div>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '12px 16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: '#92400e', marginBottom: '4px' }}>Versiones</div>
              <div style={{ fontSize: '12px', color: '#b45309' }}>
                Esta ley tiene <strong>{versiones.length}</strong> versión(es).
                {versiones.find((v: any) => v.activa) && (
                  <span> Versión activa: <strong>v{versiones.find((v: any) => v.activa)?.version}</strong></span>
                )}
              </div>
            </div>
          </div>
        )}

          {/* TAB: Versiones */}
          {tab === 'versiones' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {versiones.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>No hay versiones todavía.</div>
                </div>
              ) : (
                versiones.map((v: any) => (
                  <div
                    key={v.id}
                    style={{
                      background: v.activa ? '#f0fdf4' : 'white',
                      border: `1px solid ${v.activa ? '#bbf7d0' : '#f3f4f6'}`,
                      borderRadius: '12px',
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>v{v.version}</span>
                          {v.activa && (
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#15803d', color: 'white', fontWeight: 500 }}>
                              Activa
                            </span>
                          )}
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#f3f4f6', color: '#6b7280' }}>
                            {v.tipoCambio?.replace('_', ' ')}
                          </span>
                        </div>
                        {v.tipoNorma && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>{v.tipoNorma}</div>
                        )}
                        {v.referenciaBoe && (
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>{v.referenciaBoe}</div>
                        )}
                        {v.fechaPublicacion && (
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            Publicada: {new Date(v.fechaPublicacion).toLocaleDateString('es-ES')}
                          </div>
                        )}
                        {v.notas && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{v.notas}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`¿Parsear v${v.version} con IA? Puede tardar varios minutos.`)) {
                              parsear.mutate(v.id);
                            }
                          }}
                          disabled={parsear.isPending}
                          style={{ fontSize: '11px', padding: '4px 10px', border: '1px solid #bfdbfe', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', cursor: parsear.isPending ? 'not-allowed' : 'pointer', opacity: parsear.isPending ? 0.6 : 1 }}
                        >
                          {parsear.isPending ? 'Parseando...' : 'Parsear'}
                        </button>
                        <button
                          onClick={() => { setVersionParaImportar(v.id); setModalImportarJson(true); }}
                          style={{ fontSize: '12px', padding: '5px 10px', background: '#EFF6FF', color: '#1F7CFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                        >
                          Importar JSON
                        </button>
                        {!v.activa && (
                          <button
                            onClick={() => activarVersion.mutate(v.id)}
                            style={{ fontSize: '11px', padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', color: '#6b7280', cursor: 'pointer' }}
                          >
                            Activar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: Oposiciones */}
          {tab === 'oposiciones' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {oposicionesVinculadas.length === 0 && oposicionesNoVinculadas.length === 0 && (
                <div style={{ padding: '3rem', textAlign: 'center', background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>No hay oposiciones disponibles.</div>
                </div>
              )}

              {oposicionesVinculadas.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vinculadas</div>
                  <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', overflow: 'hidden' }}>
                    {oposicionesVinculadas.map((v: any, i: number) => (
                      <div
                        key={v.id}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < oposicionesVinculadas.length - 1 ? '1px solid #f3f4f6' : 'none' }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{v.oposicion?.nombre}</div>
                          {v.versionLey && (
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                              Versión: v{v.versionLey.version}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => desvincular.mutate(v.oposicion?.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          <Unlink size={11} />
                          Desvincular
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {oposicionesNoVinculadas.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vincular a oposición</div>
                  <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', overflow: 'hidden' }}>
                    {oposicionesNoVinculadas.map((o: any, i: number) => (
                      <div
                        key={o.id}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < oposicionesNoVinculadas.length - 1 ? '1px solid #f3f4f6' : 'none' }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{o.nombre}</div>
                          {o.administracion && (
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{o.administracion}</div>
                          )}
                        </div>
                        <button
                          onClick={() => vincular.mutate(o.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          <Link size={11} />
                          Vincular
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB: Preguntas */}
          {tab === 'preguntas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>Importar preguntas por versión</div>

              {/* Selector de versión */}
              <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#111827' }}>Versión de ley</div>
                <select
                  value={versionSeleccionada}
                  onChange={(e) => setVersionSeleccionada(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none' }}
                >
                  <option value="">Selecciona una versión...</option>
                  {versiones.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      v{v.version} {v.activa ? '(activa)' : ''} — {v.referenciaBoe ?? 'sin BOE'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Formato esperado */}
              <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '10px' }}>
                  Formato del JSON
                </div>
                <pre style={{ fontSize: '11px', color: '#6b7280', background: '#f9fafb', padding: '12px', borderRadius: '8px', overflow: 'auto', margin: 0 }}>
{`[
                  {
                    "articuloNumero": "1",
                    "enunciado": "¿Qué establece el artículo 1?",
                    "opciones": ["A", "B", "C", "D"],
                    "correcta": 0,
                    "explicacion": "Porque...",
                    "dificultad": 1,
                    "origen": "convocatoria",
                    "anyo": 2023
                  }
                ]`}
                </pre>
              </div>

              {/* Upload */}
              <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '10px' }}>
                  Subir archivo
                </div>
                <div
                  onClick={() => versionSeleccionada && fileRefPreguntas.current?.click()}
                  style={{
                    border: '2px dashed #e5e7eb',
                    borderRadius: '10px',
                    padding: '24px',
                    textAlign: 'center',
                    cursor: versionSeleccionada ? 'pointer' : 'not-allowed',
                    opacity: versionSeleccionada ? 1 : 0.5,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { if (versionSeleccionada) e.currentTarget.style.borderColor = '#9ca3af'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                >
                  {archivoPreguntas ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <FileText size={14} color="#6b7280" />
                      <span style={{ fontSize: '13px', color: '#374151' }}>{archivoPreguntas.name}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                      {versionSeleccionada ? 'Haz clic para subir un JSON' : 'Selecciona una versión primero'}
                    </div>
                  )}
                </div>
                <input
                  ref={fileRefPreguntas}
                  type="file"
                  accept=".json"
                  onChange={(e) => e.target.files?.[0] && handleArchivoPreguntas(e.target.files[0])}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Error */}
              {errorPreguntas && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#dc2626' }}>{errorPreguntas}</span>
                </div>
              )}

              {/* Preview */}
              {previewPreguntas.length > 0 && !resultadoPreguntas && (
                <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '10px' }}>
                    Preview (primeras 3 preguntas)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {previewPreguntas.map((p, i) => (
                      <div key={i} style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '8px', fontSize: '12px', color: '#374151' }}>
                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>Art. {p.articuloNumero}</div>
                        <div style={{ color: '#6b7280' }}>{p.enunciado?.slice(0, 80)}...</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={importarPreguntas}
                    disabled={importandoPreguntas}
                    style={{
                      marginTop: '14px',
                      width: '100%',
                      padding: '11px',
                      background: '#111827',
                      color: 'white',
                      border: 'none',
                      borderRadius: '9px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: importandoPreguntas ? 'not-allowed' : 'pointer',
                      opacity: importandoPreguntas ? 0.6 : 1,
                    }}
                  >
                    {importandoPreguntas ? 'Importando...' : 'Importar preguntas'}
                  </button>
                </div>
              )}

              {/* Resultado */}
              {resultadoPreguntas && (
                <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <CheckCircle size={16} color="#15803d" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Importación completada</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#15803d' }}>{resultadoPreguntas.importadas}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>Importadas</div>
                    </div>
                    <div style={{ padding: '12px', background: resultadoPreguntas.errores?.length > 0 ? '#fef2f2' : '#f9fafb', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: resultadoPreguntas.errores?.length > 0 ? '#dc2626' : '#9ca3af' }}>
                        {resultadoPreguntas.errores?.length ?? 0}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>Errores</div>
                    </div>
                  </div>
                  {resultadoPreguntas.errores?.length > 0 && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', marginBottom: '6px' }}>Errores:</div>
                      {resultadoPreguntas.errores.map((e: string, i: number) => (
                        <div key={i} style={{ fontSize: '11px', color: '#dc2626', marginBottom: '2px' }}>• {e}</div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setResultadoPreguntas(null)}
                    style={{ marginTop: '12px', width: '100%', padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', cursor: 'pointer', color: '#374151' }}
                  >
                    Importar más preguntas
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </div>

      {/* Modal nueva versión */}
      {modalVersion && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '520px', margin: '0 1rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

            {resultadoVersion ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} color="#15803d" />
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>Versión subida correctamente</div>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#6b7280' }}>
                  <div>Versión: <strong>v{resultadoVersion.version?.version}</strong></div>
                  <div>Caracteres: <strong>{resultadoVersion.totalCaracteres?.toLocaleString()}</strong></div>
                </div>
                <button
                  onClick={() => setModalVersion(false)}
                  style={{ width: '100%', padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '1.25rem' }}>Nueva versión</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                      Archivo <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div
                      onClick={() => fileRef.current?.click()}
                      style={{ border: '2px dashed #e5e7eb', borderRadius: '10px', padding: '16px', textAlign: 'center', cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#9ca3af')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                    >
                      {archivo ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <FileText size={14} color="#6b7280" />
                          <span style={{ fontSize: '13px', color: '#374151' }}>{archivo.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload size={18} color="#9ca3af" style={{ margin: '0 auto 4px' }} />
                          <div style={{ fontSize: '13px', color: '#9ca3af' }}>PDF o TXT</div>
                        </>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept=".pdf,.txt" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Número de versión</label>
                      <input
                        type="text"
                        value={formVersion.version}
                        onChange={(e) => setFormVersion({ ...formVersion, version: e.target.value })}
                        placeholder="Ej: 2.0"
                        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Tipo de cambio</label>
                      <select
                        value={formVersion.tipoCambio}
                        onChange={(e) => setFormVersion({ ...formVersion, tipoCambio: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                      >
                        {tiposCambio.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Referencia BOE</label>
                      <input
                        type="text"
                        value={formVersion.referenciaBoe}
                        onChange={(e) => setFormVersion({ ...formVersion, referenciaBoe: e.target.value })}
                        placeholder="BOE-A-2025-..."
                        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Tipo de norma</label>
                      <select
                        value={formVersion.tipoNorma}
                        onChange={(e) => setFormVersion({ ...formVersion, tipoNorma: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                      >
                        <option value="">Seleccionar...</option>
                        {tiposNorma.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Fecha publicación</label>
                      <input
                        type="date"
                        value={formVersion.fechaPublicacion}
                        onChange={(e) => setFormVersion({ ...formVersion, fechaPublicacion: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Fecha vigencia</label>
                      <input
                        type="date"
                        value={formVersion.fechaVigencia}
                        onChange={(e) => setFormVersion({ ...formVersion, fechaVigencia: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  {versiones.length > 0 && (
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        Versión anterior (para generar diff)
                      </label>
                      <select
                        value={formVersion.versionAnteriorId}
                        onChange={(e) => setFormVersion({ ...formVersion, versionAnteriorId: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                      >
                        <option value="">Sin versión anterior</option>
                        {versiones.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            v{v.version} {v.activa ? '(activa)' : ''} — {v.referenciaBoe ?? 'sin BOE'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Notas del cambio</label>
                    <textarea
                      value={formVersion.notas}
                      onChange={(e) => setFormVersion({ ...formVersion, notas: e.target.value })}
                      rows={2}
                      placeholder="Describe brevemente qué cambia en esta versión..."
                      style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                    />
                  </div>

                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '1.25rem' }}>
                  <button
                    onClick={() => subirVersion.mutate()}
                    disabled={!archivo || !formVersion.version || subirVersion.isPending}
                    style={{ flex: 2, padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: !archivo || !formVersion.version ? 0.4 : 1 }}
                  >
                    {subirVersion.isPending ? 'Subiendo...' : 'Subir versión'}
                  </button>
                  <button
                    onClick={() => setModalVersion(false)}
                    style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', cursor: 'pointer', color: '#6b7280' }}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {modalImportarJson && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '14px', padding: '1.5rem', width: '100%', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Importar estructura JSON</div>
            <textarea
              value={jsonTexto}
              onChange={(e) => setJsonTexto(e.target.value)}
              rows={16}
              placeholder='{ "titulos": [...] }'
              style={{ width: '100%', padding: '10px', fontSize: '12px', fontFamily: 'monospace', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => importarJson.mutate()} disabled={importarJson.isPending} style={{ padding: '9px 18px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
                {importarJson.isPending ? 'Importando...' : 'Importar'}
              </button>
              <button onClick={() => setModalImportarJson(false)} style={{ padding: '9px 18px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
