'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Plus, FileText, Trash2 } from 'lucide-react';

const TIPO_LABEL: Record<string, string> = {
  test: 'Test',
  practico: 'Práctico',
  desarrollo: 'Desarrollo',
  oral: 'Oral',
  supuesto: 'Supuesto',
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

type TabKey = 'oficial' | 'tema' | 'ley';

export default function BancoPreguntasPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const oposicionId = params.id as string;
  const convocatoriaId = params.convocatoriaId as string;

  const [tab, setTab] = useState<TabKey>('oficial');

  // ─── Datos comunes ─────────────────────────────────────────
  const { data: convocatoria } = useQuery({
    queryKey: ['convocatoria', convocatoriaId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/${convocatoriaId}`);
      return res.data;
    },
  });

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'oficial', label: 'Examen oficial' },
    { key: 'tema', label: 'Banco por tema' },
    { key: 'ley', label: 'Banco por ley' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Breadcrumb */}
      <div style={{ padding: '10px 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => router.push(`/admin/oposiciones/${oposicionId}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          Volver
        </button>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          Banco de preguntas — Convocatoria {convocatoria?.anyo}
        </span>
      </div>

      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Banco de preguntas</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
          Centraliza las 3 formas de añadir preguntas a esta convocatoria
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex' }}>
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: tab === key ? 500 : 400,
              color: tab === key ? '#111827' : '#9ca3af',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${tab === key ? '#111827' : 'transparent'}`,
              cursor: 'pointer',
              marginBottom: '-1px',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: '580px' }}>
          {tab === 'oficial' && (
            <TabExamenOficial oposicionId={oposicionId} convocatoriaId={convocatoriaId} convocatoria={convocatoria} />
          )}
          {tab === 'tema' && (
            <TabBancoPorTema convocatoriaId={convocatoriaId} />
          )}
          {tab === 'ley' && (
            <TabBancoPorLey oposicionId={oposicionId} />
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 1 — Examen oficial (subir PDF + vincular preguntas)
// ════════════════════════════════════════════════════════════
function TabExamenOficial({ oposicionId, convocatoriaId, convocatoria }: { oposicionId: string; convocatoriaId: string; convocatoria: any }) {
  const queryClient = useQueryClient();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [form, setForm] = useState({ nombre: '', parte: '' });
  const [examenSeleccionadoId, setExamenSeleccionadoId] = useState('');

  const ejercicios = convocatoria?.ejercicios ?? [];
  const soloUnEjercicio = ejercicios.length === 1;
  const ejercicioElegido = ejercicios.find((e: any) => e.numero === Number(form.parte)) ?? (soloUnEjercicio ? ejercicios[0] : null);
  const fechaExamen = convocatoria?.fechaExamen ? new Date(convocatoria.fechaExamen) : null;
  const anyoDerivado = fechaExamen ? fechaExamen.getFullYear() : convocatoria?.anyo;
  const mesDerivado = fechaExamen ? MESES[fechaExamen.getMonth()] : '';

  const { data: examenes = [], isLoading } = useQuery({
    queryKey: ['examenes-admin', convocatoriaId],
    queryFn: async () => {
      const res = await api.get(`/temas/examenes/convocatoria/${convocatoriaId}`);
      return res.data;
    },
  });

  const eliminar = useMutation({
    mutationFn: async (examenId: string) => {
      await api.delete(`/temas/examenes/${examenId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['examenes-admin', convocatoriaId] }),
  });

  const subirExamen = async () => {
    if (!archivo) return;
    setSubiendo(true);
    try {
      const parteFinal = soloUnEjercicio ? ejercicios[0].numero : Number(form.parte);
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('nombre', form.nombre || `Examen ${anyoDerivado}`);
      formData.append('anyo', String(anyoDerivado));
      formData.append('tipo', ejercicioElegido?.tipo ?? 'test');
      formData.append('mes', mesDerivado);
      formData.append('parte', String(parteFinal));

      await api.post(`/temas/examenes/convocatoria/${convocatoriaId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['examenes-admin', convocatoriaId] });
      setModalAbierto(false);
      setArchivo(null);
      setForm({ nombre: '', parte: '' });
    } catch (e) {
      console.error('Error subiendo examen:', e);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Lista de exámenes */}
      <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Exámenes anteriores</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
              {examenes.length} examen{examenes.length !== 1 ? 'es' : ''}
            </div>
          </div>
          <button
            onClick={() => setModalAbierto(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            <Plus size={14} />
            Subir examen
          </button>
        </div>

        {isLoading ? (
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>Cargando...</div>
        ) : examenes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>No hay exámenes subidos</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {examenes.map((examen: any) => (
              <div key={examen.id} style={{ border: '1px solid #f3f4f6', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '4px' }}>
                  {examen.nombre ?? `Examen ${examen.anyo}`}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#f3f4f6', color: '#6b7280' }}>
                    {TIPO_LABEL[examen.tipo] ?? examen.tipo}
                  </span>
                  {examen.mes && (
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#f3f4f6', color: '#6b7280' }}>
                      {examen.mes} {examen.anyo}
                    </span>
                  )}
                  {examen.totalPreguntas > 0 ? (
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#f0fdf4', color: '#15803d', fontWeight: 500 }}>
                      ✓ {examen.totalPreguntas} preguntas
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#fffbeb', color: '#92400e' }}>
                      Sin preguntas
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                    <a
                      href={examen.urlArchivo}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#F4F5F7', color: '#374151', border: 'none', borderRadius: '7px', fontSize: '12px', cursor: 'pointer', textDecoration: 'none' }}
                    >
                      📄 Ver PDF
                    </a>
                    <button
                      onClick={() => setExamenSeleccionadoId(examen.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px',
                        background: examenSeleccionadoId === examen.id ? '#111827' : '#EFF6FF',
                        color: examenSeleccionadoId === examen.id ? 'white' : '#1F7CFF',
                        border: 'none', borderRadius: '7px', fontSize: '12px', cursor: 'pointer', fontWeight: 500,
                      }}
                    >
                      {examenSeleccionadoId === examen.id ? '✓ Seleccionado' : '+ Preguntas'}
                    </button>
                    <button
                      onClick={() => { if (confirm('¿Eliminar este examen?')) eliminar.mutate(examen.id); }}
                      style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fee2e2', borderRadius: '7px', background: 'white', cursor: 'pointer', color: '#dc2626' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Importar preguntas del examen seleccionado */}
      {examenSeleccionadoId && (
        <ImportarPreguntasJson
          key={examenSeleccionadoId}
          endpoint={`/test/importar/convocatoria/${convocatoriaId}`}
          extraBody={{ examenAnteriorId: examenSeleccionadoId }}
          campoIdentificador="temaNumero"
          etiquetaCampo="Tema"
          formatoEjemplo={{ temaNumero: 1, enunciado: '¿Qué regula...?', opciones: ['a) Opción A', 'b) Opción B', 'c) Opción C'], correcta: 0, explicacion: 'Porque...', dificultad: 1, origen: 'convocatoria', anyo: 2023 }}
          titulo={`Preguntas del examen seleccionado`}
        />
      )}

      {/* Modal subir examen */}
      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '480px', margin: '0 1rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '1.25rem' }}>Subir examen</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Nombre <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder={`Examen ${anyoDerivado ?? ''}`}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {!soloUnEjercicio && ejercicios.length > 1 && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>¿A qué ejercicio pertenece? *</label>
                  <select
                    value={form.parte}
                    onChange={(e) => setForm({ ...form, parte: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="">Seleccionar...</option>
                    {ejercicios.map((ej: any) => (
                      <option key={ej.numero} value={ej.numero}>
                        Ejercicio {ej.numero} — {TIPO_LABEL[ej.tipo] ?? ej.tipo}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {ejercicios.length === 0 && (
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                  Esta convocatoria no tiene ejercicios configurados todavía.
                </p>
              )}

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>PDF del examen *</label>
                <div
                  style={{ border: '1px dashed #e5e7eb', borderRadius: '8px', padding: '1rem', textAlign: 'center', cursor: 'pointer', background: archivo ? '#f0fdf4' : 'white' }}
                  onClick={() => document.getElementById('file-input-oficial')?.click()}
                >
                  <Upload size={20} color={archivo ? '#15803d' : '#9ca3af'} style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '12px', color: archivo ? '#15803d' : '#6b7280', fontWeight: archivo ? 500 : 400 }}>
                    {archivo ? archivo.name : 'Haz click para seleccionar el PDF'}
                  </div>
                </div>
                <input
                  id="file-input-oficial"
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '1.25rem' }}>
              <button
                onClick={subirExamen}
                disabled={!archivo || subiendo || (!soloUnEjercicio && ejercicios.length > 1 && !form.parte)}
                style={{ flex: 2, padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: !archivo ? 0.4 : 1 }}
              >
                {subiendo ? 'Subiendo...' : 'Subir examen'}
              </button>
              <button
                onClick={() => { setModalAbierto(false); setArchivo(null); }}
                style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 2 — Banco por tema (banco general de la convocatoria)
// ════════════════════════════════════════════════════════════
function TabBancoPorTema({ convocatoriaId }: { convocatoriaId: string }) {
  return (
    <ImportarPreguntasJson
      endpoint={`/test/importar/convocatoria/${convocatoriaId}`}
      extraBody={{}}
      campoIdentificador="temaNumero"
      etiquetaCampo="Tema"
      formatoEjemplo={{ temaNumero: 1, enunciado: '¿Qué regula...?', opciones: ['a) Opción A', 'b) Opción B', 'c) Opción C'], correcta: 0, explicacion: 'Porque...', dificultad: 1, origen: 'convocatoria', anyo: 2023 }}
      titulo="Importar al banco general por tema"
    />
  );
}

// ════════════════════════════════════════════════════════════
// TAB 3 — Banco por ley (versión de ley vinculada a la oposición)
// ════════════════════════════════════════════════════════════
function TabBancoPorLey({ oposicionId }: { oposicionId: string }) {
  const [versionSeleccionada, setVersionSeleccionada] = useState('');

  const { data: vinculos = [], isLoading } = useQuery({
    queryKey: ['leyes-oposicion', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/leyes/oposicion/${oposicionId}`);
      return res.data;
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '12px', fontWeight: 500, color: '#111827' }}>Ley y versión</div>
        {isLoading ? (
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>Cargando leyes vinculadas...</div>
        ) : vinculos.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            Esta oposición no tiene leyes vinculadas todavía. Vincúlalas desde el admin de Leyes.
          </div>
        ) : (
          <select
            value={versionSeleccionada}
            onChange={(e) => setVersionSeleccionada(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none' }}
          >
            <option value="">Selecciona una ley...</option>
            {vinculos.map((v: any) => (
              <option key={v.id} value={v.versionLey?.id}>
                {v.ley?.nombre} — v{v.versionLey?.version}
              </option>
            ))}
          </select>
        )}
      </div>

      {versionSeleccionada && (
        <ImportarPreguntasJson
          key={versionSeleccionada}
          endpoint={`/test/importar/version-ley/${versionSeleccionada}`}
          extraBody={{}}
          campoIdentificador="articuloNumero"
          etiquetaCampo="Art."
          formatoEjemplo={{ articuloNumero: '1', enunciado: '¿Qué establece el artículo 1?', opciones: ['a) Opción A', 'b) Opción B', 'c) Opción C'], correcta: 0, explicacion: 'Porque...', dificultad: 1, origen: 'convocatoria', anyo: 2023 }}
          titulo="Importar preguntas por artículo"
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Componente compartido: subir JSON de preguntas a un endpoint
// ════════════════════════════════════════════════════════════
function ImportarPreguntasJson({
  endpoint,
  extraBody,
  campoIdentificador,
  etiquetaCampo,
  formatoEjemplo,
  titulo,
}: {
  endpoint: string;
  extraBody: Record<string, any>;
  campoIdentificador: string;
  etiquetaCampo: string;
  formatoEjemplo: any;
  titulo: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [resultado, setResultado] = useState<any>(null);
  const [importando, setImportando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [erroresValidacion, setErroresValidacion] = useState<string[]>([]);

  // ⭐ Validación local antes de subir nada al servidor: detecta JSON mal
  // formado (opciones distintas de 3/4, índice "correcta" fuera de rango,
  // enunciados vacíos, duplicados dentro del propio archivo...) para que
  // el usuario pueda corregirlo antes de importar cientos de preguntas.
  const validarLote = (json: any[]): string[] => {
    const errores: string[] = [];
    const vistos = new Set<string>();
    json.forEach((p, i) => {
      const etiqueta = `Fila ${i + 1}${p?.[campoIdentificador] !== undefined ? ` (${etiquetaCampo} ${p[campoIdentificador]})` : ''}`;
      if (!p || typeof p !== 'object') { errores.push(`${etiqueta}: no es un objeto válido`); return; }
      if (p[campoIdentificador] === undefined || p[campoIdentificador] === null || p[campoIdentificador] === '') {
        errores.push(`${etiqueta}: falta el campo "${campoIdentificador}"`);
      }
      if (typeof p.enunciado !== 'string' || !p.enunciado.trim()) {
        errores.push(`${etiqueta}: falta el enunciado`);
      }
      if (!Array.isArray(p.opciones) || (p.opciones.length !== 3 && p.opciones.length !== 4)) {
        errores.push(`${etiqueta}: debe tener 3 o 4 opciones (tiene ${Array.isArray(p.opciones) ? p.opciones.length : 'ninguna'})`);
      } else if (p.opciones.some((o: any) => typeof o !== 'string' || !o.trim())) {
        errores.push(`${etiqueta}: hay una opción vacía`);
      }
      if (
        typeof p.correcta !== 'number' ||
        !Number.isInteger(p.correcta) ||
        !Array.isArray(p.opciones) ||
        p.correcta < 0 ||
        p.correcta >= p.opciones.length
      ) {
        errores.push(`${etiqueta}: el índice "correcta" (${p.correcta}) no es válido para ${Array.isArray(p.opciones) ? p.opciones.length : '?'} opciones`);
      }
      if (typeof p.enunciado === 'string' && p.enunciado.trim()) {
        const key = p.enunciado.trim().toLowerCase();
        if (vistos.has(key)) errores.push(`${etiqueta}: enunciado duplicado dentro del propio archivo`);
        vistos.add(key);
      }
    });
    return errores;
  };

  const handleArchivo = (file: File) => {
    setArchivo(file);
    setResultado(null);
    setError(null);
    setErroresValidacion([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!Array.isArray(json)) {
          setError('El JSON debe ser un array de preguntas');
          setPreview([]);
          return;
        }
        const errores = validarLote(json);
        setErroresValidacion(errores);
        setPreview(json.slice(0, 3));
      } catch {
        setError('El archivo no es un JSON válido');
        setPreview([]);
      }
    };
    reader.readAsText(file);
  };

  const importar = async () => {
    if (!archivo) return;
    setImportando(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const preguntas = JSON.parse(e.target?.result as string);
          const res = await api.post(endpoint, { preguntas, ...extraBody });
          setResultado(res.data);
          setArchivo(null);
          setPreview([]);
          setErroresValidacion([]);
        } catch {
          setError('Error al importar. Revisa el formato del JSON.');
        } finally {
          setImportando(false);
        }
      };
      reader.readAsText(archivo);
    } catch {
      setError('Error al leer el archivo');
      setImportando(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{titulo}</div>

      {/* Formato esperado */}
      <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '10px' }}>Formato del JSON</div>
        <pre style={{ fontSize: '11px', color: '#6b7280', background: '#f9fafb', padding: '12px', borderRadius: '8px', overflow: 'auto', margin: 0 }}>
{JSON.stringify([formatoEjemplo], null, 2)}
        </pre>
      </div>

      {/* Upload */}
      <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '10px' }}>Subir archivo</div>
        <div
          onClick={() => fileRef.current?.click()}
          style={{ border: '2px dashed #e5e7eb', borderRadius: '10px', padding: '24px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#9ca3af')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
        >
          {archivo ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <FileText size={16} color="#6b7280" />
              <span style={{ fontSize: '13px', color: '#374151' }}>{archivo.name}</span>
            </div>
          ) : (
            <>
              <Upload size={20} color="#9ca3af" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '13px', color: '#9ca3af' }}>Haz clic para subir un JSON</div>
            </>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={(e) => e.target.files?.[0] && handleArchivo(e.target.files[0])}
          style={{ display: 'none' }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px' }}>
          <AlertCircle size={14} color="#dc2626" />
          <span style={{ fontSize: '13px', color: '#dc2626' }}>{error}</span>
        </div>
      )}

      {/* Errores de validación local (antes de tocar el servidor) */}
      {erroresValidacion.length > 0 && !resultado && (
        <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <AlertCircle size={14} color="#dc2626" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626' }}>
              {erroresValidacion.length} problema{erroresValidacion.length === 1 ? '' : 's'} detectado{erroresValidacion.length === 1 ? '' : 's'} en el archivo
            </span>
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {erroresValidacion.slice(0, 50).map((e, i) => (
              <div key={i} style={{ fontSize: '11px', color: '#991b1b' }}>• {e}</div>
            ))}
            {erroresValidacion.length > 50 && (
              <div style={{ fontSize: '11px', color: '#991b1b', fontStyle: 'italic' }}>... y {erroresValidacion.length - 50} más</div>
            )}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '10px' }}>
            Corrige el JSON y vuelve a subirlo. No se puede importar mientras haya errores.
          </div>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && !resultado && (
        <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '10px' }}>Preview (primeras 3 preguntas)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {preview.map((p, i) => (
              <div key={i} style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '8px', fontSize: '12px', color: '#374151' }}>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{etiquetaCampo} {p[campoIdentificador]}</div>
                <div style={{ color: '#6b7280' }}>{p.enunciado?.slice(0, 80)}...</div>
              </div>
            ))}
          </div>
          <button
            onClick={importar}
            disabled={importando || erroresValidacion.length > 0}
            style={{ marginTop: '14px', width: '100%', padding: '11px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: (importando || erroresValidacion.length > 0) ? 'not-allowed' : 'pointer', opacity: (importando || erroresValidacion.length > 0) ? 0.4 : 1 }}
          >
            {importando ? 'Importando...' : erroresValidacion.length > 0 ? 'Corrige los errores para importar' : 'Importar preguntas'}
          </button>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <CheckCircle size={16} color="#15803d" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Importación completada</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#15803d' }}>{resultado.importadas}</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Importadas</div>
            </div>
            <div style={{ padding: '12px', background: resultado.errores?.length > 0 ? '#fef2f2' : '#f9fafb', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: resultado.errores?.length > 0 ? '#dc2626' : '#9ca3af' }}>{resultado.errores?.length ?? 0}</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Errores</div>
            </div>
          </div>
          {resultado.errores?.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', marginBottom: '6px' }}>Errores:</div>
              {resultado.errores.map((e: string, i: number) => (
                <div key={i} style={{ fontSize: '11px', color: '#dc2626', marginBottom: '2px' }}>• {e}</div>
              ))}
            </div>
          )}
          <button
            onClick={() => setResultado(null)}
            style={{ marginTop: '12px', width: '100%', padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', cursor: 'pointer', color: '#374151' }}
          >
            Importar más preguntas
          </button>
        </div>
      )}
    </div>
  );
}
