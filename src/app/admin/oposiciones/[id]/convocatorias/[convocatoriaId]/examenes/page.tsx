'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Plus, Trash2, Play, Upload } from 'lucide-react';

const TIPO_LABEL: Record<string, string> = {
  test: 'Test',
  practico: 'Práctico',
  desarrollo: 'Desarrollo',
  oral: 'Oral',
  supuesto: 'Supuesto',
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function ExamenesAdminPage() {
  const router = useRouter();
  const params = useParams();
  const oposicionId = params.id as string;
  const convocatoriaId = params.convocatoriaId as string;
  const queryClient = useQueryClient();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [form, setForm] = useState({
    nombre: '',
    anyo: new Date().getFullYear().toString(),
    tipo: 'unico',
    mes: '',
    parte: '1',
  });

  const { data: convocatoria } = useQuery({
    queryKey: ['convocatoria', convocatoriaId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/${convocatoriaId}`);
      return res.data;
    },
  });

  const { data: examenes = [], isLoading } = useQuery({
    queryKey: ['examenes-admin', convocatoriaId],
    queryFn: async () => {
      const res = await api.get(`/temas/examenes/convocatoria/${convocatoriaId}`);
      return res.data;
    },
  });

  const procesar = useMutation({
    mutationFn: async (examenId: string) => {
      await api.post(`/temas/examenes/${examenId}/procesar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examenes-admin', convocatoriaId] });
    },
  });

  const eliminar = useMutation({
    mutationFn: async (examenId: string) => {
      await api.delete(`/temas/examenes/${examenId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examenes-admin', convocatoriaId] });
    },
  });

  const subirExamen = async () => {
    if (!archivo) return;
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('nombre', form.nombre || `Examen ${form.anyo}`);
      formData.append('anyo', form.anyo);
      formData.append('tipo', form.tipo);
      formData.append('mes', form.mes);
      await api.post(`/temas/examenes/convocatoria/${convocatoriaId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['examenes-admin', convocatoriaId] });
      setModalAbierto(false);
      setArchivo(null);
      setForm({
        nombre: '',
        anyo: new Date().getFullYear().toString(),
        tipo: 'unico',
        mes: '',
        parte: '1',
      });
    } catch (e) {
      console.error('Error subiendo examen:', e);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Breadcrumb */}
      <div style={{ padding: '10px 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => router.push(`/admin/oposiciones/${oposicionId}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          Convocatorias
        </button>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>Exámenes · {convocatoria?.anyo}</span>
      </div>

      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Exámenes anteriores</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
            {examenes.length} examen{examenes.length !== 1 ? 'es' : ''} · Convocatoria {convocatoria?.anyo}
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

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f9fafb', padding: '1.5rem' }}>
        {isLoading ? (
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>Cargando...</div>
        ) : examenes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📝</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '12px' }}>No hay exámenes subidos</div>
            <button
              onClick={() => setModalAbierto(true)}
              style={{ fontSize: '13px', color: '#374151', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '8px', background: 'white', cursor: 'pointer' }}
            >
              Subir primer examen
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {examenes.map((examen: any) => (
              <div key={examen.id} style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '4px' }}>
                      {examen.nombre ?? `Examen ${examen.anyo}`}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#f3f4f6', color: '#6b7280' }}>
                        {TIPO_LABEL[examen.tipo] ?? examen.tipo}
                      </span>
                      {examen.mes && (
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#f3f4f6', color: '#6b7280' }}>
                          {examen.mes} {examen.anyo}
                        </span>
                      )}
                      {examen.procesado ? (
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#f0fdf4', color: '#15803d', fontWeight: 500 }}>
                          ✓ {examen.totalPreguntas} preguntas
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#fffbeb', color: '#92400e' }}>
                          Sin procesar
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {!examen.procesado && (
                      <button
                        onClick={() => procesar.mutate(examen.id)}
                        disabled={procesar.isPending}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#111827', color: 'white', border: 'none', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        <Play size={11} />
                        Procesar IA
                      </button>
                    )}
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

      {/* Modal subir examen */}
      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '480px', margin: '0 1rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '1.25rem' }}>Subir examen</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Examen mayo 2018 — Parte 1"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Año *</label>
                  <input
                    type="number"
                    value={form.anyo}
                    onChange={(e) => setForm({ ...form, anyo: e.target.value })}
                    min="2000" max="2030"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Ejercicio nº</label>
                <input
                    type="number"
                    value={form.parte}
                    onChange={(e) => setForm({ ...form, parte: e.target.value })}
                    min="1" max="5"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Mes</label>
                  <select
                    value={form.mes}
                    onChange={(e) => setForm({ ...form, mes: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="">Sin especificar</option>
                    {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                >
                  {Object.entries(TIPO_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>PDF del examen *</label>
                <div
                  style={{ border: '1px dashed #e5e7eb', borderRadius: '8px', padding: '1rem', textAlign: 'center', cursor: 'pointer', background: archivo ? '#f0fdf4' : 'white' }}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Upload size={20} color={archivo ? '#15803d' : '#9ca3af'} style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '12px', color: archivo ? '#15803d' : '#6b7280', fontWeight: archivo ? 500 : 400 }}>
                    {archivo ? archivo.name : 'Haz click para seleccionar el PDF'}
                  </div>
                </div>
                <input
                  id="file-input"
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
                disabled={!archivo || !form.anyo || subiendo}
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
