'use client';

// ⭐ Liga Oplora — clasificaciones (mensual, general y de la jornada) y filas de usuario.
// Se usan en la pantalla de clasificaciones y en el resumen de la pantalla de la liga.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Crown, ArrowUp } from 'lucide-react';
import { api } from '@/lib/api';
import {
  COLOR_LIGA, BG_LIGA, HEX_COPA, NOMBRE_DIVISION,
  AvatarMini, nombreVisible, fechaCompleta,
  nombreMes, sumarMes, formatoNota, formatoPuntos, formatoTiempo, mensajeError,
} from './ligaUtils';

const TEXT_PRIMARY = 'var(--hx-111827)';
const TEXT_MUTED = 'var(--hx-6b7280)';

export function Caja({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'var(--c-superficie)', borderRadius: 18, padding: 14, border: '1px solid var(--hx-f1f5f9)', ...style }}>{children}</div>;
}

export function FilaUsuario({
  posicion, usuario, esYo, derecha, sub, marca,
}: {
  posicion: number | null; usuario: any; esYo: boolean; derecha: React.ReactNode; sub?: React.ReactNode; marca?: React.ReactNode;
}) {
  const medalla = posicion === 1 ? '#EAB308' : posicion === 2 ? 'var(--hx-94a3b8)' : posicion === 3 ? 'var(--hx-b45309)' : null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 12, background: esYo ? BG_LIGA : 'var(--c-superficie)', border: esYo ? `1px solid ${`color-mix(in srgb, ${COLOR_LIGA} 20%, transparent)`}` : '1px solid var(--hx-f1f5f9)' }}>
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

export function Vacio({ texto }: { texto: string }) {
  return <Caja><div style={{ fontSize: 13, color: TEXT_MUTED, textAlign: 'center', padding: '8px 0' }}>{texto}</div></Caja>;
}

export function ClasificacionMensual({ miDivision }: { miDivision: number }) {
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--c-superficie)', borderRadius: 12, padding: '6px 8px' }}>
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
              flex: '1 0 auto', border: division === d ? `1.5px solid ${COLOR_LIGA}` : '1px solid var(--hx-f1f5f9)',
              background: division === d ? 'var(--c-superficie)' : 'color-mix(in srgb, var(--c-superficie) 60%, transparent)', color: division === d ? COLOR_LIGA : TEXT_MUTED,
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
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--hx-16a34a)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Zona de ascenso</span>
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
                      {f.zonaAscenso && !f.campeon && <ArrowUp size={13} color="var(--hx-16a34a)" />}
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

export function colorDivision(d: number): string {
  return ({ 1: 'oro', 2: 'plata', 3: 'bronce', 4: 'azul', 5: 'verde' } as Record<number, string>)[d] ?? 'oro';
}

export function ClasificacionGeneral() {
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

export function ClasificacionJornada({ jornada }: { jornada: any }) {
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
          style={{ marginTop: 4, border: 'none', borderRadius: 12, padding: 11, background: 'var(--hxbg-111827)', color: 'var(--c-primario-texto)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          Ver soluciones
        </button>
      )}
    </div>
  );
}
