'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useMemo, useState } from 'react';
// ⭐ Una sola familia de iconos (lucide). Se importan con los nombres que tenían los de
// heroicons para no tocar cada uso.
import {
  Newspaper, FileText, Scale, Sparkles, X, Flame, CalendarCheck, ChevronRight, ChevronDown,
  Settings as Cog6ToothIcon, Archive as ArchiveBoxIcon, ClipboardList as ClipboardDocumentListIcon,
  Bell as BellIcon, Landmark as BuildingLibraryIcon, Building2 as BuildingOffice2Icon, Briefcase as BriefcaseIcon,
  Home as HomeIcon, BookOpen as BookOpenIcon, Swords as FireIcon, Layers as ArrowPathIcon,
  ClipboardCheck as ClipboardDocumentCheckIcon,
} from 'lucide-react';
import ModalHacerTest from '@/components/entrenamiento/ModalHacerTest';
import { AvatarPerfil } from '@/components/AvatarUsuarioPerfil';
import TarjetaLiga from '@/components/liga/TarjetaLiga';
import LogoOplora from '@/components/marca/LogoOplora';
import { getOploUrl } from '@/lib/oplo';


/* -------------------------------------------------------
   TOKENS DE DISEÑO (compartidos con Entrenamiento)
------------------------------------------------------- */
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, COLOR_RETOS } from '@/styles/tokens';

const BG_APP = '#EAF0FF';
const BG_WIDGET = '#FFFFFF';
// ⭐ Una sola sombra para todo lo que "flota" (círculos, accesos y tarjetas)
const SOMBRA = '0 6px 18px rgba(15, 23, 42, 0.08)';

// Colores de actividad (los mismos que en Entrenamiento)
const COLOR_ESTUDIAR = '#1F7CFF';
const COLOR_PRACTICAR = '#4D7C0F';

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

const getIconoAdministracion = (tipo: string) => {
  switch (tipo) {
    case 'estado': return BuildingLibraryIcon;
    case 'ccaa': return BuildingOffice2Icon;
    case 'empresa_publica': return BriefcaseIcon;
    default: return BuildingLibraryIcon;
  }
};

const getSuscripcionLabel = (suscripcion: string) => {
  switch (suscripcion) {
    case 'gratuito': return 'Gratuito';
    case 'esencial': return 'Esencial';
    case 'profesional': return 'Profesional';
    default: return 'Suscripción';
  }
};

/* -------------------------------------------------------
   COMPONENTE PRINCIPAL
------------------------------------------------------- */

export default function DashboardPage() {
  const router = useRouter();
  const { usuario, cargando } = useAuth();

  const tipo = usuario?.estado ?? 'nuevo';
  const oposicionId = usuario?.oposicionActiva?.id;

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias-historial', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId,
  });

  
const ultimaConvocatoria = useMemo(() => {
  if (!convocatorias.length) return null;

  const convocatoriaActivaId = usuario?.oposicionActiva?.convocatoriaActiva?.id;

  const convocatoriaUsuario = convocatoriaActivaId
    ? convocatorias.find((c: any) => c.id === convocatoriaActivaId)
    : null;

  return convocatoriaUsuario ?? [...convocatorias].sort((a, b) => b.anyo - a.anyo)[0];
}, [convocatorias, usuario]);


  if (cargando) return null;
  if (!usuario) return null;

  return (
    <div style={{ background: BG_APP, minHeight: '100vh', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>

      <HeaderDashboard
        usuario={usuario}
        ultimaConvocatoria={ultimaConvocatoria}
        router={router}
      />

      <main
        style={{
          maxWidth: '560px',
          margin: '0 auto',
          padding: '1.25rem',
          paddingBottom: 90,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {tipo === 'nuevo' && <DashboardNuevo usuario={usuario} oposicionId={oposicionId} />}
        {tipo === 'activo' && <DashboardActivo usuario={usuario} oposicionId={oposicionId} />}
        {tipo === 'inactivo' && <DashboardInactivo usuario={usuario} oposicionId={oposicionId} />}
      </main>

      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} />

    </div>
  );
}

/* -------------------------------------------------------
   HEADER (simplificado)
------------------------------------------------------- */

function HeaderDashboard({ usuario, ultimaConvocatoria, router }: any) {
  const oposicionId = usuario?.oposicionActiva?.id;
  const oposicion = usuario?.oposicionActiva;

  const accesos = [
  { label: 'Ajustes', icon: Cog6ToothIcon, size: 23, onClick: () => router.push(`/app/oposicion/${oposicionId}/ajustes`) },
  { label: 'Noticias', icon: Newspaper, size: 19, onClick: () => router.push(`/app/oposicion/${oposicionId}/noticias`), badge: true },
  { label: 'Convocatoria', icon: ClipboardDocumentListIcon, size: 19, onClick: () => router.push(`/app/oposicion/${oposicionId}/convocatoria`) }, // ⭐ renombrado
  { label: 'Histórico', icon: ArchiveBoxIcon, size: 19, onClick: () => router.push(`/app/oposicion/${oposicionId}/historial`) }, // ⭐ renombrado (misma ruta)
];

const { data: countData } = useQuery({
  queryKey: ['notificaciones-count'],
  queryFn: async () => {
    const res = await api.get('/notificaciones/count');
    return res.data;
  },
  enabled: !!usuario,
  staleTime: 0,
  refetchOnMount: true,
  refetchOnWindowFocus: true,
});

const countNoLeidas = countData?.count ?? 0;
  const { data: novedades } = useNovedades(oposicionId, usuario?.oposicionActiva?.convocatoriaActiva?.id);
  return (
    <header
      style={{
        background: 'transparent',
        padding: '1.25rem 1.25rem 0',
        maxWidth: '560px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Fila superior simple */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <LogoOplora alto={20} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY }}>
            Hola, {usuario.nombre?.split(' ')[0] || 'Opositor'}
          </span>

          {(usuario.rachaActual ?? 0) > 0 && (
            <span
              title="Días seguidos estudiando"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'white', color: '#C2410C', fontSize: 12, fontWeight: 700, boxShadow: SOMBRA }}
            >
              <Flame size={13} /> {usuario.rachaActual} {usuario.rachaActual === 1 ? 'día' : 'días'}
            </span>
          )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => router.push('/app/alertas')}
            style={{
              position: 'relative', width: 38, height: 38, borderRadius: '50%', border: 'none',
              background: 'white', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <BellIcon style={{ width: 19, height: 19, color: COLOR_ALERTAS_AMARILLO }} />
            {countNoLeidas > 0 && (
              <span style={{
                position: 'absolute', top: '2px', right: '2px',
                width: '9px', height: '9px', borderRadius: '50%',
                background: '#DC2626', border: '2px solid white',
              }} />
            )}
          </button>

          <button
            onClick={() => router.push('/app/perfil')}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              border: 'none', background: 'transparent',
              padding: 0, cursor: 'pointer', overflow: 'visible', flexShrink: 0,
            }}
          >
            <AvatarPerfil usuario={usuario} size={44} />
          </button>
        </div>
      </div>

     
      {/* Hero oscuro de la oposición */}
      {oposicion && (
        <div style={{ position: 'relative', marginBottom: '30px' }}>
          <div style={{
            background: '#0f172a', borderRadius: '16px', padding: '18px 16px 40px', // ⭐ padding inferior aumentado de 18px a 34px
            color: 'white', display: 'flex', flexDirection: 'column', gap: '10px',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Mi oposición
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.3 }}>
                {oposicion.nombre}
              </div>
            </div>

      {ultimaConvocatoria && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Convocatoria {ultimaConvocatoria.anyo}</span>
          <span style={{ fontSize: '12px', color: '#475569' }}>·</span>
          <span style={{
            fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
            background: ultimaConvocatoria.estado === 'activa' ? 'rgba(22,163,74,0.2)' : 'rgba(255,255,255,0.1)',
            color: ultimaConvocatoria.estado === 'activa' ? '#4ade80' : '#cbd5e1',
          }}>
            {ultimaConvocatoria.estado === 'activa' ? 'Activa' : 'Cerrada'}
          </span>
        </div>
      )}
      
    </div>
        
        {/* Iconos flotantes, sobresaliendo del hero */}
        <div style={{
            position: 'absolute', bottom: '-38px', left: '12px', right: '12px',
            display: 'flex', justifyContent: 'space-between',
          }}>
            {accesos.map(({ label, icon: Icon, size, onClick, badge }: any) => (
              <AccesoCirculo key={label} label={label} Icon={Icon} size={size} onClick={onClick} badge={badge ? novedades?.noLeidas ?? 0 : 0} />
            ))}
        </div>
        </div>
      )}
    </header>
  );
}

/* -------------------------------------------------------
   FOOTER (neutro, color solo en activo)
------------------------------------------------------- */
const COLOR_ESTUDIO_MARRON = '#8B7355';
const COLOR_RETOS_FOOTER = '#C2410C';
const COLOR_ALERTAS_AMARILLO = '#D4A017'; // ⭐ confírmame el tono

export function FooterNavegacion({ usuario, oposicionId, activo = 'inicio' }: any) {
  const router = useRouter();

  const { data: countData } = useQuery({
    queryKey: ['notificaciones-count'],
    queryFn: async () => {
      const res = await api.get('/notificaciones/count');
      return res.data;
    },
    enabled: !!usuario,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const countNoLeidas = countData?.count ?? 0;

  const irAPracticar = () => {
    if (!oposicionId) { router.push('/app/onboarding/oposicion'); return; }
    router.push('/app/entrenamiento');
  };

  const items = [
    { key: 'inicio', label: 'Inicio', icon: HomeIcon, onClick: () => router.push('/app/dashboard'), color: '#1F7CFF' },
    { key: 'estudiar', label: 'Estudiar', icon: BookOpenIcon, onClick: () => oposicionId ? router.push(`/app/tema/${oposicionId}?modo=estudiar`) : router.push('/app/onboarding/oposicion'), color: COLOR_ESTUDIO_MARRON },
    { key: 'retos', label: 'Retos', icon: FireIcon, onClick: () => router.push('/app/retos'), color: COLOR_RETOS_FOOTER },
    { key: 'practicar', label: 'Practicar', icon: ClipboardDocumentCheckIcon, onClick: irAPracticar, color: '#1F7CFF' },
    { key: 'alertas', label: 'Alertas', icon: BellIcon, onClick: () => router.push('/app/alertas'), color: COLOR_ALERTAS_AMARILLO },
  ];

  return (
    <footer
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 64,
        background: 'white', borderTop: '1px solid #EEF0F2',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 50,
      }}
    >
      {items.map(({ key, label, icon: Icon, onClick, color }) => {
        const esActivo = activo === key;
        return (
          <button
            key={key}
            onClick={onClick}
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', paddingTop: 6 }}
          >
            {esActivo && (
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 20, height: 3, borderRadius: '0 0 3px 3px', background: color }} />
            )}
            <div style={{ position: 'relative' }}>
              <Icon style={{ width: 23, height: 23, color: esActivo ? color : '#D1D5DB' }} />
              {key === 'alertas' && countNoLeidas > 0 && ( // ⭐ nuevo: indicador
                <span style={{
                  position: 'absolute', top: '-2px', right: '-2px',
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#DC2626', border: '1.5px solid white',
                }} />
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: esActivo ? color : '#D1D5DB' }}>{label}</span>
          </button>
        );
      })}
    </footer>
  );
}

/* -------------------------------------------------------
   WIDGET WRAPPER genérico
------------------------------------------------------- */

function Widget({ titulo, accion, children, sinCaja = false }: { titulo?: string; accion?: { label: string; onClick: () => void }; children: React.ReactNode; sinCaja?: boolean }) {
  // ⭐ Antes: fondo azul + caja gris + tarjeta blanca + título en mayúsculas. Ahora la tarjeta
  // blanca va directamente sobre el fondo, con la sombra común, y el título es una línea suave.
  return (
    <section>
      {(titulo || accion) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
          {titulo && <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY }}>{titulo}</span>}
          {accion && (
            <button onClick={accion.onClick} style={{ fontSize: 12, color: '#1F7CFF', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
              {accion.label}
            </button>
          )}
        </div>
      )}
      {sinCaja ? children : (
        <div style={{ background: BG_WIDGET, borderRadius: 18, padding: 14, boxShadow: SOMBRA }}>{children}</div>
      )}
    </section>
  );
}

/* -------------------------------------------------------
   DASHBOARD: NUEVO
------------------------------------------------------- */

function DashboardNuevo({ usuario, oposicionId }: any) {
  const router = useRouter();

  const irAPrimerEntrenamiento = () => {
    if (!oposicionId) { router.push('/app/onboarding/oposicion'); return; }
    router.push('/app/entrenamiento');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

    <WidgetRepasosHoy oposicionId={oposicionId} router={router} />
      <WidgetNoticias oposicionId={oposicionId} convocatoriaId={usuario?.oposicionActiva?.convocatoriaActiva?.id} router={router} />

      {/* Hero — CTA principal */}
      <div style={{ background: '#0f172a', borderRadius: 18, padding: '20px 18px', color: 'white', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 17, fontWeight: 700 }}>Vamos a empezar</span>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>Hoy comienza tu camino al éxito</span>
        <button
          onClick={irAPrimerEntrenamiento}
          style={{
            marginTop: 8, width: '100%', borderRadius: 999, border: 'none',
            padding: '13px 16px', background: 'white', color: '#0f172a',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, background: '#f1f5f9', padding: '2px 7px', borderRadius: 999, letterSpacing: '0.05em' }}>
            PASO 1
          </span>
          Tu primer entrenamiento →
        </button>
      </div>

      {/* Widget: Empezar a explorar */}
      <Widget titulo="Empezar a explorar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => oposicionId ? router.push(`/app/tema/${oposicionId}`) : router.push('/app/onboarding/oposicion')}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 14, border: 'none', background: '#F8F9FA', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 11, background: '#EAF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpenIcon style={{ width: 18, height: 18, color: COLOR_ESTUDIAR }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>Mi temario</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED }}>Consulta todos los temas de tu oposición</div>
            </div>
          </button>

          <button
            onClick={() => router.push(`/app/oposicion/${oposicionId}/historial`)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 14, border: 'none', background: '#F8F9FA', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 11, background: '#F3FAE9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={17} color="#3B6D11" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>Convocatorias y exámenes</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED }}>Consulta convocatorias anteriores</div>
            </div>
          </button>
        </div>
      </Widget>

      {/* Widget: Primeros pasos */}
      <Widget titulo="Primeros pasos">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['Empieza un reto', 'Explora el temario', 'Practica con exámenes'].map((paso, i) => (
            <div key={paso} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#F4F5F7', color: TEXT_MUTED, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>{paso}</span>
            </div>
          ))}
        </div>
      </Widget>

      <SeccionOplo usuario={usuario} />
    </div>
  );
}

/* -------------------------------------------------------
   DASHBOARD: ACTIVO
------------------------------------------------------- */

export function DashboardActivo({ usuario, oposicionId }: { usuario: any; oposicionId?: string }) {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <WidgetRepasosHoy oposicionId={oposicionId} router={router} />
      <WidgetNoticias oposicionId={oposicionId} convocatoriaId={usuario?.oposicionActiva?.convocatoriaActiva?.id} router={router} />
      <WidgetSeguirEstudiando oposicionId={oposicionId} router={router} />
      <WidgetAccionesRapidas usuario={usuario} oposicionId={oposicionId} router={router} />
      <TarjetaLiga soloSiRelevante />
      <SeccionOplo usuario={usuario} />
    </div>
  );
}

/* -------------------------------------------------------
   DASHBOARD: INACTIVO
------------------------------------------------------- */

export function DashboardInactivo({ usuario, oposicionId }: { usuario: any; oposicionId?: string }) {
  const router = useRouter();

  // ⭐ El aviso de racha perdida va primero (antes quedaba al final). Se quita el bloque
  // "Mi progreso general", que mostraba un 32 % inventado.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#0f172a', borderRadius: 18, padding: '18px 16px', color: 'white', display: 'flex', flexDirection: 'column', gap: 6, boxShadow: SOMBRA }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 16, fontWeight: 700 }}><Flame size={17} color="#FB923C" /> Has perdido tu racha</span>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>No pasa nada: hoy es un buen día para volver.</span>
        <button
          onClick={() => router.push('/app/entrenamiento')}
          style={{ marginTop: 8, width: '100%', borderRadius: 12, border: 'none', padding: '12px 16px', background: 'white', color: '#0f172a', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          Empezar un test rápido
        </button>
      </div>

      <WidgetRepasosHoy oposicionId={oposicionId} router={router} />
      <WidgetNoticias oposicionId={oposicionId} convocatoriaId={usuario?.oposicionActiva?.convocatoriaActiva?.id} router={router} />
      <WidgetSeguirEstudiando oposicionId={oposicionId} router={router} />
      <WidgetAccionesRapidas usuario={usuario} oposicionId={oposicionId} router={router} />
      <TarjetaLiga soloSiRelevante />
      <SeccionOplo usuario={usuario} />
    </div>
  );
}

/* -------------------------------------------------------
   WIDGET ULTIMAS NOTICIAS
------------------------------------------------------- */
const tipoIconoBg: Record<string, string> = {
  resolucion_convocatoria: '#FAEEDA',
  lista_admitidos_provisional: '#EAF3DE',
  lista_admitidos_definitiva: '#EAF3DE',
  lista_excluidos_provisional: '#FCEBEB',
  lista_excluidos_definitiva: '#FCEBEB',
  cronograma: '#E6F1FB',
  nota_informativa: '#F1EFE8',
  normas_especificas: '#FAEEDA',
  guia_inscripcion: '#F1EFE8',
  otro: '#F1EFE8',
  // Tipos de Noticia (feed unificado): oficial / legislativa / oplora
  oficial: '#E6F1FB',
  legislativa: '#EEEDFE',
  oplora: '#FDF1DC',
};

const tipoIconoColor: Record<string, string> = {
  resolucion_convocatoria: '#854F0B',
  lista_admitidos_provisional: '#3B6D11',
  lista_admitidos_definitiva: '#3B6D11',
  lista_excluidos_provisional: '#A32D2D',
  lista_excluidos_definitiva: '#A32D2D',
  cronograma: '#185FA5',
  nota_informativa: '#5F5E5A',
  normas_especificas: '#854F0B',
  guia_inscripcion: '#5F5E5A',
  otro: '#5F5E5A',
  // Tipos de Noticia (feed unificado): oficial / legislativa / oplora
  oficial: '#185FA5',
  legislativa: '#3C3489',
  oplora: '#B45309',
};

interface Noticia {
  id: string;
  tipo: 'oficial' | 'legislativa' | 'oplora';
  titulo: string;
  resumen?: string | null;
  urlOrigen?: string | null;
  destacada: boolean;
  fechaPublicacion?: string | null;
  creadoEn: string;
}

const ICONO_TIPO_NOTICIA: Record<Noticia['tipo'], any> = {
  oficial: Newspaper,
  legislativa: Scale,
  oplora: Sparkles,
};

function formatearFecha(fecha: string | Date): string {
  // "17 oct" (con año solo si no es el actual), igual que en la pantalla de Noticias
  const d = new Date(fecha);
  const mismoAnyo = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', ...(mismoAnyo ? {} : { year: 'numeric' }) });
}

/** Novedades del usuario: nº de noticias sin ver y la última (si tiene menos de 2 días). */
function useNovedades(oposicionId?: string, convocatoriaId?: string) {
  return useQuery<{ noLeidas: number; ultima: Noticia | null }>({
    queryKey: ['noticias-novedades', oposicionId, convocatoriaId],
    queryFn: async () => (await api.get('/noticias/novedades', { params: { oposicionId, convocatoriaId } })).data,
    enabled: !!oposicionId,
    staleTime: 60_000,
  });
}

// ⭐ La última noticia solo se destaca mientras es nueva para el usuario: desaparece al
// abrirla, al descartarla con la X o a los 2 días, y vuelve cuando haya otra. El resto
// queda a mano en el círculo "Noticias", que muestra cuántas hay sin ver.
function WidgetNoticias({ oposicionId, convocatoriaId, router }: any) {
  const queryClient = useQueryClient();
  const { data } = useNovedades(oposicionId, convocatoriaId);
  const n = data?.ultima;
  if (!oposicionId || !n) return null;

  const marcarVista = async () => {
    try { await api.post('/noticias/marcar-vistas'); } catch { /* no es crítico */ }
    queryClient.invalidateQueries({ queryKey: ['noticias-novedades'] });
  };
  const abrir = () => {
    marcarVista();
    if (n.urlOrigen) window.open(n.urlOrigen, '_blank');
    else router.push(`/app/oposicion/${oposicionId}/noticias`);
  };
  const Icono = ICONO_TIPO_NOTICIA[n.tipo] ?? FileText;
  const otras = Math.max(0, (data?.noLeidas ?? 1) - 1);

  return (
    <div style={{ background: BG_WIDGET, borderRadius: 18, padding: '12px 12px 12px 14px', boxShadow: SOMBRA, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: tipoIconoBg[n.tipo] ?? '#F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icono size={16} color={tipoIconoColor[n.tipo] ?? TEXT_MUTED} />
      </div>
      <div onClick={abrir} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: tipoIconoColor[n.tipo] ?? TEXT_SECONDARY }}>
          Nueva · {formatearFecha(n.fechaPublicacion ?? n.creadoEn)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.35, marginTop: 2 }}>{n.titulo}</div>
        {n.resumen && (
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 3, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {n.resumen}
          </div>
        )}
        {otras > 0 && (
          <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginTop: 6 }}>
            y {otras} {otras === 1 ? 'noticia más' : 'noticias más'} sin leer
          </div>
        )}
      </div>
      <button onClick={marcarVista} aria-label="Descartar noticia" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: TEXT_MUTED, flexShrink: 0 }}>
        <X size={16} />
      </button>
    </div>
  );
}

// ⭐ Repasos de temas programados para hoy (o atrasados, hasta 7 días). No caduca como las
// noticias: se queda hasta que el tema se marca como repasado (botón "Hecho" en el tema).
// Con varios repasos se muestra UNA tarjeta con los 2 primeros y "ver todos" para desplegar,
// así no se llena Inicio de avisos.
function WidgetRepasosHoy({ oposicionId, router }: any) {
  const [abierto, setAbierto] = useState(false);
  const { data: repasos = [] } = useQuery({
    queryKey: ['repasos-pendientes', oposicionId],
    queryFn: async () => (await api.get('/normativa/repasos-pendientes', { params: { oposicionId } })).data,
    enabled: !!oposicionId,
    staleTime: 60_000,
  });
  if (!oposicionId || repasos.length === 0) return null;

  const ir = (r: any) => router.push(`/app/tema/${r.oposicionId ?? oposicionId}/${r.numero}`);
  const uno = repasos.length === 1;
  const visibles = abierto ? repasos : repasos.slice(0, 2);
  const atrasados = repasos.filter((r: any) => r.atrasado).length;

  return (
    // ⭐ Tarea del día: tarjeta blanca como las demás; la distinguen el icono azul sólido y el
    // botón "Repasar" (con fondo y borde azules sobre el fondo azul de Inicio había demasiado azul).
    <div style={{ background: BG_WIDGET, borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
      <div
        onClick={uno ? () => ir(repasos[0]) : undefined}
        style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', cursor: uno ? 'pointer' : 'default' }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: '#1F7CFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CalendarCheck size={20} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1F7CFF' }}>
            {uno ? (repasos[0].atrasado ? 'Repaso pendiente' : 'Repaso de hoy') : `${repasos.length} repasos para hoy`}
            {!uno && atrasados > 0 && <span style={{ color: TEXT_MUTED, fontWeight: 600 }}> · {atrasados} {atrasados === 1 ? 'atrasado' : 'atrasados'}</span>}
          </div>
          {uno ? (
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.35, marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              Tema {repasos[0].numero}: {repasos[0].titulo}
            </div>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginTop: 2 }}>Tienes temas programados para repasar</div>
          )}
        </div>
        {uno && (
          <span style={{ flexShrink: 0, background: '#1F7CFF', color: 'white', fontSize: 12, fontWeight: 700, borderRadius: 999, padding: '7px 12px' }}>
            Repasar
          </span>
        )}
      </div>

      {!uno && (
        <>
          {visibles.map((r: any) => (
            <button
              key={r.temaId}
              onClick={() => ir(r)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', borderTop: '1px solid #EEF0F3', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ width: 34, textAlign: 'center', fontSize: 12, fontWeight: 800, color: TEXT_SECONDARY, flexShrink: 0 }}>T{r.numero}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titulo}</span>
              {r.atrasado && <span style={{ fontSize: 10, color: '#B45309', fontWeight: 700, flexShrink: 0 }}>Atrasado</span>}
              <ChevronRight size={15} color="#C4C9D2" style={{ flexShrink: 0 }} />
            </button>
          ))}
          {repasos.length > 2 && (
            <button
              onClick={() => setAbierto((v) => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '9px', background: 'none', border: 'none', borderTop: '1px solid #EEF0F3', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#1F7CFF' }}
            >
              {abierto ? 'Ver menos' : `Ver los ${repasos.length}`}
              <ChevronDown size={14} style={{ transform: abierto ? 'rotate(180deg)' : 'none' }} />
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   WIDGET SEGUIR ESTUDIANDO
------------------------------------------------------- */
function WidgetSeguirEstudiando({ oposicionId, router }: any) {
    const { data: ultimoTema, isLoading } = useQuery({
    queryKey: ['ultimo-tema-estudiado', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/sesiones-tema/ultimo/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: progresoTema } = useQuery({
    queryKey: ['progreso-completo-tema', ultimoTema?.temaId, oposicionId],
    queryFn: async () => {
      const res = await api.get(`/temas/${ultimoTema.temaId}/progreso-completo?oposicionId=${oposicionId}`);
      return res.data;
    },
    enabled: !!ultimoTema?.temaId,
  });

  if (isLoading || !ultimoTema) return null;

  const porcentaje = progresoTema?.porcentajeTotal ?? 0;

  return (
    <Widget titulo="Continúa donde lo dejaste">
      <div
        onClick={() => router.push(`/app/tema/${oposicionId}/${ultimoTema.numeroTema}`)}
        style={{
          borderRadius: 14, padding: '4px',
          cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11, background: '#EAF0FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 800, color: COLOR_ESTUDIAR, flexShrink: 0,
          }}>
            {ultimoTema.numeroTema}
          </div>
          <div style={{
            fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {ultimoTema.tituloTema}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: TEXT_MUTED }}>Progreso del tema</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: porcentaje > 0 ? COLOR_ESTUDIAR : TEXT_MUTED }}>
              {porcentaje}%
            </span>
          </div>
          <div style={{ height: 7, background: '#E9EAEC', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              width: `${porcentaje}%`, height: '100%',
              background: porcentaje > 0 ? `linear-gradient(90deg, ${COLOR_ESTUDIAR}, #60a5fa)` : 'transparent',
              borderRadius: 999, transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        <button
          style={{
            width: '100%', padding: '12px', borderRadius: 12, border: 'none',
            background: '#0f172a', color: 'white', fontSize: 13, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Continuar estudiando →
        </button>
      </div>
    </Widget>
  );
}

/* -------------------------------------------------------
   WIDGET ACCIONES RAPIDAS
------------------------------------------------------- */


function WidgetAccionesRapidas({ usuario, oposicionId, router }: any) {
  const [modalTest, setModalTest] = useState(false);

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias-acciones-rapidas', oposicionId],
    queryFn: async () => (await api.get(`/convocatorias/oposicion/${oposicionId}`)).data,
    enabled: !!oposicionId,
  });
  const convocatoria = convocatorias.find((c: any) => c.estado === 'activa') ?? convocatorias[0];

  const { data: limites } = useQuery({
    queryKey: ['limites', usuario?.id],
    queryFn: async () => (await api.get('/usuarios/limites')).data,
    enabled: !!usuario,
  });

  const { data: pendientesFC = [] } = useQuery({
    queryKey: ['fc-pendientes-widget', oposicionId],
    queryFn: async () => (await api.get(`/flashcards/pendientes/${oposicionId}`)).data,
    enabled: !!oposicionId,
  });

  // ⭐ Retos por jugar (test, flashcards y psicotécnicos)
  const { data: retosPend } = useQuery({
    queryKey: ['retos-pendientes', usuario?.id],
    queryFn: async () => (await api.get('/retos/pendientes')).data,
    enabled: !!usuario,
    staleTime: 30_000,
  });

  if (!oposicionId) return null;

  const nFC = pendientesFC.length;
  const nRetos = retosPend?.total ?? 0;

  // ⭐ Atajos directos: el test abre la elección sin pasar por Practicar; las flashcards van al
  // repaso si hay pendientes; los retos, a la lista de los que tienes por jugar.
  const acciones = [
    { label: 'Test', sub: 'Empezar ya', Icon: ClipboardDocumentCheckIcon, color: COLOR_PRACTICAR, badge: 0, onClick: () => setModalTest(true) },
    {
      label: 'Flashcards', sub: nFC > 0 ? `${nFC} pendientes` : 'Al día', Icon: ArrowPathIcon, color: '#9333EA', badge: nFC,
      onClick: () => router.push(nFC > 0 ? `/app/flashcards/repasar?oposicionId=${oposicionId}` : '/app/flashcards'),
    },
    {
      label: 'Retos', sub: nRetos > 0 ? `${nRetos} por jugar` : 'Lanza uno', Icon: FireIcon, color: COLOR_RETOS, badge: nRetos,
      onClick: () => router.push(nRetos > 0 ? '/app/retos?vista=pendientes' : '/app/retos'),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '4px 8px' }}>
        {acciones.map(({ label, sub, Icon, color, badge, onClick }) => (
          <AccesoCirculo key={label} label={label} sub={sub} Icon={Icon} size={22} color={color} badge={badge} onClick={onClick} />
        ))}
      </div>

      {modalTest && (
        <ModalHacerTest
          oposicion={usuario.oposicionActiva}
          convocatoria={convocatoria}
          limites={limites}
          router={router}
          onClose={() => setModalTest(false)}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------
   SECCIÓN OPLO (mismo gris de widget)
------------------------------------------------------- */
function SeccionOplo({ usuario }: { usuario: any }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const router = useRouter();

  const nivel = usuario?.oposicionActiva?.nivel ?? 1;
  const puntos = usuario?.oposicionActiva?.puntos ?? 0;
  const racha = usuario?.rachaActual ?? 0;

  const niveles = [
    { nivel: 1, nombre: 'Opositor', puntosMin: 0, puntosMax: 100 },
    { nivel: 2, nombre: 'Estudiante', puntosMin: 101, puntosMax: 300 },
    { nivel: 3, nombre: 'Preparado', puntosMin: 301, puntosMax: 700 },
    { nivel: 4, nombre: 'Experto', puntosMin: 701, puntosMax: 1500 },
    { nivel: 5, nombre: 'Élite', puntosMin: 1501, puntosMax: null },
  ];

  const nivelActual = niveles.find(n => n.nivel === nivel) ?? niveles[0];
  const nivelSiguiente = niveles.find(n => n.nivel === nivel + 1);

  const porcentajeProgreso = nivelSiguiente
    ? Math.min(100, Math.round(((puntos - nivelActual.puntosMin) / (nivelSiguiente.puntosMin - nivelActual.puntosMin)) * 100))
    : 100;

  const puntosParaSiguiente = nivelSiguiente ? nivelSiguiente.puntosMin - puntos : 0;

  return (
    <>
      <Widget titulo="Mi nivel">
        <div
          onClick={() => setModalAbierto(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
        >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <img
            src={getOploUrl(nivel)}
            alt={`OPLO nivel ${nivel}`}
            style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '12px' }}
          />
          {racha > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              background: '#FFF1E8', borderRadius: '999px',
              padding: '2px 8px', fontSize: '10px', fontWeight: 700, color: '#C2410C',
            }}>
              <Flame size={11} /> {racha} {racha === 1 ? 'día' : 'días'}
            </div>
          )}
        </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div>
                <span style={{ fontSize: '11px', color: TEXT_MUTED, fontWeight: 500 }}>Nivel {nivel}</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT_PRIMARY }}>{nivelActual.nombre}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: TEXT_PRIMARY }}>{puntos}</div>
                <div style={{ fontSize: '10px', color: TEXT_MUTED }}>puntos</div>
              </div>
            </div>

            {/* Barra unificada con el resto de la app (azul OPLORA con gradiente) */}
            <div style={{ height: '6px', background: '#F4F5F7', borderRadius: '999px', overflow: 'hidden', marginBottom: '4px' }}>
              <div style={{
                width: `${porcentajeProgreso}%`, height: '100%',
                background: 'linear-gradient(90deg, #1F7CFF, #60a5fa)',
                borderRadius: '999px', transition: 'width 0.5s ease',
              }} />
            </div>

            <div style={{ fontSize: '11px', color: TEXT_MUTED }}>
              {nivelSiguiente ? `${puntosParaSiguiente} puntos para ${nivelSiguiente.nombre}` : 'Nivel máximo'}
            </div>
          </div>
        </div>
      </Widget>

      {modalAbierto && (
        <div
          onClick={() => setModalAbierto(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: BG_APP, borderRadius: '20px', padding: '1.5rem', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT_PRIMARY }}>Tu progreso</div>
                <div style={{ fontSize: '12px', color: TEXT_MUTED, marginTop: '2px' }}>{puntos} puntos acumulados</div>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                style={{ background: 'white', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span style={{ fontSize: '18px', color: TEXT_MUTED, lineHeight: 1 }}>×</span>
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1.25rem', padding: '1rem', background: 'white', borderRadius: '14px' }}>
              <img
                src={getOploUrl(nivel)}
                alt={nivelActual.nombre}
                style={{ width: '100px', height: '100px', objectFit: 'contain', marginBottom: '8px' }}
              />
              <div style={{ fontSize: '16px', fontWeight: 700, color: TEXT_PRIMARY }}>{nivelActual.nombre}</div>
              <div style={{ fontSize: '12px', color: TEXT_MUTED, marginTop: '2px', marginBottom: '10px' }}>Nivel {nivel} de 5</div>
              <div style={{ height: '8px', background: '#F4F5F7', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${porcentajeProgreso}%`, height: '100%', background: '#0f172a', borderRadius: '999px' }} />
              </div>
              <div style={{ fontSize: '11px', color: TEXT_MUTED, marginTop: '6px' }}>
                {nivelSiguiente ? `${puntosParaSiguiente} puntos para ${nivelSiguiente.nombre}` : 'Nivel máximo alcanzado'}
              </div>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Todos los niveles
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
              {niveles.map((n) => {
                const conseguido = nivel >= n.nivel;
                const esActual = nivel === n.nivel;
                return (
                  <div
                    key={n.nivel}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', borderRadius: '12px',
                      background: 'white',
                      border: esActual ? '2px solid #0f172a' : 'none',
                      opacity: conseguido ? 1 : 0.4,
                    }}
                  >
                    <img
                      src={getOploUrl(n.nivel)}
                      alt={n.nombre}
                      style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '8px', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY }}>{n.nombre}</span>
                        {esActual && (
                          <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '999px', background: '#0f172a', color: 'white', fontWeight: 600 }}>
                            Actual
                          </span>
                        )}
                        {conseguido && !esActual && <span style={{ fontSize: '12px', color: '#16A34A' }}>✓</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: TEXT_MUTED, marginTop: '1px' }}>
                        {n.puntosMax ? `${n.puntosMin} – ${n.puntosMax} pts` : `${n.puntosMin}+ pts`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => { setModalAbierto(false); router.push('/app/perfil'); }}
              style={{ width: '100%', padding: '12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Ver perfil completo →
            </button>
          </div>
        </div>
      )}

    </>
  );
}

function AccesoCirculo({ label, Icon, size = 19, onClick, badge = 0, sub, color = '#111827' }: any) {
  const [pulsado, setPulsado] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPulsado(true)}
      onMouseUp={() => setPulsado(false)}
      onMouseLeave={() => setPulsado(false)}
      onTouchStart={() => setPulsado(true)}
      onTouchEnd={() => setPulsado(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', cursor: 'pointer',
        outline: 'none', WebkitTapHighlightColor: 'transparent', padding: 0,
        transform: pulsado ? 'scale(0.88)' : 'scale(1)', // ⭐ más pronunciado (antes 0.92)
        transition: 'transform 0.12s ease',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: pulsado ? '#1F7CFF' : 'white', // ⭐ relleno azul completo al pulsar
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: pulsado ? '0 2px 8px rgba(31,124,255,0.35)' : SOMBRA,
        transition: 'background 0.15s ease, box-shadow 0.15s ease',
        position: 'relative',
      }}>
       <Icon style={{ width: size, height: size, transition: 'color 0.15s ease' }} color={pulsado ? 'white' : color} />
       {badge > 0 && (
         <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: '#DC2626', color: 'white', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxSizing: 'border-box' }}>
           {badge > 9 ? '9+' : badge}
         </span>
       )}
      </div>
      <span style={{ fontSize: 11, color: pulsado ? '#1F7CFF' : TEXT_PRIMARY, fontWeight: 600, transition: 'color 0.15s ease' }}>{label}</span>
      {sub && <span style={{ fontSize: 10, color: TEXT_MUTED, marginTop: -4 }}>{sub}</span>}
    </button>
  );
}