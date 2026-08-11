'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, FileText, BarChart2, ExternalLink, Trash2 } from 'lucide-react';
import { api, Convocatoria } from '@/lib/api';

const ESTADO_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  activa: { bg: '#f0fdf4', color: '#15803d', label: 'Activa' },
  cerrada: { bg: '#f3f4f6', color: '#6b7280', label: 'Cerrada' },
  borrador: { bg: '#fffbeb', color: '#92400e', label: 'Borrador' },
};

export default function OposicionDetallePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [modalNuevaConv, setModalNuevaConv] = useState(false);
  const [modalEditarOpo, setModalEditarOpo] = useState(false);
  const [modalEditarConv, setModalEditarConv] = useState(false);
  const [convEditando, setConvEditando] = useState<any>(null);

  const [formNuevaConv, setFormNuevaConv] = useState({
    anyo: new Date().getFullYear().toString(),
    plazas: '',
    estado: 'activa',
    urlInap: '',
    referenciaBoe: '',
    fechaExamen: '',
  });

  const [formEditarOpo, setFormEditarOpo] = useState({
    nombre: '',
    administracion: '',
    ministerio: '',
    subgrupo: '',
  });

  const [formEditarConv, setFormEditarConv] = useState({
    anyo: '',
    plazas: '',
    estado: 'activa',
    urlInap: '',
    referenciaBoe: '',
    fechaExamen: '',
    numEjercicios: '',
    tipoEjercicio: '',
    numPreguntas: '',
    tiempoMinutos: '',
    penalizacion: false,
    fraccionPenalizacion: '',
    notaMinimaAprobado: '',
    diferenciasAnterior: '',
  });

  const { data: oposicion, isLoading } = useQuery({
    queryKey: ['oposicion', id],
    queryFn: async () => {
      const res = await api.get(`/oposiciones/${id}`);
      return res.data;
    },
  });

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias', id],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${id}`);
      return res.data as Convocatoria[];
    },
  });

  useEffect(() => {
    if (oposicion) {
      setFormEditarOpo({
        nombre: oposicion.nombre ?? '',
        administracion: oposicion.administracion ?? '',
        ministerio: oposicion.ministerio ?? '',
        subgrupo: oposicion.subgrupo ?? '',
      });
    }
  }, [oposicion]);

  const eliminarOpo = useMutation({
    mutationFn: async () => { await api.delete(`/oposiciones/${id}`); },
    onSuccess: () => router.push('/admin/oposiciones'),
  });

  const editarOpo = useMutation({
    mutationFn: async () => { await api.patch(`/oposiciones/${id}`, formEditarOpo); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oposicion', id] });
      setModalEditarOpo(false);
    },
  });

  const eliminarConv = useMutation({
  mutationFn: async (convocatoriaId: string) => {
    await api.delete(`/convocatorias/${convocatoriaId}`);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['convocatorias', id] });
  },
});

  const crearConv = useMutation({
  mutationFn: async () => {
    const res = await api.post('/convocatorias', {
      anyo: parseInt(formNuevaConv.anyo),
      plazas: formNuevaConv.plazas ? parseInt(formNuevaConv.plazas) : undefined,
      estado: formNuevaConv.estado,
      urlInap: formNuevaConv.urlInap || undefined,
      referenciaBoe: formNuevaConv.referenciaBoe || undefined,
      fechaExamen: formNuevaConv.fechaExamen || undefined,
      oposicionId: id,
    });

    // ⭐ Si se puso URL, dispara el scraping inmediatamente
    if (formNuevaConv.urlInap) {
      await api.post(`/convocatorias/${res.data.id}/scrape`);
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['convocatorias', id] });
    queryClient.invalidateQueries({ queryKey: ['oposicion', id] });
    setModalNuevaConv(false);
    setFormNuevaConv({ anyo: new Date().getFullYear().toString(), plazas: '', estado: 'activa', urlInap: '', referenciaBoe: '', fechaExamen: '' });
  },
});


  const copiarConvocatoria = useMutation({
    mutationFn: async (convocatoriaId: string) => {
      const res = await api.post(`/convocatorias/${convocatoriaId}/copiar`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias', id] });
    },
  });

  const editarConv = useMutation({
    mutationFn: async () => {
      const urlCambio = formEditarConv.urlInap !== (convEditando.urlInap ?? '');
      await api.patch(`/convocatorias/${convEditando.id}`, {
        anyo: parseInt(formEditarConv.anyo),
        plazas: formEditarConv.plazas ? parseInt(formEditarConv.plazas) : undefined,
        estado: formEditarConv.estado,
        urlInap: formEditarConv.urlInap || undefined,
        referenciaBoe: formEditarConv.referenciaBoe || undefined,
        fechaExamen: formEditarConv.fechaExamen || undefined,
        numEjercicios: formEditarConv.numEjercicios ? parseInt(formEditarConv.numEjercicios) : undefined,
        tipoEjercicio: formEditarConv.tipoEjercicio || undefined,
        numPreguntas: formEditarConv.numPreguntas ? parseInt(formEditarConv.numPreguntas) : undefined,
        tiempoMinutos: formEditarConv.tiempoMinutos ? parseInt(formEditarConv.tiempoMinutos) : undefined,
        penalizacion: formEditarConv.penalizacion,
        fraccionPenalizacion: formEditarConv.fraccionPenalizacion || undefined,
        notaMinimaAprobado: formEditarConv.notaMinimaAprobado ? parseFloat(formEditarConv.notaMinimaAprobado) : undefined,
        diferenciasAnterior: formEditarConv.diferenciasAnterior || undefined,
      });
  if (urlCambio && formEditarConv.urlInap) {
      await api.patch(`/convocatorias/${convEditando.id}/url-inap`, {
        urlInap: formEditarConv.urlInap,
      });
    }
  },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias', id] });
      setModalEditarConv(false);
      setConvEditando(null);
    },
  });

  const scrapeManual = useMutation({
    mutationFn: async (convocatoriaId: string) => {
      await api.post(`/convocatorias/${convocatoriaId}/scrape`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['convocatorias', id] }),
  });

  const abrirEditarConv = (c: any) => {
    setConvEditando(c);
    setFormEditarConv({
      anyo: c.anyo?.toString() ?? '',
      plazas: c.plazas?.toString() ?? '',
      estado: c.estado ?? 'activa',
      urlInap: c.urlInap ?? '',
      referenciaBoe: c.referenciaBoe ?? '',
      fechaExamen: c.fechaExamen ? new Date(c.fechaExamen).toISOString().split('T')[0] : '',
      numEjercicios: c.numEjercicios?.toString() ?? '',
      tipoEjercicio: c.tipoEjercicio ?? '',
      numPreguntas: c.numPreguntas?.toString() ?? '',
      tiempoMinutos: c.tiempoMinutos?.toString() ?? '',
      penalizacion: c.penalizacion ?? false,
      fraccionPenalizacion: c.fraccionPenalizacion ?? '',
      notaMinimaAprobado: c.notaMinimaAprobado?.toString() ?? '',
      diferenciasAnterior: c.diferenciasAnterior ?? '',
    });
    setModalEditarConv(true);
  };

  if (isLoading) return <div style={{ padding: '2rem', fontSize: '13px', color: '#9ca3af' }}>Cargando...</div>;
  if (!oposicion) return <div style={{ padding: '2rem', fontSize: '13px', color: '#9ca3af' }}>No encontrada</div>;

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
        <span style={{ fontSize: '13px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{oposicion.nombre}</span>
      </div>

      {/* Header oposición */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{oposicion.nombre}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500, background: (oposicion as any).convocatoriasActivas > 0 ? '#f0fdf4' : '#f3f4f6', color: (oposicion as any).convocatoriasActivas > 0 ? '#15803d' : '#6b7280' }}>
              {(oposicion as any).convocatoriasActivas > 0 ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', gap: '8px' }}>
            {oposicion.administracion && <span>{oposicion.administracion}</span>}
            {oposicion.ministerio && <><span>·</span><span>{oposicion.ministerio}</span></>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setModalEditarOpo(true)}
            style={{ padding: '7px 12px', fontSize: '12px', color: '#374151', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Pencil size={12} />
            Editar
          </button>
          <button
            onClick={() => { if (confirm('¿Eliminar esta oposición?')) eliminarOpo.mutate(); }}
            style={{ padding: '7px 12px', fontSize: '12px', color: '#dc2626', background: 'white', border: '1px solid #fee2e2', borderRadius: '8px', cursor: 'pointer' }}
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '10px 1.5rem', borderBottom: '1px solid #f3f4f6', background: '#f9fafb', display: 'flex', gap: '16px' }}>
        {[
          { label: 'Convocatorias', value: convocatorias.length },
          { label: 'Leyes vinculadas', value: (oposicion as any).oposicionLeyes?.length ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>{value}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Convocatorias */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f9fafb' }}>
        <div style={{ padding: '12px 1.5rem', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Convocatorias</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {convocatorias.length > 0 && (
              <button
                onClick={() => {
                  const ultima = (convocatorias as any[])[0];
                  if (confirm(`¿Copiar convocatoria ${ultima.anyo} como base para una nueva?`)) {
                    copiarConvocatoria.mutate(ultima.id);
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
              >
                📋 Copiar anterior
              </button>
            )}
            <button
              onClick={() => setModalNuevaConv(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
            >
              <Plus size={13} />
              Nueva
            </button>
          </div>
        </div>

        {convocatorias.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>No hay convocatorias. Añade la primera.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 1.5rem 1.5rem' }}>
            {(convocatorias as any[]).map((c) => {
              const badge = ESTADO_BADGE[c.estado] ?? ESTADO_BADGE.borrador;
              return (
                <div key={c.id} style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{c.anyo}</div>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500, background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                      {c.plazas && <span style={{ fontSize: '12px', color: '#6b7280' }}>{c.plazas.toLocaleString()} plazas</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => abrirEditarConv(c)} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#6b7280' }} title="Editar">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => router.push(`/admin/oposiciones/${id}/temas?convocatoriaId=${c.id}`)} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#6b7280' }} title="Temas">
                        <span style={{ fontSize: '12px' }}>📋</span>
                      </button>
                      <button onClick={() => router.push(`/admin/oposiciones/${id}/convocatorias/${c.id}/documentos`)} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#6b7280' }} title="Documentos">
                        <FileText size={12} />
                      </button>
                      <button onClick={() => router.push(`/admin/oposiciones/${id}/convocatorias/${c.id}/examenes`)} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#6b7280' }} title="Exámenes">
                        <span style={{ fontSize: '12px' }}>📝</span>
                      </button>
                      <button
                          onClick={() => router.push(`/admin/oposiciones/${id}/convocatorias/${c.id}/preguntas`)}
                          style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#6b7280' }}
                          title="Importar preguntas"
                        >
                          <span style={{ fontSize: '12px' }}>❓</span>
                        </button>
                      <button style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#6b7280' }} title="Estadísticas">
                        <BarChart2 size={12} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la convocatoria ${c.anyo}? Esta acción no se puede deshacer.`)) {
                            eliminarConv.mutate(c.id);
                          }
                        }}
                        style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fecaca', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#dc2626' }}
                        title="Eliminar convocatoria"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#6b7280' }}>
                    {c.referenciaBoe && <span>📄 {c.referenciaBoe}</span>}
                    {c.fechaExamen && <span>📅 {new Date(c.fechaExamen).toLocaleDateString('es-ES')}</span>}
                    <span>📎 {c.documentos?.length ?? 0} documentos</span>
                  </div>

                  {c.urlInap ? (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#f9fafb', borderRadius: '8px' }}>
                      <a href={c.urlInap} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#185FA5', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                        <ExternalLink size={11} />
                        {c.urlInap}
                      </a>
                      <button onClick={() => scrapeManual.mutate(c.id)} disabled={scrapeManual.isPending} style={{ fontSize: '11px', padding: '4px 10px', background: '#111827', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }}>
                        {scrapeManual.isPending ? '...' : '↻ Actualizar'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginTop: '8px', padding: '6px 10px', background: '#fffbeb', borderRadius: '8px', fontSize: '11px', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>⚠ Sin URL del INAP</span>
                      <button onClick={() => abrirEditarConv(c)} style={{ fontSize: '11px', color: '#92400e', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Añadir →</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal nueva convocatoria */}
      {modalNuevaConv && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '480px', margin: '0 1rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '1.25rem' }}>Nueva convocatoria</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Año</label>
                  <input type="number" value={formNuevaConv.anyo} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, anyo: e.target.value })} min="2000" max="2100" style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Plazas</label>
                  <input type="number" value={formNuevaConv.plazas} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, plazas: e.target.value })} placeholder="1200" style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Estado</label>
                <select value={formNuevaConv.estado} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, estado: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="activa">Activa</option>
                  <option value="cerrada">Cerrada</option>
                  <option value="borrador">Borrador</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Fecha examen</label>
                <input type="date" value={formNuevaConv.fechaExamen} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, fechaExamen: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>URL INAP</label>
                <input type="text" value={formNuevaConv.urlInap} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, urlInap: e.target.value })} placeholder="https://sede.inap.gob.es/..." style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Referencia BOE</label>
                <input type="text" value={formNuevaConv.referenciaBoe} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, referenciaBoe: e.target.value })} placeholder="BOE-A-2025-..." style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '1.25rem' }}>
              <button onClick={() => crearConv.mutate()} disabled={!formNuevaConv.anyo || crearConv.isPending} style={{ flex: 2, padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: !formNuevaConv.anyo ? 0.4 : 1 }}>
                {crearConv.isPending ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setModalNuevaConv(false)} style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar convocatoria */}
      {modalEditarConv && convEditando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '480px', margin: '0 1rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Editar convocatoria {convEditando.anyo}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '1.25rem' }}>Modifica los datos de esta convocatoria</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Año</label>
                  <input type="number" value={formEditarConv.anyo} onChange={(e) => setFormEditarConv({ ...formEditarConv, anyo: e.target.value })} min="2000" max="2100" style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Plazas</label>
                  <input type="number" value={formEditarConv.plazas} onChange={(e) => setFormEditarConv({ ...formEditarConv, plazas: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Estado</label>
                <select value={formEditarConv.estado} onChange={(e) => setFormEditarConv({ ...formEditarConv, estado: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="activa">Activa</option>
                  <option value="cerrada">Cerrada</option>
                  <option value="borrador">Borrador</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Fecha examen</label>
                <input type="date" value={formEditarConv.fechaExamen} onChange={(e) => setFormEditarConv({ ...formEditarConv, fechaExamen: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>URL INAP</label>
                <input type="text" value={formEditarConv.urlInap} onChange={(e) => setFormEditarConv({ ...formEditarConv, urlInap: e.target.value })} placeholder="https://sede.inap.gob.es/..." style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Referencia BOE</label>
                <input type="text" value={formEditarConv.referenciaBoe} onChange={(e) => setFormEditarConv({ ...formEditarConv, referenciaBoe: e.target.value })} placeholder="BOE-A-2025-..." style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Características del examen */}
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Características del examen</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Tipo ejercicio</label>
                      <select value={formEditarConv.tipoEjercicio} onChange={(e) => setFormEditarConv({ ...formEditarConv, tipoEjercicio: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}>
                        <option value="">Sin especificar</option>
                        <option value="test">Test</option>
                        <option value="desarrollo">Desarrollo</option>
                        <option value="oral">Oral</option>
                        <option value="practico">Práctico</option>
                        <option value="mixto">Mixto</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nº ejercicios</label>
                      <input type="number" value={formEditarConv.numEjercicios} onChange={(e) => setFormEditarConv({ ...formEditarConv, numEjercicios: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nº preguntas</label>
                      <input type="number" value={formEditarConv.numPreguntas} onChange={(e) => setFormEditarConv({ ...formEditarConv, numPreguntas: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Tiempo (minutos)</label>
                      <input type="number" value={formEditarConv.tiempoMinutos} onChange={(e) => setFormEditarConv({ ...formEditarConv, tiempoMinutos: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nota mínima</label>
                      <input type="number" step="0.01" value={formEditarConv.notaMinimaAprobado} onChange={(e) => setFormEditarConv({ ...formEditarConv, notaMinimaAprobado: e.target.value })} placeholder="5.00" style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Fracción penalización</label>
                      <input type="text" value={formEditarConv.fraccionPenalizacion} onChange={(e) => setFormEditarConv({ ...formEditarConv, fraccionPenalizacion: e.target.value })} placeholder="1/3" style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" id="penalizacion" checked={formEditarConv.penalizacion} onChange={(e) => setFormEditarConv({ ...formEditarConv, penalizacion: e.target.checked })} style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
                    <label htmlFor="penalizacion" style={{ fontSize: '13px', color: '#374151', cursor: 'pointer' }}>Penaliza respuesta incorrecta</label>
                  </div>
                </div>
              </div>

              {/* Diferencias con convocatoria anterior */}
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Diferencias respecto a convocatoria anterior</label>
                <textarea
                  value={formEditarConv.diferenciasAnterior}
                  onChange={(e) => setFormEditarConv({ ...formEditarConv, diferenciasAnterior: e.target.value })}
                  rows={3}
                  placeholder="Ej: Se añaden 20 preguntas de informática, se elimina el tema 15..."
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '1.25rem' }}>
              <button onClick={() => editarConv.mutate()} disabled={editarConv.isPending} style={{ flex: 2, padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                {editarConv.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button onClick={() => { setModalEditarConv(false); setConvEditando(null); }} style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar oposición */}
      {modalEditarOpo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '500px', margin: '0 1rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '1.25rem' }}>Editar oposición</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nombre *</label>
                <input type="text" value={formEditarOpo.nombre} onChange={(e) => setFormEditarOpo({ ...formEditarOpo, nombre: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Subgrupo</label>
                <select value={formEditarOpo.subgrupo} onChange={(e) => setFormEditarOpo({ ...formEditarOpo, subgrupo: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">Sin subgrupo</option>
                  {['A1', 'A2', 'C1', 'C2', 'E'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Administración</label>
                <input type="text" value={formEditarOpo.administracion} onChange={(e) => setFormEditarOpo({ ...formEditarOpo, administracion: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Ministerio</label>
                <input type="text" value={formEditarOpo.ministerio} onChange={(e) => setFormEditarOpo({ ...formEditarOpo, ministerio: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '1.25rem' }}>
              <button onClick={() => editarOpo.mutate()} disabled={!formEditarOpo.nombre || editarOpo.isPending} style={{ flex: 2, padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: !formEditarOpo.nombre ? 0.4 : 1 }}>
                {editarOpo.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button onClick={() => setModalEditarOpo(false)} style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}