'use client';

// ⭐ Liga Oplora — revisión de una jornada cerrada: respuesta correcta, la tuya y la explicación.

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, X as XIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { COLOR_LIGA, BG_LIGA, formatoNota, formatoPuntos, formatoTiempo, mensajeError } from '@/components/liga/ligaUtils';

const TEXT_PRIMARY = '#111827';
const TEXT_MUTED = '#6B7280';
const VERDE = '#16A34A';
const ROJO = '#DC2626';
const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

type Filtro = 'todas' | 'fallos' | 'blanco';

export default function RevisionJornadaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { usuario } = useAuth();
  const [filtro, setFiltro] = useState<Filtro>('todas');

  const { data, isLoading, error } = useQuery({
    queryKey: ['liga-revision', id],
    queryFn: async () => (await api.get(`/liga/jornadas/${id}/revision`)).data,
    enabled: !!usuario && !!id,
    staleTime: Infinity,
    retry: false,
  });

  const preguntas: any[] = useMemo(() => {
    const todas = (data?.preguntas ?? []).map((p: any, i: number) => ({ ...p, n: i + 1 }));
    if (filtro === 'fallos') return todas.filter((p: any) => p.tuRespuesta != null && p.tuRespuesta !== p.correcta);
    if (filtro === 'blanco') return todas.filter((p: any) => p.tuRespuesta == null);
    return todas;
  }, [data, filtro]);

  if (!usuario) return null;

  const r = data?.resultado;
  const j = data?.jornada;

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', paddingBottom: 40 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => router.push('/app/liga')}
            aria-label="Volver"
            style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={17} color={TEXT_PRIMARY} />
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Revisión{j?.nombreDivision ? ` · ${j.nombreDivision} división` : ''}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: TEXT_PRIMARY }}>{j?.descripcion ?? 'Jornada de liga'}</div>
          </div>
        </div>

        {isLoading && <div style={{ fontSize: 13, color: TEXT_MUTED }}>Cargando…</div>}
        {error && (
          <div style={{ background: 'white', borderRadius: 16, padding: 16, fontSize: 13, color: TEXT_MUTED }}>
            {mensajeError(error, 'No se ha podido cargar la revisión')}
          </div>
        )}

        {data && (
          <>
            {r?.enviado ? (
              <div style={{ background: 'white', borderRadius: 18, padding: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <Dato titulo="Nota" valor={formatoNota(r.nota)} />
                <Dato titulo="Puesto" valor={r.posicion != null ? `${r.posicion}º` : '—'} />
                <Dato titulo="Puntos" valor={r.puntos != null ? `+${formatoPuntos(r.puntos)}` : '—'} color={COLOR_LIGA} />
                <Dato titulo="Aciertos" valor={r.aciertos ?? 0} color={VERDE} />
                <Dato titulo="Fallos" valor={r.fallos ?? 0} color={ROJO} />
                <Dato titulo="Tiempo" valor={formatoTiempo(r.tiempoMs)} />
              </div>
            ) : (
              <div style={{ background: BG_LIGA, borderRadius: 14, padding: '10px 12px', fontSize: 12, color: COLOR_LIGA, fontWeight: 600 }}>
                No jugaste esta jornada. Aquí tienes las soluciones para repasar.
              </div>
            )}

            {r?.enviado && (
              <div style={{ display: 'flex', background: 'white', borderRadius: 12, padding: 4, gap: 4 }}>
                {([
                  ['todas', 'Todas'],
                  ['fallos', 'Fallos'],
                  ['blanco', 'En blanco'],
                ] as [Filtro, string][]).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setFiltro(k)}
                    style={{ flex: 1, border: 'none', borderRadius: 9, padding: '8px 0', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: filtro === k ? '#111827' : 'transparent', color: filtro === k ? 'white' : TEXT_MUTED }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {preguntas.length === 0 && (
              <div style={{ background: 'white', borderRadius: 16, padding: 16, fontSize: 13, color: TEXT_MUTED, textAlign: 'center' }}>
                {filtro === 'fallos' ? '¡Ningún fallo!' : filtro === 'blanco' ? 'No dejaste ninguna en blanco.' : 'No hay preguntas.'}
              </div>
            )}

            {preguntas.map((p: any) => {
              const acierto = p.tuRespuesta != null && p.tuRespuesta === p.correcta;
              const fallo = p.tuRespuesta != null && p.tuRespuesta !== p.correcta;
              const borde = !r?.enviado ? '#F1F5F9' : acierto ? VERDE : fallo ? ROJO : '#D1D5DB';
              return (
                <div key={p.id ?? p.n} style={{ background: 'white', borderRadius: 16, padding: 14, borderLeft: `4px solid ${borde}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED }}>Pregunta {p.n}</span>
                    {r?.enviado && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: acierto ? VERDE : fallo ? ROJO : TEXT_MUTED }}>
                        {acierto ? 'Acierto' : fallo ? 'Fallo' : 'En blanco'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{p.enunciado}</div>
                  {p.imagenUrl && <img src={p.imagenUrl} alt="" style={{ display: 'block', maxWidth: '100%', margin: '10px auto 0', borderRadius: 10 }} />}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                    {(p.opciones ?? []).map((op: string, i: number) => {
                      const esCorrecta = i === p.correcta;
                      const esTuya = i === p.tuRespuesta;
                      const fondo = esCorrecta ? '#F0FDF4' : esTuya ? '#FEF2F2' : 'white';
                      const linea = esCorrecta ? VERDE : esTuya ? ROJO : '#E5E7EB';
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 11px', borderRadius: 11, background: fondo, border: `1px solid ${linea}` }}>
                          <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, background: esCorrecta ? VERDE : esTuya ? ROJO : '#F3F4F6', color: esCorrecta || esTuya ? 'white' : TEXT_MUTED }}>
                            {esCorrecta ? <Check size={13} /> : esTuya ? <XIcon size={13} /> : LETRAS[i] ?? i + 1}
                          </span>
                          <span style={{ fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.45, paddingTop: 1 }}>
                            {op}
                            {esTuya && <span style={{ fontSize: 11, color: esCorrecta ? VERDE : ROJO, fontWeight: 700 }}> · tu respuesta</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {p.explicacion && (
                    <div style={{ marginTop: 10, background: '#F8F9FA', borderRadius: 11, padding: '9px 11px', fontSize: 12, color: TEXT_MUTED, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                      {p.explicacion}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function Dato({ titulo, valor, color }: { titulo: string; valor: React.ReactNode; color?: string }) {
  return (
    <div style={{ background: '#F8F9FA', borderRadius: 10, padding: '9px 4px', textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: color ?? TEXT_PRIMARY }}>{valor}</div>
      <div style={{ fontSize: 10, color: TEXT_MUTED }}>{titulo}</div>
    </div>
  );
}
