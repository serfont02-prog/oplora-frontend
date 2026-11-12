'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Upload, CheckCircle, AlertCircle, FileJson } from 'lucide-react';
import { BG_NEUTRAL } from '@/styles/tokens';
import GestionFlashcards from '@/components/admin/GestionFlashcards';

const TIPOS = ['vf', 'hueco', 'trampa', 'articulo', 'supuesto'];
const NIVELES = ['basico', 'medio', 'alto'];

export default function FlashcardsAdminPage() {
  const [tab, setTab] = useState<'gestionar' | 'importar' | 'manual'>('gestionar');
  const [jsonTexto, setJsonTexto] = useState('');
  const [resultado, setResultado] = useState<{
    importadas: number; enlazadas?: number; pendientesRevision?: number; errores?: string[]; sinVincular?: number;
    noEnlazadas?: { fila: number; pregunta: string; referencia: string }[];
    duplicadas?: { fila: number; pregunta: string }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);
  const [archivosCargados, setArchivosCargados] = useState<string[]>([]);
  const [arrastrandoArchivo, setArrastrandoArchivo] = useState(false);

  // ⭐ Cargar uno o varios .json desde el ordenador (también arrastrándolos al cuadro).
  // Si son varios, se juntan en una sola lista. El contenido queda en el cuadro por si se quiere revisar.
  const cargarArchivos = async (lista: FileList | null) => {
    const archivos = Array.from(lista ?? []).filter((f) => f.name.toLowerCase().endsWith('.json') || f.type === 'application/json');
    if (!archivos.length) { setError('Elige un archivo .json'); return; }
    setError(null);
    setResultado(null);
    try {
      const contenidos = await Promise.all(archivos.map(async (f) => {
        const datos = JSON.parse(await f.text());
        return Array.isArray(datos) ? datos : Array.isArray(datos?.flashcards) ? datos.flashcards : [datos];
      }));
      const todas = contenidos.flat();
      setJsonTexto(JSON.stringify(todas, null, 2));
      setArchivosCargados(archivos.map((f) => `${f.name} (${contenidos[archivos.indexOf(f)].length})`));
    } catch {
      setError('Algún archivo no es un JSON válido. Revisa que esté bien formado.');
    }
  };
  const [vinculacion, setVinculacion] = useState<'ninguna' | 'tema' | 'articulo'>('ninguna');
const [leyId, setLeyId] = useState('');
const [versionLeyId, setVersionLeyId] = useState('');
const [busquedaArticulo, setBusquedaArticulo] = useState('');
const [articuloSeleccionado, setArticuloSeleccionado] = useState<any>(null);
const [temaOposicionId, setTemaOposicionId] = useState('');
const [temaConvocatoriaId, setTemaConvocatoriaId] = useState('');
const [temaSeleccionado, setTemaSeleccionado] = useState<any>(null);

  // Manual
  const [form, setForm] = useState({
    tipo: 'vf',
    nivel: 'basico',
    pregunta: '',
    respuesta: '',
    explicacion: '',
    oposicionId: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const { data: leyes = [] } = useQuery({
  queryKey: ['leyes-admin'],
  queryFn: async () => {
    const res = await api.get('/leyes');
    return res.data;
  },
  enabled: vinculacion === 'articulo',
});

const { data: versiones = [] } = useQuery({
  queryKey: ['versiones-ley', leyId],
  queryFn: async () => {
    const res = await api.get(`/leyes/${leyId}/versiones`);
    return res.data;
  },
  enabled: !!leyId && vinculacion === 'articulo',
});

const { data: articulosBusqueda = [] } = useQuery({
  queryKey: ['articulos-busqueda', versionLeyId, busquedaArticulo],
  queryFn: async () => {
    const res = await api.get(`/normativa/buscar/${versionLeyId}?q=${busquedaArticulo}`);
    return res.data;
  },
  enabled: !!versionLeyId && busquedaArticulo.length > 1,
});

// Al cargar temas usa form.oposicionId si está seleccionado:
const { data: convocatoriasTema = [] } = useQuery({
  queryKey: ['convocatorias-tema-fc', temaOposicionId || form.oposicionId],
  queryFn: async () => {
    const id = temaOposicionId || form.oposicionId;
    const res = await api.get(`/convocatorias/oposicion/${id}`);
    return res.data;
  },
  enabled: !!(temaOposicionId || form.oposicionId) && vinculacion === 'tema',
});

const convocatoriaTema = convocatoriasTema.find((c: any) => c.estado === 'activa') ?? convocatoriasTema[0];

const { data: temasList = [] } = useQuery({
  queryKey: ['temas-fc-admin', temaConvocatoriaId],
  queryFn: async () => {
    const res = await api.get(`/temas/convocatoria/${temaConvocatoriaId}`);
    return res.data;
  },
  enabled: !!temaConvocatoriaId && vinculacion === 'tema',
});

  const { data: oposiciones = [] } = useQuery({
    queryKey: ['oposiciones-admin'],
    queryFn: async () => {
      const res = await api.get('/oposiciones');
      return res.data;
    },
  });

  const importarJSON = async () => {
    setError(null);
    setResultado(null);
    setImportando(true);
    try {
      const datos = JSON.parse(jsonTexto);
      // ⭐ Se acepta la lista sola o el formato estándar { "flashcards": [ ... ] }
      const flashcardsBrutas = Array.isArray(datos) ? datos : Array.isArray(datos?.flashcards) ? datos.flashcards : null;
      if (!flashcardsBrutas) throw new Error('El JSON debe ser una lista o { "flashcards": [ ... ] }');
      // ⭐ Antes se enviaba el JSON tal cual se pegaba, y esta pestaña ("Importar JSON") no
      // tenía ningún selector de tema/artículo ni lo mencionaba en el ejemplo — es la vía real
      // por la que se suben lotes grandes de flashcards, así que si el JSON pegado no traía su
      // propio "temaId"/"articuloId" (lo normal, porque nada de esta pantalla lo sugería), las
      // flashcards se guardaban SIN vincular a ningún tema. El backend (POST /flashcards/importar
      // -> FlashcardService.importar) sí soporta "temaId"/"articuloId"/"oposicionId" por
      // flashcard, así que el problema era solo de esta pantalla. Ahora se usa el mismo selector
      // "Vincular a" (Tema / Artículo) que ya existía para "Crear manual" como valor por defecto
      // para todo el lote: cada flashcard se completa con la vinculación elegida arriba SOLO si
      // ella misma no trae ya su propio temaId/articuloId/oposicionId (para no pisar un JSON que
      // ya venga con vinculación por pregunta, p.ej. un lote con preguntas de varios temas).
      const flashcards = flashcardsBrutas.map((fc: any) => ({
        ...fc,
        oposicionId: fc.oposicionId ?? form.oposicionId ?? undefined,
        temaId: fc.temaId ?? (vinculacion === 'tema' ? temaSeleccionado?.id : undefined) ?? undefined,
        articuloId: fc.articuloId ?? (vinculacion === 'articulo' ? articuloSeleccionado?.id : undefined) ?? undefined,
      }));
      // ⭐ El backend ahora valida fila a fila (tipo/nivel válidos, pregunta/respuesta no
      // vacías, "true"/"false" para vf y trampa) y detecta duplicados dentro del lote y contra
      // el banco existente, siguiendo con el resto de filas en vez de abortar todo el import
      // por una sola fila mala — devuelve {importadas, errores, sinVincular}.
      const res = await api.post('/flashcards/importar', { flashcards });
      setResultado(res.data);
      if (!res.data?.errores?.length) { setJsonTexto(''); setArchivosCargados([]); }
    } catch (e: any) {
      setError(e.message ?? 'Error al importar');
    } finally {
      setImportando(false);
    }
  };

const guardarManual = async () => {
  if (!form.pregunta || !form.respuesta) {
    setError('Pregunta y respuesta son obligatorias');
    return;
  }
  setGuardando(true);
  setError(null);
  try {
    const res = await api.post('/flashcards/importar', {
      flashcards: [{
        tipo: form.tipo,
        nivel: form.nivel,
        pregunta: form.pregunta,
        respuesta: form.respuesta,
        explicacion: form.explicacion || undefined,
        oposicionId: form.oposicionId || undefined,
        temaId: temaSeleccionado?.id || undefined,        // ⭐
        articuloId: articuloSeleccionado?.id || undefined, // ⭐
      }],
    });
    // ⭐ La importación no falla entera por una fila: hay que mirar si esta se ha guardado
    if (!res.data?.importadas) {
      const motivo = res.data?.errores?.[0]?.replace(/^Fila 1: /, '')
        ?? (res.data?.duplicadas?.length ? 'Ya existe una flashcard con esa pregunta en la oposición' : 'No se ha guardado');
      setError(motivo);
      return;
    }
    setGuardado(true);
    setForm({ tipo: 'vf', nivel: 'basico', pregunta: '', respuesta: '', explicacion: '', oposicionId: form.oposicionId });
    setTemaSeleccionado(null);
    setArticuloSeleccionado(null);
    setBusquedaArticulo('');
    setTimeout(() => setGuardado(false), 2000);
  } catch (e: any) {
    setError(e.message ?? 'Error al guardar');
  } finally {
    setGuardando(false);
  }
};

  // ⭐ Formato estándar (nov 2026). La oposición y el tema pueden venir en cada fila o elegirse
  // arriba para todo el lote. "tema" es el NÚMERO del tema en la convocatoria activa.
  const EJEMPLO_JSON = JSON.stringify({ flashcards: [
    {
      tipo: 'vf', nivel: 'basico', tema: 1, bloque: 'Nacionalidad',
      pregunta: 'Para adquirir la nacionalidad por residencia se exige, como regla general, residencia legal de diez años.',
      respuesta: 'true',
      explicacion: 'Regla general del art. 22.1 CC; hay plazos más cortos para algunos casos.',
      norma: 'CC', articulo: '22', apartado: '1', fechaReferencia: '2026-11-12',
      fuenteValidacion: 'BOE-A-1889-4763 (consolidado)', fechaRevision: '2026-11-12',
    },
    {
      tipo: 'hueco', nivel: 'medio', tema: 1,
      pregunta: 'Los españoles son iguales ante la ___ (art. 14 CE).',
      respuesta: 'ley', norma: 'CE', articulo: '14',
    },
    {
      tipo: 'supuesto', nivel: 'alto', tema: 1,
      pregunta: 'Ana nace en Madrid de padres extranjeros nacidos fuera de España. ¿Es española de origen?',
      respuesta: 'No, salvo que ninguno de los padres le atribuya nacionalidad (apatridia).',
      norma: 'CC', articulo: '17', apartado: '1.c',
    },
    {
      tipo: 'comparativa', nivel: 'medio', tema: 1,
      pregunta: 'Nacionalidad de origen frente a nacionalidad derivativa',
      respuesta: 'La de origen no se puede perder por privación; la derivativa sí.',
      comparativa: { conceptoA: 'De origen', conceptoB: 'Derivativa', diferencias: [
        { aspecto: 'Cómo se adquiere', a: 'Por filiación o nacimiento', b: 'Residencia, opción o carta' },
        { aspecto: 'Privación', a: 'No (art. 11.2 CE)', b: 'Sí, en los casos del art. 25 CC' },
      ] },
    },
  ] }, null, 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Flashcards</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Busca, corrige, importa o crea flashcards para el repaso espaciado SM-2</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', background: 'white', padding: '0 1.5rem' }}>
        {[
          { key: 'gestionar', label: 'Gestionar' },
          { key: 'importar', label: 'Importar JSON' },
          { key: 'manual', label: 'Crear manual' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            style={{
              padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: tab === key ? 600 : 400,
              color: tab === key ? '#111827' : '#9ca3af',
              borderBottom: tab === key ? '2px solid #111827' : '2px solid transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: BG_NEUTRAL }}>
        <div style={{ maxWidth: tab === 'gestionar' ? '1000px' : '720px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* TAB: Gestionar (buscar, corregir, activar/desactivar y borrar) */}
          {tab === 'gestionar' && <GestionFlashcards />}

          {/* Resultado de la importación */}
          {resultado && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {[
                  { n: resultado.importadas, t: 'importadas', c: '#15803d', bg: '#f0fdf4', b: '#86efac' },
                  { n: resultado.enlazadas ?? 0, t: 'enlazadas a su artículo', c: '#1d4ed8', bg: '#eff6ff', b: '#bfdbfe' },
                  { n: resultado.noEnlazadas?.length ?? 0, t: 'sin enlazar (pendientes)', c: '#b45309', bg: '#fffbeb', b: '#fde68a' },
                  { n: resultado.duplicadas?.length ?? 0, t: 'duplicadas (no se suben)', c: '#6b7280', bg: '#f9fafb', b: '#e5e7eb' },
                  { n: resultado.errores?.length ?? 0, t: 'con errores', c: '#dc2626', bg: '#fef2f2', b: '#fca5a5' },
                ].map(({ n, t, c, bg, b }) => (
                  <div key={t} style={{ padding: '10px 12px', background: bg, border: `1px solid ${b}`, borderRadius: '10px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: c }}>{n.toLocaleString('es-ES')}</div>
                    <div style={{ fontSize: '11px', color: c }}>{t}</div>
                  </div>
                ))}
              </div>
              {!!resultado.pendientesRevision && (
                <div style={{ fontSize: '12px', color: '#92400e', padding: '8px 12px', background: '#fffbeb', borderRadius: '8px' }}>
                  {resultado.pendientesRevision} quedan como <strong>pendientes de revisión</strong> y no saldrán en la app hasta que las valides en «Gestionar».
                </div>
              )}
              {[
                { titulo: 'Sin enlazar a su artículo (revisa la norma o el número)', filas: (resultado.noEnlazadas ?? []).map((x) => `Fila ${x.fila} · ${x.referencia} · ${x.pregunta}`), color: '#92400e', bg: '#fffbeb', borde: '#fde68a' },
                { titulo: 'Duplicadas: ya existen en la oposición', filas: (resultado.duplicadas ?? []).map((x) => `Fila ${x.fila} · ${x.pregunta}`), color: '#4b5563', bg: '#f9fafb', borde: '#e5e7eb' },
                { titulo: 'Errores (estas filas no se han subido)', filas: resultado.errores ?? [], color: '#991b1b', bg: '#fef2f2', borde: '#fca5a5' },
              ].filter((g) => g.filas.length).map((g) => (
                <div key={g.titulo} style={{ padding: '10px 14px', background: g.bg, border: `1px solid ${g.borde}`, borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: g.color, marginBottom: '6px' }}>{g.titulo} ({g.filas.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '200px', overflowY: 'auto' }}>
                    {g.filas.map((f, i) => <div key={i} style={{ fontSize: '12px', color: g.color }}>{f}</div>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px' }}>
              <AlertCircle size={16} color="#dc2626" />
              <span style={{ fontSize: '13px', color: '#dc2626' }}>{error}</span>
            </div>
          )}

          {/* TAB: Importar JSON */}
          {tab === 'importar' && (
            <>
              {/* Ejemplo */}
              <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Formato JSON</span>
                  <button
                    onClick={() => setJsonTexto(EJEMPLO_JSON)}
                    style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: '#6b7280' }}
                  >
                    Cargar ejemplo
                  </button>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                    Campos disponibles por tipo:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {[
                      { tipo: 'vf', desc: 'respuesta: "true" o "false"' },
                      { tipo: 'trampa', desc: 'respuesta: "true" o "false" (la afirmación puede ser verdadera)' },
                      { tipo: 'hueco', desc: 'la pregunta lleva ___ ; respuesta: lo que falta' },
                      { tipo: 'articulo', desc: 'respuesta: "Artículo X de la Y"' },
                      { tipo: 'supuesto', desc: 'caso práctico; respuesta: la solución breve' },
                      { tipo: 'comparativa', desc: '"comparativa": { conceptoA, conceptoB, diferencias: [{ aspecto, a, b }] }' },
                    ].map(({ tipo, desc }) => (
                      <div key={tipo} style={{ padding: '8px 10px', background: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '2px' }}>{tipo.toUpperCase()}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{desc}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '10px', lineHeight: 1.5 }}>
                    Cada flashcard necesita su <strong>oposición</strong> (en la fila o elegida en «Vincular este lote a»). El tema va con <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: '4px' }}>tema</code> (número) o <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: '4px' }}>temaId</code>.
                    Con <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: '4px' }}>norma</code> (siglas) y <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: '4px' }}>articulo</code> se enlaza sola al artículo de la versión vigente; si no se encuentra, queda <strong>pendiente de revisión</strong>.
                    Las que entran bien quedan <strong>validadas</strong> (salvo que indiques otro <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: '4px' }}>estado</code>).
                  </div>
                </div>
              </div>

              {/* IDs de oposiciones */}
              {oposiciones.length > 0 && (
                <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>IDs de oposiciones</span>
                  </div>
                  <div style={{ padding: '8px' }}>
                    {oposiciones.map((op: any) => (
                      <div key={op.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#374151' }}>{op.nombre}</span>
                        <code
                          onClick={() => navigator.clipboard.writeText(op.id)}
                          style={{ fontSize: '11px', color: '#6b7280', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}
                          title="Click para copiar"
                        >
                          {op.id}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ⭐ Vincular el LOTE a tema/artículo (ver comentario en importarJSON): antes esta
                  pestaña no tenía forma de indicar a qué tema pertenecían las flashcards
                  pegadas, así que se guardaban sin vincular salvo que el propio JSON ya trajera
                  "temaId"/"articuloId" en cada objeto (raro, porque el ejemplo tampoco lo
                  mostraba). Se reutiliza el mismo selector "Vincular a" de la pestaña "Crear
                  manual": lo elegido aquí se aplica como valor por defecto a TODAS las
                  flashcards del JSON que no traigan ya su propio temaId/articuloId. */}
              <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Vincular este lote a (opcional)</span>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Oposición</label>
                    <select
                      value={form.oposicionId}
                      onChange={(e) => setForm(f => ({ ...f, oposicionId: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151' }}
                    >
                      <option value="">Elige la oposición (o indícala en cada fila)</option>
                      {oposiciones.map((op: any) => (
                        <option key={op.id} value={op.id}>{op.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                      Vincular a
                    </label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      {[
                        { key: 'ninguna', label: 'Sin vincular' },
                        { key: 'tema', label: 'Tema' },
                        { key: 'articulo', label: 'Artículo' },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => {
                            setVinculacion(key as any);
                            setTemaSeleccionado(null);
                            setArticuloSeleccionado(null);
                            setBusquedaArticulo('');
                          }}
                          style={{
                            padding: '6px 14px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer',
                            border: vinculacion === key ? 'none' : '1px solid #e5e7eb',
                            background: vinculacion === key ? '#0f172a' : 'white',
                            color: vinculacion === key ? 'white' : '#374151',
                            fontWeight: vinculacion === key ? 600 : 400,
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {vinculacion === 'tema' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: '#f9fafb', borderRadius: '10px' }}>
                        {form.oposicionId ? (
                          <div style={{ fontSize: '12px', color: '#6b7280', padding: '6px 8px', background: '#EFF6FF', borderRadius: '8px' }}>
                            Usando oposición seleccionada arriba
                          </div>
                        ) : (
                          <select
                            value={temaOposicionId}
                            onChange={(e) => {
                              setTemaOposicionId(e.target.value);
                              setTemaConvocatoriaId('');
                              setTemaSeleccionado(null);
                            }}
                            style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151' }}
                          >
                            <option value="">Selecciona oposición</option>
                            {oposiciones.map((op: any) => (
                              <option key={op.id} value={op.id}>{op.nombre}</option>
                            ))}
                          </select>
                        )}

                        {convocatoriaTema && !temaConvocatoriaId && (
                          <button
                            onClick={() => setTemaConvocatoriaId(convocatoriaTema.id)}
                            style={{ padding: '8px', background: '#EFF6FF', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '12px', color: '#185FA5', cursor: 'pointer' }}
                          >
                            Cargar temas de convocatoria {convocatoriaTema.anyo}
                          </button>
                        )}

                        {temasList.length > 0 && (
                          <select
                            value={temaSeleccionado?.id ?? ''}
                            onChange={(e) => {
                              const tema = temasList.find((t: any) => t.id === e.target.value);
                              setTemaSeleccionado(tema ?? null);
                            }}
                            style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151' }}
                          >
                            <option value="">Selecciona tema</option>
                            {temasList.map((t: any) => (
                              <option key={t.id} value={t.id}>T{t.numero} — {t.titulo}</option>
                            ))}
                          </select>
                        )}

                        {temaSeleccionado && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 500 }}>
                              ✓ T{temaSeleccionado.numero} — {temaSeleccionado.titulo} · se aplicará a todas las preguntas del JSON que no traigan su propio temaId
                            </span>
                            <button onClick={() => setTemaSeleccionado(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '14px' }}>×</button>
                          </div>
                        )}
                      </div>
                    )}

                    {vinculacion === 'articulo' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: '#f9fafb', borderRadius: '10px' }}>
                        <select
                          value={leyId}
                          onChange={(e) => { setLeyId(e.target.value); setVersionLeyId(''); setArticuloSeleccionado(null); }}
                          style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151' }}
                        >
                          <option value="">Selecciona ley</option>
                          {leyes.map((l: any) => (
                            <option key={l.id} value={l.id}>{l.nombre}</option>
                          ))}
                        </select>

                        {versiones.length > 0 && (
                          <select
                            value={versionLeyId}
                            onChange={(e) => { setVersionLeyId(e.target.value); setArticuloSeleccionado(null); }}
                            style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151' }}
                          >
                            <option value="">Selecciona versión</option>
                            {versiones.map((v: any) => (
                              <option key={v.id} value={v.id}>{v.nombre ?? `Versión ${v.anyo}`}</option>
                            ))}
                          </select>
                        )}

                        {versionLeyId && (
                          <input
                            type="text"
                            placeholder="Buscar artículo (número o título)..."
                            value={busquedaArticulo}
                            onChange={(e) => { setBusquedaArticulo(e.target.value); setArticuloSeleccionado(null); }}
                            style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151', boxSizing: 'border-box' }}
                          />
                        )}

                        {articulosBusqueda.length > 0 && !articuloSeleccionado && (
                          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', maxHeight: '200px', overflowY: 'auto' }}>
                            {articulosBusqueda.map((art: any) => (
                              <div
                                key={art.id}
                                onClick={() => { setArticuloSeleccionado(art); setBusquedaArticulo(''); }}
                                style={{ padding: '8px 12px', fontSize: '12px', color: '#374151', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', background: 'white' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                              >
                                <span style={{ fontWeight: 600 }}>Art. {art.numero}</span>
                                {art.titulo && <span style={{ color: '#9ca3af' }}> — {art.titulo}</span>}
                              </div>
                            ))}
                          </div>
                        )}

                        {articuloSeleccionado && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 500 }}>
                              ✓ Art. {articuloSeleccionado.numero}{articuloSeleccionado.titulo ? ` — ${articuloSeleccionado.titulo}` : ''} · se aplicará a todas las preguntas del JSON que no traigan su propio articuloId
                            </span>
                            <button onClick={() => setArticuloSeleccionado(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '14px' }}>×</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Editor JSON */}
              <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', flex: 1 }}>JSON a importar</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer', background: '#f9fafb' }}>
                    <FileJson size={14} /> Subir archivo .json
                    <input
                      type="file"
                      accept=".json,application/json"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => { cargarArchivos(e.target.files); e.target.value = ''; }}
                    />
                  </label>
                </div>
                <div
                  style={{ padding: '12px 16px', outline: arrastrandoArchivo ? '2px dashed #3b82f6' : 'none', outlineOffset: '-6px' }}
                  onDragOver={(e) => { e.preventDefault(); setArrastrandoArchivo(true); }}
                  onDragLeave={() => setArrastrandoArchivo(false)}
                  onDrop={(e) => { e.preventDefault(); setArrastrandoArchivo(false); cargarArchivos(e.dataTransfer.files); }}
                >
                  {archivosCargados.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#1d4ed8', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '7px 10px', marginBottom: '10px' }}>
                      Cargado: {archivosCargados.join(' · ')}
                    </div>
                  )}
                  <textarea
                    value={jsonTexto}
                    onChange={(e) => { setJsonTexto(e.target.value); setArchivosCargados([]); }}
                    placeholder={'Sube un archivo, arrástralo aquí o pega el JSON:\n[{"tipo": "vf", "nivel": "basico", "pregunta": "...", "respuesta": "true", "oposicionId": "..."}]'}
                    style={{
                      width: '100%', minHeight: '300px', padding: '12px',
                      fontSize: '12px', fontFamily: 'monospace',
                      border: '1px solid #e5e7eb', borderRadius: '8px',
                      outline: 'none', resize: 'vertical',
                      color: '#374151', lineHeight: 1.6,
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={importarJSON}
                    disabled={!jsonTexto.trim() || importando}
                    style={{
                      marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '10px 16px', background: jsonTexto.trim() ? '#111827' : '#e5e7eb',
                      color: jsonTexto.trim() ? 'white' : '#9ca3af',
                      border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500,
                      cursor: jsonTexto.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <Upload size={14} />
                    {importando ? 'Importando...' : 'Importar flashcards'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* TAB: Crear manual */}
          {tab === 'manual' && (
            <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Nueva flashcard</span>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Tipo y nivel */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Tipo</label>
                    <select
                      value={form.tipo}
                      onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151' }}
                    >
                      {TIPOS.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Nivel</label>
                    <select
                      value={form.nivel}
                      onChange={(e) => setForm(f => ({ ...f, nivel: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151' }}
                    >
                      {NIVELES.map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
                    </select>
                  </div>
                </div>

                {/* Oposición */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Oposición</label>
                  <select
                    value={form.oposicionId}
                    onChange={(e) => setForm(f => ({ ...f, oposicionId: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151' }}
                  >
                    <option value="">Sin oposición</option>
                    {oposiciones.map((op: any) => (
                      <option key={op.id} value={op.id}>{op.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Vinculación */}
<div>
  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>
    Vincular a
  </label>
  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
    {[
      { key: 'ninguna', label: 'Sin vincular' },
      { key: 'tema', label: 'Tema' },
      { key: 'articulo', label: 'Artículo' },
    ].map(({ key, label }) => (
      <button
        key={key}
        onClick={() => {
          setVinculacion(key as any);
          setTemaSeleccionado(null);
          setArticuloSeleccionado(null);
          setBusquedaArticulo('');
        }}
        style={{
          padding: '6px 14px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer',
          border: vinculacion === key ? 'none' : '1px solid #e5e7eb',
          background: vinculacion === key ? '#0f172a' : 'white',
          color: vinculacion === key ? 'white' : '#374151',
          fontWeight: vinculacion === key ? 600 : 400,
        }}
      >
        {label}
      </button>
    ))}
  </div>

  {/* Vinculación por TEMA */}
  {vinculacion === 'tema' && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: '#f9fafb', borderRadius: '10px' }}>
      
        {/* Si ya hay oposición seleccionada arriba, usarla directamente */}
      {form.oposicionId ? (
  <div
    style={{
      fontSize: '12px',
      color: '#6b7280',
      padding: '6px 8px',
      background: '#EFF6FF',
      borderRadius: '8px',
    }}
  >
    Usando oposición seleccionada arriba
  </div>
) : (
  <>
    <select
      value={temaOposicionId}
      onChange={(e) => {
        setTemaOposicionId(e.target.value);
        setTemaConvocatoriaId('');
        setTemaSeleccionado(null);
      }}
      style={{
        width: '100%',
        padding: '8px 10px',
        fontSize: '13px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        outline: 'none',
        color: '#374151',
      }}
    >
      <option value="">Selecciona oposición</option>
      {oposiciones.map((op: any) => (
        <option key={op.id} value={op.id}>
          {op.nombre}
        </option>
      ))}
    </select>

    {/* convocatoria */}

    {/* lista de temas */}

    {/* tema seleccionado */}
  </>
)}

      {convocatoriaTema && !temaConvocatoriaId && (
        <button
          onClick={() => setTemaConvocatoriaId(convocatoriaTema.id)}
          style={{ padding: '8px', background: '#EFF6FF', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '12px', color: '#185FA5', cursor: 'pointer' }}
        >
          Cargar temas de convocatoria {convocatoriaTema.anyo}
        </button>
      )}

      {temasList.length > 0 && (
        <select
          value={temaSeleccionado?.id ?? ''}
          onChange={(e) => {
            const tema = temasList.find((t: any) => t.id === e.target.value);
            setTemaSeleccionado(tema ?? null);
          }}
          style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151' }}
        >
          <option value="">Selecciona tema</option>
          {temasList.map((t: any) => (
            <option key={t.id} value={t.id}>T{t.numero} — {t.titulo}</option>
          ))}
        </select>
      )}

      {temaSeleccionado && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px' }}>
          <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 500 }}>
            ✓ T{temaSeleccionado.numero} — {temaSeleccionado.titulo}
          </span>
          <button onClick={() => setTemaSeleccionado(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '14px' }}>×</button>
        </div>
      )}
    </div>
  )}

                  {/* Vinculación por ARTÍCULO */}
                  {vinculacion === 'articulo' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: '#f9fafb', borderRadius: '10px' }}>
                      <select
                        value={leyId}
                        onChange={(e) => { setLeyId(e.target.value); setVersionLeyId(''); setArticuloSeleccionado(null); }}
                        style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151' }}
                      >
                        <option value="">Selecciona ley</option>
                        {leyes.map((l: any) => (
                          <option key={l.id} value={l.id}>{l.nombre}</option>
                        ))}
                      </select>

                      {versiones.length > 0 && (
                        <select
                          value={versionLeyId}
                          onChange={(e) => { setVersionLeyId(e.target.value); setArticuloSeleccionado(null); }}
                          style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151' }}
                        >
                          <option value="">Selecciona versión</option>
                          {versiones.map((v: any) => (
                            <option key={v.id} value={v.id}>{v.nombre ?? `Versión ${v.anyo}`}</option>
                          ))}
                        </select>
                      )}

                      {versionLeyId && (
                        <input
                          type="text"
                          placeholder="Buscar artículo (número o título)..."
                          value={busquedaArticulo}
                          onChange={(e) => { setBusquedaArticulo(e.target.value); setArticuloSeleccionado(null); }}
                          style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151', boxSizing: 'border-box' }}
                        />
                      )}

                      {articulosBusqueda.length > 0 && !articuloSeleccionado && (
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', maxHeight: '200px', overflowY: 'auto' }}>
                          {articulosBusqueda.map((art: any) => (
                            <div
                              key={art.id}
                              onClick={() => { setArticuloSeleccionado(art); setBusquedaArticulo(''); }}
                              style={{ padding: '8px 12px', fontSize: '12px', color: '#374151', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', background: 'white' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                            >
                              <span style={{ fontWeight: 600 }}>Art. {art.numero}</span>
                              {art.titulo && <span style={{ color: '#9ca3af' }}> — {art.titulo}</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {articuloSeleccionado && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 500 }}>
                            ✓ Art. {articuloSeleccionado.numero}{articuloSeleccionado.titulo ? ` — ${articuloSeleccionado.titulo}` : ''}
                          </span>
                          <button onClick={() => setArticuloSeleccionado(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '14px' }}>×</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Pregunta */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                    Pregunta
                    {form.tipo === 'hueco' && <span style={{ color: '#9ca3af', fontWeight: 400 }}> · usa ___ para el hueco</span>}
                  </label>
                  <textarea
                    value={form.pregunta}
                    onChange={(e) => setForm(f => ({ ...f, pregunta: e.target.value }))}
                    placeholder={
                      form.tipo === 'vf' ? 'El artículo 14 CE reconoce el principio de igualdad...' :
                      form.tipo === 'hueco' ? 'El artículo 14 CE establece que los españoles son iguales ante la ___' :
                      form.tipo === 'trampa' ? 'El artículo 14 CE limita la igualdad a los mayores de edad...' :
                      '¿Qué artículo regula el principio de igualdad ante la ley?'
                    }
                    style={{ width: '100%', minHeight: '80px', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', resize: 'vertical', color: '#374151', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Respuesta */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                    Respuesta
                    {form.tipo === 'vf' && <span style={{ color: '#9ca3af', fontWeight: 400 }}> · escribe "true" o "false"</span>}
                    {form.tipo === 'trampa' && <span style={{ color: '#9ca3af', fontWeight: 400 }}> · "true" si es trampa, "false" si no</span>}
                  </label>
                  {form.tipo === 'vf' || form.tipo === 'trampa' ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['true', 'false'].map(v => (
                        <button
                          key={v}
                          onClick={() => setForm(f => ({ ...f, respuesta: v }))}
                          style={{
                            flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                            background: form.respuesta === v
                              ? (v === 'true' ? '#f0fdf4' : '#fef2f2')
                              : '#f9fafb',
                            color: form.respuesta === v
                              ? (v === 'true' ? '#15803d' : '#dc2626')
                              : '#9ca3af',
                            fontWeight: form.respuesta === v ? 600 : 400,
                            fontSize: '13px',
                            border: form.respuesta === v
                              ? `1.5px solid ${v === 'true' ? '#86efac' : '#fca5a5'}`
                              : '1.5px solid #e5e7eb',
                          }}
                        >
                          {v === 'true'
                            ? (form.tipo === 'trampa' ? '🪤 Es trampa' : '✅ Verdadero')
                            : (form.tipo === 'trampa' ? '✅ No es trampa' : '❌ Falso')}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={form.respuesta}
                      onChange={(e) => setForm(f => ({ ...f, respuesta: e.target.value }))}
                      placeholder={form.tipo === 'hueco' ? 'ley' : 'Artículo 14 de la CE'}
                      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151', boxSizing: 'border-box' }}
                    />
                  )}
                </div>

                {/* Explicación */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                    Explicación <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span>
                  </label>
                  <textarea
                    value={form.explicacion}
                    onChange={(e) => setForm(f => ({ ...f, explicacion: e.target.value }))}
                    placeholder="Explicación adicional que verá el usuario tras responder..."
                    style={{ width: '100%', minHeight: '60px', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', resize: 'vertical', color: '#374151', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  onClick={guardarManual}
                  disabled={guardando || !form.pregunta || !form.respuesta}
                  style={{
                    padding: '11px 16px', background: form.pregunta && form.respuesta ? '#111827' : '#e5e7eb',
                    color: form.pregunta && form.respuesta ? 'white' : '#9ca3af',
                    border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500,
                    cursor: form.pregunta && form.respuesta ? 'pointer' : 'not-allowed',
                    alignSelf: 'flex-start',
                  }}
                >
                  {guardado ? '✓ Guardada' : guardando ? 'Guardando...' : 'Guardar flashcard'}
                </button>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}