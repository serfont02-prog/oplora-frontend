'use client';

// ⭐ Onboarding · paso 5: resumen del plan y entrada a la app.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { GraduationCap, CalendarCheck, Clock, Gauge, Rocket } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PantallaOnboarding } from '@/components/onboarding/PantallaOnboarding';
import { AvisoAuth, BotonAuth } from '@/components/auth/PantallaAuth';
import { COLOR_MARCA } from '@/components/marca/LogoOplora';
import { TEXT_PRIMARY, TEXT_SECONDARY } from '@/styles/tokens';

const TIEMPO: Record<string, string> = {
  menos_1h: 'Menos de 1 hora al día',
  '1_3h': 'De 1 a 3 horas al día',
  mas_3h: 'Más de 3 horas al día',
  variable: 'Depende del día',
};
const NIVEL: Record<number, string> = { 1: 'Empiezo de cero', 2: 'Ya llevo un tiempo', 3: 'Voy avanzado' };

export default function ResumenPage() {
  const router = useRouter();
  const { actualizarUsuario } = useAuth();
  const [usuario, setUsuario] = useState<any>(null);
  const [errorCarga, setErrorCarga] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/usuarios/me')
      .then((res) => {
        setUsuario(res.data);
        if (res.data?.oposicionActiva) {
          setTimeout(() => confetti({ particleCount: 70, spread: 60, origin: { y: 0.3 }, colors: ['#1F7CFF', '#0f172a', '#93C5FD', '#FBBF24'] }), 250);
        }
      })
      .catch(() => setErrorCarga(true));
  }, []);

  const empezar = async () => {
    setGuardando(true);
    setError('');
    try {
      await api.post('/usuarios/onboarding-general/completado');
      actualizarUsuario({ onboardingGeneralCompletado: true });
      router.replace('/app/dashboard');
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'No se ha podido terminar. Inténtalo de nuevo.');
      setGuardando(false);
    }
  };

  if (errorCarga) {
    return (
      <PantallaOnboarding paso={5} titulo="Casi listo">
        <AvisoAuth>No se ha podido cargar tu resumen. Comprueba la conexión.</AvisoAuth>
        <div style={{ marginTop: 12 }}><BotonAuth type="button" onClick={() => window.location.reload()}>Reintentar</BotonAuth></div>
      </PantallaOnboarding>
    );
  }

  if (!usuario) {
    return <PantallaOnboarding paso={5}><div style={{ height: 220 }} /></PantallaOnboarding>;
  }

  const opo = usuario.oposicionActiva;
  if (!opo) {
    return (
      <PantallaOnboarding paso={5} titulo="Te falta elegir tu oposición" subtitulo="La necesitamos para preparar tu temario, tus tests y tu plan.">
        <BotonAuth type="button" onClick={() => router.push('/app/onboarding/oposicion')}>Elegir oposición</BotonAuth>
      </PantallaOnboarding>
    );
  }

  const filas = [
    { icono: CalendarCheck, label: 'Convocatoria', valor: opo.convocatoriaActiva?.anyo ? String(opo.convocatoriaActiva.anyo) : null },
    { icono: Clock, label: 'Tiempo de estudio', valor: TIEMPO[usuario.tiempoDisponible] ?? null },
    { icono: Gauge, label: 'Tu nivel', valor: NIVEL[Number(opo.nivelExperiencia)] ?? null },
  ].filter((f) => f.valor);

  return (
    <PantallaOnboarding paso={5} atras="/app/onboarding/minireto" titulo="¡Ya tienes tu plan!" subtitulo="Todo listo. Ahora toca empezar.">
      <div style={{ background: '#0f172a', borderRadius: 18, padding: 16, color: 'white', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(31,124,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GraduationCap size={22} color="#93C5FD" />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tu oposición</div>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, marginTop: 2 }}>{opo.nombre}</div>
            {opo.subgrupo && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Subgrupo {opo.subgrupo}</div>}
          </div>
        </div>
      </div>

      {filas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 16 }}>
          {filas.map((f, i) => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 2px', borderTop: i ? '1px solid #EEF0F3' : 'none' }}>
              <f.icono size={17} color={COLOR_MARCA} />
              <span style={{ flex: 1, fontSize: 13, color: TEXT_SECONDARY }}>{f.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, textAlign: 'right' }}>{f.valor}</span>
            </div>
          ))}
        </div>
      )}

      {error && <div style={{ marginBottom: 12 }}><AvisoAuth>{error}</AvisoAuth></div>}

      <BotonAuth type="button" onClick={empezar} cargando={guardando} textoCargando="Entrando…">
        <Rocket size={16} /> Empezar en Oplora
      </BotonAuth>
    </PantallaOnboarding>
  );
}
