'use client';

// ⭐ Simulacro OPLORA: examen generado con la estructura y el tiempo del ejercicio de tu
// convocatoria. Sustituye a /entrenamiento/simulacro/generado/[ejercicio] y usa la misma pantalla
// de examen que el simulacro oficial (components/entrenamiento/ExamenSimulacro).

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import ExamenSimulacro, { SimulacroNoDisponible, CargandoSimulacro } from '@/components/entrenamiento/ExamenSimulacro';

const TIPO_LABEL: Record<string, string> = { test: 'Test', desarrollo: 'Desarrollo', oral: 'Oral', practico: 'Práctico', mixto: 'Mixto' };

export default function SimulacroOploraPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  const oposicionId = usuario?.oposicionActiva?.id;
  const ejercicio = Number(params.ejercicio);

  // Generar crea una sesión en el servidor: no se vuelve a pedir sola (cambiarían las preguntas).
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['simulacro-oplora', oposicionId, ejercicio],
    queryFn: async () => (await api.get(`/temas/simulacro-oplora/${oposicionId}/${ejercicio}`)).data,
    enabled: !!oposicionId && !!ejercicio,
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  if (!usuario || isLoading || isFetching) return <CargandoSimulacro />;
  if (!data) {
    return (
      <SimulacroNoDisponible
        error={error}
        onVolver={() => router.push('/app/entrenamiento/simulacro/generado')}
        onPlanes={() => router.push('/app/suscripciones')}
      />
    );
  }

  const ej = data.ejercicio ?? {};
  const preguntas = data.preguntas ?? [];

  return (
    <ExamenSimulacro
      key={data.sesionId ?? 'sim'}
      eyebrow="Simulacro OPLORA"
      titulo={`Ejercicio ${ej.numero ?? ejercicio}${ej.tipo ? ` · ${TIPO_LABEL[ej.tipo] ?? ej.tipo}` : ''}`}
      subtitulo="Preguntas de todo el temario y la normativa"
      preguntas={preguntas}
      tiempoMinutos={ej.tiempoMinutos ?? null}
      fraccionPenalizacion={data.convocatoria?.fraccionPenalizacion}
      notaMinima={data.convocatoria?.notaMinimaAprobado}
      aviso="Examen generado con la misma estructura y el tiempo real de tu convocatoria. Se corrige con la penalización oficial. Cuando empieces, el tiempo corre sin pausa; si se acaba, el examen se entrega solo."
      onVolver={() => router.push('/app/entrenamiento/simulacro/generado')}
      onCorregir={async (respuestas) => {
        const r = (await api.post(`/temas/simulacro-oplora/${oposicionId}/corregir`, {
          preguntaIds: preguntas.map((p: any) => p.id),
          respuestas,
          sesionId: data.sesionId,
        })).data;
        queryClient.invalidateQueries({ queryKey: ['progreso-periodo'] });
        return r;
      }}
      onSalirFinal={() => router.push('/app/entrenamiento')}
      onOtro={() => { refetch(); window.scrollTo({ top: 0 }); }}
      textoOtro="Generar otro simulacro"
    />
  );
}
