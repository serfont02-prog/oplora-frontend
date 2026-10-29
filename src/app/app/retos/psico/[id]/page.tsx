'use client';

// ⭐ Duelo psicotécnico, igual que el duelo de test y que los tests de Practicar:
// - Intro con el diseño de la app (contra quién, mensaje, modalidad, preguntas y plazo).
// - Se juega sin corrección mientras se hace: se puede cambiar de respuesta o dejarla en blanco
//   hasta pasar a la siguiente. Antes cada respuesta se fijaba al tocarla y se veía la solución.
// - Al terminar, el resultado de Practicar: acierto, cifras, el duelo y la revisión de respuestas.

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Brain, Clock, ListChecks, Shapes, RotateCcw, Ban, Loader2, Hourglass, Crown, Handshake } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DueloReto } from '@/app/app/retos/page';
import PreguntaTest from '@/components/test/PreguntaTest';
import CargandoTest from '@/components/test/CargandoTest';
import ResultadoDuelo, { RevisionDuelo } from '@/components/retos/ResultadoDuelo';
import { TEXT_PRIMARY, TEXT_SECONDARY } from '@/styles/tokens';

const BG_APP = 'var(--c-bg-retos)';
const SOMBRA = 'var(--c-sombra)';
const COLOR_PSICO = 'var(--hx-4f46e5)';
const COLOR_PSICO_BG = 'var(--hx-e0e7ff)';

function tiempoRestante(fechaFin?: string | null): string {
  if (!fechaFin) return '';
  const restante = new Date(fechaFin).getTime() - Date.now();
  if (restante <= 0) return 'Caducado';
  const horas = Math.floor(restante / 3_600_000);
  if (horas < 1) return `Quedan ${Math.max(1, Math.floor(restante / 60_000))} min`;
  if (horas < 24) return `Quedan ${horas} h`;
  return `Quedan ${Math.floor(horas / 24)} d`;
}

const nombreModalidad = (t?: string) => (t ? String(t).replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : 'Psicotécnico');

function Cabecera({ titulo, sub, onVolver }: { titulo: string; sub?: string; onVolver: () => void }) {
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

export default function RetoPsicoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { usuario, cargando } = useAuth();
  const queryClient = useQueryClient();
  const directo = useSearchParams().get('directo') === 'true';
  const volver = () => router.push('/app/retos');

  const [estado, setEstado] = useState<'intro' | 'jugando' | 'resultado'>(directo ? 'jugando' : 'intro');
  const [indice, setIndice] = useState(0);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  // Lo elegido en cada pregunta (null = en blanco) y el tiempo empleado en ella
  const respuestasRef = useRef<{ texto: string | null; tiempo: number }[]>([]);
  const inicioPregunta = useRef(0);
  // ⭐ El servidor mide el tiempo del duelo (desempate) desde aquí; solo cuenta la primera vez.
  const avisarInicio = () => { api.post(`/duelos/psico/${id}/empezar`).catch(() => {}); };
  const [tiempoInicioReto, setTiempoInicioReto] = useState(0);
  const [resultadoFinal, setResultadoFinal] = useState<any>(null);
  const yaEnviado = useRef(false);

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  useEffect(() => {
    if (directo && estado === 'jugando' && tiempoInicioReto === 0) {
      setTiempoInicioReto(Date.now());
      inicioPregunta.current = Date.now();
      avisarInicio();
    }
  }, [directo, estado, tiempoInicioReto]);

  const { data: misRetosPsico = [], isLoading } = useQuery({
    queryKey: ['mis-retos-psico'],
    queryFn: async () => (await api.get('/psicotecnicos/mis-retos')).data,
    enabled: !!usuario,
  });

  const yoId = (usuario as any)?.id;
  const reto = misRetosPsico.find((r: any) => r.id === id);
  const preguntas: any[] = reto?.preguntas ?? [];
  const miResultado = reto?.resultados?.find((r: any) => r.usuario?.id === yoId);
  const rivalResultado = reto?.resultados?.find((r: any) => r.usuario?.id !== yoId);
  const rivalUsuario = reto?.retador?.id === yoId ? reto?.retado : reto?.retador;
  const nombreRival = rivalUsuario?.nick ?? rivalUsuario?.nombre ?? 'tu rival';
  const meRetaron = !!reto?.retador && reto.retador.id !== yoId;
  const yaCompleto = !!miResultado?.completado;

  useEffect(() => {
    if (reto && yaCompleto) setEstado('resultado');
  }, [reto, yaCompleto]);

  // Un reto caducado no se puede jugar, ni siquiera entrando por una alerta con ?directo=true.
  const caducado = !!reto && !yaCompleto && (reto.estado === 'expirado' || (!!reto.fechaFin && new Date(reto.fechaFin).getTime() < Date.now()));
  useEffect(() => {
    if (caducado && estado === 'jugando') setEstado('intro');
  }, [caducado, estado]);

  const completar = useMutation({
    mutationFn: async (respuestasFinal: { preguntaId: string; respuestaTexto: string | null; tiempoRespuesta: number }[]) =>
      (await api.post(`/psicotecnicos/reto/${id}/completar`, { respuestas: respuestasFinal })).data,
    onSuccess: (data) => {
      setResultadoFinal(data);
      queryClient.invalidateQueries({ queryKey: ['mis-retos-psico'] });
      setEstado('resultado');
    },
  });

  const revancha = useMutation({
    mutationFn: async () =>
      (await api.post('/psicotecnicos/duelo', {
        retadoNickOEmail: rivalUsuario?.nick ?? rivalUsuario?.email,
        oposicionId: reto?.oposicion?.id,
        tipo: reto?.tipo,
        numPreguntas: preguntas.length,
        horasPlazo: 48,
      })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-retos-psico'] });
      router.push('/app/retos');
    },
  });

  const empezar = () => {
    respuestasRef.current = [];
    setIndice(0);
    setSeleccionada(null);
    setEstado('jugando');
    setTiempoInicioReto(Date.now());
    inicioPregunta.current = Date.now();
    avisarInicio();
  };

  // Callbacks para la pantalla de pregunta de Practicar (PreguntaTest)
  const comprobar = () => {
    if (seleccionada === null) return;
    respuestasRef.current[indice] = { texto: preguntas[indice]?.opciones?.[seleccionada] ?? null, tiempo: Date.now() - inicioPregunta.current };
  };
  const dejarEnBlanco = () => {
    respuestasRef.current[indice] = { texto: null, tiempo: Date.now() - inicioPregunta.current };
  };
  const siguiente = () => {
    if (indice + 1 >= preguntas.length) {
      if (yaEnviado.current) return;
      yaEnviado.current = true;
      const todas = preguntas.map((p: any, i: number) => ({
        preguntaId: p.id,
        respuestaTexto: respuestasRef.current[i]?.texto ?? null,
        tiempoRespuesta: respuestasRef.current[i]?.tiempo ?? 0,
      }));
      completar.mutate(todas, { onError: () => { yaEnviado.current = false; } });
      return;
    }
    setIndice((i) => i + 1);
    setSeleccionada(null);
    inicioPregunta.current = Date.now();
  };

  if (cargando || !usuario) return null;

  if (isLoading) {
    return (
      <Contenedor>
        <Cabecera titulo="Duelo psicotécnico" onVolver={volver} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '3rem 0', fontSize: 13, color: TEXT_SECONDARY }}>
          <Loader2 size={18} color={COLOR_PSICO} style={{ animation: 'oplora-girar 0.8s linear infinite' }} /> Cargando duelo…
        </div>
      </Contenedor>
    );
  }

  if (!reto) {
    return (
      <Contenedor>
        <Cabecera titulo="Duelo psicotécnico" onVolver={volver} />
        <div style={{ background: 'var(--c-superficie)', borderRadius: 24, boxShadow: SOMBRA, padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>No hemos encontrado este duelo</div>
          <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 16, lineHeight: 1.5 }}>Puede que lo hayan cancelado o que ya no esté disponible.</div>
          <button onClick={volver} style={{ width: '100%', padding: 12, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Ir a retos</button>
        </div>
      </Contenedor>
    );
  }

  // Forma "participaciones" para reutilizar el marcador de los duelos de test
  const total = preguntas.length;
  const participante = (u: any, r: any) => ({
    id: u?.id,
    usuario: u,
    completado: !!r?.completado,
    porcentaje: r?.completado && total ? Math.round(((r.aciertos ?? 0) / total) * 100) : null,
    posicion: r?.posicion ?? null,
  });
  const retoMarcador = {
    ...reto,
    creador: reto.retador,
    participaciones: [
      participante(reto.retador, reto.resultados?.find((r: any) => r.usuario?.id === reto.retador?.id)),
      participante(reto.retado, reto.resultados?.find((r: any) => r.usuario?.id === reto.retado?.id)),
    ],
  };

  /* ─────────────── INTRO ─────────────── */
  if (estado === 'intro') {
    const filas = [
      { icono: Shapes, label: 'Modalidad', valor: nombreModalidad(reto.tipo) },
      { icono: ListChecks, label: 'Preguntas', valor: String(total) },
      ...(!caducado && reto.fechaFin && !yaCompleto ? [{ icono: Clock, label: 'Plazo', valor: tiempoRestante(reto.fechaFin) }] : []),
    ];
    return (
      <Contenedor>
        <Cabecera titulo="Duelo psicotécnico" sub={`Contra ${nombreRival}`} onVolver={volver} />
        <div style={{ background: 'var(--c-superficie)', borderRadius: 24, boxShadow: SOMBRA, padding: '22px 18px 18px', textAlign: 'center', animation: 'oplora-aparecer 0.25s ease' }}>
          <span style={{ width: 60, height: 60, borderRadius: 18, background: COLOR_PSICO_BG, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Brain size={28} color={COLOR_PSICO} />
          </span>
          <div style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>
            {meRetaron ? `${reto.retador?.nick ?? reto.retador?.nombre} te ha retado` : `Has retado a ${nombreRival}`}
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
                <f.icono size={16} color={COLOR_PSICO} />
                <span style={{ flex: 1, fontSize: 13, color: TEXT_SECONDARY }}>{f.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, textAlign: 'right' }}>{f.valor}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--hx-f8fafc)', borderRadius: 16, padding: 14, marginTop: 10 }}>
            <DueloReto reto={retoMarcador} usuarioActual={usuario} tipo="psico" />
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
                <Brain size={16} /> Empezar duelo
              </button>
            )}
          </div>
        </div>
      </Contenedor>
    );
  }

  /* ─────────────── JUGANDO ─────────────── */
  if (estado === 'jugando' && total > 0) {
    if (completar.isPending) return <CargandoTest total={total} texto="Corrigiendo duelo…" subtexto="Calculando tu resultado" />;
    return (
      <>
        {completar.isError && (
          <div style={{ position: 'fixed', top: 12, left: 12, right: 12, zIndex: 30, maxWidth: 536, margin: '0 auto', background: 'var(--hx-fef2f2)', color: 'var(--hx-991b1b)', borderRadius: 12, padding: '10px 12px', fontSize: 13, boxShadow: SOMBRA }}>
            {(completar.error as any)?.response?.data?.message ?? 'No se ha podido enviar el duelo. Vuelve a pulsar «Finalizar» para reintentarlo.'}
          </div>
        )}
        <PreguntaTest
          preguntas={preguntas}
          preguntaActual={indice}
          seleccionada={seleccionada}
          setSeleccionada={setSeleccionada}
          respondida={false}
          comprobar={comprobar}
          siguiente={siguiente}
          mostrarExplicaciones={false}
          permitirBlancos
          dejarEnBlanco={dejarEnBlanco}
          titulo={`Duelo contra ${nombreRival}`}
          color={COLOR_PSICO}
          avisoSalir="Si sales ahora, podrás volver a entrar mientras no se acabe el plazo, pero el tiempo sigue contando desde que empezaste."
          onSalir={volver}
          enviando={completar.isPending}
        />
      </>
    );
  }

  /* ─────────────── RESULTADO ─────────────── */
  const mio = resultadoFinal ?? miResultado ?? {};
  const resp: any[] = mio.respuestas ?? [];
  const aciertos = mio.aciertos ?? 0;
  const blancos = mio.blancos ?? resp.filter((r) => r.enBlanco).length;
  const fallos = mio.fallos ?? Math.max(0, total - aciertos - blancos);
  const tiempoMs = mio.tiempoTotal ?? 0;
  const posicion = mio.posicion ?? miResultado?.posicion ?? null;
  const ambosCompletados = !!miResultado?.completado && !!rivalResultado?.completado;
  const empate = ambosCompletados && posicion != null && rivalResultado?.posicion === posicion;
  const gane = ambosCompletados && !empate && posicion === 1;
  const perdi = ambosCompletados && !empate && posicion != null && posicion > 1;

  const estadoDuelo = ambosCompletados
    ? (empate
      ? { texto: 'Empate', icono: Handshake, color: 'var(--hx-b45309)', fondo: 'var(--hx-fef3c7)' }
      : gane
        ? { texto: '¡Has ganado!', icono: Crown, color: 'var(--hx-15803d)', fondo: 'var(--hx-dcfce7)' }
        : { texto: `Ha ganado ${nombreRival}`, icono: Crown, color: 'var(--hx-b91c1c)', fondo: 'var(--hx-fee2e2)' })
    : { texto: `Esperando a ${nombreRival}`, icono: Hourglass, color: TEXT_SECONDARY, fondo: 'var(--hx-f1f5f9)' };

  const porPregunta = new Map(resp.map((r: any) => [r.preguntaId, r]));
  const revision: RevisionDuelo[] = resp.length
    ? preguntas.map((p: any) => {
        const r: any = porPregunta.get(p.id) ?? {};
        const opciones: string[] = p.opciones ?? [];
        const enBlanco = !!r.enBlanco;
        const idxCorrecta = typeof r.correctaTexto === 'string' ? opciones.findIndex((o) => o.trim() === r.correctaTexto.trim()) : -1;
        const idxTuya = typeof r.respuestaTexto === 'string' ? opciones.findIndex((o) => o.trim() === r.respuestaTexto.trim()) : -1;
        return {
          enunciado: p.enunciado,
          // Duelos antiguos no guardaban las respuestas: solo se ve si acertaste o no
          opciones: r.correctaTexto !== undefined ? opciones : undefined,
          indiceCorrecta: idxCorrecta >= 0 ? idxCorrecta : null,
          indiceSeleccionada: idxTuya >= 0 ? idxTuya : null,
          correcta: !!r.correcta,
          enBlanco,
          explicacion: p.explicacion ?? null,
        };
      })
    : [];

  return (
    <ResultadoDuelo
      fondo={BG_APP}
      eyebrow="Retos"
      titulo="Resultado del duelo"
      subtitulo={`Contra ${nombreRival} · ${nombreModalidad(reto.tipo)}`}
      total={total}
      correctas={aciertos}
      fallos={fallos}
      blancos={blancos}
      tiempoSegundos={tiempoMs ? Math.round(tiempoMs / 1000) : null}
      estado={estadoDuelo}
      revision={revision}
      onCerrar={volver}
      duelo={<DueloReto reto={retoMarcador} usuarioActual={usuario} tipo="psico" />}
      acciones={
        <>
          {perdi && (
            <button
              onClick={() => revancha.mutate()}
              disabled={revancha.isPending}
              style={{ width: '100%', padding: 14, background: COLOR_PSICO, color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: revancha.isPending ? 0.7 : 1 }}
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
