'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ArrowLeft, Download, Headphones } from 'lucide-react';
import { FooterNavegacion } from '@/app/app/dashboard/page';

export default function ApunteOploraPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { usuario, cargando } = useAuth();

  const [fontSize, setFontSize] = useState(13);
  const [audioVisible, setAudioVisible] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [velocidad, setVelocidad] = useState(1);
  const [progreso, setProgreso] = useState(0);
  const [menuSubrayado, setMenuSubrayado] = useState<{ x: number; y: number; inicio: number; fin: number; texto: string } | null>(null);
  const [subrayadoSeleccionado, setSubrayadoSeleccionado] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const ultimoGuardado = useRef(0);
  const throttleTimeout = useRef<any>(null);
  const textoCompletoRef = useRef<any>(null);

  const [articuloModal, setArticuloModal] = useState<{ numero: string; versionLeyId: string } | null>(null);

  const { data: articuloAbierto, isLoading: cargandoArticulo } = useQuery({
    queryKey: ['articulo-modal', articuloModal?.versionLeyId, articuloModal?.numero],
    queryFn: async () => {
      const res = await api.get(`/normativa/articulo-por-numero/${articuloModal!.versionLeyId}/${articuloModal!.numero}`);
      return res.data;
    },
    enabled: !!articuloModal,
  });

  const abrirArticulo = (numero: string, versionLeyId: string) => {
    setArticuloModal({ numero, versionLeyId });
  };

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  const { data: apunte, isLoading } = useQuery({
    queryKey: ['apunte-oplora', id],
    queryFn: async () => {
      const res = await api.get(`/apuntes-oplora/${id}`);
      return res.data;
    },
    enabled: !!usuario && !!id,
  });

  const { data: subrayados = [], refetch: refetchSubrayados } = useQuery({
    queryKey: ['subrayados-apunte', id],
    queryFn: async () => {
      const res = await api.get(`/apuntes-oplora/${id}/subrayados`);
      return res.data;
    },
    enabled: !!usuario && !!id,
  });

  const { data: progresoGuardado } = useQuery({
    queryKey: ['progreso-lectura', id],
    queryFn: async () => {
      const res = await api.get(`/apuntes-oplora/${id}/progreso`);
      return res.data;
    },
    enabled: !!usuario && !!id,
  });

  useEffect(() => {
    if (progresoGuardado?.porcentaje) {
      setProgreso(progresoGuardado.porcentaje);
    }
  }, [progresoGuardado]);

  const esFormatoNuevo = apunte?.versionParser === 2 && apunte?.contenidoEstructurado?.bloques;
  const bloques = esFormatoNuevo ? apunte.contenidoEstructurado.bloques : [];
  const secciones = !esFormatoNuevo ? (apunte?.contenidoEstructurado?.secciones ?? []) : [];

  const textoCompleto = esFormatoNuevo
    ? bloques.map((b: any) => {
        if (b.tipo === 'lista') return b.items.join('. ');
        return b.texto ?? '';
      }).join(' ')
    : secciones.map((s: any) => `${s.titulo}. ${s.contenido}`).join(' ');

  useEffect(() => {
    textoCompletoRef.current = textoCompleto;
  }, [textoCompleto]);

  // Guardar progreso final al salir
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (progreso > 0) {
        api.post(`/apuntes-oplora/${id}/progreso`, { porcentaje: progreso }).catch(() => {});
      }
    };
  }, [id, progreso]);

  // Selección de texto para subrayar
  useEffect(() => {
    const handleMouseUp = () => {
      requestAnimationFrame(() => {
        const seleccion = window.getSelection();
        const texto = seleccion?.toString().trim() ?? '';
        if (!texto || texto.length < 3) {
          setMenuSubrayado(null);
          return;
        }
        const contenido = textoCompletoRef.current ?? '';
        const inicio = contenido.indexOf(texto);
        if (inicio === -1) { setMenuSubrayado(null); return; }
        const fin = inicio + texto.length;

        try {
          const range = seleccion!.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect.width === 0) return;
          setMenuSubrayado({
            x: rect.left + rect.width / 2,
            y: rect.top + window.scrollY - 50,
            inicio,
            fin,
            texto,
          });
        } catch (e) {}
      });
    };
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  const crearSubrayado = async () => {
    if (!menuSubrayado) return;
    await api.post(`/apuntes-oplora/${id}/subrayados`, {
      inicio: menuSubrayado.inicio,
      fin: menuSubrayado.fin,
      textoSeleccionado: menuSubrayado.texto,
      color: 'amarillo',
    });
    setMenuSubrayado(null);
    window.getSelection()?.removeAllRanges();
    refetchSubrayados();
  };

  const borrarSubrayado = async (subId: string) => {
    await api.delete(`/apuntes-oplora/subrayados/${subId}`);
    setSubrayadoSeleccionado(null);
    refetchSubrayados();
  };

  const renderTextoConSubrayados = (texto: string, offsetBase: number) => {
    const subsEnRango = subrayados.filter((s: any) => s.inicio >= offsetBase && s.fin <= offsetBase + texto.length);
    if (!subsEnRango.length) return <span>{texto}</span>;

    const partes: { texto: string; subrayado?: any }[] = [];
    let pos = 0;
    const ordenados = [...subsEnRango].sort((a: any, b: any) => a.inicio - b.inicio);

    for (const sub of ordenados) {
      const inicioRel = sub.inicio - offsetBase;
      const finRel = sub.fin - offsetBase;
      if (inicioRel > pos) partes.push({ texto: texto.slice(pos, inicioRel) });
      partes.push({ texto: texto.slice(inicioRel, finRel), subrayado: sub });
      pos = finRel;
    }
    if (pos < texto.length) partes.push({ texto: texto.slice(pos) });

    return (
      <>
        {partes.map((parte, i) =>
          parte.subrayado ? (
            <mark
              key={i}
              onClick={() => setSubrayadoSeleccionado(subrayadoSeleccionado === parte.subrayado.id ? null : parte.subrayado.id)}
              style={{ background: '#fef08a', cursor: 'pointer', borderRadius: '2px', position: 'relative' }}
            >
              {parte.texto}
              {subrayadoSeleccionado === parte.subrayado.id && (
                <button
                  onClick={(e) => { e.stopPropagation(); borrarSubrayado(parte.subrayado.id); }}
                  style={{ position: 'absolute', top: '-28px', left: '50%', transform: 'translateX(-50%)', background: '#111827', color: 'white', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap', zIndex: 20 }}
                >
                  🗑 Borrar
                </button>
              )}
            </mark>
          ) : (
            <span key={i}>{parte.texto}</span>
          )
        )}
      </>
    );
  };

  const toggleAudio = () => {
    if (!audioVisible) { setAudioVisible(true); return; }
    if (audioPlaying) { window.speechSynthesis.cancel(); setAudioPlaying(false); }
    else reproducir();
  };

  const reproducir = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textoCompleto);
    utterance.lang = 'es-ES';
    utterance.rate = velocidad;
    utterance.onboundary = (e) => {
      const pct = Math.round((e.charIndex / textoCompleto.length) * 100);
      setAudioProgress(pct);
    };
    utterance.onend = () => { setAudioPlaying(false); setAudioProgress(0); };
    window.speechSynthesis.speak(utterance);
    setAudioPlaying(true);
  };

  const cycleVelocidad = () => {
    const velocidades = [1, 1.25, 1.5, 2, 0.75];
    const i = velocidades.indexOf(velocidad);
    const nueva = velocidades[(i + 1) % velocidades.length];
    setVelocidad(nueva);
    if (audioPlaying) { window.speechSynthesis.cancel(); setTimeout(reproducir, 100); }
  };

const tiempoInicioLectura = useRef(Date.now());

const updateProgreso = () => {
  const el = contentRef.current;
  if (!el) return;
  
  const pctScroll = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100) || 0;
  const pctScrollLimitado = Math.min(100, pctScroll);

  const numPalabras = apunte?.numPalabras ?? apunte?.contenidoEstructurado?.estadisticas?.numPalabras ?? 0;
  const palabrasPorMinuto = 200;
  const tiempoMinimoSegundos = numPalabras > 0
    ? (numPalabras * (pctScrollLimitado / 100) / palabrasPorMinuto) * 60 * 0.5
    : 0;

  const tiempoTranscurridoSegundos = (Date.now() - tiempoInicioLectura.current) / 1000;

  const pctConsolidable = tiempoTranscurridoSegundos >= tiempoMinimoSegundos ? pctScrollLimitado : progreso;

  setProgreso((prev) => Math.max(prev, pctConsolidable));

  const ahora = Date.now();
  if (ahora - ultimoGuardado.current > 5000) {
    ultimoGuardado.current = ahora;
    clearTimeout(throttleTimeout.current);
    throttleTimeout.current = setTimeout(() => {
      api.post(`/apuntes-oplora/${id}/progreso`, { porcentaje: pctConsolidable }).catch(() => {});
    }, 300);
  }
};

  if (cargando || isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#FAF9F6' }}>
        <div style={{ fontSize: '13px', color: '#9ca3af' }}>Cargando apunte...</div>
      </div>
    );
  }

  if (!apunte) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#FAF9F6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
          <div style={{ fontSize: '14px', color: '#374151' }}>Apunte no encontrado</div>
          <button onClick={() => router.back()} style={{ marginTop: '16px', padding: '10px 20px', background: '#111827', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  let offsetAcumulado = 0;

  return (
    <div style={{ minHeight: '100vh', height: '100vh', background: '#FAF9F6', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header compacto y fijo */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'white', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ padding: '0 1rem', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => router.back()}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={13} />
            Volver
          </button>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#111827', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {apunte.titulo}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={toggleAudio}
              style={{ background: audioVisible ? '#EFF6FF' : 'none', border: 'none', cursor: 'pointer', color: audioVisible ? '#1F7CFF' : '#6b7280', padding: '5px', borderRadius: '7px' }}
            >
              <Headphones size={16} />
            </button>
            <a
              href={apunte.urlArchivo}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', color: '#6b7280', padding: '5px', borderRadius: '7px' }}
            >
              <Download size={16} />
            </a>
          </div>
        </div>

        {/* Controles fuente + progreso, compactos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 1rem', borderTop: '1px solid #f9fafb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setFontSize(s => Math.max(11, s - 1))}
              style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '10px', color: '#374151' }}
            >
              A−
            </button>
            <span style={{ fontSize: '11px', color: '#9ca3af', minWidth: '18px', textAlign: 'center' }}>{fontSize}</span>
            <button
              onClick={() => setFontSize(s => Math.min(20, s + 1))}
              style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '12px', color: '#374151' }}
            >
              A+
            </button>
          </div>
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{progreso}% leído</span>
        </div>

        <div style={{ height: '2px', background: '#f3f4f6' }}>
          <div style={{ width: `${progreso}%`, height: '100%', background: '#1F7CFF', transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Contenido de lectura */}
      <div
        ref={contentRef}
        onScroll={updateProgreso}
        style={{
          flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden',
          padding: '1.5rem 1.25rem',
          maxWidth: '600px', margin: '0 auto', width: '100%',
          boxSizing: 'border-box',
          paddingBottom: audioVisible ? '180px' : '90px',
          position: 'relative',
        }}
      >
        <div style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px', lineHeight: 1.35 }}>
          {apunte.titulo}
        </div>
        {apunte.descripcion && (
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '24px' }}>{apunte.descripcion}</div>
        )}



        {esFormatoNuevo ? (
  // ⭐ NUEVO FORMATO — renderizado por tipo de bloque
  <>
    {bloques.map((bloque: any) => {
      switch (bloque.tipo) {
        case 'titulo':
          return bloque.nivel === 1 ? (
            <div key={bloque.id} style={{
              fontSize: '17px', fontWeight: 700, color: '#1a1a1a',
              marginTop: '32px', marginBottom: '14px',
              paddingLeft: '10px', borderLeft: '3px solid #1F7CFF',
            }}>
              {bloque.texto}
            </div>
          ) : bloque.nivel === 2 ? (
            <div key={bloque.id} style={{
              fontSize: '14px', fontWeight: 600, color: '#4b5563',
              marginTop: '22px', marginBottom: '10px',
              paddingLeft: '10px', borderLeft: '2px solid #e5e7eb',
            }}>
              {bloque.texto}
            </div>
          ) : (
            <div key={bloque.id} style={{
              fontSize: '13px', fontWeight: 700, color: '#1F7CFF',
              marginTop: '18px', marginBottom: '8px',
            }}>
              {bloque.texto}
            </div>
          );

        

        
           case 'destacado': {
              const DESTACADO_CONFIG: Record<string, { bg: string; border: string; color: string; emoji: string }> = {
            EJEMPLO: { bg: '#F0F7FF', border: '#bfdbfe', color: '#1F7CFF', emoji: '📘' },
            IDEA: { bg: '#FEF9E7', border: '#FDE68A', color: '#92400E', emoji: '💡' },
            ESQUEMA: { bg: '#F0FDF4', border: '#86efac', color: '#15803d', emoji: '🗺️' },
            'TRAMPA DE EXAMEN': { bg: '#FEF2F2', border: '#fca5a5', color: '#dc2626', emoji: '⚠️' },
            'REGLA DE EXAMEN': { bg: '#F3E8FF', border: '#e9d5ff', color: '#7c3aed', emoji: '📏' },
          };
            const cfg = DESTACADO_CONFIG[bloque.titulo] ?? DESTACADO_CONFIG.IDEA;
            return (
              <div key={bloque.id} style={{
                background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '12px',
                padding: '14px 16px', marginBottom: '16px', marginTop: '18px',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {cfg.emoji} {bloque.titulo}
                </div>
                {bloque.contenido.map((c: any, i: number) => {
                  if (c.tipo === 'parrafo') {
                    return (
                      <div key={i} style={{ fontSize: `${fontSize}px`, color: cfg.color, lineHeight: 1.75, marginBottom: i < bloque.contenido.length - 1 ? '8px' : 0, opacity: 0.9 }}>
                        {c.texto}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            );
          }

        case 'parrafo':
          return (
            <div key={bloque.id} style={{
              fontSize: `${fontSize}px`, color: '#2d2d2d', lineHeight: 1.85,
              letterSpacing: '0.01em', marginBottom: '14px',
              wordBreak: 'break-word', overflowWrap: 'anywhere',
            }}>
              <TextoConReferencias
                texto={bloque.texto}
                versionLeyId={bloque.versionLeyId ?? apunte.versionLeyId}
                onAbrirArticulo={abrirArticulo}
              />
            </div>
          );
        case 'lista':
          return (
            <ul key={bloque.id} style={{
              margin: '0 0 16px', paddingLeft: '20px',
              listStyleType: bloque.ordenada ? 'decimal' : 'disc',
            }}>
              {bloque.items.map((item: string, i: number) => (
                <li key={i} style={{
                  fontSize: `${fontSize}px`, color: '#2d2d2d', lineHeight: 1.75,
                  marginBottom: '6px', wordBreak: 'break-word', overflowWrap: 'anywhere',
                }}>
                  <TextoConReferencias
                    texto={item}
                    versionLeyId={apunte.versionLeyId}
                    onAbrirArticulo={abrirArticulo}
                  />
                </li>
              ))}
            </ul>
          );
        case 'articulo_legal':
          return (
            <div key={bloque.id} style={{
              background: '#F0F7FF', border: '1px solid #bfdbfe', borderRadius: '10px',
              padding: '12px 14px', marginBottom: '14px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#1F7CFF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Artículo {bloque.numero}
              </div>
              <div style={{ fontSize: `${fontSize}px`, color: '#1e3a5f', lineHeight: 1.8, wordBreak: 'break-word' }}>
                {bloque.texto}
              </div>
            </div>
          );

        default:
          return null;
      }
    })}
  </>
) : secciones.length > 0 ? (
  // FORMATO VIEJO — secciones (compatibilidad)
  secciones.map((seccion: any, i: number) => (
    <div key={i} style={{ marginBottom: '28px' }}>
      {seccion.nivel === 1 ? (
        <div style={{
          fontSize: '15px', fontWeight: 700, color: '#1a1a1a',
          marginBottom: '10px', paddingLeft: '10px',
          borderLeft: '3px solid #1F7CFF',
        }}>
          {seccion.titulo}
        </div>
      ) : (
        <div style={{
          fontSize: '13px', fontWeight: 600, color: '#4b5563',
          marginBottom: '8px', paddingLeft: '10px',
          borderLeft: '2px solid #e5e7eb',
        }}>
          {seccion.titulo}
        </div>
      )}
      <div style={{
        fontSize: `${fontSize}px`, color: '#2d2d2d', lineHeight: 1.85,
        letterSpacing: '0.01em', wordBreak: 'break-word', overflowWrap: 'anywhere',
      }}>
        {seccion.contenido}
      </div>
    </div>
  ))
) : apunte?.textoCompleto ? (
  <div style={{ fontSize: `${fontSize}px`, color: '#2d2d2d', lineHeight: 1.85, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
    {apunte.textoCompleto}
  </div>
) : (
  <div style={{ textAlign: 'center', padding: '3rem 0' }}>
    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
    <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>
      El contenido de este apunte no está disponible para lectura directa
    </div>
    <a
      href={apunte.urlArchivo}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#111827', color: 'white', borderRadius: '10px', fontSize: '13px', textDecoration: 'none' }}
    >
      <Download size={14} />
      Descargar PDF
    </a>
  </div>
)}


        {/* Menú subrayar flotante */}
        {menuSubrayado && (
          <div style={{ position: 'fixed', left: menuSubrayado.x, top: menuSubrayado.y, transform: 'translateX(-50%)', zIndex: 50 }}>
            <button
              onClick={crearSubrayado}
              style={{ background: '#fef08a', border: '1px solid #eab308', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}
            >
              ✏️ Subrayar
            </button>
          </div>
        )}
      </div>

      {/* Reproductor audio */}
      {audioVisible && (
        <div style={{
          position: 'fixed', bottom: '64px', left: 0, right: 0,
          background: 'white', borderTop: '1px solid #f3f4f6',
          padding: '10px 1rem',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
          zIndex: 15,
        }}>
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => { if (audioPlaying) { window.speechSynthesis.cancel(); setAudioPlaying(false); } else reproducir(); }}
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0f172a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', flexShrink: 0 }}
              >
                {audioPlaying ? '⏸' : '▶'}
              </button>
              <div style={{ flex: 1, height: '4px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${audioProgress}%`, height: '100%', background: '#1F7CFF', transition: 'width 0.5s' }} />
              </div>
              <button
                onClick={cycleVelocidad}
                style={{ fontSize: '11px', padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#374151', fontWeight: 600, minWidth: '34px' }}
              >
                {velocidad}×
              </button>
            </div>
          </div>
        </div>
      )}

      <FooterNavegacion usuario={usuario} oposicionId={apunte.tema?.convocatoria?.oposicion?.id} />
      {articuloModal && (
  <div
    onClick={() => setArticuloModal(null)}
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem' }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
          Artículo {articuloModal.numero}
        </div>
        <button
          onClick={() => setArticuloModal(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af' }}
        >
          ×
        </button>
      </div>

      {cargandoArticulo ? (
        <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>
          Cargando artículo...
        </div>
      ) : articuloAbierto ? (
        <>
          {articuloAbierto.titulo && (
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>
              {articuloAbierto.titulo}
            </div>
          )}
          <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {articuloAbierto.contenido}
          </div>
          <button
            onClick={() => {
              router.push(`/app/articulo/${articuloAbierto.id}?oposicionId=${apunte.oposicion?.id ?? ''}`);
            }}
            style={{ marginTop: '16px', width: '100%', padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            Ver artículo completo →
          </button>
        </>
      ) : (
        <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>
          Artículo no encontrado
        </div>
      )}
    </div>
  </div>
)}
    </div>

    
  );

  
}

function TextoConReferencias({
  texto,
  versionLeyId,
  onAbrirArticulo,
}: {
  texto: string;
  versionLeyId?: string;
  onAbrirArticulo: (numero: string, versionLeyId: string) => void;
}) {
  if (!versionLeyId) return <>{texto}</>;

  const regex = /art(?:ículo|\.)?\s*(\d+)/gi;
  const partes: (string | { numero: string })[] = [];
  let ultimoIndex = 0;
  let match;

  while ((match = regex.exec(texto)) !== null) {
    if (match.index > ultimoIndex) {
      partes.push(texto.slice(ultimoIndex, match.index));
    }
    partes.push({ numero: match[1] });
    ultimoIndex = match.index + match[0].length;
  }
  if (ultimoIndex < texto.length) {
    partes.push(texto.slice(ultimoIndex));
  }

  return (
    <>
      {partes.map((parte, i) =>
        typeof parte === 'string' ? (
          <span key={i}>{parte}</span>
        ) : (
          <button
            key={i}
            onClick={() => onAbrirArticulo(parte.numero, versionLeyId)}
            style={{
              display: 'inline', background: 'none', border: 'none', padding: 0,
              color: '#1F7CFF', fontWeight: 600, cursor: 'pointer',
              textDecoration: 'underline', textDecorationStyle: 'dotted',
              fontSize: 'inherit', fontFamily: 'inherit',
            }}
          >
            art. {parte.numero}
          </button>
        )
      )}
    </>
  );
}