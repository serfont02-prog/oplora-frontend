'use client';

// ⭐ Admin · Temario en papel: ficha del temario impreso de cada oposición (lo que ve el
// opositor en la app), dónde aparece, qué puede elegir (color, caras...) y lista de quien ha
// pedido que le avisen.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, BookCopy, Download, Eye, EyeOff, ImagePlus, Plus, Save, Trash2, Users, Wand2, X } from 'lucide-react';
import { api } from '@/lib/api';

type Lugar = 'lector' | 'tema' | 'listaTemas' | 'perfil';
type Valor = { id?: string; nombre: string; descripcion: string; suplemento: number | null };
type Grupo = { id?: string; nombre: string; valores: Valor[] };
type Producto = {
  activo: boolean; ubicaciones: Record<Lugar, boolean>; opciones: Grupo[];
  titulo: string; edicion: string; paginas: number | null; tomos: number | null;
  encuadernacion: string; precio: number | null; gastosEnvio: number | null; plazoEnvio: string;
  descripcion: string; imagenes: string[];
};
type Fila = { oposicion: { id: string; nombre: string }; producto: Producto | null; interesados: number };

const LUGARES: { clave: Lugar; titulo: string; sub: string }[] = [
  { clave: 'lector', titulo: 'Lector de apuntes', sub: 'Botón «En papel» arriba a la derecha' },
  { clave: 'tema', titulo: 'Tema (pestaña Material)', sub: 'Tarjeta al abrir un tema' },
  { clave: 'listaTemas', titulo: 'Lista de temas (Material)', sub: 'Tarjeta en Estudiar → Material' },
  { clave: 'perfil', titulo: 'Perfil', sub: 'Fila en «Tu cuenta»' },
];

const VACIO: Producto = {
  activo: false, ubicaciones: { lector: true, tema: true, listaTemas: true, perfil: true }, opciones: [],
  titulo: 'Temario completo en papel', edicion: '', paginas: null, tomos: null,
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
  opciones: [
    { nombre: 'Impresión', valores: [
      { nombre: 'Blanco y negro', descripcion: 'Cajas en gris', suplemento: null },
      { nombre: 'Color', descripcion: 'Cajas y títulos en color', suplemento: null },
    ] },
    { nombre: 'Caras', valores: [
      { nombre: 'Doble cara', descripcion: 'Menos peso y volumen', suplemento: null },
      { nombre: 'Una cara', descripcion: 'Dorso libre para notas', suplemento: null },
    ] },
  ],
};

const input: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#111827', background: 'white', boxSizing: 'border-box' };
const etiqueta: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' };
const caja: React.CSSProperties = { background: 'white', border: '1px solid #f3f4f6', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 };
const botonSec: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: 'white', fontSize: 12, color: '#374151', cursor: 'pointer' };
const iconoBtn: React.CSSProperties = { width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: 6, background: 'white', cursor: 'pointer', padding: 0 };

function Campo({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={etiqueta}>{titulo}</span>
      {children}
      {ayuda && <span style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{ayuda}</span>}
    </label>
  );
}

function TituloCaja({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{children}</div>
      {sub && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 1.45 }}>{sub}</div>}
    </div>
  );
}

const aNumero = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));

export default function AdminTemarioPapelPage() {
  const queryClient = useQueryClient();
  const [elegida, setElegida] = useState<string | null>(null);
  const [form, setForm] = useState<Producto>(VACIO);
  const [aviso, setAviso] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [errorImagen, setErrorImagen] = useState('');
  const inputImagen = useRef<HTMLInputElement>(null);

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
    setForm(fila?.producto ? { ...VACIO, ...fila.producto, ubicaciones: { ...VACIO.ubicaciones, ...(fila.producto.ubicaciones ?? {}) } } : VACIO);
    setAviso('');
    setErrorImagen('');
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
      queryClient.invalidateQueries({ queryKey: ['admin-temario-papel-interesados'] });
      queryClient.invalidateQueries({ queryKey: ['temario-papel'] });
      setAviso('Guardado');
      setTimeout(() => setAviso(''), 2500);
    },
    onError: (e: any) => setAviso(e?.response?.data?.message ?? 'No se ha podido guardar'),
  });

  const set = (cambio: Partial<Producto>) => setForm((f) => ({ ...f, ...cambio }));

  // ---------- Imágenes ----------
  const subirImagenes = async (archivos: FileList | null) => {
    if (!archivos?.length || !elegida) return;
    setErrorImagen('');
    setSubiendo(true);
    try {
      const nuevas: string[] = [];
      for (const archivo of Array.from(archivos)) {
        if (!/^image\/(jpeg|png|webp)$/.test(archivo.type)) {
          setErrorImagen(`«${archivo.name}» no es una imagen JPG, PNG o WebP. Un PDF no se puede usar: haz una captura o exporta la página como imagen.`);
          continue;
        }
        const datos = new FormData();
        datos.append('imagen', archivo);
        const res = await api.post(`/temario-papel/admin/${elegida}/imagen`, datos, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data?.url) nuevas.push(res.data.url);
      }
      if (nuevas.length) setForm((f) => ({ ...f, imagenes: [...f.imagenes, ...nuevas].slice(0, 12) }));
    } catch (e: any) {
      setErrorImagen(e?.response?.data?.message ?? 'No se ha podido subir la imagen');
    } finally {
      setSubiendo(false);
      if (inputImagen.current) inputImagen.current.value = '';
    }
  };
  const moverImagen = (i: number, d: -1 | 1) => setForm((f) => {
    const im = [...f.imagenes]; const j = i + d;
    if (j < 0 || j >= im.length) return f;
    [im[i], im[j]] = [im[j], im[i]];
    return { ...f, imagenes: im };
  });

  // ---------- Opciones ----------
  const setGrupo = (gi: number, cambio: Partial<Grupo>) => setForm((f) => ({ ...f, opciones: f.opciones.map((g, i) => (i === gi ? { ...g, ...cambio } : g)) }));
  const setValor = (gi: number, vi: number, cambio: Partial<Valor>) =>
    setGrupo(gi, { valores: form.opciones[gi].valores.map((v, i) => (i === vi ? { ...v, ...cambio } : v)) });

  // Resumen de lo que han elegido los interesados
  const resumenOpciones = useMemo(() => {
    const grupos = fila?.producto?.opciones ?? [];
    return grupos.map((g) => ({
      grupo: g,
      cuentas: g.valores.map((v) => ({ valor: v, n: interesados.filter((i) => i.opciones?.[g.id!] === v.id).length })),
    }));
  }, [fila?.producto?.opciones, interesados]);

  const nombreOpcion = (opciones: Record<string, string> | null) =>
    (fila?.producto?.opciones ?? []).map((g) => g.valores.find((v) => v.id === opciones?.[g.id!])?.nombre).filter(Boolean).join(' · ');

  const exportar = () => {
    const grupos = fila?.producto?.opciones ?? [];
    const cabecera = ['Nick', 'Nombre', 'Email', 'Fecha', ...grupos.map((g) => g.nombre)];
    const filasCsv = [cabecera].concat(
      interesados.map((i) => [
        i.usuario?.nick ?? '', i.usuario?.nombre ?? '', i.usuario?.email ?? '', new Date(i.creadoEn).toLocaleString('es-ES'),
        ...grupos.map((g) => g.valores.find((v) => v.id === i.opciones?.[g.id!])?.nombre ?? ''),
      ]),
    );
    const csv = filasCsv.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `interesados-temario-${fila?.oposicion.nombre ?? 'oposicion'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Temario en papel</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Ficha del temario impreso que ve el opositor, dónde aparece y quién quiere que le avisen</div>
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
            {/* Estado y dónde aparece */}
            <div style={caja}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <BookCopy size={18} color="#1F7CFF" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', flex: 1 }}>{fila.oposicion.nombre}</div>
                <button onClick={() => set(PRESET_POLICIA)} style={botonSec}>
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
                  <span style={{ color: '#6b7280' }}>{form.activo ? ' · los opositores ven la ficha en los sitios marcados' : ' · los opositores no la ven en ningún sitio'}</span>
                </span>
              </button>

              <div>
                <span style={etiqueta}>Dónde aparece</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {LUGARES.map(({ clave, titulo, sub }) => (
                    <label key={clave} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 10px', border: '1px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', opacity: form.activo ? 1 : 0.6 }}>
                      <input
                        type="checkbox"
                        checked={form.ubicaciones[clave]}
                        onChange={(e) => set({ ubicaciones: { ...form.ubicaciones, [clave]: e.target.checked } })}
                        style={{ marginTop: 2, width: 16, height: 16, accentColor: '#1F7CFF' }}
                      />
                      <span>
                        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111827' }}>{titulo}</span>
                        <span style={{ display: 'block', fontSize: 11, color: '#9ca3af' }}>{sub}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <span style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginTop: 4 }}>La ficha completa se puede abrir siempre desde cualquiera de ellos.</span>
              </div>
            </div>

            {/* Datos */}
            <div style={caja}>
              <TituloCaja>Datos del temario</TituloCaja>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Campo titulo="Título"><input style={input} value={form.titulo} onChange={(e) => set({ titulo: e.target.value })} /></Campo>
                <Campo titulo="Edición" ayuda="Ej.: Edición convocatoria 2026"><input style={input} value={form.edicion} onChange={(e) => set({ edicion: e.target.value })} /></Campo>
                <Campo titulo="Páginas"><input style={input} inputMode="numeric" value={form.paginas ?? ''} onChange={(e) => set({ paginas: aNumero(e.target.value) })} /></Campo>
                <Campo titulo="Tomos"><input style={input} inputMode="numeric" value={form.tomos ?? ''} onChange={(e) => set({ tomos: aNumero(e.target.value) })} /></Campo>
                <Campo titulo="Encuadernación" ayuda="Ej.: Espiral, tapa blanda"><input style={input} value={form.encuadernacion} onChange={(e) => set({ encuadernacion: e.target.value })} /></Campo>
                <Campo titulo="Plazo de envío" ayuda="Ej.: 3-5 días laborables"><input style={input} value={form.plazoEnvio} onChange={(e) => set({ plazoEnvio: e.target.value })} /></Campo>
                <Campo titulo="Precio base (€)" ayuda="Vacío: no se muestra precio"><input style={input} inputMode="decimal" value={form.precio ?? ''} onChange={(e) => set({ precio: aNumero(e.target.value) })} /></Campo>
                <Campo titulo="Gastos de envío (€)" ayuda="0 = envío incluido"><input style={input} inputMode="decimal" value={form.gastosEnvio ?? ''} onChange={(e) => set({ gastosEnvio: aNumero(e.target.value) })} /></Campo>
              </div>
              <Campo titulo="Descripción"><textarea style={{ ...input, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }} value={form.descripcion} onChange={(e) => set({ descripcion: e.target.value })} /></Campo>
            </div>

            {/* Imágenes */}
            <div style={caja}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <TituloCaja sub="Portada y páginas de muestra que verá el opositor. Sube imágenes JPG, PNG o WebP (hasta 5 MB cada una); un PDF no sirve: exporta o haz captura de las páginas que quieras enseñar. La primera es la portada.">
                    Imágenes
                  </TituloCaja>
                </div>
                <input ref={inputImagen} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: 'none' }} onChange={(e) => subirImagenes(e.target.files)} />
                <button onClick={() => inputImagen.current?.click()} disabled={subiendo} style={{ ...botonSec, flexShrink: 0 }}>
                  <ImagePlus size={14} /> {subiendo ? 'Subiendo…' : 'Subir imágenes'}
                </button>
              </div>
              {errorImagen && <div style={{ fontSize: 12, color: '#b91c1c', background: '#FEF2F2', borderRadius: 8, padding: '8px 10px' }}>{errorImagen}</div>}
              {form.imagenes.length === 0 ? (
                <div style={{ fontSize: 12, color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: 10, padding: 16, textAlign: 'center' }}>Sin imágenes todavía</div>
              ) : (
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                  {form.imagenes.map((src, i) => (
                    <div key={src + i} style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={src} alt="" style={{ height: 130, borderRadius: 4, border: '1px solid #e5e7eb', background: 'white', display: 'block' }} />
                        {i === 0 && <span style={{ position: 'absolute', top: 4, left: 4, fontSize: 10, fontWeight: 700, background: '#1F7CFF', color: 'white', borderRadius: 4, padding: '1px 5px' }}>Portada</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button title="Mover a la izquierda" onClick={() => moverImagen(i, -1)} disabled={i === 0} style={{ ...iconoBtn, opacity: i === 0 ? 0.4 : 1 }}><ArrowLeft size={13} /></button>
                        <button title="Quitar" onClick={() => set({ imagenes: form.imagenes.filter((_, k) => k !== i) })} style={iconoBtn}><Trash2 size={13} color="#b91c1c" /></button>
                        <button title="Mover a la derecha" onClick={() => moverImagen(i, 1)} disabled={i === form.imagenes.length - 1} style={{ ...iconoBtn, opacity: i === form.imagenes.length - 1 ? 0.4 : 1 }}><ArrowRight size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Opciones a elegir */}
            <div style={caja}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <TituloCaja sub="Lo que el opositor puede elegir (color o blanco y negro, una o dos caras…). Cada característica necesita al menos dos opciones; la primera es la que sale marcada. El suplemento se suma al precio base.">
                    Opciones que puede elegir
                  </TituloCaja>
                </div>
                <button
                  onClick={() => set({ opciones: [...form.opciones, { nombre: '', valores: [{ nombre: '', descripcion: '', suplemento: null }, { nombre: '', descripcion: '', suplemento: null }] }] })}
                  disabled={form.opciones.length >= 6}
                  style={{ ...botonSec, flexShrink: 0 }}
                >
                  <Plus size={14} /> Añadir característica
                </button>
              </div>
              {form.opciones.length === 0 && <div style={{ fontSize: 12, color: '#9ca3af' }}>Sin opciones: todos lo piden igual.</div>}
              {form.opciones.map((g, gi) => (
                <div key={gi} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input style={{ ...input, fontWeight: 600 }} placeholder="Característica (p. ej. Impresión)" value={g.nombre} onChange={(e) => setGrupo(gi, { nombre: e.target.value })} />
                    <button title="Quitar característica" onClick={() => set({ opciones: form.opciones.filter((_, k) => k !== gi) })} style={{ ...iconoBtn, width: 32, height: 32 }}><Trash2 size={14} color="#b91c1c" /></button>
                  </div>
                  {g.valores.map((v, vi) => (
                    <div key={vi} style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 110px 32px', gap: 8, alignItems: 'center' }}>
                      <input style={input} placeholder={vi === 0 ? 'Opción (p. ej. Blanco y negro)' : 'Opción'} value={v.nombre} onChange={(e) => setValor(gi, vi, { nombre: e.target.value })} />
                      <input style={input} placeholder="Aclaración (opcional)" value={v.descripcion} onChange={(e) => setValor(gi, vi, { descripcion: e.target.value })} />
                      <input style={input} placeholder="+ € (opcional)" inputMode="decimal" value={v.suplemento ?? ''} onChange={(e) => setValor(gi, vi, { suplemento: aNumero(e.target.value) })} />
                      <button title="Quitar opción" onClick={() => setGrupo(gi, { valores: g.valores.filter((_, k) => k !== vi) })} disabled={g.valores.length <= 2} style={{ ...iconoBtn, width: 32, height: 32, opacity: g.valores.length <= 2 ? 0.4 : 1 }}><X size={14} /></button>
                    </div>
                  ))}
                  {g.valores.length < 8 && (
                    <button onClick={() => setGrupo(gi, { valores: [...g.valores, { nombre: '', descripcion: '', suplemento: null }] })} style={{ ...botonSec, alignSelf: 'flex-start' }}>
                      <Plus size={13} /> Añadir opción
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => guardar.mutate(form)}
                disabled={guardar.isPending || subiendo}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', border: 'none', borderRadius: 8, background: '#111827', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                <Save size={14} /> {guardar.isPending ? 'Guardando…' : 'Guardar ficha'}
              </button>
              {aviso && <span style={{ fontSize: 12, color: aviso === 'Guardado' ? '#15803d' : '#b91c1c' }}>{aviso}</span>}
            </div>

            {/* Interesados */}
            <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                <Users size={16} color="#374151" />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', flex: 1 }}>Quieren que les avisen ({interesados.length})</div>
                {interesados.length > 0 && (
                  <button onClick={exportar} style={botonSec}><Download size={14} /> Exportar CSV</button>
                )}
              </div>
              {interesados.length > 0 && resumenOpciones.length > 0 && (
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '10px 16px', borderBottom: '1px solid #f3f4f6', background: '#F9FAFB' }}>
                  {resumenOpciones.map(({ grupo, cuentas }) => (
                    <div key={grupo.id} style={{ fontSize: 12, color: '#374151' }}>
                      <b>{grupo.nombre}:</b> {cuentas.map(({ valor, n }) => `${valor.nombre} ${n}`).join(' · ')}
                    </div>
                  ))}
                </div>
              )}
              {interesados.length === 0 ? (
                <div style={{ padding: 16, fontSize: 13, color: '#9ca3af' }}>Todavía nadie. Aparecerán aquí al pulsar «Avísame» en la app.</div>
              ) : (
                interesados.map((i) => (
                  <div key={i.id} style={{ display: 'flex', gap: 12, padding: '9px 16px', borderBottom: '1px solid #f9fafb', fontSize: 13, alignItems: 'baseline' }}>
                    <span style={{ flex: 1, color: '#111827' }}>{i.usuario?.nombre ?? '—'} <span style={{ color: '#9ca3af' }}>@{i.usuario?.nick}</span></span>
                    <span style={{ color: '#374151', fontSize: 12 }}>{nombreOpcion(i.opciones)}</span>
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
