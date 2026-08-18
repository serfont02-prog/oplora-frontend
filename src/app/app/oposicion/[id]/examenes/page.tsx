'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Suspense } from 'react';

const TIPO_LABEL: Record<string, string> = {
  test: 'Test',
  practico: 'Práctico',
  desarrollo: 'Desarrollo',
  oral: 'Oral',
  supuesto: 'Supuesto',
};

function ExamenesPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const convocatoriaId = searchParams.get('convocatoriaId');
  const { usuario } = useAuth();
  const [expandido, setExpandido] = useState<string | null>(null);

  const { data: convocatoria } = useQuery({
    queryKey: ['convocatoria', convocatoriaId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/${convocatoriaId}`);
      return res.data;
    },
    enabled: !!convocatoriaId,
  });

  const { data: oposicion } = useQuery({
    queryKey: ['oposicion', id],
    queryFn: async () => {
      const res = await api.get(`/oposiciones/${id}`);
      return res.data;
    },
    enabled: !!usuario,
  });

  const { data: examenes = [], isLoading } = useQuery({
    queryKey: ['examenes-usuario', convocatoriaId],
    queryFn: async () => {
      const res = await api.get(`/temas/examenes/convocatoria/${convocatoriaId}`);
      return res.data;
    },
    enabled: !!convocatoriaId,
  });

  const examenesAgrupados = examenes.reduce((acc: any, ex: any) => {
    const key = ex.anyo;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ex);
    return acc;
  }, {});

  const anyos = Object.keys(examenesAgrupados).sort((a, b) => Number(b) - Number(a));

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '0 1.25rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          Volver
        </button>
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#111827' }}>
          Exámenes · {convocatoria?.anyo}
        </span>
        <span style={{ width: '60px' }} />
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.25rem' }}>

        {/* Info */}
        <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '4px' }}>{oposicion?.nombre}</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#f3f4f6', color: '#6b7280' }}>
              Convocatoria {convocatoria?.anyo}
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#f3f4f6', color: '#6b7280' }}>
              {examenes.length} examen{examenes.length !== 1 ? 'es' : ''}
            </span>
            {convocatoria?.ejercicios?.length > 0 && (
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#E6F1FB', color: '#185FA5' }}>
                {convocatoria.ejercicios.map((e: any) => e.tipo).join(', ')}
              </span>
            )}
           </div>
        </div>

        {/* Lista exámenes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
  {examenes.map((ex: any) => (
    <div key={ex.id} style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '4px' }}>
          {ex.nombre ? ex.nombre : `${ex.parte ? `Ejercicio ${ex.parte} — ` : ''}${TIPO_LABEL[ex.tipo] ?? ex.tipo}`}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {ex.mes && <span style={{ fontSize: '11px', color: '#9ca3af' }}>{ex.mes} {ex.anyo}</span>}
          {ex.procesado && ex.totalPreguntas && (
            <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 500 }}>· {ex.totalPreguntas} preguntas</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
  {ex.urlPdf && (
    <button
      onClick={() => window.open(ex.urlPdf, '_blank')}
      style={{ padding: '6px 12px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '7px', fontSize: '12px', cursor: 'pointer', color: '#374151' }}
    >
      Ver PDF
    </button>
  )}
  {ex.procesado ? (
    <button
      onClick={() => router.push(`/app/test/${id}?examenId=${ex.id}&modo=simulacro`)}
      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#111827', color: 'white', border: 'none', borderRadius: '7px', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}
    >
      <Play size={11} />
      Simulacro
    </button>
  ) : (
    <span style={{ fontSize: '11px', color: '#9ca3af', padding: '6px' }}>Próximamente</span>
  )}
</div>
    </div>
  ))}
</div>
      </div>

      {/* Nav inferior */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #f3f4f6', display: 'flex', zIndex: 10 }}>
        {[
          { label: 'Inicio', icon: '🏠', path: '/app/dashboard' },
          { label: 'Retos', icon: '⚡', path: '/app/retos' },
          { label: 'Ranking', icon: '🏆', path: '/app/ranking' },
          { label: 'Alertas', icon: '🔔', path: '/app/alertas' },
        ].map(({ label, icon, path }) => (
          <button
            key={label}
            onClick={() => router.push(path)}
            style={{ flex: 1, padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ExamenesPageWrapper() {
  return (
    <Suspense>
      <ExamenesPage />
    </Suspense>
  );
}