'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import confetti from 'canvas-confetti';

export default function ResumenPage() {
  const router = useRouter();

  const { actualizarUsuario } = useAuth();

  const [usuario, setUsuario] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('/usuarios/me').then((res) => setUsuario(res.data));

    setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.3 },
      });
    }, 300);
  }, []);

  if (!usuario) return null;

  const finalizarOnboarding = async () => {
    try {
      setGuardando(true);

      await api.post('/usuarios/onboarding-general/completado');

      // ⭐ ACTUALIZAR CONTEXTO GLOBAL
      actualizarUsuario({
        onboardingGeneralCompletado: true,
      });

      router.replace('/app/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setGuardando(false);
    }
  };

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
      <motion.main
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'white',
          borderRadius: 20,
          border: '1px solid #e5e7eb',
          padding: '3rem 2.5rem',
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
          textAlign: 'center',
        }}
      >
        <Image
          src="/prueba.svg"
          alt="Oplora"
          width={200}
          height={70}
          priority
          style={{ marginBottom: 20 }}
        />

        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#0A2A43',
            marginBottom: 10,
          }}
        >
          ¡Ya tienes tu plan!
        </h1>

        <p
          style={{
            fontSize: 15,
            color: '#6b7280',
            marginBottom: 30,
          }}
        >
          Has completado el onboarding.
          Hoy empieza tu camino hacia el éxito.
        </p>

        <div
          style={{
            background: '#F8FAFC',
            padding: '20px',
            borderRadius: 14,
            border: '1px solid #e5e7eb',
            textAlign: 'left',
            marginBottom: 30,
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <strong>Oposición:</strong>{' '}
            {usuario.oposicionActiva?.nombre || 'No asignada'}
          </div>

          <div style={{ marginBottom: 10 }}>
            <strong>Turno:</strong>{' '}
            {usuario.oposicionActiva?.turno === 'libre'
              ? 'Libre 🔥'
              : 'Promoción interna 📈'}
          </div>

          <div style={{ marginBottom: 10 }}>
            <strong>Subgrupo:</strong>{' '}
            {usuario.oposicionActiva?.subgrupo}
          </div>

          <div style={{ marginBottom: 10 }}>
            <strong>Compromiso:</strong>{' '}
            {usuario.compromiso ? 'Activado 💪' : 'No activado'}
          </div>

          <div>
            <strong>Mini-reto:</strong> Superado ⭐
          </div>
        </div>

        <button
          onClick={finalizarOnboarding}
          disabled={guardando}
          style={{
            width: '100%',
            padding: '14px 0',
            background: '#1F7CFF',
            color: 'white',
            borderRadius: 12,
            border: 'none',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 12,
            opacity: guardando ? 0.7 : 1,
          }}
        >
          {guardando ? 'Entrando...' : 'Ir al inicio'}
        </button>
      </motion.main>
    </div>
  );
}
