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
    <Image src="/prueba.svg" alt="Oplora" width={200} height={68} priority style={{ marginBottom: 2 }} />
  );
}

export default function RegistroPage() {
  const router = useRouter();
  const { registro } = useAuth();

  const [paso, setPaso] = useState(1);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarPasswordConfirm, setMostrarPasswordConfirm] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    apellidos: '',
    nick: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const validarPaso1 = () => {
  if (!form.nombre.trim()) return 'El nombre es obligatorio';
  if (!form.nick.trim()) return 'El nick es obligatorio';
  if (form.nick.length < 3) return 'El nick debe tener al menos 3 caracteres';
  if (!/^[a-zA-Z0-9_]+$/.test(form.nick)) return 'El nick solo puede tener letras, números y _';
  return null;
};

  const validarPaso2 = () => {
    if (!form.email.includes('@')) return 'Email no válido';
    if (form.password.length < 6) return 'Mínimo 6 caracteres';
    if (form.password !== form.passwordConfirm) return 'Las contraseñas no coinciden';
    return null;
  };

  const handleSiguiente = () => {
    const err = validarPaso1();
    if (err) return setError(err);
    setError('');
    setPaso(2);
  };

  const handleSubmit = async () => {
    const err = validarPaso2();
    if (err) return setError(err);

    setCargando(true);
    setError('');

    try {
      await registro({
        nombre: form.nombre,
        apellidos: form.apellidos || undefined,
        nick: form.nick,
        email: form.email,
        password: form.password,
      });

      router.push('/app/onboarding/objetivo');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al crear la cuenta');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '1.5rem' }}>
      <main style={{ background: 'white', borderRadius: 20, padding: '2.25rem 2rem', width: '100%', maxWidth: 400 }}>

        <header style={{ textAlign: 'center', marginBottom: 20 }}>
          <Logo />
          <h1 style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, marginTop: 10 }}>
            {paso === 1 ? '¿Cómo quieres que te llamemos?' : 'Protege tu cuenta'}
          </h1>
          <p style={{ fontSize: 12, color: TEXT_MUTED, margin: '2px 0 0' }}>
            Paso {paso} de 2
          </p>
        </header>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {[1, 2].map((p) => (
            <div key={p} style={{ flex: 1, height: 4, borderRadius: 999, background: p <= paso ? '#1F7CFF' : '#E5E7EB', transition: 'background 0.3s' }} />
          ))}
        </div>

        {paso === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              placeholder="Nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              maxLength={30}
              style={inputStyle}
            />
            <input
              placeholder="Apellidos"
              value={form.apellidos}
              onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
              maxLength={30}
              style={inputStyle}
            />
            <input
              placeholder="Nick (3-10 caracteres)"
              value={form.nick}
              onChange={(e) => setForm({ ...form, nick: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
              maxLength={10}
              style={inputStyle}
            />

            {error && <div style={errorBoxStyle}>{error}</div>}

            <button onClick={handleSiguiente} style={primaryButton(false)}>
              Continuar →
            </button>
          </div>
        )}

        {paso === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                style={{ ...inputStyle, paddingRight: 42 }}
              />
              <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} style={eyeButtonStyle}>
                {mostrarPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={mostrarPasswordConfirm ? 'text' : 'password'}
                placeholder="Repetir contraseña"
                value={form.passwordConfirm}
                onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
                style={{ ...inputStyle, paddingRight: 42 }}
              />
              <button type="button" onClick={() => setMostrarPasswordConfirm(!mostrarPasswordConfirm)} style={eyeButtonStyle}>
                {mostrarPasswordConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {error && <div style={errorBoxStyle}>{error}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPaso(1)} style={secondaryButton}>
                Atrás
              </button>
              <button onClick={handleSubmit} disabled={cargando} style={primaryButton(cargando)}>
                {cargando ? 'Creando...' : 'Crear cuenta'}
              </button>
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 13, color: TEXT_SECONDARY, marginTop: 18 }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/app/login" style={{ color: '#1F7CFF', fontWeight: 600, textDecoration: 'none' }}>
            Accede
          </Link>
        </p>
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
  background: 'white',
};

const eyeButtonStyle: React.CSSProperties = {
  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, display: 'flex',
};

const errorBoxStyle: React.CSSProperties = {
  color: '#dc2626', fontSize: 12, background: '#fef2f2', borderRadius: 10, padding: '8px 12px',
};

const primaryButton = (cargando: boolean): React.CSSProperties => ({
  flex: 1,
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

const secondaryButton: React.CSSProperties = {
  flex: 1,
  padding: 13,
  background: 'white',
  color: TEXT_PRIMARY,
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 4,
};