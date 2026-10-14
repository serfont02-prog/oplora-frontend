'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Play, Square, RefreshCw, CalendarPlus, Info } from 'lucide-react';
import { api } from '@/lib/api';
import { BG_NEUTRAL } from '@/styles/tokens';

// ⭐ Liga Oplora — configuración de una liga, sus divisiones y su calendario de jornadas.

const NOMBRE_DIVISION: Record<number, string> = { 1: 'Primera', 2: 'Segunda', 3: 'Tercera', 4: 'Cuarta', 5: 'Quinta' };
const MODOS = [
  { valor: 'temas', texto: 'Temas seguidos' },
  { valor: 'bloque', texto: 'Un bloque (rotando)' },
  { valor: 'temario', texto: 'Todo el temario' },
];
const TIPOS_JORNADA = [
  { valor: 'temas', texto: 'Temas concretos' },
  { valor: 'bloque', texto: 'Un bloque' },
  { valor: 'temario', texto: 'Todo el temario' },
  { valor: 'psicotecnico', texto: 'Psicotécnicos' },
];
const ESTADO_JORNADA: Record<string, { bg: string; color: string; texto: string }> = {
  programada: { bg: '#eff6ff', color: '#1d4ed8', texto: 'Programada' },
  abierta: { bg: '#f0fdf4', color: '#15803d', texto: 'Abierta' },
  cerrada: { bg: '#f3f4f6', color: '#374151', texto: 'Cerrada' },
  cancelada: { bg: '#fef2f2', color: '#b91c1c', texto: 'Cancelada' },
};

const tarjeta: React.CSSProperties = { background: 'white', border: '1px solid #f3f4f6', borderRadius: 12, padding: '1.25rem', marginBottom: 16 };
const titulo: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 };
const ayuda: React.CSSProperties = { fontSize: 12, color: '#6b7280', marginBottom: 12 };
const input: React.CSSProperties = { padding: '7px 9px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8, boxSizing: 'border-box' };
const etiqueta: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#374151' };
const botonOscuro: React.CSSProperties = { padding: '8px 14px', background: '#111827', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' };
const botonClaro: React.CSSProperties = { padding: '7px 12px', background: 'white', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };

function mensajeError(e: any): string {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join('. ') : m ?? 'Ha ocurrido un error';
}

function fechaMadrid(valor: string | Date | null | undefined): string {
  if (!valor) return '—';
  return new Date(valor).toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

/** Próximo viernes (AAAA-MM-DD) en hora local. */
function proximoViernes(): string {
  const d = new Date();
  const dias = (5 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function esViernes(texto: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!m) return false;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay() === 5;
}

export default function LigaDetalleAdminPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-liga', id],
    queryFn: async () => (await api.get(`/liga/admin/${id}`)).data as { liga: any; divisiones: any[] },
  });
  const liga = data?.liga;
  const convocatoriaId: string | undefined = liga?.convocatoria?.id;

  const { data: jornadas = [], refetch: refetchJornadas } = useQuery({
    queryKey: ['admin-liga-jornadas', id],
    queryFn: async () => (await api.get(`/liga/admin/${id}/jornadas`)).data as any[],
  });

  const { data: temas = [] } = useQuery({
    queryKey: ['admin-liga-temas', convocatoriaId],
    queryFn: async () => (await api.get(`/temas/convocatoria/${convocatoriaId}`)).data as any[],
    enabled: !!convocatoriaId,
  });

  const temasOrdenados = useMemo(
    () => [...temas].filter((t) => t.activo !== false).sort((a, b) => a.numero - b.numero),
    [temas],
  );
  const bloques = useMemo(() => {
    const nombres: string[] = [];
    for (const b of liga?.convocatoria?.bloquesTemario ?? []) if (b?.nombre && !nombres.includes(b.nombre)) nombres.push(b.nombre);
    for (const t of temasOrdenados) if (t.bloque && !nombres.includes(t.bloque)) nombres.push(t.bloque);
    return nombres;
  }, [liga, temasOrdenados]);

  const refrescarTodo = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-liga', id] });
    queryClient.invalidateQueries({ queryKey: ['admin-liga-jornadas', id] });
    queryClient.invalidateQueries({ queryKey: ['admin-ligas'] });
  };

  /* ---------- Configuración general ---------- */
  const [config, setConfig] = useState<any>(null);
  useEffect(() => {
    if (liga) {
      setConfig({
        estado: liga.estado,
        porcentajeAscenso: liga.porcentajeAscenso,
        bonusParticipacion: liga.bonusParticipacion,
        horaAviso: liga.horaAviso,
        horaApertura: liga.horaApertura,
        horaUltimaLlamada: liga.horaUltimaLlamada,
        horaCierre: liga.horaCierre,
      });
    }
  }, [liga]);
  const guardarConfig = useMutation({
    mutationFn: async () =>
      (await api.patch(`/liga/admin/${id}`, {
        ...config,
        porcentajeAscenso: Number(config.porcentajeAscenso),
        bonusParticipacion: Number(config.bonusParticipacion),
      })).data,
    onSuccess: refrescarTodo,
  });

  /* ---------- Divisiones ---------- */
  const [divs, setDivs] = useState<Record<number, any>>({});
  useEffect(() => {
    if (data?.divisiones) {
      const mapa: Record<number, any> = {};
      for (const d of data.divisiones) mapa[d.division] = { ...d };
      setDivs(mapa);
    }
  }, [data?.divisiones]);
  const [divGuardada, setDivGuardada] = useState<number | null>(null);
  const guardarDivision = useMutation({
    mutationFn: async (division: number) => {
      const d = divs[division];
      return (await api.patch(`/liga/admin/${id}/divisiones/${division}`, {
        modo: d.modo,
        temasPorJornada: Number(d.temasPorJornada),
        numPreguntas: Number(d.numPreguntas),
        segundosPorPregunta: Number(d.segundosPorPregunta),
        bloqueMensual: !!d.bloqueMensual,
        cursorTema: Number(d.cursorTema),
        cursorBloque: Number(d.cursorBloque),
      })).data;
    },
    onSuccess: (_r, division) => {
      setDivGuardada(division);
      refrescarTodo();
    },
  });

  /* ---------- Jornadas ---------- */
  const accionJornada = useMutation({
    mutationFn: async ({ jornadaId, accion }: { jornadaId: string; accion: 'abrir' | 'cerrar' }) =>
      (await api.post(`/liga/admin/jornadas/${jornadaId}/${accion}`)).data,
    onSuccess: refrescarTodo,
  });
  const ejecutar = useMutation({
    mutationFn: async () => (await api.post(`/liga/admin/${id}/ejecutar`)).data,
    onSuccess: refrescarTodo,
  });
  const [mesCierre, setMesCierre] = useState('');
  const cerrarMes = useMutation({
    mutationFn: async () => (await api.post(`/liga/admin/${id}/cerrar-mes`, { mes: mesCierre })).data,
    onSuccess: refrescarTodo,
  });

  /* ---------- Fijar jornada ---------- */
  const [fijar, setFijar] = useState<any>({ division: 5, viernes: proximoViernes(), tipo: 'temas', temaIds: [] as string[], bloque: '', numPreguntas: '', segundosPorPregunta: '' });
  const fijarJornada = useMutation({
    mutationFn: async () => {
      const body: any = { division: Number(fijar.division), viernes: fijar.viernes, tipo: fijar.tipo };
      if (fijar.tipo === 'temas') body.temaIds = fijar.temaIds;
      if (fijar.tipo === 'bloque') body.bloque = fijar.bloque;
      if (fijar.numPreguntas !== '') body.numPreguntas = Number(fijar.numPreguntas);
      if (fijar.segundosPorPregunta !== '') body.segundosPorPregunta = Number(fijar.segundosPorPregunta);
      return (await api.post(`/liga/admin/${id}/jornadas`, body)).data;
    },
    onSuccess: () => {
      setFijar((f: any) => ({ ...f, temaIds: [] }));
      refrescarTodo();
    },
  });
  const viernesValido = esViernes(fijar.viernes);
  const fijarListo =
    viernesValido &&
    (fijar.tipo !== 'temas' || fijar.temaIds.length > 0) &&
    (fijar.tipo !== 'bloque' || !!fijar.bloque);

  if (isLoading) return <div style={{ padding: '2rem', fontSize: 13, color: '#6b7280' }}>Cargando…</div>;
  if (isError || !liga) {
    return (
      <div style={{ padding: '2rem', fontSize: 13, color: '#dc2626' }}>
        No se pudo cargar la liga.{' '}
        <button onClick={() => refetch()} style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}>Reintentar</button>
      </div>
    );
  }

  const temaPorIndice = (i: number) => temasOrdenados[i % Math.max(temasOrdenados.length, 1)];

  return (
    <div style={{ minHeight: '100%', background: BG_NEUTRAL }}>
      {/* Cabecera */}
      <div style={{ padding: '1.25rem 1.5rem', background: 'white', borderBottom: '1px solid #f3f4f6' }}>
        <button onClick={() => router.push('/admin/liga')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8 }}>
          <ArrowLeft size={13} /> Ligas
        </button>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>
          Liga Oplora · {liga.convocatoria?.oposicion?.nombre ?? 'Oposición'} {liga.convocatoria?.anyo}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
          {temasOrdenados.length} temas activos · {bloques.length} bloques · {liga.convocatoria?.numOpcionesTest ? `${liga.convocatoria.numOpcionesTest} opciones por pregunta` : 'opciones por pregunta sin definir (se muestran las guardadas)'} ·
          penalización {liga.convocatoria?.fraccionPenalizacion || 'sin penalización'} ·
          examen {liga.convocatoria?.fechaExamen ? new Date(liga.convocatoria.fechaExamen).toLocaleDateString('es-ES') : 'sin fecha'} ·
          último mes cerrado {liga.ultimoMesCerrado ?? 'ninguno'}
        </div>
      </div>

      <div style={{ padding: '1.25rem 1.5rem', maxWidth: 1100 }}>
        <div style={{ ...tarjeta, display: 'flex', gap: 10, background: '#eff6ff', borderColor: '#dbeafe' }}>
          <Info size={16} color="#1d4ed8" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 12, color: '#1e3a8a', lineHeight: 1.6 }}>
            La liga funciona sola: cada lunes crea la jornada de cada división, el viernes elige las preguntas y la abre, y el domingo la cierra con posiciones y puntos.
            El día 1 cierra el mes (asciende el {liga.porcentajeAscenso} % de cada división y da copa a los campeones).
            Si un tema no tiene preguntas, la jornada se completa con temas anteriores; si no hay ninguna, se cancela.
            Para probar sin esperar: «Ejecutar ahora», y en cada jornada «Abrir ya» o «Cerrar ya».
          </div>
        </div>

        {/* Estado y horarios */}
        {config && (
          <div style={tarjeta}>
            <div style={titulo}>Estado y horarios</div>
            <div style={ayuda}>Horas en hora de Madrid. Pausar detiene la creación y apertura de jornadas (las abiertas se cierran igual).</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label style={etiqueta}>
                Estado
                <select value={config.estado} onChange={(e) => setConfig({ ...config, estado: e.target.value })} style={input} disabled={liga.estado === 'cerrada'}>
                  <option value="activa">Activa</option>
                  <option value="pausada">Pausada</option>
                  {liga.estado === 'cerrada' && <option value="cerrada">Cerrada</option>}
                </select>
              </label>
              <label style={etiqueta}>
                % de ascenso
                <input type="number" min={1} max={100} value={config.porcentajeAscenso} onChange={(e) => setConfig({ ...config, porcentajeAscenso: e.target.value })} style={{ ...input, width: 90 }} />
              </label>
              <label style={etiqueta}>
                Bonus por jugar
                <input type="number" min={0} max={100} value={config.bonusParticipacion} onChange={(e) => setConfig({ ...config, bonusParticipacion: e.target.value })} style={{ ...input, width: 90 }} />
              </label>
              {[
                ['horaAviso', 'Aviso (lunes)'],
                ['horaApertura', 'Apertura (viernes)'],
                ['horaUltimaLlamada', 'Última llamada (domingo)'],
                ['horaCierre', 'Cierre (domingo)'],
              ].map(([campo, texto]) => (
                <label key={campo} style={etiqueta}>
                  {texto}
                  <input type="time" value={config[campo]} onChange={(e) => setConfig({ ...config, [campo]: e.target.value })} style={{ ...input, width: 120 }} />
                </label>
              ))}
              <button onClick={() => guardarConfig.mutate()} disabled={guardarConfig.isPending || liga.estado === 'cerrada'} style={botonOscuro}>
                {guardarConfig.isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
            {guardarConfig.isError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>{mensajeError(guardarConfig.error)}</div>}
            {guardarConfig.isSuccess && <div style={{ fontSize: 12, color: '#15803d', marginTop: 8 }}>Guardado.</div>}
          </div>
        )}

        {/* Divisiones */}
        <div style={tarjeta}>
          <div style={titulo}>Divisiones</div>
          <div style={ayuda}>
            Qué entra en cada jornada y su tamaño. El tiempo de la jornada es preguntas × segundos. «Próximo tema» es por dónde va el avance del temario en modo «Temas seguidos».
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['División', 'Modo', 'Temas/jornada', 'Preguntas', 'Seg./pregunta', 'Tiempo', '1.ª del mes por bloque', 'Próximo tema', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 8px', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((division) => {
                  const d = divs[division];
                  if (!d) return null;
                  const set = (campo: string, valor: any) => setDivs({ ...divs, [division]: { ...d, [campo]: valor } });
                  const proximo = temaPorIndice(Number(d.cursorTema) || 0);
                  return (
                    <tr key={division} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: 8, fontWeight: 600, color: '#111827' }}>{NOMBRE_DIVISION[division]}</td>
                      <td style={{ padding: 8 }}>
                        <select value={d.modo} onChange={(e) => set('modo', e.target.value)} style={input}>
                          {MODOS.map((m) => <option key={m.valor} value={m.valor}>{m.texto}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: 8 }}>
                        <input type="number" min={0} max={60} value={d.temasPorJornada} disabled={d.modo !== 'temas'} onChange={(e) => set('temasPorJornada', e.target.value)} style={{ ...input, width: 70 }} />
                      </td>
                      <td style={{ padding: 8 }}>
                        <input type="number" min={5} max={100} value={d.numPreguntas} onChange={(e) => set('numPreguntas', e.target.value)} style={{ ...input, width: 70 }} />
                      </td>
                      <td style={{ padding: 8 }}>
                        <input type="number" min={10} max={300} value={d.segundosPorPregunta} onChange={(e) => set('segundosPorPregunta', e.target.value)} style={{ ...input, width: 70 }} />
                      </td>
                      <td style={{ padding: 8, color: '#374151', whiteSpace: 'nowrap' }}>
                        {Math.round((Number(d.numPreguntas) * Number(d.segundosPorPregunta)) / 60)} min
                      </td>
                      <td style={{ padding: 8 }}>
                        <input type="checkbox" checked={!!d.bloqueMensual} disabled={d.modo !== 'temario'} onChange={(e) => set('bloqueMensual', e.target.checked)} aria-label="Primera jornada del mes por bloque" />
                      </td>
                      <td style={{ padding: 8 }}>
                        {d.modo === 'temas' ? (
                          <select value={d.cursorTema} onChange={(e) => set('cursorTema', e.target.value)} style={{ ...input, maxWidth: 180 }}>
                            {temasOrdenados.map((t, i) => <option key={t.id} value={i}>Tema {t.numero}</option>)}
                          </select>
                        ) : d.modo === 'bloque' || d.bloqueMensual ? (
                          <select value={d.cursorBloque % Math.max(bloques.length, 1)} onChange={(e) => set('cursorBloque', e.target.value)} style={{ ...input, maxWidth: 180 }} disabled={bloques.length === 0}>
                            {bloques.length === 0 ? <option value={0}>Sin bloques</option> : bloques.map((b, i) => <option key={b} value={i}>{b}</option>)}
                          </select>
                        ) : (
                          <span style={{ color: '#6b7280' }}>—</span>
                        )}
                        {d.modo === 'temas' && !proximo && <span style={{ color: '#b91c1c' }}> sin temas</span>}
                      </td>
                      <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
                        <button onClick={() => { setDivGuardada(null); guardarDivision.mutate(division); }} disabled={guardarDivision.isPending} style={botonClaro}>Guardar</button>
                        {divGuardada === division && guardarDivision.isSuccess && <span style={{ color: '#15803d', marginLeft: 6 }}>✓</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {bloques.length === 0 && (
            <div style={{ fontSize: 12, color: '#b45309', marginTop: 8 }}>
              Esta convocatoria no tiene bloques: las divisiones en modo «Un bloque» jugarán todo el temario. Los bloques se definen en la convocatoria y en el campo «bloque» de cada tema.
            </div>
          )}
          {guardarDivision.isError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>{mensajeError(guardarDivision.error)}</div>}
        </div>

        {/* Jornadas */}
        <div style={tarjeta}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <div>
              <div style={titulo}>Jornadas</div>
              <div style={{ ...ayuda, marginBottom: 0 }}>Las últimas 100, de la más reciente a la más antigua.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => ejecutar.mutate()} disabled={ejecutar.isPending} style={botonClaro}>
                <RefreshCw size={13} /> {ejecutar.isPending ? 'Ejecutando…' : 'Ejecutar ahora'}
              </button>
              <input type="month" value={mesCierre} onChange={(e) => setMesCierre(e.target.value)} style={input} aria-label="Mes a cerrar" />
              <button
                onClick={() => { if (window.confirm(`¿Cerrar el mes ${mesCierre}? Se calcularán ascensos y copas y no se puede deshacer.`)) cerrarMes.mutate(); }}
                disabled={!mesCierre || cerrarMes.isPending}
                style={botonClaro}
              >
                Cerrar mes
              </button>
              <button onClick={() => refetchJornadas()} style={botonClaro} aria-label="Recargar jornadas"><RefreshCw size={13} /></button>
            </div>
          </div>
          {(ejecutar.isError || cerrarMes.isError || accionJornada.isError) && (
            <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>
              {mensajeError(ejecutar.error ?? cerrarMes.error ?? accionJornada.error)}
            </div>
          )}
          {cerrarMes.isSuccess && (
            <div style={{ fontSize: 12, color: '#15803d', marginBottom: 8 }}>
              Mes cerrado: {(cerrarMes.data as any)?.ascendidos ?? 0} ascensos y {(cerrarMes.data as any)?.campeones ?? 0} campeones.
            </div>
          )}
          {jornadas.length === 0 ? (
            <div style={{ fontSize: 13, color: '#6b7280', padding: '1rem 0' }}>
              Aún no hay jornadas. Se crean solas el lunes a la hora del aviso; también puedes fijar una abajo o pulsar «Ejecutar ahora» entre el lunes y el viernes.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Apertura', 'Cierre', 'División', 'Contenido', 'Preguntas', 'Estado', 'Han jugado', ''].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: 8, fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jornadas.map((j) => {
                    const est = ESTADO_JORNADA[j.estado] ?? ESTADO_JORNADA.cerrada;
                    return (
                      <tr key={j.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                        <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{fechaMadrid(j.fechaApertura)}</td>
                        <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{fechaMadrid(j.fechaCierre)}</td>
                        <td style={{ padding: 8 }}>{j.nombreDivision}</td>
                        <td style={{ padding: 8 }}>
                          {j.descripcion}
                          {j.fijadaPorAdmin && <span style={{ marginLeft: 6, fontSize: 11, color: '#6b7280' }}>(fijada)</span>}
                          {j.motivoCancelacion && <div style={{ fontSize: 11, color: '#b91c1c' }}>{j.motivoCancelacion}</div>}
                        </td>
                        <td style={{ padding: 8 }}>{j.numPreguntas} · {Math.round(j.tiempoLimiteSeg / 60)} min</td>
                        <td style={{ padding: 8 }}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: est.bg, color: est.color, fontWeight: 500 }}>{est.texto}</span>
                        </td>
                        <td style={{ padding: 8 }}>{j.participantes}</td>
                        <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
                          {j.estado === 'programada' && (
                            <button onClick={() => accionJornada.mutate({ jornadaId: j.id, accion: 'abrir' })} disabled={accionJornada.isPending} style={botonClaro}>
                              <Play size={12} /> Abrir ya
                            </button>
                          )}
                          {j.estado === 'abierta' && (
                            <button
                              onClick={() => { if (window.confirm('¿Cerrar ya esta jornada? Se calculan posiciones y puntos definitivos.')) accionJornada.mutate({ jornadaId: j.id, accion: 'cerrar' }); }}
                              disabled={accionJornada.isPending}
                              style={botonClaro}
                            >
                              <Square size={12} /> Cerrar ya
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Fijar jornada */}
        <div style={tarjeta}>
          <div style={titulo}>Fijar una jornada</div>
          <div style={ayuda}>
            Sustituye lo que tocaba por calendario en ese fin de semana y división: temas concretos, un bloque, todo el temario o psicotécnicos. Solo jornadas que aún no han abierto.
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
            <label style={etiqueta}>
              División
              <select value={fijar.division} onChange={(e) => setFijar({ ...fijar, division: Number(e.target.value) })} style={input}>
                {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{NOMBRE_DIVISION[d]}</option>)}
              </select>
            </label>
            <label style={etiqueta}>
              Viernes del fin de semana
              <input type="date" value={fijar.viernes} onChange={(e) => setFijar({ ...fijar, viernes: e.target.value })} style={input} />
            </label>
            <label style={etiqueta}>
              Tipo
              <select value={fijar.tipo} onChange={(e) => setFijar({ ...fijar, tipo: e.target.value })} style={input}>
                {TIPOS_JORNADA.map((t) => <option key={t.valor} value={t.valor}>{t.texto}</option>)}
              </select>
            </label>
            {fijar.tipo === 'bloque' && (
              <label style={etiqueta}>
                Bloque
                <select value={fijar.bloque} onChange={(e) => setFijar({ ...fijar, bloque: e.target.value })} style={input}>
                  <option value="">Elige bloque…</option>
                  {bloques.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </label>
            )}
            <label style={etiqueta}>
              Preguntas (opcional)
              <input type="number" min={5} max={100} placeholder={String(divs[fijar.division]?.numPreguntas ?? '')} value={fijar.numPreguntas} onChange={(e) => setFijar({ ...fijar, numPreguntas: e.target.value })} style={{ ...input, width: 110 }} />
            </label>
            <label style={etiqueta}>
              Seg./pregunta (opcional)
              <input type="number" min={10} max={300} placeholder={String(divs[fijar.division]?.segundosPorPregunta ?? '')} value={fijar.segundosPorPregunta} onChange={(e) => setFijar({ ...fijar, segundosPorPregunta: e.target.value })} style={{ ...input, width: 110 }} />
            </label>
          </div>
          {!viernesValido && <div style={{ fontSize: 12, color: '#b45309', marginBottom: 10 }}>La fecha tiene que ser un viernes.</div>}
          {fijar.tipo === 'temas' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 6, maxHeight: 260, overflowY: 'auto', border: '1px solid #f3f4f6', borderRadius: 8, padding: 10, marginBottom: 12 }}>
              {temasOrdenados.length === 0 && <div style={{ fontSize: 12, color: '#6b7280' }}>Esta convocatoria no tiene temas activos.</div>}
              {temasOrdenados.map((t) => {
                const marcado = fijar.temaIds.includes(t.id);
                return (
                  <label key={t.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#374151', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => setFijar({ ...fijar, temaIds: marcado ? fijar.temaIds.filter((x: string) => x !== t.id) : [...fijar.temaIds, t.id] })}
                    />
                    <span><strong>Tema {t.numero}.</strong> {t.titulo}</span>
                  </label>
                );
              })}
            </div>
          )}
          <button onClick={() => fijarJornada.mutate()} disabled={!fijarListo || fijarJornada.isPending} style={{ ...botonOscuro, display: 'inline-flex', alignItems: 'center', gap: 6, opacity: fijarListo ? 1 : 0.5 }}>
            <CalendarPlus size={14} /> {fijarJornada.isPending ? 'Guardando…' : 'Fijar jornada'}
          </button>
          {fijarJornada.isError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>{mensajeError(fijarJornada.error)}</div>}
          {fijarJornada.isSuccess && <div style={{ fontSize: 12, color: '#15803d', marginTop: 8 }}>Jornada fijada: {(fijarJornada.data as any)?.descripcion}.</div>}
        </div>
      </div>
    </div>
  );
}
