'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

const BG_APP = '#FCEEE8';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';
const COLOR_FC = '#9333EA';

type EstadoFCReto = 'intro' | 'jugando' | 'resultado';

// ⭐ Mismo texto de cuenta atrás que usa la pantalla principal de retos.
function tiempoRestanteTexto(fechaFin?: string | null): string {
  if (!fechaFin) return '';
  const restante = new Date(fechaFin).getTime() - Date.now();
  if (restante <= 0) return 'Caducado';
  const horas = Math.floor(restante / (1000 * 60 * 60));
  if (horas < 1) return `${Math.floor(restante / (1000 * 60))} min restantes`;
  if (horas < 24) return `${horas}h restantes`;
  return `${Math.floor(horas / 24)}d restantes`;
}

export default function RetoFCDetallePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { usuario, cargando } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const directo = searchParams.get('directo') === 'true';

  const [estado, setEstado] = useState<EstadoFCReto>(directo ? 'jugando' : 'intro');
  const [indice, setIndice] = useState(0);
  const [tiempoInicioTarjeta, setTiempoInicioTarjeta] = useState(0);
  const [tiempoInicioReto, setTiempoInicioReto] = useState(0);
  const [respuestas, setRespuestas] = useState<{ flashcardId: string; respuesta: boolean; tiempoRespuesta: number }[]>([]);
  const [resultadoFinal, setResultadoFinal] = useState<{ aciertos: number; fallos: number; tiempoTotal: number; posicion: number | null } | null>(null);
  const yaEnviado = useRef(false);
  const [revanchaAbierta, setRevanchaAbierta] = useState(false);
  const [mensajeRevancha, setMensajeRevancha] = useState('');

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  useEffect(() => {
    if (directo && estado === 'jugando' && tiempoInicioReto === 0) {
      setTiempoInicioReto(Date.now());
      setTiempoInicioTarjeta(Date.now());
    }
  }, [directo, estado, tiempoInicioReto]);

  const { data: misRetosFC = [], isLoading } = useQuery({
    queryKey: ['mis-retos-fc'],
    queryFn: async () => {
      const res = await api.get('/flashcards/mis-retos');
      return res.data;
    },
    enabled: !!usuario,
  });

  const reto = misRetosFC.find((r: any) => r.id === id);
  const flashcards: any[] = reto?.flashcards ?? [];
  const fc = flashcards[indice];

  const miResultado = reto?.resultados?.find((r: any) => r.usuario?.id === (usuario as any)?.id);
  const rivalResultado = reto?.resultados?.find((r: any) => r.usuario?.id !== (usuario as any)?.id);
  const rivalUsuario = reto?.retador?.id === (usuario as any)?.id ? reto?.retado : reto?.retador;
  const yaCompleto = !!miResultado?.completado;

  useEffect(() => {
    if (reto && yaCompleto && estado !== 'resultado') {
      setEstado('resultado');
    }
  }, [reto, yaCompleto, estado]);

  // ⭐ Un reto caducado no se puede jugar, ni siquiera entrando por una alerta con ?directo=true.
  const caducadoSinJugar = !!reto && !yaCompleto && (reto.estado === 'expirado' || (!!reto.fechaFin && new Date(reto.fechaFin).getTime() < Date.now()));
  useEffect(() => {
    if (caducadoSinJugar && estado === 'jugando') setEstado('intro');
  }, [caducadoSinJugar, estado]);

  const completar = useMutation({
    mutationFn: async (respuestasFinal: typeof respuestas) => {
      const res = await api.post(`/flashcards/reto/${id}/completar`, { respuestas: respuestasFinal });
      return res.data;
    },
    onSuccess: (data) => {
      setResultadoFinal({
        aciertos: data.aciertos,
        fallos: data.fallos,
        tiempoTotal: data.tiempoTotal,
        posicion: data.posicion ?? null,
      });
      queryClient.invalidateQueries({ queryKey: ['mis-retos-fc'] });
      queryClient.invalidateQueries({ queryKey: ['pendientes-fc'] });
      queryClient.invalidateQueries({ queryKey: ['stats-fc'] });
      setEstado('resultado');
    },
  });

  // ⭐ Revancha igual que en test: nuevo duelo contra el mismo rival (con mensaje opcional).
  const enviarRevancha = useMutation({
    mutationFn: async () => {
      const res = await api.post('/flashcards/duelo', {
      retadoNickOEmail: rivalUsuario?.nick ?? rivalUsuario?.email,
      oposicionId: reto?.oposicion?.id,
      numFC: flashcards.length,
      temaId: reto?.tema?.id,
      mensaje: mensajeRevancha || undefined,
      horasPlazo: 48,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-retos-fc'] });
      router.push('/app/retos');
    },
  });

  const empezar = () => {
    setEstado('jugando');
    setTiempoInicioReto(Date.now());
    setTiempoInicioTarjeta(Date.now());
  };

  // ⭐ Corrección en servidor (como test): se envía lo contestado y se pasa a la siguiente
  // tarjeta directamente, sin autoevaluación ni pantalla intermedia.
  const responder = (respuesta: boolean) => {
    if (completar.isPending || yaEnviado.current) return;
    const tiempoRespuesta = Date.now() - tiempoInicioTarjeta;
    const nuevas = [...respuestas, { flashcardId: fc.id, respuesta, tiempoRespuesta }];
    setRespuestas(nuevas);

    if (indice + 1 >= flashcards.length) {
      yaEnviado.current = true;
      completar.mutate(nuevas);
    } else {
      setIndice((i) => i + 1);
      setTiempoInicioTarjeta(Date.now());
    }
  };

  const TIPO_LABEL: Record<string, string> = {
    vf: 'Verdadero / Falso',
    hueco: 'Completa el hueco',
    trampa: 'Detecta la trampa',
    articulo: '¿Qué artículo es?',
  };

  if (cargando || isLoading) return null;

  if (!reto) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG_APP, padding: '1.5rem' }}>
        <div style={{ textAlign: 'center', background: 'white', borderRadius: 20, padding: '2.5rem 2rem', maxWidth: 360, width: '100%' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🃏</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>Reto no encontrado</div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 20 }}>
            Este duelo de flashcards no existe o ya no está disponible
          </div>
          <button
            onClick={() => router.push('/app/retos')}
            style={{ width: '100%', padding: 13, background: '#111827', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Volver a retos
          </button>
        </div>
      </div>
    );
  }

  const aciertos = resultadoFinal?.aciertos ?? miResultado?.aciertos ?? 0;
  const fallos = resultadoFinal?.fallos ?? miResultado?.fallos ?? 0;
  const tiempoTotalMs = resultadoFinal?.tiempoTotal ?? miResultado?.tiempoTotal ?? 0;
  const posicion = resultadoFinal?.posicion ?? miResultado?.posicion ?? null;
  const ambosCompletados = !!miResultado?.completado && !!rivalResultado?.completado;
  // ⭐ Empate: ambos completaron y comparten posición (mismos aciertos y mismo tiempo).
  const empate = ambosCompletados && posicion != null && rivalResultado?.posicion === posicion;
  const gane = ambosCompletados && !empate && posicion === 1;
  const perdi = ambosCompletados && !empate && posicion != null && posicion > 1;
  const caducado = !yaCompleto && (reto.estado === 'expirado' || (!!reto.fechaFin && new Date(reto.fechaFin).getTime() < Date.now()));

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 40 }}>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem 1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => router.push('/app/retos')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: TEXT_SECONDARY, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          Retos
        </button>
        {estado === 'jugando' && (
          <span style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 600 }}>{indice + 1} / {flashcards.length}</span>
        )}
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem' }}>

        {/* INTRO */}
        {estado === 'intro' && (
          <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🃏</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 4 }}>Duelo de flashcards</div>
            {reto.tema && (
              <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>Tema: {reto.tema.titulo}</div>
            )}
            <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: '0.75rem' }}>
              {flashcards.length} flashcards · vs {rivalUsuario?.nick ?? rivalUsuario?.nombre ?? 'Rival'}
            </div>
            {reto.mensaje && (
              <div style={{ background: '#F8F9FA', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: TEXT_SECONDARY, fontStyle: 'italic', marginBottom: '0.75rem' }}>
                “{reto.mensaje}” — {reto.retador?.nick ?? reto.retador?.nombre}
              </div>
            )}
            {!ambosCompletados && reto.fechaFin && (
              <div style={{ fontSize: 12, fontWeight: 600, color: caducado ? '#DC2626' : TEXT_SECONDARY, marginBottom: '1.25rem' }}>
                ⏱️ {tiempoRestanteTexto(reto.fechaFin)}
              </div>
            )}

            {yaCompleto ? (
              <div>
                <div style={{ fontSize: 13, color: '#15803d', fontWeight: 600, marginBottom: 8 }}>
                  ✓ Ya completaste este duelo — {aciertos} aciertos
                </div>
                <button
                  onClick={() => setEstado('resultado')}
                  style={{ width: '100%', padding: 12, background: '#111827', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Ver resultado
                </button>
              </div>
            ) : caducado ? (
              <div style={{ fontSize: 13, color: '#DC2626', fontWeight: 600 }}>
                Este reto caducó, ya no se puede completar
              </div>
            ) : (
              <button
                onClick={empezar}
                style={{ width: '100%', padding: 13, background: COLOR_FC, color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                ▶ Empezar duelo
              </button>
            )}
          </div>
        )}

        {/* JUGANDO */}
        {estado === 'jugando' && fc && (
          <div>
            <div style={{ height: 4, background: '#EEDCF0', borderRadius: 2, overflow: 'hidden', marginBottom: 18 }}>
              <div style={{
                width: `${((indice + 1) / flashcards.length) * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${COLOR_FC}, #C084FC)`,
                borderRadius: 2,
                transition: 'width 0.3s',
              }} />
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#F3E8FF', color: COLOR_FC, fontWeight: 500 }}>
                {TIPO_LABEL[fc.tipo] ?? fc.tipo}
              </span>
            </div>

            <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 18, padding: '1.5rem', marginBottom: 16, minHeight: 180 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Pregunta
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.7 }}>
                {fc.pregunta}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => responder(true)}
                disabled={completar.isPending}
                style={{ flex: 1, padding: 14, background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 14, fontSize: 15, fontWeight: 700, color: '#15803d', cursor: completar.isPending ? 'not-allowed' : 'pointer', opacity: completar.isPending ? 0.6 : 1 }}
              >
                ✅ Verdadero
              </button>
              <button
                onClick={() => responder(false)}
                disabled={completar.isPending}
                style={{ flex: 1, padding: 14, background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: 14, fontSize: 15, fontWeight: 700, color: '#dc2626', cursor: completar.isPending ? 'not-allowed' : 'pointer', opacity: completar.isPending ? 0.6 : 1 }}
              >
                ❌ Falso
              </button>
            </div>
          </div>
        )}

        {/* RESULTADO */}
        {estado === 'resultado' && (
          <div>
            <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                🃏 Resultado del duelo
              </div>
              <div style={{ fontSize: 44, fontWeight: 800, color: TEXT_PRIMARY }}>
                {aciertos}/{flashcards.length}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#15803d' }}>✔️ {aciertos} aciertos</span>
              <span style={{ fontSize: 13, color: '#dc2626' }}>❌ {fallos} fallos</span>
              <span style={{ fontSize: 13, color: TEXT_MUTED }}>
                ⏱️ {Math.round((tiempoTotalMs || (Date.now() - tiempoInicioReto)) / 1000)}s
              </span>
            </div>

            {/* Duelo vs rival */}
            <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 14, padding: 16, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }}>Tú</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: gane ? COLOR_FC : TEXT_PRIMARY }}>{aciertos}</div>
                </div>
                <div style={{ fontSize: 13, color: TEXT_MUTED, fontWeight: 700 }}>VS</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }}>
                    {rivalUsuario?.nick ?? rivalUsuario?.nombre ?? 'Rival'}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: TEXT_PRIMARY }}>
                    {rivalResultado?.completado ? rivalResultado.aciertos : <span style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500 }}>Pendiente</span>}
                  </div>
                </div>
              </div>
              {!ambosCompletados && (
                <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: TEXT_MUTED }}>
                  Esperando a que tu rival complete el duelo
                </div>
              )}
              {ambosCompletados && posicion && (
                <div style={{ marginTop: 10, textAlign: 'center', fontSize: 13, fontWeight: 700, color: empate ? '#B45309' : gane ? '#15803d' : '#dc2626' }}>
                  {empate ? '🤝 ¡Empate!' : gane ? '🏆 ¡Has ganado el duelo!' : 'Has perdido este duelo'}
                </div>
              )}
            </div>

            {perdi && (
              <div style={{ marginBottom: 10 }}>
                {!revanchaAbierta ? (
                  <button
                    onClick={() => setRevanchaAbierta(true)}
                    style={{ width: '100%', padding: 12, background: 'white', color: TEXT_PRIMARY, border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    ⚔️ Pedir revancha
                  </button>
                ) : (
                  <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 14, padding: 12 }}>
                    <textarea
                      value={mensajeRevancha}
                      onChange={(e) => setMensajeRevancha(e.target.value)}
                      placeholder="Escribe un mensaje para la revancha..."
                      maxLength={140}
                      style={{ width: '100%', minHeight: 56, padding: '10px 12px', fontSize: 13, border: '1px solid #F1F5F9', borderRadius: 10, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', marginBottom: 8 }}
                    />
                    {enviarRevancha.isError && (
                      <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>
                        {(enviarRevancha.error as any)?.response?.data?.message ?? 'No se pudo enviar la revancha'}
                      </div>
                    )}
                    <button
                      onClick={() => enviarRevancha.mutate()}
                      disabled={enviarRevancha.isPending}
                      style={{ width: '100%', padding: 12, background: '#111827', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: enviarRevancha.isPending ? 'not-allowed' : 'pointer', opacity: enviarRevancha.isPending ? 0.6 : 1 }}
                    >
                      {enviarRevancha.isPending ? 'Enviando...' : 'Enviar revancha'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => router.push('/app/retos')}
              style={{ width: '100%', padding: 13, background: '#111827', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              Volver a retos
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
