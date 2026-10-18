'use client';

// ⭐ Recuperar contraseña con el diseño de la app.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, MailCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { PantallaAuth, CampoAuth, BotonAuth, AvisoAuth, EstadoAuth, EnlaceAuth } from '@/components/auth/PantallaAuth';
import { COLOR_MARCA } from '@/components/marca/LogoOplora';
import { BG_DASHBOARD } from '@/styles/tokens';

export default function RecuperarPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const enviar = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Escribe un email válido');
      return;
    }
    setCargando(true);
    setError('');
    try {
      await api.post('/usuarios/solicitar-reset-password', { email: email.trim() });
      setEnviado(true);
    } catch {
      setError('No se ha podido enviar. Comprueba la conexión e inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  if (enviado) {
    return (
      <PantallaAuth>
        <EstadoAuth
          icono={MailCheck}
          color={COLOR_MARCA}
          fondo={BG_DASHBOARD}
          titulo="Revisa tu correo"
          texto={<>Si existe una cuenta con <strong>{email.trim()}</strong>, te hemos enviado un enlace para crear una contraseña nueva. Caduca en 30 minutos; si no lo ves, mira en spam.</>}
        >
          <BotonAuth type="button" onClick={() => router.push('/app/login')}>Volver a entrar</BotonAuth>
        </EstadoAuth>
      </PantallaAuth>
    );
  }

  return (
    <PantallaAuth
      titulo="¿Has olvidado tu contraseña?"
      subtitulo="Escribe tu email y te enviamos un enlace para crear una nueva."
      pie={<EnlaceAuth href="/app/login">Volver a entrar</EnlaceAuth>}
    >
      <form onSubmit={(e) => { e.preventDefault(); enviar(); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <CampoAuth icono={Mail} label="Email" type="email" inputMode="email" autoComplete="email" placeholder="tu@email.com" value={email} onChange={setEmail} autoFocus />
        {error && <AvisoAuth>{error}</AvisoAuth>}
        <BotonAuth cargando={cargando} textoCargando="Enviando…">Enviar enlace</BotonAuth>
      </form>
    </PantallaAuth>
  );
}
