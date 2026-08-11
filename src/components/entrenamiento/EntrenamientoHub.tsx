'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Zap, BookOpen, Trophy, RotateCcw, ChevronRight, Target, Settings, Lock, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import WidgetProgresoGlobal from '@/components/widgets/WidgetProgreso';
import ModalHacerTest from './ModalHacerTest';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { AvatarPerfil } from '@/components/AvatarUsuarioPerfil';

const BG_APP = '#EAF0FF'; // azul OPLORA muy suave, pantallas principales
const BG_WIDGET = '#F7F8FA'; // gris claro, todos los widgets
const BG_CARD_INNER = '#FFFFFF';
const BORDER = '#E9EAEC';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

const COLOR_ACTIVIDAD: Record<string, { bg: string; icon: string }> = {
  test:        { bg: '#F3FAE9', icon: '#4D7C0F' },
  primer_reto: { bg: '#EFFADE', icon: '#4D7C0F' },
  flashcards:  { bg: '#FADEF7', icon: '#9333EA' },
  repaso:      { bg: '#FADEF7', icon: '#9333EA' },
  simulacro:   { bg: '#EDE9DD', icon: '#6B5F3E' },
  racha:       { bg: '#FACCC0', icon: '#C2410C' },
};

export default function EntrenamientoHub({
  usuario,
  oposicion,
  progreso,
  convocatoria,
  limites,
}: any) {
  const router = useRouter();

  const estado = usuario.estado;
  const nivel = usuario.nivel;
  const suscripcion = usuario.suscripcion;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: '90px', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <HeroEntrenamiento oposicion={oposicion} usuario={usuario} router={router} />

        <WidgetProgresoGlobal ubicacion="entrenamiento_progreso" oposicionId={oposicion?.id} />

        <WidgetAcciones
          estado={estado}
          nivel={nivel}
          suscripcion={suscripcion}
          oposicion={oposicion}
          router={router}
          limites={limites}
          convocatoria={convocatoria}
        />

        <UpsellPremium suscripcion={suscripcion} router={router} />

      </div>
    </div>
  );
}


function HeroEntrenamiento({ oposicion, usuario, router }: any) {
  return (
    <div style={{ padding: '4px 4px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: '12px', color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
          Practicar
        </div>
        <div style={{ fontSize: '19px', fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>
          {oposicion?.nombre ?? 'Tu oposición'}
        </div>
      </div>
      <button
        onClick={() => router.push('/app/perfil')}
        style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}
      >
        <AvatarPerfil usuario={usuario} size={44} />
      </button>
    </div>
  );
}


function WidgetProgreso({ progreso, limites }: any) {
  const precision = progreso?.promedioAcierto ?? 0;
  const preguntasHoy = limites?.consumo?.preguntasTestHoy ?? 0;
  const limiteDiario = limites?.limites?.preguntasTestDia;
  const sinLimite = limiteDiario === null || limiteDiario === undefined;

  return (
    <div style={{ background: BG_WIDGET, borderRadius: '18px', padding: '14px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingLeft: '2px' }}>
        Mi progreso hoy
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>

        <div style={{ background: BG_CARD_INNER, borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: TEXT_SECONDARY, fontWeight: 500 }}>Preguntas</span>
            <Brain size={13} color={TEXT_MUTED} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1 }}>
            {preguntasHoy}
          </div>
          {sinLimite ? (
            <div style={{ fontSize: '11px', color: TEXT_MUTED }}>Sin límite diario</div>
          ) : (
            <>
              <div style={{ fontSize: '11px', color: TEXT_MUTED }}>de {limiteDiario} hoy</div>
              <div style={{ height: '4px', background: BG_WIDGET, borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min((preguntasHoy / limiteDiario) * 100, 100)}%`,
                  height: '100%',
                  background: preguntasHoy >= limiteDiario ? '#dc2626' : '#111827',
                  borderRadius: '999px',
                }} />
              </div>
            </>
          )}
        </div>

        <div style={{ background: BG_CARD_INNER, borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: TEXT_SECONDARY, fontWeight: 500 }}>Precisión</span>
            <Target size={13} color={TEXT_MUTED} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1 }}>{precision}%</div>
          <div style={{ height: '4px', background: BG_WIDGET, borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${precision}%`, height: '100%', background: '#111827', borderRadius: '999px' }} />
          </div>
        </div>

      </div>
    </div>
  );
}


const ACCIONES_CONFIG: Record<string, { icon: any; descripcion: string; esHeroicon?: boolean }> = {
  primer_reto: { icon: ClipboardDocumentCheckIcon, esHeroicon: true, descripcion: 'Empieza con 5 preguntas básicas' },
  test:        { icon: ClipboardDocumentCheckIcon, esHeroicon: true, descripcion: 'Elige cómo quieres practicar' },
  flashcards:  { icon: RotateCcw,  descripcion: 'Repasa con tarjetas de memoria' },
  repaso:      { icon: Brain,      descripcion: 'Refuerza lo que más falla' },
  simulacro:   { icon: Trophy,     descripcion: 'Examen completo con tiempo real' },
  racha:       { icon: Target,     descripcion: 'Recupera tu racha diaria' },
};


function WidgetAcciones({ estado, nivel, suscripcion, oposicion, router, limites, convocatoria }: any) {
  const maxPorTest = limites?.limites?.preguntasPorTest ?? 5;
  const limiteDiario = limites?.limites?.preguntasTestDia;
  const preguntasHoy = limites?.consumo?.preguntasTestHoy ?? 0;
  const restantesDia = (limiteDiario !== null && limiteDiario !== undefined)
    ? Math.max(0, limiteDiario - preguntasHoy)
    : null;
  const limitadoPorDia = restantesDia !== null && restantesDia === 0;
  const [mostrarExplicaciones, setMostrarExplicaciones] = useState(true);
  const acciones: { title: string; modo: string }[] = [];
  const opcionesNumPreguntas = [5, 10, 20, 50].filter(n => n <= maxPorTest);
  const [modalTest, setModalTest] = useState(false);
  

if (estado === 'nuevo') {
  acciones.push(
    { title: 'Primer reto', modo: 'primer_reto' },
    { title: 'Hacer test', modo: 'test' },
    { title: 'Flashcards básicas', modo: 'flashcards' },
  );
}

if (estado === 'activo') {
  acciones.push(
    { title: 'Hacer test', modo: 'test' },
    { title: 'Flashcards del día', modo: 'flashcards' },
  );
  if (nivel >= 2) acciones.push({ title: 'Repaso inteligente', modo: 'repaso' });
  if (nivel === 3) acciones.push({ title: 'Simulacro real', modo: 'simulacro' });
}

if (estado === 'inactivo') {
  acciones.push(
    { title: 'Hacer test', modo: 'test' },
    { title: 'Flashcards del día', modo: 'flashcards' },
    { title: 'Recuperar racha', modo: 'racha' },
  );
}


const handleClick = (modo: string) => {
  if (!oposicion?.id) return;

  if (modo === 'simulacro' && !limites?.limites?.simulacros) {
    router.push('/app/suscripciones');
    return;
  }

  if (modo === 'primer_reto') {
    router.push(`/app/test/${oposicion.id}?modo=primer_reto&n=5`);
    return;
  }

  if (modo === 'flashcards') {
    router.push(`/app/flashcards`);
    return;
  }
};

  return (
    <>
      <div style={{ background: BG_WIDGET, borderRadius: '18px', padding: '14px' }}>
        <div style={{ marginBottom: '10px', paddingLeft: '2px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Mi entrenamiento
        </span>
      </div>

        <div style={{ borderRadius: '14px', overflow: 'hidden' }}>
        {acciones.map((a, i) => {
            const cfg = ACCIONES_CONFIG[a.modo] ?? ACCIONES_CONFIG.rapido;
            const colorAct = COLOR_ACTIVIDAD[a.modo] ?? COLOR_ACTIVIDAD.rapido;
            const Icono = cfg.icon;
            const bloqueado = (a.modo === 'simulacro' && !limites?.limites?.simulacros) ||
              (limitadoPorDia && a.modo !== 'flashcards' && a.modo !== 'primer_reto');

            return (
              <button
                key={a.modo}
                onClick={() => {
                  if (bloqueado) return;
                  if (a.modo === 'test') {
                    setModalTest(true);
                  } else {
                    handleClick(a.modo);
                  }
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '13px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: i < acciones.length - 1 ? `1px solid ${BORDER}` : 'none',
                  cursor: bloqueado ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  opacity: bloqueado ? 0.45 : 1,
                }}
                onMouseEnter={(e) => { if (!bloqueado) e.currentTarget.style.background = '#fafafa'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: bloqueado ? '#f3f4f6' : colorAct.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {bloqueado ? (
                    <Lock size={20} color="#9ca3af" />
                  ) : cfg.esHeroicon ? (
                    <Icono style={{ width: 26, height: 26, color: colorAct.icon }} />
                  ) : (
                    <Icono size={20} color={colorAct.icon} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.3 }}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: '11px', color: TEXT_MUTED, marginTop: '1px' }}>
                    {bloqueado && a.modo === 'simulacro' ? 'Requiere suscripción' :
                     bloqueado ? 'Límite diario alcanzado' :
                     cfg.descripcion}
                  </div>
                </div>
                {!bloqueado && a.modo === 'rapido' && <Settings size={14} color="#d1d5db" style={{ flexShrink: 0 }} />}
                {!bloqueado && a.modo !== 'rapido' && <ChevronRight size={14} color="#d1d5db" style={{ flexShrink: 0 }} />}
                {bloqueado && a.modo === 'simulacro' && (
                  <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: '#f1f5f9', color: '#475569', fontWeight: 600, flexShrink: 0 }}>
                    Pro
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal configuración */}
    {modalTest && (
      <ModalHacerTest
        oposicion={oposicion}
        convocatoria={convocatoria}
        limites={limites}
        router={router}
        onClose={() => setModalTest(false)}
      />
    )}
    </>
  );
}


function UpsellPremium({ suscripcion, router }: any) {
  if (suscripcion !== 'gratuito') return null;

  return (
    <div style={{ background: BG_WIDGET, borderRadius: '18px', padding: '14px' }}>
      <div style={{ background: BG_CARD_INNER, borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Trophy size={18} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT_PRIMARY, marginBottom: '2px' }}>
            Desbloquea simulacros reales
          </div>
          <div style={{ fontSize: '11px', color: TEXT_MUTED }}>
            Tests ilimitados, simulacros y análisis detallado
          </div>
        </div>
        <button
          onClick={() => router.push('/app/suscripciones')}
          style={{ flexShrink: 0, padding: '8px 14px', borderRadius: '999px', border: 'none', background: '#111827', color: 'white', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
        >
          Ver planes
        </button>
      </div>
    </div>
  );
}