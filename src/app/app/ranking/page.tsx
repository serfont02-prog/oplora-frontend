'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

const NIVELES = [
  { value: '', label: 'Todos' },
  { value: '1', label: 'Iniciado' },
  { value: '2', label: 'Aprendiz' },
  { value: '3', label: 'Avanzado' },
  { value: '4', label: 'Experto' },
  { value: '5', label: 'Maestro' },
];

const NIVEL_EMOJI: Record<number, string> = {
  1: '🌱', 2: '📚', 3: '⚡', 4: '🎯', 5: '🏆',
};

export default function RankingPage() {
  const router = useRouter();
  const { usuario, cargando } = useAuth();
  const [tab, setTab] = useState<'general' | 'retos'>('general');
  const [nivelFiltro, setNivelFiltro] = useState('');

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  const { data: oposiciones = [] } = useQuery({
    queryKey: ['oposiciones-ranking'],
    queryFn: async () => {
      const res = await api.get('/oposiciones');
      return res.data;
    },
    enabled: !!usuario,
  });

  const oposicionId = oposiciones[0]?.id;

  const { data: rankingGeneral = [], isLoading: loadingGeneral } = useQuery({
    queryKey: ['ranking-general', oposicionId, nivelFiltro],
    queryFn: async () => {
      const params = nivelFiltro ? `?nivel=${nivelFiltro}` : '';
      const res = await api.get(`/retos/ranking/oposicion/${oposicionId}${params}`);
      return res.data;
    },
    enabled: !!oposicionId && tab === 'general',
  });

  const { data: rankingRetos = [], isLoading: loadingRetos } = useQuery({
    queryKey: ['ranking-retos', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/retos/ranking/retos/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId && tab === 'retos',
  });

  const miPosicionGeneral = rankingGeneral.findIndex(
    (u: any) => u.id === (usuario as any)?.id
  ) + 1;

  if (cargando) return null;

  const oposicionActual = oposiciones[0];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: '72px' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '0 1.25rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <button
          onClick={() => router.push('/app/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          Inicio
        </button>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>Ranking</span>
        <span />
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', position: 'sticky', top: '52px', zIndex: 9 }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex' }}>
          {[
            { key: 'general', label: '🏆 General' },
            { key: 'retos', label: '⚡ Retos' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              style={{ flex: 1, padding: '12px 4px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: tab === key ? 600 : 400, color: tab === key ? '#111827' : '#9ca3af', borderBottom: tab === key ? '2px solid #111827' : '2px solid transparent' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.25rem' }}>

        {/* Info oposición */}
        {oposicionActual && (
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '1rem', textAlign: 'center' }}>
            {oposicionActual.nombre}
          </div>
        )}

        {/* TAB GENERAL */}
        {tab === 'general' && (
          <div>
            {/* Mi posición */}
            {miPosicionGeneral > 0 && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '10px 14px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '13px', color: '#1d4ed8', fontWeight: 500 }}>Tu posición actual</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#1d4ed8' }}>#{miPosicionGeneral}</div>
              </div>
            )}

            {/* Filtro nivel */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '2px' }}>
              {NIVELES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setNivelFiltro(value)}
                  style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', border: nivelFiltro === value ? 'none' : '1px solid #e5e7eb', background: nivelFiltro === value ? '#111827' : 'white', color: nivelFiltro === value ? 'white' : '#6b7280' }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Lista */}
            {loadingGeneral ? (
              <div style={{ textAlign: 'center', padding: '2rem', fontSize: '13px', color: '#9ca3af' }}>Cargando...</div>
            ) : rankingGeneral.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏆</div>
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>Sin datos todavía para este nivel</div>
              </div>
            ) : (
              <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', overflow: 'hidden' }}>
                {rankingGeneral.map((u: any, i: number) => {
                  const esMiUsuario = u.id === (usuario as any)?.id;
                  return (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 14px',
                        borderBottom: i < rankingGeneral.length - 1 ? '1px solid #f9fafb' : 'none',
                        background: esMiUsuario ? '#eff6ff' : 'white',
                      }}
                    >
                      {/* Posición */}
                      <div style={{ minWidth: '28px', textAlign: 'center' }}>
                        {i === 0 ? <span style={{ fontSize: '18px' }}>🥇</span>
                          : i === 1 ? <span style={{ fontSize: '18px' }}>🥈</span>
                          : i === 2 ? <span style={{ fontSize: '18px' }}>🥉</span>
                          : <span style={{ fontSize: '12px', fontWeight: 500, color: '#9ca3af' }}>#{i + 1}</span>
                        }
                      </div>

                      {/* Avatar */}
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: esMiUsuario ? '#dbeafe' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: esMiUsuario ? '#1d4ed8' : '#6b7280', flexShrink: 0 }}>
                        {(u.nick ?? u.nombre ?? '?').charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: esMiUsuario ? 600 : 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.nick ?? u.nombre}
                          {esMiUsuario && <span style={{ fontSize: '11px', color: '#3b82f6', marginLeft: '5px' }}>(tú)</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                          {NIVEL_EMOJI[u.nivel]} Nivel {u.nivel} · {u.testsSuperados} tests superados
                        </div>
                      </div>

                      {/* Puntos */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{u.puntos}</div>
                        <div style={{ fontSize: '10px', color: '#9ca3af' }}>puntos</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB RETOS */}
        {tab === 'retos' && (
          <div>
            {loadingRetos ? (
              <div style={{ textAlign: 'center', padding: '2rem', fontSize: '13px', color: '#9ca3af' }}>Cargando...</div>
            ) : rankingRetos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
                <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '1rem' }}>Sin retos completados todavía</div>
                <button
                  onClick={() => router.push('/app/retos')}
                  style={{ padding: '9px 18px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Ir a retos →
                </button>
              </div>
            ) : (
              <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', overflow: 'hidden' }}>
                {rankingRetos.map((entry: any, i: number) => {
                  const u = entry.usuario;
                  const esMiUsuario = u?.id === (usuario as any)?.id;
                  const ratio = entry.total > 0 ? Math.round((entry.victorias / entry.total) * 100) : 0;
                  return (
                    <div
                      key={u?.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 14px',
                        borderBottom: i < rankingRetos.length - 1 ? '1px solid #f9fafb' : 'none',
                        background: esMiUsuario ? '#eff6ff' : 'white',
                      }}
                    >
                      {/* Posición */}
                      <div style={{ minWidth: '28px', textAlign: 'center' }}>
                        {i === 0 ? <span style={{ fontSize: '18px' }}>🥇</span>
                          : i === 1 ? <span style={{ fontSize: '18px' }}>🥈</span>
                          : i === 2 ? <span style={{ fontSize: '18px' }}>🥉</span>
                          : <span style={{ fontSize: '12px', fontWeight: 500, color: '#9ca3af' }}>#{i + 1}</span>
                        }
                      </div>

                      {/* Avatar */}
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: esMiUsuario ? '#dbeafe' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: esMiUsuario ? '#1d4ed8' : '#6b7280', flexShrink: 0 }}>
                        {(u?.nick ?? u?.nombre ?? '?').charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: esMiUsuario ? 600 : 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u?.nick ?? u?.nombre}
                          {esMiUsuario && <span style={{ fontSize: '11px', color: '#3b82f6', marginLeft: '5px' }}>(tú)</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                          {entry.victorias}V · {entry.derrotas}D · {ratio}% victorias
                        </div>
                      </div>

                      {/* Victorias */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#15803d' }}>{entry.victorias}</div>
                        <div style={{ fontSize: '10px', color: '#9ca3af' }}>victorias</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Navegación inferior */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #f3f4f6', display: 'flex', zIndex: 10 }}>
        {[
          { label: 'Inicio', icon: '🏠', path: '/app/dashboard', active: false },
          { label: 'Retos', icon: '⚡', path: '/app/retos', active: false },
          { label: 'Ranking', icon: '🏆', path: '/app/ranking', active: true },
          { label: 'Alertas', icon: '🔔', path: '/app/alertas', active: false },
        ].map(({ label, icon, path, active }) => (
          <button
            key={label}
            onClick={() => router.push(path)}
            style={{ flex: 1, padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', border: 'none', background: 'none', cursor: 'pointer', borderTop: active ? '2px solid #111827' : '2px solid transparent', marginTop: '-1px' }}
          >
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <span style={{ fontSize: '10px', color: active ? '#111827' : '#9ca3af', fontWeight: active ? 500 : 400 }}>{label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}