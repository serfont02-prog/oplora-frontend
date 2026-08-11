'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, ChevronDown } from 'lucide-react';

const SUSCRIPCIONES = ['gratuito', 'esencial', 'profesional'];
const NIVELES = [1, 2, 3, 4, 5];

const SUSCRIPCION_COLORS: Record<string, { bg: string; color: string }> = {
  gratuito: { bg: '#F3F4F6', color: '#6B7280' },
  esencial: { bg: '#E6F1FB', color: '#185FA5' },
  profesional: { bg: '#EEEDFE', color: '#3C3489' },
};

const NIVEL_LABEL: Record<number, string> = {
  1: 'Iniciado', 2: 'Aprendiz', 3: 'Avanzado', 4: 'Experto', 5: 'Maestro',
};

export default function UsuariosAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filtroSuscripcion, setFiltroSuscripcion] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any>(null);
  const [nuevaSuscripcion, setNuevaSuscripcion] = useState('');

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios-admin'],
    queryFn: async () => {
      const res = await api.get('/usuarios');
      return res.data;
    },
  });

  const cambiarSuscripcion = useMutation({
    mutationFn: async ({ id, suscripcion }: { id: string; suscripcion: string }) => {
      await api.patch(`/usuarios/${id}/suscripcion`, { suscripcion });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
      setUsuarioSeleccionado(null);
    },
  });

  const desactivar = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/usuarios/${id}/desactivar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
      setUsuarioSeleccionado(null);
    },
  });

  const usuariosFiltrados = usuarios.filter((u: any) => {
    const matchSearch = !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.nick?.toLowerCase().includes(search.toLowerCase()) ||
      u.nombre?.toLowerCase().includes(search.toLowerCase());
    const matchPlan = !filtroSuscripcion || u.suscripcion === filtroSuscripcion;
    const matchNivel = !filtroNivel || u.nivel === parseInt(filtroNivel);
    return matchSearch && matchPlan && matchNivel;
  });

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
        <div>
          <div className="text-[15px] font-medium text-gray-900">Usuarios</div>
          <div className="text-[12px] text-gray-400 mt-0.5">{usuarios.length} registrados</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-6 py-3 border-b border-gray-100 bg-white flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nick, nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
          />
        </div>
        <select
          value={filtroSuscripcion}
          onChange={(e) => setFiltroSuscripcion(e.target.value)}
          className="px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none"
        >
          <option value="">Todas las suscripciones</option>
          {SUSCRIPCIONES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select
          value={filtroNivel}
          onChange={(e) => setFiltroNivel(e.target.value)}
          className="px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none"
        >
          <option value="">Todos los niveles</option>
          {NIVELES.map((n) => <option key={n} value={n}>Nivel {n} — {NIVEL_LABEL[n]}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-6 text-[13px] text-gray-400">Cargando...</div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="p-6 text-center text-[13px] text-gray-400">No hay usuarios con ese filtro</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: '10px 24px', fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Usuario</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Suscripción</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nivel</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Puntos</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Registro</th>
                <th style={{ padding: '10px 12px', width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u: any) => (
                <tr
                  key={u.id}
                  style={{ borderBottom: '1px solid #f9fafb' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                >
                  <td style={{ padding: '11px 24px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
                      {u.nick ? `@${u.nick}` : u.nombre}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '11px 12px' }}>
                    {u.suscripcion ? (
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', fontWeight: 500, background: SUSCRIPCION_COLORS[u.suscripcion]?.bg ?? '#f3f4f6', color: SUSCRIPCION_COLORS[u.suscripcion]?.color ?? '#6b7280' }}>
                        {u.suscripcion.charAt(0).toUpperCase() + u.suscripcion.slice(1)}
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>Sin suscripción</span>
                    )}
                  </td>
                  <td style={{ padding: '11px 12px', fontSize: '13px', color: '#374151' }}>
                    Nv.{u.nivel} — {NIVEL_LABEL[u.nivel] ?? '—'}
                  </td>
                  <td style={{ padding: '11px 12px', fontSize: '13px', fontWeight: 500, color: '#111827' }}>
                    {u.puntos ?? 0}
                  </td>
                  <td style={{ padding: '11px 12px', fontSize: '12px', color: '#9ca3af' }}>
                    {new Date(u.creadoEn).toLocaleDateString('es-ES')}
                  </td>
                  <td style={{ padding: '11px 12px' }}>
                    <button
                    onClick={() => { setUsuarioSeleccionado(u); setNuevaSuscripcion(u.suscripcion ?? ''); }}
                    style={{ fontSize: '11px', color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontWeight: 500 }}
                    >
                    Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal usuario */}
      {usuarioSeleccionado && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '400px', margin: '0 1rem' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
              {usuarioSeleccionado.nick ? `@${usuarioSeleccionado.nick}` : usuarioSeleccionado.nombre}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '1.25rem' }}>
              {usuarioSeleccionado.email}
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
              {[
                { label: 'Puntos', value: usuarioSeleccionado.puntos ?? 0 },
                { label: 'Nivel', value: usuarioSeleccionado.nivel ?? 1 },
                { label: 'Tests sup.', value: usuarioSeleccionado.testsSuperados ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>{value}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Cambiar suscripción */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>Suscripción</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['', ...SUSCRIPCIONES].map((s) => (
                  <button
                    key={s}
                    onClick={() => setNuevaSuscripcion(s)}
                    style={{ flex: 1, padding: '7px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: nuevaSuscripcion === s ? 'none' : '1px solid #e5e7eb', background: nuevaSuscripcion === s ? '#111827' : 'white', color: nuevaSuscripcion === s ? 'white' : '#6b7280' }}
                  >
                    {s === '' ? 'Ninguno' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => cambiarSuscripcion.mutate({ id: usuarioSeleccionado.id, suscripcion: nuevaSuscripcion })}
                disabled={cambiarSuscripcion.isPending}
                style={{ flex: 2, padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              >
                Guardar cambios
              </button>
              <button
                onClick={() => setUsuarioSeleccionado(null)}
                style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>

            <button
              onClick={() => { if (confirm('¿Desactivar este usuario?')) desactivar.mutate(usuarioSeleccionado.id); }}
              style={{ width: '100%', marginTop: '8px', padding: '10px', background: 'none', border: '1px solid #fee2e2', borderRadius: '9px', fontSize: '13px', color: '#dc2626', cursor: 'pointer' }}
            >
              Desactivar cuenta
            </button>
          </div>
        </div>
      )}

    </div>
  );
}