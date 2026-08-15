'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useMemo, useState } from 'react';
import { Newspaper, BarChart3, FileText, Archive, ChevronRight } from 'lucide-react';
import ModalHacerTest from '@/components/entrenamiento/ModalHacerTest';
import { AvatarPerfil } from '@/components/AvatarUsuarioPerfil';
import { getOploUrl } from '@/lib/oplo';

import {
  BellIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  HomeIcon,
  BookOpenIcon,
  FireIcon,
  ArrowPathIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

/* -------------------------------------------------------
   TOKENS DE DISEÑO (compartidos con Entrenamiento)
------------------------------------------------------- */
const BG_APP = '#EAF0FF';
const BG_WIDGET = '#F7F8FA';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

// Colores de actividad (los mismos que en Entrenamiento)
const COLOR_ESTUDIAR = '#1F7CFF';
const COLOR_RETOS = '#C2410C';
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
    return convocatorias.length
      ? [...convocatorias].sort((a, b) => b.anyo - a.anyo)[0]
      : null;
  }, [convocatorias]);

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
  { label: 'Noticias', icon: Newspaper, onClick: () => router.push(`/app/oposicion/${oposicionId}?tab=documentos`) },
  { label: 'Datos', icon: BarChart3, onClick: () => router.push(`/app/oposicion/${oposicionId}`) },
  { label: 'Documentos', icon: FileText, onClick: () => router.push(`/app/oposicion/${oposicionId}?tab=documentos`) },
  { label: 'Historial', icon: Archive, onClick: () => router.push(`/app/oposicion/${oposicionId}/historial`) },
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY }}>
            Hola, {usuario.nombre?.split(' ')[0] || 'Opositor'}
          </span>

          {usuario.suscripcion && (
            <button
              onClick={() => router.push('/app/suscripciones')}
              style={{
                padding: '4px 10px', borderRadius: 999,
                background: 'white', color: TEXT_SECONDARY,
                fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
              }}
            >
              {getSuscripcionLabel(usuario.suscripcion)}
            </button>
          )}
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
              padding: 0, cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
            }}
          >
            <AvatarPerfil usuario={usuario} size={44} />
          </button>
        </div>
      </div>

      {/* Hero oscuro de la oposición (estilo "Documentos oficiales") */}
{/* Hero oscuro de la oposición */}
{oposicion && (
  <div style={{ position: 'relative', marginBottom: '30px' }}>
    <div style={{
      background: '#0f172a', borderRadius: '16px', padding: '18px 16px 50px', // ⭐ padding inferior aumentado de 18px a 34px
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
      position: 'absolute', bottom: '-30px', left: '12px', right: '12px',
      display: 'flex', justifyContent: 'space-between',
    }}>
      {accesos.map(({ label, icon: Icon, onClick }) => (
        <button
          key={label}
          onClick={onClick}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
          }}>
            <Icon size={19} color="#111827" />
          </div>
          <span style={{ fontSize: 10, color: TEXT_SECONDARY, fontWeight: 500 }}>{label}</span>
        </button>
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

function Widget({ titulo, accion, children }: { titulo?: string; accion?: { label: string; onClick: () => void }; children: React.ReactNode }) {
  return (
    <div style={{ background: BG_WIDGET, borderRadius: '18px', padding: '14px' }}>
      {(titulo || accion) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingLeft: '2px' }}>
          {titulo && (
            <span style={{ fontSize: '11px', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {titulo}
            </span>
          )}
          {accion && (
            <button
              onClick={accion.onClick}
              style={{ fontSize: '11px', color: '#111827', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {accion.label}
            </button>
          )}
        </div>
      )}
      {children}
    </div>
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

    <WidgetNoticias oposicionId={oposicionId} router={router} />

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
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 14, border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left' }}
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
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 14, border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 11, background: '#F3FAE9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 16 }}>📄</span>
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
        <div style={{ background: 'white', borderRadius: 14, padding: '14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
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

      <WidgetNoticias oposicionId={oposicionId} router={router} />
      <WidgetSeguirEstudiando oposicionId={oposicionId} router={router} />
      <WidgetAccionesRapidas usuario={usuario} oposicionId={oposicionId} router={router} />
      <SeccionOplo usuario={usuario} />
    </div>
  );
}

/* -------------------------------------------------------
   DASHBOARD: INACTIVO
------------------------------------------------------- */

export function DashboardInactivo({ usuario, oposicionId }: { usuario: any; oposicionId?: string }) {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

    <WidgetNoticias oposicionId={oposicionId} router={router} />
    <WidgetSeguirEstudiando oposicionId={oposicionId} router={router} />
    <WidgetAccionesRapidas usuario={usuario} oposicionId={oposicionId} router={router} />

      {/* Hero — recuperar racha */}
      <div style={{ background: '#0f172a', borderRadius: 18, padding: '20px 18px', color: 'white', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 17, fontWeight: 700 }}>Has perdido tu racha</span>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>No pasa nada, hoy es un buen día para volver</span>
        <button
          onClick={() => router.push('/app/entrenamiento')}
          style={{ marginTop: 8, width: '100%', borderRadius: 999, border: 'none', padding: '13px 16px', background: 'white', color: '#0f172a', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          Empezar reto rápido (2 min)
        </button>
      </div>

      {/* Widget: Progreso general */}
      <Widget titulo="Mi progreso general">
        <div style={{ background: 'white', borderRadius: 14, padding: '14px' }}>
          <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 8 }}>
            Has completado un 32% del temario. ¡Vamos a por más!
          </div>
          <div style={{ height: 8, background: '#F4F5F7', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: '32%', height: '100%', background: TEXT_PRIMARY, borderRadius: 999 }} />
          </div>
        </div>
      </Widget>

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
};

function formatearFecha(fecha: string | Date): string {
  const d = new Date(fecha);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anyo = String(d.getFullYear()).slice(-2);
  return `${dia}-${mes}-${anyo}`;
}

function WidgetNoticias({ oposicionId, router }: any) {
  const [expandido, setExpandido] = useState(false);

  const { data: noticias = [], isLoading } = useQuery({
    queryKey: ['noticias-oposicion', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${oposicionId}/noticias?limite=3`);
      return res.data;
    },
    enabled: !!oposicionId,
  });

  if (!oposicionId || isLoading) return null;

  const noticiasAMostrar = expandido ? noticias : noticias.slice(0, 1);

  return (
    <Widget
      titulo={expandido ? 'Últimas noticias' : 'Última noticia'}
      accion={
        noticias.length > 0
          ? expandido
            ? { label: 'Ver todas', onClick: () => router.push(`/app/oposicion/${oposicionId}?tab=documentos`) }
            : { label: 'Ver más', onClick: () => setExpandido(true) }
          : undefined
      }
    >
      {noticias.length === 0 ? (
        <div style={{ fontSize: 12, color: TEXT_MUTED, padding: '8px 4px' }}>
          Sin noticias por ahora. Te avisaremos en cuanto haya novedades.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {noticiasAMostrar.map((n: any) => (
            <div
              key={n.id}
              onClick={() => n.urlPdf && window.open(n.urlPdf, '_blank')}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 4px', cursor: n.urlPdf ? 'pointer' : 'default' }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                background: tipoIconoBg[n.tipo] ?? '#F4F5F7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: 1,
              }}>
                <FileText size={13} color={tipoIconoColor[n.tipo] ?? TEXT_MUTED} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 10, color: TEXT_PRIMARY, fontWeight: 700, flexShrink: 0 }}>
                    {formatearFecha(n.fecha)}
                  </span>
                  <span style={{ fontSize: 12, color: TEXT_PRIMARY, fontWeight: 500, lineHeight: 1.3 }}>
                    {n.titular}
                  </span>
                </div>
                {n.descripcion && (
                  <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2, lineHeight: 1.4 }}>
                    {n.descripcion}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Widget>
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
      console.log('Respuesta:', res.data); // ⭐
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
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId,
  });
  const convocatoria = convocatorias.find((c: any) => c.estado === 'activa') ?? convocatorias[0];

  const { data: limites } = useQuery({
    queryKey: ['limites', usuario?.id],
    queryFn: async () => {
      const res = await api.get('/usuarios/limites');
      return res.data;
    },
    enabled: !!usuario,
  });

  const { data: pendientesFC = [] } = useQuery({
    queryKey: ['fc-pendientes-widget', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/flashcards/pendientes/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId,
  });

  if (!oposicionId) return null;



const acciones = [
  {
    label: 'Hacer test',
    icon: ClipboardDocumentCheckIcon,
    bg: '#EFFADE',
    color: COLOR_PRACTICAR,
    onClick: () => setModalTest(true),
  },
  {
    label: 'Flashcards',
    sub: pendientesFC.length > 0 ? `${pendientesFC.length} pendientes` : 'Al día',
    icon: ArrowPathIcon,
    bg: '#FADEF7',
    color: '#9333EA',
    onClick: () => router.push('/app/flashcards'),
  },
  {
    label: 'Retos',
    icon: FireIcon,
    bg: '#FACCC0',
    color: COLOR_RETOS,
    onClick: () => router.push('/app/retos'),
  },
];

  return (
    <>
      <Widget titulo="Acciones rápidas">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {acciones.map(({ label, sub, icon: Icon, bg, color, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              style={{
                background: 'white', border: 'none', borderRadius: 14,
                padding: '14px 8px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6, cursor: 'pointer',
                transition: 'box-shadow 0.15s',
              }}
              onMouseDown={(e) => { e.currentTarget.style.boxShadow = 'inset 0 0 0 2px #d1d5db'; }}
              onMouseUp={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              onTouchStart={(e) => { e.currentTarget.style.boxShadow = 'inset 0 0 0 2px #d1d5db'; }}
              onTouchEnd={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 11, background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon style={{ width: 26, height: 26, color }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_PRIMARY, textAlign: 'center' }}>{label}</span>
              {sub && <span style={{ fontSize: 9, color: TEXT_MUTED }}>{sub}</span>}
            </button>
          ))}
        </div>
      </Widget>

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
  console.log('SeccionOplo usuario:', usuario); // ⭐ temporal
  
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const router = useRouter();

  const nivel = usuario?.nivel ?? 1;
  const puntos = usuario?.puntos ?? 0;
  const racha = usuario?.rachaActual ?? 0;

  console.log('racha calculada:', racha); // ⭐ temporal

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
          style={{ background: 'white', borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
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
              background: '#EFF6FF', borderRadius: '999px',
              padding: '2px 8px', fontSize: '10px', fontWeight: 700, color: '#1F7CFF',
            }}>
              ⚡ {racha} días
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
              {nivelSiguiente ? `${puntosParaSiguiente} puntos para ${nivelSiguiente.nombre}` : '🏆 Nivel máximo'}
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
                {nivelSiguiente ? `${puntosParaSiguiente} puntos para ${nivelSiguiente.nombre}` : '🏆 Nivel máximo alcanzado'}
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