'use client';

// ⭐ Preguntas de un examen oficial (admin): ver respuesta, cambiar el estado (vigente, fuera de
// temario, desactualizada, anulada), clasificarlas por ley + artículo o por tema, y crear la
// versión actualizada de una pregunta cuya normativa ha cambiado.

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { Chip, ETIQUETA_ESTADO, estiloInput, estiloBotonSecundario } from './ImportarPreguntasExamen';

type PreguntaAdmin = {
  id: string;
  orden: number;
  enunciado: string;
  opciones: string[];
  correcta: number;
  explicacion: string | null;
  estado: string;
  notaActualizacion: string | null;
  tieneCopiaActualizada: boolean;
  temas: { id: string; numero: number; titulo: string; anyo: number | null }[];
  articulos: { id: string; numero: string; ley: string }[];
};

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];
const FILTROS = [
  ['todas', 'Todas'],
  ['tests', 'En tests'],
  ['simulacro', 'Solo simulacro'],
  ['anulada', 'Anuladas'],
  ['desactualizada', 'Desactualizadas'],
  ['fuera_temario', 'Fuera de temario'],
] as const;

const clasificada = (p: PreguntaAdmin) => p.temas.length > 0 || p.articulos.length > 0;

export default function PreguntasExamenAdmin({ examenId, convocatorias, onCambio }: { examenId: string; convocatorias: { id: string; anyo: number }[]; onCambio: () => void }) {
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number][0]>('todas');
  const [abierta, setAbierta] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['examen-oficial-preguntas', examenId],
    queryFn: async () => (await api.get(`/examenes-oficiales/${examenId}/preguntas`)).data,
  });

  const refrescar = () => {
    queryClient.invalidateQueries({ queryKey: ['examen-oficial-preguntas', examenId] });
    onCambio();
  };

  if (isLoading) return <div style={{ padding: 14, fontSize: 13, color: '#9ca3af' }}>Cargando preguntas…</div>;
  if (error || !data) return <div style={{ padding: 14, fontSize: 13, color: '#b91c1c' }}>No se han podido cargar las preguntas.</div>;

  const preguntas: PreguntaAdmin[] = data.preguntas ?? [];
  const cuenta = (k: string) =>
    preguntas.filter((p) =>
      k === 'todas' ? true
        : k === 'tests' ? p.estado === 'vigente' && clasificada(p)
          : k === 'simulacro' ? !clasificada(p)
            : p.estado === k,
    ).length;
  const visibles = preguntas.filter((p) =>
    filtro === 'todas' ? true
      : filtro === 'tests' ? p.estado === 'vigente' && clasificada(p)
        : filtro === 'simulacro' ? !clasificada(p)
          : p.estado === filtro,
  );

  if (preguntas.length === 0) return <div style={{ padding: 14, fontSize: 13, color: '#9ca3af' }}>Este examen todavía no tiene preguntas.</div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '10px 14px', borderBottom: '1px solid #f3f4f6' }}>
        {FILTROS.map(([k, l]) => {
          const n = cuenta(k);
          if (n === 0 && k !== 'todas' && filtro !== k) return null;
          return (
            <button
              key={k}
              onClick={() => setFiltro(k)}
              style={{ border: 'none', borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: filtro === k ? '#111827' : '#f3f4f6', color: filtro === k ? 'white' : '#4b5563' }}
            >
              {l} · {n}
            </button>
          );
        })}
      </div>
      {visibles.length === 0 && <div style={{ padding: 14, fontSize: 13, color: '#9ca3af' }}>No hay preguntas en este filtro.</div>}
      {visibles.map((p) => (
        <FilaPregunta
          key={p.id}
          p={p}
          abierta={abierta === p.id}
          onToggle={() => setAbierta(abierta === p.id ? null : p.id)}
          convocatorias={convocatorias}
          temarioPorDefecto={data.temarioPorDefecto}
          onCambio={refrescar}
        />
      ))}
    </div>
  );
}

function FilaPregunta({ p, abierta, onToggle, convocatorias, temarioPorDefecto, onCambio }: {
  p: PreguntaAdmin;
  abierta: boolean;
  onToggle: () => void;
  convocatorias: { id: string; anyo: number }[];
  temarioPorDefecto: { convocatoriaId: string; anyo: number } | null;
  onCambio: () => void;
}) {
  const est = ETIQUETA_ESTADO[p.estado] ?? ETIQUETA_ESTADO.vigente;
  const etiquetas = [
    ...p.articulos.map((a) => ({ t: `${a.ley} · Art. ${a.numero}`, c: '#1d4ed8', bg: '#eff6ff' })),
    ...p.temas.map((t) => ({ t: `Tema ${t.numero}${t.anyo ? ` (${t.anyo})` : ''}`, c: '#7c3aed', bg: '#f5f3ff' })),
  ];

  return (
    <div style={{ borderBottom: '1px solid #f3f4f6' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: abierta ? '#fafafa' : 'white', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', width: 26, flexShrink: 0 }}>{p.orden}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: '#111827', lineHeight: 1.4, ...(abierta ? {} : { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }) }}>{p.enunciado}</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
            {etiquetas.length ? etiquetas.map((e) => <Chip key={e.t} texto={e.t} color={e.c} bg={e.bg} />) : <Chip texto="Solo simulacro" color="#6b7280" bg="#f3f4f6" />}
            {p.estado !== 'vigente' && <Chip texto={est.label} color={est.color} bg={est.bg} />}
            {p.tieneCopiaActualizada && <Chip texto="Con versión actualizada" color="#15803d" bg="#f0fdf4" />}
          </div>
        </div>
        <ChevronDown size={15} color="#9ca3af" style={{ flexShrink: 0, transform: abierta ? 'rotate(180deg)' : 'none' }} />
      </button>
      {abierta && <DetallePregunta p={p} convocatorias={convocatorias} temarioPorDefecto={temarioPorDefecto} onCambio={onCambio} />}
    </div>
  );
}

function DetallePregunta({ p, convocatorias, temarioPorDefecto, onCambio }: {
  p: PreguntaAdmin;
  convocatorias: { id: string; anyo: number }[];
  temarioPorDefecto: { convocatoriaId: string; anyo: number } | null;
  onCambio: () => void;
}) {
  const [nota, setNota] = useState(p.notaActualizacion ?? '');
  const [ley, setLey] = useState(p.articulos[0]?.ley ?? '');
  const [articulo, setArticulo] = useState(p.articulos[0]?.numero ?? '');
  const [temaNumero, setTemaNumero] = useState(p.temas[0] ? String(p.temas[0].numero) : '');
  const [temarioId, setTemarioId] = useState('');
  const [guardando, setGuardando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [verCopia, setVerCopia] = useState(false);

  const llamar = async (clave: string, fn: () => Promise<any>, ok: string) => {
    setGuardando(clave);
    setMensaje(null);
    try {
      await fn();
      setMensaje({ ok: true, texto: ok });
      onCambio();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setMensaje({ ok: false, texto: Array.isArray(msg) ? msg.join(' · ') : msg || 'No se ha podido guardar.' });
    } finally {
      setGuardando(null);
    }
  };

  const cambiarEstado = (estado: string) =>
    llamar('estado', () => api.patch(`/examenes-oficiales/preguntas/${p.id}`, { estado }), 'Estado actualizado');

  const guardarClasificacion = (quitar = false) =>
    llamar(
      'clasificacion',
      () => api.patch(`/examenes-oficiales/preguntas/${p.id}`, {
        clasificacion: quitar ? null : {
          ley: ley.trim() || null,
          articulo: articulo.trim() || null,
          temaNumero: temaNumero.trim() || null,
          temarioConvocatoriaId: temarioId || null,
        },
      }),
      quitar ? 'Ahora solo sale en el simulacro' : 'Clasificación guardada',
    );

  return (
    <div style={{ padding: '4px 14px 16px 50px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {p.opciones.map((op, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, padding: '7px 10px', borderRadius: 8, background: i === p.correcta ? '#f0fdf4' : 'white', border: '1px solid #f3f4f6' }}>
            <span style={{ fontWeight: 700, fontSize: 11, color: i === p.correcta ? '#16a34a' : '#9ca3af' }}>{LETRAS[i]}</span>
            <span style={{ flex: 1 }}>{op}</span>
            {i === p.correcta && <CheckCircle2 size={14} color="#16a34a" />}
          </div>
        ))}
        {p.explicacion && <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{p.explicacion}</div>}
      </div>

      {/* Estado */}
      <Bloque titulo="Estado">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Object.entries(ETIQUETA_ESTADO).map(([k, v]) => (
            <button
              key={k}
              onClick={() => k !== p.estado && cambiarEstado(k)}
              disabled={!!guardando}
              style={{ border: `1px solid ${k === p.estado ? v.color : '#e5e7eb'}`, background: k === p.estado ? v.bg : 'white', color: k === p.estado ? v.color : '#4b5563', borderRadius: 999, padding: '4px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>
          {p.estado === 'vigente' ? (clasificada(p) ? 'Sale en los tests y en el simulacro.' : 'Sale solo en el simulacro: clasifícala para que salga también en los tests.')
            : p.estado === 'anulada' ? 'Se muestra en el simulacro pero no puntúa. No sale en los tests.'
              : p.estado === 'desactualizada' ? 'En el simulacro cuenta con la respuesta oficial de entonces y muestra el aviso. No sale en los tests.'
                : 'Solo en el simulacro, con el aviso de que ya no entra en el temario. No sale en los tests.'}
        </div>
        {p.estado === 'desactualizada' && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Qué ha cambiado (ej: tras la reforma de 2023 la correcta sería la B)" style={{ ...estiloInput, fontSize: 12 }} />
            <button
              onClick={() => llamar('nota', () => api.patch(`/examenes-oficiales/preguntas/${p.id}`, { notaActualizacion: nota }), 'Nota guardada')}
              disabled={!!guardando || nota === (p.notaActualizacion ?? '')}
              style={{ ...estiloBotonSecundario, flexShrink: 0, opacity: nota === (p.notaActualizacion ?? '') ? 0.5 : 1 }}
            >
              Guardar
            </button>
          </div>
        )}
      </Bloque>

      {/* Clasificación */}
      <Bloque titulo="Clasificación (para los tests)">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 6 }}>
          <input value={ley} onChange={(e) => setLey(e.target.value)} placeholder="Ley (siglas o nombre)" style={{ ...estiloInput, fontSize: 12 }} />
          <input value={articulo} onChange={(e) => setArticulo(e.target.value)} placeholder="Artículo" style={{ ...estiloInput, fontSize: 12 }} />
          <input value={temaNumero} onChange={(e) => setTemaNumero(e.target.value.replace(/[^\d]/g, ''))} placeholder="o Tema nº" style={{ ...estiloInput, fontSize: 12 }} />
        </div>
        {temaNumero && (
          <select value={temarioId} onChange={(e) => setTemarioId(e.target.value)} style={{ ...estiloInput, fontSize: 12, marginTop: 6 }}>
            <option value="">Temario automático{temarioPorDefecto ? ` (${temarioPorDefecto.anyo})` : ''}</option>
            {convocatorias.map((c) => <option key={c.id} value={c.id}>Temario {c.anyo}</option>)}
          </select>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button onClick={() => guardarClasificacion(false)} disabled={!!guardando || (!ley.trim() && !temaNumero.trim())} style={{ ...estiloBotonSecundario, background: '#111827', color: 'white', border: 'none', opacity: !ley.trim() && !temaNumero.trim() ? 0.4 : 1 }}>
            {guardando === 'clasificacion' ? 'Guardando…' : 'Guardar clasificación'}
          </button>
          {clasificada(p) && (
            <button onClick={() => guardarClasificacion(true)} disabled={!!guardando} style={estiloBotonSecundario}>Quitar (solo simulacro)</button>
          )}
        </div>
      </Bloque>

      {/* Versión actualizada */}
      {(p.estado === 'desactualizada' || p.estado === 'vigente') && clasificada(p) && !p.tieneCopiaActualizada && (
        <Bloque titulo="¿Ha cambiado la normativa?">
          {!verCopia ? (
            <button onClick={() => setVerCopia(true)} style={estiloBotonSecundario}>Crear versión actualizada</button>
          ) : (
            <FormCopia p={p} nota={nota} onHecho={(texto) => { setVerCopia(false); setMensaje({ ok: true, texto }); onCambio(); }} onCancelar={() => setVerCopia(false)} />
          )}
        </Bloque>
      )}

      {mensaje && <div style={{ fontSize: 12, color: mensaje.ok ? '#15803d' : '#b91c1c' }}>{mensaje.texto}</div>}
    </div>
  );
}

function FormCopia({ p, nota, onHecho, onCancelar }: { p: PreguntaAdmin; nota: string; onHecho: (t: string) => void; onCancelar: () => void }) {
  const [opciones, setOpciones] = useState<string[]>([...p.opciones]);
  const [correcta, setCorrecta] = useState(p.correcta);
  const [explicacion, setExplicacion] = useState(p.explicacion ?? '');
  const [notaCambio, setNotaCambio] = useState(nota);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crear = async () => {
    setEnviando(true);
    setError(null);
    try {
      await api.post(`/examenes-oficiales/preguntas/${p.id}/copia-actualizada`, { opciones, correcta, explicacion, notaActualizacion: notaCambio });
      onHecho('Versión actualizada creada: sale en los tests y la original queda como desactualizada en el simulacro');
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(' · ') : msg || 'No se ha podido crear.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 11, color: '#6b7280' }}>Marca la respuesta correcta hoy. La original se queda en el examen como desactualizada.</div>
      {opciones.map((op, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="radio" checked={correcta === i} onChange={() => setCorrecta(i)} aria-label={`Correcta ${LETRAS[i]}`} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', width: 12 }}>{LETRAS[i]}</span>
          <input value={op} onChange={(e) => setOpciones((prev) => prev.map((o, j) => (j === i ? e.target.value : o)))} style={{ ...estiloInput, fontSize: 12 }} />
        </div>
      ))}
      <input value={explicacion} onChange={(e) => setExplicacion(e.target.value)} placeholder="Explicación (opcional)" style={{ ...estiloInput, fontSize: 12 }} />
      <input value={notaCambio} onChange={(e) => setNotaCambio(e.target.value)} placeholder="Aviso para el simulacro: qué ha cambiado" style={{ ...estiloInput, fontSize: 12 }} />
      {error && <div style={{ fontSize: 12, color: '#b91c1c' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={crear} disabled={enviando} style={{ ...estiloBotonSecundario, background: '#111827', color: 'white', border: 'none' }}>{enviando ? 'Creando…' : 'Crear versión actualizada'}</button>
        <button onClick={onCancelar} style={estiloBotonSecundario}>Cancelar</button>
      </div>
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>{titulo}</div>
      {children}
    </div>
  );
}
