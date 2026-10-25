'use client';

// ⭐ Página de un tema — mismo sistema que el resto de la app: botones redondos, accesos en círculos
// flotantes, tarjetas blancas con la sombra común, títulos suaves y solo iconos lucide.

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  ArrowLeft, ChevronLeft, ChevronRight, BookOpen, FileText, Upload, Lock, CalendarDays, CalendarCheck,
  NotebookPen, BarChart3, Library, ClipboardCheck, Layers, CheckCircle2, Scale, X, Target, Flame, Clock,
} from 'lucide-react';
import ModalHacerTest from '@/components/entrenamiento/ModalHacerTest';
import { FooterNavegacion } from '@/app/app/dashboard/page';
import { renderReferencias, construirMapaSiglas } from '@/lib/referenciasArticulos';
import { TarjetaTemarioPapel } from '@/components/temario/TemarioPapel';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, BG_TEMA, COLOR_FC, COLOR_FC_BG } from '@/styles/tokens';

type TabTema = 'material' | 'mi-estudio' | 'progreso';

const BG_APP = BG_TEMA;
const SOMBRA = 'var(--c-sombra)';
const BORDER = 'var(--hx-f0ece6)';
const COLOR_ESTUDIAR = 'var(--hx-1f7cff)';
const COLOR_TEST = 'var(--hx-4d7c0f)';
const TZ = 'Europe/Madrid';

/** "YYYY-MM-DD" de una fecha en Madrid (antes se usaba toISOString, que es UTC y fallaba de noche) */
const ymdMadrid = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const sumarDias = (dias: number) => { const d = new Date(); d.setDate(d.getDate() + dias); return ymdMadrid(d); };
const fechaLarga = (ymdOIso: string) => {
  const ymd = ymdOIso.slice(0, 10);
  const [y, m, d] = ymd.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d, 12)));
};

const fechaCorta = (ymd: string) => {
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d, 12)));
};

function TituloSeccion({ children, derecha }: { children: React.ReactNode; derecha?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px', gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY }}>{children}</span>
      {derecha}
    </div>
  );
}

function BotonRedondo({ onClick, label, disabled, children, size = 38 }: { onClick: () => void; label: string; disabled?: boolean; children: React.ReactNode; size?: number }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      style={{ width: size, height: size, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: disabled ? 'none' : SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', flexShrink: 0, opacity: disabled ? 0.4 : 1 }}
    >
      {children}
    </button>
  );
}

/** Acceso en círculo flotante (mismo estilo que los de Inicio) */
function Acceso({ label, sub, Icon, color, onClick, badge }: { label: string; sub?: string; Icon: any; color: string; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, minWidth: 0 }}>
      <div style={{ position: 'relative', width: 52, height: 52, borderRadius: '50%', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color={color} />
        {!!badge && badge > 0 && (
          <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: '#DC2626', color: 'white', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--c-superficie)', boxSizing: 'border-box' }}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span style={{ fontSize: 11, color: TEXT_PRIMARY, fontWeight: 600 }}>{label}</span>
      {sub && <span style={{ fontSize: 10, color: TEXT_MUTED, marginTop: -4 }}>{sub}</span>}
    </button>
  );
}

function CirculoDato({ valor, porcentaje, color, label, sub }: { valor: string; porcentaje: number; color: string; label: string; sub: string }) {
  const D = 78;
  const g = 6;
  const r = (D - 12 - g) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <div style={{ position: 'relative', width: D, height: D, borderRadius: '50%', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={D - 12} height={D - 12} style={{ position: 'absolute', top: 6, left: 6, transform: 'rotate(-90deg)' }}>
          <circle cx={(D - 12) / 2} cy={(D - 12) / 2} r={r} fill="none" stroke="var(--hx-eef0f3)" strokeWidth={g} />
          {porcentaje > 0 && (
            <circle cx={(D - 12) / 2} cy={(D - 12) / 2} r={r} fill="none" stroke={color} strokeWidth={g} strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c - (Math.min(100, porcentaje) / 100) * c} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
          )}
        </svg>
        <span style={{ position: 'relative', fontSize: 15, fontWeight: 800, color: TEXT_PRIMARY }}>{valor}</span>
      </div>
      <span style={{ fontSize: 12, color: TEXT_PRIMARY, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
      <span style={{ fontSize: 10, color: TEXT_MUTED, marginTop: -3, textAlign: 'center' }}>{sub}</span>
    </div>
  );
}

function FilaLista({ Icon, color, bg, titulo, sub, onClick, href, ultima, derecha }: {
  Icon: any; color: string; bg: string; titulo?: string; sub?: string; onClick?: () => void; href?: string; ultima: boolean; derecha?: React.ReactNode;
}) {
  const contenido = (
    <>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={19} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* ⭐ Hasta 3 líneas: antes se cortaba en una y de "RD 45/2004, de…" solo se veía el número */}
        <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>{titulo}</div>
        {sub && <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2, lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{sub}</div>}
      </div>
      {derecha ?? ((onClick || href) && <ChevronRight size={16} color="var(--hx-c4c9d2)" style={{ flexShrink: 0 }} />)}
    </>
  );
  const estilo: React.CSSProperties = {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', textAlign: 'left',
    background: 'none', border: 'none', borderBottom: ultima ? 'none' : `1px solid ${BORDER}`,
    cursor: onClick || href ? 'pointer' : 'default', textDecoration: 'none', boxSizing: 'border-box',
  };
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" style={estilo}>{contenido}</a>;
  if (onClick) return <button onClick={onClick} style={estilo}>{contenido}</button>;
  return <div style={estilo}>{contenido}</div>;
}

const Caja = ({ children, padding = 0 }: { children: React.ReactNode; padding?: number }) => (
  <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden', padding }}>{children}</div>
);

export default function TemaPage() {
  const router = useRouter();
  const params = useParams();
  const oposicionId = params.oposicionId as string;
  const numeroTema = params.numeroTema as string;
  const { usuario, cargando } = useAuth();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<TabTema>('material');
  // ⭐ Los accesos "Notas" y "Repaso" abren Mi estudio y bajan hasta su sección (antes solo
  // cambiaban de pestaña y parecía que no hacían nada).
  const [irA, setIrA] = useState<'notas' | 'repaso' | null>(null);
  const refNotas = useRef<HTMLElement | null>(null);
  const refRepaso = useRef<HTMLElement | null>(null);
  const refTextarea = useRef<HTMLTextAreaElement | null>(null);
  const abrirSeccion = (s: 'notas' | 'repaso') => { setTab('mi-estudio'); setIrA(s); };
  useEffect(() => {
    if (!irA || tab !== 'mi-estudio') return;
    const t = setTimeout(() => {
      const el = irA === 'notas' ? refNotas.current : refRepaso.current;
      if (el) {
        // Deja sitio para la cabecera fija
        const y = el.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      if (irA === 'notas') refTextarea.current?.focus({ preventScroll: true });
      setIrA(null);
    }, 60);
    return () => clearTimeout(t);
  }, [irA, tab]);
  const [notaTexto, setNotaTexto] = useState('');
  const [estadoNota, setEstadoNota] = useState<'' | 'guardando' | 'guardado' | 'error'>('');
  const notaTimeoutRef = useRef<any>(null);
  const [fechaElegida, setFechaElegida] = useState('');
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [repasoProgramado, setRepasoProgramado] = useState<string | null>(null); // "YYYY-MM-DD"
  const [programando, setProgramando] = useState(false);
  const [errorRepaso, setErrorRepaso] = useState('');
  const [subiendoApunte, setSubiendoApunte] = useState(false);
  const [errorSubida, setErrorSubida] = useState('');
  const [modalTest, setModalTest] = useState(false);
  const [tituloExpandido, setTituloExpandido] = useState(false);

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  const { data: convocatorias = [], isPending: convPendiente, isError: convocatoriasError } = useQuery({
    queryKey: ['convocatorias-tema', oposicionId],
    queryFn: async () => (await api.get(`/convocatorias/oposicion/${oposicionId}`)).data,
    enabled: !!usuario,
  });
  const convocatoria = convocatorias.find((c: any) => c.estado === 'activa') ?? convocatorias[0];

  const { data: temas = [], isPending: temasPendiente, isError: temasError } = useQuery({
    queryKey: ['temas-tema', convocatoria?.id],
    queryFn: async () => (await api.get(`/temas/convocatoria/${convocatoria.id}`)).data,
    enabled: !!convocatoria?.id,
  });

  const num = parseInt(numeroTema);
  const tema = temas.find((t: any) => t.numero === num);
  // ⭐ Anterior/siguiente por orden real (antes número ±1: si faltaba un número, se cortaba la navegación)
  const ordenados = useMemo(() => [...temas].sort((a: any, b: any) => a.numero - b.numero), [temas]);
  const idx = ordenados.findIndex((t: any) => t.numero === num);
  const temaAnterior = idx > 0 ? ordenados[idx - 1] : null;
  const temaSiguiente = idx >= 0 && idx < ordenados.length - 1 ? ordenados[idx + 1] : null;

  const { data: progresoCompleto, isPending: progresoPendiente, isError: progresoCompletoError } = useQuery({
    queryKey: ['progreso-completo-tema', tema?.id, oposicionId],
    queryFn: async () => (await api.get(`/temas/${tema.id}/progreso-completo?oposicionId=${oposicionId}`)).data,
    enabled: !!tema?.id && !!oposicionId,
  });

  const { data: normativa = [], isPending: normativaPendiente, isError: normativaError } = useQuery({
    queryKey: ['normativa-tema', tema?.id],
    queryFn: async () => (await api.get(`/temas/${tema.id}/normativa`)).data,
    enabled: !!tema?.id,
  });

  const { data: leyesOposicion = [] } = useQuery({
    queryKey: ['leyes-siglas', oposicionId],
    queryFn: async () => (await api.get(`/leyes/oposicion/${oposicionId}`)).data,
    enabled: !!oposicionId,
  });
  const mapaSiglas = useMemo(() => construirMapaSiglas(leyesOposicion), [leyesOposicion]);

  const abrirArticuloDesdeContexto = async (numero: string, versionLeyId: string) => {
    try {
      const res = await api.get(`/normativa/articulo-por-numero/${versionLeyId}/${numero}`);
      if (res.data?.id) router.push(`/app/articulo/${res.data.id}?oposicionId=${oposicionId}`);
    } catch { /* referencia sin artículo */ }
  };

  // Normativa agrupada por ley y ordenada por número de artículo
  const normativaPorLey = useMemo(() => {
    if (!normativa?.length) return {};
    const agrupado = normativa.reduce((acc: any, item: any) => {
      const ley = item.articulo?.capitulo?.tituloRef?.versionLey?.ley
        ?? item.articulo?.seccion?.capitulo?.tituloRef?.versionLey?.ley
        ?? item.articulo?.tituloRef?.versionLey?.ley;
      const leyNombre = ley?.nombre ?? 'Normativa';
      if (!acc[leyNombre]) acc[leyNombre] = { leyId: ley?.id, articulos: [] };
      if (item.articulo) acc[leyNombre].articulos.push({ id: item.articulo.id, numero: item.articulo.numero });
      return acc;
    }, {});
    const orden = (n: string) => { const m = /^\d+/.exec(n ?? ''); return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER; };
    Object.values(agrupado).forEach((d: any) => {
      d.articulos.sort((a: any, b: any) => (orden(a.numero) - orden(b.numero)) || (a.numero ?? '').localeCompare(b.numero ?? ''));
    });
    return agrupado;
  }, [normativa]);

  const { data: progresoTest } = useQuery({
    queryKey: ['progreso-test-tema', tema?.id, oposicionId],
    queryFn: async () => (await api.get(`/test/progreso/${oposicionId}/${tema.id}`)).data,
    enabled: !!tema?.id,
  });

  const { data: statsFC } = useQuery({
    queryKey: ['stats-fc-tema', tema?.id, oposicionId],
    queryFn: async () => (await api.get(`/flashcards/stats/${oposicionId}/${tema.id}`)).data,
    enabled: !!tema?.id,
  });

  const { data: limites } = useQuery({
    queryKey: ['limites', usuario?.id],
    queryFn: async () => (await api.get('/usuarios/limites')).data,
    enabled: !!usuario,
  });

  const { data: progresoSesiones } = useQuery({
    queryKey: ['progreso-sesiones', tema?.id],
    queryFn: async () => (await api.get(`/sesiones-tema/${tema.id}/progreso`)).data,
    enabled: !!tema?.id,
  });

  const { data: apuntes = [], isPending: apuntesPendiente, isError: apuntesError } = useQuery({
    queryKey: ['apuntes-tema', tema?.id],
    queryFn: async () => (await api.get(`/apuntes-usuario/tema/${tema.id}`)).data,
    enabled: !!tema?.id,
  });

  const { data: apuntesOplora = [], isPending: apuntesOploraPendiente, isError: apuntesOploraError } = useQuery({
    queryKey: ['apuntes-oplora-tema', tema?.id],
    queryFn: async () => (await api.get(`/apuntes-oplora/tema/${tema.id}`)).data,
    enabled: !!tema?.id,
  });

  const { data: nota, isFetched: notaCargada } = useQuery({
    queryKey: ['nota-tema', tema?.id],
    queryFn: async () => (await api.get(`/normativa/nota-tema/${tema.id}`)).data,
    enabled: !!tema?.id,
  });

  // ⭐ Al cambiar de tema se reinician las notas y el repaso. Antes, si el tema nuevo no tenía
  // nota, se quedaba el texto del anterior (y al escribir se guardaba en el tema nuevo).
  useEffect(() => {
    clearTimeout(notaTimeoutRef.current);
    setNotaTexto(nota?.contenido ?? '');
    setRepasoProgramado(nota?.fechaRepaso ? String(nota.fechaRepaso).slice(0, 10) : null);
    setEstadoNota('');
    setFechaElegida('');
    setMostrarCalendario(false);
    setErrorRepaso('');
  }, [nota, tema?.id]);

  // Registrar la sesión de estudio (alimenta "Continúa donde lo dejaste")
  useEffect(() => {
    if (!tema?.id) return;
    api.post(`/sesiones-tema/${tema.id}`)
      .then(() => queryClient.invalidateQueries({ queryKey: ['ultimo-tema-estudiado'] }))
      .catch(() => { /* no bloquea la página */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tema?.id]);

  const refrescarRepasos = () => {
    queryClient.invalidateQueries({ queryKey: ['nota-tema', tema?.id] });
    queryClient.invalidateQueries({ queryKey: ['repasos-pendientes'] });
  };

  const guardarRepaso = async (fecha: string | null) => {
    if (!tema?.id) return;
    setProgramando(true);
    setErrorRepaso('');
    try {
      await api.post(`/normativa/nota-tema/${tema.id}/programar`, { fecha });
      setRepasoProgramado(fecha);
      setFechaElegida('');
      setMostrarCalendario(false);
      refrescarRepasos();
    } catch {
      setErrorRepaso('No se ha podido guardar. Inténtalo de nuevo.');
    } finally {
      setProgramando(false);
    }
  };

  const handleNotaChange = (texto: string) => {
    setNotaTexto(texto);
    setEstadoNota('');
    clearTimeout(notaTimeoutRef.current);
    const temaId = tema?.id;
    notaTimeoutRef.current = setTimeout(async () => {
      if (!temaId) return;
      setEstadoNota('guardando');
      try {
        await api.post(`/normativa/nota-tema/${temaId}`, { contenido: texto });
        setEstadoNota('guardado');
      } catch {
        setEstadoNota('error'); // ⭐ antes fallaba en silencio
      }
    }, 1200);
  };

  // Deslizar para cambiar de tema (solo gestos claramente horizontales y fuera de campos de texto)
  const toque = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const el = e.target as HTMLElement;
    if (el.closest('textarea, input, [data-sin-deslizar]')) { toque.current = null; return; }
    toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!toque.current) return;
    const dx = e.changedTouches[0].clientX - toque.current.x;
    const dy = e.changedTouches[0].clientY - toque.current.y;
    toque.current = null;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.8) return;
    if (dx < 0 && temaSiguiente) router.push(`/app/tema/${oposicionId}/${temaSiguiente.numero}`);
    else if (dx > 0 && temaAnterior) router.push(`/app/tema/${oposicionId}/${temaAnterior.numero}`);
  };

  if (cargando) return null;

  const cargandoTema = !usuario || convPendiente || (!!convocatoria?.id && temasPendiente);

  if (cargandoTema) {
    return (
      <div style={{ minHeight: '100vh', background: BG_APP, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={24} color="var(--hx-8b7355)" />
        </div>
        <span style={{ fontSize: 13, color: TEXT_SECONDARY, fontWeight: 600 }}>Cargando tema…</span>
      </div>
    );
  }

  // ⭐ Error o tema inexistente: antes se quedaba en "Cargando…" para siempre si el número no existía
  if (convocatoriasError || temasError || !tema) {
    return (
      <div style={{ minHeight: '100vh', background: BG_APP, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
        <div style={{ background: 'var(--c-superficie)', borderRadius: 20, padding: '1.75rem 1.5rem', maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: SOMBRA }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>
            {convocatoriasError || temasError ? 'No se ha podido cargar el tema' : `No existe el tema ${numeroTema}`}
          </div>
          <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 16 }}>
            {convocatoriasError || temasError ? 'Comprueba la conexión e inténtalo de nuevo.' : 'Puede que el temario de tu convocatoria haya cambiado.'}
          </div>
          <button onClick={() => router.push(`/app/tema/${oposicionId}?modo=estudiar`)} style={{ width: '100%', padding: 12, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Ir al temario
          </button>
        </div>
      </div>
    );
  }

  const porcentajeProgreso = progresoCompleto?.porcentajeTotal ?? 0;
  const completado = porcentajeProgreso >= 80;
  const repasoDesbloqueado = completado;
  const hoy = ymdMadrid(new Date());
  const repasoHoy = !!repasoProgramado && repasoProgramado <= hoy;
  const totalFC = statsFC?.total ?? 0;
  const maxPorTema = limites?.limites?.preguntasPorTema ?? 20;
  const numRepasoCompleto = Math.max(5, Math.min(20, maxPorTema));

  const colorAnillo = completado ? 'var(--hx-16a34a)' : porcentajeProgreso > 0 ? COLOR_ESTUDIAR : 'var(--hx-d1d5db)';
  const R = 30;
  const C = 2 * Math.PI * R;

  const TABS: { key: TabTema; label: string; icon: any }[] = [
    { key: 'material', label: 'Material', icon: Library },
    { key: 'mi-estudio', label: 'Mi estudio', icon: NotebookPen },
    { key: 'progreso', label: 'Progreso', icon: BarChart3 },
  ];

  const desglose = progresoCompleto?.desglose;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 90 }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* Cabecera fija: volver al temario y cambiar de tema */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: BG_APP, padding: '12px 1.25rem 8px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <BotonRedondo onClick={() => router.push(`/app/tema/${oposicionId}?modo=estudiar`)} label="Volver al temario">
            <ArrowLeft size={18} color={TEXT_PRIMARY} />
          </BotonRedondo>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BotonRedondo size={34} disabled={!temaAnterior} onClick={() => temaAnterior && router.push(`/app/tema/${oposicionId}/${temaAnterior.numero}`)} label="Tema anterior">
              <ChevronLeft size={17} color={TEXT_PRIMARY} />
            </BotonRedondo>
            <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, minWidth: 64, textAlign: 'center' }}>Tema {numeroTema}</span>
            <BotonRedondo size={34} disabled={!temaSiguiente} onClick={() => temaSiguiente && router.push(`/app/tema/${oposicionId}/${temaSiguiente.numero}`)} label="Tema siguiente">
              <ChevronRight size={17} color={TEXT_PRIMARY} />
            </BotonRedondo>
          </div>
          <span style={{ width: 38, flexShrink: 0 }} />
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '6px 1.25rem 0', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Título y progreso del tema */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 4px' }}>
          <div style={{ position: 'relative', width: 70, height: 70, borderRadius: '50%', background: 'var(--c-superficie)', boxShadow: SOMBRA, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="70" height="70" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
              <circle cx="35" cy="35" r={R} fill="none" stroke="var(--hx-f1ede6)" strokeWidth="4.5" />
              {porcentajeProgreso > 0 && (
                <circle cx="35" cy="35" r={R} fill="none" stroke={colorAnillo} strokeWidth="4.5" strokeLinecap="round"
                  strokeDasharray={C} strokeDashoffset={C - (Math.min(porcentajeProgreso, 100) / 100) * C} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
              )}
            </svg>
            {completado
              ? <CheckCircle2 size={26} color="var(--hx-16a34a)" />
              : <span style={{ fontSize: 16, fontWeight: 800, color: porcentajeProgreso > 0 ? TEXT_PRIMARY : TEXT_MUTED }}>{porcentajeProgreso}%</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, marginBottom: 2 }}>
              {[tema.bloque, completado ? 'Completado' : porcentajeProgreso > 0 ? 'En curso' : 'Sin empezar'].filter(Boolean).join(' · ')}
            </div>
            <div style={{
              fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.35,
              display: '-webkit-box', WebkitLineClamp: tituloExpandido ? 'unset' : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {tema.titulo}
            </div>
            {tema.titulo?.length > 90 && (
              <button onClick={() => setTituloExpandido(!tituloExpandido)} style={{ fontSize: 11, color: COLOR_ESTUDIAR, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2, fontWeight: 600 }}>
                {tituloExpandido ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </div>
        </div>

        {/* Repaso programado para hoy */}
        {repasoHoy && (
          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, padding: 14, boxShadow: SOMBRA, display: 'flex', alignItems: 'center', gap: 12, border: `1.5px solid ${COLOR_ESTUDIAR}` }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--hx-eaf2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CalendarCheck size={20} color={COLOR_ESTUDIAR} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>
                {repasoProgramado === hoy ? 'Hoy toca repasar este tema' : 'Tienes pendiente repasar este tema'}
              </div>
              <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>Cuando acabes, márcalo como hecho</div>
            </div>
            <button
              onClick={() => guardarRepaso(null)}
              disabled={programando}
              style={{ border: 'none', background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
            >
              Hecho
            </button>
          </div>
        )}

        {/* Accesos rápidos en círculos flotantes */}
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '2px 4px' }}>
          <Acceso label="Test" sub="Del tema" Icon={ClipboardCheck} color={COLOR_TEST} onClick={() => setModalTest(true)} />
          <Acceso
            label="Flashcards" sub={totalFC > 0 ? `${totalFC} tarjetas` : 'Repasar'} Icon={Layers} color={COLOR_FC}
            onClick={() => router.push(`/app/flashcards/repasar?temaId=${tema.id}&oposicionId=${oposicionId}&numeroTema=${numeroTema}`)}
          />
          <Acceso label="Notas" sub={notaTexto ? 'Escritas' : 'Escribir'} Icon={NotebookPen} color="var(--hx-8b7355)" onClick={() => abrirSeccion('notas')} />
          <Acceso
            label="Repaso" sub={repasoProgramado ? (repasoHoy ? 'Hoy' : fechaCorta(repasoProgramado)) : 'Programar'}
            Icon={CalendarDays} color={COLOR_ESTUDIAR} onClick={() => abrirSeccion('repaso')}
          />
        </div>

        {/* Pestañas */}
        <div style={{ display: 'flex', background: 'var(--c-superficie)', borderRadius: 999, padding: 4, gap: 4, boxShadow: SOMBRA }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '9px 4px', border: 'none', borderRadius: 999, cursor: 'pointer',
                background: tab === key ? 'var(--hxbg-0f172a)' : 'transparent', color: tab === key ? 'var(--c-primario-texto)' : TEXT_SECONDARY,
                fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* ── MATERIAL ── */}
        {tab === 'material' && (
          <>
            <TarjetaTemarioPapel oposicionId={oposicionId} lugar="tema" />

            <section>
              <TituloSeccion derecha={<span style={{ fontSize: 11, color: TEXT_MUTED }}>{apuntesOplora.length}</span>}>Apuntes OPLORA</TituloSeccion>
              <Caja>
                {apuntesOploraPendiente ? <div style={{ padding: 14, fontSize: 13, color: TEXT_MUTED }}>Cargando…</div>
                  : apuntesOploraError ? <div style={{ padding: 14, fontSize: 13, color: 'var(--hx-b91c1c)' }}>No se han podido cargar los apuntes.</div>
                  : apuntesOplora.length === 0 ? <div style={{ padding: 14, fontSize: 13, color: TEXT_MUTED }}>Este tema todavía no tiene apuntes de OPLORA.</div>
                  : apuntesOplora.map((ap: any, i: number) => (
                    <FilaLista
                      key={ap.id} ultima={i === apuntesOplora.length - 1}
                      Icon={BookOpen} color="var(--hx-b7791f)" bg="var(--hx-fef6e4)"
                      titulo={ap.titulo}
                      sub={[ap.tipo?.toUpperCase(), ap.paginas ? `${ap.paginas} págs` : null].filter(Boolean).join(' · ') || undefined}
                      onClick={() => router.push(`/app/apuntes/${ap.id}`)}
                    />
                  ))}
              </Caja>
            </section>

            <section>
              <TituloSeccion derecha={<span style={{ fontSize: 11, color: TEXT_MUTED }}>{normativa.length} artículos</span>}>Normativa del tema</TituloSeccion>
              {normativaPendiente ? (
                <Caja padding={14}><div style={{ fontSize: 13, color: TEXT_MUTED }}>Cargando…</div></Caja>
              ) : normativaError ? (
                <Caja padding={14}><div style={{ fontSize: 13, color: 'var(--hx-b91c1c)' }}>No se ha podido cargar la normativa.</div></Caja>
              ) : Object.keys(normativaPorLey).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(normativaPorLey).map(([leyNombre, data]: [string, any]) => (
                    <Caja key={leyNombre}>
                      <FilaLista
                        ultima={false} Icon={Scale} color="var(--hx-7c3aed)" bg="var(--hx-f3f0fc)"
                        titulo={leyNombre} sub={`${data.articulos.length} ${data.articulos.length === 1 ? 'artículo' : 'artículos'} en este tema`}
                        onClick={data.leyId ? () => router.push(`/app/ley/${data.leyId}?oposicionId=${oposicionId}`) : undefined}
                      />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 14px 14px' }} data-sin-deslizar>
                        {data.articulos.map((art: any) => (
                          <button
                            key={art.id}
                            onClick={() => router.push(`/app/articulo/${art.id}?oposicionId=${oposicionId}`)}
                            // ⭐ Artículos en azul (la ley va en morado): antes tenían el mismo color y se confundían
                            style={{ padding: '5px 11px', borderRadius: 999, border: '1px solid var(--hx-d6e4ff)', background: 'var(--hx-eaf0ff)', fontSize: 12, color: 'var(--hx-1f5fd1)', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Art. {art.numero}
                          </button>
                        ))}
                      </div>
                    </Caja>
                  ))}
                </div>
              ) : (
                <Caja padding={14}>
                  <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6 }}>
                    {tema.contexto
                      ? renderReferencias(tema.contexto, mapaSiglas, abrirArticuloDesdeContexto, 'ctx')
                      : 'Este tema no tiene normativa vinculada.'}
                  </div>
                </Caja>
              )}
            </section>

            <section>
              <TituloSeccion derecha={<span style={{ fontSize: 11, color: TEXT_MUTED }}>{apuntes.length}</span>}>Mis apuntes</TituloSeccion>
              <Caja>
                {apuntesPendiente && <div style={{ padding: 14, fontSize: 13, color: TEXT_MUTED, borderBottom: `1px solid ${BORDER}` }}>Cargando…</div>}
                {apuntesError && <div style={{ padding: 14, fontSize: 13, color: 'var(--hx-b91c1c)', borderBottom: `1px solid ${BORDER}` }}>No se han podido cargar tus apuntes.</div>}
                {apuntes.map((ap: any) => (
                  <FilaLista
                    key={ap.id} ultima={false}
                    Icon={FileText} color="var(--hx-2563eb)" bg="var(--hx-eaf2fe)"
                    titulo={ap.nombre}
                    sub={ap.creadoEn ? new Date(ap.creadoEn).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : undefined}
                    href={ap.urlArchivo}
                  />
                ))}
                <input
                  id="apunte-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setSubiendoApunte(true);
                    setErrorSubida('');
                    try {
                      const formData = new FormData();
                      formData.append('archivo', file);
                      formData.append('oposicionId', oposicionId);
                      await api.post(`/apuntes-usuario/tema/${tema.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                      queryClient.invalidateQueries({ queryKey: ['apuntes-tema', tema.id] });
                    } catch (err: any) {
                      const m = err?.response?.data?.message;
                      setErrorSubida(typeof m === 'string' ? m : 'No se ha podido subir el archivo. Inténtalo de nuevo.');
                    } finally {
                      setSubiendoApunte(false);
                      e.target.value = '';
                    }
                  }}
                />
                <button
                  onClick={() => document.getElementById('apunte-input')?.click()}
                  disabled={subiendoApunte}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'none', border: 'none', cursor: subiendoApunte ? 'default' : 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, border: '1.5px dashed var(--hx-cbd5e1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Upload size={17} color={TEXT_SECONDARY} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{subiendoApunte ? 'Subiendo…' : 'Subir un apunte'}</div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>PDF, Word o imagen</div>
                  </div>
                </button>
              </Caja>
              {errorSubida && <div style={{ fontSize: 12, color: 'var(--hx-b91c1c)', background: 'var(--hx-fef2f2)', borderRadius: 12, padding: '10px 12px', marginTop: 10 }}>{errorSubida}</div>}
            </section>
          </>
        )}

        {/* ── MI ESTUDIO ── */}
        {tab === 'mi-estudio' && (
          <>
            <section ref={refRepaso}>
              <TituloSeccion>Programar repaso</TituloSeccion>
              <Caja padding={16}>
                {repasoProgramado ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--hx-eaf2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CalendarCheck size={20} color={COLOR_ESTUDIAR} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: TEXT_MUTED }}>{repasoHoy ? 'Repaso pendiente' : 'Próximo repaso'}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, textTransform: 'capitalize' }}>
                        {repasoProgramado === hoy ? 'Hoy' : fechaLarga(repasoProgramado)}
                      </div>
                      <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 1 }}>Ese día te avisaremos y aparecerá en Inicio</div>
                    </div>
                    <button
                      onClick={() => guardarRepaso(null)}
                      disabled={programando}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--hx-b91c1c)', background: 'var(--hx-fef2f2)', border: 'none', borderRadius: 999, padding: '6px 10px', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}
                    >
                      <X size={13} /> Quitar
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 12, lineHeight: 1.45 }}>
                      Elige cuándo quieres volver a este tema. Ese día te avisaremos y lo verás en Inicio.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
                      {[
                        { label: 'Mañana', dias: 1 },
                        { label: 'En 3 días', dias: 3 },
                        { label: 'En 1 semana', dias: 7 },
                        { label: 'En 2 semanas', dias: 14 },
                        { label: 'En 1 mes', dias: 30 },
                      ].map(({ label, dias }) => {
                        const f = sumarDias(dias);
                        const activo = fechaElegida === f && !mostrarCalendario;
                        return (
                          <button
                            key={dias}
                            onClick={() => { setFechaElegida(f); setMostrarCalendario(false); }}
                            style={{ padding: '10px 4px', borderRadius: 10, fontSize: 12, cursor: 'pointer', border: 'none', background: activo ? 'var(--hxbg-0f172a)' : 'var(--hx-f3f4f6)', color: activo ? 'var(--c-primario-texto)' : TEXT_SECONDARY, fontWeight: 700 }}
                          >
                            {label}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => { setMostrarCalendario(true); setFechaElegida(''); }}
                        style={{ padding: '10px 4px', borderRadius: 10, fontSize: 12, cursor: 'pointer', border: 'none', background: mostrarCalendario ? 'var(--hxbg-0f172a)' : 'var(--hx-f3f4f6)', color: mostrarCalendario ? 'var(--c-primario-texto)' : TEXT_SECONDARY, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                      >
                        <CalendarDays size={13} /> Otra fecha
                      </button>
                    </div>
                    {mostrarCalendario && (
                      <input
                        type="date"
                        value={fechaElegida}
                        min={sumarDias(1)}
                        onChange={(e) => setFechaElegida(e.target.value)}
                        style={{ width: '100%', padding: '13px 14px', fontSize: 15, border: '1px solid var(--hx-e5e7eb)', borderRadius: 12, outline: 'none', color: TEXT_PRIMARY, boxSizing: 'border-box', marginBottom: 10, background: 'var(--c-superficie)' }}
                      />
                    )}
                    {fechaElegida && (
                      <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 10, textTransform: 'capitalize' }}>{fechaLarga(fechaElegida)}</div>
                    )}
                    <button
                      onClick={() => fechaElegida && guardarRepaso(fechaElegida)}
                      disabled={!fechaElegida || programando}
                      style={{ width: '100%', padding: 12, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: fechaElegida ? 'pointer' : 'default', opacity: fechaElegida ? 1 : 0.4 }}
                    >
                      {programando ? 'Guardando…' : 'Programar repaso'}
                    </button>
                  </>
                )}
                {errorRepaso && <div style={{ fontSize: 12, color: 'var(--hx-b91c1c)', marginTop: 10 }}>{errorRepaso}</div>}
              </Caja>
            </section>

            <section ref={refNotas}>
              <TituloSeccion derecha={
                <span style={{ fontSize: 11, fontWeight: 600, color: estadoNota === 'error' ? 'var(--hx-b91c1c)' : estadoNota === 'guardado' ? 'var(--hx-16a34a)' : TEXT_MUTED }}>
                  {estadoNota === 'guardando' ? 'Guardando…' : estadoNota === 'guardado' ? 'Guardado' : estadoNota === 'error' ? 'No se ha guardado' : 'Se guarda solo'}
                </span>
              }>
                Mis notas
              </TituloSeccion>
              <Caja padding={12}>
                <textarea
                  ref={refTextarea}
                  value={notaTexto}
                  onChange={(e) => handleNotaChange(e.target.value)}
                  disabled={!notaCargada}
                  placeholder="Escribe aquí tus notas sobre este tema…"
                  style={{
                    width: '100%', minHeight: 220, padding: 12, fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.7,
                    border: 'none', borderRadius: 12, outline: 'none', resize: 'vertical', background: 'var(--hx-fffbeb)',
                    boxSizing: 'border-box', fontFamily: 'inherit',
                  }}
                />
              </Caja>
            </section>
          </>
        )}

        {/* ── PROGRESO ── */}
        {tab === 'progreso' && (
          <>
            <section>
              <TituloSeccion derecha={<span style={{ fontSize: 11, color: TEXT_MUTED }}>Total {porcentajeProgreso}%</span>}>Cómo se calcula tu progreso</TituloSeccion>
              {progresoPendiente ? (
                <Caja padding={14}><div style={{ fontSize: 13, color: TEXT_MUTED }}>Cargando…</div></Caja>
              ) : progresoCompletoError || !desglose ? (
                <Caja padding={14}><div style={{ fontSize: 13, color: 'var(--hx-b91c1c)' }}>No se ha podido cargar el progreso.</div></Caja>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '0 4px' }}>
                  <CirculoDato valor={`${desglose.lectura.puntos}`} porcentaje={(desglose.lectura.puntos / 50) * 100} color={COLOR_ESTUDIAR} label="Lectura" sub="de 50 puntos" />
                  <CirculoDato valor={`${desglose.test.puntos}`} porcentaje={(desglose.test.puntos / 25) * 100} color={COLOR_TEST} label="Test" sub="de 25 puntos" />
                  <CirculoDato valor={`${desglose.flashcards.puntos}`} porcentaje={(desglose.flashcards.puntos / 25) * 100} color={COLOR_FC} label="Flashcards" sub="de 25 puntos" />
                </div>
              )}
            </section>

            <section>
              <TituloSeccion>Mi actividad en el tema</TituloSeccion>
              <Caja>
                <FilaLista
                  ultima={false} Icon={ClipboardCheck} color={COLOR_TEST} bg="var(--hx-f3fae9)"
                  titulo={`${progresoTest?.total ?? 0} preguntas respondidas`}
                  sub={`${progresoTest?.correctas ?? 0} correctas · ${progresoTest?.falladas ?? 0} falladas`}
                  derecha={<span />}
                />
                <FilaLista
                  ultima={false} Icon={Layers} color={COLOR_FC} bg={COLOR_FC_BG}
                  titulo={`${statsFC?.dominadas ?? 0} de ${totalFC} flashcards dominadas`}
                  sub={`${statsFC?.dudosas ?? 0} dudosas · ${statsFC?.sinVer ?? 0} sin ver`}
                  derecha={<span />}
                />
                <FilaLista
                  ultima={false} Icon={Flame} color="var(--hx-c2410c)" bg="var(--hx-fff1e8)"
                  titulo={`${progresoSesiones?.diasEstudiados ?? 0} ${(progresoSesiones?.diasEstudiados ?? 0) === 1 ? 'día' : 'días'} estudiando el tema`}
                  sub={progresoSesiones?.ultimaSesion ? `Última vez: ${new Date(progresoSesiones.ultimaSesion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}` : 'Primera vez que entras'}
                  derecha={<span />}
                />
                <FilaLista
                  ultima Icon={Clock} color={COLOR_ESTUDIAR} bg="var(--hx-eaf2fe)"
                  titulo={repasoProgramado ? `Repaso: ${repasoProgramado === hoy ? 'hoy' : fechaLarga(repasoProgramado)}` : 'Sin repaso programado'}
                  sub={repasoProgramado ? 'Te avisaremos ese día' : 'Prográmalo en Mi estudio'}
                  onClick={() => abrirSeccion('repaso')}
                />
              </Caja>
            </section>

            <section>
              <TituloSeccion>Repaso completo</TituloSeccion>
              <Caja padding={18}>
                {repasoDesbloqueado ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--hx-f0fdf4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Target size={21} color="var(--hx-16a34a)" />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Listo para el repaso completo</div>
                        <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>Un test de {numRepasoCompleto} preguntas de todo el tema</div>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/app/test/${oposicionId}?modo=tema&temaId=${tema.id}&n=${numRepasoCompleto}`)}
                      style={{ width: '100%', padding: 12, background: '#16A34A', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Empezar repaso completo
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--hx-f3f4f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Lock size={19} color="var(--hx-9ca3af)" />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Se desbloquea al 80%</div>
                        <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>Lee el material, haz tests y repasa flashcards del tema</div>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'var(--hx-eef0f3)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (porcentajeProgreso / 80) * 100)}%`, height: '100%', background: '#D97706', borderRadius: 999 }} />
                    </div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED }}>{porcentajeProgreso}% de 80%</div>
                  </div>
                )}
              </Caja>
            </section>
          </>
        )}
      </div>

      {modalTest && (
        <ModalHacerTest
          oposicion={{ id: oposicionId }}
          convocatoria={convocatoria}
          limites={limites}
          router={router}
          onClose={() => setModalTest(false)}
          temaPreseleccionado={{ id: tema.id, numero: tema.numero, titulo: tema.titulo }}
        />
      )}
      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} activo="estudiar" />
    </div>
  );
}
