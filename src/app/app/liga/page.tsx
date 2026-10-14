'use client';

// ⭐ Liga Oplora — pantalla principal: división, jornada del fin de semana y tu posición.
// Las clasificaciones completas están en /app/liga/clasificacion; el palmarés en el perfil
// y los avisos en Preferencias.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Trophy, ArrowUp, BarChart3, Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { FooterNavegacion } from '@/app/app/dashboard/page';
import { useMiLiga } from '@/components/liga/TarjetaLiga';
import {
  COLOR_LIGA, BG_LIGA,
  CopaBadge, AvatarMini, nombreVisible, estadoJornada, cuentaAtras,
  nombreMes, formatoPuntos, formatoTiempo, mensajeError,
} from '@/components/liga/ligaUtils';

const TEXT_PRIMARY = '#111827';
const TEXT_MUTED = '#6B7280';
const BG_APP = '#FCEEE8';

export default function LigaPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const oposicionId = (usuario as any)?.oposicionActiva?.id;
  const { data, isLoading, error } = useMiLiga(!!usuario);

  if (!usuario) return null;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 90 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => router.push('/app/retos')}
            aria-label="Volver"
            style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={17} color={TEXT_PRIMARY} />
          </button>
          <div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Liga Oplora{data?.convocatoria?.anyo ? ` · Convocatoria ${data.convocatoria.anyo}` : ''}
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>Compite cada fin de semana</div>
          </div>
        </div>

        {isLoading && <Caja><div style={{ fontSize: 13, color: TEXT_MUTED }}>Cargando la liga…</div></Caja>}
        {error && <Caja><div style={{ fontSize: 13, color: '#B91C1C' }}>{mensajeError(error, 'No se ha podido cargar la liga')}</div></Caja>}

        {data && !data.liga && <SinLiga motivo={data.motivo} oposicionId={oposicionId} />}

        {data?.liga && (
          <>
            <TarjetaDivision data={data} />
            <TarjetaJornada data={data} />

            <TarjetaPosicion division={data.division} porcentaje={data.liga.porcentajeAscenso} />
            <ComoFunciona data={data} />
          </>
        )}
      </div>

      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} activo="retos" />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Caja({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'white', borderRadius: 18, padding: 14, border: '1px solid #F1F5F9', ...style }}>{children}</div>;
}

function SinLiga({ motivo, oposicionId }: { motivo?: string; oposicionId?: string }) {
  const router = useRouter();
  return (
    <Caja style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', textAlign: 'center', padding: '24px 18px' }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: BG_LIGA, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Trophy size={26} color={COLOR_LIGA} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>
        {motivo === 'sin_convocatoria' ? 'Elige tu convocatoria' : 'Tu liga aún no ha empezado'}
      </div>
      <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5 }}>
        {motivo === 'sin_convocatoria'
          ? 'La Liga Oplora se juega por convocatoria. Elige la tuya para entrar en su liga.'
          : 'Cuando se abra la liga de tu convocatoria entrarás automáticamente en Quinta división. Te avisaremos.'}
      </div>
      {motivo === 'sin_convocatoria' && (
        <button
          onClick={() => router.push(oposicionId ? `/app/oposicion/${oposicionId}/convocatoria` : '/app/onboarding/oposicion')}
          style={{ marginTop: 4, border: 'none', borderRadius: 12, padding: '11px 18px', background: '#111827', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          Elegir convocatoria
        </button>
      )}
    </Caja>
  );
}

function TarjetaDivision({ data }: { data: any }) {
  const copas = data.copas ?? {};
  return (
    <div style={{ background: '#111827', borderRadius: 18, padding: '16px 16px', color: 'white', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{data.division}ª</span>
        <span style={{ fontSize: 9, color: '#94A3B8', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>div.</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{data.nombreDivision} división</div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
          {data.division > 1
            ? `Asciende el ${data.liga.porcentajeAscenso}% mejor de cada mes`
            : 'La división de los mejores'}
          {data.liga.estado === 'pausada' ? ' · Liga en pausa' : ''}
          {data.liga.estado === 'cerrada' ? ' · Temporada terminada' : ''}
        </div>
      </div>
      {copas.total > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <CopaBadge color={copas.color ?? (copas.temporadas ? 'temporada' : null)} veces={copas.veces || copas.temporadas} size={30} />
          <span style={{ fontSize: 10, color: '#94A3B8' }}>{copas.total} {copas.total === 1 ? 'copa' : 'copas'}</span>
        </div>
      )}
    </div>
  );
}

function TarjetaJornada({ data }: { data: any }) {
  const router = useRouter();
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const j = data.jornada;
  const estado = estadoJornada(data);
  const r = data.miResultado;

  let reloj: string | null = null;
  if (j?.estado === 'programada') reloj = `Abre en ${cuentaAtras(j.fechaApertura, ahora)}`;
  if (j?.estado === 'abierta') reloj = `Cierra en ${cuentaAtras(j.fechaCierre, ahora)}`;

  return (
    <Caja style={{ border: estado.destacado ? `1.5px solid ${COLOR_LIGA}` : '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: estado.destacado ? COLOR_LIGA : TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {estado.etiqueta}
        </span>
        {reloj && (
          <span style={{ fontSize: 11, fontWeight: 700, color: COLOR_LIGA, background: BG_LIGA, borderRadius: 999, padding: '3px 9px' }}>{reloj}</span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>{estado.titulo}</div>
        <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 3, lineHeight: 1.45 }}>{estado.detalle}</div>
      </div>

      {r?.enviado && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {[
            ['Aciertos', r.aciertos],
            ['Fallos', r.fallos],
            ['En blanco', r.blancos],
            ['Tiempo', formatoTiempo(r.tiempoMs)],
          ].map(([label, valor]) => (
            <div key={label as string} style={{ background: '#F8F9FA', borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: TEXT_PRIMARY }}>{valor ?? '—'}</div>
              <div style={{ fontSize: 10, color: TEXT_MUTED }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {j && (j.estado === 'abierta' || j.estado === 'cerrada') && (
        <div style={{ fontSize: 11, color: TEXT_MUTED }}>
          {data.participantes} {data.participantes === 1 ? 'opositor ha entregado' : 'opositores han entregado'} en tu división
        </div>
      )}

      {j?.estado === 'abierta' && !r?.iniciado && (
        <div style={{ fontSize: 11, color: TEXT_MUTED, lineHeight: 1.45, background: '#F8F9FA', borderRadius: 10, padding: '8px 10px' }}>
          Un solo intento. En cuanto empieces corre el reloj, aunque salgas de la app. Los fallos restan como en el examen.
        </div>
      )}

      {estado.accion && (
        <button
          onClick={() => router.push(estado.accion!.href)}
          style={{ width: '100%', border: 'none', borderRadius: 12, padding: 12, background: estado.destacado ? COLOR_LIGA : '#111827', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          {estado.accion.label}
        </button>
      )}
    </Caja>
  );
}

/** Tu puesto del mes, distancia al ascenso, podio de tu división y acceso a las clasificaciones. */
function TarjetaPosicion({ division, porcentaje }: { division: number; porcentaje: number }) {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['liga-mensual', null, division],
    queryFn: async () => (await api.get('/liga/clasificacion/mensual', { params: { division } })).data,
    staleTime: 60_000,
  });

  const filas: any[] = data?.filas ?? [];
  const yo = filas.find((f) => f.esYo);
  const plazas: number = data?.plazasAscenso ?? 0;
  const corte = plazas > 0 ? filas[plazas - 1] : null;
  const enZona = !!yo?.zonaAscenso;
  const faltan = !enZona && yo && corte ? Math.max(0, Number(corte.puntos) - Number(yo.puntos)) : null;
  const podio = filas.slice(0, 3);

  let titular = 'Aún sin puntos este mes';
  let detalle = 'Juega la jornada del fin de semana para entrar en la clasificación.';
  if (yo) {
    titular = `${yo.posicion}.º de ${filas.length} · ${formatoPuntos(yo.puntos)} puntos`;
    detalle = division === 1
      ? 'Primera división: el primero del mes gana la copa de oro.'
      : enZona
        ? `Estás en zona de ascenso (sube el ${porcentaje}% mejor).`
        : faltan != null
          ? `Te faltan ${formatoPuntos(faltan)} puntos para la zona de ascenso.`
          : `Sube el ${porcentaje}% mejor de la división al cerrar el mes.`;
  }

  return (
    <Caja style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Tu posición{data?.mes ? ` · ${nombreMes(data.mes)}` : ''}
        </div>
        {isLoading ? (
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 4 }}>Cargando…</div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: TEXT_PRIMARY }}>{titular}</span>
              {enZona && <ArrowUp size={15} color="#16A34A" />}
            </div>
            <div style={{ fontSize: 12, color: enZona ? '#16A34A' : TEXT_MUTED, marginTop: 2 }}>{detalle}</div>
          </>
        )}
      </div>

      {podio.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {podio.map((f: any) => (
            <div key={f.usuario?.id ?? f.posicion} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 18, fontSize: 12, fontWeight: 800, color: f.posicion === 1 ? '#EAB308' : f.posicion === 2 ? '#94A3B8' : '#B45309' }}>{f.posicion}</span>
              <AvatarMini usuario={f.usuario} size={24} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: f.esYo ? 800 : 600, color: TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nombreVisible(f.usuario)}{f.esYo ? ' (tú)' : ''}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY }}>{formatoPuntos(f.puntos)} pts</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => router.push('/app/liga/clasificacion')}
        style={{ width: '100%', border: `1px solid ${COLOR_LIGA}55`, background: 'white', color: COLOR_LIGA, borderRadius: 12, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <BarChart3 size={15} /> Ver clasificaciones
      </button>
    </Caja>
  );
}

function ComoFunciona({ data }: { data: any }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  return (
    <Caja>
      <button
        onClick={() => setAbierto((v) => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>¿Cómo funciona la liga?</span>
        <ChevronRight size={16} color={TEXT_MUTED} style={{ transform: abierto ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {abierto && (
        <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12, color: TEXT_MUTED, lineHeight: 1.6 }}>
          <li>Cada fin de semana hay una jornada: abre el viernes a las {data.liga.horaApertura} y cierra el domingo a las {data.liga.horaCierre}.</li>
          <li>El lunes te avisamos de los temas que entran. Toda tu división hace el mismo test, con un solo intento.</li>
          <li>Se corrige como el examen: los fallos restan. A igualdad de nota, gana quien tarde menos.</li>
          <li>Puntos por jornada según tu puesto (hasta 100) y 10 más solo por participar.</li>
          <li>Al cerrar el mes asciende el {data.liga.porcentajeAscenso}% mejor de cada división. Nadie desciende.</li>
          <li>El campeón de cada división gana una copa: oro en Primera, plata en Segunda, bronce en Tercera, azul en Cuarta y verde en Quinta.</li>
        </ul>
      )}
      <button
        onClick={() => router.push('/app/preferencias')}
        style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, color: TEXT_MUTED }}
      >
        <Bell size={13} /> Configurar los avisos de la liga
      </button>
    </Caja>
  );
}
