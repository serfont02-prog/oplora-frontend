'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Brain,
  Clock3,
  ChevronRight,
  Zap,
  BookOpen,
  Target,
  Trophy,
} from 'lucide-react';

export default function TestHubPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { usuario } = useAuth();

  const { data: oposicion } = useQuery({
    queryKey: ['oposicion-test-hub', id],
    queryFn: async () => {
      const res = await api.get(`/oposiciones/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: progreso } = useQuery({
    queryKey: ['progreso-test-hub', id],
    queryFn: async () => {
      const res = await api.get(`/test/progreso/${id}`);
      return res.data;
    },
    enabled: !!usuario,
  });

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias-test-hub', id],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const convocatoriaActiva =
    convocatorias.find((c: any) => c.estado === 'activa') ||
    convocatorias[0];

  const preguntasOficiales =
    convocatoriaActiva?.numPreguntas || 100;

  const tiempoOficial =
    convocatoriaActiva?.duracionMinutos || 50;

  const tiempoPorPregunta =
    tiempoOficial / preguntasOficiales;

  const tiempo20 = Math.round(tiempoPorPregunta * 20);

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg,#eef4ff 0%,#f8fafc 40%,#ffffff 100%)',
      }}
    >
      <div
        style={{
          maxWidth: '620px',
          margin: '0 auto',
          padding: '1.25rem',
        }}
      >

        {/* HERO */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '28px',
            padding: '28px',
            background:
              'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
            color: 'white',
            marginBottom: '18px',
            boxShadow:
              '0 20px 40px rgba(79,70,229,.25)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,.08)',
            }}
          />

          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              opacity: .85,
              marginBottom: '10px',
            }}
          >
            🔥 ENTRENAMIENTO OPLORA
          </div>

          <div
            style={{
              fontSize: '34px',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '10px',
            }}
          >
            Entrena como en el examen real
          </div>

          <div
            style={{
              fontSize: '15px',
              lineHeight: 1.6,
              opacity: .92,
              maxWidth: '440px',
            }}
          >
            {oposicion?.nombre || 'Tu oposición'} ·
            mejora velocidad, precisión y resistencia.
          </div>
        </div>

        {/* RESUMEN */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '18px',
          }}
        >
          <StatCard
            title="Tests"
            value={progreso?.totalTests || 0}
            icon={<Brain size={18} />}
          />

          <StatCard
            title="Acierto"
            value={`${progreso?.promedioAcierto || 0}%`}
            icon={<Target size={18} />}
          />
        </div>

        {/* TEST RÁPIDO */}
        <MainCard
          icon={<Zap size={24} />}
          title="Test rápido"
          description="Empieza a entrenar ahora mismo con preguntas aleatorias de tu oposición."
          gradient="linear-gradient(135deg,#2563eb 0%,#4f46e5 100%)"
          onClick={() =>
            router.push(`/app/test/${id}?modo=rapido`)
          }
        />

        {/* ENTRENAMIENTO */}
        <MainCard
          icon={<BookOpen size={24} />}
          title="Entrenamiento por tema"
          description="Practica por leyes, temas o capítulos concretos para reforzar puntos débiles."
          gradient="linear-gradient(135deg,#0891b2 0%,#06b6d4 100%)"
          onClick={() =>
            router.push(`/app/test/${id}?modo=tema`)
          }
        />

        {/* SIMULACRO */}
        <div
          style={{
            borderRadius: '28px',
            overflow: 'hidden',
            background: 'white',
            boxShadow:
              '0 10px 30px rgba(15,23,42,.06)',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              padding: '24px',
              background:
                'linear-gradient(135deg,#111827 0%,#1e293b 100%)',
              color: 'white',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '14px',
              }}
            >
              <Trophy size={22} />

              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                }}
              >
                Simulacro real
              </div>
            </div>

            <div
              style={{
                fontSize: '14px',
                lineHeight: 1.7,
                opacity: .85,
                marginBottom: '20px',
              }}
            >
              Entrena bajo presión con el mismo ritmo
              del examen oficial.
            </div>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              <Badge>
                {preguntasOficiales} preguntas
              </Badge>

              <Badge>
                {tiempoOficial} min oficiales
              </Badge>

              <Badge>
                {tiempo20} min para 20 preguntas
              </Badge>
            </div>
          </div>

          <div
            style={{
              padding: '20px',
            }}
          >
            <button
              onClick={() =>
                router.push(`/app/test/${id}?modo=simulacro`)
              }
              style={{
                width: '100%',
                height: '58px',
                borderRadius: '18px',
                border: 'none',
                background: '#111827',
                color: 'white',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Comenzar simulacro
            </button>
          </div>
        </div>

        {/* FOOTER INFO */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'center',
            color: '#94a3b8',
            fontSize: '12px',
            padding: '8px 0 24px',
          }}
        >
          <Clock3 size={14} />
          Tu progreso mejora con entrenamiento diario
        </div>
      </div>
    </div>
  );
}

function MainCard({
  icon,
  title,
  description,
  gradient,
  onClick,
}: any) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        border: 'none',
        cursor: 'pointer',
        borderRadius: '28px',
        overflow: 'hidden',
        marginBottom: '16px',
        background: gradient,
        color: 'white',
        padding: '24px',
        textAlign: 'left',
        boxShadow:
          '0 10px 30px rgba(15,23,42,.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '18px',
              background: 'rgba(255,255,255,.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
            }}
          >
            {icon}
          </div>

          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: '14px',
              lineHeight: 1.7,
              opacity: .92,
              maxWidth: '420px',
            }}
          >
            {description}
          </div>
        </div>

        <ChevronRight size={22} />
      </div>
    </button>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,.72)',
        backdropFilter: 'blur(12px)',
        borderRadius: '22px',
        padding: '18px',
        border: '1px solid rgba(255,255,255,.5)',
        boxShadow:
          '0 10px 30px rgba(15,23,42,.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            color: '#64748b',
            fontWeight: 600,
          }}
        >
          {title}
        </div>

        <div style={{ color: '#4f46e5' }}>
          {icon}
        </div>
      </div>

      <div
        style={{
          fontSize: '28px',
          fontWeight: 800,
          color: '#0f172a',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Badge({ children }: any) {
  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: '999px',
        background: 'rgba(255,255,255,.1)',
        border: '1px solid rgba(255,255,255,.12)',
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

