'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Upload, CheckCircle, AlertCircle, FileJson, Trash2 } from 'lucide-react';
import { BG_NEUTRAL } from '@/styles/tokens';

/**
 * ⭐ Importación masiva del banco de test (nov 2026).
 * Un solo archivo con preguntas de todos los temas; cada pregunta dice su tema y, si es de ley,
 * sus siglas y artículo. El archivo se manda por partes (el servidor admite 5 MB por petición).
 * Backend: POST /test/importar/masivo/:oposicionId (ImportacionTestService).
 */

const TAM_PARTE = 400;

type Informe = {
  simulacion: boolean;
  recibidas: number;
  importadas: number;
  vinculadasExistentes: number;
  yaEstaban: number;
  conArticulo: number;
  temaComoRespaldo?: number;
  conDescartable?: number;
  noEnlazadas: { fila: number; enunciado: string; referencia: string }[];
  errores: string[];
  borrado?: {
    modo: string; borradas: number; conservadasOficiales: number; conservadasCompartidas: number;
    porOposicion?: { oposicion: string; preguntas: number }[];
  };
};

const EJEMPLO = `{
  "preguntas": [
    {
      "tema": 2,
      "norma": "CE",
      "articulo": "17",
      "enunciado": "Según el art. 17.2 CE, la detención preventiva no podrá durar más del tiempo estrictamente necesario y, en todo caso, el detenido deberá ser puesto en libertad o a disposición judicial en el plazo máximo de:",
      "opciones": ["24 horas", "48 horas", "96 horas", "72 horas"],
      "correcta": 3,
      "descartable": 2,
      "explicacion": "Art. 17.2 CE: plazo máximo de 72 horas.",
      "dificultad": 1,
      "fuente": "art. 17.2 CE"
    }
  ]
}`;

export default function ImportarTestPage() {
  const [oposicionId, setOposicionId] = useState('');
  const [preguntas, setPreguntas] = useState<any[] | null>(null);
  const [archivos, setArchivos] = useState<string[]>([]);
  const [borrar, setBorrar] = useState<'ninguno' | 'banco' | 'todo' | 'global'>('ninguno');
  const [enlaceTemaSiempre, setEnlaceTemaSiempre] = useState(false);
  const [confirmacion, setConfirmacion] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const [progreso, setProgreso] = useState<{ hechas: number; total: number } | null>(null);
  const [informe, setInforme] = useState<Informe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  const { data: oposiciones = [] } = useQuery({
    queryKey: ['oposiciones-admin'],
    queryFn: async () => (await api.get('/oposiciones')).data,
  });

  const cargarArchivos = async (lista: FileList | null) => {
    const fs = Array.from(lista ?? []).filter((f) => f.name.toLowerCase().endsWith('.json') || f.type === 'application/json');
    if (!fs.length) { setError('Elige uno o varios archivos .json'); return; }
    setError(null); setInforme(null);
    try {
      const contenidos = await Promise.all(fs.map(async (f) => {
        const d = JSON.parse(await f.text());
        return Array.isArray(d) ? d : Array.isArray(d?.preguntas) ? d.preguntas : null;
      }));
      if (contenidos.some((c) => !c)) throw new Error('formato');
      setPreguntas(contenidos.flat() as any[]);
      setArchivos(fs.map((f, i) => `${f.name} (${(contenidos[i] as any[]).length})`));
    } catch {
      setError('Algún archivo no es válido: tiene que ser una lista o { "preguntas": [ ... ] }.');
      setPreguntas(null); setArchivos([]);
    }
  };

  // ⭐ El borrado global (todas las oposiciones) pide una palabra distinta para no hacerlo sin querer.
  const palabraConfirmacion = borrar === 'global' ? 'BORRAR TODO' : 'BORRAR';
  const borradoConfirmado = borrar === 'ninguno' || confirmacion.trim().toUpperCase() === palabraConfirmacion;

  const ejecutar = async (simular: boolean) => {
    if (!oposicionId || !preguntas?.length) return;
    if (!simular && !borradoConfirmado) { setError(`Para borrar, escribe ${palabraConfirmacion} en la casilla de confirmación.`); return; }
    setTrabajando(true); setError(null); setInforme(null);
    const total: Informe = {
      simulacion: simular, recibidas: 0, importadas: 0, vinculadasExistentes: 0, yaEstaban: 0, conArticulo: 0,
      temaComoRespaldo: 0, conDescartable: 0, noEnlazadas: [], errores: [],
    };
    try {
      for (let i = 0; i < preguntas.length; i += TAM_PARTE) {
        setProgreso({ hechas: i, total: preguntas.length });
        const parte = preguntas.slice(i, i + TAM_PARTE);
        // El borrado real solo va con la primera parte. En la simulación se manda en todas, para que
        // cada parte cuente como "ya existentes" solo las preguntas que no se van a borrar.
        const borrarEnEsta = borrar !== 'ninguno' && (simular || i === 0) ? borrar : 'ninguno';
        const res = await api.post(`/test/importar/masivo/${oposicionId}`, {
          preguntas: parte, borrar: borrarEnEsta, simular, offset: i,
          enlaceTema: enlaceTemaSiempre ? 'siempre' : 'respaldo',
        });
        const r: Informe = res.data;
        total.recibidas += r.recibidas;
        total.importadas += r.importadas;
        total.vinculadasExistentes += r.vinculadasExistentes;
        total.yaEstaban += r.yaEstaban;
        total.conArticulo += r.conArticulo;
        total.temaComoRespaldo = (total.temaComoRespaldo ?? 0) + (r.temaComoRespaldo ?? 0);
        total.conDescartable = (total.conDescartable ?? 0) + (r.conDescartable ?? 0);
        total.noEnlazadas.push(...r.noEnlazadas);
        total.errores.push(...r.errores);
        if (r.borrado && !total.borrado) total.borrado = r.borrado;
      }
      setProgreso({ hechas: preguntas.length, total: preguntas.length });
      setInforme(total);
      if (!simular) setConfirmacion('');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message ?? 'Error al importar');
      if (total.recibidas) setInforme(total);
    } finally {
      setTrabajando(false);
    }
  };

  const caja: React.CSSProperties = { background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem' };
  const titulo: React.CSSProperties = { fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '10px' };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: BG_NEUTRAL }}>
      <div style={{ maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>Importar banco de test</div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            Un archivo con las preguntas de todos los temas. Cada pregunta se vincula a su tema y, si trae
            «norma» y «articulo», también al artículo de la versión vigente de la ley.
          </div>
        </div>

        {/* 1. Oposición */}
        <div style={caja}>
          <div style={titulo}>1. Oposición</div>
          <select value={oposicionId} onChange={(e) => setOposicionId(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <option value="">Selecciona la oposición</option>
            {oposiciones.map((o: any) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
          </select>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
            El número de tema se busca en la convocatoria activa de la oposición.
          </div>
        </div>

        {/* 2. Archivo */}
        <div style={caja}>
          <div style={titulo}>2. Archivo</div>
          <label
            onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => { e.preventDefault(); setArrastrando(false); cargarArchivos(e.dataTransfer.files); }}
            style={{ display: 'block', border: `2px dashed ${arrastrando ? '#6366f1' : '#e5e7eb'}`, borderRadius: '10px', padding: '24px', textAlign: 'center', cursor: 'pointer' }}>
            <input type="file" accept=".json,application/json" multiple style={{ display: 'none' }}
              onChange={(e) => cargarArchivos(e.target.files)} />
            <FileJson size={22} style={{ color: '#9ca3af' }} />
            <div style={{ fontSize: '13px', color: '#374151', marginTop: '6px' }}>
              {archivos.length ? archivos.join(' · ') : 'Arrastra aquí el .json (o varios) o haz clic para elegirlo'}
            </div>
            {preguntas && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{preguntas.length} preguntas en total</div>}
          </label>
          <details style={{ marginTop: '10px' }}>
            <summary style={{ fontSize: '12px', color: '#6b7280', cursor: 'pointer' }}>Formato del archivo</summary>
            <pre style={{ fontSize: '11px', color: '#6b7280', background: '#f9fafb', padding: '12px', borderRadius: '8px', overflow: 'auto', marginTop: '8px' }}>{EJEMPLO}</pre>
            <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.6 }}>
              • <b>tema</b>: número del tema. Opcional si trae artículo.<br />
              • <b>norma</b> + <b>articulo</b>: siglas de la ley y número («17», «282 bis»). Para varios: <code>"articulos": [{'{'}"norma":"CE","articulo":"17"{'}'}]</code>.<br />
              • <b>opciones</b>: 3 o 4. <b>correcta</b>: posición empezando en 0. <b>dificultad</b>: 1, 2 o 3.<br />
              • Opcionales: <b>explicacion</b>, <b>fuente</b>, <b>origen</b> (por defecto «generada»), <b>anyo</b>, <b>estado</b>.<br />
              • Si una pregunta ya existe (mismo enunciado y opciones), no se duplica: se vincula a lo que le falte.
            </div>
          </details>
        </div>

        {/* 3. Borrado previo */}
        <div style={caja}>
          <div style={titulo}>3. ¿Borrar antes las preguntas actuales de esta oposición?</div>
          {([
            ['ninguno', 'No borrar nada', 'Solo se añaden las preguntas del archivo.'],
            ['banco', 'Borrar el banco, salvo los exámenes oficiales', 'Se conservan las preguntas de los exámenes oficiales (simulacros).'],
            ['todo', 'Borrar todo, también los exámenes oficiales', 'Los simulacros de exámenes oficiales se quedarán sin preguntas.'],
            ['global', 'Borrar el banco de TODAS las oposiciones, salvo los exámenes oficiales', 'Para rehacer el banco compartido desde cero: borra también las preguntas de otras oposiciones y las de leyes compartidas. Simula antes para ver cuántas son de cada oposición.'],
          ] as const).map(([valor, etiqueta, ayuda]) => (
            <label key={valor} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '6px 0', cursor: 'pointer' }}>
              <input type="radio" name="borrar" checked={borrar === valor} onChange={() => setBorrar(valor)} style={{ marginTop: '3px' }} />
              <span>
                <span style={{ fontSize: '13px', color: '#111827' }}>{etiqueta}</span>
                <span style={{ display: 'block', fontSize: '12px', color: '#9ca3af' }}>{ayuda}</span>
              </span>
            </label>
          ))}
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
            Salvo en el borrado de todas las oposiciones, nunca se borran preguntas que también estén en
            temas de otra oposición, ni las que solo cuelgan de artículos de leyes compartidas con otra
            oposición. El borrado no se puede deshacer.
          </div>
          <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '12px', cursor: 'pointer' }}>
            <input type="checkbox" checked={enlaceTemaSiempre} onChange={(e) => setEnlaceTemaSiempre(e.target.checked)} style={{ marginTop: '3px' }} />
            <span>
              <span style={{ fontSize: '13px', color: '#111827' }}>Vincular siempre al tema las preguntas de ley</span>
              <span style={{ display: 'block', fontSize: '12px', color: '#9ca3af' }}>
                Desmarcado (recomendado): una pregunta con artículo solo se vincula al tema si ese artículo no está
                vinculado al tema en «Vincular normativa»; así pertenece al artículo y la comparten las oposiciones.
              </span>
            </span>
          </label>
          {borrar !== 'ninguno' && (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={14} style={{ color: '#dc2626' }} />
              <input value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} placeholder={`Escribe ${palabraConfirmacion} para confirmar`}
                style={{ flex: 1, padding: '7px 10px', fontSize: '13px', border: '1px solid #fecaca', borderRadius: '8px' }} />
            </div>
          )}
        </div>

        {/* 4. Acciones */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => ejecutar(true)} disabled={!oposicionId || !preguntas?.length || trabajando}
            style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', cursor: 'pointer', opacity: !oposicionId || !preguntas?.length ? 0.5 : 1 }}>
            Simular (no guarda nada)
          </button>
          <button onClick={() => ejecutar(false)} disabled={!oposicionId || !preguntas?.length || trabajando || !borradoConfirmado}
            style={{ flex: 2, padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: !oposicionId || !preguntas?.length || !borradoConfirmado ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Upload size={14} /> {trabajando ? 'Trabajando…' : borrar === 'ninguno' ? 'Importar' : 'Borrar e importar'}
          </button>
        </div>

        {progreso && trabajando && (
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Enviando… {progreso.hechas} de {progreso.total}</div>
        )}

        {error && (
          <div style={{ display: 'flex', gap: '8px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '13px', color: '#991b1b' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {informe && (
          <div style={caja}>
            <div style={{ ...titulo, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={16} style={{ color: '#16a34a' }} />
              {informe.simulacion ? 'Simulación (no se ha guardado nada)' : 'Importación terminada'}
            </div>
            <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.8 }}>
              {informe.borrado && (
                <div>
                  {informe.simulacion ? 'Se borrarían' : 'Borradas'}: <b>{informe.borrado.borradas}</b>
                  {informe.borrado.conservadasOficiales > 0 && <> · conservadas de exámenes oficiales: {informe.borrado.conservadasOficiales}</>}
                  {informe.borrado.conservadasCompartidas > 0 && <> · conservadas por estar compartidas con otra oposición: {informe.borrado.conservadasCompartidas}</>}
                  {!!informe.borrado.porOposicion?.length && (
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Por oposición (una pregunta compartida cuenta en cada una):{' '}
                      {informe.borrado.porOposicion.map((o) => `${o.oposicion} ${o.preguntas}`).join(' · ')}
                    </div>
                  )}
                </div>
              )}
              <div>Recibidas: {informe.recibidas}</div>
              <div>{informe.simulacion ? 'Se importarían' : 'Importadas'}: <b>{informe.importadas}</b> (con artículo: {informe.conArticulo}{informe.conDescartable ? ` · de 4 opciones con descartable: ${informe.conDescartable}` : ''})</div>
              {!!informe.temaComoRespaldo && (
                <div>Con artículo que no está vinculado a su tema (se vinculan también al tema): {informe.temaComoRespaldo}</div>
              )}
              <div>Ya existían y se han vinculado a algo nuevo: {informe.vinculadasExistentes} · ya existían tal cual: {informe.yaEstaban}</div>
              <div>Con errores (no importadas): {informe.errores.length}</div>
              <div>Artículos no encontrados: {informe.noEnlazadas.length}</div>
            </div>
            {informe.noEnlazadas.length > 0 && (
              <details style={{ marginTop: '8px' }}>
                <summary style={{ fontSize: '12px', color: '#92400e', cursor: 'pointer' }}>Artículos no encontrados ({informe.noEnlazadas.length})</summary>
                <div style={{ fontSize: '12px', color: '#6b7280', maxHeight: '220px', overflowY: 'auto', marginTop: '6px' }}>
                  {informe.noEnlazadas.map((n, i) => <div key={i}>Fila {n.fila}: {n.referencia} — {n.enunciado}</div>)}
                </div>
              </details>
            )}
            {informe.errores.length > 0 && (
              <details style={{ marginTop: '8px' }} open={informe.errores.length <= 20}>
                <summary style={{ fontSize: '12px', color: '#991b1b', cursor: 'pointer' }}>Errores ({informe.errores.length})</summary>
                <div style={{ fontSize: '12px', color: '#6b7280', maxHeight: '220px', overflowY: 'auto', marginTop: '6px' }}>
                  {informe.errores.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
