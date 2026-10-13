'use client';

// ⭐ Usuarios (admin). Revisado 13 oct: puntos y nivel reales (de la oposición activa), estado de
// la cuenta, última actividad, reactivar, filtros por estado/plan/oposición, orden y errores visibles.

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, X } from 'lucide-react';

const SUSCRIPCIONES = ['gratuito', 'esencial', 'profesional'];

const SUSCRIPCION_COLORS: Record<string, { bg: string; color: string }> = {
  gratuito: { bg: '#F3F4F6', color: '#6B7280' },
  esencial: { bg: '#E6F1FB', color: '#185FA5' },
  profesional: { bg: '#EEEDFE', color: '#3C3489' },
};

const POR_PAGINA = 50;

type Orden = 'registro' | 'actividad' | 'puntos';

function mensajeError(e: any): string {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join('. ') : m || 'No se ha podido guardar';
}

function haceCuanto(fecha?: string | null): string {
  if (!fecha) return 'Nunca';
  const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
  if (dias <= 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  if (dias < 30) return `Hace ${dias} días`;
  return new Date(fecha).toLocaleDateString('es-ES');
}

const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#f9fafb', position: 'sticky', top: 0 };
const td: React.CSSProperties = { padding: '10px 12px', fontSize: '13px', color: '#374151' };
const select: React.CSSProperties = { padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' };

export default function UsuariosAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filtroSuscripcion, setFiltroSuscripcion] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'' | 'activo' | 'desactivado'>('');
  const [filtroOposicion, setFiltroOposicion] = useState('');
  const [orden, setOrden] = useState<Orden>('registro');
  const [pagina, setPagina] = useState(0);
  const [sel, setSel] = useState<any>(null);
  const [nuevaSuscripcion, setNuevaSuscripcion] = useState('gratuito');
  const [error, setError] = useState<string | null>(null);

  const { data: usuarios = [], isLoading, isError } = useQuery({
    queryKey: ['usuarios-admin'],
    queryFn: async () => (await api.get('/usuarios')).data,
  });

  const { data: niveles = [] } = useQuery({
    queryKey: ['config-niveles'],
    queryFn: async () => (await api.get('/configuracion/niveles_estudio')).data,
    staleTime: 5 * 60_000,
  });
  const nombreNivel = (n: number) => (Array.isArray(niveles) ? niveles : []).find((x: any) => x.nivel === n)?.nombre ?? `Nivel ${n}`;

  const refrescar = () => queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
  const alTerminar = { onSuccess: () => { refrescar(); setSel(null); setError(null); }, onError: (e: any) => setError(mensajeError(e)) };

  const cambiarSuscripcion = useMutation({
    mutationFn: async ({ id, suscripcion }: { id: string; suscripcion: string }) => api.patch(`/usuarios/${id}/suscripcion`, { suscripcion }),
    ...alTerminar,
  });
  const desactivar = useMutation({ mutationFn: async (id: string) => api.patch(`/usuarios/${id}/desactivar`), ...alTerminar });
  const reactivar = useMutation({ mutationFn: async (id: string) => api.patch(`/usuarios/${id}/activar`), ...alTerminar });

  const oposiciones = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of usuarios as any[]) if (u.oposicion) m.set(u.oposicion.id, u.oposicion.nombre);
    return Array.from(m, ([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [usuarios]);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    const lista = (usuarios as any[]).filter((u) => {
      const matchSearch = !q || [u.email, u.nick, u.nombre, u.apellidos].some((v) => v?.toLowerCase().includes(q));
      const matchPlan = !filtroSuscripcion || u.suscripcion === filtroSuscripcion;
      const matchEstado = !filtroEstado || (filtroEstado === 'activo' ? u.activo : !u.activo);
      const matchOpo = !filtroOposicion || u.oposicion?.id === filtroOposicion;
      return matchSearch && matchPlan && matchEstado && matchOpo;
    });
    const fecha = (v?: string | null) => (v ? new Date(v).getTime() : 0);
    lista.sort((a, b) =>
      orden === 'puntos' ? (b.puntos ?? 0) - (a.puntos ?? 0)
      : orden === 'actividad' ? fecha(b.ultimaActividad) - fecha(a.ultimaActividad)
      : fecha(b.creadoEn) - fecha(a.creadoEn),
    );
    return lista;
  }, [usuarios, search, filtroSuscripcion, filtroEstado, filtroOposicion, orden]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas - 1);
  const visibles = filtrados.slice(paginaActual * POR_PAGINA, (paginaActual + 1) * POR_PAGINA);

  const desactivados = (usuarios as any[]).filter((u) => !u.activo).length;
  const dePago = (usuarios as any[]).filter((u) => u.suscripcion && u.suscripcion !== 'gratuito').length;
  const planSel = sel?.suscripcion ?? 'gratuito';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Cabecera */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6', background: 'white' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Usuarios</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: 2 }}>
          {usuarios.length} registrados · {dePago} de pago · {desactivados} desactivados
        </div>
      </div>

      {/* Filtros */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Buscar por nick, nombre o email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagina(0); }}
            style={{ ...select, width: '100%', paddingLeft: 30, boxSizing: 'border-box' }}
          />
        </div>
        <select value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value as any); setPagina(0); }} style={select}>
          <option value="">Todas las cuentas</option>
          <option value="activo">Activas</option>
          <option value="desactivado">Desactivadas</option>
        </select>
        <select value={filtroSuscripcion} onChange={(e) => { setFiltroSuscripcion(e.target.value); setPagina(0); }} style={select}>
          <option value="">Todos los planes</option>
          {SUSCRIPCIONES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={filtroOposicion} onChange={(e) => { setFiltroOposicion(e.target.value); setPagina(0); }} style={{ ...select, maxWidth: 240 }}>
          <option value="">Todas las oposiciones</option>
          {oposiciones.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
        </select>
        <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)} style={select}>
          <option value="registro">Más recientes</option>
          <option value="actividad">Última actividad</option>
          <option value="puntos">Más puntos</option>
        </select>
      </div>

      {/* Tabla */}
      <div style={{ flex: 1, overflow: 'auto', background: 'white' }}>
        {isLoading ? (
          <div style={{ padding: 24, fontSize: 13, color: '#9ca3af' }}>Cargando…</div>
        ) : isError ? (
          <div style={{ padding: 24, fontSize: 13, color: '#dc2626' }}>No se han podido cargar los usuarios.</div>
        ) : filtrados.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>No hay usuarios con ese filtro</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, paddingLeft: 24 }}>Usuario</th>
                <th style={th}>Oposición</th>
                <th style={th}>Plan</th>
                <th style={th}>Nivel</th>
                <th style={{ ...th, textAlign: 'right' }}>Puntos</th>
                <th style={th}>Última actividad</th>
                <th style={th}>Registro</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((u: any) => (
                <tr key={u.id} style={{ borderTop: '1px solid #f3f4f6', opacity: u.activo ? 1 : 0.55 }}>
                  <td style={{ ...td, paddingLeft: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 500, color: '#111827' }}>{u.nick ? `@${u.nick}` : u.nombre}</span>
                      {u.rol === 'admin' && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: '#111827', color: 'white' }}>admin</span>}
                      {!u.activo && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: '#fee2e2', color: '#b91c1c' }}>desactivada</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{u.email}</div>
                  </td>
                  <td style={{ ...td, fontSize: 12 }}>
                    {u.oposicion ? <>{u.oposicion.nombre}{u.convocatoria?.anyo ? <span style={{ color: '#9ca3af' }}> · {u.convocatoria.anyo}</span> : null}</> : <span style={{ color: '#9ca3af' }}>—</span>}
                  </td>
                  <td style={td}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 500, background: SUSCRIPCION_COLORS[u.suscripcion]?.bg ?? '#f3f4f6', color: SUSCRIPCION_COLORS[u.suscripcion]?.color ?? '#6b7280' }}>
                      {(u.suscripcion ?? 'gratuito').charAt(0).toUpperCase() + (u.suscripcion ?? 'gratuito').slice(1)}
                    </span>
                  </td>
                  <td style={td}>{u.nivel} · {nombreNivel(u.nivel)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 500, color: '#111827' }}>{u.puntos ?? 0}</td>
                  <td style={{ ...td, fontSize: 12, color: '#6b7280' }}>{haceCuanto(u.ultimaActividad)}</td>
                  <td style={{ ...td, fontSize: 12, color: '#9ca3af' }}>{new Date(u.creadoEn).toLocaleDateString('es-ES')}</td>
                  <td style={td}>
                    <button
                      onClick={() => { setSel(u); setNuevaSuscripcion(u.suscripcion ?? 'gratuito'); setError(null); }}
                      style={{ fontSize: 11, color: '#374151', background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {filtrados.length > POR_PAGINA && (
        <div style={{ padding: '10px 24px', borderTop: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
          <span>{paginaActual * POR_PAGINA + 1}–{Math.min(filtrados.length, (paginaActual + 1) * POR_PAGINA)} de {filtrados.length}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button disabled={paginaActual === 0} onClick={() => setPagina(paginaActual - 1)} style={{ ...select, cursor: 'pointer', opacity: paginaActual === 0 ? 0.4 : 1 }}>Anterior</button>
            <button disabled={paginaActual >= totalPaginas - 1} onClick={() => setPagina(paginaActual + 1)} style={{ ...select, cursor: 'pointer', opacity: paginaActual >= totalPaginas - 1 ? 0.4 : 1 }}>Siguiente</button>
          </div>
        </div>
      )}

      {/* Panel del usuario */}
      {sel && (
        <div onClick={() => setSel(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 440, margin: '0 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{sel.nick ? `@${sel.nick}` : sel.nombre}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{sel.nombre} {sel.apellidos ?? ''} · {sel.email}</div>
              </div>
              <button onClick={() => setSel(null)} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, margin: '1rem 0' }}>
              {[
                { label: 'Puntos', value: sel.puntos ?? 0 },
                { label: 'Nivel', value: sel.nivel ?? 1 },
                { label: 'Racha', value: sel.rachaActual ?? 0 },
                { label: '% acierto', value: sel.preguntasRespondidasTotales ? `${Math.round(((sel.preguntasCorrectasTotales ?? 0) / sel.preguntasRespondidasTotales) * 100)}%` : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{value}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14, lineHeight: 1.6 }}>
              Oposición: <strong style={{ color: '#111827' }}>{sel.oposicion?.nombre ?? '—'}</strong>{sel.convocatoria?.anyo ? ` (${sel.convocatoria.anyo})` : ''}<br />
              Preguntas respondidas: {sel.preguntasRespondidasTotales ?? 0} · Última actividad: {haceCuanto(sel.ultimaActividad)}<br />
              Registro: {new Date(sel.creadoEn).toLocaleString('es-ES')}
            </div>

            <div style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 6 }}>Plan</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {SUSCRIPCIONES.map((s) => (
                <button
                  key={s}
                  onClick={() => setNuevaSuscripcion(s)}
                  style={{ flex: 1, padding: 7, borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: nuevaSuscripcion === s ? '1px solid #111827' : '1px solid #e5e7eb', background: nuevaSuscripcion === s ? '#111827' : 'white', color: nuevaSuscripcion === s ? 'white' : '#6b7280' }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {error && <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{error}</div>}

            <button
              onClick={() => cambiarSuscripcion.mutate({ id: sel.id, suscripcion: nuevaSuscripcion })}
              disabled={cambiarSuscripcion.isPending || nuevaSuscripcion === planSel}
              style={{ width: '100%', padding: 10, background: '#111827', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: cambiarSuscripcion.isPending || nuevaSuscripcion === planSel ? 0.5 : 1 }}
            >
              {cambiarSuscripcion.isPending ? 'Guardando…' : 'Guardar plan'}
            </button>

            {sel.rol !== 'admin' && (sel.activo ? (
              <button
                onClick={() => { if (confirm(`¿Desactivar la cuenta de ${sel.email}? No podrá entrar hasta que la reactives.`)) desactivar.mutate(sel.id); }}
                disabled={desactivar.isPending}
                style={{ width: '100%', marginTop: 8, padding: 10, background: 'none', border: '1px solid #fee2e2', borderRadius: 9, fontSize: 13, color: '#dc2626', cursor: 'pointer' }}
              >
                Desactivar cuenta
              </button>
            ) : (
              <button
                onClick={() => reactivar.mutate(sel.id)}
                disabled={reactivar.isPending}
                style={{ width: '100%', marginTop: 8, padding: 10, background: 'none', border: '1px solid #bbf7d0', borderRadius: 9, fontSize: 13, color: '#15803d', cursor: 'pointer' }}
              >
                Reactivar cuenta
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
