'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

const TIPOS = ['vf', 'hueco', 'trampa', 'articulo'];
const NIVELES = ['basico', 'medio', 'alto'];

export default function FlashcardsAdminPage() {
  const [tab, setTab] = useState<'importar' | 'manual'>('importar');
  const [jsonTexto, setJsonTexto] = useState('');
  const [resultado, setResultado] = useState<{ importadas: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);
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
    temaId: '',
    articuloId: '',
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
      const flashcards = JSON.parse(jsonTexto);
      if (!Array.isArray(flashcards)) throw new Error('El JSON debe ser un array');
      const res = await api.post('/flashcards/importar', { flashcards });
      setResultado(res.data);
      setJsonTexto('');
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
    await api.post('/flashcards/importar', {
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
    setGuardado(true);
    setForm({ tipo: 'vf', nivel: 'basico', pregunta: '', respuesta: '', explicacion: '', oposicionId: form.oposicionId, temaId: '', articuloId: '' });
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

  const EJEMPLO_JSON = JSON.stringify([
    {
      tipo: 'vf',
      nivel: 'basico',
      pregunta: 'El artículo 14 CE reconoce el principio de igualdad ante la ley',
      respuesta: 'true',
      explicacion: 'El artículo 14 CE establece que los españoles son iguales ante la ley',
      oposicionId: 'UUID-de-la-oposicion',
    },
    {
      tipo: 'hueco',
      nivel: 'medio',
      pregunta: 'El artículo 14 CE establece que los españoles son iguales ante la ___, sin discriminación',
      respuesta: 'ley',
      explicacion: 'La igualdad ante la ley es uno de los principios fundamentales',
      oposicionId: 'UUID-de-la-oposicion',
    },
    {
      tipo: 'articulo',
      nivel: 'medio',
      pregunta: '¿Qué artículo de la CE reconoce el principio de igualdad ante la ley?',
      respuesta: 'Artículo 14',
      oposicionId: 'UUID-de-la-oposicion',
    },
    {
      tipo: 'trampa',
      nivel: 'alto',
      pregunta: 'El artículo 14 CE reconoce la igualdad ante la ley SOLO para los ciudadanos españoles mayores de edad',
      respuesta: 'false',
      explicacion: 'El artículo 14 CE no limita la igualdad a mayores de edad',
      oposicionId: 'UUID-de-la-oposicion',
    },
  ], null, 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Flashcards</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Importa o crea flashcards para el repaso espaciado SM-2</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', background: 'white', padding: '0 1.5rem' }}>
        {[
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

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Resultado */}
          {resultado && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px' }}>
              <CheckCircle size={16} color="#15803d" />
              <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 500 }}>
                {resultado.importadas} flashcards importadas correctamente
              </span>
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
                      { tipo: 'hueco', desc: 'respuesta: palabra o frase a completar' },
                      { tipo: 'trampa', desc: 'respuesta: "true" si es trampa, "false" si no' },
                      { tipo: 'articulo', desc: 'respuesta: "Artículo X de la Y"' },
                    ].map(({ tipo, desc }) => (
                      <div key={tipo} style={{ padding: '8px 10px', background: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '2px' }}>{tipo.toUpperCase()}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{desc}</div>
                      </div>
                    ))}
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

              {/* Editor JSON */}
              <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>JSON a importar</span>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <textarea
                    value={jsonTexto}
                    onChange={(e) => setJsonTexto(e.target.value)}
                    placeholder='[{"tipo": "vf", "nivel": "basico", "pregunta": "...", "respuesta": "true", "oposicionId": "..."}]'
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