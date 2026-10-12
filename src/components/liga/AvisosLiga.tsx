'use client';

// ⭐ Liga Oplora — los tres avisos de la liga (lunes, viernes y domingo), desactivables.
// Se usa en la pantalla de la liga y en Preferencias.

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { COLOR_LIGA } from './ligaUtils';

type Avisos = { lunes: boolean; viernes: boolean; domingo: boolean };

const TEXT_PRIMARY = '#111827';
const TEXT_MUTED = '#6B7280';

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

  const opciones: [keyof Avisos, string, string][] = [
    ['lunes', 'Lunes', 'Temas de la próxima jornada'],
    ['viernes', 'Viernes', 'Apertura de la jornada'],
    ['domingo', 'Domingo', 'Última llamada si aún no has jugado'],
  ];

  return (
    <div>
      {titulo && (
        <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{titulo}</div>
      )}
      <div style={{ background: 'white', borderRadius: 16, padding: '4px 14px', border: '1px solid #F1F5F9' }}>
        {opciones.map(([k, nombre, sub], i) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderTop: i ? '1px solid #F1F5F9' : 'none' }}>
            <Bell size={16} color={TEXT_MUTED} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{nombre}</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED }}>{sub}</div>
            </div>
            <button
              role="switch"
              aria-checked={valores[k]}
              aria-label={`Aviso del ${nombre.toLowerCase()}`}
              onClick={() => {
                const nuevo = !valores[k];
                setValores((v) => ({ ...v, [k]: nuevo }));
                guardar.mutate({ [k]: nuevo });
              }}
              style={{ width: 42, height: 24, borderRadius: 999, border: 'none', padding: 2, cursor: 'pointer', background: valores[k] ? COLOR_LIGA : '#D1D5DB', display: 'flex', justifyContent: valores[k] ? 'flex-end' : 'flex-start', transition: 'background .15s', flexShrink: 0 }}
            >
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,.2)' }} />
            </button>
          </div>
        ))}
      </div>
      {error && <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 6 }}>No se ha podido guardar. Inténtalo de nuevo.</div>}
      <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 6, lineHeight: 1.45 }}>
        Los avisos de ascenso y de copa al cerrar el mes llegan siempre.
      </div>
    </div>
  );
}
