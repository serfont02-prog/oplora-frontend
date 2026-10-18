'use client';

// ⭐ Pantalla de compromiso (recordatorios). No forma parte del recorrido actual del onboarding
// (objetivo → oposición → experiencia → mini reto → resumen), pero se mantiene con el mismo diseño
// por si se vuelve a enlazar.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { PantallaOnboarding, OpcionOnboarding, ListaOpciones } from '@/components/onboarding/PantallaOnboarding';
import { AvisoAuth } from '@/components/auth/PantallaAuth';

export default function CompromisoPage() {
  const router = useRouter();
  const [elegido, setElegido] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  const elegir = async (valor: boolean) => {
    setElegido(valor);
    setError('');
    try {
      await api.patch('/usuarios/compromiso', { compromiso: valor });
      setTimeout(() => router.push('/app/onboarding/minireto'), 300);
    } catch {
      setElegido(null);
      setError('No se ha podido guardar. Inténtalo de nuevo.');
    }
  };

  return (
    <PantallaOnboarding titulo="¿Te ayudamos a mantener el ritmo?" subtitulo="Te enviaremos recordatorios suaves para que no pierdas la constancia.">
      <ListaOpciones>
        <OpcionOnboarding icono={Flame} color="#C2410C" fondo="#FCEEE8" titulo="Sí, quiero aprobar" subtitulo="Recordatorios activados" seleccionada={elegido === true} atenuada={elegido === false} disabled={elegido !== null} onClick={() => elegir(true)} />
        <OpcionOnboarding icono={Clock} titulo="Ahora no" subtitulo="Podrás activarlos en Avisos" seleccionada={elegido === false} atenuada={elegido === true} disabled={elegido !== null} onClick={() => elegir(false)} />
      </ListaOpciones>
      {error && <div style={{ marginTop: 12 }}><AvisoAuth>{error}</AvisoAuth></div>}
    </PantallaOnboarding>
  );
}
