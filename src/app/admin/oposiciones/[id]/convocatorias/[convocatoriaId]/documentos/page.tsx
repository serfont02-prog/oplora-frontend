'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import { api, DocumentoConvocatoria } from '@/lib/api';

const tipoLabel: Record<string, string> = {
  lista_admitidos_provisional: 'Lista admitidos provisional',
  lista_admitidos_definitiva: 'Lista admitidos definitiva',
  lista_excluidos_provisional: 'Lista excluidos provisional',
  lista_excluidos_definitiva: 'Lista excluidos definitiva',
  fecha_examen: 'Fecha examen',
  resultado_ejercicio: 'Resultado ejercicio',
  resolucion_convocatoria: 'Resolución convocatoria',
  nota_informativa: 'Nota informativa',
  cronograma: 'Cronograma',
  normas_especificas: 'Normas específicas',
  guia_inscripcion: 'Guía inscripción',
  otro: 'Otro',
};

const tipoBadge: Record<string, { bg: string; color: string }> = {
  lista_admitidos_provisional: { bg: '#f0fdf4', color: '#15803d' },
  lista_admitidos_definitiva: { bg: '#dcfce7', color: '#166534' },
  lista_excluidos_provisional: { bg: '#fef2f2', color: '#dc2626' },
  lista_excluidos_definitiva: { bg: '#fee2e2', color: '#991b1b' },
  fecha_examen: { bg: '#eff6ff', color: '#185FA5' },
  resultado_ejercicio: { bg: '#f5f3ff', color: '#6d28d9' },
  resolucion_convocatoria: { bg: '#fffbeb', color: '#92400e' },
  nota_informativa: { bg: '#f3f4f6', color: '#6b7280' },
  cronograma: { bg: '#eff6ff', color: '#185FA5' },
  normas_especificas: { bg: '#fffbeb', color: '#92400e' },
  guia_inscripcion: { bg: '#f3f4f6', color: '#6b7280' },
  otro: { bg: '#f3f4f6', color: '#9ca3af' },
};

const ordenTipos = [
  'resolucion_convocatoria',
  'lista_admitidos_provisional',
  'lista_admitidos_definitiva',
  'lista_excluidos_provisional',
  'lista_excluidos_definitiva',
  'fecha_examen',
  'resultado_ejercicio',
  'cronograma',
  'nota_informativa',
  'normas_especificas',
  'guia_inscripcion',
  'otro',
];

export default function DocumentosPage() {
  const router = useRouter();
  const params = useParams();
  const oposicionId = params.id as string;
  const convocatoriaId = params.convocatoriaId as string;
  const queryClient = useQueryClient();

  const { data: convocatoria } = useQuery({
    queryKey: ['convocatoria', convocatoriaId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/${convocatoriaId}`);
      return res.data;
    },
  });

  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ['documentos', convocatoriaId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/${convocatoriaId}/documentos`);
      return res.data as DocumentoConvocatoria[];
    },
  });

  const scrape = useMutation({
    mutationFn: async () => {
      await api.post(`/convocatorias/${convocatoriaId}/scrape`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos', convocatoriaId] });
    },
  });

  const grupos = documentos.reduce((acc, doc) => {
    const tipo = doc.tipo || 'otro';
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(doc);
    return acc;
  }, {} as Record<string, DocumentoConvocatoria[]>);

  const tiposOrdenados = ordenTipos.filter((t) => grupos[t]);

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
        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          Documentos {convocatoria?.anyo ? `· ${convocatoria.anyo}` : ''}
        </span>
      </div>

      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>
            Documentos — Convocatoria {convocatoria?.anyo}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
            {documentos.length} documentos detectados por el scraper
          </div>
        </div>
        {convocatoria?.urlInap && (
          <button
            onClick={() => scrape.mutate()}
            disabled={scrape.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#374151', background: 'white', cursor: 'pointer', opacity: scrape.isPending ? 0.5 : 1 }}
          >
            <RefreshCw size={13} style={{ animation: scrape.isPending ? 'spin 1s linear infinite' : 'none' }} />
            {scrape.isPending ? 'Actualizando...' : 'Actualizar'}
          </button>
        )}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f9fafb' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {isLoading ? (
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>Cargando documentos...</div>
        ) : documentos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📄</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '12px' }}>
              No hay documentos. Pulsa "Actualizar" para ejecutar el scraper.
            </div>
            {!convocatoria?.urlInap && (
              <div style={{ fontSize: '12px', color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', display: 'inline-block' }}>
                ⚠ Añade la URL del INAP en la convocatoria para poder usar el scraper
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {tiposOrdenados.map((tipo) => (
              <div key={tipo}>
                <div style={{ fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  {tipoLabel[tipo] ?? tipo}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {grupos[tipo].map((doc) => {
                    const badge = tipoBadge[doc.tipo] ?? tipoBadge.otro;
                    return (
                      <div
                        key={doc.id}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid #f3f4f6', borderRadius: '10px', padding: '10px 14px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500, background: badge.bg, color: badge.color, flexShrink: 0 }}>
                            {tipoLabel[doc.tipo] ?? doc.tipo}
                          </span>
                          <span style={{ fontSize: '13px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.titulo}
                          </span>
                          {doc.subtipo && (
                            <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>
                              · {doc.subtipo.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '12px' }}>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                            {new Date(doc.detectadoEn).toLocaleDateString('es-ES')}
                          </span>
                          <a
                            href={doc.urlPdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#185FA5', textDecoration: 'none', fontWeight: 500 }}
                          >
                            <ExternalLink size={12} />
                            Abrir
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}