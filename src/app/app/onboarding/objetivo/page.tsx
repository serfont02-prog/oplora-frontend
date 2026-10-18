'use client';

// ⭐ Onboarding · paso 1: cuánto tiempo puede dedicar al estudio.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Hourglass, Flame, CalendarDays } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PantallaOnboarding, OpcionOnboarding, ListaOpciones } from '@/components/onboarding/PantallaOnboarding';
import { AvisoAuth } from '@/components/auth/PantallaAuth';

const OPCIONES = [
  { valor: 'menos_1h', icono: Clock, color: '#1F7CFF', fondo: '#EAF0FF', titulo: 'Menos de 1 hora al día', subtitulo: 'Poco a poco, pero constante' },
  { valor: '1_3h', icono: Hourglass, color: '#4F46E5', fondo: '#E0E7FF', titulo: 'De 1 a 3 horas al día', subtitulo: 'Le dedico un buen rato cada día' },
  { valor: 'mas_3h', icono: Flame, color: '#C2410C', fondo: '#FCEEE8', titulo: 'Más de 3 horas al día', subtitulo: 'Voy a por todas' },
  { valor: 'variable', icono: CalendarDays, color: '#4D7C0F', fondo: '#ECFCCB', titulo: 'Depende del día', subtitulo: 'Mi disponibilidad cambia mucho' },
];

export default function TiempoDisponiblePage() {
  const router = useRouter();
  const { usuario, actualizarUsuario } = useAuth();
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [error, setError] = useState('');

  const elegir = async (valor: string) => {
    setSeleccionado(valor);
    setError('');
    try {
      const res = await api.patch('/usuarios/tiempo-disponible', { tiempoDisponible: valor });
      actualizarUsuario({ tiempoDisponible: res.data?.tiempoDisponible ?? valor });
      setTimeout(() => router.push('/app/onboarding/oposicion'), 300);
    } catch {
      setSeleccionado(null);
      setError('No se ha podido guardar. Comprueba la conexión e inténtalo de nuevo.');
    }
  };

  return (
    <PantallaOnboarding
      paso={1}
      titulo={usuario?.nombre ? `¡Hola, ${usuario.nombre}! ¿Cuánto tiempo puedes dedicarle?` : '¿Cuánto tiempo puedes dedicarle?'}
      subtitulo="Así ajustamos tu plan de estudio. Podrás cambiarlo cuando quieras."
    >
      <ListaOpciones>
        {OPCIONES.map((o) => (
          <OpcionOnboarding
            key={o.valor}
            icono={o.icono}
            color={o.color}
            fondo={o.fondo}
            titulo={o.titulo}
            subtitulo={o.subtitulo}
            seleccionada={seleccionado === o.valor}
            atenuada={seleccionado !== null && seleccionado !== o.valor}
            disabled={seleccionado !== null}
            onClick={() => elegir(o.valor)}
          />
        ))}
      </ListaOpciones>
      {error && <div style={{ marginTop: 12 }}><AvisoAuth>{error}</AvisoAuth></div>}
    </PantallaOnboarding>
  );
}
