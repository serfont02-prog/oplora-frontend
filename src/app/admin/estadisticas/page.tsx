'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Users, TrendingUp, CreditCard, UserCheck } from 'lucide-react';

const SUSCRIPCION_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  gratuito: { bg: '#F3F4F6', color: '#6B7280', label: 'Gratuito' },
  esencial: { bg: '#E6F1FB', color: '#185FA5', label: 'Esencial' },
  profesional: { bg: '#EEEDFE', color: '#3C3489', label: 'Profesional' },
};

const NIVEL_LABEL: Record<number, string> = {
  1: 'Iniciado', 2: 'Aprendiz', 3: 'Avanzado', 4: 'Experto', 5: 'Maestro',
};

const NIVEL_COLOR: Record<number, string> = {
  1: '#9ca3af', 2: '#3b82f6', 3: '#f97316', 4: '#8b5cf6', 5: '#eab308',
};

export default function EstadisticasAdminPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-estadisticas'],
    queryFn: async () => {
      const res = await api.get('/usuarios/estadisticas');
      return res.data;
    },
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios-admin'],
    queryFn: async () => {
      const res = await api.get('/usuarios');
      return res.data;
    },
  });

  if (isLoading) return (
    <div className="p-6 text-[13px] text-gray-400">Cargando estadísticas...</div>
  );

  const tasaConversion = stats?.total > 0
    ? Math.round((stats.conSuscripcion / stats.total) * 100)
    : 0;

  // Últimos 10 registros
  const ultimosUsuarios = [...usuarios]
    .sort((a: any, b: any) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
    .slice(0, 10);

  return (
    <div className="flex flex-col h-full overflow-auto">

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white">
        <div className="text-[15px] font-medium text-gray-900">Estadísticas</div>
        <div className="text-[12px] text-gray-400 mt-0.5">Visión global de la plataforma</div>
      </div>

      <div className="p-6">

        {/* Métricas principales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
          {[
            { icon: Users, label: 'Usuarios totales', value: stats?.total ?? 0, color: '#3b82f6', bg: '#eff6ff' },
            { icon: CreditCard, label: 'Con suscripción', value: stats?.conSuscripcion ?? 0, color: '#15803d', bg: '#f0fdf4' },
            { icon: UserCheck, label: 'Tasa conversión', value: `${tasaConversion}%`, color: '#8b5cf6', bg: '#f5f3ff' },
            { icon: TrendingUp, label: 'Nuevos hoy', value: stats?.nuevosHoy ?? 0, color: '#f97316', bg: '#fff7ed' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <Icon size={16} color={color} />
              </div>
              <div style={{ fontSize: '22px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>{value}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.5rem' }}>

          {/* Registro de usuarios */}
          <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '1rem' }}>Nuevos registros</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Hoy', value: stats?.nuevosHoy ?? 0 },
                { label: 'Últimos 7 días', value: stats?.nuevos7dias ?? 0 },
                { label: 'Últimos 30 días', value: stats?.nuevos30dias ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '80px', height: '4px', background: '#f3f4f6', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${stats?.nuevos30dias > 0 ? (value / stats.nuevos30dias) * 100 : 0}%`, height: '100%', background: '#3b82f6', borderRadius: '2px' }} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827', minWidth: '20px', textAlign: 'right' }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Por suscripción */}
          <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '1rem' }}>Por suscripción</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>Sin suscripción</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '80px', height: '4px', background: '#f3f4f6', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${stats?.total > 0 ? (stats.sinSuscripcion / stats.total) * 100 : 0}%`, height: '100%', background: '#e5e7eb', borderRadius: '2px' }} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827', minWidth: '20px', textAlign: 'right' }}>{stats?.sinSuscripcion ?? 0}</span>
                </div>
              </div>
              {(stats?.porSuscripcion ?? []).map((p: any) => {
                const config = SUSCRIPCION_COLORS[p.suscripcion] ?? { bg: '#f3f4f6', color: '#6b7280', label: p.suscripcion };
                return (
                  <div key={p.suscripcion} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: config.bg, color: config.color, fontWeight: 500 }}>
                      {config.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '80px', height: '4px', background: '#f3f4f6', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${stats?.total > 0 ? (parseInt(p.total) / stats.total) * 100 : 0}%`, height: '100%', background: config.color, borderRadius: '2px' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827', minWidth: '20px', textAlign: 'right' }}>{p.total}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Por nivel */}
        <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '1rem' }}>Distribución por nivel</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(stats?.porNivel ?? []).map((n: any) => {
              const pct = stats?.total > 0 ? Math.round((parseInt(n.total) / stats.total) * 100) : 0;
              const color = NIVEL_COLOR[parseInt(n.nivel)] ?? '#9ca3af';
              return (
                <div key={n.nivel} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '6px' }}>
                    <div style={{ width: '100%', background: color, borderRadius: '4px 4px 0 0', height: `${Math.max(pct, 4)}%`, opacity: 0.8, transition: 'height 0.3s' }} />
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#111827' }}>{n.total}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>Nv.{n.nivel}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>{NIVEL_LABEL[parseInt(n.nivel)]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Últimos registros */}
        <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f9fafb', fontSize: '13px', fontWeight: 500, color: '#111827' }}>
            Últimos registros
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {ultimosUsuarios.map((u: any, i: number) => (
                <tr
                  key={u.id}
                  style={{ borderBottom: i < ultimosUsuarios.length - 1 ? '1px solid #f9fafb' : 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                >
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
                      {u.nick ? `@${u.nick}` : u.nombre}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {u.suscripcion ? (
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: SUSCRIPCION_COLORS[u.suscripcion]?.bg ?? '#f3f4f6', color: SUSCRIPCION_COLORS[u.suscripcion]?.color ?? '#6b7280', fontWeight: 500 }}>
                        {SUSCRIPCION_COLORS[u.suscripcion]?.label ?? u.suscripcion}
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>Sin suscripción</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '11px', color: '#9ca3af', textAlign: 'right' }}>
                    {new Date(u.creadoEn).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}