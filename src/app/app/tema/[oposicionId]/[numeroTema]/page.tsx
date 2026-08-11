'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Upload, CheckCircle2 } from 'lucide-react'; // añadir junto a los demás iconos lucide
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import ModalHacerTest from '@/components/entrenamiento/ModalHacerTest';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  Lock,
  CalendarDays,
  NotebookPen,
  BarChart2,
} from 'lucide-react';
import { FooterNavegacion } from '@/app/app/dashboard/page';

type TabTema = 'material' | 'mi-estudio' | 'progreso';

const BG_APP = '#F5F1EB';
const BG_WIDGET = '#EFE9E0';

export default function TemaPage() {
  const router = useRouter();
  const params = useParams();
  const oposicionId = params.oposicionId as string;
  const numeroTema = params.numeroTema as string;
  const { usuario, cargando } = useAuth();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<TabTema>('material');
  const [notaTexto, setNotaTexto] = useState('');
  const [notaGuardando, setNotaGuardando] = useState(false);
  const [notaGuardada, setNotaGuardada] = useState(false);
  const notaTimeoutRef = useRef<any>(null);
  const [fechaRepaso, setFechaRepaso] = useState('');
  const [repasoProgramado, setRepasoProgramado] = useState<string | null>(null);
  const [programando, setProgramando] = useState(false);
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [subiendoApunte, setSubiendoApunte] = useState(false);
  const [modalTest, setModalTest] = useState(false);

  

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias-tema', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${oposicionId}`);
      return res.data;
    },
    enabled: !!usuario,
  });

  const convocatoria = convocatorias.find((c: any) => c.estado === 'activa') ?? convocatorias[0];

  const { data: temas = [] } = useQuery({
    queryKey: ['temas-tema', convocatoria?.id],
    queryFn: async () => {
      const res = await api.get(`/temas/convocatoria/${convocatoria.id}`);
      return res.data;
    },
    enabled: !!convocatoria?.id,
  });

  const tema = temas.find((t: any) => t.numero === parseInt(numeroTema));
  const temaAnterior = temas.find((t: any) => t.numero === parseInt(numeroTema) - 1);
  const temaSiguiente = temas.find((t: any) => t.numero === parseInt(numeroTema) + 1);

  const { data: progresoCompleto } = useQuery({
    queryKey: ['progreso-completo-tema', tema?.id, oposicionId],
    queryFn: async () => {
      const res = await api.get(`/temas/${tema.id}/progreso-completo?oposicionId=${oposicionId}`);
      return res.data;
    },
    enabled: !!tema?.id && !!oposicionId,
  });


  const { data: normativa = [] } = useQuery({
    queryKey: ['normativa-tema', tema?.id],
    queryFn: async () => {
      const res = await api.get(`/temas/${tema.id}/normativa`);
      return res.data;
    },
    enabled: !!tema?.id,
  });

  // ⭐ Agrupa la normativa por ley para mostrarla concentrada
const normativaPorLey = useMemo(() => {
  if (!normativa?.length) return {};
  return normativa.reduce((acc: any, item: any) => {
    const ley = item.articulo?.capitulo?.tituloRef?.versionLey?.ley
      ?? item.articulo?.tituloRef?.versionLey?.ley;
    const leyNombre = ley?.nombre ?? 'Normativa';
    const leyId = ley?.id;

    if (!acc[leyNombre]) acc[leyNombre] = { leyId, articulos: [] };
    if (item.articulo) {
      acc[leyNombre].articulos.push({
        id: item.articulo.id,
        numero: item.articulo.numero,
      });
    }
    return acc;
  }, {});
}, [normativa]);

  const { data: progresoTest } = useQuery({
    queryKey: ['progreso-test-tema', tema?.id, oposicionId],
    queryFn: async () => {
      const res = await api.get(`/test/progreso/${oposicionId}/${tema.id}`);
      return res.data;
    },
    enabled: !!tema?.id,
  });

  const { data: statsFC } = useQuery({
    queryKey: ['stats-fc-tema', tema?.id, oposicionId],
    queryFn: async () => {
      const res = await api.get(`/flashcards/stats/${oposicionId}/${tema.id}`);
      return res.data;
    },
    enabled: !!tema?.id,
  });

  const { data: limites } = useQuery({
  queryKey: ['limites', usuario?.id],
  queryFn: async () => {
    const res = await api.get('/usuarios/limites');
    return res.data;
  },
  enabled: !!usuario,
  });

  const { data: progresoSesiones } = useQuery({
  queryKey: ['progreso-sesiones', tema?.id],
  queryFn: async () => {
    const res = await api.get(`/sesiones-tema/${tema.id}/progreso`);
    return res.data;
  },
  enabled: !!tema?.id,
  });

  const { data: apuntes = [] } = useQuery({
    queryKey: ['apuntes-tema', tema?.id],
    queryFn: async () => {
      const res = await api.get(`/apuntes-usuario/tema/${tema.id}`);
      return res.data;
    },
    enabled: !!tema?.id,
  });

  const { data: apuntesOplora = [] } = useQuery({
    queryKey: ['apuntes-oplora-tema', tema?.id],
    queryFn: async () => {
      const res = await api.get(`/apuntes-oplora/tema/${tema.id}`);
      return res.data;
    },
    enabled: !!tema?.id,
  });

  const { data: nota } = useQuery({
    queryKey: ['nota-tema', tema?.id],
    queryFn: async () => {
      const res = await api.get(`/normativa/nota-tema/${tema.id}`);
      return res.data;
    },
    enabled: !!tema?.id,
  });

  useEffect(() => {
    if (nota?.contenido) setNotaTexto(nota.contenido);
    if (nota?.fechaRepaso) setRepasoProgramado(new Date(nota.fechaRepaso).toLocaleDateString('es-ES'));
  }, [nota]);

  const programarRepaso = async (fecha: string) => {
    setProgramando(true);
    try {
      await api.post(`/normativa/nota-tema/${tema.id}/programar`, { fecha });
      setRepasoProgramado(new Date(fecha).toLocaleDateString('es-ES'));
      setFechaRepaso('');
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setProgramando(false);
    }
  };

  const handleNotaChange = (texto: string) => {
    setNotaTexto(texto);
    setNotaGuardada(false);
    clearTimeout(notaTimeoutRef.current);
    notaTimeoutRef.current = setTimeout(async () => {
      setNotaGuardando(true);
      try {
        await api.post(`/normativa/nota-tema/${tema.id}`, { contenido: texto });
        setNotaGuardada(true);
        setTimeout(() => setNotaGuardada(false), 2000);
      } finally {
        setNotaGuardando(false);
      }
    }, 1500);
  };

  const porcentajeProgreso = progresoCompleto?.porcentajeTotal ?? 0;
  const repasoDesbloqueado = porcentajeProgreso >= 80;

  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta < -60 && temaSiguiente) {
      router.push(`/app/tema/${oposicionId}/${temaSiguiente.numero}`);
    } else if (delta > 60 && temaAnterior) {
      router.push(`/app/tema/${oposicionId}/${temaAnterior.numero}`);
    }
  };

  const queryCliente = useQueryClient(); // asegúrate de tenerlo importado y declarado en el componente

useEffect(() => {
  if (tema?.id) {
    console.log('Registrando sesión para tema:', tema.id); // ⭐
    api.post(`/sesiones-tema/${tema.id}`)
      .then(() => {
        console.log('Sesión registrada, invalidando query'); // ⭐
        queryCliente.invalidateQueries({ queryKey: ['ultimo-tema-estudiado'] });
      })
      .catch((err) => {
        console.error('Error registrando sesión:', err);
      });
  }
}, [tema?.id]);

  if (cargando) return null;

  const TABS: { key: TabTema; label: string; icon: typeof BookOpen }[] = [
    { key: 'material', label: 'Material', icon: BookOpen },
    { key: 'mi-estudio', label: 'Mi estudio', icon: NotebookPen },
    { key: 'progreso', label: 'Progreso', icon: BarChart2 },
  ];

  const [mostrarCalendario, setMostrarCalendario] = useState(false);

// Fecha mínima seleccionable = hoy
const hoy = new Date().toISOString().split('T')[0];

  
  return (

    <div
      style={{ minHeight: '100vh', background: BG_APP, paddingBottom: '80px' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        .flip-inner { transition: transform 0.45s ease; transform-style: preserve-3d; position: relative; }
        .flip-inner.flipped { transform: rotateY(180deg); }
        .flip-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; position: absolute; inset: 0; }
        .flip-face-back { transform: rotateY(180deg); }
      `}</style>

      {/* ── HEADER STICKY ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'white', borderBottom: '1px solid #f3f4f6',
      }}>
        <div style={{
          padding: '0 1rem', height: '48px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button
            onClick={() => router.push(`/app/tema/${oposicionId}?modo=estudiar`)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={14} />
            Temario
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => temaAnterior && router.push(`/app/tema/${oposicionId}/${temaAnterior.numero}`)}
              disabled={!temaAnterior}
              style={{ width: 30, height: 30, borderRadius: '8px', border: '1px solid #e5e7eb', background: temaAnterior ? 'white' : '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: temaAnterior ? 'pointer' : 'not-allowed' }}
            >
              <ChevronLeft size={14} color={temaAnterior ? '#374151' : '#d1d5db'} />
            </button>

            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827', padding: '0 8px' }}>
              Tema {numeroTema}
            </span>

            <button
              onClick={() => temaSiguiente && router.push(`/app/tema/${oposicionId}/${temaSiguiente.numero}`)}
              disabled={!temaSiguiente}
              style={{ width: 30, height: 30, borderRadius: '8px', border: '1px solid #e5e7eb', background: temaSiguiente ? 'white' : '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: temaSiguiente ? 'pointer' : 'not-allowed' }}
            >
              <ChevronRight size={14} color={temaSiguiente ? '#374151' : '#d1d5db'} />
            </button>
          </div>

          <span style={{ width: '64px', flexShrink: 0 }} />
        </div>
      </div>

      {/* ── HERO DEL TEMA ── */}
{/* ── HERO DEL TEMA — unificado con el estilo de "Programa" ── */}
<div style={{ background: BG_APP, padding: '16px 1.25rem 0' }}>
  <div style={{ maxWidth: '560px', margin: '0 auto' }}>

    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
      {/* Círculo con anillo de progreso — igual que en Programa */}
      {(() => {
        const radio = 26;
        const circunferencia = 2 * Math.PI * radio;
        const offset = circunferencia - (Math.min(porcentajeProgreso, 100) / 100) * circunferencia;
        const completado = porcentajeProgreso >= 80;
        const colorAnillo = completado ? '#16A34A' : porcentajeProgreso > 0 ? '#1F7CFF' : '#D1D5DB';
        const grosorAnillo = porcentajeProgreso > 0 || completado ? '4' : '2.5';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '62px' }}>
            <div style={{ position: 'relative', width: '62px', height: '62px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="62" height="62" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                <circle cx="31" cy="31" r={radio} fill="none" stroke="#E9E2D6" strokeWidth={grosorAnillo} />
                <circle
                  cx="31" cy="31" r={radio} fill="none"
                  stroke={colorAnillo} strokeWidth={grosorAnillo} strokeLinecap="round"
                  strokeDasharray={circunferencia} strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              {completado ? (
                <CheckCircle2 size={24} color="#16A34A" />
              ) : (
                <span style={{ fontSize: '18px', fontWeight: 800, color: porcentajeProgreso > 0 ? '#111827' : '#9ca3af' }}>
                  {numeroTema}
                </span>
              )}
            </div>
            {porcentajeProgreso > 0 && porcentajeProgreso < 100 && (
              <span style={{ fontSize: '11px', fontWeight: 700, color: colorAnillo, marginTop: '2px' }}>
                {porcentajeProgreso}%
              </span>
            )}
          </div>
        );
      })()}

      {/* Título del tema */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', lineHeight: 1.35 }}>
          {tema?.titulo ?? 'Cargando...'}
        </div>
      </div>
    </div>

    {/* Practicar — siempre visible, fuera de las tabs */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '4px' }}>
      <button
        onClick={() => setModalTest(true)}
        style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: '14px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
      >
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#EFFADE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ClipboardDocumentCheckIcon style={{ width: 16, height: 16, color: '#4D7C0F' }} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#111827' }}>Hacer test</span>
      </button>

      <button
        onClick={() => router.push(`/app/flashcards/repasar?temaId=${tema?.id}&oposicionId=${oposicionId}&numeroTema=${numeroTema}`)}
        style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: '14px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
      >
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#FADEF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '15px' }}>🃏</span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#111827' }}>Flashcards</span>
      </button>
    </div>

  </div>
</div>

      {/* ── TABS TIPO iOS/REVOLUT ── */}
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '12px 1.25rem 0' }}>
        <div style={{ display: 'flex', background: '#E5DED2', borderRadius: '12px', padding: '3px', gap: '3px' }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '9px 4px', border: 'none', borderRadius: '9px',
                background: tab === key ? 'white' : 'none',
                boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer', fontSize: '12px',
                fontWeight: tab === key ? 700 : 500,
                color: tab === key ? '#111827' : '#6b7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENIDO TABS ── */}
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>

{tab === 'material' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

    {/* Apuntes OPLORA */}
    {apuntesOplora.length > 0 && (
      <div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
          Apuntes OPLORA ({apuntesOplora.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {apuntesOplora.map((ap: any) => (
            <button
              key={ap.id}
              onClick={() => router.push(`/app/apuntes/${ap.id}`)}
              style={{
                background: 'white', border: '1px solid #F1F5F9', borderRadius: '14px',
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                minHeight: '68px', boxSizing: 'border-box',
                transition: 'background 0.18s ease, transform 0.18s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.transform = 'scale(1.01)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF9E7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={16} color="#C79A1E" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ap.titulo}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', display: 'flex', gap: '6px' }}>
                  {ap.tipo && <span>{ap.tipo.toUpperCase()}</span>}
                  {ap.paginas && <span>· {ap.paginas} págs</span>}
                </div>
              </div>
              <ChevronRight size={16} color="#D1D5DB" style={{ flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Normativa vinculada */}
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
        Normativa vinculada
      </div>
      {Object.keys(normativaPorLey).length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(normativaPorLey).map(([leyNombre, data]: [string, any]) => (
            <div key={leyNombre} style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: '14px', padding: '14px 16px' }}>
              <button
                onClick={() => data.leyId && router.push(`/app/ley/${data.leyId}?oposicionId=${oposicionId}`)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: 0 }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#F3F0FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BookOpen size={15} color="#8B5CF6" />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', flex: 1 }}>{leyNombre}</div>
                <ChevronRight size={14} color="#D1D5DB" />
              </button>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingLeft: '42px' }}>
                {data.articulos.map((art: any) => (
                  <button
                    key={art.id}
                    onClick={() => router.push(`/app/articulo/${art.id}?oposicionId=${oposicionId}`)}
                    style={{ padding: '3px 10px', borderRadius: '999px', border: '1px solid #E5E7EB', background: '#FAFAFA', fontSize: '11px', color: '#374151', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Art. {art.numero}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: '13px', color: '#9ca3af', padding: '4px 2px' }}>
          {tema?.contexto ?? 'El equipo está preparando la normativa de este tema'}
        </div>
      )}
    </div>

    {/* Mis apuntes */}
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
        Mis apuntes ({apuntes.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {apuntes.map((ap: any) => (
          <a
            key={ap.id}
            href={ap.urlArchivo}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'white', border: '1px solid #F1F5F9', borderRadius: '14px',
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
              textDecoration: 'none', minHeight: '68px', boxSizing: 'border-box',
              transition: 'background 0.18s ease, transform 0.18s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.transform = 'scale(1.01)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EAF2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={16} color="#2563EB" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ap.nombre}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{new Date(ap.creadoEn).toLocaleDateString('es-ES')}</div>
            </div>
            <ChevronRight size={16} color="#D1D5DB" style={{ flexShrink: 0 }} />
          </a>
        ))}

        <input
          id="apunte-input"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || !tema?.id) return;
            setSubiendoApunte(true);
            try {
              const formData = new FormData();
              formData.append('archivo', file);
              formData.append('oposicionId', oposicionId);
              await api.post(`/apuntes-usuario/tema/${tema.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });
              queryClient.invalidateQueries({ queryKey: ['apuntes-tema', tema.id] });
            } catch (err) {
              console.error('Error subiendo apunte:', err);
            } finally {
              setSubiendoApunte(false);
              e.target.value = '';
            }
          }}
        />
        <button
          onClick={() => document.getElementById('apunte-input')?.click()}
          disabled={subiendoApunte}
          style={{
            background: 'white', border: '1.5px dashed #D1D5DB', borderRadius: '14px',
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
            cursor: 'pointer', width: '100%', minHeight: '68px', boxSizing: 'border-box',
            transition: 'background 0.18s ease, transform 0.18s ease',
          }}
          onMouseEnter={(e) => { if (!subiendoApunte) { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.transform = 'scale(1.01)'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Upload size={16} color="#6b7280" />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
            {subiendoApunte ? 'Subiendo...' : 'Subir mis apuntes'}
          </div>
        </button>
      </div>
    </div>
  </div>
)}

        {/* TAB: MI ESTUDIO */}
        {tab === 'mi-estudio' && (
          <>
            {/* Programar repaso */}
            <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <CalendarDays size={15} color="#1F7CFF" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Programar repaso</span>
                </div>
                {repasoProgramado && (
                  <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '999px', background: '#EFF6FF', color: '#185FA5', fontWeight: 600 }}>
                    📅 {repasoProgramado}
                  </span>
                )}
              </div>





<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
  {[
    { label: 'Mañana', dias: 1 },
    { label: '3 días', dias: 3 },
    { label: '1 semana', dias: 7 },
    { label: '2 semanas', dias: 14 },
    { label: '1 mes', dias: 30 },
  ].map(({ label, dias }) => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dias);
    const fechaStr = fecha.toISOString().split('T')[0];
    const activo = fechaRepaso === fechaStr && !mostrarCalendario;
    return (
      <button
        key={dias}
        onClick={() => { setFechaRepaso(fechaStr); setMostrarCalendario(false); }}
        style={{
          padding: '10px 6px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer',
          border: activo ? 'none' : '1px solid #e5e7eb',
          background: activo ? '#1F7CFF' : 'white',
          color: activo ? 'white' : '#374151',
          fontWeight: activo ? 600 : 400,
        }}
      >
        {label}
      </button>
    );
  })}

  {/* ⭐ Ocupa el hueco simétrico */}
  <button
    onClick={() => { setMostrarCalendario(true); setFechaRepaso(''); }}
    style={{
      padding: '10px 6px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer',
      border: mostrarCalendario ? 'none' : '1px solid #e5e7eb',
      background: mostrarCalendario ? '#1F7CFF' : 'white',
      color: mostrarCalendario ? 'white' : '#374151',
      fontWeight: mostrarCalendario ? 600 : 400,
    }}
  >
    📅 Otra fecha
  </button>
</div>

{/* ⭐ Calendario solo visible al elegir "Otra fecha" */}
{mostrarCalendario && (
  <input
    type="date"
    value={fechaRepaso}
    min={hoy} // ⭐ bloquea fechas anteriores a hoy
    onChange={(e) => setFechaRepaso(e.target.value)}
    style={{
      width: '100%', padding: '16px 14px', fontSize: '15px',
      border: '1px solid #e5e7eb', borderRadius: '12px', outline: 'none', color: '#374151',
      boxSizing: 'border-box', marginBottom: '10px',
    }}
  />
)}

<button
  onClick={() => fechaRepaso && programarRepaso(fechaRepaso)}
  disabled={!fechaRepaso || programando}
  style={{ width: '100%', padding: '13px', background: '#1F7CFF', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: !fechaRepaso ? 'not-allowed' : 'pointer', opacity: !fechaRepaso ? 0.4 : 1 }}
>
  {programando ? 'Programando...' : 'Programar repaso'}
</button>
              {repasoProgramado && (
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#EFF6FF', border: '1px solid #bfdbfe', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>📅</span>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>Repaso programado</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#185FA5' }}>{repasoProgramado}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setRepasoProgramado(null); setFechaRepaso(''); }}
                    style={{ fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                  >
                    ✕ Eliminar
                  </button>
                </div>
              )}
            </div>

            {/* Notas */}
            <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <NotebookPen size={15} color="#3C3489" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Mis notas</span>
                </div>
                <div style={{ fontSize: '11px', color: notaGuardada ? '#16A34A' : '#9ca3af', fontWeight: notaGuardada ? 600 : 400 }}>
                  {notaGuardando ? 'Guardando...' : notaGuardada ? '✓ Guardado' : 'Se guarda solo'}
                </div>
              </div>
              <textarea
                value={notaTexto}
                onChange={(e) => handleNotaChange(e.target.value)}
                placeholder="Escribe aquí tus notas sobre este tema..."
                style={{
                  width: '100%', minHeight: '200px', padding: '12px',
                  fontSize: '13px', color: '#374151', lineHeight: 1.7,
                  border: '1px solid #e5e7eb', borderRadius: '10px',
                  outline: 'none', resize: 'vertical',
                  background: '#fffbeb', boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </>
        )}

        {/* TAB: PROGRESO */}
{tab === 'progreso' && (
  <>
    {/* Widget: Desglose del progreso */}
    {progresoCompleto?.desglose && (
      <div style={{ background: BG_WIDGET, borderRadius: '18px', padding: '14px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingLeft: '2px' }}>
          Desglose del progreso
        </div>
        <div style={{ background: 'white', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Lectura', pct: progresoCompleto.desglose.lectura.porcentaje, puntos: progresoCompleto.desglose.lectura.puntos, max: 50, color: '#1F7CFF' },
            { label: 'Test', pct: progresoCompleto.desglose.test.pctAcierto, puntos: progresoCompleto.desglose.test.puntos, max: 25, color: '#16A34A' },
            { label: 'Flashcards', pct: progresoCompleto.desglose.flashcards.pctDominadas, puntos: progresoCompleto.desglose.flashcards.puntos, max: 25, color: '#3C3489' },
          ].map(({ label, puntos, max, color }) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{label}</span>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>{puntos}/{max} pts</span>
              </div>
              <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${(puntos / max) * 100}%`, height: '100%', background: color, borderRadius: '999px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Widget: Mi actividad */}
    <div style={{ background: BG_WIDGET, borderRadius: '18px', padding: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingLeft: '2px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Mi actividad
        </span>
        <span style={{ fontSize: '10px', color: '#9ca3af' }}>Toca para detalles</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>

        {/* Card Preguntas */}
        <div style={{ perspective: '600px', cursor: 'pointer', height: '88px' }} onClick={() => setFlippedCard(flippedCard === 'preguntas' ? null : 'preguntas')}>
          <div className={`flip-inner${flippedCard === 'preguntas' ? ' flipped' : ''}`} style={{ height: '88px' }}>
            <div className="flip-face" style={{ background: 'white', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
              <span style={{ fontSize: '16px' }}>🎯</span>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#1F7CFF' }}>{progresoTest?.total ?? 0}</span>
              <span style={{ fontSize: '10px', color: '#6b7280' }}>Preguntas</span>
            </div>
            <div className="flip-face flip-face-back" style={{ background: 'white', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', padding: '6px' }}>
              <div style={{ display: 'flex', gap: '6px', width: '100%', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#16A34A' }}>{progresoTest?.correctas ?? 0}</div>
                  <div style={{ fontSize: '9px', color: '#6b7280' }}>Correctas</div>
                </div>
                <div style={{ width: '1px', background: '#e5e7eb', alignSelf: 'stretch' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>{progresoTest?.falladas ?? 0}</div>
                  <div style={{ fontSize: '9px', color: '#6b7280' }}>Falladas</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Flashcards */}
        <div style={{ perspective: '600px', cursor: 'pointer', height: '88px' }} onClick={() => setFlippedCard(flippedCard === 'flashcards' ? null : 'flashcards')}>
          <div className={`flip-inner${flippedCard === 'flashcards' ? ' flipped' : ''}`} style={{ height: '88px' }}>
            <div className="flip-face" style={{ background: 'white', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
              <span style={{ fontSize: '16px' }}>🃏</span>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#3C3489' }}>{statsFC?.total ?? 0}</span>
              <span style={{ fontSize: '10px', color: '#6b7280' }}>Flashcards</span>
            </div>
            <div className="flip-face flip-face-back" style={{ background: 'white', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', padding: '6px' }}>
              <div style={{ display: 'flex', gap: '6px', width: '100%', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#3C3489' }}>{statsFC?.dominadas ?? 0}</div>
                  <div style={{ fontSize: '9px', color: '#6b7280' }}>Dominadas</div>
                </div>
                <div style={{ width: '1px', background: '#e5e7eb', alignSelf: 'stretch' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#9ca3af' }}>{statsFC?.sinVer ?? 0}</div>
                  <div style={{ fontSize: '9px', color: '#6b7280' }}>Pendientes</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Repasos */}
        <div style={{ perspective: '600px', cursor: 'pointer', height: '88px' }} onClick={() => setFlippedCard(flippedCard === 'repasos' ? null : 'repasos')}>
          <div className={`flip-inner${flippedCard === 'repasos' ? ' flipped' : ''}`} style={{ height: '88px' }}>
            <div className="flip-face" style={{ background: 'white', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px', padding: '8px 6px' }}>
              <span style={{ fontSize: '15px' }}>🔁</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#16A34A', lineHeight: 1.1 }}>{progresoSesiones?.diasEstudiados ?? 0}</span>
              <span style={{ fontSize: '9px', color: '#6b7280', textAlign: 'center', lineHeight: 1.3, whiteSpace: 'pre-line' }}>{'días\nestudiando'}</span>
            </div>
            <div className="flip-face flip-face-back" style={{ background: 'white', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '8px 6px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: '#9ca3af', lineHeight: 1.3, whiteSpace: 'pre-line' }}>{'Última\nsesión'}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginTop: '1px' }}>
                  {progresoSesiones?.ultimaSesion ? new Date(progresoSesiones.ultimaSesion).toLocaleDateString('es-ES') : '—'}
                </div>
              </div>
              <div style={{ width: '80%', height: '1px', background: '#e5e7eb' }} />
              {repasoProgramado ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#9ca3af', lineHeight: 1.3, whiteSpace: 'pre-line' }}>{'Próximo\nrepaso'}</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#15803d', marginTop: '1px' }}>{repasoProgramado}</div>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setFlippedCard(null); setTab('mi-estudio'); }}
                  style={{ fontSize: '9px', color: '#1F7CFF', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, textAlign: 'center', lineHeight: 1.4, whiteSpace: 'pre-line' }}
                >
                  {'Programar\nrepaso'}
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>

    {/* Widget: Repaso completo */}
    <div style={{ background: BG_WIDGET, borderRadius: '18px', padding: '14px' }}>
      <div style={{
        background: repasoDesbloqueado ? '#F0FDF4' : 'white',
        border: repasoDesbloqueado ? '1px solid #86efac' : 'none',
        borderRadius: '14px', padding: '20px', textAlign: 'center',
      }}>
        {repasoDesbloqueado ? (
          <>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🏆</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#15803d', marginBottom: '4px' }}>¡Listo para repasar!</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>Has estudiado suficiente material de este tema</div>
            <button
              onClick={() => router.push(`/app/test/${oposicionId}?temaId=${tema?.id}&num=20`)}
              style={{ width: '100%', padding: '13px', background: '#16A34A', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              🎯 Empezar repaso completo
            </button>
          </>
        ) : (
          <>
            <Lock size={24} color="#d1d5db" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Repaso bloqueado</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>
              Estudia el material del tema para desbloquear el repaso completo
            </div>
            <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden', marginBottom: '6px' }}>
              <div style={{ width: `${porcentajeProgreso}%`, height: '100%', background: '#d97706', borderRadius: '999px' }} />
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{porcentajeProgreso}% / 80% para desbloquear</div>
          </>
        )}
      </div>
    </div>
  </>
)}
      </div>
      {modalTest && tema && (
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