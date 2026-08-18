'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Pencil } from 'lucide-react';

const TIPOS = [
  { value: 'con_normativa', label: 'Con normativa' },
  { value: 'conceptual', label: 'Conceptual' },
  { value: 'mixto', label: 'Mixto' },
];

export default function TemasAdminPage() {
  const params = useParams();
  const router = useRouter();
  const oposicionId = params.id as string;
  const queryClient = useQueryClient();

  const [modalEditar, setModalEditar] = useState(false);
  const [temaEditando, setTemaEditando] = useState<any>(null);
  const [formEditar, setFormEditar] = useState({
    titulo: '',
    tipo: 'con_normativa',
    contexto: '',
    bloque: ''
  });

  const [modalVincular, setModalVincular] = useState(false);
  const [temaVinculando, setTemaVinculando] = useState<any>(null);
  const [leySeleccionada, setLeySeleccionada] = useState<any>(null);
  const [tituloSeleccionado, setTituloSeleccionado] = useState<any>(null);
  const [capituloSeleccionado, setCapituloSeleccionado] = useState<any>(null);
  const [busquedaArticulo, setBusquedaArticulo] = useState('');
  const [vinculando, setVinculando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [temaExpandido, setTemaExpandido] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    numero: '',
    titulo: '',
    tipo: 'con_normativa',
    contexto: '',
    bloque: '',
  });

  const [modalImportar, setModalImportar] = useState(false);
  const [textoTemario, setTextoTemario] = useState('');
  const [importando, setImportando] = useState(false);

  const { data: oposicion } = useQuery({
    queryKey: ['oposicion', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/oposiciones/${oposicionId}`);
      return res.data;
    },
  });

const { data: leyesOposicion = [] } = useQuery({
  queryKey: ['leyes-oposicion', oposicionId],
  queryFn: async () => {
    const res = await api.get(`/leyes/oposicion/${oposicionId}`);
    return res.data;
  },
  enabled: modalVincular,
});

const { data: titulos = [] } = useQuery({
  queryKey: ['titulos', leySeleccionada?.versionLey?.id],
  queryFn: async () => {
    const res = await api.get(`/normativa/titulos/${leySeleccionada.versionLey.id}`);
    return res.data;
  },
  enabled: !!leySeleccionada?.versionLey?.id,
});

const { data: capitulos = [] } = useQuery({
  queryKey: ['capitulos', tituloSeleccionado?.id],
  queryFn: async () => {
    const res = await api.get(`/normativa/capitulos/${tituloSeleccionado.id}`);
    return res.data;
  },
  enabled: !!tituloSeleccionado?.id,
});

const { data: articulos = [] } = useQuery({
  queryKey: ['articulos-capitulo', capituloSeleccionado?.id],
  queryFn: async () => {
    const res = await api.get(`/normativa/articulos/${capituloSeleccionado.id}`);
    return res.data;
  },
  enabled: !!capituloSeleccionado?.id,
});

const { data: articulosBusqueda = [] } = useQuery({
  queryKey: ['buscar-articulos', leySeleccionada?.versionLey?.id, busquedaArticulo],
  queryFn: async () => {
    const res = await api.get(`/normativa/buscar/${leySeleccionada.versionLey.id}?q=${busquedaArticulo}`);
    return res.data;
  },
  enabled: !!leySeleccionada?.versionLey?.id && busquedaArticulo.length > 0,
});

  // Cargar convocatorias de la oposición
  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${oposicionId}`);
      return res.data;
    },
  });

  // Usar la convocatoria activa o la más reciente
  const convocatoria = convocatorias.find((c: any) => c.estado === 'activa') ?? convocatorias[0];
  const convocatoriaId = convocatoria?.id;

  const { data: temas = [], isLoading } = useQuery({
    queryKey: ['temas-admin', convocatoriaId],
    queryFn: async () => {
      const res = await api.get(`/temas/convocatoria/${convocatoriaId}`);
      return res.data;
    },
    enabled: !!convocatoriaId,
  });

  const editar = useMutation({
  mutationFn: async () => {
    await api.patch(`/temas/${temaEditando.id}`, formEditar);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['temas-admin', convocatoriaId] });
    setModalEditar(false);
    setTemaEditando(null);
  },
  });

  const crear = useMutation({
    mutationFn: async () => {
      await api.post('/temas', {
        numero: parseInt(form.numero),
        titulo: form.titulo,
        tipo: form.tipo,
        contexto: form.contexto || undefined,
        convocatoriaId,
        bloque: form.bloque || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temas-admin', convocatoriaId] });
      setModalAbierto(false);
      setForm({ numero: '', titulo: '', tipo: 'con_normativa', contexto: '', bloque: '' });
    },
  });

  const bloquesDisponibles = convocatoria?.bloquesTemario ?? [];

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/temas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temas-admin', convocatoriaId] });
    },
  });

const vincularArticulo = useMutation({
mutationFn: async (articulo: any) => {
  const yaVinculado = (temaVinculando.normativas ?? []).some( // ⭐ fallback aquí también
    (tn: any) => tn.articulo?.id === articulo.id
  );
  if (yaVinculado) throw new Error('Este artículo ya está vinculado');

  const res = await api.post(`/temas/${temaVinculando.id}/normativa`, {
    nivel: 'articulo',
    articuloId: articulo.id,
  });
  return { temaNormativa: res.data, articulo };
},
  onSuccess: ({ temaNormativa, articulo }) => {
    queryClient.invalidateQueries({ queryKey: ['temas-admin', convocatoriaId] });
    const leyNombre = leySeleccionada?.ley?.nombre ?? '—';
    setTemaVinculando((prev: any) => ({
      ...prev,
      normativas: [
      ...(prev.normativas ?? []), 
      {
          ...temaNormativa,
          articulo: {
            ...articulo,
            capitulo: {
              tituloRef: {
                versionLey: {
                  ley: { nombre: leyNombre }
                }
              }
            },
            tituloRef: {
              versionLey: {
                ley: { nombre: leyNombre }
              }
            }
          },
        },
      ],
    }));
  },
  onError: (error: any) => {
    if (error.message === 'Este artículo ya está vinculado') {
      alert('Este artículo ya está vinculado a este tema');
    }
  },
});


const desvincularArticulo = useMutation({
  mutationFn: async (temaNormativaId: string) => {
    await api.delete(`/temas/normativa/${temaNormativaId}`);
  },
  onSuccess: (_, temaNormativaId) => {
    queryClient.invalidateQueries({ queryKey: ['temas-admin', convocatoriaId] });
    setTemaVinculando((prev: any) => ({
      ...prev,
      normativas: prev.normativas.filter((tn: any) => tn.id !== temaNormativaId),
    }));
  },
});

  const { data: articulosTitulo = [] } = useQuery({
  queryKey: ['articulos-titulo', tituloSeleccionado?.id],
  queryFn: async () => {
    const res = await api.get(`/normativa/articulos-titulo/${tituloSeleccionado.id}`);
    return res.data;
  },
  enabled: !!tituloSeleccionado?.id && capitulos.length === 0,
  });

const importarTemario = async () => {
  if (!textoTemario.trim() || !convocatoriaId) return;
  setImportando(true);
  try {
    const lineas = textoTemario.split('\n').filter(l => l.trim());
    const temas: { numero: number; titulo: string; bloque?: string }[] = [];
    let bloqueActual: string | undefined = undefined;

    for (const linea of lineas) {
      const matchBloque = linea.match(/^##\s*(.+)$/);
      if (matchBloque) {
        bloqueActual = matchBloque[1].trim();
        continue;
      }

      const match = linea.match(/^(?:tema\s+)?(\d+)[.\-)\s]+(.+)$/i);
      if (match) {
        temas.push({
          numero: parseInt(match[1]),
          titulo: match[2].trim(),
          bloque: bloqueActual,
        });
      }
    }

    if (temas.length === 0) {
      alert('No se detectaron temas. Asegúrate de que cada línea empiece con el número del tema.');
      return;
    }

    for (const tema of temas) {
      await api.post('/temas', {
        numero: tema.numero,
        titulo: tema.titulo,
        tipo: 'con_normativa',
        bloque: tema.bloque,
        convocatoriaId,
      });
    }

    queryClient.invalidateQueries({ queryKey: ['temas-admin', convocatoriaId] });
    setModalImportar(false);
    setTextoTemario('');
    alert(`✅ ${temas.length} temas importados correctamente`);
  } catch (e) {
    console.error('Error importando temario:', e);
    alert('Error al importar el temario');
  } finally {
    setImportando(false);
  }
};
  
  
  const siguienteNumero = temas.length > 0
    ? Math.max(...temas.map((t: any) => t.numero)) + 1
    : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Breadcrumb */}
      <div style={{ padding: '10px 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => router.push(`/admin/oposiciones/${oposicionId}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          {oposicion?.nombre ?? 'Oposición'}
        </button>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>Programa de temas</span>
      </div>

      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Programa de temas</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
            {convocatoria ? (
              <span>{temas.length} temas · Convocatoria {convocatoria.anyo} · <span style={{ color: convocatoria.estado === 'activa' ? '#15803d' : '#9ca3af' }}>{convocatoria.estado}</span></span>
            ) : (
              <span style={{ color: '#dc2626' }}>No hay convocatoria activa para esta oposición</span>
            )}
          </div>
        </div>
        {convocatoriaId && (
          <>
            <button
              onClick={() => {
                setForm((f) => ({ ...f, numero: String(siguienteNumero) }));
                setModalAbierto(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              <Plus size={14} />
              Añadir tema
            </button>
            <button
              onClick={() => setModalImportar(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              📋 Importar temario
            </button>
          </>
        )}
      </div>

      {/* Selector de convocatoria si hay varias */}
      {convocatorias.length > 1 && (
        <div style={{ padding: '8px 1.5rem', borderBottom: '1px solid #f3f4f6', background: '#f9fafb', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Convocatoria:</span>
          {convocatorias.map((c: any) => (
            <span
              key={c.id}
              style={{ fontSize: '12px', padding: '3px 9px', borderRadius: '20px', background: c.id === convocatoriaId ? '#111827' : '#f3f4f6', color: c.id === convocatoriaId ? 'white' : '#6b7280', cursor: 'pointer' }}
            >
              {c.anyo}
            </span>
          ))}
        </div>
      )}

      {/* Lista temas */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f9fafb' }}>
        {!convocatoriaId ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚠️</div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>Crea una convocatoria primero para poder añadir temas</div>
          </div>
        ) : isLoading ? (
          <div style={{ padding: '2rem', fontSize: '13px', color: '#9ca3af' }}>Cargando...</div>
        ) : temas.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '12px' }}>No hay temas. Añade el primero.</div>
            <button
              onClick={() => setModalAbierto(true)}
              style={{ fontSize: '13px', color: '#374151', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '8px', background: 'white', cursor: 'pointer' }}
            >
              Añadir primer tema
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                {['Nº', 'Título', 'Tipo', 'Normativa', ''].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#f9fafb' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            {temas.map((tema: any) => (
              <tbody key={tema.id}>
                <tr
                  style={{ borderBottom: temaExpandido === tema.id ? 'none' : '1px solid #f3f4f6', background: 'white' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                >
                  <td style={{ padding: '11px 16px', fontSize: '13px', fontWeight: 500, color: '#9ca3af', width: '60px' }}>
                    {tema.numero}
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ fontSize: '13px', color: '#111827' }}>{tema.titulo}</div>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{
                      fontSize: '11px', padding: '3px 9px', borderRadius: '20px', fontWeight: 500,
                      background: tema.tipo === 'con_normativa' ? '#E6F1FB' : tema.tipo === 'conceptual' ? '#FAEEDA' : '#EEEDFE',
                      color: tema.tipo === 'con_normativa' ? '#185FA5' : tema.tipo === 'conceptual' ? '#854F0B' : '#3C3489',
                    }}>
                      {TIPOS.find((t) => t.value === tema.tipo)?.label ?? tema.tipo}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: '13px', color: '#9ca3af' }}>
                    {tema.normativas?.length ?? 0} entradas
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setTemaExpandido(temaExpandido === tema.id ? null : tema.id)}
                        style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f3f4f6', borderRadius: '6px', background: 'none', cursor: 'pointer', color: '#9ca3af' }}
                      >
                        {temaExpandido === tema.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                      <button
                        onClick={() => {
                          setTemaEditando(tema);
                          setFormEditar({ titulo: tema.titulo, tipo: tema.tipo, contexto: tema.contexto ?? '', bloque: '' });
                          setModalEditar(true);
                        }}
                        style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'none', cursor: 'pointer', color: '#6b7280' }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => {
                          const temaFresco = temas.find((t: any) => t.id === tema.id) ?? tema;
                          setTemaVinculando(temaFresco);
                          setModalVincular(true);
                        }}
                        style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'none', cursor: 'pointer', color: '#6b7280' }}
                        title="Vincular artículos"
                      >
                        <span style={{ fontSize: '12px' }}>🔗</span>
                      </button>
                       <button
                        onClick={() => { if (confirm('¿Eliminar este tema?')) eliminar.mutate(tema.id); }}
                        style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fee2e2', borderRadius: '6px', background: 'none', cursor: 'pointer', color: '#dc2626' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>

                {temaExpandido === tema.id && (
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td colSpan={5} style={{ padding: '0 16px 12px', background: '#f9fafb' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '8px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                          Bloque <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span>
                        </label>
                        <select
                          value={form.bloque}
                          onChange={(e) => setForm({ ...form, bloque: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                        >
                          <option value="">Sin bloque</option>
                          {bloquesDisponibles.map((b: any) => (
                            <option key={b.nombre} value={b.nombre}>{b.nombre}</option>
                          ))}
                        </select>
                      </div>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 500, color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Normativa vinculada</div>
                          {tema.normativas?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {tema.normativas.map((tn: any) => (
                                <div key={tn.id} style={{ fontSize: '12px', color: '#374151', background: 'white', border: '1px solid #f3f4f6', borderRadius: '8px', padding: '6px 10px' }}>
                                  <span style={{ color: '#9ca3af', marginRight: '6px' }}>{tn.nivel}</span>
                                  {tn.articulo?.numero ?? tn.capitulo?.nombre ?? tn.titulo?.nombre ?? tn.versionLey?.version ?? '—'}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: '12px', color: '#9ca3af', background: 'white', border: '1px solid #f3f4f6', borderRadius: '8px', padding: '8px 10px' }}>
                              Sin normativa vinculada
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            ))}
          </table>
        )}
      </div>

      {/* Modal añadir tema */}
      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '500px', margin: '0 1rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '1.25rem' }}>Nuevo tema</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Número *</label>
                  <input
                    type="number"
                    value={form.numero}
                    onChange={(e) => setForm({ ...form, numero: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="1"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                  >
                    {TIPOS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Título del tema *</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="Ej: La Constitución española de 1978..."
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Bloque <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span>
                </label>
                <select
                  value={form.bloque}
                  onChange={(e) => setForm({ ...form, bloque: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="">Sin bloque</option>
                  {bloquesDisponibles.map((b: any) => (
                    <option key={b.nombre} value={b.nombre}>{b.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '1.25rem' }}>
              <button
                onClick={() => crear.mutate()}
                disabled={!form.numero || !form.titulo || crear.isPending}
                style={{ flex: 2, padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: !form.numero || !form.titulo ? 0.4 : 1 }}
              >
                {crear.isPending ? 'Guardando...' : 'Guardar tema'}
              </button>
              <button
                onClick={() => setModalAbierto(false)}
                style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal importar temario */}
{modalImportar && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '600px', margin: '0 1rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
        Importar temario
      </div>
      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '1.25rem' }}>
        Pega el temario completo. Cada línea debe empezar con el número del tema.
      </div>

      <div style={{ background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '11px', color: '#6b7280' }}>
        <div style={{ fontWeight: 500, marginBottom: '4px' }}>Formatos aceptados:</div>
        <div>• 1. La Constitución española de 1978</div>
        <div>• 1.- La Constitución española de 1978</div>
        <div>• Tema 1. La Constitución española de 1978</div>
        <div>• TEMA 1. La Constitución española de 1978</div>
      </div>

      <textarea
        value={textoTemario}
        onChange={(e) => setTextoTemario(e.target.value)}
        placeholder={`1. La Constitución española de 1978. Estructura y contenido general.\n2. Derechos y deberes fundamentales.\n3. La Corona...\n##Bloque1\n4.Otro tema`}
        style={{ width: '100%', minHeight: '300px', padding: '10px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', resize: 'vertical', lineHeight: 1.6, fontFamily: 'monospace', boxSizing: 'border-box' }}
      />

      {textoTemario.trim() && (
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
          {textoTemario.split('\n').filter(l => l.trim().match(/^(?:tema\s+)?(\d+)[.\-)\s]+(.+)$/i)).length} temas detectados
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '1.25rem' }}>
        <button
          onClick={importarTemario}
          disabled={!textoTemario.trim() || importando}
          style={{ flex: 2, padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: !textoTemario.trim() ? 0.4 : 1 }}
        >
          {importando ? 'Importando...' : 'Importar temas'}
        </button>
        <button
          onClick={() => { setModalImportar(false); setTextoTemario(''); }}
          style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', cursor: 'pointer' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}

    {/* Modal vincular articulos */}

{modalVincular && temaVinculando && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '560px', margin: '0 1rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

      <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
        Vincular normativa — Tema {temaVinculando.numero}
      </div>
      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '1.25rem' }}>
        {temaVinculando.titulo}
      </div>

      {/* Normativa ya vinculada */}
      {temaVinculando.normativas?.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
            Ya vinculado
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {temaVinculando.normativas.map((tn: any) => {
              const ley = tn.articulo?.capitulo?.tituloRef?.versionLey?.ley?.nombre
                ?? tn.articulo?.tituloRef?.versionLey?.ley?.nombre
                ?? '—';
              return (
                <div key={tn.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>
                      Art. {tn.articulo?.numero ?? '—'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '6px' }}>
                      {ley}
                    </span>
                  </div>
                  <button
                    onClick={() => desvincularArticulo.mutate(tn.id)}
                    style={{ fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selector de ley */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Ley</label>
        <select
          value={leySeleccionada?.ley?.id ?? ''}
          onChange={(e) => {
            const ley = leyesOposicion.find((l: any) => l.ley?.id === e.target.value);
            setLeySeleccionada(ley);
            setTituloSeleccionado(null);
            setCapituloSeleccionado(null);
            setBusquedaArticulo('');
          }}
          style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none' }}
        >
          <option value="">Selecciona una ley...</option>
          {leyesOposicion.map((ol: any) => (
            <option key={ol.ley?.id} value={ol.ley?.id}>
              {ol.ley?.nombre} {ol.versionLey ? `(v${ol.versionLey.version})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Búsqueda directa */}
      {leySeleccionada && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Buscar artículo</label>
          <input
            type="text"
            value={busquedaArticulo}
            onChange={(e) => setBusquedaArticulo(e.target.value)}
            placeholder="Número o texto del artículo..."
            style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
          />
          {articulosBusqueda.length > 0 && (
            <div style={{ marginTop: '6px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', maxHeight: '200px', overflowY: 'auto' }}>
              {articulosBusqueda.map((art: any) => (
                <div
                  key={art.id}
                  onClick={() => vincularArticulo.mutate(art)}
                  style={{ padding: '10px 12px', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                >
                  <span><strong>Art. {art.numero}</strong> {art.titulo ? `— ${art.titulo}` : ''}</span>
                  <span style={{ fontSize: '11px', color: '#1F7CFF' }}>Vincular</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navegación por título/capítulo */}
      {leySeleccionada && !busquedaArticulo && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Título</label>
            <select
              value={tituloSeleccionado?.id ?? ''}
              onChange={(e) => {
                const t = titulos.find((t: any) => t.id === e.target.value);
                setTituloSeleccionado(t);
                setCapituloSeleccionado(null);
              }}
              style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none' }}
            >
              <option value="">Selecciona un título...</option>
              {titulos.map((t: any) => (
                <option key={t.id} value={t.id}>{t.nombre ?? `Título ${t.orden}`}</option>
              ))}
            </select>
          </div>

          {/* Capítulos si los hay */}
          {tituloSeleccionado && capitulos.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Capítulo</label>
              <select
                value={capituloSeleccionado?.id ?? ''}
                onChange={(e) => {
                  const c = capitulos.find((c: any) => c.id === e.target.value);
                  setCapituloSeleccionado(c);
                }}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none' }}
              >
                <option value="">Selecciona un capítulo...</option>
                {capitulos.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nombre ?? `Capítulo ${c.orden}`}</option>
                ))}
              </select>
            </div>
          )}

          {/* Artículos de capítulo */}
          {capituloSeleccionado && articulos.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Artículos</label>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', maxHeight: '200px', overflowY: 'auto' }}>
                {articulos.map((art: any) => (
                  <div
                    key={art.id}
                    onClick={() => vincularArticulo.mutate(art)}
                    style={{ padding: '10px 12px', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                  >
                    <span><strong>Art. {art.numero}</strong> {art.titulo ? `— ${art.titulo}` : ''}</span>
                    <span style={{ fontSize: '11px', color: '#1F7CFF' }}>Vincular</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Artículos directos del título sin capítulo */}
          {tituloSeleccionado && capitulos.length === 0 && articulosTitulo.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Artículos</label>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', maxHeight: '200px', overflowY: 'auto' }}>
                {articulosTitulo.map((art: any) => (
                  <div
                    key={art.id}
                    onClick={() => vincularArticulo.mutate(art)}
                    style={{ padding: '10px 12px', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                  >
                    <span><strong>Art. {art.numero}</strong> {art.titulo ? `— ${art.titulo}` : ''}</span>
                    <span style={{ fontSize: '11px', color: '#1F7CFF' }}>Vincular</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <button
        onClick={() => {
          setModalVincular(false);
          setTemaVinculando(null);
          setLeySeleccionada(null);
          setTituloSeleccionado(null);
          setCapituloSeleccionado(null);
          setBusquedaArticulo('');
        }}
        style={{ width: '100%', padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', cursor: 'pointer', color: '#374151' }}
      >
        Cerrar
      </button>
    </div>
  </div>
)}

      {/* Modal editar tema */}
{modalEditar && temaEditando && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '500px', margin: '0 1rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
        Editar tema {temaEditando.numero}
      </div>
      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '1.25rem' }}>
        {temaEditando.titulo}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Título *</label>
          <input
            type="text"
            value={formEditar.titulo}
            onChange={(e) => setFormEditar({ ...formEditar, titulo: e.target.value })}
            style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Tipo</label>
          <select
            value={formEditar.tipo}
            onChange={(e) => setFormEditar({ ...formEditar, tipo: e.target.value })}
            style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '1.25rem' }}>
        <button
          onClick={() => editar.mutate()}
          disabled={!formEditar.titulo || editar.isPending}
          style={{ flex: 2, padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: !formEditar.titulo ? 0.4 : 1 }}
        >
          {editar.isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button
          onClick={() => { setModalEditar(false); setTemaEditando(null); }}
          style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', cursor: 'pointer' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}