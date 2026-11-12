'use client';

// ⭐ Gestión de flashcards en el panel: antes solo se podían importar; una errata obligaba a tocar
// la base de datos. Aquí se buscan, se corrigen, se activan/desactivan y se borran.

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, Pencil, Trash2, ChevronLeft, ChevronRight, X, Eye, EyeOff, CheckCircle2, Archive, Link2 } from 'lucide-react';

const TIPOS: Record<string, string> = { vf: 'Verdadero/falso', hueco: 'Hueco', trampa: 'Trampa', articulo: 'Artículo', supuesto: 'Supuesto', comparativa: 'Comparativa' };
const NIVELES: Record<string, string> = { basico: 'Básico', medio: 'Medio', alto: 'Avanzado' };
// Estado editorial: en la app solo salen las validadas
const ESTADOS: { k: string; label: string; color: string; bg: string }[] = [
  { k: 'validada', label: 'Validadas', color: '#15803d', bg: '#f0fdf4' },
  { k: 'pendiente_revision', label: 'Pendientes', color: '#b45309', bg: '#fffbeb' },
  { k: 'borrador', label: 'Borrador', color: '#4b5563', bg: '#f3f4f6' },
  { k: 'obsoleta', label: 'Obsoletas', color: '#b91c1c', bg: '#fef2f2' },
];
const ESTADO_UNO: Record<string, string> = { validada: 'Validada', pendiente_revision: 'Pendiente', borrador: 'Borrador', obsoleta: 'Obsoleta' };

const input: React.CSSProperties = { padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, background: 'white', color: '#111827' };
const boton: React.CSSProperties = { padding: '7px 12px', border: '1px solid #e5e7eb', borderRadius: 8, background: 'white', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 };

function textoError(e: any, porDefecto: string) {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join('. ') : typeof m === 'string' ? m : porDefecto;
}

export default function GestionFlashcards() {
  const qc = useQueryClient();
  const [oposicionId, setOposicionId] = useState('');
  const [temaId, setTemaId] = useState('');
  const [revision, setRevision] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState<any>(null);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Búsqueda con pequeña espera para no lanzar una petición por tecla
  useEffect(() => {
    const t = setTimeout(() => { setQ(busqueda); setPagina(1); }, 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  const { data: oposiciones = [] } = useQuery({
    queryKey: ['oposiciones-admin-fc'],
    queryFn: async () => (await api.get('/oposiciones')).data,
  });

  // Temas de la oposición elegida que tienen flashcards (con cuántas)
  const { data: datosTemas } = useQuery({
    queryKey: ['admin-flashcards-temas', oposicionId],
    queryFn: async () => (await api.get('/flashcards/admin/temas', { params: { oposicionId } })).data as { temas: { id: string; numero: number; titulo: string; n: number }[]; sinTema: number },
    enabled: !!oposicionId,
  });
  const temasFC = datosTemas?.temas ?? [];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-flashcards', oposicionId, temaId, q, tipo, estado, revision, pagina],
    queryFn: async () => (await api.get('/flashcards/admin/lista', { params: { oposicionId: oposicionId || undefined, temaId: temaId || undefined, q: q || undefined, tipo: tipo || undefined, estado: estado || undefined, revision: revision || undefined, pagina } })).data,
    placeholderData: (prev: any) => prev,
  });

  const mostrar = (t: 'ok' | 'error', texto: string) => { setAviso({ tipo: t, texto }); setTimeout(() => setAviso(null), 3500); };

  const guardar = useMutation({
    mutationFn: async ({ id, cambios }: { id: string; cambios: any }) => (await api.patch(`/flashcards/admin/${id}`, cambios)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-flashcards'] }); setEditando(null); mostrar('ok', 'Flashcard guardada'); },
    onError: (e: any) => mostrar('error', textoError(e, 'No se ha podido guardar')),
  });

  const borrar = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/flashcards/admin/${id}`)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-flashcards'] }); setEditando(null); mostrar('ok', 'Flashcard borrada'); },
    onError: (e: any) => mostrar('error', textoError(e, 'No se ha podido borrar')),
  });

  // ⭐ Borrado masivo: todas las flashcards oficiales de la oposición elegida, o solo las del tema.
  // Las personales que se crean los usuarios no se tocan. Hay que escribir BORRAR para confirmar.
  const borrarMasivo = useMutation({
    mutationFn: async () => (await api.delete('/flashcards/admin/masivo', { params: { oposicionId, temaId: temaId || undefined } })).data,
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ['admin-flashcards'] });
      qc.invalidateQueries({ queryKey: ['admin-flashcards-temas'] });
      setTemaId('');
      setPagina(1);
      mostrar('ok', `${(r?.borradas ?? 0).toLocaleString('es-ES')} flashcards borradas`);
    },
    onError: (e: any) => mostrar('error', textoError(e, 'No se han podido borrar')),
  });
  const temaElegido = temasFC.find((t) => t.id === temaId);
  const nOposicion = temasFC.reduce((s, t) => s + t.n, 0) + (datosTemas?.sinTema ?? 0);
  const nABorrar = temaId ? temaElegido?.n ?? 0 : nOposicion;
  const pedirBorradoMasivo = () => {
    const nombreOpo = oposiciones.find((o: any) => o.id === oposicionId)?.nombre ?? 'esta oposición';
    const ambito = temaElegido ? `del Tema ${temaElegido.numero} de ${nombreOpo}` : `de toda la oposición ${nombreOpo}`;
    const escrito = window.prompt(
      `Vas a borrar ${nABorrar.toLocaleString('es-ES')} flashcards ${ambito}, con el progreso de repaso que tengan los usuarios. No se puede deshacer.\n\nEscribe BORRAR para confirmar:`,
    );
    if (escrito?.trim().toUpperCase() === 'BORRAR') borrarMasivo.mutate();
  };

  // ⭐ Estado editorial: validar u obsoleta (con motivo)
  const cambiarEstado = useMutation({
    mutationFn: async ({ id, estado, motivo }: { id: string; estado: string; motivo?: string }) =>
      (await api.patch(`/flashcards/admin/${id}`, { estado, motivoObsolescencia: motivo })).data,
    onSuccess: (_r: any, v) => {
      qc.invalidateQueries({ queryKey: ['admin-flashcards'] });
      mostrar('ok', v.estado === 'validada' ? 'Flashcard validada: ya sale en la app' : v.estado === 'obsoleta' ? 'Marcada como obsoleta' : 'Estado cambiado');
    },
    onError: (e: any) => mostrar('error', textoError(e, 'No se ha podido cambiar el estado')),
  });
  const marcarObsoleta = (fc: any) => {
    const motivo = window.prompt('¿Por qué queda obsoleta? (p. ej. «Reforma de la Ley 8/2021»)', fc.motivoObsolescencia ?? '');
    if (motivo && motivo.trim()) cambiarEstado.mutate({ id: fc.id, estado: 'obsoleta', motivo: motivo.trim() });
  };

  const reenlazar = useMutation({
    mutationFn: async () => (await api.post('/flashcards/admin/reenlazar', { oposicionId })).data,
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ['admin-flashcards'] });
      mostrar('ok', r?.revisadas ? `${r.enlazadas} de ${r.revisadas} flashcards enlazadas con su artículo` : 'No hay flashcards sin enlazar que tengan norma y artículo');
    },
    onError: (e: any) => mostrar('error', textoError(e, 'No se ha podido volver a enlazar')),
  });

  const pedirBorrado = (fc: any) => {
    const extra = fc.repasos > 0 ? `\n\n${fc.repasos} usuario(s) la tienen en su repaso; se les quitará. Si solo quieres ocultarla, desactívala.` : '';
    if (window.confirm(`¿Borrar esta flashcard para siempre?${extra}`)) borrar.mutate(fc.id);
  };

  const items: any[] = data?.items ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: 10, top: 10 }} />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar en pregunta, respuesta o explicación" style={{ ...input, width: '100%', paddingLeft: 30, boxSizing: 'border-box' }} />
        </div>
        <select value={oposicionId} onChange={(e) => { setOposicionId(e.target.value); setTemaId(''); setPagina(1); }} style={input}>
          <option value="">Todas las oposiciones</option>
          {oposiciones.map((o: any) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
        </select>
        {oposicionId && (
          <select value={temaId} onChange={(e) => { setTemaId(e.target.value); setPagina(1); }} style={{ ...input, maxWidth: 260 }}>
            <option value="">Todos los temas</option>
            {temasFC.map((t) => <option key={t.id} value={t.id}>Tema {t.numero} ({t.n})</option>)}
          </select>
        )}
        <select value={tipo} onChange={(e) => { setTipo(e.target.value); setPagina(1); }} style={input}>
          <option value="">Todos los tipos</option>
          {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={estado} onChange={(e) => { setEstado(e.target.value); setPagina(1); }} style={input}>
          <option value="">Activas e inactivas</option>
          <option value="activas">Solo activas</option>
          <option value="inactivas">Solo inactivas</option>
          <option value="duelo">Válidas para duelo</option>
        </select>
      </div>

      {oposicionId && nABorrar > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={pedirBorradoMasivo}
            disabled={borrarMasivo.isPending}
            style={{ ...boton, borderColor: '#fecaca', color: '#b91c1c', background: '#fef2f2' }}
          >
            <Trash2 size={13} />
            {borrarMasivo.isPending
              ? 'Borrando…'
              : temaElegido
                ? `Borrar las ${nABorrar.toLocaleString('es-ES')} del Tema ${temaElegido.numero}`
                : `Borrar las ${nABorrar.toLocaleString('es-ES')} de esta oposición`}
          </button>
        </div>
      )}

      {/* Estado editorial (con recuentos) y reenlazar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {[{ k: '', label: 'Todas', color: '#111827', bg: '#f3f4f6' }, ...ESTADOS].map((e) => {
          const activo = revision === e.k;
          const n = e.k ? data?.porEstado?.[e.k] ?? 0 : Object.values(data?.porEstado ?? {}).reduce((s: number, x: any) => s + Number(x), 0);
          return (
            <button key={e.k || 'todas'} onClick={() => { setRevision(e.k); setPagina(1); }}
              style={{ ...boton, borderColor: activo ? e.color : '#e5e7eb', background: activo ? e.bg : 'white', color: activo ? e.color : '#374151' }}>
              {e.label} <span style={{ opacity: 0.7 }}>{Number(n).toLocaleString('es-ES')}</span>
            </button>
          );
        })}
        {oposicionId && (
          <button onClick={() => reenlazar.mutate()} disabled={reenlazar.isPending} style={{ ...boton, marginLeft: 'auto' }}
            title="Busca de nuevo el artículo de las flashcards que tienen norma y número pero no están enlazadas (por ejemplo, tras reimportar una ley)">
            <Link2 size={13} /> {reenlazar.isPending ? 'Enlazando…' : 'Volver a enlazar artículos'}
          </button>
        )}
      </div>

      {aviso && (
        <div style={{ fontSize: 12, padding: '8px 12px', borderRadius: 8, background: aviso.tipo === 'ok' ? '#f0fdf4' : '#fef2f2', color: aviso.tipo === 'ok' ? '#15803d' : '#b91c1c' }}>{aviso.texto}</div>
      )}

      {/* Lista */}
      <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #f3f4f6', fontSize: 12, color: '#6b7280' }}>
          <span>{data ? `${data.total.toLocaleString('es-ES')} flashcards` : ' '}</span>
          {data && data.paginas > 1 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <button style={boton} disabled={pagina <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))} aria-label="Página anterior"><ChevronLeft size={14} /></button>
              Página {data.pagina} de {data.paginas}
              <button style={boton} disabled={pagina >= data.paginas} onClick={() => setPagina((p) => p + 1)} aria-label="Página siguiente"><ChevronRight size={14} /></button>
            </span>
          )}
        </div>

        {isLoading && <div style={{ padding: 24, fontSize: 13, color: '#9ca3af' }}>Cargando…</div>}
        {isError && (
          <div style={{ padding: 24, fontSize: 13, color: '#b91c1c', display: 'flex', gap: 10, alignItems: 'center' }}>
            No se han podido cargar las flashcards. <button style={boton} onClick={() => refetch()}>Reintentar</button>
          </div>
        )}
        {!isLoading && !isError && items.length === 0 && <div style={{ padding: 24, fontSize: 13, color: '#9ca3af' }}>No hay flashcards con esos filtros.</div>}

        {items.map((fc) => (
          <div key={fc.id} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderBottom: '1px solid #f9fafb', alignItems: 'flex-start', opacity: fc.activa ? 1 : 0.55 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: '#eef2ff', color: '#4338ca' }}>{TIPOS[fc.tipo] ?? fc.tipo}</span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: '#f3f4f6', color: '#4b5563' }}>{NIVELES[fc.nivel] ?? fc.nivel}</span>
                {fc.esParaDuelo && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: '#fff7ed', color: '#c2410c' }}>Duelo</span>}
                {!fc.activa && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: '#fef2f2', color: '#b91c1c' }}>Inactiva</span>}
                {(() => { const e = ESTADOS.find((x) => x.k === fc.estado); return e ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: e.bg, color: e.color }}>{ESTADO_UNO[fc.estado]}</span> : null; })()}
                {fc.normaSiglas && !fc.articulo && <span title="Tiene norma y artículo pero no se ha encontrado en la versión vigente" style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: '#fffbeb', color: '#b45309' }}>Sin enlazar</span>}
                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                  {[fc.oposicion?.nombre, fc.tema ? `Tema ${fc.tema.numero}` : null, fc.bloque, fc.referencia ?? (fc.articulo ? `Art. ${fc.articulo.numero}` : null)].filter(Boolean).join(' · ')}
                  {fc.repasos > 0 ? ` · ${fc.repasos} en repaso` : ''}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#111827', fontWeight: 500, lineHeight: 1.45 }}>{fc.pregunta}</div>
              <div style={{ fontSize: 12, color: '#4b5563', marginTop: 3 }}><b>Respuesta:</b> {fc.respuesta}</div>
              {fc.tipo === 'comparativa' && fc.estructura && (
                <div style={{ fontSize: 11.5, color: '#4b5563', marginTop: 4 }}>
                  <b>{fc.estructura.conceptoA}</b> vs <b>{fc.estructura.conceptoB}</b> · {fc.estructura.diferencias?.length ?? 0} diferencias
                </div>
              )}
              {fc.estado === 'obsoleta' && fc.motivoObsolescencia && (
                <div style={{ fontSize: 11.5, color: '#b91c1c', marginTop: 4 }}><b>Motivo:</b> {fc.motivoObsolescencia}</div>
              )}
              {(fc.fuenteValidacion || fc.fechaRevision) && (
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                  {[fc.fuenteValidacion, fc.fechaRevision ? `revisada el ${new Date(fc.fechaRevision).toLocaleDateString('es-ES')}` : null].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 220 }}>
              {fc.estado !== 'validada' && (
                <button style={{ ...boton, color: '#15803d', borderColor: '#86efac' }} title="Validar: pasa a mostrarse en la app"
                  disabled={cambiarEstado.isPending} onClick={() => cambiarEstado.mutate({ id: fc.id, estado: 'validada' })}>
                  <CheckCircle2 size={13} /> Validar
                </button>
              )}
              {fc.estado !== 'obsoleta' && (
                <button style={boton} title="Marcar como obsoleta (deja de mostrarse)" disabled={cambiarEstado.isPending} onClick={() => marcarObsoleta(fc)}>
                  <Archive size={13} />
                </button>
              )}
              <button style={boton} title={fc.activa ? 'Desactivar' : 'Activar'} onClick={() => guardar.mutate({ id: fc.id, cambios: { activa: !fc.activa } })}>
                {fc.activa ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button style={boton} title="Editar" onClick={() => setEditando({ ...fc, explicacion: fc.explicacion ?? '' })}><Pencil size={13} /></button>
              <button style={{ ...boton, color: '#b91c1c' }} title="Borrar" onClick={() => pedirBorrado(fc)}><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Edición */}
      {editando && (
        <div onClick={() => !guardar.isPending && setEditando(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 14, padding: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Editar flashcard</div>
              <button onClick={() => setEditando(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }} aria-label="Cerrar"><X size={18} color="#6b7280" /></button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <select value={editando.tipo} onChange={(e) => setEditando({ ...editando, tipo: e.target.value })} style={{ ...input, flex: 1 }}>
                {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={editando.nivel} onChange={(e) => setEditando({ ...editando, nivel: e.target.value })} style={{ ...input, flex: 1 }}>
                {Object.entries(NIVELES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Pregunta</label>
            <textarea value={editando.pregunta} onChange={(e) => setEditando({ ...editando, pregunta: e.target.value })} rows={3} style={{ ...input, width: '100%', boxSizing: 'border-box', marginTop: 4, marginBottom: 10, resize: 'vertical' }} />
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
              Respuesta {(editando.tipo === 'vf' || editando.tipo === 'trampa') && <span style={{ fontWeight: 400, color: '#9ca3af' }}>(true o false)</span>}
            </label>
            <input value={editando.respuesta} onChange={(e) => setEditando({ ...editando, respuesta: e.target.value })} style={{ ...input, width: '100%', boxSizing: 'border-box', marginTop: 4, marginBottom: 10 }} />
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Explicación (opcional)</label>
            <textarea value={editando.explicacion} onChange={(e) => setEditando({ ...editando, explicacion: e.target.value })} rows={3} style={{ ...input, width: '100%', boxSizing: 'border-box', marginTop: 4, marginBottom: 10, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#374151', marginBottom: 16 }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={editando.activa} onChange={(e) => setEditando({ ...editando, activa: e.target.checked })} /> Activa</label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={editando.esParaDuelo} onChange={(e) => setEditando({ ...editando, esParaDuelo: e.target.checked })} /> Válida para duelo</label>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
              <button style={{ ...boton, color: '#b91c1c' }} onClick={() => pedirBorrado(editando)}><Trash2 size={13} /> Borrar</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={boton} onClick={() => setEditando(null)}>Cancelar</button>
                <button
                  disabled={guardar.isPending}
                  onClick={() => guardar.mutate({ id: editando.id, cambios: { tipo: editando.tipo, nivel: editando.nivel, pregunta: editando.pregunta, respuesta: editando.respuesta, explicacion: editando.explicacion, activa: editando.activa, esParaDuelo: editando.esParaDuelo } })}
                  style={{ ...boton, background: '#111827', color: 'white', borderColor: '#111827' }}
                >
                  {guardar.isPending ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
