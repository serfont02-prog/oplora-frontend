'use client';

// ⭐ Onboarding · paso 4: mini reto según el nivel declarado en el paso 3.
// Antes leía el nivel por puntos (siempre 1 al empezar), así que todo el mundo veía la misma pregunta.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Clover, Coffee, Files, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { PantallaOnboarding, OpcionOnboarding, ListaOpciones } from '@/components/onboarding/PantallaOnboarding';
import { TEXT_PRIMARY, TEXT_SECONDARY } from '@/styles/tokens';

type Opcion = { icono: React.ComponentType<any>; titulo: string; valor: string; correcta: boolean; fallo: string };

const FLAME = { icono: Flame, correcta: true, fallo: '' };
const PREGUNTAS: Record<number, { pregunta: string; opciones: Opcion[] }> = {
  1: {
    pregunta: '¿Qué es lo más importante para avanzar en una oposición?',
    opciones: [
      { ...FLAME, titulo: 'Constancia', valor: 'constancia' },
      { icono: Clover, titulo: 'Suerte', valor: 'suerte', correcta: false, fallo: 'La suerte ayuda… pero no aprueba exámenes.' },
      { icono: Coffee, titulo: 'Café', valor: 'cafe', correcta: false, fallo: 'Ayuda a despejarse, pero no es suficiente.' },
    ],
  },
  2: {
    pregunta: 'Llevas tiempo estudiando. ¿Qué te ayudará a seguir avanzando?',
    opciones: [
      { ...FLAME, titulo: 'Constancia', valor: 'constancia' },
      { icono: Files, titulo: 'Acumular apuntes', valor: 'apuntes', correcta: false, fallo: 'Tener apuntes no sirve si no los repasas.' },
      { icono: Coffee, titulo: 'Café', valor: 'cafe', correcta: false, fallo: 'Ayuda a despejarse, pero no es suficiente.' },
    ],
  },
  3: {
    pregunta: 'Cuando queda poco para el examen, ¿qué marca la diferencia?',
    opciones: [
      { ...FLAME, titulo: 'Mantener la constancia', valor: 'constancia' },
      { icono: Zap, titulo: 'Estudiarlo todo de golpe', valor: 'atracon', correcta: false, fallo: 'El atracón de última hora casi nunca funciona.' },
      { icono: Clover, titulo: 'Tener suerte', valor: 'suerte', correcta: false, fallo: 'Mejor no dejarlo en manos de la suerte.' },
    ],
  },
};

const COLORES: Record<string, { color: string; fondo: string }> = {
  constancia: { color: 'var(--hx-c2410c)', fondo: 'var(--hx-fceee8)' },
  suerte: { color: 'var(--hx-4d7c0f)', fondo: 'var(--hx-ecfccb)' },
  cafe: { color: 'var(--hx-6b5f3e)', fondo: 'var(--hx-ede9dd)' },
  apuntes: { color: 'var(--hx-4f46e5)', fondo: 'var(--hx-e0e7ff)' },
  atracon: { color: 'var(--hx-ca8a04)', fondo: 'var(--hx-fdf8e8)' },
};

export default function MiniRetoPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [acertado, setAcertado] = useState(false);
  const [temblando, setTemblando] = useState<string | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);

  const nivel = Number(usuario?.oposicionActiva?.nivelExperiencia) || 1;
  const { pregunta, opciones } = PREGUNTAS[nivel] ?? PREGUNTAS[1];

  useEffect(() => {
    if (!temblando) return;
    const t = setTimeout(() => setTemblando(null), 400);
    return () => clearTimeout(t);
  }, [temblando]);

  const elegir = (o: Opcion) => {
    if (acertado) return;
    if (o.correcta) {
      setAcertado(true);
      setFallo(null);
      setTimeout(() => router.push('/app/onboarding/resumen'), 900);
    } else {
      setTemblando(o.valor);
      setFallo(o.fallo);
    }
  };

  return (
    <PantallaOnboarding paso={4} atras="/app/onboarding/experiencia" titulo="Un pequeño reto" subtitulo="Antes de empezar, a ver qué tal se te da.">
      <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.45, background: 'var(--hx-f8fafc)', borderRadius: 14, padding: '12px 14px', marginBottom: 12 }}>
        {pregunta}
      </div>
      <ListaOpciones>
        {opciones.map((o) => {
          const c = COLORES[o.valor] ?? COLORES.constancia;
          return (
            <OpcionOnboarding
              key={o.valor}
              icono={o.icono}
              color={c.color}
              fondo={c.fondo}
              titulo={o.titulo}
              correcta={acertado && o.correcta}
              atenuada={acertado && !o.correcta}
              temblar={temblando === o.valor}
              disabled={acertado}
              onClick={() => elegir(o)}
            />
          );
        })}
      </ListaOpciones>
      <div aria-live="polite" style={{ minHeight: 20, textAlign: 'center', marginTop: 12, fontSize: 13, color: acertado ? 'var(--hx-15803d)' : TEXT_SECONDARY, fontWeight: acertado ? 700 : 400 }}>
        {acertado ? '¡Exacto! La constancia es la clave.' : fallo ? `${fallo} Prueba otra vez.` : ''}
      </div>
    </PantallaOnboarding>
  );
}
