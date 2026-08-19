'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, ChevronRight, Bell, RefreshCw, Share2, Download, LogOut } from 'lucide-react';

const BG_APP = '#F4F5F7';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

export default function AjustesOposicionPage() {
  const params = useParams();
  const router = useRouter();
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const oposicionId = params.id as string;

  const [modalAbandonar, setModalAbandonar] = useState(false);
  const [notificaciones, setNotificaciones] = useState(true);

  const { data: oposicion } = useQuery({
    queryKey: ['oposicion', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/oposiciones/${oposicionId}`);
      return res.data;
    },
  });

  const abandonar = useMutation({
    mutationFn: async () => {
      await api.delete(`/usuarios/oposiciones/${oposicionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      router.push('/app/dashboard');
    },
  });

  const exportarProgreso = async () => {
    const res = await api.get(`/usuarios/exportar-progreso/${oposicionId}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `progreso-${oposicion?.nombre ?? 'oplora'}.pdf`;
    a.click();
  };

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 40 }}>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem' }}>

        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY, fontSize: 13, marginBottom: 16 }}
        >
          <ArrowLeft size={15} />
          Atrás
        </button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Ajustes
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>
            {oposicion?.nombre ?? 'Tu oposición'}
          </div>
        </div>

        {/* Cambiar oposición / convocatoria */}
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <button
            onClick={() => router.push('/app/onboarding/oposicion')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: 'none', border: 'none', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EAF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <RefreshCw size={16} color="#1F7CFF" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>Cambiar de oposición</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 1 }}>Requiere plan de pago</div>
            </div>
            <ChevronRight size={14} color="#D1D5DB" />
          </button>

          <button
            onClick={() => router.push(`/app/oposicion/${oposicionId}/cambiar-convocatoria`)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EAF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <RefreshCw size={16} color="#1F7CFF" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>Cambiar de convocatoria</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 1 }}>Solo a convocatorias más recientes</div>
            </div>
            <ChevronRight size={14} color="#D1D5DB" />
          </button>
        </div>

        {/* Notificaciones */}
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FDF4E3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bell size={16} color="#D4A017" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>Notificaciones</div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 1 }}>Avisos de esta oposición</div>
          </div>
          <button
            onClick={() => setNotificaciones(!notificaciones)}
            style={{ width: 40, height: 22, borderRadius: 999, flexShrink: 0, background: notificaciones ? '#111827' : '#e5e7eb', position: 'relative', border: 'none', cursor: 'pointer' }}
          >
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: notificaciones ? 21 : 3, transition: 'left 0.2s' }} />
          </button>
        </div>

        {/* Compartir + exportar */}
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <button
            onClick={() => router.push('/app/retos')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: 'none', border: 'none', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F0FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Share2 size={16} color="#8B5CF6" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>Invitar a un amigo</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 1 }}>Compite juntos en retos</div>
            </div>
            <ChevronRight size={14} color="#D1D5DB" />
          </button>

          <button
            onClick={exportarProgreso}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFFADE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Download size={16} color="#4D7C0F" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>Exportar mi progreso</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 1 }}>Descarga un resumen en PDF</div>
            </div>
            <ChevronRight size={14} color="#D1D5DB" />
          </button>
        </div>

        {/* Abandonar */}
        <button
          onClick={() => setModalAbandonar(true)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 13, background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, color: '#dc2626', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          <LogOut size={16} />
          Abandonar esta oposición
        </button>

      </div>

      {modalAbandonar && (
        <div
          onClick={() => setModalAbandonar(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'white', borderRadius: 20, padding: '1.5rem', width: '100%', maxWidth: 340, textAlign: 'center' }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6 }}>
              ¿Abandonar esta oposición?
            </div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 18 }}>
              Tu progreso se conservará, pero dejará de aparecer en tu inicio
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setModalAbandonar(false)}
                style={{ flex: 1, padding: 12, background: 'white', color: TEXT_SECONDARY, border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => abandonar.mutate()}
                disabled={abandonar.isPending}
                style={{ flex: 1, padding: 12, background: '#dc2626', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                {abandonar.isPending ? 'Saliendo...' : 'Abandonar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}