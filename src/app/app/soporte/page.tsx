'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

const BG_APP = '#F4F5F7';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

type EstadoTicket = 'abierto' | 'respondido' | 'cerrado';

interface TicketSoporte {
  id: string;
  asunto: string;
  mensaje: string;
  estado: EstadoTicket;
  respuesta: string | null;
  respondidoEn: string | null;
  creadoEn: string;
}

const ESTADO_LABEL: Record<EstadoTicket, string> = {
  abierto: 'Abierto',
  respondido: 'Respondido',
  cerrado: 'Cerrado',
};

const ESTADO_COLOR: Record<EstadoTicket, { bg: string; text: string }> = {
  abierto: { bg: '#FEF3C7', text: '#92400E' },
  respondido: { bg: '#DCFCE7', text: '#15803D' },
  cerrado: { bg: '#F1F5F9', text: '#64748B' },
};

function formatearFecha(fecha: string): string {
  const d = new Date(fecha);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

export default function SoportePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  const { data: tickets = [], isLoading } = useQuery<TicketSoporte[]>({
    queryKey: ['mis-tickets-soporte'],
    queryFn: async () => (await api.get('/soporte/mis-tickets')).data,
  });

  const mutEnviar = useMutation({
    mutationFn: () => api.post('/soporte', { asunto, mensaje }),
    onSuccess: () => {
      setAsunto('');
      setMensaje('');
      qc.invalidateQueries({ queryKey: ['mis-tickets-soporte'] });
    },
  });

  const enviar = () => {
    if (!asunto.trim() || !mensaje.trim()) return;
    mutEnviar.mutate();
  };

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: '#0f172a', padding: '1rem 1.25rem 1.5rem' }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, padding: '6px 12px', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}
        >
          ← Volver
        </button>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'white' }}>Soporte</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Cuéntanos qué necesitas y te responderemos aquí</div>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Formulario */}
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 12 }}>Nueva consulta</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Asunto"
              style={inputEstilo}
            />
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Cuéntanos en qué podemos ayudarte..."
              style={{ ...inputEstilo, minHeight: 90, resize: 'vertical' as const }}
            />
            <button
              onClick={enviar}
              disabled={!asunto.trim() || !mensaje.trim() || mutEnviar.isPending}
              style={{
                padding: '11px 0', borderRadius: 12, border: 'none', background: '#111827', color: 'white',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                opacity: (!asunto.trim() || !mensaje.trim() || mutEnviar.isPending) ? 0.5 : 1,
              }}
            >
              {mutEnviar.isPending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>

        {/* Lista de consultas */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 10 }}>Mis consultas</div>

          {isLoading ? (
            <div style={{ fontSize: 13, color: TEXT_MUTED, textAlign: 'center', padding: 20 }}>Cargando...</div>
          ) : tickets.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: 20, textAlign: 'center', fontSize: 13, color: TEXT_MUTED }}>
              Todavía no has enviado ninguna consulta
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tickets.map((t) => {
                const color = ESTADO_COLOR[t.estado];
                return (
                  <div key={t.id} style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{t.asunto}</div>
                      <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 999, fontWeight: 700, background: color.bg, color: color.text, flexShrink: 0 }}>
                        {ESTADO_LABEL[t.estado]}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 8 }}>{formatearFecha(t.creadoEn)}</div>
                    <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{t.mensaje}</div>

                    {t.respuesta && (
                      <div style={{ marginTop: 10, background: '#EAF0FF', borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1F7CFF', marginBottom: 4 }}>Respuesta de Oplora:</div>
                        <div style={{ fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{t.respuesta}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputEstilo: React.CSSProperties = {
  fontSize: 13, padding: '10px 12px', borderRadius: 10, border: '1px solid #E5E7EB',
  outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', background: '#F9FAFB',
};
