'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ChevronRight, Check } from 'lucide-react';

const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

function Logo() {
  return (
    <Image src="/prueba.svg" alt="Oplora" width={200} height={68} priority style={{ marginBottom: 2 }} />
  );
}

const OPCIONES = [
  { valor: 'menos_1h', icon: '⏰', title: 'Menos de 1 hora al día', subtitle: 'Voy poco a poco, pero constante' },
  { valor: '1_3h', icon: '🕑', title: '1-3 horas al día', subtitle: 'Le dedico un buen rato cada día' },
  { valor: 'mas_3h', icon: '🔥', title: 'Más de 3 horas al día', subtitle: 'Estoy a tope con esto' },
  { valor: 'variable', icon: '📅', title: 'Depende del día', subtitle: 'Mi disponibilidad varía mucho' },
];

export default function TiempoDisponiblePage() {
  const router = useRouter();
  const { actualizarUsuario } = useAuth();
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const handleSelect = async (valor: string) => {
    setSeleccionado(valor);
    try {
      const res = await api.patch('/usuarios/tiempo-disponible', { tiempoDisponible: valor });
      actualizarUsuario(res.data);
      setTimeout(() => {
        router.push('/app/onboarding/oposicion');
      }, 350);
    } catch (error) {
      console.error(error);
      setSeleccionado(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '1.5rem' }}>
      <main style={{ background: 'white', borderRadius: 20, padding: '2.25rem 2rem', width: '100%', maxWidth: 420 }}>

        <header style={{ marginBottom: 22, textAlign: 'center' }}>
          <Logo />

          <div style={{ marginTop: 12, marginBottom: 14 }}>
            <div style={{ height: 4, width: '100%', background: '#E5E7EB', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: '20%', height: '100%', background: '#1F7CFF', borderRadius: 999 }} />
            </div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 6 }}>
              Paso 1 de 5
            </div>
          </div>

          <h1 style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 4px' }}>
            ¿Cuánto tiempo puedes dedicarle?
          </h1>
          <p style={{ fontSize: 13, color: TEXT_SECONDARY, margin: 0 }}>
            Así adaptamos tu plan de estudio
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {OPCIONES.map(({ valor, icon, title, subtitle }) => {
            const activo = seleccionado === valor;
            const atenuado = seleccionado !== null && !activo;

            return (
              <button
                key={valor}
                onClick={() => !seleccionado && handleSelect(valor)}
                disabled={seleccionado !== null}
                style={{
                  width: '100%', textAlign: 'left', padding: '13px 14px',
                  borderRadius: 12,
                  border: activo ? '2px solid #1F7CFF' : '1px solid #F1F5F9',
                  background: activo ? '#EAF0FF' : 'white',
                  cursor: seleccionado ? 'default' : 'pointer',
                  display: 'flex', gap: 12, alignItems: 'center',
                  transform: activo ? 'scale(1.015)' : 'scale(1)',
                  opacity: atenuado ? 0.4 : 1,
                  transition: 'transform 0.2s ease, opacity 0.2s ease, background 0.2s ease, border-color 0.2s ease',
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: activo ? '#DCE9FF' : '#F4F5F7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0,
                  transition: 'background 0.2s ease',
                }}>
                  {icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: activo ? '#1F7CFF' : TEXT_PRIMARY }}>{title}</div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 1 }}>{subtitle}</div>
                </div>

                <div style={{ width: 15, height: 15, flexShrink: 0, position: 'relative' }}>
                  <ChevronRight
                    size={15}
                    color="#D1D5DB"
                    style={{
                      position: 'absolute', inset: 0,
                      opacity: activo ? 0 : 1,
                      transform: activo ? 'scale(0.5)' : 'scale(1)',
                      transition: 'opacity 0.15s ease, transform 0.15s ease',
                    }}
                  />
                  <Check
                    size={15}
                    color="#1F7CFF"
                    style={{
                      position: 'absolute', inset: 0,
                      opacity: activo ? 1 : 0,
                      transform: activo ? 'scale(1)' : 'scale(0.5)',
                      transition: 'opacity 0.15s ease 0.05s, transform 0.15s ease 0.05s',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}