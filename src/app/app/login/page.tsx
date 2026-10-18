'use client';

// ⭐ Login con el diseño de la app (PantallaAuth): fondo azul del Inicio, logo de marca,
// tarjeta blanca, campos con icono y botón oscuro.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { PantallaAuth, CampoAuth, BotonAuth, AvisoAuth, EnlaceAuth, COLOR_ENLACE } from '@/components/auth/PantallaAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(false);

  // ⭐ Mensaje que deja el interceptor de la API al caducar la sesión
  useEffect(() => {
    try {
      const m = sessionStorage.getItem('oplora-aviso-login');
      if (m) { setAviso(m); sessionStorage.removeItem('oplora-aviso-login'); }
    } catch { /* sin sessionStorage */ }
  }, []);

  const entrar = async () => {
    if (!email.trim() || !password) {
      setError('Escribe tu email (o nick) y tu contraseña');
      return;
    }
    setCargando(true);
    setError('');
    try {
      const res = (await login(email.trim(), password)) as any;
      router.push(res?.usuario?.onboardingGeneralCompletado ? '/app/dashboard' : '/app/onboarding/objetivo');
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Email, nick o contraseña incorrectos');
      setCargando(false);
    }
  };

  return (
    <PantallaAuth
      titulo="Hola de nuevo"
      subtitulo="Entra para seguir preparando tu oposición."
      pie={<>¿No tienes cuenta? <EnlaceAuth href="/app/registro">Regístrate gratis</EnlaceAuth></>}
    >
      <form onSubmit={(e) => { e.preventDefault(); entrar(); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {aviso && !error && <AvisoAuth tipo="info">{aviso}</AvisoAuth>}

        {/* El servidor acepta email o nick; type="text" para que el navegador no bloquee un nick sin @ */}
        <CampoAuth icono={Mail} label="Email o nick" inputMode="email" autoComplete="username" placeholder="tu@email.com" value={email} onChange={setEmail} />

        <div>
          <CampoAuth icono={Lock} label="Contraseña" conOjo autoComplete="current-password" placeholder="Tu contraseña" value={password} onChange={setPassword} />
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <Link href="/app/recuperar-password" style={{ fontSize: 12, color: COLOR_ENLACE, fontWeight: 600, textDecoration: 'none' }}>
              ¿Has olvidado tu contraseña?
            </Link>
          </div>
        </div>

        {error && <AvisoAuth>{error}</AvisoAuth>}

        <BotonAuth cargando={cargando} textoCargando="Entrando…">Entrar</BotonAuth>
      </form>
    </PantallaAuth>
  );
}
