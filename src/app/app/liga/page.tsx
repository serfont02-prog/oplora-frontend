'use client';

// ⭐ Liga Oplora — pantalla principal: división, jornada del fin de semana, clasificaciones,
// palmarés y avisos de la liga.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight, Trophy, Crown, ArrowUp } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { FooterNavegacion } from '@/app/app/dashboard/page';
import { useMiLiga } from '@/components/liga/TarjetaLiga';
import AvisosLiga from '@/components/liga/AvisosLiga';
import {
  COLOR_LIGA, BG_LIGA, HEX_COPA, NOMBRE_COPA, NOMBRE_DIVISION,
  CopaBadge, AvatarMini, nombreVisible, estadoJornada, cuentaAtras, fechaCompleta,
  nombreMes, sumarMes, formatoNota, formatoPuntos, formatoTiempo, mensajeError,
} from '@/components/liga/ligaUtils';

const TEXT_PRIMARY = '#111827';
const TEXT_MUTED = '#6B7280';
const BG_APP = '#FCEEE8';

type Tab = 'mensual' | 'general' | 'jornada';

export default function LigaPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const oposicionId = (usuario as any)?.oposicionActiva?.id;
  const { data, isLoading, error } = useMiLiga(!!usuario);
  const [tab, setTab] = useState<Tab>('mensual');

  useEffect(() => {
    try {
      const t = new URLSearchParams(window.location.search).get('tab');
      if (t === 'mensual' || t === 'general' || t === 'jornada') setTab(t);
    } catch { /* sin query */ }
  }, []);

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

            <div>
              <div style={{ display: 'flex', background: 'white', borderRadius: 12, padding: 4, gap: 4 }}>
                {([
                  ['mensual', 'Mensual'],
                  ['general', 'General'],
                  ['jornada', 'Jornada'],
                ] as [Tab, string][]).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    style={{
                      flex: 1, border: 'none', borderRadius: 9, padding: '9px 0', cursor: 'pointer',
                      fontSize: 13, fontWeight: 700,
                      background: tab === k ? COLOR_LIGA : 'transparent',
                      color: tab === k ? 'white' : TEXT_MUTED,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                {tab === 'mensual' && <ClasificacionMensual miDivision={data.division} />}
                {tab === 'general' && <ClasificacionGeneral />}
                {tab === 'jornada' && <ClasificacionJornada jornada={data.jornada} />}
              </div>
            </div>

            <Palmares />
            <ComoFunciona data={data} />
            <AvisosLiga avisos={data.avisos} />
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

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{titulo}</div>
      {children}
    </div>
  );
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

/* ------------------------------------------------------------------ */

function FilaUsuario({
  posicion, usuario, esYo, derecha, sub, marca,
}: {
  posicion: number | null; usuario: any; esYo: boolean; derecha: React.ReactNode; sub?: React.ReactNode; marca?: React.ReactNode;
}) {
  const medalla = posicion === 1 ? '#EAB308' : posicion === 2 ? '#94A3B8' : posicion === 3 ? '#B45309' : null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 12, background: esYo ? BG_LIGA : 'white', border: esYo ? `1px solid ${COLOR_LIGA}33` : '1px solid #F1F5F9' }}>
      <span style={{ width: 24, textAlign: 'center', fontSize: 13, fontWeight: 800, color: medalla ?? TEXT_MUTED, flexShrink: 0 }}>{posicion ?? '—'}</span>
      <AvatarMini usuario={usuario} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nombreVisible(usuario)}{esYo ? ' (tú)' : ''}
          </span>
          {marca}
        </div>
        {sub && <div style={{ fontSize: 11, color: TEXT_MUTED }}>{sub}</div>}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>{derecha}</div>
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return <Caja><div style={{ fontSize: 13, color: TEXT_MUTED, textAlign: 'center', padding: '8px 0' }}>{texto}</div></Caja>;
}

function ClasificacionMensual({ miDivision }: { miDivision: number }) {
  const [mes, setMes] = useState<string | null>(null);
  const [division, setDivision] = useState<number>(miDivision);

  const { data, isLoading, error } = useQuery({
    queryKey: ['liga-mensual', mes, division],
    queryFn: async () =>
      (await api.get('/liga/clasificacion/mensual', { params: { ...(mes ? { mes } : {}), division } })).data,
    staleTime: 60_000,
  });

  const mesMostrado: string | null = data?.mes ?? mes;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: 12, padding: '6px 8px' }}>
        <button
          onClick={() => mesMostrado && setMes(sumarMes(mesMostrado, -1))}
          aria-label="Mes anterior"
          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
        >
          <ChevronLeft size={18} color={TEXT_PRIMARY} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, textTransform: 'capitalize' }}>
          {mesMostrado ? nombreMes(mesMostrado) : '…'}{data?.cerrado ? ' · cerrada' : ''}
        </span>
        <button
          onClick={() => mesMostrado && setMes(sumarMes(mesMostrado, 1))}
          aria-label="Mes siguiente"
          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
        >
          <ChevronRight size={18} color={TEXT_PRIMARY} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
        {[1, 2, 3, 4, 5].map((d) => (
          <button
            key={d}
            onClick={() => setDivision(d)}
            style={{
              flex: '1 0 auto', border: division === d ? `1.5px solid ${COLOR_LIGA}` : '1px solid #F1F5F9',
              background: division === d ? 'white' : 'rgba(255,255,255,0.6)', color: division === d ? COLOR_LIGA : TEXT_MUTED,
              borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {NOMBRE_DIVISION[d]}{d === miDivision ? ' · tú' : ''}
          </button>
        ))}
      </div>

      {isLoading && <Vacio texto="Cargando clasificación…" />}
      {error && <Vacio texto={mensajeError(error, 'No se ha podido cargar la clasificación')} />}
      {data && data.filas.length === 0 && <Vacio texto="Nadie ha puntuado todavía este mes en esta división." />}

      {data && data.filas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {data.filas.map((f: any, i: number) => {
            const lineaAscenso = data.division > 1 && data.plazasAscenso > 0 && i === data.plazasAscenso && !data.cerrado;
            return (
              <div key={f.usuario?.id ?? i}>
                {lineaAscenso && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 9px' }}>
                    <div style={{ flex: 1, height: 1, background: '#16A34A55' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Zona de ascenso</span>
                    <div style={{ flex: 1, height: 1, background: '#16A34A55' }} />
                  </div>
                )}
                <FilaUsuario
                  posicion={f.posicion}
                  usuario={f.usuario}
                  esYo={f.esYo}
                  marca={
                    <>
                      {f.campeon && <Crown size={13} color={HEX_COPA[colorDivision(data.division)]} />}
                      {f.zonaAscenso && !f.campeon && <ArrowUp size={13} color="#16A34A" />}
                    </>
                  }
                  sub={`${f.jornadasJugadas} ${f.jornadasJugadas === 1 ? 'jornada' : 'jornadas'}${f.jornadasGanadas ? ` · ${f.jornadasGanadas} ${f.jornadasGanadas === 1 ? 'victoria' : 'victorias'}` : ''}`}
                  derecha={
                    <>
                      <div style={{ fontSize: 14, fontWeight: 800, color: TEXT_PRIMARY }}>{formatoPuntos(f.puntos)}</div>
                      <div style={{ fontSize: 10, color: TEXT_MUTED }}>puntos</div>
                    </>
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      {data && data.division > 1 && !data.cerrado && data.filas.length > 0 && (
        <div style={{ fontSize: 11, color: TEXT_MUTED, textAlign: 'center' }}>
          Suben {data.plazasAscenso} de {data.filas.length} ({data.porcentajeAscenso}%) al cerrar el mes.
        </div>
      )}
    </div>
  );
}

function colorDivision(d: number): string {
  return ({ 1: 'oro', 2: 'plata', 3: 'bronce', 4: 'azul', 5: 'verde' } as Record<number, string>)[d] ?? 'oro';
}

function ClasificacionGeneral() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['liga-general'],
    queryFn: async () => (await api.get('/liga/clasificacion/general')).data,
    staleTime: 60_000,
  });

  if (isLoading) return <Vacio texto="Cargando clasificación…" />;
  if (error) return <Vacio texto={mensajeError(error, 'No se ha podido cargar la clasificación')} />;
  if (!data?.filas?.length) return <Vacio texto="La clasificación general empieza con la primera jornada." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ fontSize: 11, color: TEXT_MUTED, lineHeight: 1.45, padding: '0 2px 4px' }}>
        Suma de toda la liga. Los puntos pesan más cuanto más alta es la división (×1,0 en Quinta hasta ×1,5 en Primera).
        {data.cerrada ? ' Temporada terminada.' : ' El líder al llegar el examen gana la copa de temporada.'}
      </div>
      {data.filas.map((f: any, i: number) => (
        <FilaUsuario
          key={f.usuario?.id ?? i}
          posicion={f.posicion}
          usuario={f.usuario}
          esYo={f.esYo}
          sub={`${f.nombreDivision ?? '—'} · ${f.jornadasJugadas} ${f.jornadasJugadas === 1 ? 'jornada' : 'jornadas'}`}
          derecha={
            <>
              <div style={{ fontSize: 14, fontWeight: 800, color: TEXT_PRIMARY }}>{formatoPuntos(f.puntos)}</div>
              <div style={{ fontSize: 10, color: TEXT_MUTED }}>puntos</div>
            </>
          }
        />
      ))}
    </div>
  );
}

function ClasificacionJornada({ jornada }: { jornada: any }) {
  const router = useRouter();
  const activa = !!jornada && (jornada.estado === 'abierta' || jornada.estado === 'cerrada');
  const { data, isLoading, error } = useQuery({
    queryKey: ['liga-jornada-clasif', jornada?.id],
    queryFn: async () => (await api.get(`/liga/jornadas/${jornada.id}/clasificacion`)).data,
    enabled: activa,
    staleTime: 30_000,
  });

  if (!activa) return <Vacio texto="La clasificación aparece en cuanto se abre la jornada el viernes." />;
  if (isLoading) return <Vacio texto="Cargando clasificación…" />;
  if (error) return <Vacio texto={mensajeError(error, 'No se ha podido cargar la clasificación')} />;
  if (!data?.filas?.length) return <Vacio texto="Nadie ha entregado todavía. ¡Sé el primero!" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ fontSize: 11, color: TEXT_MUTED, padding: '0 2px 4px' }}>
        {data.provisional
          ? `Provisional: se ordena por nota y, a igualdad, por tiempo. Los puntos se reparten al cierre (${fechaCompleta(jornada.fechaCierre)}).`
          : `${jornada.descripcion ?? 'Jornada'} · definitiva`}
      </div>
      {data.filas.map((f: any, i: number) => (
        <FilaUsuario
          key={f.usuario?.id ?? i}
          posicion={f.posicion}
          usuario={f.usuario}
          esYo={f.esYo}
          sub={`${f.aciertos ?? 0} ✓ · ${f.fallos ?? 0} ✗ · ${formatoTiempo(f.tiempoMs)}`}
          derecha={
            <>
              <div style={{ fontSize: 14, fontWeight: 800, color: TEXT_PRIMARY }}>{formatoNota(f.nota)}</div>
              <div style={{ fontSize: 10, color: TEXT_MUTED }}>{f.puntos != null ? `+${formatoPuntos(f.puntos)} pts` : 'nota'}</div>
            </>
          }
        />
      ))}
      {!data.provisional && (
        <button
          onClick={() => router.push(`/app/liga/revision/${jornada.id}`)}
          style={{ marginTop: 4, border: 'none', borderRadius: 12, padding: 11, background: '#111827', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          Ver soluciones
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Palmares() {
  const { data } = useQuery({
    queryKey: ['liga-palmares'],
    queryFn: async () => (await api.get('/liga/palmares')).data,
    staleTime: 5 * 60_000,
  });
  if (!data?.copas?.length) return null;

  return (
    <Seccion titulo={`Tu palmarés · ${data.copas.length}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {data.copas.map((c: any) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', borderRadius: 12, padding: '9px 12px', border: '1px solid #F1F5F9' }}>
            <CopaBadge color={c.color} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>
                {c.tipo === 'temporada' ? 'Campeón de la temporada' : `Campeón de ${c.nombreDivision}`}
              </div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: c.tipo === 'temporada' ? 'none' : 'capitalize' }}>
                {c.tipo === 'temporada' ? NOMBRE_COPA.temporada : nombreMes(c.mes)}
                {c.convocatoria?.anyo ? ` · ${c.convocatoria.oposicion ?? ''} ${c.convocatoria.anyo}`.trimEnd() : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Seccion>
  );
}

function ComoFunciona({ data }: { data: any }) {
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
    </Caja>
  );
}
