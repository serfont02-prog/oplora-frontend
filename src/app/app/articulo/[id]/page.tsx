'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { FooterNavegacion } from '@/app/app/dashboard/page';

const BG_APP = '#F4F5F7';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

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

  const { data: articulo, isLoading } = useQuery({
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

  const articuloRef = useRef<any>(null);
  useEffect(() => {
    articuloRef.current = articulo;
  }, [articulo]);

  useEffect(() => {
    const handleMouseUp = () => {
      requestAnimationFrame(() => {
        const seleccion = window.getSelection();
        const texto = seleccion?.toString().trim() ?? '';
        if (!texto || texto.length < 3) {
          setMenuSubrayado(null);
          return;
        }
        const contenido = articuloRef.current?.contenido ?? '';
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
            inicio, fin, texto,
          });
        } catch {}
      });
    };
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
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

  const getVoz = (genero: 'mujer' | 'hombre') => {
    if (voces.length === 0) return null;
    const keysMujer = ['female', 'mujer', 'monica', 'paulina', 'lucia', 'woman', 'laura', 'maria', 'helena'];
    const keysHombre = ['male', 'hombre', 'jorge', 'pablo', 'diego', 'carlos', 'juan'];
    if (genero === 'mujer') {
      return voces.find((v) => keysMujer.some((k) => v.name.toLowerCase().includes(k))) ?? voces[0];
    }
    return voces.find((v) => keysHombre.some((k) => v.name.toLowerCase().includes(k))) ?? voces[voces.length > 1 ? 1 : 0];
  };

  const iniciarAudio = (continuo = false) => {
    if (!articulo?.contenido) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`Artículo ${articulo.numero}. ${articulo.contenido}`);
    u.lang = 'es-ES';
    u.rate = velocidad;
    const voz = getVoz(vozGenero);
    if (voz) u.voice = voz;
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
        const u = new SpeechSynthesisUtterance(`Artículo ${articulo.numero}. ${articulo.contenido}`);
        u.lang = 'es-ES';
        u.rate = velocidad;
        const voz = getVoz(nuevo);
        if (voz) u.voice = voz;
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
    router.push(`/app/articulo/${navArticulos.anterior.id}?leyId=${leyId ?? ''}&oposicionId=${oposicionId ?? ''}`);
  };

  const irSiguiente = () => {
    if (!navArticulos?.siguiente) return;
    pararAudio();
    router.push(`/app/articulo/${navArticulos.siguiente.id}?leyId=${leyId ?? ''}&oposicionId=${oposicionId ?? ''}`);
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

  if (cargando || isLoading) return null;
  if (!articulo) return null;

  const leyNombre = articulo.capitulo?.tituloRef?.versionLey?.ley?.nombre
    ?? articulo.tituloRef?.versionLey?.ley?.nombre
    ?? articulo.seccion?.capitulo?.tituloRef?.versionLey?.ley?.nombre
    ?? 'Normativa';

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: '90px' }}>

      {/* Header — volver + ley */}
      <div style={{ background: 'white', borderBottom: '1px solid #F1F5F9', padding: '0 1.25rem', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <button
          onClick={() => { pararAudio(); leyId ? router.push(`/app/ley/${leyId}?oposicionId=${oposicionId ?? ''}`) : router.back(); }}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: TEXT_SECONDARY, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          Volver
        </button>
        <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {leyNombre}
        </span>
        <span style={{ width: '60px' }} />
      </div>

      {/* Navegación anterior / siguiente */}
      <div style={{ background: 'white', borderBottom: '1px solid #F1F5F9', padding: '0 1rem', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: '48px', zIndex: 9 }}>
        <button
          onClick={irAnterior}
          disabled={!navArticulos?.anterior}
          style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: navArticulos?.anterior ? TEXT_SECONDARY : '#d1d5db', background: 'none', border: 'none', cursor: navArticulos?.anterior ? 'pointer' : 'not-allowed', minWidth: '70px' }}
        >
          <ChevronLeft size={14} />
          {navArticulos?.anterior ? `Art. ${navArticulos.anterior.numero}` : '—'}
        </button>

        <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT_PRIMARY }}>
          Artículo {articulo.numero}
        </div>

        <button
          onClick={irSiguiente}
          disabled={!navArticulos?.siguiente}
          style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: navArticulos?.siguiente ? TEXT_SECONDARY : '#d1d5db', background: 'none', border: 'none', cursor: navArticulos?.siguiente ? 'pointer' : 'not-allowed', minWidth: '70px', justifyContent: 'flex-end' }}
        >
          {navArticulos?.siguiente ? `Art. ${navArticulos.siguiente.numero}` : '—'}
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Contenido — con soporte de swipe */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ maxWidth: '560px', margin: '0 auto', padding: '1.25rem', position: 'relative' }}
      >
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: '16px', padding: '1.25rem', marginBottom: '12px' }}>

          {/* Texto con subrayados */}
          <div
            data-articulo-contenido
            style={{ fontSize: '14px', color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: '1rem', userSelect: 'text', position: 'relative' }}
          >
            {renderTextoConSubrayados(articulo.contenido ?? '')}
          </div>

          {/* Barra de audio */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => { if (reproduciendo && !modoContinuo) pararAudio(); else { setModoContinuo(false); iniciarAudio(false); } }}
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: reproduciendo && !modoContinuo ? '#111827' : '#F4F5F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                {reproduciendo && !modoContinuo ? <Pause size={14} color="white" /> : <Play size={14} color="#374151" />}
              </button>
              <button
                onClick={() => { if (reproduciendo && modoContinuo) pararAudio(); else { setModoContinuo(true); iniciarAudio(true); } }}
                style={{ padding: '6px 10px', borderRadius: '8px', background: reproduciendo && modoContinuo ? '#111827' : '#F4F5F7', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: reproduciendo && modoContinuo ? 'white' : '#374151', flexShrink: 0 }}
              >
                ⏩ Desde aquí
              </button>
              <div style={{ flex: 1 }} />
              <button onClick={cambiarVoz} style={{ fontSize: '11px', padding: '5px 8px', borderRadius: '7px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: TEXT_SECONDARY }}>
                {vozGenero === 'mujer' ? '👩' : '👨'}
              </button>
              <button onClick={cambiarVelocidad} style={{ fontSize: '11px', padding: '5px 8px', borderRadius: '7px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: TEXT_SECONDARY }}>
                {velocidad}x
              </button>
            </div>
          </div>

          {/* Notas personales */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Mis notas
              </div>
              <div style={{ fontSize: '10px', color: notaGuardada ? '#15803d' : TEXT_MUTED }}>
                {notaGuardando ? 'Guardando...' : notaGuardada ? '✓ Guardado' : ''}
              </div>
            </div>
            <textarea
              value={notaTexto}
              onChange={(e) => handleNotaChange(e.target.value)}
              placeholder="Escribe aquí tus notas personales sobre este artículo..."
              style={{ width: '100%', minHeight: '80px', padding: '10px', fontSize: '12px', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '10px', outline: 'none', resize: 'vertical', lineHeight: 1.6, background: '#FFFBEB', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>

          {/* Test y Flashcard */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              onClick={() => router.push('/app/entrenamiento')}
              style={{ flex: 1, padding: '11px', background: '#F4F5F7', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
            >
              🎯 Test
            </button>
            <button
              onClick={() => router.push('/app/flashcards')}
              style={{ flex: 1, padding: '11px', background: '#F4F5F7', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
            >
              🃏 Flashcard
            </button>
          </div>

          {menuSubrayado && (
            <div style={{ position: 'fixed', left: menuSubrayado.x, top: menuSubrayado.y, transform: 'translateX(-50%)', zIndex: 50 }}>
              <button
                onClick={crearSubrayado}
                style={{ background: '#fef08a', border: '1px solid #eab308', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}
              >
                ✏️ Subrayar
              </button>
            </div>
          )}
        </div>
      </div>

      <FooterNavegacion usuario={usuario} oposicionId={oposicionId ?? undefined} activo="estudiar" />
    </div>
  );
}