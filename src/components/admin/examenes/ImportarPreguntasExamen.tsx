'use client';

// ⭐ Formulario para crear un examen oficial con sus preguntas (o añadir preguntas a uno existente).
// Se pega el JSON, se "Comprueba" (vista previa del servidor, sin guardar nada) y, si no hay
// errores, se crea. Cada pregunta puede ir por ley + artículo, por tema o sin clasificar
// (solo simulacro), y con un estado (vigente, fuera de temario, desactualizada o anulada).

import { useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { X, Upload, CheckCircle2, AlertTriangle, XCircle, ChevronDown } from 'lucide-react';

export type InformeExamen = {
  total: number;
  porLey: number;
  porTema: number;
  soloSimulacro: number;
  noVigentes: number;
  conError: number;
  conAvisos: number;
  reutilizadas?: number;
  temario: { convocatoriaId: string; anyo: number } | null;
  filas: {
    n: number;
    enunciado: string;
    clasificacion: 'ley' | 'tema' | 'ninguna';
    etiqueta: string;
    estado: string;
    avisos: string[];
    error: string | null;
    reutilizada?: boolean;
  }[];
};

export const ETIQUETA_ESTADO: Record<string, { label: string; color: string; bg: string }> = {
  vigente: { label: 'Vigente', color: '#15803d', bg: '#f0fdf4' },
  fuera_temario: { label: 'Fuera de temario', color: '#92400e', bg: '#fffbeb' },
  desactualizada: { label: 'Desactualizada', color: '#c2410c', bg: '#fff7ed' },
  anulada: { label: 'Anulada', color: '#475569', bg: '#f1f5f9' },
};

const EJEMPLO = `[
  {
    "enunciado": "Según la LO 2/1986, ¿quién ejerce el mando superior de las FCSE?",
    "opciones": ["El Ministro del Interior", "El Director General de la Policía", "El Secretario de Estado de Seguridad"],
    "correcta": 0,
    "explicacion": "Art. 10.1 LOFCS.",
    "ley": "LOFCS",
    "articulo": "10"
  },
  {
    "enunciado": "Pregunta clasificada por tema…",
    "opciones": ["A", "B", "C"],
    "correcta": "B",
    "temaNumero": 12
  },
  {
    "enunciado": "Pregunta solo para el simulacro…",
    "opciones": ["A", "B", "C"],
    "correcta": 2,
    "estado": "desactualizada",
    "notaActualizacion": "Tras la reforma de 2023 la respuesta correcta sería la A."
  }
]`;

/** Acepta un array o { preguntas: [...] } y convierte "correcta": "A" | "b" en índice. */
function prepararPreguntas(texto: string): { preguntas: any[] | null; error: string | null } {
  if (!texto.trim()) return { preguntas: null, error: 'Pega el JSON con las preguntas' };
  let datos: any;
  try {
    datos = JSON.parse(texto);
  } catch (e: any) {
    return { preguntas: null, error: `El JSON no es válido: ${e?.message ?? 'revisa comas y comillas'}` };
  }
  const lista = Array.isArray(datos) ? datos : Array.isArray(datos?.preguntas) ? datos.preguntas : null;
  if (!lista) return { preguntas: null, error: 'El JSON debe ser una lista [ … ] de preguntas' };
  const preguntas = lista.map((p: any) => {
    if (p && typeof p.correcta === 'string' && /^[a-f]$/i.test(p.correcta.trim())) {
      return { ...p, correcta: p.correcta.trim().toUpperCase().charCodeAt(0) - 65 };
    }
    if (p && typeof p.correcta === 'string' && /^\d+$/.test(p.correcta.trim())) {
      return { ...p, correcta: Number(p.correcta.trim()) };
    }
    return p;
  });
  return { preguntas, error: null };
}

type Props = {
  modo: 'nuevo' | 'anadir';
  convocatoriaId: string;
  examenId?: string;
  nombreExamen?: string;
  ejercicios: { numero: number; tipo?: string; numPreguntas?: number }[];
  convocatorias: { id: string; anyo: number }[];
  onCerrar: () => void;
  onHecho: () => void;
};

export default function ImportarPreguntasExamen({ modo, convocatoriaId, examenId, nombreExamen, ejercicios, convocatorias, onCerrar, onHecho }: Props) {
  const [nombre, setNombre] = useState('');
  const [parte, setParte] = useState<string>(ejercicios.length === 1 ? String(ejercicios[0].numero) : '');
  const [temarioId, setTemarioId] = useState('');
  const [texto, setTexto] = useState('');
  const [informe, setInforme] = useState<InformeExamen | null>(null);
  const [comprobadoCon, setComprobadoCon] = useState<string | null>(null);
  const [cargando, setCargando] = useState<'comprobar' | 'guardar' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verTodas, setVerTodas] = useState(false);
  const [verFormato, setVerFormato] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // La comprobación vale solo para el texto y opciones con que se hizo
  const firma = `${texto}§${temarioId}§${parte}`;
  const comprobacionVigente = informe && comprobadoCon === firma;
  const faltaEjercicio = modo === 'nuevo' && ejercicios.length > 1 && !parte;
  const ejercicioElegido = ejercicios.find((e) => String(e.numero) === parte);

  const endpoint = modo === 'nuevo' ? `/examenes-oficiales/convocatoria/${convocatoriaId}` : `/examenes-oficiales/${examenId}/preguntas`;

  const enviar = async (simular: boolean) => {
    setError(null);
    const { preguntas, error: errorJson } = prepararPreguntas(texto);
    if (errorJson || !preguntas) {
      setError(errorJson);
      setInforme(null);
      return;
    }
    if (faltaEjercicio) {
      setError('Elige a qué ejercicio pertenece el examen');
      return;
    }
    setCargando(simular ? 'comprobar' : 'guardar');
    try {
      const res = await api.post(endpoint, {
        nombre: nombre.trim() || undefined,
        parte: parte ? Number(parte) : undefined,
        temarioConvocatoriaId: temarioId || undefined,
        preguntas,
        simular,
      });
      if (simular) {
        setInforme(res.data.informe);
        setComprobadoCon(firma);
        setVerTodas(false);
      } else {
        onHecho();
      }
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.informe) {
        setInforme(data.informe);
        setComprobadoCon(firma);
      }
      const msg = data?.message;
      setError(Array.isArray(msg) ? msg.join(' · ') : msg || 'No se ha podido completar. Inténtalo de nuevo.');
    } finally {
      setCargando(null);
    }
  };

  const cargarArchivo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setTexto(String(e.target?.result ?? ''));
    reader.readAsText(file);
  };

  const filasVisibles = useMemo(() => {
    if (!informe) return [];
    return verTodas ? informe.filas : informe.filas.filter((f) => f.error || f.avisos.length > 0);
  }, [informe, verTodas]);

  const numPreguntasTexto = useMemo(() => prepararPreguntas(texto).preguntas?.length ?? 0, [texto]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 50, overflowY: 'auto', padding: '2rem 1rem' }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 720, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.5rem', borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{modo === 'nuevo' ? 'Nuevo examen' : 'Añadir preguntas'}</div>
            {modo === 'anadir' && nombreExamen && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{nombreExamen} · se añaden al final</div>}
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={18} /></button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {modo === 'nuevo' && (
            <div style={{ display: 'grid', gridTemplateColumns: ejercicios.length > 1 ? '2fr 1fr' : '1fr', gap: 10 }}>
              <Campo label="Nombre del examen" opcional>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Examen Policía Nacional 2024 – 41ª promoción" style={estiloInput} />
              </Campo>
              {ejercicios.length > 1 && (
                <Campo label="Ejercicio">
                  <select value={parte} onChange={(e) => setParte(e.target.value)} style={estiloInput}>
                    <option value="">Elegir…</option>
                    {ejercicios.map((ej) => (
                      <option key={ej.numero} value={ej.numero}>Ejercicio {ej.numero}{ej.tipo ? ` — ${ej.tipo}` : ''}</option>
                    ))}
                  </select>
                </Campo>
              )}
            </div>
          )}
          {modo === 'nuevo' && ejercicios.length === 0 && (
            <div style={{ fontSize: 12, color: '#92400e', background: '#fffbeb', borderRadius: 8, padding: '8px 10px' }}>
              Esta convocatoria no tiene ejercicios configurados: el examen se guardará como ejercicio 1.
            </div>
          )}

          <Campo label='Temario para "temaNumero"' ayuda="Solo afecta a las preguntas que van por tema. Lo normal es el temario actual, que es el que usan los tests.">
            <select value={temarioId} onChange={(e) => setTemarioId(e.target.value)} style={estiloInput}>
              <option value="">Automático (el más reciente con temas{informe?.temario && !temarioId ? `: ${informe.temario.anyo}` : ''})</option>
              {convocatorias.map((c) => (
                <option key={c.id} value={c.id}>Convocatoria {c.anyo}</option>
              ))}
            </select>
          </Campo>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>
                Preguntas (JSON){numPreguntasTexto > 0 && <span style={{ color: '#9ca3af', fontWeight: 400 }}> · {numPreguntasTexto} detectadas{ejercicioElegido?.numPreguntas ? ` de ${ejercicioElegido.numPreguntas} del ejercicio` : ''}</span>}
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setVerFormato((v) => !v)} style={estiloBotonSecundario}>
                  Formato <ChevronDown size={12} style={{ transform: verFormato ? 'rotate(180deg)' : 'none' }} />
                </button>
                <button onClick={() => fileRef.current?.click()} style={estiloBotonSecundario}>
                  <Upload size={12} /> Cargar archivo
                </button>
                <input ref={fileRef} type="file" accept=".json,application/json,.txt" style={{ display: 'none' }} onChange={(e) => { cargarArchivo(e.target.files?.[0]); e.target.value = ''; }} />
              </div>
            </div>
            {verFormato && (
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 8, fontSize: 12, color: '#4b5563', lineHeight: 1.55 }}>
                <div style={{ marginBottom: 6 }}>
                  En el orden del examen. Obligatorios: <code>enunciado</code>, <code>opciones</code> (2 a 4) y <code>correcta</code> (índice desde 0 o letra "A", "B"…). Clasificación opcional:
                  {' '}<code>ley</code> (siglas o nombre) + <code>articulo</code>, o <code>temaNumero</code>. Sin clasificación, la pregunta solo sale en el simulacro.
                  {' '}<code>estado</code>: vigente (por defecto), fuera_temario, desactualizada o anulada; con desactualizada, añade <code>notaActualizacion</code>.
                </div>
                <pre style={{ margin: 0, fontSize: 11, overflowX: 'auto', background: 'white', borderRadius: 6, padding: 10, border: '1px solid #f3f4f6' }}>{EJEMPLO}</pre>
              </div>
            )}
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder='[ { "enunciado": "…", "opciones": ["…", "…", "…"], "correcta": 0, "ley": "LOFCS", "articulo": "9" } ]'
              spellCheck={false}
              style={{ ...estiloInput, minHeight: 200, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, lineHeight: 1.5, resize: 'vertical' }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: '#b91c1c', background: '#fef2f2', borderRadius: 8, padding: '8px 10px' }}>{error}</div>
          )}

          {informe && (
            <div style={{ border: '1px solid #f3f4f6', borderRadius: 12, overflow: 'hidden', opacity: comprobacionVigente ? 1 : 0.55 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: '#f9fafb' }}>
                {[
                  { v: informe.porLey, l: 'Por ley', c: '#1d4ed8' },
                  { v: informe.porTema, l: 'Por tema', c: '#7c3aed' },
                  { v: informe.soloSimulacro, l: 'Solo simulacro', c: '#6b7280' },
                  { v: informe.noVigentes, l: 'No vigentes', c: '#c2410c' },
                  { v: informe.conError, l: 'Con error', c: informe.conError ? '#dc2626' : '#15803d' },
                ].map((d, i) => (
                  <div key={d.l} style={{ textAlign: 'center', padding: '10px 4px', borderLeft: i ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: d.c }}>{d.v}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{d.l}</div>
                  </div>
                ))}
              </div>
              {!comprobacionVigente && (
                <div style={{ fontSize: 12, color: '#92400e', padding: '8px 12px', borderTop: '1px solid #f3f4f6' }}>Has cambiado algo desde la última comprobación: vuelve a comprobar.</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderTop: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                  {informe.conError === 0 && informe.conAvisos === 0
                    ? 'Todo correcto.'
                    : `${informe.conError} con error · ${informe.conAvisos} con avisos (se importan igualmente, sin la clasificación que falla)`}
                </span>
                {(informe.reutilizadas ?? 0) > 0 && (
                  <span style={{ fontSize: 12, color: '#15803d', marginLeft: 8, flex: 1 }}>
                    · {informe.reutilizadas} ya estaban en el banco y se vuelven a vincular (no se duplican)
                  </span>
                )}
                <button onClick={() => setVerTodas((v) => !v)} style={{ ...estiloBotonSecundario, fontSize: 11 }}>{verTodas ? 'Ver solo problemas' : `Ver las ${informe.total}`}</button>
              </div>
              {filasVisibles.length > 0 && (
                <div style={{ maxHeight: 280, overflowY: 'auto', borderTop: '1px solid #f3f4f6' }}>
                  {filasVisibles.map((f) => {
                    const Icono = f.error ? XCircle : f.avisos.length ? AlertTriangle : CheckCircle2;
                    const color = f.error ? '#dc2626' : f.avisos.length ? '#d97706' : '#16a34a';
                    const est = ETIQUETA_ESTADO[f.estado] ?? ETIQUETA_ESTADO.vigente;
                    return (
                      <div key={f.n} style={{ display: 'flex', gap: 8, padding: '8px 12px', borderBottom: '1px solid #f9fafb', fontSize: 12 }}>
                        <Icono size={14} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ color: '#9ca3af', fontWeight: 600, flexShrink: 0, width: 24 }}>{f.n}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.enunciado}</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                            {!f.error && <Chip texto={f.etiqueta} color={f.clasificacion === 'ninguna' ? '#6b7280' : f.clasificacion === 'ley' ? '#1d4ed8' : '#7c3aed'} bg={f.clasificacion === 'ninguna' ? '#f3f4f6' : f.clasificacion === 'ley' ? '#eff6ff' : '#f5f3ff'} />}
                            {!f.error && f.estado !== 'vigente' && <Chip texto={est.label} color={est.color} bg={est.bg} />}
                            {!f.error && f.reutilizada && <Chip texto="Ya en el banco · se reutiliza" color="#15803d" bg="#f0fdf4" />}
                          </div>
                          {f.error && <div style={{ color: '#dc2626', marginTop: 3 }}>{f.error}</div>}
                          {f.avisos.map((a, i) => <div key={i} style={{ color: '#b45309', marginTop: 3 }}>{a}</div>)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '1rem 1.5rem', borderTop: '1px solid #f3f4f6' }}>
          <button onClick={onCerrar} style={{ flex: 1, padding: 10, background: 'white', border: '1px solid #e5e7eb', borderRadius: 9, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          <button
            onClick={() => enviar(true)}
            disabled={!!cargando || !texto.trim()}
            style={{ flex: 1, padding: 10, background: 'white', border: '1px solid #111827', color: '#111827', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !texto.trim() ? 0.4 : 1 }}
          >
            {cargando === 'comprobar' ? 'Comprobando…' : 'Comprobar'}
          </button>
          <button
            onClick={() => enviar(false)}
            disabled={!comprobacionVigente || !!cargando || (informe?.conError ?? 1) > 0}
            title={!comprobacionVigente ? 'Comprueba antes las preguntas' : undefined}
            style={{ flex: 2, padding: 10, background: '#111827', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !comprobacionVigente || (informe?.conError ?? 1) > 0 ? 0.4 : 1 }}
          >
            {cargando === 'guardar'
              ? 'Guardando…'
              : modo === 'nuevo'
                ? `Crear examen${comprobacionVigente && informe ? ` (${informe.total})` : ''}`
                : `Añadir${comprobacionVigente && informe ? ` ${informe.total}` : ''} preguntas`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Chip({ texto, color, bg }: { texto: string; color: string; bg: string }) {
  return <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: bg, color, fontWeight: 500, whiteSpace: 'nowrap' }}>{texto}</span>;
}

function Campo({ label, opcional, ayuda, children }: { label: string; opcional?: boolean; ayuda?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 4 }}>
        {label} {opcional && <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span>}
      </label>
      {children}
      {ayuda && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{ayuda}</div>}
    </div>
  );
}

export const estiloInput: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', boxSizing: 'border-box', background: 'white',
};

export const estiloBotonSecundario: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#374151', border: '1px solid #e5e7eb', padding: '5px 10px', borderRadius: 7, background: 'white', cursor: 'pointer',
};
