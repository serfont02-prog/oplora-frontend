'use client';

// ⭐ Invitar por email (desde Retos y desde Ajustes → "Invitar a un amigo"). El servidor decide qué
// email toca: no tiene cuenta → a OPLORA; tiene cuenta en otra oposición → a esta oposición;
// misma oposición pero otra convocatoria → que se pase a la tuya. También se puede compartir el
// enlace por WhatsApp u otras apps.

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Send, Share2, CheckCircle2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, COLOR_RETOS, COLOR_RETOS_BG } from '@/styles/tokens';

const SOMBRA = '0 6px 18px rgba(15, 23, 42, 0.08)';

const TEXTO_TIPO: Record<string, (nombre?: string) => string> = {
  app: () => 'Aún no usa OPLORA: le enviaremos una invitación para crear su cuenta.',
  oposicion: (n) => `${n ?? 'Esta persona'} ya usa OPLORA pero en otra oposición: le invitaremos a añadir la tuya.`,
  convocatoria: (n) => `${n ?? 'Esta persona'} prepara tu oposición en otra convocatoria: le avisaremos para que se pase a la tuya.`,
};

export default function FormInvitar({
  oposicionId, oposicionNombre, destinoInicial = '', motivo = 'amigo', onEnviado, compacto = false,
}: {
  oposicionId?: string; oposicionNombre?: string; destinoInicial?: string; motivo?: 'reto' | 'amigo'; onEnviado?: () => void; compacto?: boolean;
}) {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const [destino, setDestino] = useState(destinoInicial);
  const [debounced, setDebounced] = useState(destinoInicial.trim());
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [enviadoA, setEnviadoA] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(destino.trim()), 450);
    return () => clearTimeout(t);
  }, [destino]);

  const { data: estado, isFetching } = useQuery({
    queryKey: ['invitacion-estado', debounced, oposicionId],
    queryFn: async () => (await api.get('/invitaciones/estado', { params: { destino: debounced, oposicionId } })).data,
    enabled: debounced.length >= 3,
    staleTime: 30_000,
  });

  const enviar = async () => {
    setEnviando(true);
    setError('');
    try {
      await api.post('/invitaciones', { destino: destino.trim(), oposicionId, motivo, mensaje: mensaje.trim() || undefined });
      setEnviadoA(destino.trim());
      setDestino('');
      setMensaje('');
      queryClient.invalidateQueries({ queryKey: ['invitaciones-mias'] });
      onEnviado?.();
    } catch (e: any) {
      const m = e?.response?.data?.message;
      setError(typeof m === 'string' ? m : 'No se ha podido enviar la invitación.');
    } finally {
      setEnviando(false);
    }
  };

  const compartirEnlace = async () => {
    const url = `https://oplora.app/app/registro${usuario?.nick ? `?ref=${encodeURIComponent(usuario.nick)}` : ''}`;
    const texto = `Estoy preparando ${oposicionNombre ?? 'mi oposición'} con OPLORA. ¡Únete y nos retamos!`;
    try {
      if (navigator.share) await navigator.share({ title: 'OPLORA', text: texto, url });
      else { await navigator.clipboard.writeText(`${texto} ${url}`); setError(''); setEnviadoA('enlace'); }
    } catch { /* compartir cancelado */ }
  };

  const textoEstado = estado
    ? estado.puedeInvitar
      ? TEXTO_TIPO[estado.tipo]?.(estado.nombre)
      : estado.motivo === 'nick_desconocido' ? 'No hay nadie con ese nick. Escribe su email para invitarle.'
      : estado.motivo === 'ya_esta' ? `${estado.nombre ?? 'Esta persona'} ya prepara tu oposición y convocatoria: rétale directamente.`
      : estado.motivo === 'tu_mismo' ? 'Ese eres tú.'
      : estado.motivo === 'ya_tiene_cuenta' ? 'Esa persona ya usa OPLORA.'
      : null
    : null;
  const puede = !!estado?.puedeInvitar && debounced === destino.trim();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {enviadoA && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F0FDF4', borderRadius: 14, padding: '10px 12px' }}>
          <CheckCircle2 size={18} color="#16A34A" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, color: '#166534', fontWeight: 600 }}>
            {enviadoA === 'enlace' ? 'Enlace copiado. Pégalo donde quieras.' : `Invitación enviada a ${enviadoA}`}
          </span>
          <button onClick={() => setEnviadoA(null)} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', display: 'flex' }}><X size={15} /></button>
        </div>
      )}

      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_SECONDARY, display: 'block', marginBottom: 6 }}>Email o nick</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', borderRadius: 12, padding: '0 12px', boxShadow: SOMBRA }}>
          <Mail size={16} color={TEXT_MUTED} style={{ flexShrink: 0 }} />
          <input
            type="text"
            inputMode="email"
            autoCapitalize="none"
            value={destino}
            onChange={(e) => { setDestino(e.target.value); setError(''); }}
            placeholder="amigo@email.com"
            style={{ flex: 1, minWidth: 0, padding: '12px 0', fontSize: 14, border: 'none', outline: 'none', background: 'transparent', color: TEXT_PRIMARY }}
          />
        </div>
        {destino.trim().length >= 3 && (
          <div style={{ fontSize: 12, color: estado?.puedeInvitar ? TEXT_SECONDARY : '#B45309', marginTop: 6, lineHeight: 1.4 }}>
            {isFetching || debounced !== destino.trim() ? 'Comprobando…' : textoEstado}
          </div>
        )}
      </div>

      {!compacto && (
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_SECONDARY, display: 'block', marginBottom: 6 }}>
            Mensaje <span style={{ color: TEXT_MUTED, fontWeight: 400 }}>(opcional)</span>
          </label>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            maxLength={300}
            placeholder="¿Nos preparamos juntos la oposición?"
            style={{ width: '100%', minHeight: 64, padding: '10px 12px', fontSize: 13, border: 'none', borderRadius: 12, outline: 'none', boxSizing: 'border-box', background: 'white', boxShadow: SOMBRA, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>
      )}

      {error && <div style={{ fontSize: 12, color: '#B91C1C', background: '#FEF2F2', borderRadius: 10, padding: '8px 10px' }}>{error}</div>}

      <button
        onClick={enviar}
        disabled={!puede || enviando}
        style={{ width: '100%', padding: 12, background: '#0f172a', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: puede ? 'pointer' : 'default', opacity: puede && !enviando ? 1 : 0.45, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <Send size={15} /> {enviando ? 'Enviando…' : 'Enviar invitación por email'}
      </button>
      <button
        onClick={compartirEnlace}
        style={{ width: '100%', padding: 11, background: 'white', color: TEXT_PRIMARY, border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <Share2 size={15} color={COLOR_RETOS} /> Compartir enlace por otra app
      </button>
    </div>
  );
}

/** Ventana con el formulario (para usarla desde Retos). */
export function ModalInvitar({ onClose, ...props }: React.ComponentProps<typeof FormInvitar> & { onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: '1rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#FCEEE8', borderRadius: 20, padding: '1.25rem', width: '100%', maxWidth: 400, maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: COLOR_RETOS_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Mail size={20} color={COLOR_RETOS} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Invitar para retar</div>
            <div style={{ fontSize: 12, color: TEXT_MUTED }}>Le escribiremos de tu parte</div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'white', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color={TEXT_SECONDARY} />
          </button>
        </div>
        <FormInvitar {...props} />
      </div>
    </div>
  );
}
