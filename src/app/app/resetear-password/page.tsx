'use client';

// ⭐ Crear contraseña nueva (desde el enlace del correo) con el diseño de la app.

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, CheckCircle2, AlertTriangle, Loader2, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { PantallaAuth, CampoAuth, BotonAuth, AvisoAuth, EstadoAuth, EnlaceAuth } from '@/components/auth/PantallaAuth';
import { COLOR_MARCA } from '@/components/marca/LogoOplora';
import { TEXT_SECONDARY } from '@/styles/tokens';

const PASS_MIN = 6;

function Comprobando() {
  return (
    <PantallaAuth>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '18px 0', fontSize: 13, color: TEXT_SECONDARY }}>
        <Loader2 size={24} color={COLOR_MARCA} style={{ animation: 'oplora-girar 0.8s linear infinite' }} />
        Comprobando el enlace…
      </div>
    </PantallaAuth>
  );
}

function ResetearPasswordContenido() {
  const router = useRouter();
  const token = useSearchParams().get('token');

  const [validando, setValidando] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
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

  const guardar = async () => {
    if (password.length < PASS_MIN) return setError(`La contraseña debe tener al menos ${PASS_MIN} caracteres`);
    if (password !== passwordConfirm) return setError('Las contraseñas no coinciden');
    setCargando(true);
    setError('');
    try {
      await api.post('/usuarios/resetear-password', { token, password });
      setCompletado(true);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'El enlace ha caducado. Solicita uno nuevo.');
    } finally {
      setCargando(false);
    }
  };

  if (validando) return <Comprobando />;

  if (!tokenValido) {
    return (
      <PantallaAuth>
        <EstadoAuth
          icono={AlertTriangle}
          color="#B45309"
          fondo="#FFFBEB"
          titulo="Enlace no válido o caducado"
          texto="Los enlaces para cambiar la contraseña duran 30 minutos y solo se pueden usar una vez. Pide uno nuevo."
        >
          <BotonAuth type="button" onClick={() => router.push('/app/recuperar-password')}>Pedir un enlace nuevo</BotonAuth>
        </EstadoAuth>
      </PantallaAuth>
    );
  }

  if (completado) {
    return (
      <PantallaAuth>
        <EstadoAuth
          icono={CheckCircle2}
          color="#16A34A"
          fondo="#F0FDF4"
          titulo="Contraseña actualizada"
          texto="Ya puedes entrar con tu contraseña nueva."
        >
          <BotonAuth type="button" onClick={() => router.push('/app/login')}>Entrar</BotonAuth>
        </EstadoAuth>
      </PantallaAuth>
    );
  }

  const coinciden = passwordConfirm.length > 0 && password === passwordConfirm;

  return (
    <PantallaAuth
      titulo="Crea una contraseña nueva"
      subtitulo="Elige una que no uses en otras webs."
      pie={<EnlaceAuth href="/app/login">Volver a entrar</EnlaceAuth>}
    >
      <form onSubmit={(e) => { e.preventDefault(); guardar(); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <CampoAuth icono={Lock} label="Contraseña nueva" conOjo autoComplete="new-password" placeholder={`Mínimo ${PASS_MIN} caracteres`} value={password} onChange={setPassword} autoFocus />
        <CampoAuth
          icono={Lock}
          label="Repite la contraseña"
          conOjo
          autoComplete="new-password"
          placeholder="Otra vez la misma"
          value={passwordConfirm}
          onChange={setPasswordConfirm}
          ayuda={coinciden ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#15803D' }}><Check size={12} /> Coinciden</span> : undefined}
        />
        {error && <AvisoAuth>{error}</AvisoAuth>}
        <BotonAuth cargando={cargando} textoCargando="Guardando…">Guardar contraseña</BotonAuth>
      </form>
    </PantallaAuth>
  );
}

export default function ResetearPasswordPage() {
  return (
    <Suspense fallback={<Comprobando />}>
      <ResetearPasswordContenido />
    </Suspense>
  );
}
