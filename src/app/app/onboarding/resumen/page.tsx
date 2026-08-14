'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import confetti from 'canvas-confetti';

const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

function Logo() {
  return (
    <Image src="/prueba.svg" alt="Oplora" width={200} height={68} priority style={{ marginBottom: 2 }} />
  );
}

export default function ResumenPage() {
  const router = useRouter();
  const { actualizarUsuario } = useAuth();

  const [usuario, setUsuario] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('/usuarios/me').then((res) => setUsuario(res.data));

    setTimeout(() => {
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.3 } });
    }, 200);
  }, []);

  if (!usuario) return null;

  const finalizarOnboarding = async () => {
    try {
      setGuardando(true);
      await api.post('/usuarios/onboarding-general/completado');
      actualizarUsuario({ onboardingGeneralCompletado: true });
      router.replace('/app/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setGuardando(false);
    }
  };

  const filas = [
    { label: 'Oposición', value: usuario.oposicionActiva?.nombre || 'No asignada' },
    { label: 'Turno', value: usuario.oposicionActiva?.turno === 'libre' ? 'Libre 🔥' : 'Promoción interna 📈' },
    { label: 'Subgrupo', value: usuario.oposicionActiva?.subgrupo },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '1.5rem' }}>
      <main style={{ background: 'white', borderRadius: 20, padding: '2.25rem 2rem', width: '100%', maxWidth: 420, textAlign: 'center' }}>

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Logo />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY, margin: '14px 0 4px' }}
        >
          ¡Ya tienes tu plan!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          style={{ fontSize: 13, color: TEXT_SECONDARY, margin: '0 0 20px' }}
        >
          Todo listo. Ahora toca empezar
        </motion.p>

<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.35, delay: 0.25 }}
  style={{ background: '#0f172a', borderRadius: 16, padding: '18px 18px', color: 'white', textAlign: 'left', marginBottom: 20 }}
>
  {/* Oposición — en su propia línea, título destacado */}
  <motion.div
    initial={{ opacity: 0, x: -6 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.25, delay: 0.4 }}
    style={{ paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 4 }}
  >
    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>Oposición</div>
    <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.35 }}>
      {usuario.oposicionActiva?.nombre || 'No asignada'}
    </div>
  </motion.div>

  {/* Turno y Subgrupo — en línea, etiqueta-valor */}
  {[
    { label: 'Turno', value: usuario.oposicionActiva?.turno === 'libre' ? 'Libre 🔥' : 'Promoción interna 📈' },
    { label: 'Subgrupo', value: usuario.oposicionActiva?.subgrupo },
  ].map((fila, i, arr) => (
    <motion.div
      key={fila.label}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: 0.48 + i * 0.08 }}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 12, padding: '9px 0',
        borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
      }}
    >
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{fila.label}</span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{fila.value}</span>
    </motion.div>
  ))}
</motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.65 }}
          onClick={finalizarOnboarding}
          disabled={guardando}
          style={{
            width: '100%', padding: 13, background: '#1F7CFF', color: 'white',
            borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', opacity: guardando ? 0.7 : 1,
          }}
        >
          {guardando ? 'Entrando...' : 'Empezar en OPLORA →'}
        </motion.button>
      </main>
    </div>
  );
}