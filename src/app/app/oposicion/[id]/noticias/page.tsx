'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Newspaper, Scale } from 'lucide-react';

const BG_APP = '#F4F5F7';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

const TIPO_ICONO_BG: Record<string, string> = {
  resolucion_convocatoria: '#FAEEDA',
  lista_admitidos_provisional: '#EAF3DE',
  lista_admitidos_definitiva: '#EAF3DE',
  lista_excluidos_provisional: '#FCEBEB',
  lista_excluidos_definitiva: '#FCEBEB',
  cronograma: '#E6F1FB',
  nota_informativa: '#F1EFE8',
  otro: '#F1EFE8',
};
const TIPO_ICONO_COLOR: Record<string, string> = {
  resolucion_convocatoria: '#854F0B',
  lista_admitidos_provisional: '#3B6D11',
  lista_admitidos_definitiva: '#3B6D11',
  lista_excluidos_provisional: '#A32D2D',
  lista_excluidos_definitiva: '#A32D2D',
  cronograma: '#185FA5',
  nota_informativa: '#5F5E5A',
  otro: '#5F5E5A',
};

function formatearFecha(fecha: string): string {
  const d = new Date(fecha);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getFullYear()).slice(-2)}`;
}

export default function NoticiasPage() {
  const params = useParams();
  const router = useRouter();
  const oposicionId = params.id as string;
  const [tab, setTab] = useState<'oficiales' | 'legislacion'>('oficiales');

  const { data: oficiales = [], isLoading: cargandoOficiales } = useQuery({
    queryKey: ['documentos-completos', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${oposicionId}/documentos-completos`);
      return res.data;
    },
  });

  const { data: legislacion = [], isLoading: cargandoLegislacion } = useQuery({
    queryKey: ['noticias-legislacion', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/leyes/oposicion/${oposicionId}/noticias-legislacion`);
      return res.data;
    },
    enabled: tab === 'legislacion',
  });

  const lista = tab === 'oficiales' ? oficiales : legislacion;
  const cargando = tab === 'oficiales' ? cargandoOficiales : cargandoLegislacion;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 40 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem' }}>

        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY, fontSize: 13, marginBottom: 16 }}
        >
          <ArrowLeft size={15} />
          Atrás
        </button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Noticias
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>
            Todo lo que necesitas saber
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#E5E7EB', borderRadius: 12, padding: 3, gap: 3, marginBottom: 18 }}>
          {[
            { key: 'oficiales', label: 'Oficiales', icon: Newspaper },
            { key: 'legislacion', label: 'Legislación', icon: Scale },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              style={{
                flex: 1, padding: '9px 4px', border: 'none', borderRadius: 9,
                background: tab === key ? 'white' : 'none',
                boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer', fontSize: 13,
                fontWeight: tab === key ? 700 : 500,
                color: tab === key ? TEXT_PRIMARY : TEXT_SECONDARY,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '3rem', fontSize: 13, color: TEXT_MUTED }}>Cargando...</div>
        ) : lista.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 14, padding: '3rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{tab === 'oficiales' ? '📰' : '⚖️'}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }}>Sin noticias por ahora</div>
            <div style={{ fontSize: 13, color: TEXT_MUTED }}>Te avisaremos en cuanto haya novedades</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lista.map((n: any) => (
              <div
                key={n.id}
                onClick={() => n.urlPdf && window.open(n.urlPdf, '_blank')}
                style={{
                  background: 'white', border: '1px solid #F1F5F9', borderRadius: 14,
                  padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
                  cursor: n.urlPdf ? 'pointer' : 'default', minHeight: 70, boxSizing: 'border-box',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: tab === 'oficiales' ? (TIPO_ICONO_BG[n.tipo] ?? '#F1EFE8') : '#EEEDFE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {tab === 'oficiales'
                    ? <Newspaper size={16} color={TIPO_ICONO_COLOR[n.tipo] ?? '#5F5E5A'} />
                    : <Scale size={16} color="#3C3489" />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 10, color: TEXT_SECONDARY, fontWeight: 700, flexShrink: 0 }}>
                      {formatearFecha(n.fecha)}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.3 }}>
                      {n.titular}
                    </span>
                  </div>
                  {n.descripcion && (
                    <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4, lineHeight: 1.5 }}>
                      {n.descripcion}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}