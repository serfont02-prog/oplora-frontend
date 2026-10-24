'use client';

// ⭐ Onboarding · paso 3: nivel de partida en la oposición elegida.
// Antes el nivel elegido no se guardaba en ningún sitio; ahora se guarda en la oposición
// activa (nivelExperiencia) y el mini reto del paso siguiente se adapta a él.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sprout, BookOpen, Award } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PantallaOnboarding, OpcionOnboarding, ListaOpciones } from '@/components/onboarding/PantallaOnboarding';
import { AvisoAuth } from '@/components/auth/PantallaAuth';

const OPCIONES = [
  { nivel: 1, icono: Sprout, color: 'var(--hx-4d7c0f)', fondo: 'var(--hx-ecfccb)', titulo: 'Empiezo de cero', subtitulo: 'Estoy empezando o llevo muy poco tiempo' },
  { nivel: 2, icono: BookOpen, color: 'var(--hx-1f7cff)', fondo: 'var(--hx-eaf0ff)', titulo: 'Ya llevo un tiempo', subtitulo: 'Conozco parte del temario' },
  { nivel: 3, icono: Award, color: 'var(--hx-c2410c)', fondo: 'var(--hx-fceee8)', titulo: 'Voy avanzado', subtitulo: 'Domino buena parte del temario' },
];

export default function ExperienciaPage() {
  const router = useRouter();
  const { usuario, actualizarUsuario } = useAuth();
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [error, setError] = useState('');
  const oposicionId = usuario?.oposicionActiva?.id;

  // Sin oposición elegida no hay dónde guardar el nivel: de vuelta al paso 2.
  useEffect(() => {
    if (usuario && !oposicionId) router.replace('/app/onboarding/oposicion');
  }, [usuario, oposicionId, router]);

  const elegir = async (nivel: number) => {
    if (!oposicionId) return;
    setSeleccionado(nivel);
    setError('');
    try {
      const res = await api.patch('/usuarios/nivel-experiencia', { nivelExperiencia: nivel, oposicionId });
      actualizarUsuario(res.data);
      setTimeout(() => router.push('/app/onboarding/minireto'), 300);
    } catch {
      setSeleccionado(null);
      setError('No se ha podido guardar. Comprueba la conexión e inténtalo de nuevo.');
    }
  };

  return (
    <PantallaOnboarding
      paso={3}
      atras="/app/onboarding/oposicion"
      titulo="¿Desde dónde empiezas?"
      subtitulo={usuario?.oposicionActiva?.nombre ? <>En <strong>{usuario.oposicionActiva.nombre}</strong>. Así nos adaptamos a tu nivel.</> : 'Así nos adaptamos a tu nivel.'}
    >
      <ListaOpciones>
        {OPCIONES.map((o) => (
          <OpcionOnboarding
            key={o.nivel}
            icono={o.icono}
            color={o.color}
            fondo={o.fondo}
            titulo={o.titulo}
            subtitulo={o.subtitulo}
            seleccionada={seleccionado === o.nivel}
            atenuada={seleccionado !== null && seleccionado !== o.nivel}
            disabled={seleccionado !== null || !oposicionId}
            onClick={() => elegir(o.nivel)}
          />
        ))}
      </ListaOpciones>
      {error && <div style={{ marginTop: 12 }}><AvisoAuth>{error}</AvisoAuth></div>}
    </PantallaOnboarding>
  );
}
