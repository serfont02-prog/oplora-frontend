'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ArrowLeft, Play, Pause, BookOpen, Lightbulb, Network, AlertTriangle, HelpCircle, Check, User, Highlighter, Trash2, X, ChevronRight, CheckCircle2, XCircle, FileText, Minus, Plus } from 'lucide-react';
import { BotonEnPapel } from '@/components/temario/TemarioPapel';
import { FooterNavegacion } from '@/app/app/dashboard/page';
import { renderReferencias, renderReferenciasTitulo, construirMapaSiglas, construirMapaNombres } from '@/lib/referenciasArticulos';
import { BG_TEMA as BG_APP, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SOMBRA } from '@/styles/tokens';

// ⭐ Colores de las cajas destacadas (compartidos por las cajas y por la barra de filtros).
// "Idea" y "Regla de examen" se fusionan en una sola categoría visual ("Idea clave"): ambas
// cumplen la misma función (algo a recordar/aplicar). "Trampa de examen" se mantiene aparte a
// propósito: es una alerta, no un tip, y ese contraste es lo que la hace útil de un vistazo.
const DESTACADO_CONFIG: Record<string, { bg: string; border: string; color: string; Icono: any; label: string }> = {
  EJEMPLO: { bg: 'var(--c-superficie-2)', border: 'var(--c-borde)', color: 'var(--c-texto-2)', Icono: BookOpen, label: 'Ejemplo' },
  IDEA: { bg: 'var(--hx-fef9e7)', border: 'var(--hx-fde68a)', color: 'var(--hx-92400e)', Icono: Lightbulb, label: 'Idea clave' },
  'REGLA DE EXAMEN': { bg: 'var(--hx-fef9e7)', border: 'var(--hx-fde68a)', color: 'var(--hx-92400e)', Icono: Lightbulb, label: 'Idea clave' },
  ESQUEMA: { bg: 'var(--hx-f3fbf5)', border: 'var(--hx-bbf0cb)', color: 'var(--hx-15803d)', Icono: Network, label: 'Esquema' },
  'TRAMPA DE EXAMEN': { bg: 'var(--hx-fef2f2)', border: 'var(--hx-fca5a5)', color: 'var(--hx-dc2626)', Icono: AlertTriangle, label: 'Trampa de examen' },
  'PREGUNTA FRECUENTE': { bg: 'var(--hx-fff7ed)', border: 'var(--hx-fed7aa)', color: 'var(--hx-c2410c)', Icono: HelpCircle, label: 'Pregunta de examen' },
};

// ⭐ Filtros de la barra fija: cada chip muestra/oculta un tipo de caja. Los ejemplos forman
// parte de la explicación y se muestran siempre.
type FiltroCaja = 'trampa' | 'pregunta' | 'esquema' | 'idea';
const FILTROS_CAJA: { key: FiltroCaja; label: string; titulos: string[]; cfg: string }[] = [
  { key: 'trampa', label: 'Trampa', titulos: ['TRAMPA DE EXAMEN'], cfg: 'TRAMPA DE EXAMEN' },
  { key: 'pregunta', label: 'Pregunta', titulos: ['PREGUNTA FRECUENTE'], cfg: 'PREGUNTA FRECUENTE' },
  { key: 'esquema', label: 'Esquema', titulos: ['ESQUEMA'], cfg: 'ESQUEMA' },
  { key: 'idea', label: 'Idea', titulos: ['IDEA', 'REGLA DE EXAMEN'], cfg: 'IDEA' },
];
const FILTROS_POR_DEFECTO: Record<FiltroCaja, boolean> = { trampa: true, pregunta: true, esquema: true, idea: true };
const CLAVE_FILTROS = 'oplora-apunte-filtros-cajas';

function filtroDeTitulo(titulo: string): FiltroCaja | null {
  return FILTROS_CAJA.find((f) => f.titulos.includes(titulo))?.key ?? null;
}

/** ⭐ Trocea el texto en fragmentos cortos (≤ 220 caracteres) por frases, con su posición en el texto. */
function trocearTexto(texto: string, max = 220): { texto: string; inicio: number }[] {
  const res: { texto: string; inicio: number }[] = [];
  if (!texto) return res;
  const frases = texto.match(/[^.!?;:\n]+[.!?;:]*\s*|\n+/g) ?? [texto];
  let actual = '';
  let inicioActual = 0;
  let cursor = 0;
  const empujar = () => {
    const t = actual.trim();
    if (t) res.push({ texto: t, inicio: inicioActual });
    actual = '';
  };
  for (const frase of frases) {
    const pos = cursor;
    cursor += frase.length;
    if (!frase.trim()) continue;
    if (frase.length > max) {
      // Frase muy larga: se corta por comas o espacios.
      empujar();
      let resto = frase;
      let off = pos;
      while (resto.length > max) {
        let corte = resto.lastIndexOf(', ', max);
        if (corte < max * 0.4) corte = resto.lastIndexOf(' ', max);
        if (corte <= 0) corte = max;
        res.push({ texto: resto.slice(0, corte + 1).trim(), inicio: off });
        off += corte + 1;
        resto = resto.slice(corte + 1);
      }
      actual = resto;
      inicioActual = off;
      continue;
    }
    if (!actual) inicioActual = pos;
    if ((actual + frase).length > max) {
      empujar();
      inicioActual = pos;
    }
    actual += frase;
  }
  empujar();
  return res;
}

export default function ApunteOploraPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { usuario, cargando } = useAuth();

  const [fontSize, setFontSize] = useState(13);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [velocidad, setVelocidad] = useState(1);
  const [vozGenero, setVozGenero] = useState<'mujer' | 'hombre'>('mujer');
  const [voces, setVoces] = useState<SpeechSynthesisVoice[]>([]);
  const [progreso, setProgreso] = useState(0);
  const [menuSubrayado, setMenuSubrayado] = useState<{ x: number; y: number; inicio: number; fin: number; texto: string } | null>(null);
  const [subrayadoSeleccionado, setSubrayadoSeleccionado] = useState<string | null>(null);
  const [filtrosCajas, setFiltrosCajas] = useState<Record<FiltroCaja, boolean>>(FILTROS_POR_DEFECTO);

  // la elección de filtros se recuerda en este dispositivo (si el navegador lo permite)
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_FILTROS);
      if (guardado) setFiltrosCajas({ ...FILTROS_POR_DEFECTO, ...JSON.parse(guardado) });
    } catch {}
  }, []);
  const toggleFiltroCaja = (key: FiltroCaja) => {
    setFiltrosCajas((prev) => {
      const nuevo = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(CLAVE_FILTROS, JSON.stringify(nuevo)); } catch {}
      return nuevo;
    });
  };

  const contentRef = useRef<HTMLDivElement>(null);
  const ultimoGuardado = useRef(0);
  const throttleTimeout = useRef<any>(null);

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


// ⭐ derivar oposicionId contemplando ambos casos posibles
const oposicionId = apunte?.tema?.convocatoria?.oposicion?.id ?? apunte?.oposicion?.id;

const { data: leyesOposicion = [] } = useQuery({
  queryKey: ['leyes-siglas', oposicionId],
  queryFn: async () => {
    const res = await api.get(`/leyes/oposicion/${oposicionId}`);
    return res.data;
  },
  enabled: !!oposicionId,
});

const mapaSiglas = useMemo(() => construirMapaSiglas(leyesOposicion), [leyesOposicion]);
// ⭐ versionLeyId → nombre de la ley, para indicar en el modal a qué ley pertenece el artículo
const mapaNombresLey = useMemo(() => construirMapaNombres(leyesOposicion), [leyesOposicion]);

  useEffect(() => {
    if (progresoGuardado?.porcentaje) {
      setProgreso(progresoGuardado.porcentaje);
    }
  }, [progresoGuardado]);

  const esFormatoNuevo = apunte?.versionParser === 2 && apunte?.contenidoEstructurado?.bloques;
  const bloques = esFormatoNuevo ? apunte.contenidoEstructurado.bloques : [];
  const secciones = !esFormatoNuevo ? (apunte?.contenidoEstructurado?.secciones ?? []) : [];
  // nº de cajas de cada tipo en este apunte (los chips sin cajas se muestran atenuados)
  const conteoCajas = useMemo(() => {
    const c: Record<FiltroCaja, number> = { trampa: 0, pregunta: 0, esquema: 0, idea: 0 };
    for (const b of bloques) {
      if (b.tipo !== 'destacado') continue;
      const f = filtroDeTitulo(b.titulo);
      if (f) c[f]++;
    }
    return c;
  }, [bloques]);

  const textoCompleto = esFormatoNuevo
    ? bloques.map((b: any) => {
        if (b.tipo === 'lista') return b.items.join('. ');
        return b.texto ?? '';
      }).join(' ')
    : secciones.map((s: any) => `${s.titulo}. ${s.contenido}`).join(' ');

  // Guardar progreso final al salir
  useEffect(() => {
    return () => {
      sesionAudio.current++;
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
        if (!texto || texto.length < 3 || !seleccion || seleccion.rangeCount === 0) {
          setMenuSubrayado(null);
          return;
        }

        try {
          const range = seleccion.getRangeAt(0);
          // Buscamos el bloque (párrafo, ítem de lista o artículo) que lleva
          // registrado su desplazamiento (data-bloque-offset) dentro del texto
          // completo del apunte. Si la selección cae fuera de un bloque con ese
          // atributo (p. ej. en un título o un destacado), no se puede subrayar.
          const nodoInicio = range.startContainer;
          const elementoInicio = nodoInicio.nodeType === Node.ELEMENT_NODE
            ? (nodoInicio as Element)
            : nodoInicio.parentElement;
          const contenedor = elementoInicio?.closest('[data-bloque-offset]');
          if (!contenedor) { setMenuSubrayado(null); return; }

          const base = parseInt(contenedor.getAttribute('data-bloque-offset') || '0', 10);
          const offsetLocal = calcularOffsetEnContenedor(contenedor, range);
          const inicio = base + offsetLocal;
          const fin = inicio + texto.length;

          const rect = range.getBoundingClientRect();
          if (rect.width === 0) return;
          setMenuSubrayado({
            x: rect.left + rect.width / 2,
            y: rect.top - 50,
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

  useEffect(() => {
    const cargarVoces = () => {
      const v = window.speechSynthesis.getVoices();
      setVoces(v.filter((voz) => voz.lang.startsWith('es')));
    };
    cargarVoces();
    window.speechSynthesis.onvoiceschanged = cargarVoces;
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  const getVoz = (genero: 'mujer' | 'hombre') => {
    if (voces.length === 0) return null;
    const keysMujer = ['female', 'mujer', 'monica', 'paulina', 'lucia', 'woman', 'laura', 'maria', 'helena'];
    const keysHombre = ['male', 'hombre', 'jorge', 'pablo', 'diego', 'carlos', 'juan'];
    if (genero === 'mujer') {
      return voces.find((v) => keysMujer.some((k) => v.name.toLowerCase().includes(k))) ?? voces[0];
    }
    return voces.find((v) => keysHombre.some((k) => v.name.toLowerCase().includes(k))) ?? voces[voces.length > 1 ? 1 : 0];
  };

  // ⭐ Audio por frases: antes se mandaba el apunte entero en una sola locución y Chrome en
  // Android la corta o no la reproduce (según el altavoz no sonaba nada). Ahora se trocea en
  // fragmentos cortos y se leen uno tras otro, como en Artículos (que son textos cortos).
  const fragmentos = useMemo(() => trocearTexto(textoCompleto), [textoCompleto]);
  const fragmentoActual = useRef(0);
  const sesionAudio = useRef(0);

  const hablarDesde = (inicio: number, genero: 'mujer' | 'hombre' = vozGenero, rate: number = velocidad) => {
    const synth = window.speechSynthesis;
    if (!synth || fragmentos.length === 0) return;
    synth.cancel();
    const sesion = ++sesionAudio.current;
    const total = Math.max(1, textoCompleto.length);
    const decir = (j: number) => {
      if (sesion !== sesionAudio.current) return;
      if (j >= fragmentos.length) {
        fragmentoActual.current = 0;
        setAudioPlaying(false);
        setAudioProgress(0);
        return;
      }
      fragmentoActual.current = j;
      const f = fragmentos[j];
      setAudioProgress(Math.round((f.inicio / total) * 100));
      const u = new SpeechSynthesisUtterance(f.texto);
      u.lang = 'es-ES';
      u.rate = rate;
      const voz = getVoz(genero);
      if (voz) u.voice = voz;
      u.onboundary = (e) => {
        if (sesion === sesionAudio.current) setAudioProgress(Math.round(((f.inicio + e.charIndex) / total) * 100));
      };
      u.onend = () => decir(j + 1);
      u.onerror = (e: any) => {
        if (e?.error === 'interrupted' || e?.error === 'canceled') return;
        decir(j + 1);
      };
      synth.speak(u);
    };
    setAudioPlaying(true);
    // Pequeña pausa tras cancel(): algunos Chrome ignoran un speak() inmediato.
    setTimeout(() => decir(inicio), 60);
  };

  // Reanuda desde el fragmento en el que se pausó.
  const reproducir = () => hablarDesde(fragmentoActual.current);

  const pararAudio = () => {
    sesionAudio.current++;
    window.speechSynthesis?.cancel();
    setAudioPlaying(false);
  };

  const cycleVelocidad = () => {
    const velocidades = [1, 1.25, 1.5, 2, 0.75];
    const i = velocidades.indexOf(velocidad);
    const nueva = velocidades[(i + 1) % velocidades.length];
    setVelocidad(nueva);
    if (audioPlaying) hablarDesde(fragmentoActual.current, vozGenero, nueva);
  };

  const cambiarVoz = () => {
    const nuevo = vozGenero === 'mujer' ? 'hombre' : 'mujer';
    setVozGenero(nuevo);
    if (audioPlaying) hablarDesde(fragmentoActual.current, nuevo, velocidad);
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
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: BG_APP }}>
        <div style={{ fontSize: 13, color: TEXT_MUTED }}>Cargando apunte…</div>
      </div>
    );
  }

  if (!apunte) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: BG_APP, padding: '1.25rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--c-azul-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
            <FileText size={22} color="var(--c-azul)" />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Apunte no encontrado</div>
          <button onClick={() => router.back()} style={{ marginTop: 14, padding: '10px 20px', background: 'var(--c-primario)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  let offsetAcumulado = 0;
  const numeroTema = apunte.tema?.numero;

  return (
    <div style={{ minHeight: '100vh', height: '100vh', background: BG_APP, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Cabecera fija: volver, título, temario en papel, filtros, letra y progreso */}
      <div style={{ flexShrink: 0, background: BG_APP, padding: '12px 1.25rem 10px', zIndex: 20 }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => { pararAudio(); router.back(); }}
              aria-label="Volver"
              style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <ArrowLeft size={18} color={TEXT_PRIMARY} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {numeroTema ? `Tema ${numeroTema} · Apuntes OPLORA` : 'Apuntes OPLORA'}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>
                {apunte.tema?.titulo || apunte.titulo}
              </div>
            </div>
            {/* ⭐ Antes había un botón para descargar el PDF. Los apuntes se estudian en la app y el
                temario completo se vende impreso: el botón lleva a su ficha (si la oposición lo tiene). */}
            <BotonEnPapel oposicionId={oposicionId} />
          </div>

          {/* ⭐ Filtros: cada chip muestra u oculta un tipo de caja. Desmarcándolos todos quedan
              solo los apuntes (y los ejemplos). */}
          {esFormatoNuevo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -2px', padding: '0 2px' }}>
              {FILTROS_CAJA.map((f) => {
                const cfg = DESTACADO_CONFIG[f.cfg];
                const activo = filtrosCajas[f.key];
                const sinCajas = conteoCajas[f.key] === 0;
                const Icono = cfg.Icono;
                return (
                  <button
                    key={f.key}
                    role="checkbox"
                    aria-checked={activo}
                    onClick={() => toggleFiltroCaja(f.key)}
                    title={activo ? `Ocultar ${f.label.toLowerCase()}` : `Mostrar ${f.label.toLowerCase()}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                      padding: '6px 10px', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      background: activo ? cfg.bg : 'var(--c-superficie)',
                      border: `1px solid ${activo ? cfg.border : 'var(--c-borde)'}`,
                      color: activo ? cfg.color : TEXT_MUTED,
                      opacity: sinCajas ? 0.45 : 1,
                    }}
                  >
                    {activo ? <Icono size={13} /> : <span style={{ width: 13, height: 13, borderRadius: 4, border: '1.5px solid var(--c-chevron)', flexShrink: 0 }} />}
                    {f.label}
                    {!sinCajas && <span style={{ fontWeight: 500, opacity: 0.7 }}>{conteoCajas[f.key]}</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tamaño de letra y progreso de lectura */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--c-superficie)', borderRadius: 999, boxShadow: SOMBRA, flexShrink: 0 }}>
              <button onClick={() => setFontSize((t) => Math.max(11, t - 1))} aria-label="Letra más pequeña" style={botonLetra}><Minus size={13} /></button>
              <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_SECONDARY, minWidth: 30, textAlign: 'center' }}>Aa {fontSize}</span>
              <button onClick={() => setFontSize((t) => Math.min(20, t + 1))} aria-label="Letra más grande" style={botonLetra}><Plus size={13} /></button>
            </div>
            <div style={{ flex: 1, height: 6, background: 'var(--c-pista)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${progreso}%`, height: '100%', background: 'var(--c-azul)', borderRadius: 999, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, flexShrink: 0 }}>{progreso}% leído</span>
          </div>
        </div>
      </div>

      {/* Contenido de lectura */}
      <div
        ref={contentRef}
        onScroll={updateProgreso}
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '4px 1.25rem 96px', position: 'relative' }}
      >
       <div style={{ maxWidth: 600, margin: '0 auto', background: 'var(--c-superficie)', borderRadius: 20, boxShadow: SOMBRA, overflow: 'hidden' }}>
        {/* Audio: siempre arriba del texto, igual que en Artículo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid var(--c-borde)' }}>
          <button
            onClick={() => { if (audioPlaying) pararAudio(); else reproducir(); }}
            aria-label={audioPlaying ? 'Pausar' : 'Escuchar el apunte'}
            style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: audioPlaying ? 'var(--c-primario)' : 'var(--c-azul-bg)' }}
          >
            {audioPlaying ? <Pause size={16} color="var(--c-primario-texto)" /> : <Play size={16} color="var(--c-azul)" style={{ marginLeft: 2 }} />}
          </button>
          <div style={{ flex: 1, height: 4, background: 'var(--c-pista)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${audioProgress}%`, height: '100%', background: 'var(--c-azul)', transition: 'width 0.5s' }} />
          </div>
          <button onClick={cambiarVoz} aria-label="Cambiar voz" style={{ ...chipAudio }}>
            <User size={13} /> {vozGenero === 'mujer' ? 'Mujer' : 'Hombre'}
          </button>
          <button onClick={cycleVelocidad} aria-label="Cambiar velocidad" style={{ ...chipAudio, minWidth: 44, justifyContent: 'center' }}>
            {velocidad}x
          </button>
        </div>

        <div style={{ padding: '6px 18px 20px' }}>
        {apunte.descripcion && (
          <div style={{ fontSize: 12, color: TEXT_MUTED, margin: '10px 0 4px' }}>{apunte.descripcion}</div>
        )}

        {esFormatoNuevo ? (
  // ⭐ NUEVO FORMATO — renderizado por tipo de bloque
  <>
    {bloques.map((bloque: any) => {
      // ⭐ Cada bloque ocupa, dentro de `textoCompleto` (usado también para el audio),
      // el mismo tramo que le corresponde aquí: su texto (o sus items unidos por ". "
      // en el caso de las listas, o "" si es un destacado, que no aporta texto) más un
      // espacio de separación. Guardamos dónde empieza (offsetInicioBloque) para poder
      // traducir la posición de una selección de texto dentro de este bloque a la
      // posición real que se guarda en el subrayado.
      const contribucionBloque = bloque.tipo === 'lista'
        ? bloque.items.join('. ').length
        : bloque.tipo === 'destacado'
        ? 0
        : (bloque.texto?.length ?? 0);
      const offsetInicioBloque = offsetAcumulado;
      offsetAcumulado += contribucionBloque + 1;

      switch (bloque.tipo) {
        case 'titulo':
          return bloque.nivel === 1 ? (
            <div key={bloque.id} style={{
              fontSize: 17, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1.35,
              marginTop: 28, marginBottom: 12,
              paddingLeft: 10, borderLeft: '3px solid var(--c-azul)',
            }}>
              {renderReferenciasTitulo(bloque.texto, mapaSiglas, abrirArticulo, `t${bloque.id}`)}
            </div>
          ) : bloque.nivel === 2 ? (
            <div key={bloque.id} style={{
              fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.4,
              marginTop: 22, marginBottom: 10,
              paddingLeft: 10, borderLeft: '2px solid var(--c-borde)',
            }}>
              {renderReferenciasTitulo(bloque.texto, mapaSiglas, abrirArticulo, `t${bloque.id}`)}
            </div>
          ) : (
            <div key={bloque.id} style={{
              fontSize: 13, fontWeight: 700, color: 'var(--c-azul)',
              marginTop: 18, marginBottom: 8,
            }}>
              {renderReferenciasTitulo(bloque.texto, mapaSiglas, abrirArticulo, `t${bloque.id}`)}
            </div>
          );

        

        
        case 'destacado': {
          // oculto si el usuario ha desmarcado su tipo en la barra de filtros
          const filtro = filtroDeTitulo(bloque.titulo);
          if (filtro && !filtrosCajas[filtro]) return null;
          const cfg = DESTACADO_CONFIG[bloque.titulo] ?? DESTACADO_CONFIG.IDEA;
          return (
            <div key={bloque.id} style={{
              background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 16,
              padding: '14px 16px', marginBottom: 16, marginTop: 18,
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: cfg.color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <cfg.Icono size={14} /> {cfg.label}
              </div>
              {bloque.contenido.map((c: any, i: number) => {
                if (c.tipo !== 'parrafo') return null;
                const texto: string = c.texto ?? '';
                // ⭐ En las preguntas: las opciones "a) b) c)" van sangradas y la solución
                // (✅ / ❌) separada con una línea fina, para que no se lea todo seguido.
                const esOpcion = /^[a-eA-E]\)\s/.test(texto);
                // la solución se escribe en texto ("Respuesta correcta (b): …" / "Ojo: …") porque los
                // emojis ✅ / ❌ se pierden al exportar el Word a PDF; aquí se les vuelve a poner el icono
                const REGEX_SOLUCION = /^(?:[✅❌]|Respuesta correcta\b|Ojo:)/u;
                const esSolucion = REGEX_SOLUCION.test(texto);
                const anteriorEsSolucion = i > 0 && REGEX_SOLUCION.test(bloque.contenido[i - 1]?.texto ?? '');
                const iconoSolucion = /^Respuesta correcta\b/.test(texto) ? 'ok' : /^Ojo:/.test(texto) ? 'ojo' : '';
                return (
                  <div key={i} style={{
                    fontSize: `${fontSize}px`, color: cfg.color, lineHeight: 1.75, opacity: 0.9,
                    marginBottom: i < bloque.contenido.length - 1 ? (esOpcion ? '4px' : '8px') : 0,
                    ...(esOpcion ? { paddingLeft: '12px' } : {}),
                    ...(esSolucion && !anteriorEsSolucion
                      ? { borderTop: `1px dashed ${cfg.border}`, paddingTop: '8px', marginTop: '8px', fontWeight: iconoSolucion === 'ojo' ? 400 : 600 }
                      : esSolucion && iconoSolucion !== 'ojo' ? { fontWeight: 600 } : {}),
                  }}>
                    {/* ⭐ las referencias [SIGLAS artículo N] también son clicables dentro de las cajas */}
                    {iconoSolucion === 'ok' && <CheckCircle2 size={15} color="var(--hx-16a34a)" style={{ verticalAlign: '-3px', marginRight: 5 }} />}
                    {iconoSolucion === 'ojo' && <XCircle size={15} color="var(--hx-dc2626)" style={{ verticalAlign: '-3px', marginRight: 5 }} />}
                    {renderReferencias(texto.replace(/^[✅❌]\s*/u, ''), mapaSiglas, abrirArticulo, `d${bloque.id}-${i}`)}
                  </div>
                );
              })}
            </div>
          );
        }

        case 'parrafo':
          return (
            <div key={bloque.id} data-bloque-offset={offsetInicioBloque} style={{
              fontSize: `${fontSize}px`, color: TEXT_PRIMARY, lineHeight: 1.85,
              letterSpacing: '0.01em', marginBottom: '14px',
              wordBreak: 'break-word', overflowWrap: 'anywhere',
              ...(bloque.negrita ? { fontWeight: 700 } : {}),
            }}>
              <BloqueTexto
                texto={bloque.texto}
                offsetBase={offsetInicioBloque}
                subrayados={subrayados}
                mapaSiglas={mapaSiglas}
                onAbrirArticulo={abrirArticulo}
                subrayadoSeleccionado={subrayadoSeleccionado}
                onToggleSubrayado={setSubrayadoSeleccionado}
                onBorrarSubrayado={borrarSubrayado}
              />
            </div>
          );
        case 'lista': {
          let offsetItem = offsetInicioBloque;
          return (
            <ul key={bloque.id} style={{
              margin: '0 0 16px', paddingLeft: '20px',
              listStyleType: bloque.ordenada ? 'decimal' : 'disc',
            }}>
              {bloque.items.map((item: string, i: number) => {
                const offsetInicioItem = offsetItem;
                offsetItem += item.length + 2; // el join de items es con ". "
                return (
                  <li key={i} data-bloque-offset={offsetInicioItem} style={{
                    fontSize: `${fontSize}px`, color: TEXT_PRIMARY, lineHeight: 1.75,
                    marginBottom: '6px', wordBreak: 'break-word', overflowWrap: 'anywhere',
                  }}>
                    <BloqueTexto
                      texto={item}
                      offsetBase={offsetInicioItem}
                      subrayados={subrayados}
                      mapaSiglas={mapaSiglas}
                      onAbrirArticulo={abrirArticulo}
                      subrayadoSeleccionado={subrayadoSeleccionado}
                      onToggleSubrayado={setSubrayadoSeleccionado}
                      onBorrarSubrayado={borrarSubrayado}
                    />
                  </li>
                );
              })}
            </ul>
          );
        }
        case 'articulo_legal':
          return (
            <div key={bloque.id} style={{
              background: 'var(--c-azul-bg)', border: 'none', borderRadius: 14,
              padding: '12px 14px', marginBottom: 14,
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--c-azul)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Artículo {bloque.numero}
              </div>
              <div data-bloque-offset={offsetInicioBloque} style={{ fontSize: `${fontSize}px`, color: TEXT_PRIMARY, lineHeight: 1.8, wordBreak: 'break-word' }}>
                <BloqueTexto
                  texto={bloque.texto}
                  offsetBase={offsetInicioBloque}
                  subrayados={subrayados}
                  mapaSiglas={mapaSiglas}
                  onAbrirArticulo={abrirArticulo}
                  subrayadoSeleccionado={subrayadoSeleccionado}
                  onToggleSubrayado={setSubrayadoSeleccionado}
                  onBorrarSubrayado={borrarSubrayado}
                />
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
          fontSize: 16, fontWeight: 800, color: TEXT_PRIMARY,
          marginBottom: 10, paddingLeft: 10,
          borderLeft: '3px solid var(--c-azul)',
        }}>
          {seccion.titulo}
        </div>
      ) : (
        <div style={{
          fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY,
          marginBottom: 8, paddingLeft: 10,
          borderLeft: '2px solid var(--c-borde)',
        }}>
          {seccion.titulo}
        </div>
      )}
      <div style={{
        fontSize: `${fontSize}px`, color: TEXT_PRIMARY, lineHeight: 1.85,
        letterSpacing: '0.01em', wordBreak: 'break-word', overflowWrap: 'anywhere',
      }}>
        {seccion.contenido}
      </div>
    </div>
  ))
) : apunte?.textoCompleto ? (
  <div style={{ fontSize: `${fontSize}px`, color: TEXT_PRIMARY, lineHeight: 1.85, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
    {apunte.textoCompleto}
  </div>
) : (
  <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--c-azul-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
      <FileText size={22} color="var(--c-azul)" />
    </div>
    <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 16 }}>
      Este apunte todavía no se puede leer en la app
    </div>
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <BotonEnPapel oposicionId={oposicionId} />
    </div>
  </div>
)}


        </div>
       </div>

        {/* Menú subrayar flotante */}
        {menuSubrayado && (
          <div style={{ position: 'fixed', left: menuSubrayado.x, top: menuSubrayado.y, transform: 'translateX(-50%)', zIndex: 50 }}>
            <button
              onClick={crearSubrayado}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--c-primario)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 999, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(15,23,42,0.25)', whiteSpace: 'nowrap' }}
            >
              <Highlighter size={14} /> Subrayar
            </button>
          </div>
        )}
      </div>

      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} activo="estudiar" />
      {articuloModal && (
        <div
          onClick={() => setArticuloModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'var(--c-overlay)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 60 }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--c-superficie)', borderRadius: '22px 22px 0 0', padding: '16px 1.25rem', paddingBottom: 'calc(18px + env(safe-area-inset-bottom))', width: '100%', maxWidth: 560, maxHeight: '82vh', overflowY: 'auto', boxShadow: '0 -8px 30px rgba(15,23,42,0.2)' }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--c-borde)', margin: '0 auto 14px' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div style={{ minWidth: 0 }}>
                {mapaNombresLey[articuloModal.versionLeyId] && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6, lineHeight: 1.45 }}>
                    {mapaNombresLey[articuloModal.versionLeyId]}
                  </div>
                )}
                <div style={{ fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1.3 }}>
                  Artículo {articuloModal.numero}
                </div>
              </div>
              <button
                onClick={() => setArticuloModal(null)}
                aria-label="Cerrar"
                style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'var(--c-superficie-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              >
                <X size={16} color={TEXT_SECONDARY} />
              </button>
            </div>

            {cargandoArticulo ? (
              <div style={{ fontSize: 13, color: TEXT_MUTED, textAlign: 'center', padding: '2rem 0' }}>Cargando artículo…</div>
            ) : articuloAbierto ? (
              <>
                {articuloAbierto.titulo && (
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 8 }}>{articuloAbierto.titulo}</div>
                )}
                <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.75, whiteSpace: 'pre-wrap', background: 'var(--c-superficie-2)', borderRadius: 14, padding: '12px 14px' }}>
                  {articuloAbierto.contenido}
                </div>
                <button
                  onClick={() => { router.push(`/app/articulo/${articuloAbierto.id}?oposicionId=${oposicionId ?? ''}`); }}
                  style={{ marginTop: 14, width: '100%', height: 48, background: 'var(--c-primario)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  Ver el artículo en la ley <ChevronRight size={16} />
                </button>
              </>
            ) : (
              <div style={{ fontSize: 13, color: TEXT_MUTED, textAlign: 'center', padding: '2rem 0' }}>Artículo no encontrado</div>
            )}
          </div>
        </div>
      )}
    </div>

    
  );

  
}

// Recorre el contenedor dado (texto ya renderizado en el DOM) y calcula el
// desplazamiento en caracteres del punto de inicio de `range` respecto al
// principio de ese contenedor. Al basarse en el propio Range de la selección
// (y no en buscar el texto seleccionado con indexOf sobre la cadena completa),
// no falla cuando la frase seleccionada se repite en otra parte del apunte.
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

// Combina, sobre un mismo bloque de texto, el resaltado amarillo de los
// subrayados guardados por el usuario con los enlaces "Artículo N" de las
// referencias [SIGLA artículo N]. Antes esto eran dos funciones separadas
// (renderTextoConSubrayados y TextoConReferencias) y solo la segunda se
// llegaba a usar en el render de los apuntes: los subrayados se guardaban en
// el servidor pero nunca se pintaban.
function BloqueTexto({
  texto,
  offsetBase,
  subrayados,
  mapaSiglas,
  onAbrirArticulo,
  subrayadoSeleccionado,
  onToggleSubrayado,
  onBorrarSubrayado,
}: {
  texto: string;
  offsetBase: number;
  subrayados: any[];
  mapaSiglas: Record<string, string>;
  onAbrirArticulo: (numero: string, versionLeyId: string) => void;
  subrayadoSeleccionado: string | null;
  onToggleSubrayado: (id: string | null) => void;
  onBorrarSubrayado: (id: string) => void;
}) {
  const subsLocal = subrayados
    .map((s: any) => ({ ...s, ini: s.inicio - offsetBase, fin: s.fin - offsetBase }))
    .filter((s: any) => s.fin > 0 && s.ini < texto.length)
    .map((s: any) => ({ ...s, ini: Math.max(0, s.ini), fin: Math.min(texto.length, s.fin) }))
    .sort((a: any, b: any) => a.ini - b.ini);

  const segmentos: { texto: string; subrayado?: any }[] = [];
  let pos = 0;
  for (const s of subsLocal) {
    if (s.ini > pos) segmentos.push({ texto: texto.slice(pos, s.ini) });
    segmentos.push({ texto: texto.slice(s.ini, s.fin), subrayado: s });
    pos = s.fin;
  }
  if (pos < texto.length) segmentos.push({ texto: texto.slice(pos) });

  if (!subsLocal.length) {
    // Sin subrayados en este bloque: solo hace falta resolver las referencias.
    return <>{renderReferencias(texto, mapaSiglas, onAbrirArticulo, 'r')}</>;
  }

  return (
    <>
      {segmentos.map((seg, i) => {
        const contenido = renderReferencias(seg.texto, mapaSiglas, onAbrirArticulo, `s${i}`);
        if (!seg.subrayado) return <span key={i}>{contenido}</span>;
        return (
          <mark
            key={i}
            onClick={() => onToggleSubrayado(subrayadoSeleccionado === seg.subrayado.id ? null : seg.subrayado.id)}
            style={{ background: 'var(--hx-fef08a)', cursor: 'pointer', borderRadius: '2px', position: 'relative' }}
          >
            {contenido}
            {subrayadoSeleccionado === seg.subrayado.id && (
              <button
                onClick={(e) => { e.stopPropagation(); onBorrarSubrayado(seg.subrayado.id); }}
                style={{ position: 'absolute', top: '-32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--c-primario)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', zIndex: 20 }}
              >
                <Trash2 size={12} /> Quitar
              </button>
            )}
          </mark>
        );
      })}
    </>
  );
}

const botonLetra: React.CSSProperties = {
  width: 32, height: 32, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--c-texto-2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
};
const chipAudio: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4, padding: '7px 9px', borderRadius: 999, border: 'none',
  background: 'var(--c-superficie-2)', color: 'var(--c-texto-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
};
