'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import Image from 'next/image';

function Logo() {
  return (
    <Image
      src="/prueba.svg"
      alt="Oplora"
      width={240}
      height={80}
      priority
      style={{ marginBottom: 10 }}
    />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      setError('Rellena todos los campos');
      return;
    }

    setCargando(true);
    setError('');

    try {
      const res = await login(form.email, form.password) as any;
      const user = res.usuario;

      if (user.onboardingGeneralCompletado) {
        router.push('/app/dashboard');
      } else {
        router.push('/app/onboarding/objetivo');
      }

    } catch (e: any) {
        setError(e?.response?.data?.message ?? 'Email o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A2A43',
        padding: '2rem',
      }}
    >
      <main
        style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          padding: '2.5rem',
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        }}
      >
        <header style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <Logo />

          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: '#0A2A43',
              margin: '10px 0 6px',
            }}
          >
            Accede a tu cuenta
          </h1>

          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            Bienvenido de nuevo
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={{
              padding: 10,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
            }}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={{
              padding: 10,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
            }}
          />

          {error && (
            <div style={{ color: '#dc2626', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            style={{
              padding: 11,
              background: cargando ? '#9ca3af' : '#1F7CFF',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: cargando ? 'not-allowed' : 'pointer',
            }}
          >
            {cargando ? 'Accediendo...' : 'Acceder'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13 }}>
          ¿No tienes cuenta?{' '}
          <Link href="/app/registro" style={{ color: '#1F7CFF' }}>
            Regístrate
          </Link>
        </div>
      </main>
    </div>
  );
}
