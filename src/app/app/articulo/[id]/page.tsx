'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { etiquetaArticulo } from '@/lib/articulos';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight, Play, Pause, ListMusic, User, Highlighter, ClipboardCheck, Layers, Check, Trash2 } from 'lucide-react';
import { FooterNavegacion } from '@/components/ui/FooterNavegacion';
import { elegirVoz } from '@/lib/voces';

import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, BG_TEMA as BG_APP, SOMBRA, VERDE, VERDE_BG, COLOR_FC, COLOR_FC_BG } from '@/styles/tokens';
import BotonSubrayar, { esPantallaTactil } from '@/components/estudio/BotonSubrayar';

export default function ArticuloPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const leyId = searchParams.get('leyId');
  const autoplay = searchParams.get('autoplay') === 'true';
  const { usuario, cargando } = useAuth();
  const oposicionId = searchParams.get('oposicionId');

  const [reproduciendo, setReproduciendo] = useState(false);
  const [modoContinuo, setModoContinuo] = useState(false);
  const [velocidad, setVelocidad] = useState(1);
  const [vozGenero, setVozGenero] = useState<'mujer' | 'hombre'>('mujer');
  const [voces, setVoces] = useState<SpeechSynthesisVoice[]>([]);

  const [notaTexto, setNotaTexto] = useState('');
  const [notaGuardando, setNotaGuardando] = useState(false);
  const [notaGuardada, setNotaGuardada] = useState(false);
  const [menuSubrayado, setMenuSubrayado] = useState<{ x: number; y: number; inicio: number; fin: number; texto: string } | null>(null);
  const [subrayadoSeleccionado, setSubrayadoSeleccionado] = useState<string | null>(null);
  const notaTimeoutRef = useRef<any>(null);

  const touchStartX = useRef<number | null>(null);

  const { data: articulo, isLoading, isError } = useQuery({
    queryKey: ['articulo', id],
    queryFn: async () => {
      const res = await api.get(`/normativa/articulo/${id}`);
      return res.data;
    },
    enabled: !!usuario,
  });

  const { data: nota } = useQuery({
    queryKey: ['nota-articulo', id],
    queryFn: async () => {
      const res = await api.get(`/normativa/nota/${id}`);
      return res.data;
    },
    enabled: !!usuario && !!id,
  });

  const { data: navArticulos } = useQuery({
    queryKey: ['articulo-nav', id],
    queryFn: async () => {
      const res = await api.get(`/normativa/articulo/${id}/anterior-siguiente`);
      return res.data;
    },
    enabled: !!usuario && !!id,
  });

  const { data: subrayados = [], refetch: refetchSubrayados } = useQuery({
    queryKey: ['subrayados-articulo', id],
    queryFn: async () => {
      const res = await api.get(`/normativa/subrayados/${id}`);
      return res.data;
    },
    enabled: !!usuario && !!id,
  });

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  useEffect(() => {
    if (nota?.contenido) setNotaTexto(nota.contenido);
  }, [nota]);

  useEffect(() => {
    const handleMouseUp = (e?: Event) => {
      // Pulsar el propio botón de subrayar no debe recalcular (ni borrar) la selección
      if ((e?.target as Element | null)?.closest?.('[data-menu-subrayado]')) return;
      requestAnimationFrame(() => {
        const seleccion = window.getSelection();
        const texto = seleccion?.toString().trim() ?? '';
        if (!texto || texto.length < 3 || !seleccion || seleccion.rangeCount === 0) {
          setMenuSubrayado(null);
          return;
        }

        try {
          const range = seleccion.getRangeAt(0);
          // La posición se calcula recorriendo el propio Range del navegador dentro
          // del contenedor del artículo, no buscando el texto seleccionado con
          // indexOf sobre todo el contenido: así no falla cuando la frase elegida
          // se repite en otra parte del artículo (muy habitual en texto legal).
          const contenedor = document.querySelector('[data-articulo-contenido]');
          if (!contenedor || !contenedor.contains(range.startContainer)) {
            setMenuSubrayado(null);
            return;
          }
          const inicio = calcularOffsetEnContenedor(contenedor, range);
          const fin = inicio + texto.length;

          const rect = range.getBoundingClientRect();
          if (rect.width === 0) return;
          setMenuSubrayado({
            x: rect.left + rect.width / 2,
            y: rect.top - 50,
            inicio, fin, texto,
          });
        } catch {}
      });
    };
    // ⭐ En el móvil la selección se ajusta con las asas y eso no siempre lanza touchend:
    // se escucha también el cambio de selección (con una pequeña espera).
    let espera: ReturnType<typeof setTimeout> | undefined;
    const alCambiarSeleccion = () => {
      if (!esPantallaTactil()) return;
      clearTimeout(espera);
      espera = setTimeout(() => handleMouseUp(), 300);
    };
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);
    document.addEventListener('selectionchange', alCambiarSeleccion);
    return () => {
      clearTimeout(espera);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
      document.removeEventListener('selectionchange', alCambiarSeleccion);
    };
  }, []);

  useEffect(() => {
    const cargarVoces = () => {
      const v = window.speechSynthesis.getVoices();
      setVoces(v.filter((voz) => voz.lang.startsWith('es')));
    };
    cargarVoces();
    window.speechSynthesis.onvoiceschanged = cargarVoces;
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    if (autoplay && articulo && voces.length > 0) {
      setModoContinuo(true);
      setTimeout(() => iniciarAudio(true), 500);
    }
  }, [autoplay, articulo, voces]);

  // ⭐ Voz según el sexo elegido (ver lib/voces.ts): si no hay voz de hombre, la misma más grave
  const aplicarVoz = (u: SpeechSynthesisUtterance, genero: 'mujer' | 'hombre') => {
    const { voz, pitch } = elegirVoz(voces, genero);
    if (voz) { u.voice = voz; u.lang = voz.lang; }
    u.pitch = pitch;
  };

  const iniciarAudio = (continuo = false) => {
    if (!articulo?.contenido) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`${etiquetaArticulo(articulo.numero)}. ${articulo.contenido}`);
    u.lang = 'es-ES';
    u.rate = velocidad;
    aplicarVoz(u, vozGenero);
    u.onstart = () => setReproduciendo(true);
    u.onend = () => {
      setReproduciendo(false);
      if ((continuo || modoContinuo) && navArticulos?.siguiente) {
        router.replace(`/app/articulo/${navArticulos.siguiente.id}?leyId=${leyId ?? ''}&oposicionId=${oposicionId ?? ''}&autoplay=true`);
      }
    };
    u.onerror = () => setReproduciendo(false);
    window.speechSynthesis.speak(u);
  };

  const pararAudio = () => {
    window.speechSynthesis.cancel();
    setReproduciendo(false);
    setModoContinuo(false);
  };

  const cambiarVelocidad = () => {
    const velocidades = [0.75, 1, 1.25, 1.5, 2];
    const idx = velocidades.indexOf(velocidad);
    setVelocidad(velocidades[(idx + 1) % velocidades.length]);
    if (reproduciendo) { pararAudio(); setTimeout(() => iniciarAudio(modoContinuo), 100); }
  };

  const cambiarVoz = () => {
    const nuevo = vozGenero === 'mujer' ? 'hombre' : 'mujer';
    setVozGenero(nuevo);
    if (reproduciendo) {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        const u = new SpeechSynthesisUtterance(`${etiquetaArticulo(articulo.numero)}. ${articulo.contenido}`);
        u.lang = 'es-ES';
        u.rate = velocidad;
        aplicarVoz(u, nuevo);
        u.onstart = () => setReproduciendo(true);
        u.onend = () => {
          setReproduciendo(false);
          if (modoContinuo && navArticulos?.siguiente) {
            router.replace(`/app/articulo/${navArticulos.siguiente.id}?leyId=${leyId ?? ''}&oposicionId=${oposicionId ?? ''}&autoplay=true`);
          }
        };
        window.speechSynthesis.speak(u);
      }, 150);
    }
  };

  const irAnterior = () => {
    if (!navArticulos?.anterior) return;
    pararAudio();
    // ⭐ replace (no push): así "Volver" siempre regresa a la Ley/Tema de origen,
    // sin importar por cuántos artículos se haya navegado con Anterior/Siguiente.
    router.replace(`/app/articulo/${navArticulos.anterior.id}?leyId=${leyId ?? ''}&oposicionId=${oposicionId ?? ''}`);
  };

  const irSiguiente = () => {
    if (!navArticulos?.siguiente) return;
    pararAudio();
    router.replace(`/app/articulo/${navArticulos.siguiente.id}?leyId=${leyId ?? ''}&oposicionId=${oposicionId ?? ''}`);
  };

  // Swipe táctil izquierda/derecha para navegar entre artículos
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const UMBRAL = 60;
    if (deltaX > UMBRAL) irAnterior();
    else if (deltaX < -UMBRAL) irSiguiente();
    touchStartX.current = null;
  };

  const guardarNota = async (texto: string) => {
    setNotaGuardando(true);
    try {
      await api.post(`/normativa/nota/${id}`, { contenido: texto });
      setNotaGuardada(true);
      setTimeout(() => setNotaGuardada(false), 2000);
    } finally {
      setNotaGuardando(false);
    }
  };

  const handleNotaChange = (texto: string) => {
    setNotaTexto(texto);
    setNotaGuardada(false);
    clearTimeout(notaTimeoutRef.current);
    notaTimeoutRef.current = setTimeout(() => guardarNota(texto), 1500);
  };

  const crearSubrayado = async () => {
    if (!menuSubrayado) return;
    await api.post(`/normativa/subrayados/${id}`, {
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
    await api.delete(`/normativa/subrayados/${subId}`);
    setSubrayadoSeleccionado(null);
    refetchSubrayados();
  };

  const renderTextoConSubrayados = (texto: string) => {
    if (!subrayados.length) return <span>{texto}</span>;

    const partes: { texto: string; subrayado?: any }[] = [];
    let pos = 0;
    const ordenados = [...subrayados].sort((a: any, b: any) => a.inicio - b.inicio);

    for (const sub of ordenados) {
      if (sub.inicio > pos) partes.push({ texto: texto.slice(pos, sub.inicio) });
      partes.push({ texto: texto.slice(sub.inicio, sub.fin), subrayado: sub });
      pos = sub.fin;
    }
    if (pos < texto.length) partes.push({ texto: texto.slice(pos) });

    return (
      <>
        {partes.map((parte, i) =>
          parte.subrayado ? (
            <mark
              key={i}
              onClick={() => setSubrayadoSeleccionado(subrayadoSeleccionado === parte.subrayado.id ? null : parte.subrayado.id)}
              style={{ background: 'var(--hx-fef08a)', cursor: 'pointer', borderRadius: '2px', position: 'relative' }}
            >
              {parte.texto}
              {subrayadoSeleccionado === parte.subrayado.id && (
                <button
                  onClick={(e) => { e.stopPropagation(); borrarSubrayado(parte.subrayado.id); }}
                  style={{ position: 'absolute', top: '-32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--c-primario)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', zIndex: 20 }}
                >
                  <Trash2 size={12} /> Quitar
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

  if (cargando || isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: BG_APP, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 13, color: TEXT_MUTED }}>Cargando…</span>
      </div>
    );
  }

  if (isError || !articulo) {
    return (
      <div style={{ minHeight: '100vh', background: BG_APP, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--hx-dc2626)' }}>No se ha podido cargar el artículo. Inténtalo de nuevo.</span>
        <button onClick={() => router.back()} style={{ ...botonPildora, color: TEXT_SECONDARY }}>
          <ArrowLeft size={14} /> Volver
        </button>
      </div>
    );
  }

  const leyNombre = articulo.capitulo?.tituloRef?.versionLey?.ley?.nombre
    ?? articulo.tituloRef?.versionLey?.ley?.nombre
    ?? articulo.seccion?.capitulo?.tituloRef?.versionLey?.ley?.nombre
    ?? 'Normativa';

  const versionLeyId = articulo.capitulo?.tituloRef?.versionLey?.id
    ?? articulo.tituloRef?.versionLey?.id
    ?? articulo.seccion?.capitulo?.tituloRef?.versionLey?.id;

  const puedeTest = !!oposicionId && !!versionLeyId;
  const sonando = reproduciendo && !modoContinuo;
  const sonandoSeguido = reproduciendo && modoContinuo;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 96 }}>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}
      >
        {/* Cabecera: volver, ley y número de artículo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
          <button
            onClick={() => { pararAudio(); router.back(); }}
            aria-label="Volver"
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={18} color={TEXT_PRIMARY} />
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>
              {leyNombre}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1.2, marginTop: 2 }}>
              {etiquetaArticulo(articulo.numero)}
            </div>
          </div>
        </div>

        {/* Anterior / siguiente */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <button
            onClick={irAnterior}
            disabled={!navArticulos?.anterior}
            style={{ ...botonPildora, opacity: navArticulos?.anterior ? 1 : 0.45, cursor: navArticulos?.anterior ? 'pointer' : 'default' }}
          >
            <ChevronLeft size={15} />
            {navArticulos?.anterior ? `Art. ${navArticulos.anterior.numero}` : 'Anterior'}
          </button>
          <button
            onClick={irSiguiente}
            disabled={!navArticulos?.siguiente}
            style={{ ...botonPildora, opacity: navArticulos?.siguiente ? 1 : 0.45, cursor: navArticulos?.siguiente ? 'pointer' : 'default' }}
          >
            {navArticulos?.siguiente ? `Art. ${navArticulos.siguiente.numero}` : 'Siguiente'}
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Texto del artículo con el audio arriba */}
        <div style={{ background: 'var(--c-superficie)', borderRadius: 20, boxShadow: SOMBRA, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid var(--c-borde)' }}>
            <button
              onClick={() => { if (sonando) pararAudio(); else { setModoContinuo(false); iniciarAudio(false); } }}
              aria-label={sonando ? 'Pausar' : 'Escuchar el artículo'}
              style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: sonando ? 'var(--c-primario)' : 'var(--c-azul-bg)' }}
            >
              {sonando ? <Pause size={16} color="var(--c-primario-texto)" /> : <Play size={16} color="var(--c-azul)" style={{ marginLeft: 2 }} />}
            </button>
            <button
              onClick={() => { if (sonandoSeguido) pararAudio(); else { setModoContinuo(true); iniciarAudio(true); } }}
              title="Escuchar este artículo y seguir con los siguientes"
              style={{ ...chip, background: sonandoSeguido ? 'var(--c-primario)' : 'var(--c-superficie-2)', color: sonandoSeguido ? 'var(--c-primario-texto)' : TEXT_SECONDARY }}
            >
              <ListMusic size={13} /> {sonandoSeguido ? 'Parar' : 'Seguidos'}
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={cambiarVoz} aria-label={vozGenero === 'mujer' ? 'Voz de mujer: cambiar' : 'Voz de hombre: cambiar'} style={{ ...chip, background: 'var(--c-superficie-2)', color: TEXT_SECONDARY }}>
              <User size={13} /> {vozGenero === 'mujer' ? 'Mujer' : 'Hombre'}
            </button>
            <button onClick={cambiarVelocidad} aria-label="Cambiar velocidad" style={{ ...chip, background: 'var(--c-superficie-2)', color: TEXT_SECONDARY, minWidth: 44, justifyContent: 'center' }}>
              {velocidad}x
            </button>
          </div>

          <div
            data-articulo-contenido
            style={{ padding: '16px 18px 18px', fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.8, whiteSpace: 'pre-wrap', userSelect: 'text', position: 'relative', wordBreak: 'break-word' }}
          >
            {renderTextoConSubrayados(articulo.contenido ?? '')}
          </div>
          <div style={{ padding: '0 18px 14px', fontSize: 11, color: TEXT_MUTED, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Highlighter size={12} /> Selecciona un texto para subrayarlo · desliza para cambiar de artículo
          </div>
        </div>

        {/* Practicar */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 8, padding: '0 4px' }}>Practica este artículo</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              onClick={() => { if (puedeTest) router.push(`/app/test/${oposicionId}?versionLeyId=${versionLeyId}&n=15`); }}
              disabled={!puedeTest}
              style={{ ...tarjetaAccion, opacity: puedeTest ? 1 : 0.5, cursor: puedeTest ? 'pointer' : 'default' }}
            >
              <span style={{ ...iconoAccion, background: VERDE_BG }}><ClipboardCheck size={19} color={VERDE} /></span>
              <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Test</span>
              <span style={{ fontSize: 12, color: TEXT_MUTED, lineHeight: 1.35 }}>De los artículos de la ley que entran en tu temario</span>
            </button>
            <button
              onClick={() => router.push(`/app/flashcards/repasar?articuloId=${articulo.id}&leyId=${leyId ?? ''}&oposicionId=${oposicionId ?? ''}`)}
              style={tarjetaAccion}
            >
              <span style={{ ...iconoAccion, background: COLOR_FC_BG }}><Layers size={19} color={COLOR_FC} /></span>
              <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Flashcards</span>
              <span style={{ fontSize: 12, color: TEXT_MUTED, lineHeight: 1.35 }}>Repasa este artículo</span>
            </button>
          </div>
        </div>

        {/* Notas personales */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY }}>Mis notas</span>
            <span style={{ fontSize: 11, color: notaGuardada ? 'var(--c-verde)' : TEXT_MUTED, display: 'flex', alignItems: 'center', gap: 4 }}>
              {notaGuardando ? 'Guardando…' : notaGuardada ? <><Check size={12} /> Guardado</> : ''}
            </span>
          </div>
          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: 12 }}>
            <textarea
              value={notaTexto}
              onChange={(e) => handleNotaChange(e.target.value)}
              placeholder="Escribe tus notas sobre este artículo. Se guardan solas."
              style={{ width: '100%', minHeight: 90, padding: '10px 12px', fontSize: 13, color: TEXT_PRIMARY, border: '1px solid var(--c-borde)', borderRadius: 12, outline: 'none', resize: 'vertical', lineHeight: 1.6, background: 'var(--c-superficie-2)', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        <BotonSubrayar
          menu={menuSubrayado}
          onSubrayar={crearSubrayado}
          onCancelar={() => { setMenuSubrayado(null); window.getSelection()?.removeAllRanges(); }}
        />
      </div>

      <FooterNavegacion usuario={usuario} oposicionId={oposicionId ?? undefined} activo="estudiar" />
    </div>
  );
}

const botonPildora: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 999, border: 'none',
  background: 'var(--c-superficie)', boxShadow: SOMBRA, fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, cursor: 'pointer',
};
const chip: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4, padding: '7px 9px', borderRadius: 999, border: 'none',
  fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
};
const tarjetaAccion: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: 14, textAlign: 'left',
  background: 'var(--c-superficie)', border: 'none', borderRadius: 18, boxShadow: SOMBRA, cursor: 'pointer',
};
const iconoAccion: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6,
};

// Recorre el contenedor dado (texto ya renderizado en el DOM) y calcula el
// desplazamiento en caracteres del punto de inicio de `range` respecto al
// principio de ese contenedor. Al basarse en el propio Range de la selección
// (y no en buscar el texto seleccionado con indexOf sobre la cadena completa),
// no falla cuando la frase seleccionada se repite en otra parte del artículo.
function calcularOffsetEnContenedor(contenedor: Node, range: Range): number {
  let offset = 0;
  const walker = document.createTreeWalker(contenedor, NodeFilter.SHOW_TEXT);
  let nodo: Node | null;
  while ((nodo = walker.nextNode())) {
    if (nodo === range.startContainer) {
      return offset + range.startOffset;
    }
    offset += nodo.textContent?.length ?? 0;
  }
  return offset;
}
