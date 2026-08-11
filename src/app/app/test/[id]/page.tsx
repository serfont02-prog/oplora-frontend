'use client';

import { use, useMemo, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, ClipboardList, Database, Home, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import CargandoTest from '@/components/test/CargandoTest';
import PreguntaTest from '@/components/test/PreguntaTest';


type TestPageProps = {
  params: Promise<{ id: string }>;
};

type Pregunta = {
  id?: string;
  enunciado: string;
  opciones: string[];
  correcta: number;
  explicacion?: string;
  articulo?: string;
  temaId?: string;
  articuloId?: string;
};

export default function TestPage({ params }: TestPageProps) {
  const router = useRouter();
  const { usuario } = useAuth();
  const searchParams = useSearchParams();
  const { id: oposicionId } = use(params);
  const temasParam = searchParams.get('temas'); // "id1,id2,id3" o null
  const temasIds = temasParam ? temasParam.split(',') : [];
  const modo = searchParams.get('modo') ?? 'rapido';
  const mostrarExplicaciones = searchParams.get('explicaciones') !== 'false';
  const permitirBlancos = searchParams.get('blancos') !== 'false'; // ⭐ movido aquí arriba
  const tiempoPorPregunta = searchParams.get('tiempo');             // ⭐ movido aquí arriba
  const numPreguntas = Number(searchParams.get('n')) || Number(searchParams.get('num')) || 5;
  const nivel = modo === 'primer_reto' ? 1 : usuario?.nivel;
  const queryClient = useQueryClient();
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [respondida, setRespondida] = useState(false);
  const [respuestas, setRespuestas] = useState<{
    preguntaId?: string;
    enBlanco?: boolean;
    enunciado: string;
    correcta: boolean;
    temaId?: string;
    articuloId?: string;
    explicacion?: string;
    opciones?: string[];
    indiceCorrecta?: number;
    indiceSeleccionada?: number | null;
  }[]>([]);

  const respuestasRef = useRef(respuestas);
  const bloqueadoRef = useRef(false);
  useEffect(() => {
    respuestasRef.current = respuestas;
  }, [respuestas]);

    const [inicio] = useState(() => Date.now());
  const [guardando, setGuardando] = useState(false);

  const { data: preguntas = [], isLoading } = useQuery<Pregunta[]>({
  queryKey: ['test', oposicionId, modo, numPreguntas, nivel, temasParam],
  queryFn: async () => {
    const res = await api.post('/test/generar', {
      oposicionId,
      numPreguntas,
      modo,
      nivel,
      temasIds: temasIds.length > 0 ? temasIds : undefined,
    });
    return res.data;
  },
  enabled: !!usuario,
  });

  // ⭐ movida aquí arriba antes de cualquier return
  const { data: convocatoria } = useQuery({
    queryKey: ['convocatoria-test', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${oposicionId}`);
      const lista = res.data;
      return lista.find((c: any) => c.estado === 'activa') ?? lista[0] ?? null;
    },
    enabled: !!usuario,
  });

  const correctas = useMemo(
    () => respuestas.filter((r) => r.correcta && !r.enBlanco).length,
    [respuestas],
  );

  // ⭐ todas las funciones antes de los returns condicionales
  const pregunta = preguntas[preguntaActual];

  const comprobar = (mostrarCorreccion = true) => {
  if (bloqueadoRef.current) return;
  if (seleccionada === null || respondida) return;
  
  // ⭐ Verificar que no hay ya una respuesta para esta pregunta
  const yaRespondida = respuestasRef.current.some(
    (r) => r.preguntaId === pregunta?.id
  );
  if (yaRespondida) return;
  
  bloqueadoRef.current = true;

  setRespuestas((prev) => [
    ...prev,
    {
      preguntaId: pregunta?.id,
      enunciado: pregunta?.enunciado,
      correcta: seleccionada === pregunta?.correcta,
      temaId: pregunta?.temaId,
      articuloId: pregunta?.articuloId,
      explicacion: pregunta?.explicacion,
      opciones: pregunta?.opciones,
      indiceCorrecta: pregunta?.correcta,
      indiceSeleccionada: seleccionada,
      enBlanco: false,
    },
  ]);

  if (mostrarCorreccion) {
    setRespondida(true);
  }
};
  const dejarEnBlanco = (mostrarCorreccion = true) => {
  if (respondida) return;

  // ⭐ Verificar que no hay ya una respuesta para esta pregunta
  const yaRespondida = respuestasRef.current.some(
    (r) => r.preguntaId === pregunta?.id
  );
  if (yaRespondida) return;

  setRespuestas((prev) => [
    ...prev,
    {
      preguntaId: pregunta?.id,
      enunciado: pregunta?.enunciado,
      correcta: false,
      enBlanco: true,
      temaId: pregunta?.temaId,
      articuloId: pregunta?.articuloId,
      explicacion: pregunta?.explicacion,
      opciones: pregunta?.opciones,
      indiceCorrecta: pregunta?.correcta,
      indiceSeleccionada: null,
    },
  ]);

  if (mostrarCorreccion) {
    setRespondida(true);
  }
};

  const finalizar = async () => {
    const todasLasRespuestas = respuestasRef.current;
    setGuardando(true);
    try {
      const correctasTotal = todasLasRespuestas.filter((r) => r.correcta && !r.enBlanco).length;
      await api.post('/test/resultado', {
        oposicionId,
        totalPreguntas: preguntas.length,
        correctas: correctasTotal,
        tipoTest: modo,
        tiempoSegundos: Math.round((Date.now() - inicio) / 1000),
        detallePreguntas: todasLasRespuestas,
      });

      queryClient.invalidateQueries({ queryKey: ['limites', usuario?.id] });

      router.replace(`/app/test/${oposicionId}/resultado?modo=${modo}`); // ⭐ siempre resultado, sin condicional
    } finally {
      setGuardando(false);
    }
  };

  
 const siguiente = () => {
  if (preguntaActual + 1 >= preguntas.length) {
    finalizar();
    return;
  }
  bloqueadoRef.current = false;
  setPreguntaActual((prev) => prev + 1);
  setSeleccionada(null);
  setRespondida(false);
};

  const getColorOpcion = (idx: number) => {
    if (!respondida) {
      return seleccionada === idx
        ? { bg: '#eef2ff', border: '#111827', color: '#111827' }
        : { bg: 'white', border: '#e5e7eb', color: '#111827' };
    }
    if (idx === pregunta?.correcta) {
      return { bg: '#dcfce7', border: '#16a34a', color: '#14532d' };
    }
    if (idx === seleccionada) {
      return { bg: '#fee2e2', border: '#dc2626', color: '#7f1d1d' };
    }
    return { bg: 'white', border: '#e5e7eb', color: '#6b7280' };
  };

  // ⭐ returns condicionales AL FINAL, después de todas las funciones
  if (isLoading || !usuario) return <CargandoTest total={numPreguntas} />;

  if (preguntas.length === 0) {
    return (
      <main className="op-app-surface" style={{ minHeight: '100vh', padding: '24px 18px 96px', display: 'grid', placeItems: 'center' }}>
        <EmptyState
          icon={<Database size={28} />}
          eyebrow="Practicar"
          title="Aun no hay preguntas para entrenar"
          description="OPLORA necesita un banco de preguntas para preparar tu primer reto. Cuando esten cargadas, este entrenamiento empezara directamente."
          details={[
            <EmptyStep key="admin" icon={<ClipboardList size={20} />} text="Carga preguntas desde el panel de administracion." />,
            <EmptyStep key="temas" icon={<BookOpen size={20} />} text="Vinculalas a temas o articulos de la oposicion." />,
            <EmptyStep key="test" icon={<Sparkles size={20} />} text="Vuelve aqui y OPLORA creara el test automaticamente." />,
          ]}
          actions={
            <Button
              variant="primary"
              size="lg"
              iconBefore={<Home size={18} />}
              style={{ width: '100%' }}
              onClick={() => router.push('/app/dashboard')}
            >
              Volver al inicio
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>
      {guardando ? (
        <CargandoTest total={preguntas.length} />
      ) : (
        <PreguntaTest
          preguntas={preguntas}
          preguntaActual={preguntaActual}
          seleccionada={seleccionada}
          setSeleccionada={setSeleccionada}
          respondida={respondida}
          comprobar={comprobar}
          siguiente={siguiente}
          getColorOpcion={getColorOpcion}
          mostrarExplicaciones={mostrarExplicaciones}
          tiempoPorPregunta={tiempoPorPregunta}
          permitirBlancos={permitirBlancos}
          convocatoria={convocatoria}
          dejarEnBlanco={dejarEnBlanco}
        />
      )}
    </main>
  );
}

function EmptyStep({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: '#E6F1FB', color: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ color: '#4b5563', fontSize: 13, lineHeight: 1.45, fontWeight: 600 }}>
        {text}
      </div>
    </div>
  );
}
