'use client';

// ⭐ Duelo de test (pantalla a la que lleva la alerta "X te reta"): mismo diseño que el resto de la app.
// - Iconos lucide en vez de emojis; tarjetas blancas con sombra; botón de volver redondo.
// - La intro dice contra quién juegas, el mensaje del retador, de qué va y el tiempo que queda.
// - El tiempo del resultado sale de lo guardado (antes, al volver a entrar, mostraba un número enorme).
// - Revancha con aviso de error en pantalla (antes usaba un alert del navegador).
// - Se juega como un test de Practicar: sin corrección mientras se hace, se puede cambiar de respuesta
//   o dejarla en blanco hasta pasar a la siguiente, y al final el resultado de Practicar con la revisión.

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Swords, Clock, ListChecks, BookOpen, RotateCcw, Ban, Loader2, Hourglass, Crown, Handshake,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DueloReto } from '@/app/app/retos/page';
import PreguntaTest from '@/components/test/PreguntaTest';
import CargandoTest from '@/components/test/CargandoTest';
import ResultadoDuelo, { RevisionDuelo } from '@/components/retos/ResultadoDuelo';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, COLOR_RETOS, COLOR_RETOS_BG } from '@/styles/tokens';

const BG_APP = 'var(--c-bg-retos)';
const SOMBRA = 'var(--c-sombra)';


function tiempoRestante(fechaFin?: string | null): string {
  if (!fechaFin) return '';
  const restante = new Date(fechaFin).getTime() - Date.now();
  if (restante <= 0) return 'Caducado';
  const horas = Math.floor(restante / 3_600_000);
  if (horas < 1) return `Quedan ${Math.max(1, Math.floor(restante / 60_000))} min`;
  if (horas < 24) return `Quedan ${horas} h`;
  return `Quedan ${Math.floor(horas / 24)} d`;
}


function Cabecera({ titulo, sub, derecha, onVolver }: { titulo: string; sub?: string; derecha?: React.ReactNode; onVolver: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <button
        onClick={onVolver}
        aria-label="Volver a retos"
        style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
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
  // ⭐ Como en Practicar: se puede cambiar de respuesta o dejarla en blanco hasta pasar a la siguiente.
  // Aquí se guarda lo elegido en cada pregunta (null = en blanco) y se envía todo al terminar.
  const respuestasRef = useRef<(number | null)[]>([]);
  const [tiempoInicio, setTiempoInicio] = useState(0);
  const [resultadoFinal, setResultadoFinal] = useState<any>(null);
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

  // Convocatoria: para indicar si dejar en blanco resta (igual que en Practicar)
  const { data: convocatoria } = useQuery({
    queryKey: ['convocatoria-test', reto?.oposicion?.id],
    queryFn: async () => {
      const lista = (await api.get(`/convocatorias/oposicion/${reto.oposicion.id}`)).data;
      return lista.find((c: any) => c.estado === 'activa') ?? lista[0] ?? null;
    },
    enabled: !!reto?.oposicion?.id,
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
    mutationFn: async (respuestasFinal: (number | null)[]) => {
      const tiempoTotal = Math.round((Date.now() - tiempoInicio) / 1000);
      setTiempoFinal(tiempoTotal);
      const res = await api.post(`/retos/${id}/completar`, {
        respuestas: respuestasFinal,
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

  const ambosCompletados = !!(miParticipacion?.completado && rivalParticipacion?.completado);
  const empate = ambosCompletados && miParticipacion.posicion === rivalParticipacion.posicion;
  const yoGane = ambosCompletados && !empate && miParticipacion.posicion === 1;

  // Callbacks para la pantalla de pregunta de Practicar (PreguntaTest)
  const comprobar = () => {
    if (seleccionada === null) return;
    respuestasRef.current[preguntaActual] = seleccionada;
  };
  const dejarEnBlanco = () => {
    respuestasRef.current[preguntaActual] = null;
  };
  const siguiente = () => {
    if (preguntaActual + 1 >= preguntas.length) {
      if (yaEnviado.current) return;
      yaEnviado.current = true;
      const todas = preguntas.map((_, i) => respuestasRef.current[i] ?? null);
      completar.mutate(todas, { onError: () => { yaEnviado.current = false; } });
      return;
    }
    setPreguntaActual((p) => p + 1);
    setSeleccionada(null);
  };

  const empezar = () => {
    respuestasRef.current = [];
    setPreguntaActual(0);
    setSeleccionada(null);
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
        <div style={{ background: 'var(--c-superficie)', borderRadius: 24, boxShadow: SOMBRA, padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>No hemos encontrado este duelo</div>
          <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 16, lineHeight: 1.5 }}>Puede que lo hayan cancelado o que el enlace no sea correcto.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => refetch()} style={{ flex: 1, padding: 12, background: 'var(--hx-f1f5f9)', color: TEXT_SECONDARY, border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Reintentar</button>
            <button onClick={volver} style={{ flex: 1, padding: 12, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Ir a retos</button>
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

        <div style={{ background: 'var(--c-superficie)', borderRadius: 24, boxShadow: SOMBRA, padding: '22px 18px 18px', textAlign: 'center', animation: 'oplora-aparecer 0.25s ease' }}>
          <span style={{ width: 60, height: 60, borderRadius: 18, background: COLOR_RETOS_BG, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Swords size={28} color={COLOR_RETOS} />
          </span>
          <div style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>
            {meRetaron ? `${reto.creador.nick ?? reto.creador.nombre} te ha retado` : `Has retado a ${nombreRival}`}
          </div>
          <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4 }}>Gana quien acierte más. Si empatáis, el más rápido.</div>

          {meRetaron && reto.mensaje && (
            <div style={{ background: 'var(--hx-f8fafc)', borderRadius: 14, padding: '10px 14px', fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.5, marginTop: 14, textAlign: 'left' }}>
              “{reto.mensaje}”
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14, textAlign: 'left' }}>
            {filas.map((f, i) => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 2px', borderTop: i ? '1px solid var(--hx-eef0f3)' : 'none' }}>
                <f.icono size={16} color={COLOR_RETOS} />
                <span style={{ flex: 1, fontSize: 13, color: TEXT_SECONDARY }}>{f.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, textAlign: 'right', maxWidth: '60%' }}>{f.valor}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--hx-f8fafc)', borderRadius: 16, padding: 14, marginTop: 10 }}>
            <DueloReto reto={reto} usuarioActual={usuario} />
          </div>

          <div style={{ marginTop: 16 }}>
            {caducado ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, color: 'var(--hx-b91c1c)', fontWeight: 600 }}>
                <Ban size={15} /> Este duelo caducó, ya no se puede jugar
              </div>
            ) : (
              <button
                onClick={empezar}
                style={{ width: '100%', padding: 14, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
              >
                <Swords size={16} /> Empezar duelo
              </button>
            )}
          </div>
        </div>
      </Contenedor>
    );
  }

  /* ─────────────── JUGANDO (igual que un test de Practicar, sin corrección hasta el final) ─────────────── */
  if (estado === 'jugando' && preguntas.length > 0) {
    if (completar.isPending) return <CargandoTest total={preguntas.length} texto="Corrigiendo duelo…" subtexto="Calculando tu resultado" />;
    return (
      <>
        {completar.isError && (
          <div style={{ position: 'fixed', top: 12, left: 12, right: 12, zIndex: 30, maxWidth: 536, margin: '0 auto', background: 'var(--hx-fef2f2)', color: 'var(--hx-991b1b)', borderRadius: 12, padding: '10px 12px', fontSize: 13, boxShadow: SOMBRA }}>
            {(completar.error as any)?.response?.data?.message ?? 'No se ha podido enviar el duelo. Vuelve a pulsar «Finalizar» para reintentarlo.'}
          </div>
        )}
        <PreguntaTest
          preguntas={preguntas}
          preguntaActual={preguntaActual}
          seleccionada={seleccionada}
          setSeleccionada={setSeleccionada}
          respondida={false}
          comprobar={comprobar}
          siguiente={siguiente}
          mostrarExplicaciones={false}
          permitirBlancos
          dejarEnBlanco={dejarEnBlanco}
          convocatoria={convocatoria}
          titulo={`Duelo contra ${nombreRival}`}
          color={COLOR_RETOS}
          avisoSalir="Si sales ahora, podrás volver a empezar el duelo mientras no se acabe el plazo."
          onSalir={volver}
          enviando={completar.isPending}
        />
      </>
    );
  }

  /* ─────────────── RESULTADO (mismo diseño que el resultado de Practicar) ─────────────── */
  const resp: any[] = resultadoFinal?.respuestas ?? miParticipacion?.respuestas ?? [];
  const total = preguntas.length;
  const porcentaje = resultadoFinal?.porcentaje ?? miParticipacion?.porcentaje ?? 0;
  const correctas = resp.length ? resp.filter((r) => r.correcta).length : Math.round((porcentaje / 100) * total);
  const blancos = resultadoFinal?.blancos ?? miParticipacion?.blancos
    ?? resp.filter((r) => r.enBlanco || r.seleccionada === null || r.seleccionada === undefined).length;
  const fallos = Math.max(0, total - correctas - blancos);
  const segundos = tiempoFinal ?? miParticipacion?.tiempoSegundos ?? null;
  const miNota: number | null = resultadoFinal?.puntuacion ?? miParticipacion?.puntuacion ?? null;
  const notaRival: number | null = rivalParticipacion?.puntuacion ?? (rivalParticipacion?.completado && rivalParticipacion?.porcentaje != null ? rivalParticipacion.porcentaje / 10 : null);
  const fmt = (n: number) => n.toLocaleString('es-ES', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

  const estadoDuelo = ambosCompletados
    ? (empate
      ? { texto: 'Empate', icono: Handshake, color: 'var(--hx-b45309)', fondo: 'var(--hx-fef3c7)' }
      : yoGane
        ? { texto: '¡Has ganado!', icono: Crown, color: 'var(--hx-15803d)', fondo: 'var(--hx-dcfce7)' }
        : { texto: `Ha ganado ${nombreRival}`, icono: Crown, color: 'var(--hx-b91c1c)', fondo: 'var(--hx-fee2e2)' })
    : { texto: `Esperando a ${nombreRival}`, icono: Hourglass, color: TEXT_SECONDARY, fondo: 'var(--hx-f1f5f9)' };

  const revision: RevisionDuelo[] = resp.length
    ? preguntas.map((p: any, i: number) => {
        const r = resp[i] ?? {};
        const enBlanco = r.enBlanco ?? (r.seleccionada === null || r.seleccionada === undefined);
        return {
          enunciado: p.enunciado,
          opciones: p.opciones,
          indiceCorrecta: typeof p.correcta === 'number' ? p.correcta : null,
          indiceSeleccionada: enBlanco ? null : r.seleccionada,
          correcta: !!r.correcta,
          enBlanco,
          explicacion: p.explicacion,
        };
      })
    : [];

  return (
    <ResultadoDuelo
      fondo={BG_APP}
      eyebrow="Retos"
      titulo="Resultado del duelo"
      subtitulo={`Contra ${nombreRival} · ${ambito}`}
      total={total}
      correctas={correctas}
      fallos={fallos}
      blancos={blancos}
      tiempoSegundos={segundos}
      nota={miNota != null ? { valor: miNota, texto: 'Tu nota en el duelo (con la penalización de tu convocatoria)' } : null}
      estado={estadoDuelo}
      gamificacion={resultadoFinal?.gamificacion ?? null}
      revision={revision}
      onCerrar={volver}
      duelo={
        <>
          <DueloReto reto={reto} usuarioActual={usuario} />
          {ambosCompletados && miNota != null && notaRival != null && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--hx-eef0f3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: TEXT_SECONDARY }}>
                <span>Tu nota <strong style={{ color: TEXT_PRIMARY }}>{fmt(miNota)}</strong></span>
                <span>{nombreRival} <strong style={{ color: TEXT_PRIMARY }}>{fmt(notaRival)}</strong></span>
              </div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, textAlign: 'center', marginTop: 6 }}>Gana la mejor nota con penalización; si empatáis, el más rápido.</div>
            </div>
          )}
        </>
      }
      acciones={
        <>
          {ambosCompletados && !empate && !yoGane && reto.tipo === 'usuario' && (
            <button
              onClick={() => revancha.mutate()}
              disabled={revancha.isPending}
              style={{ width: '100%', padding: 14, background: COLOR_RETOS, color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: revancha.isPending ? 0.7 : 1 }}
            >
              <RotateCcw size={16} /> {revancha.isPending ? 'Enviando…' : 'Pedir la revancha'}
            </button>
          )}
          {revancha.isError && (
            <div style={{ fontSize: 12, color: 'var(--hx-b91c1c)', textAlign: 'center' }}>
              {(revancha.error as any)?.response?.data?.message ?? 'No se ha podido enviar la revancha.'}
            </div>
          )}
          <button
            onClick={volver}
            style={{ width: '100%', padding: 14, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Volver a retos
          </button>
        </>
      }
    />
  );
}
