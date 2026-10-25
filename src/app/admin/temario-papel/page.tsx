'use client';

// ⭐ Admin · Temario en papel: ficha del temario impreso de cada oposición (lo que ve el
// opositor en la app) y lista de quien ha pedido que le avisen.

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookCopy, Download, Eye, EyeOff, Save, Users, Wand2 } from 'lucide-react';
import { api } from '@/lib/api';

type Producto = {
  activo: boolean; titulo: string; edicion: string; paginas: number | null; tomos: number | null;
  encuadernacion: string; precio: number | null; gastosEnvio: number | null; plazoEnvio: string;
  descripcion: string; imagenes: string[];
};
type Fila = { oposicion: { id: string; nombre: string }; producto: Producto | null; interesados: number };

const VACIO: Producto = {
  activo: false, titulo: 'Temario completo en papel', edicion: '', paginas: null, tomos: null,
  encuadernacion: '', precio: null, gastosEnvio: null, plazoEnvio: '', descripcion: '', imagenes: [],
};

// Temario de Policía Nacional (Escritorio\PL\Temas venta): portada, índice y páginas de muestra
// exportadas a frontend/public/temario-papel/policia-nacional.
const PRESET_POLICIA: Partial<Producto> = {
  titulo: 'Temario completo en papel',
  edicion: 'Edición convocatoria 2026',
  paginas: 628,
  descripcion:
    'Los 45 temas del Anexo I de la convocatoria, ordenados por bloques e impresos para subrayar y hacer esquemas.\n' +
    'En cada tema: ideas clave, esquemas, trampas de examen y preguntas de los exámenes oficiales de 2020 a 2025 con su respuesta explicada.',
  imagenes: [1, 2, 3, 4, 5].map((n) => `/temario-papel/policia-nacional/pagina-${n}.webp`),
};

const input: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#111827', background: 'white', boxSizing: 'border-box' };
const etiqueta: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' };

function Campo({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={etiqueta}>{titulo}</span>
      {children}
      {ayuda && <span style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{ayuda}</span>}
    </label>
  );
}

const aNumero = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));

export default function AdminTemarioPapelPage() {
  const queryClient = useQueryClient();
  const [elegida, setElegida] = useState<string | null>(null);
  const [form, setForm] = useState<Producto>(VACIO);
  const [aviso, setAviso] = useState('');

  const { data: filas = [], isLoading } = useQuery<Fila[]>({
    queryKey: ['admin-temario-papel'],
    queryFn: async () => (await api.get('/temario-papel/admin')).data,
  });

  const fila = filas.find((f) => f.oposicion.id === elegida);

  useEffect(() => {
    if (!elegida && filas.length) {
      const conFicha = filas.find((f) => f.producto) ?? filas.find((f) => /polic/i.test(f.oposicion.nombre)) ?? filas[0];
      setElegida(conFicha.oposicion.id);
    }
  }, [filas, elegida]);

  useEffect(() => {
    setForm(fila?.producto ? { ...VACIO, ...fila.producto } : VACIO);
    setAviso('');
  }, [fila?.oposicion.id, fila?.producto]);

  const { data: interesados = [] } = useQuery<any[]>({
    queryKey: ['admin-temario-papel-interesados', elegida],
    queryFn: async () => (await api.get(`/temario-papel/admin/${elegida}/interesados`)).data,
    enabled: !!elegida,
  });

  const guardar = useMutation({
    mutationFn: async (datos: Producto) => (await api.patch(`/temario-papel/admin/${elegida}`, datos)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-temario-papel'] });
      queryClient.invalidateQueries({ queryKey: ['temario-papel'] });
      setAviso('Guardado');
      setTimeout(() => setAviso(''), 2500);
    },
    onError: (e: any) => setAviso(e?.response?.data?.message ?? 'No se ha podido guardar'),
  });

  const exportar = () => {
    const filasCsv = [['Nick', 'Nombre', 'Email', 'Fecha']].concat(
      interesados.map((i) => [i.usuario?.nick ?? '', i.usuario?.nombre ?? '', i.usuario?.email ?? '', new Date(i.creadoEn).toLocaleString('es-ES')]),
    );
    const csv = filasCsv.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `interesados-temario-${fila?.oposicion.nombre ?? 'oposicion'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const set = (cambio: Partial<Producto>) => setForm((f) => ({ ...f, ...cambio }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Temario en papel</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Ficha del temario impreso que ve el opositor y lista de quien quiere que le avisen</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: 20, alignItems: 'start' }}>
        {/* Oposiciones */}
        <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: 12, overflow: 'hidden' }}>
          {isLoading && <div style={{ padding: 14, fontSize: 13, color: '#9ca3af' }}>Cargando…</div>}
          {filas.map((f) => {
            const activa = f.oposicion.id === elegida;
            const estado = !f.producto ? 'Sin ficha' : f.producto.activo ? 'Visible' : 'Oculta';
            return (
              <button
                key={f.oposicion.id}
                onClick={() => setElegida(f.oposicion.id)}
                style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', borderBottom: '1px solid #f3f4f6', background: activa ? '#EAF0FF' : 'white', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{f.oposicion.nombre}</div>
                <div style={{ fontSize: 11, color: estado === 'Visible' ? '#15803d' : '#9ca3af', marginTop: 2 }}>
                  {estado} · {f.interesados} {f.interesados === 1 ? 'interesado' : 'interesados'}
                </div>
              </button>
            );
          })}
        </div>

        {fila && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <BookCopy size={18} color="#1F7CFF" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', flex: 1 }}>{fila.oposicion.nombre}</div>
                <button
                  onClick={() => set(PRESET_POLICIA)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: 'white', fontSize: 12, color: '#374151', cursor: 'pointer' }}
                >
                  <Wand2 size={14} /> Rellenar con el temario de Policía Nacional
                </button>
              </div>

              <button
                onClick={() => set({ activo: !form.activo })}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: `1px solid ${form.activo ? '#BBF7D0' : '#e5e7eb'}`, background: form.activo ? '#F0FDF4' : '#F9FAFB', cursor: 'pointer', textAlign: 'left' }}
              >
                {form.activo ? <Eye size={16} color="#15803d" /> : <EyeOff size={16} color="#6b7280" />}
                <span style={{ fontSize: 13, color: '#111827' }}>
                  <b>{form.activo ? 'Visible en la app' : 'Oculta'}</b>
                  <span style={{ color: '#6b7280' }}>{form.activo ? ' · aparece en los temas, el lector de apuntes y Perfil' : ' · los opositores no la ven'}</span>
                </span>
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Campo titulo="Título"><input style={input} value={form.titulo} onChange={(e) => set({ titulo: e.target.value })} /></Campo>
                <Campo titulo="Edición" ayuda="Ej.: Edición convocatoria 2026"><input style={input} value={form.edicion} onChange={(e) => set({ edicion: e.target.value })} /></Campo>
                <Campo titulo="Páginas"><input style={input} inputMode="numeric" value={form.paginas ?? ''} onChange={(e) => set({ paginas: aNumero(e.target.value) })} /></Campo>
                <Campo titulo="Tomos"><input style={input} inputMode="numeric" value={form.tomos ?? ''} onChange={(e) => set({ tomos: aNumero(e.target.value) })} /></Campo>
                <Campo titulo="Encuadernación" ayuda="Ej.: Espiral, tapa blanda"><input style={input} value={form.encuadernacion} onChange={(e) => set({ encuadernacion: e.target.value })} /></Campo>
                <Campo titulo="Plazo de envío" ayuda="Ej.: 3-5 días laborables"><input style={input} value={form.plazoEnvio} onChange={(e) => set({ plazoEnvio: e.target.value })} /></Campo>
                <Campo titulo="Precio (€)" ayuda="Vacío: no se muestra precio"><input style={input} inputMode="decimal" value={form.precio ?? ''} onChange={(e) => set({ precio: aNumero(e.target.value) })} /></Campo>
                <Campo titulo="Gastos de envío (€)" ayuda="0 = envío incluido"><input style={input} inputMode="decimal" value={form.gastosEnvio ?? ''} onChange={(e) => set({ gastosEnvio: aNumero(e.target.value) })} /></Campo>
              </div>

              <Campo titulo="Descripción"><textarea style={{ ...input, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }} value={form.descripcion} onChange={(e) => set({ descripcion: e.target.value })} /></Campo>

              <Campo titulo="Imágenes (una por línea)" ayuda="La primera es la portada. Rutas de /temario-papel/… o enlaces https.">
                <textarea style={{ ...input, minHeight: 80, resize: 'vertical', fontFamily: 'ui-monospace, monospace', fontSize: 12 }} value={form.imagenes.join('\n')} onChange={(e) => set({ imagenes: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean) })} />
              </Campo>
              {form.imagenes.length > 0 && (
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                  {form.imagenes.map((src) => <img key={src} src={src} alt="" style={{ height: 110, borderRadius: 4, border: '1px solid #e5e7eb', background: 'white' }} />)}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => guardar.mutate(form)}
                  disabled={guardar.isPending}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: 'none', borderRadius: 8, background: '#111827', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  <Save size={14} /> {guardar.isPending ? 'Guardando…' : 'Guardar ficha'}
                </button>
                {aviso && <span style={{ fontSize: 12, color: aviso === 'Guardado' ? '#15803d' : '#b91c1c' }}>{aviso}</span>}
              </div>
            </div>

            <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                <Users size={16} color="#374151" />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', flex: 1 }}>Quieren que les avisen ({interesados.length})</div>
                {interesados.length > 0 && (
                  <button onClick={exportar} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: 'white', fontSize: 12, color: '#374151', cursor: 'pointer' }}>
                    <Download size={14} /> Exportar CSV
                  </button>
                )}
              </div>
              {interesados.length === 0 ? (
                <div style={{ padding: 16, fontSize: 13, color: '#9ca3af' }}>Todavía nadie. Aparecerán aquí al pulsar «Avísame» en la app.</div>
              ) : (
                interesados.map((i) => (
                  <div key={i.id} style={{ display: 'flex', gap: 12, padding: '9px 16px', borderBottom: '1px solid #f9fafb', fontSize: 13 }}>
                    <span style={{ flex: 1, color: '#111827' }}>{i.usuario?.nombre ?? '—'} <span style={{ color: '#9ca3af' }}>@{i.usuario?.nick}</span></span>
                    <span style={{ color: '#6b7280' }}>{i.usuario?.email}</span>
                    <span style={{ color: '#9ca3af', width: 90, textAlign: 'right' }}>{new Date(i.creadoEn).toLocaleDateString('es-ES')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
