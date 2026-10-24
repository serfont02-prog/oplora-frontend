'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, ExternalLink, FileText } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { FooterNavegacion } from '@/app/app/dashboard/page';
import { BG_NEUTRAL } from '@/styles/tokens';

const tipoDocLabel: Record<string, string> = {
  resolucion_convocatoria: 'Convocatoria', // ⭐ antes 'Resolución'
  lista_admitidos_provisional: 'Lista admitidos',
  lista_admitidos_definitiva: 'Lista admitidos def.',
  lista_excluidos_provisional: 'Lista excluidos',
  lista_excluidos_definitiva: 'Lista excluidos def.',
  cronograma: 'Cronograma',
  normas_especificas: 'Normas específicas',
  guia_inscripcion: 'Guía inscripción',
  nota_informativa: 'Nota informativa',
  resultado_ejercicio: 'Resultado',
  otro: 'Documento',
};

const tipoDocColor: Record<string, { bg: string; color: string }> = {
  resolucion_convocatoria:      { bg: 'var(--hx-faeeda)', color: 'var(--hx-854f0b)' },
  lista_admitidos_provisional:  { bg: 'var(--hx-eaf3de)', color: 'var(--hx-3b6d11)' },
  lista_admitidos_definitiva:   { bg: 'var(--hx-eaf3de)', color: 'var(--hx-3b6d11)' },
  lista_excluidos_provisional:  { bg: 'var(--hx-fcebeb)', color: 'var(--hx-a32d2d)' },
  lista_excluidos_definitiva:   { bg: 'var(--hx-fcebeb)', color: 'var(--hx-a32d2d)' },
  cronograma:                   { bg: 'var(--hx-e6f1fb)', color: 'var(--hx-185fa5)' },
  nota_informativa:             { bg: 'var(--hx-f1efe8)', color: 'var(--hx-5f5e5a)' },
  normas_especificas:           { bg: 'var(--hx-faeeda)', color: 'var(--hx-854f0b)' },
  guia_inscripcion:             { bg: 'var(--hx-f1efe8)', color: 'var(--hx-5f5e5a)' },
  otro:                         { bg: 'var(--hx-f1efe8)', color: 'var(--hx-5f5e5a)' },
};

export default function OposicionDocumentosPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { usuario, cargando } = useAuth();

  

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  const { data: oposicion, isLoading } = useQuery({
    queryKey: ['oposicion-usuario', id],
    queryFn: async () => {
      const res = await api.get(`/oposiciones/${id}`);
      return res.data;
    },
    enabled: !!usuario,
  });

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias-usuario', id],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${id}`);
      return res.data;
    },
    enabled: !!usuario,
  });

  const convocatoriaActiva = convocatorias.find((c: any) => c.estado === 'activa');
  const ultimaConvocatoria = convocatorias[0];
  const convoc = convocatoriaActiva ?? ultimaConvocatoria;
  const convId = convocatoriaActiva?.id ?? ultimaConvocatoria?.id;

  const { data: documentos = [], isLoading: cargandoDocs } = useQuery({
    queryKey: ['documentos-usuario', convId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/${convId}/documentos`);
      return res.data;
    },
    enabled: !!convId,
  });

 
    if (cargando || isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG_NEUTRAL }}>
      <div style={{ fontSize: '14px', color: 'var(--hx-9ca3af)' }}>Cargando...</div>
    </div>
  );

  if (!oposicion) return null;

  return (
    <div style={{ minHeight: '100vh', background: BG_NEUTRAL, paddingBottom: '90px' }}>

      {/* Header sticky */}
      <div style={{ background: 'var(--c-superficie)', borderBottom: '1px solid var(--hx-f3f4f6)', padding: '0 1.25rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '8px 0', maxWidth: '560px', margin: '0 auto' }}>
          <button
            onClick={() => router.push('/app/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--hx-6b7280)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={14} />
            Inicio
          </button>
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--hx-111827)', textAlign: 'center', lineHeight: 1.4 }}>
            Documentos oficiales
          </span>
          <span style={{ width: '50px', flexShrink: 0 }} />
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Hero oscuro */}
        <div style={{
          background: 'var(--hxhero-0f172a)',
          borderRadius: '16px',
          padding: '18px 16px',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--hx-94a3b8)', fontWeight: 500, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Documentos oficiales
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.3 }}>
                {oposicion.nombre}
              </div>
            </div>
            <span style={{
              fontSize: '10px', fontWeight: 600, padding: '3px 9px',
              borderRadius: '999px', flexShrink: 0, marginTop: '2px',
              background: convocatoriaActiva ? 'rgba(22,163,74,0.2)' : 'rgba(239,68,68,0.15)',
              color: convocatoriaActiva ? '#4ade80' : 'var(--hx-fca5a5)',
            }}>
              {convocatoriaActiva ? 'Activa' : 'Cerrada'}
            </span>
          </div>

          {convoc && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--hx-94a3b8)' }}>Convocatoria {convoc.anyo}</span>
              {convoc.plazas && (
                <>
                  <span style={{ fontSize: '12px', color: 'var(--hx-475569)' }}>·</span>
                  <span style={{ fontSize: '12px', color: 'var(--hx-94a3b8)' }}>{convoc.plazas.toLocaleString()} plazas</span>
                </>
              )}
              {!cargandoDocs && (
                <>
                  <span style={{ fontSize: '12px', color: 'var(--hx-475569)' }}>·</span>
                  <span style={{ fontSize: '12px', color: 'var(--hx-94a3b8)' }}>{documentos.length} documentos</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Lista de documentos */}
        {cargandoDocs ? (
          <div style={{ background: 'var(--c-superficie)', border: '1px solid var(--hx-f3f4f6)', borderRadius: '14px', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: 'var(--hx-9ca3af)' }}>Cargando documentos...</div>
          </div>
        ) : documentos.length === 0 ? (
          <div style={{ background: 'var(--c-superficie)', border: '1px solid var(--hx-f3f4f6)', borderRadius: '14px', padding: '3rem', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--hx-f3f4f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <FileText size={22} color="var(--hx-9ca3af)" />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--hx-111827)', marginBottom: '4px' }}>Sin documentos</div>
            <div style={{ fontSize: '12px', color: 'var(--hx-9ca3af)' }}>
              No hay documentos publicados para esta convocatoria
            </div>
          </div>
        ) : (
        <div style={{ background: 'var(--c-superficie)', border: '1px solid var(--hx-f3f4f6)', borderRadius: '14px', overflow: 'hidden' }}>
          {documentos.map((doc: any, i: number) => {
            const color = tipoDocColor[doc.tipo] ?? tipoDocColor.otro;
            return (
              <a
                key={doc.id}
                href={doc.urlPdf}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '13px 14px',
                  borderBottom: i < documentos.length - 1 ? '1px solid var(--hx-f3f4f6)' : 'none',
                  textDecoration: 'none',
                  background: 'var(--c-superficie)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hx-f9fafb)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--c-superficie)')}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: color.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}>
                  <FileText size={15} color={color.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--hx-111827)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.titulo}
                  </div>
                  {doc.descripcion && (
                    <div style={{ fontSize: '11px', color: 'var(--hx-6b7280)', marginTop: '3px', lineHeight: 1.4 }}>
                      {doc.descripcion}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: 'var(--hx-9ca3af)', marginTop: '3px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ padding: '1px 6px', borderRadius: '20px', fontWeight: 500, background: color.bg, color: color.color, fontSize: '10px' }}>
                      {tipoDocLabel[doc.tipo] ?? 'Doc'}
                    </span>
                    <span>·</span>
                    <span>{new Date(doc.fechaPublicacion ?? doc.detectadoEn).toLocaleDateString('es-ES')}</span>
                    {doc.subtipo && <><span>·</span><span>{doc.subtipo.replace('_', ' ')}</span></>}
                  </div>
                </div>
                <ExternalLink size={13} color="var(--hx-d1d5db)" style={{ flexShrink: 0 }} />
              </a>
            );
          })}
        </div>
        )}

      </div>

      <FooterNavegacion usuario={usuario} oposicionId={id} />
    </div>
  );
}
