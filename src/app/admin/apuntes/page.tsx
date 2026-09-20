'use client';

import { useState, type CSSProperties } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Upload, Trash2, FileText, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

const TITULO_MARCADOR: Record<string, string> = {
  EJEMPLO: 'Ejemplos',
  IDEA: 'Ideas clave',
  ESQUEMA: 'Esquemas',
  'TRAMPA DE EXAMEN': 'Trampas de examen',
  'REGLA DE EXAMEN': 'Reglas de examen',
  'PREGUNTA FRECUENTE': 'Preguntas frecuentes',
};

function contarMarcadores(bloques: any[] = []): Record<string, number> {
  const contadores: Record<string, number> = {};
  for (const b of bloques) {
    if (b?.tipo === 'destacado') {
      contadores[b.titulo] = (contadores[b.titulo] || 0) + 1;
      // los marcadores no se anidan entre sí, pero por si acaso:
      Object.assign(contadores, contarMarcadores(b.contenido));
    }
  }
  return contadores;
}

function contarReferenciasArticulo(texto?: string | null): number {
  if (!texto) return 0;
  const m = texto.match(/\[[A-ZÁÉÍÓÚÑ]+\s+art[íi]culo\s+[\d.]+\]/gi);
  return m ? m.length : 0;
}

export default function ApuntesAdminPage() {
  const [oposicionId, setOposicionId] = useState('');
  const [vinculacion, setVinculacion] = useState<'tema' | 'oposicion'>('tema');
  const [temaId, setTemaId] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [orden, setOrden] = useState('0');
  const [subiendo, setSubiendo] = useState(false);
  const [resultado, setResultado] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [temaExpandido, setTemaExpandido] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: oposiciones = [] } = useQuery({
    queryKey: ['oposiciones-admin'],
    queryFn: async () => {
      const res = await api.get('/oposiciones');
      return res.data;
    },
  });

  // Se cargan automáticamente en cuanto hay oposición seleccionada — sin
  // botón intermedio: la convocatoria activa (o la primera disponible) se
  // usa directamente para listar sus temas.
  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias-apuntes', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId && vinculacion === 'tema',
  });

  const convocatoria = convocatorias.find((c: any) => c.estado === 'activa') ?? convocatorias[0];

  const { data: temas = [] } = useQuery({
    queryKey: ['temas-apuntes', convocatoria?.id],
    queryFn: async () => {
      const res = await api.get(`/temas/convocatoria/${convocatoria.id}`);
      return res.data;
    },
    enabled: !!convocatoria?.id && vinculacion === 'tema',
  });

  const { data: apuntesDelTema = [] } = useQuery({
    queryKey: ['apuntes-oplora-tema', temaExpandido],
    queryFn: async () => {
      const res = await api.get(`/apuntes-oplora/tema/${temaExpandido}`);
      return res.data;
    },
    enabled: !!temaExpandido,
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/apuntes-oplora/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apuntes-oplora-tema', temaExpandido] });
    },
  });

  const subir = async () => {
    if (!archivo || !titulo || !oposicionId) {
      setError('Selecciona una oposición, un archivo y escribe un título');
      return;
    }
    if (vinculacion === 'tema' && !temaId) {
      setError('Selecciona un tema o cambia a "General de la oposición"');
      return;
    }
    setSubiendo(true);
    setError(null);
    setResultado(null);
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('titulo', titulo);
      formData.append('descripcion', descripcion);
      formData.append('orden', orden);

      const endpoint = vinculacion === 'tema'
        ? `/apuntes-oplora/tema/${temaId}`
        : `/apuntes-oplora/oposicion/${oposicionId}`;

      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const apunteSubido = res.data;
      const marcadores = contarMarcadores(apunteSubido?.contenidoEstructurado?.bloques ?? []);
      const referencias = contarReferenciasArticulo(apunteSubido?.textoCompleto);

      setResultado({
        titulo: apunteSubido?.titulo ?? titulo,
        marcadores,
        referencias,
        esPdf: apunteSubido?.tipo === 'pdf',
      });
      setArchivo(null);
      setTitulo('');
      setDescripcion('');
      setOrden('0');
      if (vinculacion === 'tema') {
        queryClient.invalidateQueries({ queryKey: ['apuntes-oplora-tema', temaId] });
        if (temaExpandido !== temaId) setTemaExpandido(temaId);
      }
    } catch (e: any) {
      setError(e.response?.data?.message ?? e.message ?? 'Error al subir el archivo');
    } finally {
      setSubiendo(false);
    }
  };

  const pasoOposicionListo = !!oposicionId;
  const pasoDestinoListo = vinculacion === 'oposicion' || !!temaId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Apuntes OPLORA</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Sube apuntes oficiales por tema o generales de la oposición</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Resultado de la última subida: resumen de lo detectado por el parser */}
          {resultado && (
            <div style={{ padding: '14px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={16} color="#15803d" />
                <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 600 }}>
                  &ldquo;{resultado.titulo}&rdquo; subido correctamente
                </span>
              </div>
              {resultado.esPdf ? (
                Object.keys(resultado.marcadores).length === 0 && resultado.referencias === 0 ? (
                  <div style={{ fontSize: '12px', color: '#6b7280', paddingLeft: '26px' }}>
                    No se han detectado marcadores [EJ/ID/ES/TR/RE/PR] ni referencias a artículos en este documento.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingLeft: '26px' }}>
                    {Object.entries(resultado.marcadores).map(([tit, n]) => (
                      <span key={tit} style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '999px', background: 'white', border: '1px solid #bbf7d0', color: '#15803d', fontWeight: 500 }}>
                        {TITULO_MARCADOR[tit] ?? tit}: {n as number}
                      </span>
                    ))}
                    {resultado.referencias > 0 && (
                      <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '999px', background: 'white', border: '1px solid #bfdbfe', color: '#185FA5', fontWeight: 500 }}>
                        Enlaces a artículos: {resultado.referencias}
                      </span>
                    )}
                  </div>
                )
              ) : (
                <div style={{ fontSize: '12px', color: '#9ca3af', paddingLeft: '26px' }}>
                  Es una imagen: no se analiza el contenido del texto.
                </div>
              )}
            </div>
          )}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px' }}>
              <AlertCircle size={16} color="#dc2626" />
              <span style={{ fontSize: '13px', color: '#dc2626' }}>{error}</span>
            </div>
          )}

          {/* PASO 1 — Oposición */}
          <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <PasoHeader numero={1} titulo="¿Para qué oposición es?" activo />
            <select
              value={oposicionId}
              onChange={(e) => { setOposicionId(e.target.value); setTemaId(''); setResultado(null); }}
              style={inputStyle}
            >
              <option value="">Selecciona oposición</option>
              {oposiciones.map((op: any) => (
                <option key={op.id} value={op.id}>{op.nombre}</option>
              ))}
            </select>

            {pasoOposicionListo && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                {[
                  { key: 'tema', label: 'Un tema específico' },
                  { key: 'oposicion', label: 'General de la oposición' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setVinculacion(key as any); setTemaId(''); }}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer',
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
            )}
          </div>

          {/* PASO 2 — Tema (solo si aplica) */}
          {pasoOposicionListo && vinculacion === 'tema' && (
            <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <PasoHeader numero={2} titulo="¿Qué tema?" activo={temas.length > 0} />
              {temas.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {convocatoria ? 'Esta convocatoria todavía no tiene temas creados.' : 'Cargando temas de la convocatoria activa…'}
                </div>
              ) : (
                <select
                  value={temaId}
                  onChange={(e) => setTemaId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Selecciona tema</option>
                  {temas.map((t: any) => (
                    <option key={t.id} value={t.id}>T{t.numero} — {t.titulo}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* PASO 3 — Formulario de subida */}
          {pasoOposicionListo && pasoDestinoListo && (
            <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <PasoHeader numero={vinculacion === 'tema' ? 3 : 2} titulo="Sube el archivo" activo />

              <div>
                <label style={labelStyle}>Título</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Apuntes completos del tema 1"
                  style={{ ...inputStyle, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Descripción <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span>
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción breve del contenido..."
                  style={{ ...inputStyle, minHeight: '60px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Orden</label>
                <input
                  type="number"
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  min="0"
                  style={{ ...inputStyle, width: '80px' }}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Archivo <span style={{ color: '#9ca3af', fontWeight: 400 }}>(PDF o imagen, máx. 50MB — solo el PDF se analiza y clasifica)</span>
                </label>
                <div
                  onClick={() => document.getElementById('file-input-oplora')?.click()}
                  style={{
                    border: '2px dashed #e5e7eb', borderRadius: '10px', padding: '1.5rem',
                    textAlign: 'center', cursor: 'pointer', background: archivo ? '#f0fdf4' : 'white',
                    borderColor: archivo ? '#86efac' : '#e5e7eb',
                  }}
                >
                  <input
                    id="file-input-oplora"
                    type="file"
                    accept=".pdf,image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                  />
                  {archivo ? (
                    <div>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>📄</div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#15803d' }}>{archivo.name}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                        {(archivo.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '24px', marginBottom: '6px' }}>☁️</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>Click para seleccionar archivo</div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={subir}
                disabled={subiendo || !archivo || !titulo}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '10px 16px', alignSelf: 'flex-start',
                  background: archivo && titulo ? '#111827' : '#e5e7eb',
                  color: archivo && titulo ? 'white' : '#9ca3af',
                  border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500,
                  cursor: archivo && titulo ? 'pointer' : 'not-allowed',
                }}
              >
                <Upload size={14} />
                {subiendo ? 'Subiendo y analizando...' : 'Subir apunte'}
              </button>
            </div>
          )}

          {/* Lista apuntes por tema */}
          {vinculacion === 'tema' && temas.length > 0 && (
            <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Apuntes por tema</span>
              </div>
              {temas.map((tema: any) => (
                <div key={tema.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <div
                    onClick={() => setTemaExpandido(temaExpandido === tema.id ? null : tema.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#185FA5', flexShrink: 0 }}>
                      {tema.numero}
                    </div>
                    <div style={{ flex: 1, fontSize: '13px', color: '#111827', fontWeight: 500 }}>{tema.titulo}</div>
                    {temaExpandido === tema.id
                      ? <ChevronUp size={14} color="#9ca3af" />
                      : <ChevronDown size={14} color="#9ca3af" />
                    }
                  </div>

                  {temaExpandido === tema.id && (
                    <div style={{ padding: '8px 16px 12px', background: '#f9fafb' }}>
                      {apuntesDelTema.length === 0 ? (
                        <div style={{ fontSize: '12px', color: '#9ca3af', padding: '8px 0' }}>
                          Sin apuntes en este tema
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {apuntesDelTema.map((ap: any) => {
                            const marcadores = contarMarcadores(ap.contenidoEstructurado?.bloques ?? []);
                            const totalMarcadores = Object.values(marcadores).reduce((a: number, b) => a + (b as number), 0);
                            return (
                              <div key={ap.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'white', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
                                <FileText size={14} color="#185FA5" style={{ flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{ap.titulo}</div>
                                  {ap.descripcion && (
                                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{ap.descripcion}</div>
                                  )}
                                  <div style={{ fontSize: '10px', color: '#d1d5db', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>{ap.tipo.toUpperCase()} · {ap.tamanoBytes ? `${(ap.tamanoBytes / 1024 / 1024).toFixed(2)} MB` : ''}</span>
                                    {totalMarcadores > 0 && (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#15803d' }}>
                                        <Sparkles size={10} /> {totalMarcadores} marcadores
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <a
                                  href={ap.urlArchivo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white', color: '#374151', textDecoration: 'none' }}
                                >
                                  Ver
                                </a>
                                <button
                                  onClick={() => confirm('¿Eliminar este apunte?') && eliminar.mutate(ap.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function PasoHeader({ numero, titulo, activo }: { numero: number; titulo: string; activo: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '22px', height: '22px', borderRadius: '999px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: 700,
        background: activo ? '#111827' : '#e5e7eb',
        color: activo ? 'white' : '#9ca3af',
      }}>
        {numero}
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{titulo}</span>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: '13px',
  border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', color: '#374151',
};

const labelStyle: CSSProperties = {
  fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px',
};
