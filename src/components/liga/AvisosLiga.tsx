'use client';

// ⭐ Liga Oplora — los tres avisos de la liga (lunes, viernes y domingo), desactivables.
// Se usa en la pantalla de la liga y en Notificaciones y avisos. Mismo interruptor que el resto de la app.

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, DoorOpen, AlarmClock } from 'lucide-react';
import { api } from '@/lib/api';
import Interruptor from '@/components/ui/Interruptor';
import { COLOR_LIGA, BG_LIGA } from './ligaUtils';

type Avisos = { lunes: boolean; viernes: boolean; domingo: boolean };

const TEXT_PRIMARY = '#111827';
const TEXT_MUTED = '#6B7280';
const SOMBRA = '0 6px 18px rgba(15, 23, 42, 0.08)';

export default function AvisosLiga({ avisos, titulo = 'Avisos de la liga' }: { avisos: Avisos; titulo?: string | null }) {
  const qc = useQueryClient();
  const [valores, setValores] = useState<Avisos>(avisos);
  const [error, setError] = useState(false);
  useEffect(() => setValores(avisos), [avisos]);

  const guardar = useMutation({
    mutationFn: async (cambio: Partial<Avisos>) => (await api.patch('/liga/avisos', cambio)).data,
    onSuccess: () => { setError(false); qc.invalidateQueries({ queryKey: ['liga-mia'] }); },
    onError: () => { setValores(avisos); setError(true); },
  });

  const opciones: [keyof Avisos, string, string, any][] = [
    ['lunes', 'Lunes', 'Temas de la próxima jornada', CalendarDays],
    ['viernes', 'Viernes', 'Apertura de la jornada', DoorOpen],
    ['domingo', 'Domingo', 'Última llamada si aún no has jugado', AlarmClock],
  ];

  return (
    <div>
      {titulo && (
        <div style={{ fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 8, padding: '0 4px' }}>{titulo}</div>
      )}
      <div style={{ background: 'white', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
        {opciones.map(([k, nombre, sub, Icono], i) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: i ? '1px solid #EEF0F3' : 'none' }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: BG_LIGA, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icono size={19} color={COLOR_LIGA} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{nombre}</div>
              <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>{sub}</div>
            </div>
            <Interruptor
              activo={valores[k]}
              etiqueta={`Aviso del ${nombre.toLowerCase()}`}
              onCambiar={(nuevo) => {
                setValores((v) => ({ ...v, [k]: nuevo }));
                guardar.mutate({ [k]: nuevo });
              }}
            />
          </div>
        ))}
      </div>
      {error && <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 6, padding: '0 4px' }}>No se ha podido guardar. Inténtalo de nuevo.</div>}
      <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 6, lineHeight: 1.45, padding: '0 4px' }}>
        Los avisos de ascenso y de copa al cerrar el mes llegan siempre.
      </div>
    </div>
  );
}
