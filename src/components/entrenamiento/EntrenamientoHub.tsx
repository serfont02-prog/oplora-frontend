'use client';

// ⭐ Practicar — mismo sistema que Inicio: sin cajas grises, tarjetas blancas con la sombra común
// directamente sobre el fondo, títulos suaves y una sola familia de iconos (lucide) con el mismo
// icono y color por actividad que en el resto de la app:
//   Test → ClipboardCheck (verde) · Flashcards → Layers (morado) · Psicotécnicos → Brain (índigo)
//   Simulacro → Timer · Repaso → Target · Racha → Flame

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, Layers, Brain, Timer, Target, Flame, Crown, ChevronRight, Lock } from 'lucide-react';
import { api } from '@/lib/api';
import WidgetProgresoGlobal from '@/components/widgets/WidgetProgreso';
import ModalHacerTest from './ModalHacerTest';
import { AvatarPerfil } from '@/components/AvatarUsuarioPerfil';

import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, COLOR_FC, COLOR_FC_BG, COLOR_PSICO, COLOR_PSICO_BG, COLOR_RETOS } from '@/styles/tokens';

const BG_APP = 'var(--c-bg-dashboard)';
const SOMBRA = 'var(--c-sombra)';
const BORDER = 'var(--hx-eef0f3)';

export const COLOR_TEST = 'var(--hx-4d7c0f)';
export const COLOR_TEST_BG = 'var(--hx-f3fae9)';
const COLOR_SIMULACRO = 'var(--hx-6b5f3e)';
const COLOR_SIMULACRO_BG = 'var(--hx-ede9dd)';

export default function EntrenamientoHub({ usuario, oposicion, convocatoria, limites }: any) {
  const router = useRouter();
  const [modalTest, setModalTest] = useState(false);

  // "Hacer otro test" desde el resultado llega con ?abrir=test y abre directamente la elección
  useEffect(() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      if (qs.get('abrir') === 'test') {
        setModalTest(true);
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch { /* sin query */ }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: '90px', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '18px' }}>

        <HeroEntrenamiento oposicion={oposicion} usuario={usuario} router={router} />

        {usuario.estado === 'inactivo' && <AvisoRacha onClick={() => setModalTest(true)} />}

        {oposicion?.id && (
          <WidgetProgresoGlobal ubicacion="entrenamiento_progreso" oposicionId={oposicion.id} convocatoriaId={convocatoria?.id} />
        )}

        <TarjetaTest limites={limites} router={router} onEmpezar={() => setModalTest(true)} />

        <MasFormasDePracticar
          usuario={usuario}
          oposicion={oposicion}
          convocatoria={convocatoria}
          limites={limites}
          router={router}
        />

        <UpsellPremium suscripcion={usuario.suscripcion} router={router} />
      </div>

      {modalTest && (
        <ModalHacerTest
          oposicion={oposicion}
          convocatoria={convocatoria}
          limites={limites}
          router={router}
          onClose={() => setModalTest(false)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TituloSeccion({ children, derecha }: { children: React.ReactNode; derecha?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px', gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY }}>{children}</span>
      {derecha}
    </div>
  );
}

function IconoActividad({ Icon, color, bg, bloqueado = false }: any) {
  return (
    <div style={{ width: 40, height: 40, borderRadius: 12, background: bloqueado ? 'var(--hx-f3f4f6)' : bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {bloqueado ? <Lock size={18} color="var(--hx-9ca3af)" /> : <Icon size={20} color={color} />}
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
        aria-label="Mi perfil"
        style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', overflow: 'visible', flexShrink: 0 }}
      >
        <AvatarPerfil usuario={usuario} size={44} />
      </button>
    </div>
  );
}

/** Usuarios inactivos: aviso arriba para retomar la racha con un test. */
function AvisoRacha({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', background: 'var(--c-superficie)', border: 'none', borderRadius: 18, padding: 14, boxShadow: SOMBRA, cursor: 'pointer' }}
    >
      <IconoActividad Icon={Flame} color={COLOR_RETOS} bg="var(--hx-fff1e8)" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Recupera tu racha</div>
        <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>Haz un test hoy y vuelve a sumar días seguidos</div>
      </div>
      <ChevronRight size={16} color="var(--hx-c4c9d2)" />
    </button>
  );
}

/** Acción principal de la pantalla: hacer un test. Muestra el límite diario si el plan lo tiene. */
function TarjetaTest({ limites, router, onEmpezar }: any) {
  const limiteDiario = limites?.limites?.preguntasTestDia;
  const preguntasHoy = limites?.consumo?.preguntasTestHoy ?? 0;
  const conLimite = limiteDiario !== null && limiteDiario !== undefined;
  const agotado = conLimite && preguntasHoy >= limiteDiario;
  const pct = conLimite && limiteDiario > 0 ? Math.min(100, Math.round((preguntasHoy / limiteDiario) * 100)) : 0;

  return (
    <section>
      <TituloSeccion>Tu entrenamiento</TituloSeccion>
      <div style={{ background: 'var(--c-superficie)', borderRadius: 18, padding: 16, boxShadow: SOMBRA, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <IconoActividad Icon={ClipboardCheck} color={COLOR_TEST} bg={COLOR_TEST_BG} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Hacer test</div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>Elige temas, número de preguntas y modo</div>
          </div>
        </div>

        {conLimite && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: TEXT_MUTED }}>Preguntas de hoy</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: agotado ? 'var(--hx-dc2626)' : TEXT_PRIMARY }}>
                {preguntasHoy} de {limiteDiario}
              </span>
            </div>
            <div style={{ height: 6, background: 'var(--hx-eef0f3)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: agotado ? '#DC2626' : COLOR_TEST, borderRadius: 999, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}

        <button
          onClick={() => (agotado ? router.push('/app/suscripciones') : onEmpezar())}
          style={{ width: '100%', padding: 12, borderRadius: 12, border: 'none', background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          {agotado ? 'Límite de hoy alcanzado · Ver planes' : 'Empezar test'}
        </button>
      </div>
    </section>
  );
}

function MasFormasDePracticar({ usuario, oposicion, convocatoria, limites, router }: any) {
  const nivel = usuario.oposicionActiva?.nivel ?? 1;
  const limiteDiario = limites?.limites?.preguntasTestDia;
  const preguntasHoy = limites?.consumo?.preguntasTestHoy ?? 0;
  const limiteAgotado = limiteDiario !== null && limiteDiario !== undefined && preguntasHoy >= limiteDiario;
  const conSimulacros = !!limites?.limites?.simulacros;

  const { data: configPsicotecnicos = [] } = useQuery({
    queryKey: ['psicotecnicos-config', oposicion?.id, convocatoria?.id],
    queryFn: async () => (await api.get(`/psicotecnicos/config/${oposicion.id}`, {
      params: convocatoria?.id ? { convocatoriaId: convocatoria.id } : {},
    })).data,
    enabled: !!oposicion?.id,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Misma consulta que el atajo de Flashcards de Inicio (comparte caché).
  const { data: pendientesFC = [] } = useQuery({
    queryKey: ['fc-pendientes-widget', oposicion?.id],
    queryFn: async () => (await api.get(`/flashcards/pendientes/${oposicion.id}`)).data,
    enabled: !!oposicion?.id,
  });
  const nFC = Array.isArray(pendientesFC) ? pendientesFC.length : 0;

  if (!oposicion?.id) return null;

  type Fila = {
    clave: string; titulo: string; descripcion: string; Icon: any; color: string; bg: string;
    bloqueado?: boolean; etiqueta?: string; badge?: number; onClick: () => void;
  };

  const filas: Fila[] = [
    {
      clave: 'flashcards', titulo: 'Flashcards', Icon: Layers, color: COLOR_FC, bg: COLOR_FC_BG,
      descripcion: nFC > 0 ? `${nFC} ${nFC === 1 ? 'tarjeta pendiente' : 'tarjetas pendientes'} de repaso` : 'Repasa con tarjetas de memoria',
      badge: nFC,
      onClick: () => router.push(nFC > 0 ? `/app/flashcards/repasar?oposicionId=${oposicion.id}` : '/app/flashcards'),
    },
    (() => {
      const porNivel = nivel < 2;
      const bloqueado = porNivel || limiteAgotado;
      return {
        clave: 'repaso', titulo: 'Repaso inteligente', Icon: Target, color: COLOR_TEST, bg: COLOR_TEST_BG,
        descripcion: porNivel ? 'Se desbloquea al llegar al nivel 2' : limiteAgotado ? 'Límite de preguntas de hoy alcanzado' : 'Refuerza las preguntas que más fallas',
        bloqueado,
        onClick: () => {
          if (porNivel) return;
          if (limiteAgotado) { router.push('/app/suscripciones'); return; }
          router.push(`/app/test/${oposicion.id}?modo=repaso&n=10`);
        },
      };
    })(),
    {
      clave: 'simulacro', titulo: 'Simulacro de examen', Icon: Timer, color: COLOR_SIMULACRO, bg: COLOR_SIMULACRO_BG,
      descripcion: conSimulacros ? 'Examen completo con el tiempo real' : 'Disponible desde el plan Esencial',
      bloqueado: !conSimulacros,
      etiqueta: conSimulacros ? undefined : 'Esencial',
      onClick: () => router.push(conSimulacros ? '/app/entrenamiento/simulacro' : '/app/suscripciones'),
    },
    ...(configPsicotecnicos.length > 0 ? [{
      // Los psicotécnicos no consumen el límite diario de preguntas de test.
      clave: 'psicotecnicos', titulo: 'Psicotécnicos', Icon: Brain, color: COLOR_PSICO, bg: COLOR_PSICO_BG,
      descripcion: 'Numérico, verbal, lógico y más',
      onClick: () => router.push('/app/entrenamiento/psicotecnicos'),
    }] : []),
  ];

  return (
    <section>
      <TituloSeccion>Más formas de practicar</TituloSeccion>
      <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
        {filas.map((f, i) => (
          <button
            key={f.clave}
            onClick={f.onClick}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
              background: 'none', border: 'none', borderBottom: i < filas.length - 1 ? `1px solid ${BORDER}` : 'none',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <IconoActividad Icon={f.Icon} color={f.color} bg={f.bg} bloqueado={f.bloqueado} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: f.bloqueado ? TEXT_MUTED : TEXT_PRIMARY, lineHeight: 1.3 }}>{f.titulo}</div>
              <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>{f.descripcion}</div>
            </div>
            {f.etiqueta && (
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'var(--hx-f1f5f9)', color: 'var(--hx-475569)', fontWeight: 700, flexShrink: 0 }}>
                {f.etiqueta}
              </span>
            )}
            {!!f.badge && f.badge > 0 && (
              <span style={{ minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999, background: '#DC2626', color: 'white', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', flexShrink: 0 }}>
                {f.badge > 9 ? '9+' : f.badge}
              </span>
            )}
            <ChevronRight size={16} color="var(--hx-c4c9d2)" style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </section>
  );
}

function UpsellPremium({ suscripcion, router }: any) {
  if (suscripcion !== 'gratuito') return null;

  return (
    <div style={{ background: 'var(--c-superficie)', borderRadius: 18, padding: 16, boxShadow: SOMBRA, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--hxbg-0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Crown size={19} color="var(--c-primario-texto)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 2 }}>Practica sin límites</div>
        <div style={{ fontSize: 12, color: TEXT_MUTED }}>Más preguntas al día, simulacros y análisis detallado</div>
      </div>
      <button
        onClick={() => router.push('/app/suscripciones')}
        style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 999, border: 'none', background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
      >
        Ver planes
      </button>
    </div>
  );
}
