'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Plus, FileText, Trash2, Pencil, X, EyeOff, Eye } from 'lucide-react';

const TIPO_LABEL: Record<string, string> = {
  test: 'Test',
  practico: 'Práctico',
  desarrollo: 'Desarrollo',
  oral: 'Oral',
  supuesto: 'Supuesto',
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

type TabKey = 'oficial' | 'tema' | 'ley' | 'gestionar';

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
    { key: 'gestionar', label: 'Gestionar preguntas' },
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
        <div style={{ maxWidth: tab === 'gestionar' ? '900px' : '580px' }}>
          {tab === 'oficial' && (
            <TabExamenOficial oposicionId={oposicionId} convocatoriaId={convocatoriaId} convocatoria={convocatoria} />
          )}
          {tab === 'tema' && (
            <TabBancoPorTema convocatoriaId={convocatoriaId} />
          )}
          {tab === 'ley' && (
            <TabBancoPorLey oposicionId={oposicionId} />
          )}
          {tab === 'gestionar' && (
            <TabGestionarPreguntas convocatoriaId={convocatoriaId} />
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
  const [subTab, setSubTab] = useState<'importar' | 'gestionar'>('importar');

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
        <>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['importar', 'gestionar'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSubTab(s)}
                style={{
                  padding: '7px 14px', fontSize: '12px', fontWeight: 500, borderRadius: '999px',
                  border: subTab === s ? 'none' : '1px solid #e5e7eb',
                  background: subTab === s ? '#111827' : 'white',
                  color: subTab === s ? 'white' : '#6b7280',
                  cursor: 'pointer',
                }}
              >
                {s === 'importar' ? 'Importar preguntas' : 'Consultar / editar'}
              </button>
            ))}
          </div>

          {subTab === 'importar' ? (
            <ImportarPreguntasJson
              key={versionSeleccionada}
              endpoint={`/test/importar/version-ley/${versionSeleccionada}`}
              extraBody={{}}
              campoIdentificador="articuloNumero"
              etiquetaCampo="Art."
              formatoEjemplo={{ articuloNumero: '1', enunciado: '¿Qué establece el artículo 1?', opciones: ['a) Opción A', 'b) Opción B', 'c) Opción C'], correcta: 0, explicacion: 'Porque...', dificultad: 1, origen: 'convocatoria', anyo: 2023 }}
              titulo="Importar preguntas por artículo"
            />
          ) : (
            <TabGestionarPreguntasLey key={versionSeleccionada} versionLeyId={versionSeleccionada} />
          )}
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 3b — Gestionar preguntas por Ley (listar, editar, activar/
// desactivar, eliminar), equivalente a TabGestionarPreguntas pero
// filtrando por versión de ley + artículo en vez de convocatoria/tema.
// ════════════════════════════════════════════════════════════
function TabGestionarPreguntasLey({ versionLeyId }: { versionLeyId: string }) {
  const queryClient = useQueryClient();
  const [articuloFiltro, setArticuloFiltro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [preguntaEditando, setPreguntaEditando] = useState<any>(null);
  const porPagina = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['banco-preguntas-ley', versionLeyId, articuloFiltro, pagina],
    queryFn: async () => {
      const res = await api.get(`/test/banco-ley/${versionLeyId}`, {
        params: { articuloId: articuloFiltro || undefined, pagina, porPagina },
      });
      return res.data;
    },
  });

  const eliminar = useMutation({
    mutationFn: async (preguntaId: string) => {
      await api.delete(`/test/banco/${preguntaId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['banco-preguntas-ley', versionLeyId] }),
  });

  const toggleActiva = useMutation({
    mutationFn: async ({ id, activa }: { id: string; activa: boolean }) => {
      await api.patch(`/test/banco/${id}`, { activa });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['banco-preguntas-ley', versionLeyId] }),
  });

  const preguntas = data?.preguntas ?? [];
  const totalPaginas = data?.totalPaginas ?? 1;

  // Lista de artículos presentes en el resultado actual, para poblar el filtro
  const articulosDisponibles = Array.from(
    new Map(
      preguntas.flatMap((p: any) => (p.articulos ?? []).map((a: any) => [a.id, a]))
    ).values()
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <select
          value={articuloFiltro}
          onChange={(e) => { setArticuloFiltro(e.target.value); setPagina(1); }}
          style={{ padding: '8px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none' }}
        >
          <option value="">Todos los artículos</option>
          {articulosDisponibles.map((a: any) => (
            <option key={a.id} value={a.id}>Art. {a.numero}</option>
          ))}
        </select>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          {data ? `${data.total} pregunta${data.total === 1 ? '' : 's'}` : ''}
        </div>
      </div>

      {isLoading ? (
        <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>Cargando...</div>
      ) : preguntas.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '2rem', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
          No hay preguntas para este filtro.
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', overflow: 'hidden' }}>
          {preguntas.map((p: any, i: number) => (
            <div
              key={p.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px',
                borderBottom: i < preguntas.length - 1 ? '1px solid #f3f4f6' : 'none',
                opacity: p.activa === false ? 0.5 : 1,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  {(p.articulos ?? []).map((a: any) => (
                    <span key={a.id} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: '#f0fdf4', color: '#15803d', fontWeight: 500 }}>
                      Art. {a.numero}
                    </span>
                  ))}
                  {p.activa === false && (
                    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: '#f3f4f6', color: '#6b7280', fontWeight: 500 }}>
                      Desactivada
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#111827' }}>{p.enunciado}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>
                  {p.opciones?.length} opciones · correcta: {p.opciones?.[p.correcta]?.slice(0, 40)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button
                  onClick={() => setPreguntaEditando(p)}
                  title="Editar"
                  style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '7px', background: 'white', cursor: 'pointer', color: '#374151' }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => toggleActiva.mutate({ id: p.id, activa: p.activa === false })}
                  title={p.activa === false ? 'Activar' : 'Desactivar'}
                  style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '7px', background: 'white', cursor: 'pointer', color: '#374151' }}
                >
                  {p.activa === false ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  onClick={() => { if (confirm('¿Eliminar esta pregunta definitivamente?')) eliminar.mutate(p.id); }}
                  title="Eliminar"
                  style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fee2e2', borderRadius: '7px', background: 'white', cursor: 'pointer', color: '#dc2626' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina <= 1}
            style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: pagina <= 1 ? 'not-allowed' : 'pointer', opacity: pagina <= 1 ? 0.4 : 1 }}
          >
            Anterior
          </button>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{pagina} / {totalPaginas}</span>
          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina >= totalPaginas}
            style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: pagina >= totalPaginas ? 'not-allowed' : 'pointer', opacity: pagina >= totalPaginas ? 0.4 : 1 }}
          >
            Siguiente
          </button>
        </div>
      )}

      {preguntaEditando && (
        <ModalEditarPregunta
          pregunta={preguntaEditando}
          onClose={() => setPreguntaEditando(null)}
          onGuardado={() => {
            setPreguntaEditando(null);
            queryClient.invalidateQueries({ queryKey: ['banco-preguntas-ley', versionLeyId] });
          }}
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
  const [modoEntrada, setModoEntrada] = useState<'archivo' | 'texto'>('archivo');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [jsonTexto, setJsonTexto] = useState('');
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

  // ⭐ Procesa un texto JSON venga de un archivo o de pegarlo directamente
  const procesarJson = (texto: string) => {
    setResultado(null);
    setError(null);
    setErroresValidacion([]);
    try {
      const json = JSON.parse(texto);
      if (!Array.isArray(json)) {
        setError('El JSON debe ser un array de preguntas');
        setPreview([]);
        return;
      }
      const errores = validarLote(json);
      setErroresValidacion(errores);
      setPreview(json.slice(0, 3));
    } catch {
      setError('El texto no es un JSON válido');
      setPreview([]);
    }
  };

  const handleArchivo = (file: File) => {
    setArchivo(file);
    const reader = new FileReader();
    reader.onload = (e) => procesarJson(e.target?.result as string);
    reader.readAsText(file);
  };

  const handleTextoPegado = (texto: string) => {
    setJsonTexto(texto);
    if (!texto.trim()) {
      setPreview([]);
      setErroresValidacion([]);
      setError(null);
      return;
    }
    procesarJson(texto);
  };

  const importar = async () => {
    setImportando(true);
    setError(null);
    try {
      const textoAImportar = modoEntrada === 'texto'
        ? jsonTexto
        : await new Promise<string>((resolve, reject) => {
            if (!archivo) { reject(new Error('sin archivo')); return; }
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(archivo);
          });

      const preguntas = JSON.parse(textoAImportar);
      const res = await api.post(endpoint, { preguntas, ...extraBody });
      setResultado(res.data);
      setArchivo(null);
      setJsonTexto('');
      setPreview([]);
      setErroresValidacion([]);
    } catch {
      setError('Error al importar. Revisa el formato del JSON.');
    } finally {
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

      {/* Selector Archivo / Pegar texto */}
      <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {(['archivo', 'texto'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setModoEntrada(m);
                setArchivo(null);
                setJsonTexto('');
                setPreview([]);
                setErroresValidacion([]);
                setError(null);
                setResultado(null);
              }}
              style={{
                padding: '7px 14px', fontSize: '12px', fontWeight: 500, borderRadius: '999px',
                border: modoEntrada === m ? 'none' : '1px solid #e5e7eb',
                background: modoEntrada === m ? '#111827' : 'white',
                color: modoEntrada === m ? 'white' : '#6b7280',
                cursor: 'pointer',
              }}
            >
              {m === 'archivo' ? 'Subir archivo' : 'Pegar texto'}
            </button>
          ))}
        </div>

        {modoEntrada === 'archivo' ? (
          <>
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
          </>
        ) : (
          <textarea
            value={jsonTexto}
            onChange={(e) => handleTextoPegado(e.target.value)}
            rows={12}
            placeholder='[ { "temaNumero": 1, "enunciado": "...", "opciones": ["a) ...", "b) ...", "c) ..."], "correcta": 0 } ]'
            style={{ width: '100%', padding: '10px', fontSize: '12px', fontFamily: 'monospace', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
          />
        )}
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

// ════════════════════════════════════════════════════════════
// TAB 4 — Gestionar preguntas (listar, editar, activar/desactivar, eliminar)
// Pensado para cuando una convocatoria nueva cambia el contenido de
// un tema y no hace falta borrar todo el banco, solo lo afectado.
// ════════════════════════════════════════════════════════════
function TabGestionarPreguntas({ convocatoriaId }: { convocatoriaId: string }) {
  const queryClient = useQueryClient();
  const [temaFiltro, setTemaFiltro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [preguntaEditando, setPreguntaEditando] = useState<any>(null);
  const porPagina = 20;

  const { data: temas = [] } = useQuery({
    queryKey: ['temas-convocatoria', convocatoriaId],
    queryFn: async () => {
      const res = await api.get(`/temas/convocatoria/${convocatoriaId}`);
      return res.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['banco-preguntas', convocatoriaId, temaFiltro, pagina],
    queryFn: async () => {
      const res = await api.get(`/test/banco/${convocatoriaId}`, {
        params: { temaId: temaFiltro || undefined, pagina, porPagina },
      });
      return res.data;
    },
  });

  const eliminar = useMutation({
    mutationFn: async (preguntaId: string) => {
      await api.delete(`/test/banco/${preguntaId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['banco-preguntas', convocatoriaId] }),
  });

  const toggleActiva = useMutation({
    mutationFn: async ({ id, activa }: { id: string; activa: boolean }) => {
      await api.patch(`/test/banco/${id}`, { activa });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['banco-preguntas', convocatoriaId] }),
  });

  const preguntas = data?.preguntas ?? [];
  const totalPaginas = data?.totalPaginas ?? 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <select
          value={temaFiltro}
          onChange={(e) => { setTemaFiltro(e.target.value); setPagina(1); }}
          style={{ padding: '8px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none' }}
        >
          <option value="">Todos los temas</option>
          {temas.map((t: any) => (
            <option key={t.id} value={t.id}>Tema {t.numero} — {t.titulo ?? t.nombre}</option>
          ))}
        </select>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          {data ? `${data.total} pregunta${data.total === 1 ? '' : 's'}` : ''}
        </div>
      </div>

      {isLoading ? (
        <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>Cargando...</div>
      ) : preguntas.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '2rem', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
          No hay preguntas para este filtro.
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', overflow: 'hidden' }}>
          {preguntas.map((p: any, i: number) => (
            <div
              key={p.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px',
                borderBottom: i < preguntas.length - 1 ? '1px solid #f3f4f6' : 'none',
                opacity: p.activa === false ? 0.5 : 1,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  {(p.temas ?? []).map((t: any) => (
                    <span key={t.id} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: '#eff6ff', color: '#1F7CFF', fontWeight: 500 }}>
                      Tema {t.numero}
                    </span>
                  ))}
                  {(p.articulos ?? []).map((a: any) => (
                    <span key={a.id} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: '#f0fdf4', color: '#15803d', fontWeight: 500 }}>
                      Art. {a.numero}
                    </span>
                  ))}
                  {p.activa === false && (
                    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: '#f3f4f6', color: '#6b7280', fontWeight: 500 }}>
                      Desactivada
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#111827' }}>{p.enunciado}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>
                  {p.opciones?.length} opciones · correcta: {p.opciones?.[p.correcta]?.slice(0, 40)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button
                  onClick={() => setPreguntaEditando(p)}
                  title="Editar"
                  style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '7px', background: 'white', cursor: 'pointer', color: '#374151' }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => toggleActiva.mutate({ id: p.id, activa: p.activa === false })}
                  title={p.activa === false ? 'Activar' : 'Desactivar'}
                  style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '7px', background: 'white', cursor: 'pointer', color: '#374151' }}
                >
                  {p.activa === false ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  onClick={() => { if (confirm('¿Eliminar esta pregunta definitivamente?')) eliminar.mutate(p.id); }}
                  title="Eliminar"
                  style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fee2e2', borderRadius: '7px', background: 'white', cursor: 'pointer', color: '#dc2626' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina <= 1}
            style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: pagina <= 1 ? 'not-allowed' : 'pointer', opacity: pagina <= 1 ? 0.4 : 1 }}
          >
            Anterior
          </button>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{pagina} / {totalPaginas}</span>
          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina >= totalPaginas}
            style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: pagina >= totalPaginas ? 'not-allowed' : 'pointer', opacity: pagina >= totalPaginas ? 0.4 : 1 }}
          >
            Siguiente
          </button>
        </div>
      )}

      {preguntaEditando && (
        <ModalEditarPregunta
          pregunta={preguntaEditando}
          onClose={() => setPreguntaEditando(null)}
          onGuardado={() => {
            setPreguntaEditando(null);
            queryClient.invalidateQueries({ queryKey: ['banco-preguntas', convocatoriaId] });
          }}
        />
      )}
    </div>
  );
}

function ModalEditarPregunta({ pregunta, onClose, onGuardado }: { pregunta: any; onClose: () => void; onGuardado: () => void }) {
  const [enunciado, setEnunciado] = useState(pregunta.enunciado);
  const [opciones, setOpciones] = useState<string[]>([...pregunta.opciones]);
  const [correcta, setCorrecta] = useState<number>(pregunta.correcta);
  const [explicacion, setExplicacion] = useState(pregunta.explicacion ?? '');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!enunciado.trim()) { setError('El enunciado no puede estar vacío'); return; }
    if (opciones.some((o) => !o.trim())) { setError('Ninguna opción puede estar vacía'); return; }
    setGuardando(true);
    setError(null);
    try {
      await api.patch(`/test/banco/${pregunta.id}`, {
        enunciado: enunciado.trim(),
        opciones,
        correcta,
        explicacion,
      });
      onGuardado();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '14px', padding: '1.5rem', width: '100%', maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Editar pregunta</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Enunciado</label>
            <textarea
              value={enunciado}
              onChange={(e) => setEnunciado(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
              Opciones (marca la correcta)
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {opciones.map((o, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="radio"
                    checked={correcta === idx}
                    onChange={() => setCorrecta(idx)}
                  />
                  <input
                    type="text"
                    value={o}
                    onChange={(e) => setOpciones(opciones.map((op, i2) => i2 === idx ? e.target.value : op))}
                    style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none' }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Explicación</label>
            <textarea
              value={explicacion}
              onChange={(e) => setExplicacion(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          {error && (
            <div style={{ fontSize: '12px', color: '#dc2626' }}>{error}</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button
            onClick={guardar}
            disabled={guardando}
            style={{ flex: 2, padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.6 : 1 }}
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', cursor: 'pointer' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
