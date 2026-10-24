'use client';

// ⭐ Noticias — mismo sistema que el resto de la app: botón redondo a Inicio, filtro en píldora,
// tarjetas blancas con la sombra común, iconos lucide y sin emojis.

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Newspaper, Scale, Sparkles, X, ExternalLink, ChevronRight } from 'lucide-react';
import { BG_NEUTRAL as BG_APP, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '@/styles/tokens';

const SOMBRA = 'var(--c-sombra)';

type TipoNoticia = 'oficial' | 'legislativa' | 'oplora';

interface Convocatoria { id: string; anyo: number; estado: 'activa' | 'cerrada' | 'borrador'; }

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

const FILTROS: { key: TipoNoticia | 'todas'; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'oficial', label: 'Oficiales' },
  { key: 'legislativa', label: 'Normativa' },
  { key: 'oplora', label: 'OPLORA' },
];

const TIPO: Record<TipoNoticia, { Icon: any; bg: string; color: string; label: string }> = {
  oficial: { Icon: Newspaper, bg: 'var(--hx-e6f1fb)', color: 'var(--hx-185fa5)', label: 'Oficial' },
  legislativa: { Icon: Scale, bg: 'var(--hx-eeedfe)', color: 'var(--hx-3c3489)', label: 'Normativa' },
  oplora: { Icon: Sparkles, bg: 'var(--hx-fdf1dc)', color: 'var(--hx-b45309)', label: 'OPLORA' },
};

function fecha(f?: string | null): string {
  if (!f) return '';
  const d = new Date(f);
  const hoy = new Date();
  const mismoAnyo = d.getFullYear() === hoy.getFullYear();
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', ...(mismoAnyo ? {} : { year: 'numeric' }) });
}

function ModalNoticia({ noticia, onClose }: { noticia: Noticia; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  const t = TIPO[noticia.tipo] ?? TIPO.oficial;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--c-superficie)', borderRadius: '20px 20px 0 0', padding: '1.25rem', width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <t.Icon size={17} color={t.color} />
          </div>
          <div style={{ flex: 1, fontSize: 12, color: TEXT_MUTED, fontWeight: 600 }}>{t.label} · {fecha(noticia.fechaPublicacion ?? noticia.creadoEn)}</div>
          <button onClick={onClose} aria-label="Cerrar" style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'var(--hx-f3f4f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <X size={16} color={TEXT_SECONDARY} />
          </button>
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.35, marginBottom: 12 }}>{noticia.titulo}</div>
        <div style={{ fontSize: 14, color: 'var(--hx-374151)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{noticia.contenido}</div>
        {noticia.urlOrigen && (
          <a href={noticia.urlOrigen} target="_blank" rel="noopener noreferrer" style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Ver la fuente original <ExternalLink size={15} />
          </a>
        )}
      </div>
    </div>
  );
}

export default function NoticiasPage() {
  const params = useParams();
  const router = useRouter();
  const oposicionId = params.id as string;
  const [filtro, setFiltro] = useState<TipoNoticia | 'todas'>('todas');
  const [noticiaAbierta, setNoticiaAbierta] = useState<Noticia | null>(null);
  const queryClient = useQueryClient();

  // Al entrar en Noticias se dan por vistas (Inicio deja de destacar la última y el contador vuelve a cero)
  useEffect(() => {
    api.post('/noticias/marcar-vistas')
      .then(() => queryClient.invalidateQueries({ queryKey: ['noticias-novedades'] }))
      .catch(() => { /* no es crítico */ });
  }, [queryClient]);

  const { data: convocatorias = [], isPending: cargandoConv } = useQuery<Convocatoria[]>({
    queryKey: ['convocatorias-oposicion', oposicionId],
    queryFn: async () => (await api.get(`/convocatorias/oposicion/${oposicionId}`)).data,
    enabled: !!oposicionId,
  });
  const convocatoriaRelevante = convocatorias.find((c) => c.estado === 'activa') ?? convocatorias[0];

  const { data: noticias = [], isPending: cargandoNoticias } = useQuery<Noticia[]>({
    queryKey: ['noticias-feed', oposicionId, convocatoriaRelevante?.id],
    queryFn: async () => (await api.get('/noticias/feed', { params: { convocatoriaId: convocatoriaRelevante?.id, oposicionId } })).data,
    // ⭐ Antes, sin convocatorias no se pedía nada y se quedaba vacío aunque hubiera noticias de OPLORA
    enabled: !!oposicionId && !cargandoConv,
  });

  const cargando = cargandoConv || cargandoNoticias;
  // ⭐ Las más recientes primero (antes había que bajar hasta el final para ver las últimas)
  const fechaDe = (n: Noticia) => new Date(n.fechaPublicacion ?? n.creadoEn).getTime() || 0;
  const ordenadas = [...noticias].sort((a, b) => fechaDe(b) - fechaDe(a));
  const lista = filtro === 'todas' ? ordenadas : ordenadas.filter((n) => n.tipo === filtro);
  const cuenta = (k: TipoNoticia | 'todas') => (k === 'todas' ? noticias.length : noticias.filter((n) => n.tipo === k).length);

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 40 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
          <button onClick={() => router.push('/app/dashboard')} aria-label="Volver a Inicio" style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <ArrowLeft size={18} color={TEXT_PRIMARY} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Noticias</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>Lo último de tu oposición</div>
          </div>
        </div>

        {/* Filtro */}
        <div style={{ display: 'flex', background: 'var(--c-superficie)', borderRadius: 999, padding: 4, gap: 2, boxShadow: SOMBRA, overflowX: 'auto' }}>
          {FILTROS.map(({ key, label }) => {
            const activo = filtro === key;
            const n = cuenta(key);
            return (
              <button
                key={key}
                onClick={() => setFiltro(key)}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 999, border: 'none', background: activo ? 'var(--hxbg-0f172a)' : 'transparent', color: activo ? 'var(--c-primario-texto)' : TEXT_SECONDARY, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {label}{n > 0 && key !== 'todas' ? ` · ${n}` : ''}
              </button>
            );
          })}
        </div>

        {cargando ? (
          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: 16, fontSize: 13, color: TEXT_MUTED }}>Cargando noticias…</div>
        ) : lista.length === 0 ? (
          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: '24px 18px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--hx-e6f1fb)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <Newspaper size={24} color="var(--hx-185fa5)" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 4 }}>{filtro === 'todas' ? 'Sin noticias por ahora' : 'No hay noticias de este tipo'}</div>
            <div style={{ fontSize: 13, color: TEXT_MUTED }}>Te avisaremos en cuanto haya novedades.</div>
          </div>
        ) : (
          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
            {lista.map((n, i) => {
              const t = TIPO[n.tipo] ?? TIPO.oficial;
              const tieneContenido = !!n.contenido && n.contenido.trim().length > 0;
              const esClicable = tieneContenido || !!n.urlOrigen;
              const abrir = () => {
                if (tieneContenido) setNoticiaAbierta(n);
                else if (n.urlOrigen) window.open(n.urlOrigen, '_blank');
              };
              return (
                <div
                  key={n.id}
                  onClick={esClicable ? abrir : undefined}
                  style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '13px 14px', borderBottom: i < lista.length - 1 ? '1px solid var(--hx-eef0f3)' : 'none', cursor: esClicable ? 'pointer' : 'default', background: n.destacada ? 'var(--hx-fffbeb)' : 'transparent' }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <t.Icon size={17} color={t.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600 }}>
                      {t.label} · {fecha(n.fechaPublicacion ?? n.creadoEn)}
                      {n.destacada && <span style={{ marginLeft: 6, color: 'var(--hx-b45309)' }}>· Destacada</span>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.35, marginTop: 2 }}>{n.titulo}</div>
                    {n.resumen && (
                      <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 4, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {n.resumen}
                      </div>
                    )}
                  </div>
                  {esClicable && (tieneContenido ? <ChevronRight size={16} color="var(--hx-c4c9d2)" style={{ flexShrink: 0, marginTop: 10 }} /> : <ExternalLink size={15} color="var(--hx-c4c9d2)" style={{ flexShrink: 0, marginTop: 10 }} />)}
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
