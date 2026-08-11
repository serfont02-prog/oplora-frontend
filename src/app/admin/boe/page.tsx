'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Search, Calendar, CheckCircle, XCircle, ChevronRight, ExternalLink } from 'lucide-react';

export default function BoePage() {
  const queryClient = useQueryClient();
  const [fecha, setFecha] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [tab, setTab] = useState<'consultar' | 'pendientes' | 'todas'>('consultar');
  const [extrayendo, setExtrayendo] = useState<string | null>(null);
  const [datosExtraidos, setDatosExtraidos] = useState<{ id: string; datos: any } | null>(null);
  const [extrayendoTemario, setExtrayendoTemario] = useState(false);
  const [temarioExtraido, setTemarioExtraido] = useState<any[]>([]);
  const [comparacion, setComparacion] = useState<any>(null);
  const [paso, setPaso] = useState<'datos' | 'cuerpos' | 'temario' | 'comparacion'>('datos');
  const router = useRouter();
  const [cuerposDetectados, setCuerposDetectados] = useState<any[]>([]);
  const [vinculaciones, setVinculaciones] = useState<Record<number, string>>({});
  const [cuerposSeleccionados, setCuerposSeleccionados] = useState<Set<number>>(new Set());
  const { data: pendientes = [] } = useQuery({
    queryKey: ['boe-pendientes'],
    queryFn: async () => {
      const res = await api.get('/boe/pendientes');
      return res.data;
    },
  });

  const { data: oposicionesExistentes = [] } = useQuery({
  queryKey: ['oposiciones-selector'],
  queryFn: async () => {
    const res = await api.get('/oposiciones');
    return res.data;
  },
  });

  const { data: todas = [] } = useQuery({
    queryKey: ['boe-todas'],
    queryFn: async () => {
      const res = await api.get('/boe');
      return res.data;
    },
    enabled: tab === 'todas',
  });

  const consultar = async () => {
    if (!fecha) return;
    setBuscando(true);
    try {
      const fechaFormato = fecha.replace(/-/g, '');
      const res = await api.get(`/boe/consultar?fecha=${fechaFormato}`);
      setResultados(res.data);
    } finally {
      setBuscando(false);
    }
  };

  const guardar = useMutation({
    mutationFn: async (item: any) => {
      await api.post('/boe/guardar', item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boe-pendientes'] });
    },
  });

  const aprobar = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/boe/${id}/aprobar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boe-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['boe-todas'] });
    },
  });

  const rechazar = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/boe/${id}/rechazar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boe-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['boe-todas'] });
    },
  });

  const extraer = useMutation({
  mutationFn: async (id: string) => {
    const res = await api.post(`/boe/${id}/extraer`);
    return { id, datos: res.data };
  },
  onSuccess: (result) => {
    setDatosExtraidos(result);
    setExtrayendo(null);
    queryClient.invalidateQueries({ queryKey: ['boe-pendientes'] });
  },
  onError: () => setExtrayendo(null),
});

  const ESTADO_BADGE: Record<string, { bg: string; color: string; label: string }> = {
    pendiente: { bg: '#fffbeb', color: '#92400e', label: 'Pendiente' },
    aprobada: { bg: '#f0fdf4', color: '#15803d', label: 'Aprobada' },
    rechazada: { bg: '#fef2f2', color: '#dc2626', label: 'Rechazada' },
    procesada: { bg: '#eff6ff', color: '#185FA5', label: 'Procesada' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>BOE — Convocatorias</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
            {pendientes.length > 0 && <span style={{ color: '#d97706', fontWeight: 500 }}>{pendientes.length} pendientes de revisar · </span>}
            Consulta y gestiona convocatorias de oposiciones
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', display: 'flex', padding: '0 1.5rem' }}>
        {[
          { key: 'consultar', label: '🔍 Consultar BOE' },
          { key: 'pendientes', label: `⏳ Pendientes ${pendientes.length > 0 ? `(${pendientes.length})` : ''}` },
          { key: 'todas', label: '📋 Todas' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            style={{ padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: tab === key ? 600 : 400, color: tab === key ? '#111827' : '#9ca3af', borderBottom: tab === key ? '2px solid #111827' : '2px solid transparent', marginBottom: '-1px' }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: '#f9fafb' }}>

        {/* TAB CONSULTAR */}
        {tab === 'consultar' && (
          <div style={{ padding: '1.5rem', maxWidth: '800px' }}>
            <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '12px' }}>
                Consultar convocatorias de una fecha
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  style={{ flex: 1, padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none' }}
                />
                <button
                  onClick={consultar}
                  disabled={!fecha || buscando}
                  style={{ padding: '9px 20px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: !fecha ? 0.5 : 1 }}
                >
                  <Calendar size={14} />
                  {buscando ? 'Consultando...' : 'Consultar'}
                </button>
              </div>
            </div>

            {resultados.length > 0 && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '10px' }}>
                  {resultados.length} convocatoria{resultados.length !== 1 ? 's' : ''} encontrada{resultados.length !== 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {resultados.map((item, i) => (
                    <div key={i} style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                            {item.departamento} · {item.epigrafe}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', lineHeight: 1.5, marginBottom: '8px' }}>
                            {item.titulo}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#f3f4f6', color: '#6b7280' }}>
                              {item.referenciaBOE}
                            </span>
                            {item.urlHtml && (
                              <a href={item.urlHtml} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#185FA5', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
                                <ExternalLink size={11} />
                                Ver BOE
                              </a>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => guardar.mutate(item)}
                          style={{ padding: '7px 14px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}
                        >
                          + Añadir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resultados.length === 0 && !buscando && fecha && (
              <div style={{ textAlign: 'center', padding: '3rem', fontSize: '13px', color: '#9ca3af' }}>
                No se encontraron convocatorias de oposiciones para esta fecha
              </div>
            )}
          </div>
        )}

        {/* TAB PENDIENTES */}
        {tab === 'pendientes' && (
          <div style={{ padding: '1.5rem', maxWidth: '800px' }}>
            {pendientes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <CheckCircle size={32} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>No hay convocatorias pendientes de revisar</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pendientes.map((item: any) => (
                  <div key={item.id} style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem' }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                      {item.departamento} · {item.fechaBOE}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', lineHeight: 1.5, marginBottom: '10px' }}>
                      {item.titulo}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#f3f4f6', color: '#6b7280' }}>
                        {item.referenciaBOE}
                      </span>
                      {item.urlHtml && (
                        <a href={item.urlHtml} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#185FA5', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
                          <ExternalLink size={11} />
                          Ver BOE
                        </a>
                      )}
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => rechazar.mutate(item.id)}
                          style={{ padding: '6px 12px', background: 'white', border: '1px solid #fca5a5', borderRadius: '7px', fontSize: '12px', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <XCircle size={13} />
                          Rechazar
                        </button>
                        <button
                            onClick={async () => {
                              setExtrayendo(item.id);
                              try {
                                // Saltar Ollama — ir directamente a Claude
                                const res = await api.post(`/boe/${item.id}/extraer`);
                                console.log('Respuesta extraer:', res.data);
                                const { cuerpos } = res.data;

                                if (cuerpos && cuerpos.length > 0) {
                                  setDatosExtraidos({ id: item.id, datos: cuerpos[0] });
                                  setCuerposDetectados(cuerpos);
                                  const seleccionados = new Set<number>(
                                    cuerpos
                                      .map((_: any, i: number) => i)
                                      .filter((i: number) => cuerpos[i].turno === 'libre')
                                  );
                                  setCuerposSeleccionados(seleccionados);
                                  setPaso('cuerpos');
                                    const autoVinculaciones: Record<number, string> = {};
                                    cuerpos.forEach((cuerpo: any, i: number) => {
                                      const filtradas = oposicionesExistentes.filter((o: any) => {
                                        const mismoSubgrupo = o.subgrupo === cuerpo.subgrupo;
                                        const mismaAdmin = o.administracion === cuerpo.administracion;
                                        const esPromocion = o.nombre.toLowerCase().includes('promoci');
                                        const turnoCoincide = cuerpo.turno === 'libre' ? !esPromocion : esPromocion;
                                        return mismoSubgrupo && mismaAdmin && turnoCoincide;
                                      });
                                      if (filtradas.length === 1) autoVinculaciones[i] = filtradas[0].id;
                                    });
                                    setVinculaciones(autoVinculaciones);
                                }
                              } catch (e) {
                                console.error('Error:', e);
                              } finally {
                                setExtrayendo(null);
                              }
                            }}
                            disabled={extrayendo === item.id}
                            style={{ padding: '6px 12px', background: '#111827', border: 'none', borderRadius: '7px', fontSize: '12px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                            {extrayendo === item.id ? (
                            <>
                            <div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            Extrayendo...
                            </>
                        ) : (
                            <><CheckCircle size={13} />Aprobar</>
                        )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB TODAS */}
        {tab === 'todas' && (
          <div style={{ padding: '1.5rem', maxWidth: '800px' }}>
            {todas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', fontSize: '13px', color: '#9ca3af' }}>
                No hay convocatorias guardadas todavía
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todas.map((item: any) => {
                  const badge = ESTADO_BADGE[item.estado] ?? ESTADO_BADGE.pendiente;
                  return (
                    <div key={item.id} style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                          {item.departamento} · {item.fechaBOE}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', lineHeight: 1.5 }}>
                          {item.titulo}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: badge.bg, color: badge.color, fontWeight: 500, flexShrink: 0 }}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal datos extraídos */}
{datosExtraidos && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '500px', margin: '0 1rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
        Datos extraídos por IA
      </div>
      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '1.25rem' }}>
        Revisa y edita si es necesario antes de aprobar
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.25rem' }}>
        {[
          { label: 'Nombre de la oposición', key: 'nombreOposicion' },
          { label: 'Administración', key: 'administracion' },
          { label: 'Ministerio', key: 'ministerio' },
          { label: 'Plazas', key: 'plazas' },
          { label: 'Año', key: 'anyo' },
        ].map(({ label, key }) => (
          <div key={key}>
            <label style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>{label}</label>
            <input
              type="text"
              value={datosExtraidos.datos[key] ?? ''}
              onChange={(e) => setDatosExtraidos({
                ...datosExtraidos,
                datos: { ...datosExtraidos.datos, [key]: e.target.value }
              })}
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
<button
 onClick={async () => {
  await api.patch(`/boe/${datosExtraidos.id}/datos`, datosExtraidos.datos);
  setExtrayendoTemario(true);
  try {
    const res = await api.post(`/boe/${datosExtraidos.id}/extraer`);
    console.log('Respuesta extraer:', res.data);
    const { cuerpos } = res.data;

    if (cuerpos && cuerpos.length > 0) {
      setCuerposDetectados(cuerpos);
      const seleccionados = new Set<number>(
        cuerpos
          .map((_: any, i: number) => i)
          .filter((i: number) => cuerpos[i].turno === 'libre')
      );
      setCuerposSeleccionados(seleccionados);
      setPaso('cuerpos');
    } else {
      // Sin cuerpos detectados — procesar directamente
      const res2 = await api.post(`/boe/${datosExtraidos.id}/procesar`);
      aprobar.mutate(datosExtraidos.id);
      setDatosExtraidos(null);
      router.push(`/admin/oposiciones/${res2.data.oposicionId}`);
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    setExtrayendoTemario(false);
  }
}}
  disabled={extrayendoTemario}
  style={{ flex: 2, padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
>
  {extrayendoTemario ? (
    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
      <div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Extrayendo temario con IA...
    </span>
  ) : '✓ Confirmar y aprobar'}
</button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
    )}



    {/* Modal selección de cuerpos */}
{paso === 'cuerpos' && cuerposDetectados.length > 0 && datosExtraidos && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '560px', margin: '0 1rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
        Cuerpos detectados por Claude
      </div>
      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '1.25rem' }}>
        Selecciona los cuerpos que quieres crear. Los de promoción interna están desmarcados por defecto.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
        {cuerposDetectados.map((cuerpo, i) => (
  <div key={i} style={{ border: `1px solid ${cuerposSeleccionados.has(i) ? '#111827' : '#e5e7eb'}`, borderRadius: '10px', overflow: 'hidden' }}>
    <div
      onClick={() => {
        const nuevos = new Set(cuerposSeleccionados);
        if (nuevos.has(i)) nuevos.delete(i);
        else nuevos.add(i);
        setCuerposSeleccionados(nuevos);
      }}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', background: cuerposSeleccionados.has(i) ? '#f9fafb' : 'white' }}
    >
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${cuerposSeleccionados.has(i) ? '#111827' : '#d1d5db'}`, background: cuerposSeleccionados.has(i) ? '#111827' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {cuerposSeleccionados.has(i) && <span style={{ color: 'white', fontSize: '10px' }}>✓</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{cuerpo.nombreOposicion}</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                {cuerpo.subgrupo && (
                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: '#f3f4f6', color: '#6b7280' }}>{cuerpo.subgrupo}</span>
                )}
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: cuerpo.turno === 'libre' ? '#eff6ff' : '#f5f3ff', color: cuerpo.turno === 'libre' ? '#185FA5' : '#6d28d9' }}>
                  {cuerpo.turno === 'libre' ? 'Ingreso libre' : 'Promoción interna'}
                </span>
                {cuerpo.plazas && (
                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: '#f0fdf4', color: '#15803d' }}>{cuerpo.plazas} plazas</span>
                )}
              </div>
            </div>
          </div>

          {/* Selector de oposición existente */}
          {cuerposSeleccionados.has(i) && (
            <div style={{ padding: '8px 14px 10px', borderTop: '1px solid #f3f4f6', background: '#f9fafb' }}>
              <label style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                {cuerpo.turno === 'libre' ? '🔗 Vincular a oposición existente (o dejar vacío para crear nueva)' : '➕ Se creará oposición nueva'}
              </label>
              {cuerpo.turno === 'libre' && (
                <select
                  value={vinculaciones[i] ?? ''}
                  onChange={(e) => setVinculaciones({ ...vinculaciones, [i]: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '7px', outline: 'none', background: 'white' }}
                >
                  <option value="">— Crear oposición nueva —</option>
                  {oposicionesExistentes.filter((o: any) => {
                    const mismoSubgrupo = o.subgrupo === cuerpo.subgrupo;
                    const mismaAdmin = o.administracion === cuerpo.administracion;
                    const esPromocion = o.nombre.toLowerCase().includes('promoci');
                    const turnoCoincide = cuerpo.turno === 'libre' ? !esPromocion : esPromocion;
                    return mismoSubgrupo && mismaAdmin && turnoCoincide;
                  }).map((o: any) => (
                    <option key={o.id} value={o.id}>{o.nombre}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      ))}
      </div>

      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
        {cuerposSeleccionados.size} cuerpo{cuerposSeleccionados.size !== 1 ? 's' : ''} seleccionado{cuerposSeleccionados.size !== 1 ? 's' : ''}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
         onClick={async () => {
        const cuerposACrear = Array.from(cuerposSeleccionados).map(i => ({
          ...cuerposDetectados[i],
          oposicionExistenteId: vinculaciones[i] || null,
        }));

        for (const cuerpo of cuerposACrear) {
          await api.patch(`/boe/${datosExtraidos?.id}/datos`, cuerpo);
          await api.post(`/boe/${datosExtraidos?.id}/procesar`, {
            oposicionExistenteId: cuerpo.oposicionExistenteId,
          });
        }

        aprobar.mutate(datosExtraidos?.id ?? '');
        setCuerposDetectados([]);
        setCuerposSeleccionados(new Set());
        setVinculaciones({});
        setDatosExtraidos(null);
        setPaso('datos');
        queryClient.invalidateQueries({ queryKey: ['boe-pendientes'] });
        alert(`✅ ${cuerposACrear.length} oposición${cuerposACrear.length !== 1 ? 'es' : ''} procesada${cuerposACrear.length !== 1 ? 's' : ''} correctamente`);
        router.push('/admin/oposiciones');
      }}
          disabled={cuerposSeleccionados.size === 0}
          style={{ flex: 2, padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: cuerposSeleccionados.size === 0 ? 0.4 : 1 }}
        >
          ✓ Crear {cuerposSeleccionados.size} oposición{cuerposSeleccionados.size !== 1 ? 'es' : ''}
        </button>
        <button
          onClick={() => { setCuerposDetectados([]); setCuerposSeleccionados(new Set()); setPaso('datos'); setDatosExtraidos(null); }}
          style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', cursor: 'pointer' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}

    {/* Modal comparación de temarios */}
{comparacion && paso === 'comparacion' && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '600px', margin: '0 1rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
        Comparación de temarios
      </div>
      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '1.25rem' }}>
        Claude ha comparado el temario nuevo con la convocatoria anterior
      </div>

      {/* Resultado */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '1rem' }}>
        <div style={{ textAlign: 'center', padding: '10px', background: '#f0fdf4', borderRadius: '8px' }}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#15803d' }}>{comparacion.porcentajeCoincidencia}%</div>
          <div style={{ fontSize: '10px', color: '#9ca3af' }}>Coincidencia</div>
        </div>
        <div style={{ textAlign: 'center', padding: '10px', background: '#fef2f2', borderRadius: '8px' }}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#dc2626' }}>{comparacion.temasNuevos?.length ?? 0}</div>
          <div style={{ fontSize: '10px', color: '#9ca3af' }}>Temas nuevos</div>
        </div>
        <div style={{ textAlign: 'center', padding: '10px', background: '#fffbeb', borderRadius: '8px' }}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#d97706' }}>{comparacion.temasEliminados?.length ?? 0}</div>
          <div style={{ fontSize: '10px', color: '#9ca3af' }}>Eliminados</div>
        </div>
      </div>

      {/* Mensaje según coincidencia */}
      {comparacion.sonIguales ? (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', fontSize: '13px', color: '#15803d' }}>
          ✅ Los temarios son prácticamente idénticos. Se puede duplicar automáticamente.
        </div>
      ) : (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', fontSize: '13px', color: '#92400e' }}>
          ⚠ Hay diferencias entre los temarios. Revisa los cambios antes de decidir.
        </div>
      )}

      {/* Diferencias */}
      {comparacion.temasNuevos?.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '6px' }}>Temas nuevos</div>
          {comparacion.temasNuevos.map((t: string, i: number) => (
            <div key={i} style={{ fontSize: '12px', color: '#15803d', background: '#f0fdf4', borderRadius: '6px', padding: '5px 10px', marginBottom: '3px' }}>
              + {t}
            </div>
          ))}
        </div>
      )}
      {comparacion.temasEliminados?.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '6px' }}>Temas eliminados</div>
          {comparacion.temasEliminados.map((t: string, i: number) => (
            <div key={i} style={{ fontSize: '12px', color: '#dc2626', background: '#fef2f2', borderRadius: '6px', padding: '5px 10px', marginBottom: '3px' }}>
              - {t}
            </div>
          ))}
        </div>
      )}
      {comparacion.temasModificados?.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '6px' }}>Temas modificados</div>
          {comparacion.temasModificados.map((t: any, i: number) => (
            <div key={i} style={{ fontSize: '12px', background: '#f9fafb', borderRadius: '6px', padding: '6px 10px', marginBottom: '3px' }}>
              <div style={{ color: '#dc2626' }}>- {t.anterior}</div>
              <div style={{ color: '#15803d' }}>+ {t.nuevo}</div>
            </div>
          ))}
        </div>
      )}

      {/* Acciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '1.25rem' }}>
        <button
          onClick={async () => {
            // Procesar y duplicar convocatoria con temario
            const res = await api.post(`/boe/${datosExtraidos?.id}/procesar`);
            // Crear temas en la nueva convocatoria
            if (temarioExtraido.length > 0) {
              for (const tema of temarioExtraido) {
                await api.post('/temas', {
                  numero: tema.numero,
                  titulo: tema.titulo,
                  tipo: 'con_normativa',
                  convocatoriaId: res.data.convocatoriaId,
                });
              }
            }
            aprobar.mutate(datosExtraidos?.id ?? '');
            setComparacion(null);
            setDatosExtraidos(null);
            router.push(`/admin/oposiciones/${res.data.oposicionId}`);
          }}
          style={{ width: '100%', padding: '11px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
        >
          {comparacion.sonIguales ? '✅ Duplicar convocatoria con este temario' : '⚠ Usar nuevo temario igualmente'}
        </button>
        <button
          onClick={async () => {
            // Procesar sin temario — el admin lo añade manualmente
            const res = await api.post(`/boe/${datosExtraidos?.id}/procesar`);
            aprobar.mutate(datosExtraidos?.id ?? '');
            setComparacion(null);
            setDatosExtraidos(null);
            router.push(`/admin/oposiciones/${res.data.oposicionId}`);
          }}
          style={{ width: '100%', padding: '11px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}
        >
          Crear convocatoria sin temario — añadir manualmente
        </button>
        <button
          onClick={() => { setComparacion(null); setPaso('datos'); }}
          style={{ width: '100%', padding: '10px', background: 'none', border: 'none', fontSize: '12px', color: '#9ca3af', cursor: 'pointer' }}
        >
          ← Volver
        </button>
      </div>
    </div>
  </div>
)}
   </div> 
  );
}