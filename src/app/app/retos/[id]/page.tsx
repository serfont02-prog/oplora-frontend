'use client';

// ⭐ Duelo de test (pantalla a la que lleva la alerta "X te reta"): mismo diseño que el resto de la app.
// - Iconos lucide en vez de emojis; tarjetas blancas con sombra; botón de volver redondo.
// - La intro dice contra quién juegas, el mensaje del retador, de qué va y el tiempo que queda.
// - El tiempo del resultado sale de lo guardado (antes, al volver a entrar, mostraba un número enorme).
// - Revancha con aviso de error en pantalla (antes usaba un alert del navegador).

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Swords, Clock, ListChecks, BookOpen, CheckCircle2, XCircle, Timer, RotateCcw,
  Ban, Loader2, Hourglass, Crown, Handshake,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DueloReto } from '@/app/app/retos/page';
import { PuntosGanadosCard, GamificacionInfo } from '@/components/gamificacion/PuntosGanadosCard';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, COLOR_RETOS, COLOR_RETOS_BG } from '@/styles/tokens';

const BG_APP = '#FCEEE8';
const SOMBRA = '0 6px 18px rgba(15, 23, 42, 0.08)';
const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

const limpiarOpcion = (t: string) => String(t ?? '').replace(/^[a-fA-F]\)\s*/, '');

function tiempoRestante(fechaFin?: string | null): string {
  if (!fechaFin) return '';
  const restante = new Date(fechaFin).getTime() - Date.now();
  if (restante <= 0) return 'Caducado';
  const horas = Math.floor(restante / 3_600_000);
  if (horas < 1) return `Quedan ${Math.max(1, Math.floor(restante / 60_000))} min`;
  if (horas < 24) return `Quedan ${horas} h`;
  return `Quedan ${Math.floor(horas / 24)} d`;
}

function formatoTiempo(seg?: number | null): string {
  if (seg == null || !Number.isFinite(seg) || seg < 0) return '—';
  const m = Math.floor(seg / 60);
  const s = Math.round(seg % 60);
  return m > 0 ? `${m} min ${s.toString().padStart(2, '0')} s` : `${s} s`;
}

function Cabecera({ titulo, sub, derecha, onVolver }: { titulo: string; sub?: string; derecha?: React.ReactNode; onVolver: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <button
        onClick={onVolver}
        aria-label="Volver a retos"
        style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'white', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
      >
        <ArrowLeft size={18} color={TEXT_PRIMARY} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY }}>{titulo}</div>
        {sub && <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
      </div>
      {derecha}
    </div>
  );
}

function Contenedor({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 40 }}>
      <style>{`@keyframes oplora-girar { to { transform: rotate(360deg); } } @keyframes oplora-aparecer { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }`}</style>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem' }}>{children}</div>
    </div>
  );
}

export default function RetoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { usuario, cargando } = useAuth();
  const queryClient = useQueryClient();
  const directo = useSearchParams().get('directo') === 'true';
  const volver = () => router.push('/app/retos');

  const [estado, setEstado] = useState<'intro' | 'jugando' | 'resultado'>(directo ? 'jugando' : 'intro');
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [respuestas, setRespuestas] = useState<{ seleccionada: number }[]>([]);
  const [tiempoInicio, setTiempoInicio] = useState(0);
  const [resultadoFinal, setResultadoFinal] = useState<{
    porcentaje: number;
    respuestas: { seleccionada: number; correcta: boolean }[];
    gamificacion?: GamificacionInfo | null;
  } | null>(null);
  const [tiempoFinal, setTiempoFinal] = useState<number | null>(null);
  const yaEnviado = useRef(false);

  useEffect(() => {
    if (directo && estado === 'jugando' && tiempoInicio === 0) setTiempoInicio(Date.now());
  }, [directo, estado, tiempoInicio]);

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  const { data: reto, isLoading, isError, refetch } = useQuery({
    queryKey: ['reto', id],
    queryFn: async () => (await api.get(`/retos/${id}`)).data,
    enabled: !!usuario,
  });

  const yoId = (usuario as any)?.id;
  const miParticipacion = reto?.participaciones?.find((p: any) => p.usuario?.id === yoId);
  const rivalParticipacion = reto?.participaciones?.find((p: any) => p.usuario?.id !== yoId);
  const rival = rivalParticipacion?.usuario;
  const nombreRival = rival?.nick ?? rival?.nombre ?? 'tu rival';
  const meRetaron = !!reto?.creador && reto.creador.id !== yoId;

  useEffect(() => {
    if (reto && miParticipacion?.completado) setEstado('resultado');
  }, [reto, miParticipacion?.completado]);

  // Un reto caducado no se puede jugar (ni entrando por la alerta con ?directo=true).
  const caducado = !!reto && reto.tipo === 'usuario' && !miParticipacion?.completado
    && (reto.estado === 'expirado' || (!!reto.fechaFin && new Date(reto.fechaFin).getTime() < Date.now()));
  useEffect(() => {
    if (caducado && estado === 'jugando') setEstado('intro');
  }, [caducado, estado]);

  const completar = useMutation({
    mutationFn: async (respuestasFinal: { seleccionada: number }[]) => {
      const tiempoTotal = Math.round((Date.now() - tiempoInicio) / 1000);
      setTiempoFinal(tiempoTotal);
      const res = await api.post(`/retos/${id}/completar`, {
        respuestas: respuestasFinal.map((r) => r.seleccionada),
        tiempoSegundos: tiempoTotal,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setResultadoFinal(data);
      queryClient.invalidateQueries({ queryKey: ['mis-retos'] });
      queryClient.invalidateQueries({ queryKey: ['retos-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['reto', id] });
      setEstado('resultado');
    },
  });

  const revancha = useMutation({
    mutationFn: async () => {
      const horas = Math.round((new Date(reto.fechaFin).getTime() - new Date(reto.creadoEn).getTime()) / 3_600_000);
      await api.post('/retos/usuario', {
        retadoNickOEmail: rival?.nick ?? rival?.email,
        oposicionId: reto.oposicion?.id,
        numPreguntas: reto.preguntas?.length ?? 10,
        temaId: reto.tema?.id ?? undefined,
        horasPlazo: horas > 0 ? horas : 48,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-retos'] });
      router.push('/app/retos');
    },
  });

  const preguntas: any[] = reto?.preguntas ?? [];
  const pregunta = preguntas[preguntaActual];

  const porcentaje = resultadoFinal?.porcentaje ?? miParticipacion?.porcentaje ?? 0;
  const correctas = resultadoFinal
    ? resultadoFinal.respuestas.filter((r) => r.correcta).length
    : Math.round((porcentaje / 100) * preguntas.length);
  const segundos = tiempoFinal ?? miParticipacion?.tiempoSegundos ?? null;

  const ambosCompletados = !!(miParticipacion?.completado && rivalParticipacion?.completado);
  const empate = ambosCompletados && miParticipacion.posicion === rivalParticipacion.posicion;
  const yoGane = ambosCompletados && !empate && miParticipacion.posicion === 1;

  const responder = (idx: number) => {
    if (seleccionada !== null || yaEnviado.current) return;
    setSeleccionada(idx);
    const nuevas = [...respuestas, { seleccionada: idx }];
    setRespuestas(nuevas);
    if (preguntaActual + 1 >= preguntas.length) {
      yaEnviado.current = true;
      completar.mutate(nuevas, {
        onError: () => {
          yaEnviado.current = false;
          setRespuestas(respuestas);
          setSeleccionada(null);
        },
      });
    } else {
      setTimeout(() => {
        setPreguntaActual((p) => p + 1);
        setSeleccionada(null);
      }, 220);
    }
  };

  const empezar = () => {
    setEstado('jugando');
    setTiempoInicio(Date.now());
  };

  if (cargando || !usuario) return null;

  if (isLoading) {
    return (
      <Contenedor>
        <Cabecera titulo="Duelo de test" onVolver={volver} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '3rem 0', fontSize: 13, color: TEXT_SECONDARY }}>
          <Loader2 size={18} color={COLOR_RETOS} style={{ animation: 'oplora-girar 0.8s linear infinite' }} /> Cargando duelo…
        </div>
      </Contenedor>
    );
  }

  if (isError || !reto) {
    return (
      <Contenedor>
        <Cabecera titulo="Duelo de test" onVolver={volver} />
        <div style={{ background: 'white', borderRadius: 24, boxShadow: SOMBRA, padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>No hemos encontrado este duelo</div>
          <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 16, lineHeight: 1.5 }}>Puede que lo hayan cancelado o que el enlace no sea correcto.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => refetch()} style={{ flex: 1, padding: 12, background: '#F1F5F9', color: TEXT_SECONDARY, border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Reintentar</button>
            <button onClick={volver} style={{ flex: 1, padding: 12, background: '#0f172a', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Ir a retos</button>
          </div>
        </div>
      </Contenedor>
    );
  }

  const ambito = reto.tema ? `Tema ${reto.tema.numero}${reto.tema.titulo ? ` · ${reto.tema.titulo}` : ''}` : 'Toda la oposición';

  /* ─────────────── INTRO ─────────────── */
  if (estado === 'intro') {
    const filas = [
      { icono: BookOpen, label: 'Contenido', valor: ambito },
      { icono: ListChecks, label: 'Preguntas', valor: String(preguntas.length) },
      ...(!caducado && reto.fechaFin && !miParticipacion?.completado ? [{ icono: Clock, label: 'Plazo', valor: tiempoRestante(reto.fechaFin) }] : []),
    ];
    return (
      <Contenedor>
        <Cabecera titulo="Duelo de test" sub={`Contra ${nombreRival}`} onVolver={volver} />

        <div style={{ background: 'white', borderRadius: 24, boxShadow: SOMBRA, padding: '22px 18px 18px', textAlign: 'center', animation: 'oplora-aparecer 0.25s ease' }}>
          <span style={{ width: 60, height: 60, borderRadius: 18, background: COLOR_RETOS_BG, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Swords size={28} color={COLOR_RETOS} />
          </span>
          <div style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>
            {meRetaron ? `${reto.creador.nick ?? reto.creador.nombre} te ha retado` : `Has retado a ${nombreRival}`}
          </div>
          <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4 }}>Gana quien acierte más. Si empatáis, el más rápido.</div>

          {meRetaron && reto.mensaje && (
            <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '10px 14px', fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.5, marginTop: 14, textAlign: 'left' }}>
              “{reto.mensaje}”
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14, textAlign: 'left' }}>
            {filas.map((f, i) => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 2px', borderTop: i ? '1px solid #EEF0F3' : 'none' }}>
                <f.icono size={16} color={COLOR_RETOS} />
                <span style={{ flex: 1, fontSize: 13, color: TEXT_SECONDARY }}>{f.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, textAlign: 'right', maxWidth: '60%' }}>{f.valor}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 14, marginTop: 10 }}>
            <DueloReto reto={reto} usuarioActual={usuario} />
          </div>

          <div style={{ marginTop: 16 }}>
            {caducado ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, color: '#B91C1C', fontWeight: 600 }}>
                <Ban size={15} /> Este duelo caducó, ya no se puede jugar
              </div>
            ) : (
              <button
                onClick={empezar}
                style={{ width: '100%', padding: 14, background: '#0f172a', color: 'white', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
              >
                <Swords size={16} /> Empezar duelo
              </button>
            )}
          </div>
        </div>
      </Contenedor>
    );
  }

  /* ─────────────── JUGANDO ─────────────── */
  if (estado === 'jugando' && pregunta) {
    const progreso = (preguntaActual / Math.max(1, preguntas.length)) * 100;
    return (
      <Contenedor>
        <Cabecera
          titulo="Duelo de test"
          sub={`Contra ${nombreRival}`}
          onVolver={volver}
          derecha={
            <span style={{ fontSize: 12, fontWeight: 700, color: COLOR_RETOS, background: 'white', borderRadius: 999, padding: '6px 12px', boxShadow: SOMBRA, flexShrink: 0 }}>
              {preguntaActual + 1}/{preguntas.length}
            </span>
          }
        />

        <div style={{ height: 6, background: 'rgba(194,65,12,0.12)', borderRadius: 999, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ width: `${progreso}%`, height: '100%', background: COLOR_RETOS, borderRadius: 999, transition: 'width 0.3s' }} />
        </div>

        <div key={preguntaActual} style={{ animation: 'oplora-aparecer 0.22s ease' }}>
          <div style={{ background: 'white', borderRadius: 20, boxShadow: SOMBRA, padding: 18, marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.55 }}>{pregunta.enunciado}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pregunta.opciones?.map((opcion: string, idx: number) => {
              const elegida = seleccionada === idx;
              return (
                <button
                  key={idx}
                  onClick={() => responder(idx)}
                  disabled={seleccionada !== null || completar.isPending}
                  style={{
                    padding: '13px 14px', borderRadius: 16, textAlign: 'left', cursor: 'pointer',
                    border: `2px solid ${elegida ? COLOR_RETOS : 'transparent'}`,
                    background: elegida ? COLOR_RETOS_BG : 'white', boxShadow: SOMBRA,
                    color: TEXT_PRIMARY, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit',
                  }}
                >
                  <span style={{ width: 28, height: 28, borderRadius: 9, background: elegida ? COLOR_RETOS : '#F1F5F9', color: elegida ? 'white' : TEXT_SECONDARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {LETRAS[idx]}
                  </span>
                  <span style={{ flex: 1, lineHeight: 1.45 }}>{limpiarOpcion(opcion)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {completar.isPending && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, fontSize: 13, color: TEXT_SECONDARY }}>
            <Loader2 size={16} color={COLOR_RETOS} style={{ animation: 'oplora-girar 0.8s linear infinite' }} /> Corrigiendo…
          </div>
        )}
        {completar.isError && (
          <div style={{ fontSize: 12, color: '#B91C1C', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
            {(completar.error as any)?.response?.data?.message ?? 'No se ha podido enviar el duelo. Elige de nuevo la respuesta para reintentar.'}
          </div>
        )}
      </Contenedor>
    );
  }

  /* ─────────────── RESULTADO ─────────────── */
  const desglose = resultadoFinal?.respuestas ?? [];
  const estadoDuelo = ambosCompletados
    ? (empate
      ? { texto: 'Empate', icono: Handshake, color: '#B45309', fondo: '#FEF3C7' }
      : yoGane
        ? { texto: '¡Has ganado!', icono: Crown, color: '#15803D', fondo: '#DCFCE7' }
        : { texto: `Ha ganado ${nombreRival}`, icono: Crown, color: '#B91C1C', fondo: '#FEE2E2' })
    : { texto: `Esperando a ${nombreRival}`, icono: Hourglass, color: TEXT_SECONDARY, fondo: '#F1F5F9' };
  const IconoEstado = estadoDuelo.icono;
  const radio = 46;
  const circ = 2 * Math.PI * radio;
  const stats = [
    { icono: CheckCircle2, color: '#15803D', fondo: '#DCFCE7', valor: String(correctas), label: 'Aciertos' },
    { icono: XCircle, color: '#B91C1C', fondo: '#FEE2E2', valor: String(Math.max(0, preguntas.length - correctas)), label: 'Fallos' },
    { icono: Timer, color: '#4F46E5', fondo: '#E0E7FF', valor: formatoTiempo(segundos), label: 'Tiempo' },
  ];

  return (
    <Contenedor>
      <Cabecera titulo="Resultado del duelo" sub={`Contra ${nombreRival}`} onVolver={volver} />

      <div style={{ background: 'white', borderRadius: 24, boxShadow: SOMBRA, padding: '20px 18px', textAlign: 'center', marginBottom: 12, animation: 'oplora-aparecer 0.25s ease' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 999, background: estadoDuelo.fondo, color: estadoDuelo.color, marginBottom: 14 }}>
          <IconoEstado size={13} /> {estadoDuelo.texto}
        </span>

        <div style={{ position: 'relative', width: 116, height: 116, margin: '0 auto 14px' }}>
          <svg width="116" height="116" viewBox="0 0 116 116" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="58" cy="58" r={radio} fill="none" stroke="#F1F5F9" strokeWidth="10" />
            <circle cx="58" cy="58" r={radio} fill="none" stroke={COLOR_RETOS} strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - Math.min(100, Math.max(0, porcentaje)) / 100)} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1 }}>{Math.round(porcentaje)}%</div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 3 }}>aciertos</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {stats.map((e) => (
            <div key={e.label} style={{ background: '#F8FAFC', borderRadius: 14, padding: '10px 6px' }}>
              <span style={{ width: 28, height: 28, borderRadius: 9, background: e.fondo, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <e.icono size={15} color={e.color} />
              </span>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{e.valor}</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED }}>{e.label}</div>
            </div>
          ))}
        </div>
      </div>

      {resultadoFinal?.gamificacion && (
        <div style={{ marginBottom: 12 }}>
          <PuntosGanadosCard gamificacion={resultadoFinal.gamificacion} porcentaje={porcentaje} />
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 20, boxShadow: SOMBRA, padding: 16, marginBottom: 12 }}>
        <DueloReto reto={reto} usuarioActual={usuario} />
      </div>

      {desglose.length > 0 && (
        <div style={{ background: 'white', borderRadius: 20, boxShadow: SOMBRA, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ padding: '14px 16px 10px', fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Tus respuestas</div>
          {desglose.map((r, i) => {
            const p = preguntas[i];
            const textoCorrecta = p?.correcta !== undefined ? p?.opciones?.[p.correcta] : undefined;
            return (
              <div key={i} style={{ padding: '12px 16px', borderTop: '1px solid #EEF0F3', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {r.correcta ? <CheckCircle2 size={17} color="#15803D" style={{ flexShrink: 0, marginTop: 1 }} /> : <XCircle size={17} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.5 }}>{p?.enunciado}</div>
                  {!r.correcta && p?.opciones?.[r.seleccionada] && (
                    <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 4 }}>Tu respuesta: {limpiarOpcion(p.opciones[r.seleccionada])}</div>
                  )}
                  {!r.correcta && textoCorrecta && (
                    <div style={{ fontSize: 12, color: '#15803D', marginTop: 2 }}>Correcta: {limpiarOpcion(textoCorrecta)}</div>
                  )}
                  {p?.explicacion && (
                    <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 6, lineHeight: 1.5, background: '#F8FAFC', borderRadius: 10, padding: '8px 10px' }}>{p.explicacion}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ambosCompletados && !empate && !yoGane && reto.tipo === 'usuario' && (
          <button
            onClick={() => revancha.mutate()}
            disabled={revancha.isPending}
            style={{ width: '100%', padding: 14, background: COLOR_RETOS, color: 'white', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: revancha.isPending ? 0.7 : 1 }}
          >
            <RotateCcw size={16} /> {revancha.isPending ? 'Enviando…' : 'Pedir la revancha'}
          </button>
        )}
        {revancha.isError && (
          <div style={{ fontSize: 12, color: '#B91C1C', textAlign: 'center' }}>
            {(revancha.error as any)?.response?.data?.message ?? 'No se ha podido enviar la revancha.'}
          </div>
        )}
        <button
          onClick={volver}
          style={{ width: '100%', padding: 14, background: '#0f172a', color: 'white', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          Volver a retos
        </button>
      </div>
    </Contenedor>
  );
}
