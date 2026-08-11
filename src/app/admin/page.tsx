'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { FileText, BookOpen, Users, BarChart2, ChevronRight, TrendingUp } from 'lucide-react';

export default function AdminHomePage() {
  const router = useRouter();

  const { data: stats } = useQuery({
    queryKey: ['admin-estadisticas'],
    queryFn: async () => {
      const res = await api.get('/usuarios/estadisticas');
      return res.data;
    },
  });

  const { data: oposiciones = [] } = useQuery({
  queryKey: ['oposiciones-admin-dashboard'],
  queryFn: async () => {
    const res = await api.get('/oposiciones');
    return res.data;
  },
});

  const { data: leyes = [] } = useQuery({
    queryKey: ['leyes-admin'],
    queryFn: async () => {
      const res = await api.get('/leyes');
      return res.data;
    },
  });

  const { data: tareas } = useQuery({
  queryKey: ['tareas-pendientes'],
  queryFn: async () => {
    const res = await api.get('/boe/tareas-pendientes');
    return res.data;
  },
  });

  const accesos = [
    {
      href: '/admin/oposiciones',
      icon: FileText,
      label: 'Oposiciones',
      value: oposiciones.filter((o: any) => (o.convocatoriasActivas ?? 0) > 0).length,
      sublabel: 'oposiciones activas',
      color: '#3b82f6',
      bg: '#eff6ff',
    },
    {
      href: '/admin/leyes',
      icon: BookOpen,
      label: 'Leyes',
      value: leyes.length,
      sublabel: 'leyes cargadas',
      color: '#8b5cf6',
      bg: '#f5f3ff',
    },
    {
      href: '/admin/usuarios',
      icon: Users,
      label: 'Usuarios',
      value: stats?.total ?? 0,
      sublabel: 'usuarios registrados',
      color: '#15803d',
      bg: '#f0fdf4',
    },
    {
      href: '/admin/estadisticas',
      icon: BarChart2,
      label: 'Estadísticas',
      value: `${stats?.conPlan ?? 0}`,
      sublabel: 'con suscripción',
      color: '#f97316',
      bg: '#fff7ed',
    },
  ];

  return (
    <div style={{ padding: '2rem' }}>

      {/* Bienvenida */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
          Bienvenido al panel 👋
        </div>
        <div style={{ fontSize: '13px', color: '#9ca3af' }}>
          Aquí tienes un resumen del estado actual de la plataforma
        </div>
      </div>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '2rem' }}>
        {accesos.map(({ href, icon: Icon, label, value, sublabel, color, bg }) => (
          <div
            key={href}
            onClick={() => router.push(href)}
            style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f3f4f6'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
              </div>
              <ChevronRight size={14} color="#d1d5db" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>{sublabel}</div>
          </div>
        ))}
      </div>

{/* Tareas pendientes */}
{tareas && tareas.total > 0 && (
  <div style={{ marginBottom: '2rem' }}>
    <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
      Tareas pendientes ({tareas.total})
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {tareas.boesPendientes > 0 && (
        <div
          onClick={() => router.push('/admin/boe')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid #fee2e2', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer' }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#fca5a5')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#fee2e2')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>📰</span>
            <span style={{ fontSize: '13px', color: '#374151' }}>
              <strong>{tareas.boesPendientes}</strong> convocatoria{tareas.boesPendientes !== 1 ? 's' : ''} del BOE por revisar
            </span>
          </div>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#fef2f2', color: '#dc2626', fontWeight: 500 }}>Revisar →</span>
        </div>
      )}
      {tareas?.convocatoriasSinInap?.length > 0 && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    {tareas.convocatoriasSinInap.map((c: any) => (
      <div
        key={c.id}
        onClick={() => router.push(`/admin/oposiciones/${c.oposicionId}`)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer' }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#fbbf24')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#fde68a')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🔗</span>
          <span style={{ fontSize: '13px', color: '#374151' }}>
            <strong>{c.oposicionNombre}</strong> · Convocatoria {c.anyo} sin URL INAP
          </span>
        </div>
        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#fffbeb', color: '#92400e', fontWeight: 500 }}>Añadir →</span>
      </div>
    ))}
  </div>
)}

{tareas?.oposicionesSinTemas?.length > 0 && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    {tareas.oposicionesSinTemas.map((o: any) => (
      <div
        key={o.id}
        onClick={() => router.push(`/admin/oposiciones/${o.id}/temas`)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer' }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#fbbf24')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#fde68a')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>📋</span>
          <span style={{ fontSize: '13px', color: '#374151' }}>
            <strong>{o.nombre}</strong> sin temario
          </span>
        </div>
        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#fffbeb', color: '#92400e', fontWeight: 500 }}>Añadir →</span>
      </div>
    ))}
  </div>
)}
    </div>
  </div>
)}

{/* Si todo está al día */}
{tareas && tareas.total === 0 && (
  <div style={{ marginBottom: '2rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span style={{ fontSize: '16px' }}>✅</span>
    <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 500 }}>Todo al día — no hay tareas pendientes</span>
  </div>
)}

      {/* Accesos rápidos */}
      <div style={{ marginBottom: '1rem', fontSize: '13px', fontWeight: 500, color: '#374151' }}>
        Accesos rápidos
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {[
          { label: 'Nueva oposición', icon: '➕', href: '/admin/oposiciones/nueva' },
          { label: 'Subir ley', icon: '📖', href: '/admin/leyes/nueva' },
          { label: 'Ver estadísticas', icon: '📊', href: '/admin/estadisticas' },
          { label: 'Gestionar usuarios', icon: '👥', href: '/admin/usuarios' },
          { label: 'Ver últimas leyes', icon: '📋', href: '/admin/leyes' },
          { label: 'Ver oposiciones', icon: '🎯', href: '/admin/oposiciones' },
        ].map(({ label, icon, href }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            style={{ padding: '12px 14px', background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', fontSize: '13px', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', transition: 'all 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#f3f4f6')}
          >
            <span style={{ fontSize: '16px' }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Últimos registros */}
      {stats?.nuevosHoy > 0 && (
        <div style={{ marginTop: '2rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={16} color="#3b82f6" />
          <span style={{ fontSize: '13px', color: '#1d4ed8' }}>
            <strong>{stats.nuevosHoy}</strong> usuario{stats.nuevosHoy !== 1 ? 's' : ''} nuevo{stats.nuevosHoy !== 1 ? 's' : ''} hoy
          </span>
        </div>
      )}

    </div>
  );
}