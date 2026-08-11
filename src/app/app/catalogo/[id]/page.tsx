'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ArrowLeft, Lock } from 'lucide-react';

export default function ProgramaPublicoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { usuario } = useAuth();

  const { data: oposicion, isLoading } = useQuery({
    queryKey: ['oposicion-publica', id],
    queryFn: async () => {
      const res = await api.get(`/oposiciones/${id}`);
      return res.data;
    },
  });

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias-publicas', id],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${id}`);
      return res.data;
    },
  });

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ fontSize: '14px', color: '#9ca3af' }}>Cargando...</div>
    </div>
  );

  const convocatoriaActiva = convocatorias.find((c: any) => c.estado === 'activa');

  // Temas de ejemplo — luego vendrán de la API cuando implementemos el módulo de programas
  const temas = [
    'La Constitución española de 1978. Estructura y contenido general',
    'Derechos y deberes fundamentales. Garantías y suspensión',
    'La Corona. El Poder Legislativo. Las Cortes Generales',
    'El Gobierno y la Administración. El Poder Ejecutivo',
    'El Poder Judicial. El Tribunal Constitucional',
    'La organización territorial del Estado. Las Comunidades Autónomas',
    'La Unión Europea. Instituciones y funcionamiento',
    'La Ley 39/2015 de Procedimiento Administrativo Común',
    'El acto administrativo. Concepto, clases y elementos',
    'El procedimiento administrativo. Fases e iniciación',
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => router.push('/app/catalogo')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={14} />
            Catálogo
          </button>
        </div>
        {!usuario && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => router.push('/app/login')}
              style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: '7px', padding: '6px 12px', cursor: 'pointer' }}
            >
              Acceder
            </button>
            <button
              onClick={() => router.push('/app/registro')}
              style={{ fontSize: '12px', color: 'white', background: '#111827', border: 'none', borderRadius: '7px', padding: '6px 12px', cursor: 'pointer', fontWeight: 500 }}
            >
              Empezar gratis
            </button>
          </div>
        )}
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Info oposición */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{oposicion?.nombre}</div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>{oposicion?.administracion}</div>
        </div>

        {/* Convocatoria activa */}
        {convocatoriaActiva && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#15803d', marginBottom: '2px' }}>
                Convocatoria {convocatoriaActiva.anyo} activa
              </div>
              <div style={{ fontSize: '12px', color: '#166534' }}>
                {convocatoriaActiva.plazas?.toLocaleString()} plazas
                {convocatoriaActiva.fechaExamen && ` · Examen ${new Date(convocatoriaActiva.fechaExamen).toLocaleDateString('es-ES')}`}
              </div>
            </div>
            <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: '#15803d', color: 'white', fontWeight: 500 }}>Activa</span>
          </div>
        )}

        {/* Programa de temas */}
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Programa oficial</div>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{temas.length} temas (ejemplo)</span>
        </div>

        <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
          {temas.map((tema, i) => (
            <div
              key={i}
              onClick={() => !usuario && router.push('/app/registro')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i < temas.length - 1 ? '1px solid #f9fafb' : 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
            >
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#9ca3af', minWidth: '52px' }}>Tema {i + 1}</span>
              <span style={{ fontSize: '13px', color: '#111827', flex: 1 }}>{tema}</span>
              {!usuario && <Lock size={12} color="#d1d5db" />}
            </div>
          ))}
          <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
            + más temas en el programa completo
          </div>
        </div>

        {/* CTA si no está logado */}
        {!usuario && (
          <div style={{ background: '#111827', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>Estudia esta oposición con IA</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '1.25rem' }}>
              Tests ilimitados · Alertas de listas · Progreso por tema
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => router.push('/app/registro')}
                style={{ padding: '10px 20px', background: 'white', color: '#111827', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Empezar 7 días gratis
              </button>
              <button
                onClick={() => router.push('/app/login')}
                style={{ padding: '10px 20px', background: 'transparent', color: '#9ca3af', border: '1px solid #374151', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}
              >
                Ya tengo cuenta
              </button>
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '10px' }}>Sin tarjeta · Cancela cuando quieras · Desde 7€/mes</div>
          </div>
        )}

        {/* Si está logado mostrar botón ir a estudiar */}
        {usuario && (
          <button
            onClick={() => router.push(`/app/oposicion/${id}`)}
            style={{ width: '100%', padding: '12px', background: '#111827', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
          >
            Ir a estudiar esta oposición →
          </button>
        )}
      </div>
    </div>
  );
}