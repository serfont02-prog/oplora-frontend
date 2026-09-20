'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { api } from '@/lib/api';

type EstadoTicket = 'abierto' | 'respondido' | 'cerrado';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
}

interface TicketSoporte {
  id: string;
  usuario: Usuario;
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
  abierto: { bg: '#fef2f2', text: '#dc2626' },
  respondido: { bg: '#f0fdf4', text: '#15803d' },
  cerrado: { bg: '#f3f4f6', text: '#6b7280' },
};

function formatearFecha(fecha: string): string {
  const d = new Date(fecha);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function ModalResponder({ ticket, onClose }: { ticket: TicketSoporte; onClose: () => void }) {
  const qc = useQueryClient();
  const [respuesta, setRespuesta] = useState(ticket.respuesta ?? '');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const invalidar = () => qc.invalidateQueries({ queryKey: ['tickets-soporte-admin'] });

  const mutResponder = useMutation({
    mutationFn: () => api.patch(`/soporte/${ticket.id}/responder`, { respuesta }),
    onSuccess: () => {
      invalidar();
      onClose();
    },
  });

  const mutCerrar = useMutation({
    mutationFn: () => api.patch(`/soporte/${ticket.id}/cerrar`),
    onSuccess: () => {
      invalidar();
      onClose();
    },
  });

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1.25rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 14, padding: 24, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxSizing: 'border-box' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', lineHeight: 1.35 }}>{ticket.asunto}</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
              {ticket.usuario?.nombre} · {ticket.usuario?.email} · {formatearFecha(ticket.creadoEn)}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 2, display: 'flex' }} aria-label="Cerrar">
            <X size={18} color="#9ca3af" />
          </button>
        </div>

        <div style={{ background: '#f9fafb', borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{ticket.mensaje}</div>
        </div>

        <label style={labelEstilo}>
          Respuesta
          <textarea
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            style={{ ...inputEstilo, minHeight: 120 }}
            placeholder="Escribe tu respuesta..."
          />
        </label>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {ticket.estado === 'respondido' && (
            <button
              onClick={() => mutCerrar.mutate()}
              disabled={mutCerrar.isPending}
              style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', fontSize: 13, cursor: 'pointer', color: '#374151' }}
            >
              Cerrar ticket
            </button>
          )}
          <button
            onClick={() => mutResponder.mutate()}
            disabled={!respuesta.trim() || mutResponder.isPending}
            style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#111827', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: (!respuesta.trim() || mutResponder.isPending) ? 0.6 : 1 }}
          >
            {mutResponder.isPending ? 'Enviando...' : 'Enviar respuesta'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSoportePage() {
  const [filtroEstado, setFiltroEstado] = useState<EstadoTicket | ''>('');
  const [ticketAbierto, setTicketAbierto] = useState<TicketSoporte | null>(null);

  const { data: tickets = [], isLoading } = useQuery<TicketSoporte[]>({
    queryKey: ['tickets-soporte-admin', filtroEstado],
    queryFn: async () => (await api.get('/soporte', { params: { estado: filtroEstado || undefined } })).data,
  });

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Soporte</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{tickets.length} tickets</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {([
          { valor: '', label: 'Todos' },
          { valor: 'abierto', label: 'Abiertos' },
          { valor: 'respondido', label: 'Respondidos' },
          { valor: 'cerrado', label: 'Cerrados' },
        ] as const).map((op) => (
          <button
            key={op.valor}
            onClick={() => setFiltroEstado(op.valor)}
            style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              border: filtroEstado === op.valor ? '1px solid #111827' : '1px solid #e5e7eb',
              background: filtroEstado === op.valor ? '#111827' : 'white',
              color: filtroEstado === op.valor ? 'white' : '#374151',
            }}
          >
            {op.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: 12, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '2rem', fontSize: 13, color: '#9ca3af' }}>Cargando...</div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>No hay tickets con estos filtros</div>
        ) : (
          tickets.map((t) => {
            const color = ESTADO_COLOR[t.estado];
            return (
              <div
                key={t.id}
                onClick={() => setTicketAbierto(t)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{t.asunto}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    {t.usuario?.nombre} · {t.usuario?.email} · {formatearFecha(t.creadoEn)}
                  </div>
                </div>
                <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 500, background: color.bg, color: color.text }}>
                  {ESTADO_LABEL[t.estado]}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setTicketAbierto(t); }}
                  style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: '#374151', flexShrink: 0 }}
                >
                  Responder
                </button>
              </div>
            );
          })
        )}
      </div>

      {ticketAbierto && <ModalResponder ticket={ticketAbierto} onClose={() => setTicketAbierto(null)} />}
    </div>
  );
}

const inputEstilo: React.CSSProperties = { fontSize: 13, padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };
const labelEstilo: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 500, color: '#374151' };
