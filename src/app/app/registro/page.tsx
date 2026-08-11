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

export default function RegistroPage() {
  const router = useRouter();
  const { registro } = useAuth();

  const [paso, setPaso] = useState(1);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    apellidos: '',
    nick: '',
    email: '',
    password: '',
    passwordConfirm: '',
    dni: '',
    notificacionesListas: false,
  });

  const validarPaso1 = () => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio';
    if (!form.nick.trim()) return 'El nick es obligatorio';
    if (form.nick.length < 3) return 'Mínimo 3 caracteres';
    if (form.nick.length > 10) return 'Máximo 10 caracteres';
    if (!/^[a-zA-Z0-9_]+$/.test(form.nick)) return 'Solo letras, números y _';
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
    setCargando(true);
    setError('');

    try {
      await registro({
        nombre: form.nombre,
        apellidos: form.apellidos || undefined,
        nick: form.nick,
        email: form.email,
        password: form.password,
        dni: form.dni || undefined,
        notificacionesListas: form.notificacionesListas,
      });

      router.push('/app/onboarding/objetivo');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al crear la cuenta');
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
        {/* HEADER */}
        <header style={{ textAlign: 'center', marginBottom: 28 }}>
          <Logo />

          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#0A2A43', marginTop: 10 }}>
            Crear cuenta
          </h1>

          <p style={{ fontSize: 13, color: '#6b7280' }}>
            Empieza gratis en segundos
          </p>
        </header>

        {/* PROGRESO */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {[1, 2].map((p) => (
            <div
              key={p}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: p <= paso ? '#1F7CFF' : '#e5e7eb',
              }}
            />
          ))}
        </div>

        {/* PASO 1 */}
        {paso === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              placeholder="Nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              style={inputStyle}
            />

            <input
              placeholder="Apellidos"
              value={form.apellidos}
              onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
              style={inputStyle}
            />

            <input
              placeholder="Nick (3-10 caracteres)"
              value={form.nick}
              onChange={(e) =>
                setForm({
                  ...form,
                  nick: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                })
              }
              style={inputStyle}
            />

            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={inputStyle}
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={inputStyle}
            />

            <input
              type="password"
              placeholder="Repetir contraseña"
              value={form.passwordConfirm}
              onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
              style={inputStyle}
            />

            {error && <ErrorBox text={error} />}

            <button onClick={handleSiguiente} style={primaryButton}>
              Siguiente →
            </button>
          </div>
        )}

        {/* PASO 2 */}
        {paso === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              placeholder="DNI (opcional)"
              value={form.dni}
              onChange={(e) =>
                setForm({ ...form, dni: e.target.value.toUpperCase() })
              }
              style={inputStyle}
            />

            <label style={{ display: 'flex', gap: 10, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={form.notificacionesListas}
                onChange={(e) =>
                  setForm({ ...form, notificacionesListas: e.target.checked })
                }
              />
              Activar alertas de listas
            </label>

            {error && <ErrorBox text={error} />}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPaso(1)} style={secondaryButton}>
                Atrás
              </button>

              <button onClick={handleSubmit} disabled={cargando} style={primaryButton}>
                {cargando ? 'Creando...' : 'Crear cuenta'}
              </button>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <p style={{ textAlign: 'center', fontSize: 13, marginTop: 20 }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/app/login" style={{ color: '#1F7CFF' }}>
            Accede
          </Link>
        </p>
      </main>
    </div>
  );
}

/* ===== estilos reutilizables ===== */

const inputStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  border: '1px solid #e5e7eb',
};

const primaryButton: React.CSSProperties = {
  padding: 11,
  background: '#1F7CFF',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  width: '100%',
};

const secondaryButton: React.CSSProperties = {
  ...primaryButton,
  background: 'white',
  color: '#111827',
  border: '1px solid #e5e7eb',
};

function ErrorBox({ text }: { text: string }) {
  return (
    <div style={{ color: '#dc2626', fontSize: 13 }}>
      {text}
    </div>
  );
}
