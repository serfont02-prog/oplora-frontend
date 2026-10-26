'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { etiquetaArticulo } from '@/lib/articulos';
import { ArrowLeft, ChevronDown, ChevronUp, ChevronRight, Search, BookOpen, ClipboardCheck, CalendarClock } from 'lucide-react';
import { FooterNavegacion } from '@/app/app/dashboard/page';
import { BG_TEMA as BG_APP, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SOMBRA, VERDE, VERDE_BG } from '@/styles/tokens';

function LeyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { usuario, cargando } = useAuth();
  const [librosAbiertos, setLibrosAbiertos] = useState<Record<string, boolean>>({});
  const [titulosAbiertos, setTitulosAbiertos] = useState<Record<string, boolean>>({});
  const [capitulosAbiertos, setCapitulosAbiertos] = useState<Record<string, boolean>>({});
  const [articulosCapitulo, setArticulosCapitulo] = useState<Record<string, any[]>>({});
  const [articulosTitulo, setArticulosTitulo] = useState<Record<string, any[]>>({});
  const [capitulosPorTitulo, setCapitulosPorTitulo] = useState<Record<string, any[]>>({});
  const [search, setSearch] = useState('');
  const searchParams = useSearchParams();
const oposicionId = searchParams.get('oposicionId');


  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  const { data: ley, isLoading, isError } = useQuery({
    queryKey: ['ley', id],
    queryFn: async () => {
      const res = await api.get(`/leyes/${id}`);
      return res.data;
    },
    enabled: !!usuario,
  });

  const versionActiva = ley?.versiones?.find((v: any) => v.activa) ?? ley?.versiones?.[0];

  const { data: titulos = [], isLoading: loadingTitulos } = useQuery({
    queryKey: ['titulos-ley', versionActiva?.id],
    queryFn: async () => {
      const res = await api.get(`/normativa/titulos/${versionActiva.id}`);
      return res.data;
    },
    enabled: !!versionActiva?.id,
  });

  const { data: estadisticas } = useQuery({
  queryKey: ['estadisticas-ley', versionActiva?.id],
  queryFn: async () => {
    const res = await api.get(`/normativa/estadisticas/${versionActiva.id}`);
    return res.data;
  },
  enabled: !!versionActiva?.id,
});

const { data: disposiciones = [] } = useQuery({
  queryKey: ['disposiciones-ley', versionActiva?.id],
  queryFn: async () => {
    const res = await api.get(`/normativa/disposiciones/${versionActiva.id}`);
    return res.data;
  },
  enabled: !!versionActiva?.id,
});

const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({});
const [articulosSeccion, setArticulosSeccion] = useState<Record<string, any[]>>({});
const [seccionesPorCapitulo, setSeccionesPorCapitulo] = useState<Record<string, any[]>>({});
const [disposicionesAbiertas, setDisposicionesAbiertas] = useState<Record<string, boolean>>({});

  const { data: resultadosBusqueda = [] } = useQuery({
  queryKey: ['buscar-articulos', versionActiva?.id, search],
  queryFn: async () => {
    if (!search || search.trim().length < 2) return [];
    const res = await api.get(`/normativa/buscar/${versionActiva.id}?q=${search}`);
    return res.data;
  },
  enabled: !!versionActiva?.id && search.trim().length >= 2,
  });



  const toggleTitulo = async (tituloId: string) => {
    const abierto = !titulosAbiertos[tituloId];
    setTitulosAbiertos((prev) => ({ ...prev, [tituloId]: abierto }));

    if (abierto) {
      // Cargar capítulos del título
      if (!capitulosPorTitulo[tituloId]) {
        const res = await api.get(`/normativa/capitulos/${tituloId}`);
        setCapitulosPorTitulo((prev) => ({ ...prev, [tituloId]: res.data }));
      }
      // Cargar artículos directos del título
      if (!articulosTitulo[tituloId]) {
        const res = await api.get(`/normativa/articulos-titulo/${tituloId}`);
        setArticulosTitulo((prev) => ({ ...prev, [tituloId]: res.data }));
      }
    }
  };

const toggleCapitulo = async (capituloId: string) => {
  const abierto = !capitulosAbiertos[capituloId];
  setCapitulosAbiertos((prev) => ({ ...prev, [capituloId]: abierto }));

  if (abierto && !articulosCapitulo[capituloId]) {
    const res = await api.get(`/normativa/articulos/${capituloId}`);
    setArticulosCapitulo((prev) => ({ ...prev, [capituloId]: res.data }));
  }
  if (abierto && !seccionesPorCapitulo[capituloId]) {
    const res = await api.get(`/normativa/secciones/${capituloId}`);
    setSeccionesPorCapitulo((prev) => ({ ...prev, [capituloId]: res.data }));
  }
};

const toggleSeccion = async (seccionId: string) => {
  const abierto = !seccionesAbiertas[seccionId];
  setSeccionesAbiertas((prev) => ({ ...prev, [seccionId]: abierto }));

  if (abierto && !articulosSeccion[seccionId]) {
    const res = await api.get(`/normativa/articulos-seccion/${seccionId}`);
    setArticulosSeccion((prev) => ({ ...prev, [seccionId]: res.data }));
  }
};

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: BG_APP, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 13, color: TEXT_MUTED }}>Cargando…</span>
      </div>
    );
  }

  if (isError || !ley) {
    return (
      <div style={{ minHeight: '100vh', background: BG_APP, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--hx-dc2626)' }}>No se ha podido cargar la ley. Inténtalo de nuevo.</span>
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, cursor: 'pointer' }}
        >
          <ArrowLeft size={14} /> Volver
        </button>
      </div>
    );
  }

  const filtrarArticulos = (arts: any[]) =>
    !search ? arts : arts.filter((a) =>
      a.numero?.includes(search) || a.contenido?.toLowerCase().includes(search.toLowerCase())
    );

  const abrirArticulo = (art: any) => router.push(`/app/articulo/${art.id}?leyId=${id}&oposicionId=${oposicionId ?? ''}`);
  const fechaActualizada = versionActiva?.fechaVigencia || versionActiva?.fechaPublicacion;
  const datos = estadisticas ? [
    { label: 'Títulos', value: estadisticas.titulos },
    { label: 'Capítulos', value: estadisticas.capitulos },
    { label: 'Artículos', value: estadisticas.articulos },
    { label: 'Disposic.', value: estadisticas.disposiciones },
  ].filter((d) => d.value > 0) : [];

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 96 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
          <button
            onClick={() => router.back()}
            aria-label="Volver"
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={18} color={TEXT_PRIMARY} />
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {ley.siglas || versionActiva?.tipoNorma || 'Normativa'}
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1.25, marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>
              {ley.nombre}
            </div>
          </div>
        </div>

        {/* Datos de la ley */}
        {(versionActiva || datos.length > 0) && (
          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(versionActiva?.tipoNorma || versionActiva?.referenciaBoe || fechaActualizada) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {versionActiva?.tipoNorma && <span style={{ ...chip, background: 'var(--c-superficie-2)', color: TEXT_SECONDARY }}>{versionActiva.tipoNorma}</span>}
                {versionActiva?.referenciaBoe && <span style={{ ...chip, background: 'var(--c-azul-bg)', color: 'var(--c-azul)' }}>{versionActiva.referenciaBoe}</span>}
                {fechaActualizada && (
                  <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CalendarClock size={12} /> Actualizada el {new Date(fechaActualizada).toLocaleDateString('es-ES')}
                  </span>
                )}
              </div>
            )}
            {datos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${datos.length}, 1fr)`, gap: 8 }}>
                {datos.map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--c-superficie-2)', borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1.1 }}>{value}</div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Test de la ley */}
        {oposicionId && versionActiva?.id && (
          <button
            onClick={() => router.push(`/app/test/${oposicionId}?versionLeyId=${versionActiva.id}&n=15`)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--c-superficie)', border: 'none', borderRadius: 18, boxShadow: SOMBRA, cursor: 'pointer', textAlign: 'left' }}
          >
            <span style={{ width: 40, height: 40, borderRadius: 12, background: VERDE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ClipboardCheck size={19} color={VERDE} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Test de esta ley</span>
              <span style={{ display: 'block', fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>15 preguntas de toda la ley</span>
            </span>
            <ChevronRight size={16} color="var(--c-chevron)" />
          </button>
        )}

        {/* Buscador */}
        <div style={{ position: 'relative' }}>
          <Search size={16} color={TEXT_MUTED} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por número de artículo o texto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 14px 12px 40px', fontSize: 14, color: TEXT_PRIMARY, border: 'none', borderRadius: 14, outline: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, boxSizing: 'border-box' }}
          />
        </div>

        {/* Estructura / resultados */}
        {search.trim().length >= 2 ? (
          <div>
            <div style={tituloSeccion}>{resultadosBusqueda.length} resultado{resultadosBusqueda.length !== 1 ? 's' : ''}</div>
            <div style={caja}>
              {resultadosBusqueda.length === 0 ? (
                <div style={{ padding: 18, textAlign: 'center', fontSize: 13, color: TEXT_MUTED }}>No se han encontrado artículos</div>
              ) : (
                resultadosBusqueda.map((art: any, i: number) => (
                  <FilaArticulo key={art.id} art={art} sangria={0} primera={i === 0} onClick={() => abrirArticulo(art)} />
                ))
              )}
            </div>
          </div>
        ) : loadingTitulos ? (
          <div style={{ ...caja, padding: 18, textAlign: 'center', fontSize: 13, color: TEXT_MUTED }}>Cargando estructura…</div>
        ) : titulos.length === 0 ? (
          <div style={{ ...caja, padding: '22px 18px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--c-azul-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <BookOpen size={22} color="var(--c-azul)" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Esta ley todavía no tiene su estructura cargada</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ ...tituloSeccion, marginBottom: -2 }}>Índice</div>
            {agruparPorLibro(titulos).map((grupo, gi) => {
              const claveLibro = grupo.libro?.id ?? `sin-libro-${gi}`;
              const libroAbierto = !grupo.libro || librosAbiertos[claveLibro];
              return (
                <div key={claveLibro} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {grupo.libro && (
                    <button
                      onClick={() => setLibrosAbiertos((prev) => ({ ...prev, [claveLibro]: !prev[claveLibro] }))}
                      style={{ width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'var(--c-azul-bg)', border: 'none', borderRadius: 16, cursor: 'pointer', textAlign: 'left' }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-azul)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Libro {grupo.libro.numero}</div>
                        {grupo.libro.nombre && <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, marginTop: 2, lineHeight: 1.3 }}>{grupo.libro.nombre}</div>}
                        <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{grupo.titulos.length} {grupo.titulos.length === 1 ? 'título' : 'títulos'}</div>
                      </div>
                      {libroAbierto ? <ChevronUp size={16} color="var(--c-azul)" /> : <ChevronDown size={16} color="var(--c-azul)" />}
                    </button>
                  )}
                  {libroAbierto && grupo.titulos.map((titulo: any) => {
                    const abierto = !!titulosAbiertos[titulo.id];
                    return (
                      <div key={titulo.id} style={caja}>
                        <button
                          onClick={() => toggleTitulo(titulo.id)}
                          style={{ width: '100%', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {titulo.numero && <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Título {titulo.numero}</div>}
                            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3, marginTop: titulo.numero ? 2 : 0 }}>{titulo.nombre || `Título ${titulo.numero ?? ''}`}</div>
                          </div>
                          {abierto ? <ChevronUp size={16} color="var(--c-chevron)" /> : <ChevronDown size={16} color="var(--c-chevron)" />}
                        </button>

                        {abierto && (
                          <div>
                            {filtrarArticulos(articulosTitulo[titulo.id] ?? []).map((art: any) => (
                              <FilaArticulo key={art.id} art={art} sangria={0} onClick={() => abrirArticulo(art)} />
                            ))}

                            {(capitulosPorTitulo[titulo.id] ?? []).map((capitulo: any) => {
                              const capAbierto = !!capitulosAbiertos[capitulo.id];
                              return (
                                <div key={capitulo.id} style={{ borderTop: '1px solid var(--c-borde)' }}>
                                  <button
                                    onClick={() => toggleCapitulo(capitulo.id)}
                                    style={{ width: '100%', padding: '11px 14px 11px 22px', display: 'flex', alignItems: 'center', gap: 10, background: capAbierto ? 'var(--c-superficie-2)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                  >
                                    <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.35 }}>
                                      {capitulo.numero && <span style={{ fontWeight: 700 }}>Capítulo {capitulo.numero}</span>}
                                      {capitulo.nombre && <span style={{ color: TEXT_SECONDARY }}>{capitulo.numero ? ' · ' : ''}{capitulo.nombre}</span>}
                                    </div>
                                    {capAbierto ? <ChevronUp size={15} color="var(--c-chevron)" /> : <ChevronDown size={15} color="var(--c-chevron)" />}
                                  </button>

                                  {capAbierto && filtrarArticulos(articulosCapitulo[capitulo.id] ?? []).map((art: any) => (
                                    <FilaArticulo key={art.id} art={art} sangria={1} onClick={() => abrirArticulo(art)} />
                                  ))}

                                  {capAbierto && (seccionesPorCapitulo[capitulo.id] ?? []).map((seccion: any) => {
                                    const secAbierta = !!seccionesAbiertas[seccion.id];
                                    return (
                                      <div key={seccion.id} style={{ borderTop: '1px solid var(--c-borde)' }}>
                                        <button
                                          onClick={() => toggleSeccion(seccion.id)}
                                          style={{ width: '100%', padding: '10px 14px 10px 34px', display: 'flex', alignItems: 'center', gap: 10, background: secAbierta ? 'var(--c-superficie-2)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                        >
                                          <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.35 }}>
                                            {seccion.numero && <span style={{ fontWeight: 700 }}>Sección {seccion.numero}</span>}
                                            {seccion.nombre && <span>{seccion.numero ? ' · ' : ''}{seccion.nombre}</span>}
                                          </div>
                                          {secAbierta ? <ChevronUp size={14} color="var(--c-chevron)" /> : <ChevronDown size={14} color="var(--c-chevron)" />}
                                        </button>
                                        {secAbierta && filtrarArticulos(articulosSeccion[seccion.id] ?? []).map((art: any) => (
                                          <FilaArticulo key={art.id} art={art} sangria={2} onClick={() => abrirArticulo(art)} />
                                        ))}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {disposiciones.length > 0 && (() => {
          const categorias = ['adicional', 'transitoria', 'derogatoria', 'final'];
          const labels: Record<string, string> = {
            adicional: 'Disposiciones adicionales',
            transitoria: 'Disposiciones transitorias',
            derogatoria: 'Disposición derogatoria',
            final: 'Disposiciones finales',
          };
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ ...tituloSeccion, marginBottom: -2 }}>Disposiciones</div>
              {categorias.filter((cat) => disposiciones.some((d: any) => d.categoria === cat)).map((cat) => {
                const items = disposiciones.filter((d: any) => d.categoria === cat);
                const abierto = disposicionesAbiertas[cat];
                return (
                  <div key={cat} style={caja}>
                    <button
                      onClick={() => setDisposicionesAbiertas((prev) => ({ ...prev, [cat]: !prev[cat] }))}
                      style={{ width: '100%', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{labels[cat]}</div>
                      <span style={{ fontSize: 12, color: TEXT_MUTED }}>{items.length}</span>
                      {abierto ? <ChevronUp size={16} color="var(--c-chevron)" /> : <ChevronDown size={16} color="var(--c-chevron)" />}
                    </button>
                    {abierto && items.map((d: any) => (
                      <div key={d.id} style={{ padding: '12px 14px 12px 22px', borderTop: '1px solid var(--c-borde)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 4, textTransform: 'capitalize' }}>{d.etiqueta || cat}</div>
                        <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6 }}>
                          {d.contenido.split(/(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ0-9])/).map((frase: string, i: number) => (
                            <p key={i} style={{ margin: i === 0 ? 0 : '6px 0 0' }}>{frase}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      <FooterNavegacion usuario={usuario} oposicionId={oposicionId ?? undefined} activo="estudiar" />
    </div>
  );
}

const caja: React.CSSProperties = { background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' };
const tituloSeccion: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, padding: '0 4px', marginBottom: 8 };
const chip: React.CSSProperties = { fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999 };

/** Fila de un artículo en el índice: número en la insignia azul, título o comienzo del texto. */
function FilaArticulo({ art, sangria, onClick, primera }: { art: any; sangria: number; onClick: () => void; primera?: boolean }) {
  const numeroCorto = String(art.numero ?? '').replace(/^art(í|i)culo\s*/i, '');
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: `10px 14px 10px ${14 + sangria * 12}px`,
        background: 'none', border: 'none', borderTop: primera ? 'none' : '1px solid var(--c-borde)', cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span style={{ minWidth: 36, height: 30, padding: '0 6px', borderRadius: 9, background: 'var(--c-azul-bg)', color: 'var(--c-azul)', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxSizing: 'border-box' }}>
        {numeroCorto.length > 6 ? numeroCorto.slice(0, 6) + '…' : numeroCorto}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.3 }}>
          {etiquetaArticulo(art.numero)}
          {art.titulo && <span style={{ color: TEXT_SECONDARY, fontWeight: 500 }}> · {art.titulo}</span>}
        </span>
        {art.contenido && (
          <span style={{ display: 'block', fontSize: 12, color: TEXT_MUTED, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {art.contenido.slice(0, 110)}
          </span>
        )}
      </span>
      <ChevronRight size={15} color="var(--c-chevron)" style={{ flexShrink: 0 }} />
    </button>
  );
}

// ⭐ Agrupa los títulos consecutivos que pertenecen al mismo Libro (Código Penal,
// Código Civil...). Los títulos sin libro (Título Preliminar) forman su propio grupo.
function agruparPorLibro(titulos: any[]): { libro: any | null; titulos: any[] }[] {
  const grupos: { libro: any | null; titulos: any[] }[] = [];
  for (const t of titulos ?? []) {
    const ultimo = grupos[grupos.length - 1];
    const libroId = t.libro?.id ?? null;
    if (ultimo && (ultimo.libro?.id ?? null) === libroId) ultimo.titulos.push(t);
    else grupos.push({ libro: t.libro ?? null, titulos: [t] });
  }
  return grupos;
}

export default function LeyPageWrapper() {
  return (
    <Suspense>
      <LeyPage />
    </Suspense>
  );
}