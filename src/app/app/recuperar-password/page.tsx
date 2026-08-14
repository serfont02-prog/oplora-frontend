'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';

const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

function Logo() {
  return (
    <Image src="/prueba.svg" alt="Oplora" width={200} height={68} priority style={{ marginBottom: 2 }} />
  );
}

export default function RecuperarPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.includes('@')) {
      setError('Introduce un email válido');
      return;
    }

    setCargando(true);
    setError('');

    try {
      await api.post('/usuarios/solicitar-reset-password', { email });
      setEnviado(true);
    } catch (e: any) {
      setError('Ha ocurrido un error, inténtalo de nuevo');
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
            Recupera tu contraseña
          </h1>
          <p style={{ fontSize: 13, color: TEXT_MUTED, margin: '4px 0 0' }}>
            Te enviaremos un enlace para restablecerla
          </p>
        </header>

        {enviado ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6 }}>
              Revisa tu correo
            </div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6, marginBottom: 20 }}>
              Si existe una cuenta con ese email, te hemos enviado un enlace para restablecer tu contraseña. Caduca en 30 minutos.
            </div>
            <button onClick={() => router.push('/app/login')} style={primaryButton(false)}>
              Volver al login
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />

            {error && <div style={errorBoxStyle}>{error}</div>}

            <button onClick={handleSubmit} disabled={cargando} style={primaryButton(cargando)}>
              {cargando ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 13, color: TEXT_SECONDARY, marginTop: 18 }}>
          <Link href="/app/login" style={{ color: '#1F7CFF', fontWeight: 600, textDecoration: 'none' }}>
            ← Volver al login
          </Link>
        </p>
      </main>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px', borderRadius: 12, border: '1px solid #E5E7EB',
  fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', background: 'white',
};

const errorBoxStyle: React.CSSProperties = {
  color: '#dc2626', fontSize: 12, background: '#fef2f2', borderRadius: 10, padding: '8px 12px',
};

const primaryButton = (cargando: boolean): React.CSSProperties => ({
  padding: 13, background: cargando ? '#9ca3af' : '#111827', color: 'white',
  border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
  cursor: cargando ? 'not-allowed' : 'pointer', width: '100%',
});