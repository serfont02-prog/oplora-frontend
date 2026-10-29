'use client';

// ⭐ Estudiar — mismo sistema que Inicio y Practicar: estadísticas en círculos flotantes, tarjetas
// blancas con la sombra común directamente sobre el fondo, títulos suaves y solo iconos lucide.
// Mientras se cargan la convocatoria y los temas se muestra "Cargando temas…" (antes salía unos
// segundos "Temario no disponible" porque la consulta de temas aún no había empezado).

import { useState, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, CheckCircle2, ChevronRight, BookOpen, FileText, Upload, ListOrdered, Library, Scale, X, PlayCircle } from 'lucide-react';
import { FooterNavegacion } from '@/components/ui/FooterNavegacion';
import { AvatarPerfil } from '@/components/AvatarUsuarioPerfil';
import { TarjetaTemarioPapel } from '@/components/temario/TemarioPapel';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, BG_TEMA } from '@/styles/tokens';
import ErrorCarga from '@/components/ui/ErrorCarga';

type Tab = 'programa' | 'material';

const BG_APP = BG_TEMA; // marrón pastel muy claro (familia Estudiar)
const SOMBRA = 'var(--c-sombra)';
const BORDER = 'var(--hx-f0ece6)';
const COLOR_ESTUDIAR = 'var(--hx-1f7cff)';
const COLOR_MARRON = 'var(--hx-8b7355)';
const COLOR_MARRON_BG = 'var(--hx-f3ede4)';

function TituloSeccion({ children, derecha }: { children: React.ReactNode; derecha?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px', gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY }}>{children}</span>
      {derecha}
    </div>
  );
}

function Donut({ porcentaje, color, size, grosor }: { porcentaje: number; color: string; size: number; grosor: number }) {
  const radio = (size - grosor) / 2;
  const circ = 2 * Math.PI * radio;
  const offset = circ - (Math.max(0, Math.min(100, porcentaje)) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={radio} fill="none" stroke="var(--hx-eef0f3)" strokeWidth={grosor} />
      {porcentaje > 0 && (
        <circle cx={size / 2} cy={size / 2} r={radio} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      )}
    </svg>
  );
}

function CirculoDato({ valor, porcentaje = 0, color, label, sub }: { valor: string; porcentaje?: number; color: string; label: string; sub: string }) {
  const D = 78;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <div style={{ position: 'relative', width: D, height: D, borderRadius: '50%', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 6 }}>
          <Donut porcentaje={porcentaje} color={color} size={D - 12} grosor={6} />
        </div>
        <span style={{ position: 'relative', fontSize: 16, fontWeight: 800, color: TEXT_PRIMARY }}>{valor}</span>
      </div>
      <span style={{ fontSize: 12, color: TEXT_PRIMARY, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
      <span style={{ fontSize: 10, color: TEXT_MUTED, marginTop: -3, textAlign: 'center' }}>{sub}</span>
    </div>
  );
}

/** Esqueleto de la lista mientras cargan los temas */
function CargandoTemas() {
  return (
    <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', fontSize: 13, color: TEXT_MUTED, borderBottom: `1px solid ${BORDER}` }}>Cargando temas…</div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="op-pulso" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < 3 ? `1px solid ${BORDER}` : 'none' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--hx-f1ede6)', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 10, borderRadius: 6, background: 'var(--hx-f1ede6)', width: '85%' }} />
            <div style={{ height: 10, borderRadius: 6, background: 'var(--hx-f1ede6)', width: '55%' }} />
          </div>
        </div>
      ))}
      <style jsx>{`
        .op-pulso { animation: oppulso 1.2s ease-in-out infinite; }
        @keyframes oppulso { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

function Vacio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: '22px 18px', textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: COLOR_MARRON_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
        <BookOpen size={22} color={COLOR_MARRON} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{titulo}</div>
      <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4, lineHeight: 1.5 }}>{texto}</div>
    </div>
  );
}

export default function TemarioOposicionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const oposicionId = params.oposicionId as string;
  const modoEstudiar = searchParams.get('modo') === 'estudiar';
  const { usuario, cargando } = useAuth();

  // ⭐ La pestaña va en la URL (?tab=material): al volver desde una ley o desde el temario en
  // papel se vuelve a la pestaña de la que se salió, no siempre a Programa.
  const [tab, setTabEstado] = useState<Tab>(() => (searchParams.get('tab') === 'material' ? 'material' : 'programa'));
  const setTab = (t: Tab) => {
    setTabEstado(t);
    const sp = new URLSearchParams(window.location.search);
    sp.set('tab', t);
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${sp.toString()}`);
  };
  const [busqueda, setBusqueda] = useState('');
  const [subiendoApunte, setSubiendoApunte] = useState(false);
  const [errorSubida, setErrorSubida] = useState('');
  const queryClient = useQueryClient();

  const { data: apuntesOploraOposicion = [] } = useQuery({
    queryKey: ['apuntes-oplora-oposicion', oposicionId],
    queryFn: async () => (await api.get(`/apuntes-oplora/oposicion/${oposicionId}`)).data,
    enabled: !!usuario,
  });

  const { data: misApuntesOposicion = [] } = useQuery({
    queryKey: ['mis-apuntes-oposicion', oposicionId],
    queryFn: async () => (await api.get(`/apuntes-usuario/oposicion/${oposicionId}`)).data,
    enabled: !!usuario,
  });

  const { data: oposicion } = useQuery({
    queryKey: ['oposicion-temario', oposicionId],
    queryFn: async () => (await api.get(`/oposiciones/${oposicionId}`)).data,
    enabled: !!usuario,
  });

  const { data: convocatorias = [], isPending: cargandoConvocatorias, isError: errorConvocatorias, refetch: reintentarConvocatorias } = useQuery({
    queryKey: ['convocatorias-temario', oposicionId],
    queryFn: async () => (await api.get(`/convocatorias/oposicion/${oposicionId}`)).data,
    enabled: !!usuario,
  });

  const convocatoria = useMemo(
    () => convocatorias.find((c: any) => c.estado === 'activa') ?? convocatorias[0],
    [convocatorias]
  );

  const { data: temas = [], isPending: temasPendientes, isError: errorTemas, refetch: reintentarTemas } = useQuery({
    queryKey: ['temas-temario', convocatoria?.id],
    queryFn: async () => (await api.get(`/temas/convocatoria/${convocatoria.id}`)).data,
    enabled: !!convocatoria?.id,
  });

  // ⭐ Cargando = aún no sabemos la convocatoria, o la sabemos y sus temas no han llegado.
  // (Antes solo se miraba la consulta de temas, que estaba desactivada mientras cargaba la
  // convocatoria, y durante esos segundos se veía "Temario no disponible".)
  // ⭐ Si falla la carga se dice (antes salía "Temario en preparación" como si no hubiera temas)
  const errorTemario = (errorConvocatorias && !convocatorias.length) || (errorTemas && !temas.length);
  const cargandoTemario = !errorTemario && (!usuario || cargandoConvocatorias || (!!convocatoria?.id && temasPendientes));

  // Progreso detallado de todos los temas en una sola llamada
  const { data: progresoTemas = [] } = useQuery({
    queryKey: ['progreso-temas-detalle', convocatoria?.id, oposicionId],
    queryFn: async () => (await api.get(`/temas/convocatoria/${convocatoria.id}/progreso-completo?oposicionId=${oposicionId}`)).data,
    enabled: !!convocatoria?.id && !!oposicionId,
  });

  // Último tema estudiado (mismo dato que "Continúa donde lo dejaste" de Inicio)
  const { data: ultimoTema } = useQuery({
    queryKey: ['ultimo-tema-estudiado', oposicionId],
    queryFn: async () => (await api.get(`/sesiones-tema/ultimo/${oposicionId}`)).data,
    enabled: !!usuario && !!oposicionId,
  });

  const progresoPorTemaId = useMemo(() => {
    const map: Record<string, any> = {};
    progresoTemas.forEach((p: any) => { map[p.temaId] = p; });
    return map;
  }, [progresoTemas]);

  const { data: leyes = [] } = useQuery({
    queryKey: ['leyes-temario', oposicionId],
    queryFn: async () => (await api.get(`/leyes/oposicion/${oposicionId}`)).data,
    enabled: !!usuario,
  });

  const temasFiltrados = useMemo(() => {
    if (!busqueda) return temas;
    const q = busqueda.toLowerCase();
    return temas.filter((t: any) => t.titulo?.toLowerCase().includes(q) || String(t.numero).includes(busqueda));
  }, [temas, busqueda]);

  const completados = progresoTemas.filter((p: any) => p.porcentajeTotal >= 80).length;
  const enCurso = progresoTemas.filter((p: any) => p.porcentajeTotal > 0 && p.porcentajeTotal < 80).length;
  const porcentajeGlobal = temas.length > 0
    ? Math.round(progresoTemas.reduce((acc: number, p: any) => acc + (p.porcentajeTotal ?? 0), 0) / temas.length)
    : 0;

  if (cargando) return null;

  const irATema = (numero: number) => router.push(`/app/tema/${oposicionId}/${numero}`);
  const progUltimo = ultimoTema?.temaId ? progresoPorTemaId[ultimoTema.temaId]?.porcentajeTotal ?? 0 : 0;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 90 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Cabecera */}
        <div style={{ padding: '4px 4px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Estudiar
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>
              {oposicion?.nombre ?? 'Tu oposición'}
            </div>
            {convocatoria?.anyo && <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>Convocatoria {convocatoria.anyo}</div>}
          </div>
          <button
            onClick={() => router.push('/app/perfil')}
            aria-label="Mi perfil"
            style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', overflow: 'visible', flexShrink: 0 }}
          >
            <AvatarPerfil usuario={usuario} size={44} />
          </button>
        </div>

        {/* Pestañas (mismo estilo que el selector de periodo de Practicar) */}
        <div style={{ display: 'flex', background: 'var(--c-superficie)', borderRadius: 999, padding: 4, gap: 4, boxShadow: SOMBRA }}>
          {([
            { key: 'programa', label: 'Programa', icon: ListOrdered },
            { key: 'material', label: 'Material', icon: Library },
          ] as { key: Tab; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '9px 4px', border: 'none', borderRadius: 999, cursor: 'pointer',
                background: tab === key ? 'var(--hxbg-0f172a)' : 'transparent',
                color: tab === key ? 'var(--c-primario-texto)' : TEXT_SECONDARY,
                fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* ── PROGRAMA ── */}
        {tab === 'programa' && (
          <>
            {/* Mi progreso */}
            {!cargandoTemario && temas.length > 0 && (
              <section>
                <TituloSeccion>Mi progreso</TituloSeccion>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '0 4px' }}>
                  <CirculoDato valor={`${porcentajeGlobal}%`} porcentaje={porcentajeGlobal} color={COLOR_ESTUDIAR} label="Temario" sub="Progreso global" />
                  <CirculoDato
                    valor={`${completados}`}
                    porcentaje={temas.length ? (completados / temas.length) * 100 : 0}
                    color="var(--hx-16a34a)"
                    label="Completados"
                    sub={`de ${temas.length} temas`}
                  />
                  <CirculoDato
                    valor={`${enCurso}`}
                    porcentaje={temas.length ? (enCurso / temas.length) * 100 : 0}
                    color={COLOR_MARRON}
                    label="En curso"
                    sub={enCurso === 1 ? 'tema empezado' : 'temas empezados'}
                  />
                </div>
              </section>
            )}

            {/* Continúa donde lo dejaste */}
            {modoEstudiar && ultimoTema?.numeroTema && !busqueda && (
              <button
                onClick={() => irATema(ultimoTema.numeroTema)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', background: 'var(--c-superficie)', border: 'none', borderRadius: 18, padding: 14, boxShadow: SOMBRA, cursor: 'pointer' }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--hx-eaf2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PlayCircle size={22} color={COLOR_ESTUDIAR} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600 }}>Continúa con el tema {ultimoTema.numeroTema}{progUltimo > 0 ? ` · ${progUltimo}%` : ''}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.35, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ultimoTema.tituloTema}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--hx-c4c9d2)" style={{ flexShrink: 0 }} />
              </button>
            )}

            {/* Temas */}
            <section>
              <TituloSeccion derecha={!cargandoTemario && temas.length > 0 ? <span style={{ fontSize: 11, color: TEXT_MUTED }}>{temas.length} temas</span> : undefined}>
                Temas
              </TituloSeccion>

              {!cargandoTemario && temas.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--c-superficie)', borderRadius: 14, padding: '10px 14px', boxShadow: SOMBRA, marginBottom: 12 }}>
                  <Search size={15} color={TEXT_MUTED} style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Buscar por número o título…"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: TEXT_PRIMARY, background: 'transparent', minWidth: 0 }}
                  />
                  {busqueda && (
                    <button onClick={() => setBusqueda('')} aria-label="Borrar búsqueda" style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MUTED, padding: 0, display: 'flex' }}>
                      <X size={15} />
                    </button>
                  )}
                </div>
              )}

              {errorTemario ? (
                <ErrorCarga onReintentar={() => { if (errorConvocatorias) reintentarConvocatorias(); else reintentarTemas(); }} />
              ) : cargandoTemario ? (
                <CargandoTemas />
              ) : temas.length === 0 ? (
                <Vacio
                  titulo={convocatoria ? 'Temario en preparación' : 'Sin convocatoria'}
                  texto={convocatoria
                    ? 'El temario de esta convocatoria se está preparando. Mientras tanto puedes consultar la normativa en Material.'
                    : 'Todavía no hay ninguna convocatoria de esta oposición con temario.'}
                />
              ) : temasFiltrados.length === 0 ? (
                <Vacio titulo="Sin resultados" texto="Ningún tema coincide con tu búsqueda. Prueba con otro término o con el número del tema." />
              ) : (
                <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
                  {temasFiltrados.map((tema: any, i: number) => {
                    const porcentaje = progresoPorTemaId[tema.id]?.porcentajeTotal ?? 0;
                    const completado = porcentaje >= 80;
                    const color = completado ? 'var(--hx-16a34a)' : porcentaje > 0 ? COLOR_ESTUDIAR : 'var(--hx-d1d5db)';
                    const R = 19;
                    const circ = 2 * Math.PI * R;
                    return (
                      <button
                        key={tema.id}
                        onClick={() => modoEstudiar && irATema(tema.numero)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', textAlign: 'left',
                          background: 'none', border: 'none', borderBottom: i < temasFiltrados.length - 1 ? `1px solid ${BORDER}` : 'none',
                          cursor: modoEstudiar ? 'pointer' : 'default',
                        }}
                      >
                        <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="44" height="44" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                            <circle cx="22" cy="22" r={R} fill="none" stroke="var(--hx-f1ede6)" strokeWidth="3.5" />
                            {porcentaje > 0 && (
                              <circle cx="22" cy="22" r={R} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round"
                                strokeDasharray={circ} strokeDashoffset={circ - (Math.min(porcentaje, 100) / 100) * circ}
                                style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                            )}
                          </svg>
                          {completado
                            ? <CheckCircle2 size={19} color="var(--hx-16a34a)" />
                            : <span style={{ fontSize: 14, fontWeight: 800, color: porcentaje > 0 ? TEXT_PRIMARY : TEXT_MUTED }}>{tema.numero}</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {tema.titulo}
                          </div>
                          {(porcentaje > 0 || tema.bloque) && (
                            <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 3 }}>
                              {[tema.bloque, completado ? 'Completado' : porcentaje > 0 ? `${porcentaje}% estudiado` : null].filter(Boolean).join(' · ')}
                            </div>
                          )}
                        </div>
                        {modoEstudiar && <ChevronRight size={16} color="var(--hx-c4c9d2)" style={{ flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* ── MATERIAL ── */}
        {tab === 'material' && (
          <>
            <TarjetaTemarioPapel oposicionId={oposicionId} lugar="listaTemas" />

            {apuntesOploraOposicion.length > 0 && (
              <section>
                <TituloSeccion derecha={<span style={{ fontSize: 11, color: TEXT_MUTED }}>{apuntesOploraOposicion.length}</span>}>Apuntes OPLORA</TituloSeccion>
                <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
                  {apuntesOploraOposicion.map((ap: any, i: number) => (
                    <FilaMaterial
                      key={ap.id}
                      ultima={i === apuntesOploraOposicion.length - 1}
                      Icon={BookOpen} color="var(--hx-b7791f)" bg="var(--hx-fef6e4)"
                      titulo={ap.titulo}
                      sub={[ap.descripcion, ap.tipo?.toUpperCase(), ap.paginas ? `${ap.paginas} págs` : null, ap.tamanoBytes ? `${(ap.tamanoBytes / 1024 / 1024).toFixed(1)} MB` : null].filter(Boolean).join(' · ')}
                      onClick={() => router.push(`/app/apuntes/${ap.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              <TituloSeccion derecha={<span style={{ fontSize: 11, color: TEXT_MUTED }}>{leyes.length}</span>}>Normativa</TituloSeccion>
              <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
                {leyes.length === 0 && <div style={{ padding: 16, fontSize: 13, color: TEXT_MUTED }}>No hay normativa vinculada a esta oposición.</div>}
                {leyes.map((ol: any, i: number) => (
                  <FilaMaterial
                    key={ol.id}
                    ultima={i === leyes.length - 1}
                    Icon={Scale} color="var(--hx-7c3aed)" bg="var(--hx-f3f0fc)"
                    titulo={ol.ley?.nombre}
                    sub={`${ol.versionLey?.tipoNorma ?? 'Normativa'}${ol.versionLey?.referenciaBoe ? ` · ${ol.versionLey.referenciaBoe}` : ''}`}
                    onClick={() => router.push(`/app/ley/${ol.versionLey?.leyId ?? ol.ley?.id}?oposicionId=${oposicionId}`)}
                  />
                ))}
              </div>
            </section>

            <section>
              <TituloSeccion derecha={<span style={{ fontSize: 11, color: TEXT_MUTED }}>{misApuntesOposicion.length}</span>}>Mis apuntes</TituloSeccion>
              <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
                {misApuntesOposicion.map((ap: any) => (
                  <FilaMaterial
                    key={ap.id}
                    ultima={false}
                    Icon={FileText} color="var(--hx-2563eb)" bg="var(--hx-eaf2fe)"
                    titulo={ap.nombre}
                    sub={[
                      ap.creadoEn ? new Date(ap.creadoEn).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : null,
                      ap.nombre?.match(/\.(pdf|doc|docx|jpg|jpeg|png)$/i) ? ap.nombre.split('.').pop()?.toUpperCase() : null,
                    ].filter(Boolean).join(' · ')}
                    href={ap.urlArchivo}
                  />
                ))}

                <input
                  id="apunte-oposicion-input"
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
                      await api.post(`/apuntes-usuario/oposicion/${oposicionId}`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      });
                      queryClient.invalidateQueries({ queryKey: ['mis-apuntes-oposicion', oposicionId] });
                    } catch (err: any) {
                      // ⭐ Antes el error solo iba a la consola y el usuario no se enteraba
                      const m = err?.response?.data?.message;
                      setErrorSubida(typeof m === 'string' ? m : 'No se ha podido subir el archivo. Inténtalo de nuevo.');
                    } finally {
                      setSubiendoApunte(false);
                      e.target.value = '';
                    }
                  }}
                />
                <button
                  onClick={() => document.getElementById('apunte-oposicion-input')?.click()}
                  disabled={subiendoApunte}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'none', border: 'none', cursor: subiendoApunte ? 'default' : 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, border: '1.5px dashed var(--hx-cbd5e1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Upload size={17} color={TEXT_SECONDARY} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{subiendoApunte ? 'Subiendo…' : 'Subir un apunte'}</div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>PDF, Word o imagen</div>
                  </div>
                </button>
              </div>
              {errorSubida && (
                <div style={{ fontSize: 12, color: 'var(--hx-b91c1c)', background: 'var(--hx-fef2f2)', borderRadius: 12, padding: '10px 12px', marginTop: 10 }}>{errorSubida}</div>
              )}
            </section>
          </>
        )}
      </div>

      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} activo="estudiar" />
    </div>
  );
}

function FilaMaterial({ Icon, color, bg, titulo, sub, onClick, href, ultima }: {
  Icon: any; color: string; bg: string; titulo?: string; sub?: string; onClick?: () => void; href?: string; ultima: boolean;
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
      <ChevronRight size={16} color="var(--hx-c4c9d2)" style={{ flexShrink: 0 }} />
    </>
  );
  const estilo: React.CSSProperties = {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', textAlign: 'left',
    background: 'none', border: 'none', borderBottom: ultima ? 'none' : `1px solid ${BORDER}`, cursor: 'pointer',
    textDecoration: 'none', boxSizing: 'border-box',
  };
  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" style={estilo}>{contenido}</a>;
  }
  return <button onClick={onClick} style={estilo}>{contenido}</button>;
}
