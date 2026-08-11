'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth'; // ⭐ IMPORTANTE


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

export default function ObjetivoPage() {
  const router = useRouter();
  const { actualizarUsuario } = useAuth(); // ⭐ AHORA SÍ EXISTE

  const handleSelect = async (objetivo: string) => {

    // 👇 Nivel automático según objetivo
    let nivel = 1;

    if (objetivo === 'mejorar') {
      nivel = 2;
    }

    const res = await api.patch('/usuarios/objetivo', {
      objetivo,
      nivel,
    });

  actualizarUsuario(res.data);

  router.push('/app/onboarding/oposicion');
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
        e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = '1px solid #e5e7eb';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
      }}
    >
      <div style={{ fontSize: 26 }}>{icon}</div>

      <div>
        <div style={{ fontWeight: 600, color: '#0A2A43', marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 14, color: '#6b7280' }}>{subtitle}</div>
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
        <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <Logo />

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
                  width: '20%',
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
              Paso 1 de 5
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
            ¿Qué quieres conseguir?
          </h1>

          <p style={{ fontSize: 15, color: '#6b7280', margin: 0 }}>
            Vamos a personalizar tu camino desde el primer minuto.
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card
            icon="🎯"
            title="Aprobar mi oposición"
            subtitle="Tengo tiempo y voy a por todas"
            onClick={() => handleSelect('aprobar')}
          />

          <Card
            icon="🛡️"
            title="Conseguir un trabajo estable"
            subtitle="Estoy buscando un cambio laboral"
            onClick={() => handleSelect('trabajo')}
          />

          <Card
            icon="📈"
            title="Mejorar mis resultados"
            subtitle="Ya empecé, pero quiero más"
            onClick={() => handleSelect('mejorar')}
          />

          <Card
            icon="🌱"
            title="Empezar desde cero"
            subtitle="Necesito una guía clara"
            onClick={() => handleSelect('cero')}
          />
        </div>
      </main>
    </div>
  );
}
