'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Newspaper, Scale, Sparkles, X } from 'lucide-react';

const BG_APP = '#F4F5F7';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

type TipoNoticia = 'oficial' | 'legislativa' | 'oplora';

interface Convocatoria {
  id: string;
  anyo: number;
  estado: 'activa' | 'cerrada' | 'borrador';
}

interface Noticia {
  id: string;
  tipo: TipoNoticia;
  titulo: string;
  resumen?: string | null;
  contenido?: string | null;
  urlOrigen?: string | null;
  destacada: boolean;
  fechaPublicacion?: string | null;
  creadoEn: string;
}

function ModalNoticia({ noticia, onClose }: { noticia: Noticia; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1.25rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 520, maxHeight: '80vh', overflowY: 'auto', boxSizing: 'border-box' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.35 }}>{noticia.titulo}</div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 2, display: 'flex' }}
            aria-label="Cerrar"
          >
            <X size={18} color={TEXT_MUTED} />
          </button>
        </div>
        <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {noticia.contenido}
        </div>
      </div>
    </div>
  );
}

const FILTROS: { key: TipoNoticia | 'todas'; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'oficial', label: 'Oficiales' },
  { key: 'legislativa', label: 'Legislativas' },
  { key: 'oplora', label: 'OPLORA' },
];

const TIPO_ICONO: Record<TipoNoticia, any> = {
  oficial: Newspaper,
  legislativa: Scale,
  oplora: Sparkles,
};

const TIPO_ICONO_BG: Record<TipoNoticia, string> = {
  oficial: '#E6F1FB',
  legislativa: '#EEEDFE',
  oplora: '#FDF1DC',
};

const TIPO_ICONO_COLOR: Record<TipoNoticia, string> = {
  oficial: '#185FA5',
  legislativa: '#3C3489',
  oplora: '#B45309',
};

function formatearFecha(fecha?: string | null): string {
  if (!fecha) return '';
  const d = new Date(fecha);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getFullYear()).slice(-2)}`;
}

export default function NoticiasPage() {
  const params = useParams();
  const router = useRouter();
  const oposicionId = params.id as string;
  const [filtro, setFiltro] = useState<TipoNoticia | 'todas'>('todas');
  const [noticiaAbierta, setNoticiaAbierta] = useState<Noticia | null>(null);

  // Misma lógica que usaba WidgetNoticias / ConvocatoriaService.getNoticiasByOposicion:
  // se elige la convocatoria en estado 'activa', y si no hay ninguna, la más reciente.
  const { data: convocatorias = [] } = useQuery<Convocatoria[]>({
    queryKey: ['convocatorias-oposicion', oposicionId],
    queryFn: async () => (await api.get(`/convocatorias/oposicion/${oposicionId}`)).data,
    enabled: !!oposicionId,
  });

  const convocatoriaRelevante = convocatorias.find((c) => c.estado === 'activa') ?? convocatorias[0];

  const { data: noticias = [], isLoading } = useQuery<Noticia[]>({
    queryKey: ['noticias-feed', oposicionId, convocatoriaRelevante?.id],
    queryFn: async () => {
      const res = await api.get('/noticias/feed', {
        params: { convocatoriaId: convocatoriaRelevante?.id, oposicionId },
      });
      return res.data;
    },
    enabled: !!oposicionId && convocatorias.length > 0,
  });

  const lista = filtro === 'todas' ? noticias : noticias.filter((n) => n.tipo === filtro);

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

        {/* Chips de filtro */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, overflowX: 'auto' }}>
          {FILTROS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFiltro(key)}
              style={{
                padding: '7px 14px', borderRadius: 20, border: filtro === key ? 'none' : '1px solid #E5E7EB',
                background: filtro === key ? TEXT_PRIMARY : 'white',
                color: filtro === key ? 'white' : TEXT_SECONDARY,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', fontSize: 13, color: TEXT_MUTED }}>Cargando...</div>
        ) : lista.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 14, padding: '3rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📰</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }}>Sin noticias por ahora</div>
            <div style={{ fontSize: 13, color: TEXT_MUTED }}>Te avisaremos en cuanto haya novedades</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lista.map((n) => {
              const Icon = TIPO_ICONO[n.tipo];
              const tieneContenido = !!n.contenido && n.contenido.trim().length > 0;
              const esClicable = tieneContenido || !!n.urlOrigen;
              const alClicar = () => {
                if (tieneContenido) setNoticiaAbierta(n);
                else if (n.urlOrigen) window.open(n.urlOrigen, '_blank');
              };
              return (
                <div
                  key={n.id}
                  onClick={esClicable ? alClicar : undefined}
                  style={{
                    background: 'white', border: n.destacada ? '1px solid #FDE68A' : '1px solid #F1F5F9', borderRadius: 14,
                    padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
                    cursor: esClicable ? 'pointer' : 'default', minHeight: 70, boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { if (esClicable) e.currentTarget.style.borderColor = '#D1D5DB'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = n.destacada ? '#FDE68A' : '#F1F5F9'; }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: TIPO_ICONO_BG[n.tipo], display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} color={TIPO_ICONO_COLOR[n.tipo]} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, color: TEXT_SECONDARY, fontWeight: 700, flexShrink: 0 }}>
                        {formatearFecha(n.fechaPublicacion ?? n.creadoEn)}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.3 }}>
                        {n.titulo}
                      </span>
                    </div>
                    {n.resumen && (
                      <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4, lineHeight: 1.5 }}>
                        {n.resumen}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {noticiaAbierta && <ModalNoticia noticia={noticiaAbierta} onClose={() => setNoticiaAbierta(null)} />}
    </div>
  );
}
