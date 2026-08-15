'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { CheckCircle2 } from 'lucide-react';

const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

function Logo() {
  return (
    <Image src="/prueba.svg" alt="Oplora" width={200} height={68} priority style={{ marginBottom: 2 }} />
  );
}

function ResetearPasswordContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [validando, setValidando] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarPasswordConfirm, setMostrarPasswordConfirm] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidando(false);
      setTokenValido(false);
      return;
    }
    api.get(`/usuarios/validar-token-reset/${token}`)
      .then((res) => setTokenValido(res.data === true))
      .catch(() => setTokenValido(false))
      .finally(() => setValidando(false));
  }, [token]);

  const handleSubmit = async () => {
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    if (password !== passwordConfirm) return setError('Las contraseñas no coinciden');

    setCargando(true);
    setError('');

    try {
      await api.post('/usuarios/resetear-password', { token, password });
      setCompletado(true);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'El enlace ha caducado, solicita uno nuevo');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main style={{ background: 'white', borderRadius: 20, padding: '2.25rem 2rem', width: '100%', maxWidth: 400 }}>

      <header style={{ textAlign: 'center', marginBottom: 20 }}>
        <Logo />
        <h1 style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, marginTop: 10 }}>
          Nueva contraseña
        </h1>
      </header>

      {validando ? (
        <div style={{ textAlign: 'center', fontSize: 13, color: TEXT_MUTED, padding: '2rem 0' }}>
          Comprobando enlace...
        </div>
      ) : !tokenValido ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6 }}>
            Enlace no válido o caducado
          </div>
          <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 20 }}>
            Solicita un nuevo enlace de recuperación
          </div>
          <button onClick={() => router.push('/app/recuperar-password')} style={primaryButton(false)}>
            Solicitar nuevo enlace
          </button>
        </div>
      ) : completado ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: '#F0FDF4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            }}>
            <CheckCircle2 size={24} color="#16A34A" />
            </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6 }}>
            Contraseña actualizada
          </div>
          <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 20 }}>
            Ya puedes acceder con tu nueva contraseña
          </div>
          <button onClick={() => router.push('/app/login')} style={primaryButton(false)}>
            Ir al login
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <input
              type={mostrarPassword ? 'text' : 'password'}
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              style={{ ...inputStyle, paddingRight: 42 }}
            />
            <button type="button" onClick={() => setMostrarPasswordConfirm(!mostrarPasswordConfirm)} style={eyeButtonStyle}>
              {mostrarPasswordConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          {error && <div style={errorBoxStyle}>{error}</div>}

          <button onClick={handleSubmit} disabled={cargando} style={primaryButton(cargando)}>
            {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </div>
      )}

        {!tokenValido || completado ? null : (
        <p style={{ textAlign: 'center', fontSize: 13, color: TEXT_SECONDARY, marginTop: 18 }}>
            <Link href="/app/login" style={{ color: '#1F7CFF', fontWeight: 600, textDecoration: 'none' }}>
            ← Volver al login
            </Link>
        </p>
        )}
    </main>
  );
}

export default function ResetearPasswordPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '1.5rem' }}>
      <Suspense fallback={<div style={{ color: 'white', fontSize: 13 }}>Cargando...</div>}>
        <ResetearPasswordContenido />
      </Suspense>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px', borderRadius: 12, border: '1px solid #E5E7EB',
  fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', background: 'white',
};

const eyeButtonStyle: React.CSSProperties = {
  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, display: 'flex',
};

const errorBoxStyle: React.CSSProperties = {
  color: '#dc2626', fontSize: 12, background: '#fef2f2', borderRadius: 10, padding: '8px 12px',
};

const primaryButton = (cargando: boolean): React.CSSProperties => ({
  padding: 13, background: cargando ? '#9ca3af' : '#111827', color: 'white',
  border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
  cursor: cargando ? 'not-allowed' : 'pointer', width: '100%',
});