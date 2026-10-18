'use client';

// ⭐ Registro en dos pasos con el diseño de la app: 1) cómo te llamamos, 2) email y contraseña.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, AtSign, Mail, Lock, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { PantallaAuth, CampoAuth, BotonAuth, AvisoAuth, EnlaceAuth } from '@/components/auth/PantallaAuth';
import { COLOR_MARCA } from '@/components/marca/LogoOplora';
import { TEXT_MUTED } from '@/styles/tokens';

const NICK_MIN = 3;
const NICK_MAX = 10;
const PASS_MIN = 6;

export default function RegistroPage() {
  const router = useRouter();
  const { registro } = useAuth();

  const [paso, setPaso] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [form, setForm] = useState({ nombre: '', apellidos: '', nick: '', email: '', password: '', passwordConfirm: '' });
  const cambiar = (campo: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [campo]: v }));

  const validarPaso1 = () => {
    if (!form.nombre.trim()) return 'Escribe tu nombre';
    if (form.nick.length < NICK_MIN) return `El nick debe tener al menos ${NICK_MIN} caracteres`;
    if (!/^[a-z0-9_]+$/.test(form.nick)) return 'El nick solo puede tener letras, números y _';
    return null;
  };

  const validarPaso2 = () => {
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Escribe un email válido';
    if (form.password.length < PASS_MIN) return `La contraseña debe tener al menos ${PASS_MIN} caracteres`;
    if (form.password !== form.passwordConfirm) return 'Las contraseñas no coinciden';
    return null;
  };

  const continuar = () => {
    const err = validarPaso1();
    if (err) return setError(err);
    setError('');
    setPaso(2);
  };

  const crearCuenta = async () => {
    const err = validarPaso2();
    if (err) return setError(err);
    setCargando(true);
    setError('');
    try {
      await registro({
        nombre: form.nombre.trim(),
        apellidos: form.apellidos.trim() || undefined,
        nick: form.nick,
        email: form.email.trim(),
        password: form.password,
      });
      router.push('/app/onboarding/objetivo');
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'No se ha podido crear la cuenta. Inténtalo de nuevo.');
      setCargando(false);
    }
  };

  const coinciden = form.passwordConfirm.length > 0 && form.password === form.passwordConfirm;

  return (
    <PantallaAuth
      titulo={paso === 1 ? 'Crea tu cuenta' : 'Protege tu cuenta'}
      subtitulo={paso === 1 ? 'Primero, dinos cómo quieres que te llamemos.' : 'Con tu email y una contraseña podrás entrar desde cualquier dispositivo.'}
      encabezado={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          {[1, 2].map((p) => (
            <div key={p} style={{ flex: 1, height: 5, borderRadius: 999, background: p <= paso ? COLOR_MARCA : '#E5E7EB', transition: 'background 0.3s' }} />
          ))}
          <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, flexShrink: 0 }}>Paso {paso} de 2</span>
        </div>
      }
      pie={<>¿Ya tienes cuenta? <EnlaceAuth href="/app/login">Entra</EnlaceAuth></>}
    >
      {paso === 1 ? (
        <form onSubmit={(e) => { e.preventDefault(); continuar(); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <CampoAuth icono={User} label="Nombre" autoComplete="given-name" placeholder="Tu nombre" maxLength={30} value={form.nombre} onChange={cambiar('nombre')} autoFocus />
          <CampoAuth icono={User} label="Apellidos (opcional)" autoComplete="family-name" placeholder="Tus apellidos" maxLength={30} value={form.apellidos} onChange={cambiar('apellidos')} />
          <CampoAuth
            icono={AtSign}
            label="Nick"
            autoComplete="username"
            placeholder="tunick"
            maxLength={NICK_MAX}
            value={form.nick}
            onChange={(v) => cambiar('nick')(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            ayuda={`Es tu nombre en retos y en la Liga. De ${NICK_MIN} a ${NICK_MAX} caracteres: letras, números y _ (${form.nick.length}/${NICK_MAX}).`}
          />

          {error && <AvisoAuth>{error}</AvisoAuth>}

          <BotonAuth>Continuar</BotonAuth>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); crearCuenta(); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <CampoAuth icono={Mail} label="Email" type="email" inputMode="email" autoComplete="email" placeholder="tu@email.com" value={form.email} onChange={cambiar('email')} autoFocus />
          <CampoAuth
            icono={Lock}
            label="Contraseña"
            conOjo
            autoComplete="new-password"
            placeholder={`Mínimo ${PASS_MIN} caracteres`}
            value={form.password}
            onChange={cambiar('password')}
          />
          <CampoAuth
            icono={Lock}
            label="Repite la contraseña"
            conOjo
            autoComplete="new-password"
            placeholder="Otra vez la misma"
            value={form.passwordConfirm}
            onChange={cambiar('passwordConfirm')}
            ayuda={coinciden ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#15803D' }}><Check size={12} /> Coinciden</span> : undefined}
          />

          {error && <AvisoAuth>{error}</AvisoAuth>}

          <div style={{ display: 'flex', gap: 8 }}>
            <BotonAuth type="button" variante="secundario" onClick={() => { setError(''); setPaso(1); }} disabled={cargando}>Atrás</BotonAuth>
            <BotonAuth cargando={cargando} textoCargando="Creando…">Crear cuenta</BotonAuth>
          </div>
        </form>
      )}
    </PantallaAuth>
  );
}
