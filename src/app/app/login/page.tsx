'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

function Logo() {
  return (
    <Image
      src="/prueba.svg"
      alt="Oplora"
      width={200}
      height={68}
      priority
      style={{ marginBottom: 2 }}
    />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [mostrarPassword, setMostrarPassword] = useState(false);
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
        background: '#0f172a',
        padding: '1.5rem',
      }}
    >
      <main
        style={{
          background: 'white',
          borderRadius: 20,
          padding: '2.25rem 2rem',
          width: '100%',
          maxWidth: 400,
        }}
      >
        <header style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
          <Logo />
          <h1 style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, margin: '10px 0 4px' }}>
            Accede a tu cuenta
          </h1>
          <p style={{ fontSize: 13, color: TEXT_MUTED, margin: 0 }}>
            Bienvenido de nuevo
          </p>
        </header>

        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
          />

          <div style={{ position: 'relative' }}>
            <input
              type={mostrarPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{ ...inputStyle, paddingRight: 42, width: '100%', boxSizing: 'border-box' }}
            />
            <button
              type="button"
              onClick={() => setMostrarPassword(!mostrarPassword)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MUTED, padding: 0, display: 'flex' }}
            >
              {mostrarPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          {error && <div style={{ color: '#dc2626', fontSize: 12, background: '#fef2f2', borderRadius: 10, padding: '8px 12px' }}>{error}</div>}

          <div style={{ position: 'relative' }}>
            
          </div>

         <div
          onClick={() => { console.log('Click en olvidé contraseña'); window.location.href = '/app/recuperar-password'; }}
          style={{ fontSize: 12, color: '#1F7CFF', cursor: 'pointer', fontWeight: 500, textAlign: 'right' }}
        >
          ¿Has olvidado tu Contraseña?
        </div>

          {error && <div style={{ color: '#dc2626', fontSize: 12, background: '#fef2f2', borderRadius: 10, padding: '8px 12px' }}>{error}</div>}
          
          <button type="submit" disabled={cargando} style={primaryButton(cargando)}>
            {cargando ? 'Accediendo...' : 'Acceder'}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: TEXT_SECONDARY }}>
          ¿No tienes cuenta?{' '}
          <Link href="/app/registro" style={{ color: '#1F7CFF', fontWeight: 600, textDecoration: 'none' }}>
            Regístrate
          </Link>
        </div>
      </main>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #E5E7EB',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const primaryButton = (cargando: boolean): React.CSSProperties => ({
  padding: 13,
  background: cargando ? '#9ca3af' : '#111827',
  color: 'white',
  border: 'none',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 700,
  cursor: cargando ? 'not-allowed' : 'pointer',
  marginTop: 4,
});