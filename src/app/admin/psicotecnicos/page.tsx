'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react';

const DIFICULTADES = ['facil', 'medio', 'dificil', 'experto'];

export default function AdminPsicotecnicosPage() {
  const [tipoAbierto, setTipoAbierto] = useState<string | null>(null);

  const { data: catalogo = [], isLoading } = useQuery({
    queryKey: ['psicotecnicos-catalogo'],
    queryFn: async () => (await api.get('/psicotecnicos/catalogo')).data,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Psicotécnicos — catálogo global</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
          Gestiona el banco de preguntas compartido entre todas las oposiciones. Para activar/desactivar modalidades
          en una convocatoria concreta, ve a esa convocatoria.
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isLoading ? (
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>Cargando...</div>
          ) : (
            catalogo.map((t: any) => (
              <TipoCard
                key={t.tipo}
                tipo={t}
                abierto={tipoAbierto === t.tipo}
                onToggle={() => setTipoAbierto(tipoAbierto === t.tipo ? null : t.tipo)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function TipoCard({ tipo, abierto, onToggle }: { tipo: any; abierto: boolean; onToggle: () => void }) {
  return (
    <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={onToggle}>
        <div style={{ fontSize: '22px', flexShrink: 0 }}>{tipo.icono}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{tipo.nombre}</div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{tipo.descripcion}</div>
        </div>
        {abierto ? <ChevronDown size={16} color="#9ca3af" /> : <ChevronRight size={16} color="#9ca3af" />}
      </div>

      {abierto && (
        <div style={{ marginTop: '14px', borderTop: '1px solid #f3f4f6', paddingTop: '14px' }}>
          <BancoPreguntas tipo={tipo.tipo} subtiposSugeridos={tipo.subtiposSugeridos} />
        </div>
      )}
    </div>
  );
}

function BancoPreguntas({ tipo, subtiposSugeridos }: { tipo: string; subtiposSugeridos: string[] }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [subtipoFiltro, setSubtipoFiltro] = useState('');
  const [dificultadFiltro, setDificultadFiltro] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [preguntaEditando, setPreguntaEditando] = useState<any | null>(null);
  const limit = 10;

  const queryKey = ['psicotecnicos-admin-preguntas', tipo, subtipoFiltro, dificultadFiltro, page];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () =>
      (
        await api.get('/psicotecnicos/admin/preguntas', {
          params: {
            tipo,
            subtipo: subtipoFiltro || undefined,
            dificultad: dificultadFiltro || undefined,
            page,
            limit,
          },
        })
      ).data,
  });

  const { data: subtipos = [] } = useQuery({
    queryKey: ['psicotecnicos-admin-subtipos', tipo],
    queryFn: async () => (await api.get(`/psicotecnicos/admin/subtipos/${tipo}`)).data,
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/psicotecnicos/admin/preguntas/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['psicotecnicos-admin-preguntas'] }),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPaginas = Math.max(Math.ceil(total / limit), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <select
          value={subtipoFiltro}
          onChange={(e) => { setSubtipoFiltro(e.target.value); setPage(1); }}
          style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid #e5e7eb', fontSize: '12px', color: '#374151' }}
        >
          <option value="">Todos los subtipos</option>
          {subtipos.map((s: string) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={dificultadFiltro}
          onChange={(e) => { setDificultadFiltro(e.target.value); setPage(1); }}
          style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid #e5e7eb', fontSize: '12px', color: '#374151' }}
        >
          <option value="">Todas las dificultades</option>
          {DIFICULTADES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{total} pregunta{total !== 1 ? 's' : ''}</div>

        <button
          onClick={() => { setPreguntaEditando(null); setModalAbierto(true); }}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', background: '#111827', color: 'white' }}
        >
          <Plus size={13} />
          Añadir pregunta
        </button>
      </div>

      {isLoading ? (
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Cargando...</div>
      ) : items.length === 0 ? (
        <div style={{ fontSize: '12px', color: '#9ca3af', padding: '12px 0' }}>No hay preguntas todavía para este filtro.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {items.map((p: any) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', color: '#111827', fontWeight: 500 }}>{p.enunciado}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '3px' }}>
                  {p.subtipo || 'sin subtipo'} · {p.dificultad} · {p.oposicion ? `Solo: ${p.oposicion.nombre}` : 'Global (todas las oposiciones)'}
                </div>
              </div>
              <button
                onClick={() => { setPreguntaEditando(p); setModalAbierto(true); }}
                style={{ padding: '5px', border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => { if (confirm('¿Eliminar esta pregunta?')) eliminar.mutate(p.id); }}
                style={{ padding: '5px', border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ fontSize: '11px', color: page <= 1 ? '#d1d5db' : '#374151', background: 'none', border: 'none', cursor: page <= 1 ? 'default' : 'pointer' }}>Anterior</button>
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{page} / {totalPaginas}</span>
          <button disabled={page >= totalPaginas} onClick={() => setPage((p) => p + 1)} style={{ fontSize: '11px', color: page >= totalPaginas ? '#d1d5db' : '#374151', background: 'none', border: 'none', cursor: page >= totalPaginas ? 'default' : 'pointer' }}>Siguiente</button>
        </div>
      )}

      {modalAbierto && (
        <ModalPregunta
          tipo={tipo}
          subtiposSugeridos={Array.from(new Set([...(subtiposSugeridos || []), ...subtipos]))}
          pregunta={preguntaEditando}
          onClose={() => setModalAbierto(false)}
          onSaved={() => {
            setModalAbierto(false);
            queryClient.invalidateQueries({ queryKey: ['psicotecnicos-admin-preguntas'] });
            queryClient.invalidateQueries({ queryKey: ['psicotecnicos-admin-subtipos', tipo] });
          }}
        />
      )}
    </div>
  );
}

function ModalPregunta({
  tipo,
  subtiposSugeridos,
  pregunta,
  onClose,
  onSaved,
}: {
  tipo: string;
  subtiposSugeridos: string[];
  pregunta: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [subtipo, setSubtipo] = useState(pregunta?.subtipo ?? '');
  const [dificultad, setDificultad] = useState(pregunta?.dificultad ?? 'medio');
  const [enunciado, setEnunciado] = useState(pregunta?.enunciado ?? '');
  const [opciones, setOpciones] = useState<string[]>(pregunta?.opciones ?? ['', '', '', '']);
  const [correcta, setCorrecta] = useState<number>(pregunta?.correcta ?? 0);
  const [explicacion, setExplicacion] = useState(pregunta?.explicacion ?? '');
  const [imagenUrl, setImagenUrl] = useState(pregunta?.imagenUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!enunciado.trim() || opciones.some((o) => !o.trim())) {
      setError('Completa el enunciado y todas las opciones.');
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      const payload = {
        tipo,
        subtipo: subtipo || undefined,
        dificultad,
        enunciado,
        opciones,
        correcta,
        explicacion: explicacion || undefined,
        imagenUrl: imagenUrl || undefined,
      };
      if (pregunta) {
        await api.patch(`/psicotecnicos/admin/preguntas/${pregunta.id}`, payload);
      } else {
        await api.post('/psicotecnicos/admin/preguntas', payload);
      }
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al guardar la pregunta.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: 'white', borderRadius: '14px', padding: '1.5rem', width: '520px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{pregunta ? 'Editar pregunta' : 'Nueva pregunta'}</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Subtipo</label>
            <input
              list="subtipos-sugeridos"
              value={subtipo}
              onChange={(e) => setSubtipo(e.target.value)}
              placeholder="Escribe o elige un subtipo"
              style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #e5e7eb', fontSize: '12px', boxSizing: 'border-box' }}
            />
            <datalist id="subtipos-sugeridos">
              {subtiposSugeridos.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Dificultad</label>
            <select value={dificultad} onChange={(e) => setDificultad(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #e5e7eb', fontSize: '12px' }}>
              {DIFICULTADES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Enunciado</label>
            <textarea
              value={enunciado}
              onChange={(e) => setEnunciado(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #e5e7eb', fontSize: '12px', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Imagen (URL, opcional)</label>
            <input
              value={imagenUrl}
              onChange={(e) => setImagenUrl(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #e5e7eb', fontSize: '12px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Opciones (marca la correcta)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {opciones.map((op, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="radio"
                    name="correcta"
                    checked={correcta === i}
                    onChange={() => setCorrecta(i)}
                  />
                  <input
                    value={op}
                    onChange={(e) => {
                      const copia = [...opciones];
                      copia[i] = e.target.value;
                      setOpciones(copia);
                    }}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: '7px', border: '1px solid #e5e7eb', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                  {opciones.length > 2 && (
                    <button
                      onClick={() => {
                        const copia = opciones.filter((_, idx) => idx !== i);
                        setOpciones(copia);
                        if (correcta >= copia.length) setCorrecta(0);
                      }}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setOpciones([...opciones, ''])}
                style={{ alignSelf: 'flex-start', fontSize: '11px', color: '#374151', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                + Añadir opción
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Explicación (opcional)</label>
            <textarea
              value={explicacion}
              onChange={(e) => setExplicacion(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #e5e7eb', fontSize: '12px', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px' }}>
              <AlertCircle size={13} color="#dc2626" />
              <span style={{ fontSize: '12px', color: '#dc2626' }}>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              onClick={guardar}
              disabled={guardando}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
            >
              <CheckCircle size={14} />
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={onClose}
              style={{ padding: '9px 14px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
