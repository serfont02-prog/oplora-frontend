'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, ChevronDown, ChevronUp, ChevronRight, Search } from 'lucide-react';

function LeyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { usuario, cargando } = useAuth();
  const [titulosAbiertos, setTitulosAbiertos] = useState<Record<string, boolean>>({});
  const [capitulosAbiertos, setCapitulosAbiertos] = useState<Record<string, boolean>>({});
  const [articulosCapitulo, setArticulosCapitulo] = useState<Record<string, any[]>>({});
  const [articulosTitulo, setArticulosTitulo] = useState<Record<string, any[]>>({});
  const [capitulosPorTitulo, setCapitulosPorTitulo] = useState<Record<string, any[]>>({});
  const [search, setSearch] = useState('');
  const searchParams = useSearchParams();
const oposicionId = searchParams.get('oposicionId');

const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({});
const [articulosSeccion, setArticulosSeccion] = useState<Record<string, any[]>>({});
const [seccionesPorCapitulo, setSeccionesPorCapitulo] = useState<Record<string, any[]>>({});

const toggleSeccion = async (seccionId: string, capituloId: string) => {
  const abierto = !seccionesAbiertas[seccionId];
  setSeccionesAbiertas((prev) => ({ ...prev, [seccionId]: abierto }));

  if (abierto && !articulosSeccion[seccionId]) {
    const res = await api.get(`/normativa/articulos-seccion/${seccionId}`);
    setArticulosSeccion((prev) => ({ ...prev, [seccionId]: res.data }));
  }
};

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  const { data: ley, isLoading } = useQuery({
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

  if (!ley) return null;

  const filtrarArticulos = (arts: any[]) =>
    !search ? arts : arts.filter((a) =>
      a.numero?.includes(search) || a.contenido?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: '72px' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '0 1.25rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <button
          onClick={() => oposicionId 
            ? router.push(`/app/oposicion/${oposicionId}?tab=normativa`) 
            : router.back()
            }
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          Volver
        </button>
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#111827', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ley.nombre}
        </span>
        <span />
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.25rem' }}>

        {/* Info ley */}
<div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
    {versionActiva?.tipoNorma && (
      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#f3f4f6', color: '#6b7280' }}>
        {versionActiva.tipoNorma}
      </span>
    )}
    {versionActiva?.referenciaBoe && (
      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#E6F1FB', color: '#185FA5' }}>
        {versionActiva.referenciaBoe}
      </span>
    )}
    {versionActiva?.fechaPublicacion && (
      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
        {new Date(versionActiva.fechaPublicacion).toLocaleDateString('es-ES')}
      </span>
    )}
  </div>
  {titulos.length > 0 && (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      {[
        { label: 'Títulos', value: titulos.length },
        { label: 'Capítulos', value: titulos.reduce((acc: number, t: any) => acc + (capitulosPorTitulo[t.id]?.length ?? 0), 0) || '—' },
        { label: 'Artículos', value: versionActiva?.totalArticulos ?? '—' },
      ].map(({ label, value }) => (
        <div key={label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>{value}</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{label}</div>
        </div>
      ))}
    </div>
  )}
</div>  

        {/* Buscador */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Buscar por número de artículo o texto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 36px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '10px', outline: 'none', background: 'white', boxSizing: 'border-box' }}
          />
        </div>

{/* Estructura */}
{search.trim().length >= 2 ? (
  <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', overflow: 'hidden' }}>
    <div style={{ padding: '10px 14px', borderBottom: '1px solid #f9fafb', fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {resultadosBusqueda.length} resultado{resultadosBusqueda.length !== 1 ? 's' : ''}
    </div>
    {resultadosBusqueda.length === 0 ? (
      <div style={{ padding: '2rem', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
        No se encontraron artículos
      </div>
    ) : (
      resultadosBusqueda.map((art: any, i: number) => (
        <div
          key={art.id}
          onClick={() => router.push(`/app/articulo/${art.id}?leyId=${id}&oposicionId=${oposicionId ?? ''}`)}
          style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: i < resultadosBusqueda.length - 1 ? '1px solid #f9fafb' : 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '1px' }}>
              Artículo {art.numero}
              {art.titulo && <span style={{ color: '#9ca3af', fontWeight: 400 }}> — {art.titulo}</span>}
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {art.contenido?.slice(0, 80)}...
            </div>
          </div>
          <ChevronRight size={13} color="#d1d5db" style={{ flexShrink: 0, marginLeft: '8px' }} />
        </div>
      ))
    )}
  </div>
) : loadingTitulos ? (
  <div style={{ textAlign: 'center', padding: '2rem', fontSize: '13px', color: '#9ca3af' }}>Cargando estructura...</div>
) : titulos.length === 0 ? (
  <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📖</div>
    <div style={{ fontSize: '13px', color: '#9ca3af' }}>Esta ley no tiene estructura cargada todavía</div>
  </div>
) : (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {titulos.map((titulo: any) => (
      <div key={titulo.id} style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', overflow: 'hidden' }}>
        <button
          onClick={() => toggleTitulo(titulo.id)}
          style={{ width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
            {titulo.numero ? `Título ${titulo.numero}` : ''}{titulo.nombre ? ` — ${titulo.nombre}` : ''}
          </div>
          {titulosAbiertos[titulo.id] ? <ChevronUp size={14} color="#9ca3af" /> : <ChevronDown size={14} color="#9ca3af" />}
        </button>

        {titulosAbiertos[titulo.id] && (
          <div style={{ borderTop: '1px solid #f3f4f6' }}>
            {filtrarArticulos(articulosTitulo[titulo.id] ?? []).map((art: any) => (
              <div
                key={art.id}
                onClick={() => router.push(`/app/articulo/${art.id}?leyId=${id}&oposicionId=${oposicionId ?? ''}`)}
                style={{ padding: '9px 14px 9px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderTop: '1px solid #f9fafb' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '1px' }}>
                    Artículo {art.numero}
                    {art.titulo && <span style={{ color: '#9ca3af', fontWeight: 400 }}> — {art.titulo}</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {art.contenido?.slice(0, 80)}...
                  </div>
                </div>
                <ChevronRight size={13} color="#d1d5db" style={{ flexShrink: 0, marginLeft: '8px' }} />
              </div>
            ))}

            {(capitulosPorTitulo[titulo.id] ?? []).map((capitulo: any) => (
              <div key={capitulo.id} style={{ borderTop: '1px solid #f9fafb' }}>
                <button
                  onClick={() => toggleCapitulo(capitulo.id)}
                  style={{ width: '100%', padding: '10px 14px 10px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: capitulosAbiertos[capitulo.id] ? '#f9fafb' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>
                    {capitulo.numero ? `Capítulo ${capitulo.numero}` : ''}{capitulo.nombre ? ` — ${capitulo.nombre}` : ''}
                  </div>
                  {capitulosAbiertos[capitulo.id] ? <ChevronUp size={13} color="#9ca3af" /> : <ChevronDown size={13} color="#9ca3af" />}
                </button>

                {capitulosAbiertos[capitulo.id] && filtrarArticulos(articulosCapitulo[capitulo.id] ?? []).map((art: any) => (
                  <div
                    key={art.id}
                    onClick={() => router.push(`/app/articulo/${art.id}?leyId=${id}&oposicionId=${oposicionId ?? ''}`)}
                    style={{ padding: '9px 14px 9px 42px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderTop: '1px solid #f9fafb' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '1px' }}>
                        Artículo {art.numero}
                        {art.titulo && <span style={{ color: '#9ca3af', fontWeight: 400 }}> — {art.titulo}</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {art.contenido?.slice(0, 80)}...
                      </div>
                    </div>
                    <ChevronRight size={13} color="#d1d5db" style={{ flexShrink: 0, marginLeft: '8px' }} />
                  </div>
                ))}

                              {capitulosAbiertos[capitulo.id] && (seccionesPorCapitulo[capitulo.id] ?? []).map((seccion: any) => (
                <div key={seccion.id} style={{ borderTop: '1px solid #f9fafb' }}>
                  <button
                    onClick={() => toggleSeccion(seccion.id, capitulo.id)}
                    style={{ width: '100%', padding: '9px 14px 9px 42px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: seccionesAbiertas[seccion.id] ? '#f9fafb' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>
                      {seccion.numero ? `Sección ${seccion.numero}` : ''}{seccion.nombre ? ` — ${seccion.nombre}` : ''}
                    </div>
                    {seccionesAbiertas[seccion.id] ? <ChevronUp size={12} color="#9ca3af" /> : <ChevronDown size={12} color="#9ca3af" />}
                  </button>

                  {seccionesAbiertas[seccion.id] && filtrarArticulos(articulosSeccion[seccion.id] ?? []).map((art: any) => (
                    <div
                      key={art.id}
                      onClick={() => router.push(`/app/articulo/${art.id}?leyId=${id}&oposicionId=${oposicionId ?? ''}`)}
                      style={{ padding: '9px 14px 9px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderTop: '1px solid #f9fafb' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '1px' }}>
                          Artículo {art.numero}
                          {art.titulo && <span style={{ color: '#9ca3af', fontWeight: 400 }}> — {art.titulo}</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {art.contenido?.slice(0, 80)}...
                        </div>
                      </div>
                      <ChevronRight size={13} color="#d1d5db" style={{ flexShrink: 0, marginLeft: '8px' }} />
                    </div>
                  ))}
                </div>
              ))}
              </div>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
)}

      </div> {/* cierre maxWidth */}


                    
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

export default function LeyPageWrapper() {
  return (
    <Suspense>
      <LeyPage />
    </Suspense>
  );
}