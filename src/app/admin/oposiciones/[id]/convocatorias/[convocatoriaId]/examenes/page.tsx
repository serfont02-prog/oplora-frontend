'use client';

// ⭐ Exámenes oficiales de una convocatoria. Ya no se sube el PDF: el examen se crea directamente
// con sus preguntas (JSON), cada una por ley + artículo, por tema o solo para el simulacro, y con
// su estado (vigente, fuera de temario, desactualizada o anulada).

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Plus, Trash2, ChevronDown, FileText } from 'lucide-react';
import ImportarPreguntasExamen, { Chip, estiloBotonSecundario } from '@/components/admin/examenes/ImportarPreguntasExamen';
import PreguntasExamenAdmin from '@/components/admin/examenes/PreguntasExamenAdmin';

type ExamenResumen = {
  id: string;
  nombre: string;
  anyo: number;
  mes: string | null;
  parte: number;
  tipo: string;
  urlArchivo: string | null;
  total: number;
  anuladas: number;
  desactualizadas: number;
  fueraTemario: number;
  enTests: number;
};

export default function ExamenesAdminPage() {
  const router = useRouter();
  const params = useParams();
  const oposicionId = params.id as string;
  const convocatoriaId = params.convocatoriaId as string;
  const queryClient = useQueryClient();

  const [modal, setModal] = useState<{ modo: 'nuevo' } | { modo: 'anadir'; examen: ExamenResumen } | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [errorBorrar, setErrorBorrar] = useState<string | null>(null);

  const { data: convocatoria } = useQuery({
    queryKey: ['convocatoria', convocatoriaId],
    queryFn: async () => (await api.get(`/convocatorias/${convocatoriaId}`)).data,
  });

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias-oposicion', oposicionId],
    queryFn: async () => (await api.get(`/convocatorias/oposicion/${oposicionId}`)).data,
  });

  const { data: examenes = [], isLoading, error } = useQuery<ExamenResumen[]>({
    queryKey: ['examenes-oficiales', convocatoriaId],
    queryFn: async () => (await api.get(`/examenes-oficiales/convocatoria/${convocatoriaId}`)).data,
  });

  const refrescar = () => {
    queryClient.invalidateQueries({ queryKey: ['examenes-oficiales', convocatoriaId] });
    queryClient.invalidateQueries({ queryKey: ['examenes-admin', convocatoriaId] });
  };

  const eliminar = useMutation({
    mutationFn: async (examenId: string) => api.delete(`/temas/examenes/${examenId}`),
    onSuccess: () => { setErrorBorrar(null); refrescar(); },
    onError: () => setErrorBorrar('No se ha podido eliminar el examen.'),
  });

  const ejercicios = convocatoria?.ejercicios ?? [];
  const listaConvocatorias = [...((convocatorias as any[]) ?? [])]
    .sort((a, b) => b.anyo - a.anyo)
    .map((c) => ({ id: c.id as string, anyo: c.anyo as number }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Breadcrumb */}
      <div style={{ padding: '10px 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => router.push(`/admin/oposiciones/${oposicionId}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={14} /> Convocatorias
        </button>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ fontSize: 13, color: '#6b7280' }}>Exámenes · {convocatoria?.anyo}</span>
      </div>

      {/* Cabecera */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Exámenes oficiales</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
            {examenes.length} examen{examenes.length !== 1 ? 'es' : ''} · Convocatoria {convocatoria?.anyo} · En la app aparecen como "Hacer examen" en cuanto tienen preguntas
          </div>
        </div>
        <button onClick={() => setModal({ modo: 'nuevo' })} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#111827', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}>
          <Plus size={14} /> Nuevo examen
        </button>
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f9fafb', padding: '1.5rem' }}>
        {errorBorrar && <div style={{ fontSize: 12, color: '#b91c1c', background: '#fef2f2', borderRadius: 8, padding: '8px 10px', marginBottom: 12 }}>{errorBorrar}</div>}
        {isLoading ? (
          <div style={{ fontSize: 13, color: '#9ca3af' }}>Cargando…</div>
        ) : error ? (
          <div style={{ fontSize: 13, color: '#b91c1c' }}>No se han podido cargar los exámenes.</div>
        ) : examenes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Todavía no hay exámenes en esta convocatoria</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>Crea el examen pegando sus preguntas con las respuestas.</div>
            <button onClick={() => setModal({ modo: 'nuevo' })} style={{ fontSize: 13, color: '#374151', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: 8, background: 'white', cursor: 'pointer' }}>
              Crear el primer examen
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {examenes.map((ex) => {
              const abiertoEste = abierto === ex.id;
              const soloSimulacro = Math.max(0, ex.total - ex.enTests - ex.anuladas - ex.desactualizadas - ex.fueraTemario);
              return (
                <div key={ex.id} style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{ex.nombre}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                        Ejercicio {ex.parte}{ex.mes ? ` · ${ex.mes} ${ex.anyo}` : ` · ${ex.anyo}`}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                        {ex.total > 0
                          ? <Chip texto={`${ex.total} preguntas`} color="#15803d" bg="#f0fdf4" />
                          : <Chip texto="Sin preguntas · no aparece en la app" color="#92400e" bg="#fffbeb" />}
                        {ex.enTests > 0 && <Chip texto={`${ex.enTests} en tests`} color="#1d4ed8" bg="#eff6ff" />}
                        {soloSimulacro > 0 && <Chip texto={`${soloSimulacro} solo simulacro`} color="#6b7280" bg="#f3f4f6" />}
                        {ex.anuladas > 0 && <Chip texto={`${ex.anuladas} anuladas`} color="#475569" bg="#f1f5f9" />}
                        {ex.desactualizadas > 0 && <Chip texto={`${ex.desactualizadas} desactualizadas`} color="#c2410c" bg="#fff7ed" />}
                        {ex.fueraTemario > 0 && <Chip texto={`${ex.fueraTemario} fuera de temario`} color="#92400e" bg="#fffbeb" />}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {ex.urlArchivo && (
                        <a href={ex.urlArchivo} target="_blank" rel="noreferrer" style={{ ...estiloBotonSecundario, textDecoration: 'none' }}>
                          <FileText size={12} /> PDF
                        </a>
                      )}
                      <button onClick={() => setModal({ modo: 'anadir', examen: ex })} style={estiloBotonSecundario}>
                        <Plus size={12} /> Añadir preguntas
                      </button>
                      {ex.total > 0 && (
                        <button onClick={() => setAbierto(abiertoEste ? null : ex.id)} style={{ ...estiloBotonSecundario, background: abiertoEste ? '#111827' : 'white', color: abiertoEste ? 'white' : '#374151', border: abiertoEste ? '1px solid #111827' : '1px solid #e5e7eb' }}>
                          Preguntas <ChevronDown size={12} style={{ transform: abiertoEste ? 'rotate(180deg)' : 'none' }} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar "${ex.nombre}"? Se borran sus preguntas que solo eran para el simulacro; las clasificadas se quedan en el banco para los tests.`)) {
                            eliminar.mutate(ex.id);
                          }
                        }}
                        aria-label="Eliminar examen"
                        style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fee2e2', borderRadius: 7, background: 'white', cursor: 'pointer', color: '#dc2626' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {abiertoEste && (
                    <div style={{ borderTop: '1px solid #f3f4f6' }}>
                      <PreguntasExamenAdmin examenId={ex.id} convocatorias={listaConvocatorias} onCambio={refrescar} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && (
        <ImportarPreguntasExamen
          modo={modal.modo}
          convocatoriaId={convocatoriaId}
          examenId={modal.modo === 'anadir' ? modal.examen.id : undefined}
          nombreExamen={modal.modo === 'anadir' ? modal.examen.nombre : undefined}
          ejercicios={ejercicios}
          convocatorias={listaConvocatorias}
          onCerrar={() => setModal(null)}
          onHecho={() => {
            if (modal.modo === 'anadir') queryClient.invalidateQueries({ queryKey: ['examen-oficial-preguntas', modal.examen.id] });
            setModal(null);
            refrescar();
          }}
        />
      )}
    </div>
  );
}
