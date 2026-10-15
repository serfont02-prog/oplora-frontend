'use client';

// ⭐ Simulacro oficial: examen real de una convocatoria anterior. La pantalla del examen es
// compartida con el simulacro OPLORA (components/entrenamiento/ExamenSimulacro).

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import ExamenSimulacro, { SimulacroNoDisponible, CargandoSimulacro } from '@/components/entrenamiento/ExamenSimulacro';

export default function SimulacroOficialExamenPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const examenId = params.examenId as string;

  const { data, isLoading, error } = useQuery({
    retry: false,
    queryKey: ['simulacro-preguntas', examenId],
    queryFn: async () => (await api.get(`/temas/examenes/${examenId}/preguntas`)).data,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <CargandoSimulacro />;
  if (!data) {
    return (
      <SimulacroNoDisponible
        error={error}
        onVolver={() => router.push('/app/entrenamiento/simulacro/oficial')}
        onPlanes={() => router.push('/app/suscripciones')}
      />
    );
  }

  const ejercicio = data.convocatoria?.ejercicios?.find((e: any) => e.numero === data.examen?.parte);

  return (
    <ExamenSimulacro
      eyebrow="Simulacro oficial"
      titulo={data.examen.nombre}
      subtitulo={`Convocatoria ${data.examen.anyo} · Ejercicio ${data.examen.parte}`}
      preguntas={data.preguntas ?? []}
      tiempoMinutos={ejercicio?.tiempoMinutos ?? null}
      fraccionPenalizacion={data.convocatoria?.fraccionPenalizacion}
      notaMinima={data.convocatoria?.notaMinimaAprobado}
      aviso="Es el examen tal como salió ese día. Se corrige igual que el oficial, con su penalización. Cuando empieces, el tiempo corre sin pausa; si se acaba, el examen se entrega solo."
      onVolver={() => router.push('/app/entrenamiento/simulacro/oficial')}
      onCorregir={async (respuestas) => {
        const r = (await api.post(`/temas/examenes/${examenId}/corregir`, { respuestas })).data;
        queryClient.invalidateQueries({ queryKey: ['progreso-periodo'] });
        return r;
      }}
      onSalirFinal={() => router.push('/app/entrenamiento')}
      onOtro={() => router.push('/app/entrenamiento/simulacro/oficial')}
      textoOtro="Elegir otro examen"
    />
  );
}
