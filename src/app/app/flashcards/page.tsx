'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import { FooterNavegacion } from '@/app/app/dashboard/page';

export default function FlashcardsPage() {
  const router = useRouter();
  const { usuario, cargando } = useAuth();
  const [modalConfig, setModalConfig] = useState(false);
  const [numFlashcards, setNumFlashcards] = useState(10);
  const [modalTemas, setModalTemas] = useState(false);
    const oposicionId = usuario?.oposicionActiva?.id;

const { data: convocatorias = [] } = useQuery({
  queryKey: ['convocatorias-fc', oposicionId],
  queryFn: async () => {
    const res = await api.get(`/convocatorias/oposicion/${oposicionId}`);
    return res.data;
  },
  enabled: !!oposicionId,
});

const convocatoria = convocatorias.find((c: any) => c.estado === 'activa') ?? convocatorias[0];

const { data: temas = [] } = useQuery({
  queryKey: ['temas-fc', convocatoria?.id],
  queryFn: async () => {
    const res = await api.get(`/temas/convocatoria/${convocatoria.id}`);
    return res.data;
  },
  enabled: !!convocatoria?.id && modalTemas,
});

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);



  const { data: stats } = useQuery({
    queryKey: ['stats-fc', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/flashcards/stats/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId,
  });

  const { data: pendientes = [] } = useQuery({
    queryKey: ['pendientes-fc', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/flashcards/pendientes/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId,
  });

  if (cargando) return null;

  const TIPO_LABEL: Record<string, string> = {
    vf: 'V/F',
    hueco: 'Hueco',
    trampa: 'Trampa',
    articulo: '¿Qué artículo?',
  };

  const NIVEL_COLOR: Record<string, string> = {
    basico: '#15803d',
    medio: '#d97706',
    alto: '#dc2626',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '0 1.25rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <button
          onClick={() => router.push('/app/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          Inicio
        </button>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>Flashcards</span>
        <span />
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.25rem' }}>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1rem' }}>
            {[
              { label: 'Total', value: stats.total, color: '#6b7280' },
              { label: 'Dominadas', value: stats.dominadas, color: '#15803d' },
              { label: 'Dudosas', value: stats.dudosas, color: '#d97706' },
              { label: 'Sin ver', value: stats.sinVer, color: '#9ca3af' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color }}>{value}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Barra progreso */}
        {stats && stats.total > 0 && (
          <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: '#111827' }}>Progreso total</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>{Math.round((stats.dominadas / stats.total) * 100)}% dominadas</div>
            </div>
            <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${(stats.dominadas / stats.total) * 100}%`, background: '#15803d', transition: 'width 0.5s' }} />
              <div style={{ width: `${(stats.dudosas / stats.total) * 100}%`, background: '#fbbf24', transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '10px', color: '#9ca3af' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#15803d' }} /> Dominadas
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#fbbf24' }} /> Dudosas
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f3f4f6' }} /> Sin ver
              </span>
            </div>
          </div>
        )}

        {/* ⭐ Empezar repaso CON botón configurar */}
        <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '1.25rem', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Pendientes de repasar</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: pendientes.length > 0 ? '#fef2f2' : '#f0fdf4', color: pendientes.length > 0 ? '#dc2626' : '#15803d', fontWeight: 500 }}>
                {pendientes.length} FC
              </span>
              <button
                onClick={() => setModalConfig(true)}
                style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '4px 8px', fontSize: '11px', color: '#6b7280', cursor: 'pointer' }}
              >
                ⚙️ Configurar
              </button>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
            {pendientes.length === 0
              ? '¡Al día! No tienes flashcards pendientes de repasar'
              : `Tienes ${pendientes.length} flashcards que necesitan repaso`}
          </div>
          <button
            onClick={() => pendientes.length > 0 && router.push(`/app/flashcards/repasar?oposicionId=${oposicionId}&n=${numFlashcards}`)}
            disabled={pendientes.length === 0}
            style={{ width: '100%', padding: '10px', background: pendientes.length > 0 ? '#111827' : '#f3f4f6', color: pendientes.length > 0 ? 'white' : '#9ca3af', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: pendientes.length > 0 ? 'pointer' : 'not-allowed' }}
          >
            {pendientes.length > 0 ? '▶ Empezar repaso' : '✓ Todo al día'}
          </button>
        </div>

          {/* Estudiar por tema */}
          <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '1.25rem', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Estudiar por tema</div>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Empieza desde cero</span>
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
              Elige un tema y estudia todas sus flashcards
            </div>
            <button
              onClick={() => setModalTemas(true)}
              disabled={!oposicionId}
              style={{ width: '100%', padding: '10px', background: '#1F7CFF', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              📚 Elegir tema
            </button>
          </div>


        {/* Preview pendientes */}
        {pendientes.length > 0 && (
          <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #f9fafb', fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Próximas a repasar
            </div>
            {pendientes.slice(0, 5).map((fc: any, i: number) => (
              <div key={fc.id} style={{ padding: '10px 14px', borderBottom: i < 4 ? '1px solid #f9fafb' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fc.pregunta}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: '#f3f4f6', color: '#6b7280' }}>
                      {TIPO_LABEL[fc.tipo] ?? fc.tipo}
                    </span>
                    <span style={{ fontSize: '10px', color: NIVEL_COLOR[fc.nivel] ?? '#6b7280', fontWeight: 500 }}>
                      {fc.nivel}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Duelo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => router.push('/app/retos')}
            style={{ width: '100%', padding: '12px', background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', fontSize: '13px', color: '#111827', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🃏</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>Duelo de flashcards</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>Reta a un amigo con V/F y ¿Qué artículo?</div>
              </div>
            </div>
            <span style={{ color: '#d1d5db' }}>›</span>
          </button>
        </div>

      </div>

      {/* ⭐ Footer compartido */}
      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} />

      {/* ⭐ Modal configurar — fuera del scroll pero dentro del componente */}
      {modalConfig && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Configurar repaso</div>
              <button onClick={() => setModalConfig(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af' }}>×</button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '8px' }}>Número de flashcards</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[5, 10, 20, 30].map(n => (
                  <button
                    key={n}
                    onClick={() => setNumFlashcards(n)}
                    style={{
                      padding: '8px 16px', borderRadius: '999px', fontSize: '13px',
                      border: numFlashcards === n ? 'none' : '1px solid #e5e7eb',
                      background: numFlashcards === n ? '#0f172a' : 'white',
                      color: numFlashcards === n ? 'white' : '#374151',
                      fontWeight: numFlashcards === n ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setModalConfig(false);
                router.push(`/app/flashcards/repasar?oposicionId=${oposicionId}&n=${numFlashcards}`);
              }}
              disabled={pendientes.length === 0}
              style={{ width: '100%', padding: '13px', background: pendientes.length > 0 ? '#0f172a' : '#e5e7eb', color: pendientes.length > 0 ? 'white' : '#9ca3af', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: pendientes.length > 0 ? 'pointer' : 'not-allowed' }}
            >
              Empezar repaso ({Math.min(numFlashcards, pendientes.length)} FC)
            </button>
          </div>
        </div>
      )}

      {/* Modal temas */}
{modalTemas && (
  <div
    onClick={() => setModalTemas(false)}
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', width: '100%', maxWidth: '480px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Elegir tema</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Estudia las flashcards de un tema</div>
        </div>
        <button
          onClick={() => setModalTemas(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af' }}
        >
          ×
        </button>
      </div>

      {temas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '13px' }}>
          Cargando temas...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {temas.map((tema: any) => (
            <button
              key={tema.id}
              onClick={() => {
                setModalTemas(false);
                router.push(`/app/flashcards/repasar?temaId=${tema.id}&oposicionId=${oposicionId}`);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: '10px', textAlign: 'left',
                border: '1px solid #f3f4f6', background: 'white',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#f3f4f6'; }}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: '#EFF6FF', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
                fontSize: '12px', fontWeight: 700, color: '#185FA5',
              }}>
                {tema.numero}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: '#111827', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tema.titulo}
                </div>
              </div>
              <span style={{ fontSize: '12px', color: '#d1d5db', flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
)}

    </div>
  );
}