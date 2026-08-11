'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

function Logo() {
  return (
    <Image
      src="/prueba.svg"
      alt="Oplora"
      width={200}
      height={70}
      priority
      style={{ marginBottom: 10 }}
    />
  );
}

export default function ExperienciaPage() {
  const router = useRouter();
  const { actualizarUsuario } = useAuth();

  const handleSelect = async (nivel: number) => {
    try {
      const res = await api.patch('/usuarios/nivel', {
        nivel,
      });

      actualizarUsuario(res.data);

      router.push('/app/onboarding/minireto');
    } catch (error) {
      console.error(error);
    }
  };

  const Card = ({
    title,
    subtitle,
    icon,
    onClick,
  }: {
    title: string;
    subtitle: string;
    icon: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '18px 20px',
        borderRadius: 14,
        border: '1px solid #e5e7eb',
        background: 'white',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = '1px solid #1F7CFF';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = '1px solid #e5e7eb';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ fontSize: 28 }}>{icon}</div>

      <div>
        <div
          style={{
            fontWeight: 600,
            color: '#0A2A43',
            marginBottom: 4,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 14,
            color: '#6b7280',
          }}
        >
          {subtitle}
        </div>
      </div>
    </button>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0A2A43 0%, #0F3A63 100%)',
        padding: '2rem',
      }}
    >
      <main
        style={{
          background: 'white',
          borderRadius: 20,
          border: '1px solid #e5e7eb',
          padding: '3rem 2.5rem',
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
        }}
      >
        <header
          style={{
            marginBottom: '2rem',
            textAlign: 'center',
          }}
        >
          <Logo />

          {/* Progress */}
          <div style={{ marginTop: 10, marginBottom: 14 }}>
            <div
              style={{
                height: 6,
                width: '100%',
                background: '#e5e7eb',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '40%',
                  height: '100%',
                  background: '#1F7CFF',
                }}
              />
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#9ca3af',
                marginTop: 6,
              }}
            >
              Paso 2 de 5
            </div>
          </div>

          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: '#0A2A43',
              margin: '10px 0 8px',
            }}
          >
            ¿Cuál es tu experiencia?
          </h1>

          <p
            style={{
              fontSize: 15,
              color: '#6b7280',
              margin: 0,
            }}
          >
            Adaptaremos Oplora a tu nivel actual.
          </p>
        </header>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <Card
            icon="🌱"
            title="Principiante"
            subtitle="Estoy empezando o llevo poco tiempo"
            onClick={() => handleSelect(1)}
          />

          <Card
            icon="📚"
            title="Intermedio"
            subtitle="Ya conozco parte del temario"
            onClick={() => handleSelect(2)}
          />

          <Card
            icon="🔥"
            title="Avanzado"
            subtitle="Ya he estudiado bastante o me he presentado"
            onClick={() => handleSelect(3)}
          />
        </div>
      </main>
    </div>
  );
}
