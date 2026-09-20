'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Newspaper, Scale, Sparkles, Star, Eye, EyeOff, Pencil, Trash2, Plus, X } from 'lucide-react';
import { api } from '@/lib/api';

type TipoNoticia = 'oficial' | 'legislativa' | 'oplora';
type OrigenNoticia = 'scraper_boe' | 'cambio_normativa' | 'manual_admin' | 'regla_automatica';
type PrioridadNoticia = 'alta' | 'media' | 'baja';

interface Noticia {
  id: string;
  tipo: TipoNoticia;
  origen: OrigenNoticia;
  titulo: string;
  resumen?: string | null;
  contenido?: string | null;
  urlOrigen?: string | null;
  convocatoria?: { id: string; anyo: number } | null;
  oposicion?: { id: string; nombre: string } | null;
  ley?: { id: string; nombre: string } | null;
  versionLey?: { id: string; version: string } | null;
  destacada: boolean;
  prioridad: PrioridadNoticia;
  publicada: boolean;
  fechaProgramada?: string | null;
  fechaPublicacion?: string | null;
  creadoEn: string;
}

interface Oposicion {
  id: string;
  nombre: string;
}

interface Convocatoria {
  id: string;
  anyo: number;
}

const TIPO_LABEL: Record<TipoNoticia, string> = {
  oficial: 'Oficial',
  legislativa: 'Legislativa',
  oplora: 'OPLORA',
};

const TIPO_ICONO: Record<TipoNoticia, any> = {
  oficial: Newspaper,
  legislativa: Scale,
  oplora: Sparkles,
};

const TIPO_COLOR: Record<TipoNoticia, string> = {
  oficial: '#185FA5',
  legislativa: '#7C3AED',
  oplora: '#B45309',
};

const ORIGEN_LABEL: Record<OrigenNoticia, string> = {
  scraper_boe: 'Scraper',
  cambio_normativa: 'Cambio normativo',
  manual_admin: 'Manual',
  regla_automatica: 'Regla automática',
};

interface FormState {
  id?: string;
  tipo: TipoNoticia;
  titulo: string;
  resumen: string;
  contenido: string;
  urlOrigen: string;
  ambito: 'convocatoria' | 'oposicion' | 'global';
  oposicionId: string;
  convocatoriaId: string;
  destacada: boolean;
  prioridad: PrioridadNoticia;
  fechaProgramada: string;
  publicada?: boolean;
  origen?: OrigenNoticia;
}

const FORM_VACIO: FormState = {
  tipo: 'oplora',
  titulo: '',
  resumen: '',
  contenido: '',
  urlOrigen: '',
  ambito: 'oposicion',
  oposicionId: '',
  convocatoriaId: '',
  destacada: false,
  prioridad: 'media',
  fechaProgramada: '',
};

function ModalContenido({ noticia, onClose }: { noticia: Noticia; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1.25rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 14, padding: 24, width: '100%', maxWidth: 520, maxHeight: '80vh', overflowY: 'auto', boxSizing: 'border-box' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', lineHeight: 1.35 }}>{noticia.titulo}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 2, display: 'flex' }} aria-label="Cerrar">
            <X size={18} color="#9ca3af" />
          </button>
        </div>
        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {noticia.contenido}
        </div>
      </div>
    </div>
  );
}

function formatearFecha(fecha?: string | null): string {
  if (!fecha) return '—';
  const d = new Date(fecha);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

export default function AdminNoticiasPage() {
  const qc = useQueryClient();
  const [filtroTipo, setFiltroTipo] = useState<TipoNoticia | ''>('');
  const [filtroEstado, setFiltroEstado] = useState<'' | 'publicada' | 'borrador' | 'programada'>('');
  const [formAbierto, setFormAbierto] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [noticiaAbierta, setNoticiaAbierta] = useState<Noticia | null>(null);

  const { data: pendientes = [] } = useQuery<Noticia[]>({
    queryKey: ['noticias-pendientes-revision'],
    queryFn: async () => (await api.get('/noticias/pendientes-revision')).data,
  });

  const { data: noticias = [], isLoading } = useQuery<Noticia[]>({
    queryKey: ['noticias-admin', filtroTipo, filtroEstado],
    queryFn: async () =>
      (await api.get('/noticias', { params: { tipo: filtroTipo || undefined, estado: filtroEstado || undefined } })).data,
  });

  const { data: oposiciones = [] } = useQuery<Oposicion[]>({
    queryKey: ['oposiciones-select'],
    queryFn: async () => (await api.get('/oposiciones')).data,
  });

  const { data: convocatorias = [] } = useQuery<Convocatoria[]>({
    queryKey: ['convocatorias-select', form.oposicionId],
    queryFn: async () => (await api.get(`/convocatorias/oposicion/${form.oposicionId}`)).data,
    enabled: !!form.oposicionId && form.ambito === 'convocatoria',
  });

  const invalidarTodo = () => {
    qc.invalidateQueries({ queryKey: ['noticias-admin'] });
    qc.invalidateQueries({ queryKey: ['noticias-pendientes-revision'] });
  };

  const mutPublicar = useMutation({
    mutationFn: (id: string) => api.patch(`/noticias/${id}/publicar`),
    onSuccess: invalidarTodo,
  });
  const mutDespublicar = useMutation({
    mutationFn: (id: string) => api.patch(`/noticias/${id}/despublicar`),
    onSuccess: invalidarTodo,
  });
  const mutDestacar = useMutation({
    mutationFn: ({ id, destacada }: { id: string; destacada: boolean }) => api.patch(`/noticias/${id}/destacar`, { destacada }),
    onSuccess: invalidarTodo,
  });
  const mutEliminar = useMutation({
    mutationFn: (id: string) => api.delete(`/noticias/${id}`),
    onSuccess: invalidarTodo,
  });
  const mutGuardar = useMutation({
    mutationFn: (payload: any) => (form.id ? api.patch(`/noticias/${form.id}`, payload) : api.post('/noticias', payload)),
    onSuccess: () => {
      invalidarTodo();
      setFormAbierto(false);
      setForm(FORM_VACIO);
    },
  });

  const abrirEditar = (n: Noticia) => {
    setForm({
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      resumen: n.resumen ?? '',
      contenido: n.contenido ?? '',
      urlOrigen: n.urlOrigen ?? '',
      ambito: n.convocatoria ? 'convocatoria' : n.oposicion ? 'oposicion' : 'global',
      oposicionId: n.oposicion?.id ?? '',
      convocatoriaId: n.convocatoria?.id ?? '',
      destacada: n.destacada,
      prioridad: n.prioridad,
      fechaProgramada: n.fechaProgramada ? n.fechaProgramada.slice(0, 16) : '',
      publicada: n.publicada,
      origen: n.origen,
    });
    setFormAbierto(true);
  };

  const abrirCrear = () => {
    setForm(FORM_VACIO);
    setFormAbierto(true);
  };

  const guardar = () => {
    const payload: any = {
      tipo: form.tipo,
      titulo: form.titulo,
      resumen: form.resumen || undefined,
      contenido: form.contenido || undefined,
      urlOrigen: form.urlOrigen || undefined,
      destacada: form.destacada,
      prioridad: form.prioridad,
      fechaProgramada: form.fechaProgramada || undefined,
      convocatoriaId: form.ambito === 'convocatoria' ? form.convocatoriaId || undefined : undefined,
      oposicionId: form.ambito === 'oposicion' ? form.oposicionId || undefined : undefined,
    };
    if (!form.id) payload.origen = 'manual_admin';
    mutGuardar.mutate(payload);
  };

  const requiereAmbitoObligatorio = form.tipo === 'oficial' || form.tipo === 'legislativa';

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Noticias</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{noticias.length} noticias</div>
        </div>
        <button
          onClick={abrirCrear}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#111827', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          <Plus size={14} /> Nueva noticia
        </button>
      </div>

      {pendientes.length > 0 && (
        <div style={{ marginBottom: 24, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 10 }}>
            Pendientes de revisar ({pendientes.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendientes.map((n) => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid #F3E8B8', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{n.titulo}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    {TIPO_LABEL[n.tipo]} · {ORIGEN_LABEL[n.origen]} · {n.convocatoria ? `Convocatoria ${n.convocatoria.anyo}` : n.oposicion?.nombre ?? 'Global'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => abrirEditar(n)} style={botonAccionEstilo}>
                    <Pencil size={13} /> Editar
                  </button>
                  <button onClick={() => mutPublicar.mutate(n.id)} style={{ ...botonAccionEstilo, background: '#111827', color: 'white', borderColor: '#111827' }}>
                    <Eye size={13} /> Publicar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as any)} style={selectEstilo}>
          <option value="">Todos los tipos</option>
          <option value="oficial">Oficiales</option>
          <option value="legislativa">Legislativas</option>
          <option value="oplora">OPLORA</option>
        </select>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as any)} style={selectEstilo}>
          <option value="">Todos los estados</option>
          <option value="publicada">Publicadas</option>
          <option value="borrador">Borrador</option>
          <option value="programada">Programadas</option>
        </select>
      </div>

      <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: 12, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '2rem', fontSize: 13, color: '#9ca3af' }}>Cargando...</div>
        ) : noticias.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>No hay noticias con estos filtros</div>
        ) : (
          noticias.map((n) => {
            const Icon = TIPO_ICONO[n.tipo];
            const tieneContenido = !!n.contenido && n.contenido.trim().length > 0;
            return (
              <div
                key={n.id}
                onClick={tieneContenido ? () => setNoticiaAbierta(n) : undefined}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f3f4f6', cursor: tieneContenido ? 'pointer' : 'default' }}
                onMouseEnter={(e) => { if (tieneContenido) e.currentTarget.style.background = '#fafafa'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${TIPO_COLOR[n.tipo]}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color={TIPO_COLOR[n.tipo]} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {n.destacada && <Star size={12} fill="#F59E0B" color="#F59E0B" />}
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{n.titulo}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    {TIPO_LABEL[n.tipo]} · {ORIGEN_LABEL[n.origen]} · {n.convocatoria ? `Convocatoria ${n.convocatoria.anyo}` : n.oposicion ? n.oposicion.nombre : 'Global'} · {formatearFecha(n.fechaPublicacion ?? n.creadoEn)}
                    {n.fechaProgramada && new Date(n.fechaProgramada) > new Date() && ` · Programada ${formatearFecha(n.fechaProgramada)}`}
                  </div>
                </div>
                <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 500, background: n.publicada ? '#f0fdf4' : '#fef2f2', color: n.publicada ? '#15803d' : '#b91c1c' }}>
                  {n.publicada ? 'Publicada' : 'Borrador'}
                </span>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  <button title="Destacar" onClick={() => mutDestacar.mutate({ id: n.id, destacada: !n.destacada })} style={botonIconoEstilo}>
                    <Star size={14} color={n.destacada ? '#F59E0B' : '#9ca3af'} fill={n.destacada ? '#F59E0B' : 'none'} />
                  </button>
                  {n.publicada ? (
                    <button title="Despublicar" onClick={() => mutDespublicar.mutate(n.id)} style={botonIconoEstilo}>
                      <EyeOff size={14} color="#9ca3af" />
                    </button>
                  ) : (
                    <button title="Publicar" onClick={() => mutPublicar.mutate(n.id)} style={botonIconoEstilo}>
                      <Eye size={14} color="#9ca3af" />
                    </button>
                  )}
                  <button title="Editar" onClick={() => abrirEditar(n)} style={botonIconoEstilo}>
                    <Pencil size={14} color="#9ca3af" />
                  </button>
                  <button title="Eliminar" onClick={() => confirm('¿Eliminar esta noticia?') && mutEliminar.mutate(n.id)} style={botonIconoEstilo}>
                    <Trash2 size={14} color="#ef4444" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {formAbierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 24, width: 480, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{form.id ? 'Editar noticia' : 'Nueva noticia'}</div>
              <button onClick={() => setFormAbierto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="#9ca3af" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={labelEstilo}>
                Tipo
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoNoticia, ambito: e.target.value === 'oplora' ? form.ambito : 'convocatoria' })} style={inputEstilo}>
                  <option value="oficial">Oficial</option>
                  <option value="legislativa">Legislativa</option>
                  <option value="oplora">OPLORA</option>
                </select>
              </label>

              <label style={labelEstilo}>
                Título
                <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} style={inputEstilo} />
              </label>

              <label style={labelEstilo}>
                Resumen
                <textarea value={form.resumen} onChange={(e) => setForm({ ...form, resumen: e.target.value })} style={{ ...inputEstilo, minHeight: 60 }} />
              </label>

              <label style={labelEstilo}>
                Contenido
                <textarea value={form.contenido} onChange={(e) => setForm({ ...form, contenido: e.target.value })} style={{ ...inputEstilo, minHeight: 100 }} />
              </label>

              <label style={labelEstilo}>
                URL de origen
                <input value={form.urlOrigen} onChange={(e) => setForm({ ...form, urlOrigen: e.target.value })} style={inputEstilo} placeholder="https://..." />
              </label>

              <div style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>
                Ámbito {requiereAmbitoObligatorio && <span style={{ color: '#ef4444' }}>*</span>}
              </div>
              {form.tipo === 'oplora' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['convocatoria', 'oposicion', 'global'] as const).map((op) => (
                    <button
                      key={op}
                      onClick={() => setForm({ ...form, ambito: op })}
                      style={{
                        flex: 1, padding: '7px 4px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                        border: form.ambito === op ? '1px solid #111827' : '1px solid #e5e7eb',
                        background: form.ambito === op ? '#111827' : 'white',
                        color: form.ambito === op ? 'white' : '#374151',
                      }}
                    >
                      {op === 'convocatoria' ? 'Convocatoria' : op === 'oposicion' ? 'Toda la oposición' : 'Global'}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: '#9ca3af' }}>Las noticias {TIPO_LABEL[form.tipo].toLowerCase()}s van ligadas siempre a una convocatoria.</div>
              )}

              {(form.ambito === 'convocatoria' || form.ambito === 'oposicion') && (
                <label style={labelEstilo}>
                  Oposición
                  <select value={form.oposicionId} onChange={(e) => setForm({ ...form, oposicionId: e.target.value, convocatoriaId: '' })} style={inputEstilo}>
                    <option value="">Selecciona una oposición...</option>
                    {oposiciones.map((o) => (
                      <option key={o.id} value={o.id}>{o.nombre}</option>
                    ))}
                  </select>
                </label>
              )}

              {form.ambito === 'convocatoria' && form.oposicionId && (
                <label style={labelEstilo}>
                  Convocatoria
                  <select value={form.convocatoriaId} onChange={(e) => setForm({ ...form, convocatoriaId: e.target.value })} style={inputEstilo}>
                    <option value="">Selecciona una convocatoria...</option>
                    {convocatorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.anyo}</option>
                    ))}
                  </select>
                </label>
              )}

              <label style={labelEstilo}>
                Prioridad
                <select value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value as PrioridadNoticia })} style={inputEstilo}>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </label>

              <label style={labelEstilo}>
                Fecha programada (opcional)
                <input type="datetime-local" value={form.fechaProgramada} onChange={(e) => setForm({ ...form, fechaProgramada: e.target.value })} style={inputEstilo} />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                <input type="checkbox" checked={form.destacada} onChange={(e) => setForm({ ...form, destacada: e.target.checked })} />
                Destacada
              </label>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={() => setFormAbierto(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', fontSize: 13, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={!form.titulo || (requiereAmbitoObligatorio && !form.convocatoriaId) || mutGuardar.isPending}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#111827', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: mutGuardar.isPending ? 0.6 : 1 }}
              >
                {form.id ? 'Guardar cambios' : 'Crear noticia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {noticiaAbierta && <ModalContenido noticia={noticiaAbierta} onClose={() => setNoticiaAbierta(null)} />}
    </div>
  );
}

const selectEstilo: React.CSSProperties = { fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid #e5e7eb', outline: 'none', background: 'white' };
const inputEstilo: React.CSSProperties = { fontSize: 13, padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };
const labelEstilo: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 500, color: '#374151' };
const botonAccionEstilo: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: '#374151' };
const botonIconoEstilo: React.CSSProperties = { width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 6 };
