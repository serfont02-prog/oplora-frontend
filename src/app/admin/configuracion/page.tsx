    'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Save } from 'lucide-react';

const TABS = [
  { key: 'limites_planes', label: 'Planes y límites' },
  { key: 'niveles_estudio', label: 'Niveles de estudio' },
  { key: 'puntos_acciones', label: 'Puntos por acción' },
];

const PLANES = ['gratuito', 'esencial', 'profesional'];

export default function ConfiguracionPage() {
  const [tab, setTab] = useState('limites_planes');
  const [guardado, setGuardado] = useState(false);
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['configuracion'],
    queryFn: async () => {
      const res = await api.get('/configuracion');
      return res.data;
    },
  });

  const guardar = useMutation({
    mutationFn: async ({ clave, valor }: { clave: string; valor: any }) => {
      await api.patch(`/configuracion/${clave}`, { valor });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracion'] });
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    },
  });

  if (isLoading) return <div style={{ padding: '2rem', fontSize: '13px', color: '#9ca3af' }}>Cargando...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Configuración</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Gestiona límites, niveles y puntuación</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', background: 'white', padding: '0 1.5rem' }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: tab === key ? 600 : 400,
              color: tab === key ? '#111827' : '#9ca3af',
              borderBottom: tab === key ? '2px solid #111827' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: '720px' }}>

          {/* TAB: Planes y límites */}
          {tab === 'limites_planes' && config?.limites_planes && (
            <LimitesPlanes
              data={config.limites_planes}
              onGuardar={(valor: any) =>
                 guardar.mutate({ clave: 'limites_planes', valor })
                }
              guardando={guardar.isPending}
              guardado={guardado}
            />
          )}

          {/* TAB: Niveles */}
          {tab === 'niveles_estudio' && config?.niveles_estudio && (
            <NivelesEstudio
              data={config.niveles_estudio}
              onGuardar={(valor: any) =>
                guardar.mutate({ clave: 'niveles_estudio', valor })
                }
              guardando={guardar.isPending}
              guardado={guardado}
            />
          )}

          {/* TAB: Puntos */}
          {tab === 'puntos_acciones' && config?.puntos_acciones && (
            <PuntosAcciones
              data={config.puntos_acciones}
              onGuardar={(valor: any) =>
                guardar.mutate({ clave: 'puntos_acciones', valor })
                }
              guardando={guardar.isPending}
              guardado={guardado}
            />
          )}

        </div>
      </div>
    </div>
  );
}

/* ── Planes y límites ── */
function LimitesPlanes({ data, onGuardar, guardando, guardado }: any) {
  const [form, setForm] = useState(data);

  const updatePlan = (plan: string, campo: string, valor: any) => {
    setForm((prev: any) => ({
      ...prev,
      [plan]: { ...prev[plan], [campo]: valor === '' ? null : Number(valor) },
    }));
  };

  const updateBool = (plan: string, campo: string, valor: boolean) => {
    setForm((prev: any) => ({
      ...prev,
      [plan]: { ...prev[plan], [campo]: valor },
    }));
  };

  const CAMPOS = [
    { key: 'preguntasPorTest', label: 'Preguntas por test', tipo: 'number' },
    { key: 'preguntasPorTema', label: 'Preguntas por tema', tipo: 'number' },
    { key: 'preguntasTestDia', label: 'Preguntas al día', tipo: 'number', nullable: true },
    { key: 'flashcardsDia', label: 'Flashcards al día', tipo: 'number', nullable: true },
    { key: 'oposiciones', label: 'Oposiciones', tipo: 'number', nullable: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Límite
              </th>
              {PLANES.map(plan => (
                <th key={plan} style={{ padding: '10px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CAMPOS.map(({ key, label, nullable }) => (
              <tr key={key} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                  {label}
                  {nullable && <span style={{ fontSize: '10px', color: '#9ca3af', marginLeft: '4px' }}>(null = ilimitado)</span>}
                </td>
                {PLANES.map(plan => (
                  <td key={plan} style={{ padding: '8px 16px', textAlign: 'center' }}>
                    <input
                      type="number"
                      value={form[plan][key] ?? ''}
                      onChange={(e) => updatePlan(plan, key, e.target.value)}
                      placeholder={nullable ? '∞' : ''}
                      style={{ width: '80px', padding: '6px 8px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', textAlign: 'center' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151', fontWeight: 500 }}>Simulacros</td>
              {PLANES.map(plan => (
                <td key={plan} style={{ padding: '8px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => updateBool(plan, 'simulacros', !form[plan].simulacros)}
                    style={{
                      padding: '4px 12px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                      background: form[plan].simulacros ? '#f0fdf4' : '#fef2f2',
                      color: form[plan].simulacros ? '#15803d' : '#dc2626',
                    }}
                  >
                    {form[plan].simulacros ? 'Sí' : 'No'}
                  </button>
                </td>
              ))}
            </tr>

            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151', fontWeight: 500 }}>Apuntes</td>
              {PLANES.map(plan => (
                <td key={plan} style={{ padding: '8px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => updateBool(plan, 'apuntes', !form[plan].apuntes)}
                    style={{
                      padding: '4px 12px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                      background: form[plan].apuntes ? '#f0fdf4' : '#fef2f2',
                      color: form[plan].apuntes ? '#15803d' : '#dc2626',
                    }}
                  >
                    {form[plan].apuntes ? 'Sí' : 'No'}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <button
        onClick={() => onGuardar(form)}
        disabled={guardando}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', alignSelf: 'flex-start' }}
      >
        <Save size={14} />
        {guardado ? '✓ Guardado' : guardando ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}

/* ── Niveles de estudio ── */
function NivelesEstudio({ data, onGuardar, guardando, guardado }: any) {
  const [form, setForm] = useState(data);

  const update = (i: number, campo: string, valor: any) => {
    setForm((prev: any[]) => prev.map((n, idx) =>
      idx === i ? { ...n, [campo]: valor === '' ? null : campo === 'nombre' || campo === 'badge' ? valor : Number(valor) } : n
    ));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
              {['Nivel', 'Nombre', 'Badge', 'Puntos mín.', 'Puntos máx.'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {form.map((nivel: any, i: number) => (
              <tr key={i} style={{ borderBottom: i < form.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                  {nivel.nivel}
                </td>
                <td style={{ padding: '8px 16px' }}>
                  <input
                    type="text"
                    value={nivel.nombre}
                    onChange={(e) => update(i, 'nombre', e.target.value)}
                    style={{ width: '120px', padding: '6px 8px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none' }}
                  />
                </td>
                <td style={{ padding: '8px 16px' }}>
                  <input
                    type="text"
                    value={nivel.badge}
                    onChange={(e) => update(i, 'badge', e.target.value)}
                    style={{ width: '60px', padding: '6px 8px', fontSize: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', textAlign: 'center' }}
                  />
                </td>
                <td style={{ padding: '8px 16px' }}>
                  <input
                    type="number"
                    value={nivel.puntosMin ?? ''}
                    onChange={(e) => update(i, 'puntosMin', e.target.value)}
                    style={{ width: '80px', padding: '6px 8px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', textAlign: 'center' }}
                  />
                </td>
                <td style={{ padding: '8px 16px' }}>
                  <input
                    type="number"
                    value={nivel.puntosMax ?? ''}
                    onChange={(e) => update(i, 'puntosMax', e.target.value)}
                    placeholder="∞"
                    style={{ width: '80px', padding: '6px 8px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', textAlign: 'center' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => onGuardar(form)}
        disabled={guardando}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', alignSelf: 'flex-start' }}
      >
        <Save size={14} />
        {guardado ? '✓ Guardado' : guardando ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}

/* ── Puntos por acción ── */
function PuntosAcciones({ data, onGuardar, guardando, guardado }: any) {
  const [form, setForm] = useState(data);

  const ACCIONES = [
    { key: 'preguntaCorrecta', label: 'Pregunta correcta', desc: 'Puntos por cada respuesta correcta en un test' },
    { key: 'testCompletadoMas80', label: 'Test completado >80%', desc: 'Bonus por completar un test con más del 80% de acierto' },
    { key: 'testCompletadoMas60', label: 'Test completado >60%', desc: 'Bonus por completar un test con más del 60% de acierto' },
    { key: 'flashcardDominada', label: 'Flashcard dominada', desc: 'Puntos por dominar una flashcard por primera vez' },
    { key: 'rachaDiaria', label: 'Racha diaria', desc: 'Puntos por mantener la racha de días consecutivos' },
    { key: 'ganarReto', label: 'Ganar un reto', desc: 'Puntos por ganar un reto contra otro usuario' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', overflow: 'hidden' }}>
        {ACCIONES.map(({ key, label, desc }, i) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i < ACCIONES.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{label}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{desc}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                value={form[key]}
                onChange={(e) => setForm((prev: any) => ({ ...prev, [key]: Number(e.target.value) }))}
                style={{ width: '70px', padding: '6px 8px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', textAlign: 'center' }}
              />
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>pts</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onGuardar(form)}
        disabled={guardando}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', alignSelf: 'flex-start' }}
      >
        <Save size={14} />
        {guardado ? '✓ Guardado' : guardando ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}