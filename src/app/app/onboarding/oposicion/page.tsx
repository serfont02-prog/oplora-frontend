'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ChevronRight, X, Check } from 'lucide-react';

const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

/* ================= TYPES ================= */

type Tipo = 'estado' | 'ccaa' | 'empresa_publica';
type Categoria = 'administracion_general' | 'seguridad' | 'justicia' | 'sanidad';
type Subgrupo = 'A1' | 'A2' | 'B' | 'C1' | 'C2';

type Oposicion = {
  id: string;
  nombre: string;
  administracion?: string;
  tipoAdministracion: Tipo;
  categoria?: Categoria;
  subgrupo?: Subgrupo;
};

/* ================= CONFIG ================= */

const TIPOS = [
  { id: 'estado', label: 'Estado', icon: '🏛️' },
  { id: 'ccaa', label: 'Comunidad Autónoma', icon: '🌎' },
  { id: 'empresa_publica', label: 'Empresa pública', icon: '🏢' },
];

const CATEGORIAS = [
  { id: 'administracion_general', label: 'Administración', icon: '📄' },
  { id: 'seguridad', label: 'Seguridad', icon: '👮' },
  { id: 'justicia', label: 'Justicia', icon: '⚖️' },
  { id: 'sanidad', label: 'Sanidad', icon: '🏥' },
];

const SUBGRUPOS_POR_CATEGORIA: Record<string, Subgrupo[]> = {
  administracion_general: ['A1', 'A2', 'C1', 'C2'],
  sanidad: ['A1', 'A2', 'B', 'C1', 'C2'],
  justicia: ['A1', 'A2', 'C1', 'C2'], // sin B
};

const iconosCategoria: Record<string, string> = {
  administracion_general: '📄',
  seguridad: '👮',
  justicia: '⚖️',
  sanidad: '🏥',
};

const LABEL_TIPO: Record<string, string> = {
  estado: 'Estado',
  ccaa: 'Comunidad Autónoma',
  empresa_publica: 'Empresa pública',
};
const LABEL_CATEGORIA: Record<string, string> = {
  administracion_general: 'Administración',
  seguridad: 'Seguridad',
  justicia: 'Justicia',
  sanidad: 'Sanidad',
};

const normalizar = (v: any) => (v || '').toLowerCase().trim();

/* ================= MAPA CCAA ================= */

const REGIONES = [
  { name: 'Galicia', x: 80, y: 140 },
  { name: 'Asturias', x: 160, y: 100 },
  { name: 'Cantabria', x: 220, y: 100 },
  { name: 'País Vasco', x: 280, y: 100 },
  { name: 'Navarra', x: 320, y: 130 },
  { name: 'La Rioja', x: 260, y: 150 },
  { name: 'Aragón', x: 360, y: 190 },
  { name: 'Cataluña', x: 440, y: 170 },
  { name: 'Castilla y León', x: 220, y: 200 },
  { name: 'Madrid', x: 260, y: 260 },
  { name: 'Castilla-La Mancha', x: 300, y: 320 },
  { name: 'Extremadura', x: 180, y: 320 },
  { name: 'Comunidad Valenciana', x: 400, y: 280 },
  { name: 'Murcia', x: 380, y: 350 },
  { name: 'Andalucía', x: 260, y: 420 },
  { name: 'Baleares', x: 480, y: 260 },
  { name: 'Canarias', x: 100, y: 470 },
];

const MapaCCAA = ({ selected, onSelect }: { selected: string | null; onSelect: (c: string) => void }) => (
  <div style={{ width: '100%', textAlign: 'center', marginTop: 6 }}>
    <svg viewBox="0 0 500 500" style={{ width: '100%' }}>
      {REGIONES.map((r) => (
        <motion.g key={r.name} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
          <circle
            cx={r.x} cy={r.y}
            r={selected === r.name ? 18 : 12}
            fill={selected === r.name ? '#1F7CFF' : '#BFDBFE'}
            onClick={() => onSelect(r.name)}
            style={{ cursor: 'pointer' }}
          />
          <text x={r.x} y={r.y - 20} textAnchor="middle" fontSize="10" fill={TEXT_PRIMARY}>
            {r.name}
          </text>
        </motion.g>
      ))}
    </svg>
  </div>
);

/* ================= PAGE ================= */

export default function OnboardingOposicionPage() {
  const router = useRouter();
  const { actualizarUsuario } = useAuth();

  const [oposiciones, setOposiciones] = useState<Oposicion[]>([]);
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [subgrupo, setSubgrupo] = useState<Subgrupo | null>(null);
  const [ccaa, setCcaa] = useState<string | null>(null);
  const [seleccionando, setSeleccionando] = useState<string | null>(null);

  useEffect(() => {
    api.get('/oposiciones').then((res) => setOposiciones(res.data));
  }, []);

  const clearTipo = () => { setTipo(null); setCategoria(null); setCcaa(null); setSubgrupo(null); };
  const clearCategoria = () => { setCategoria(null); setCcaa(null); setSubgrupo(null); };
  const clearCcaa = () => { setCcaa(null); setSubgrupo(null); };
  const clearSubgrupo = () => { setSubgrupo(null); };

  const necesitaSubgrupo = categoria ? !!SUBGRUPOS_POR_CATEGORIA[categoria] : false;

  const filtroCompleto = !tipo
    ? false
    : tipo === 'empresa_publica'
      ? true
      : tipo === 'estado'
        ? (!!categoria && (!necesitaSubgrupo || !!subgrupo))
        : (!!ccaa && !!categoria && (!necesitaSubgrupo || !!subgrupo)); // ccaa

  const filtradas = useMemo(() => {
    if (!filtroCompleto) return [];
    let lista = oposiciones;
    if (tipo) lista = lista.filter((op) => op.tipoAdministracion === tipo);
    if (categoria) lista = lista.filter((op) => op.categoria === categoria);
    if (tipo === 'ccaa' && ccaa) lista = lista.filter((op) => normalizar(op.administracion) === normalizar(ccaa));
    if (subgrupo) lista = lista.filter((op) => op.subgrupo === subgrupo);
    return lista;
  }, [oposiciones, tipo, categoria, subgrupo, ccaa, filtroCompleto]);

  const seleccionar = async (idOpo: string) => {
    await api.post(`/usuarios/activar-oposicion/${idOpo}`);
    const me = await api.get('/usuarios/me');
    actualizarUsuario(me.data);

    if (me.data.objetivo === 'aprobar' || me.data.objetivo === 'trabajo') {
      router.push('/app/onboarding/experiencia');
      return;
    }
    router.push('/app/onboarding/minireto');
  };

  const seleccionarConAnimacion = (id: string, callback: () => void) => {
    setSeleccionando(id);
    setTimeout(() => {
      callback();
      setSeleccionando(null);
    }, 250);
  };

  const tituloPaso = !tipo ? '¿Dónde quieres trabajar?'
    : (tipo === 'estado' && !categoria) ? '¿Qué área?'
    : (tipo === 'ccaa' && !ccaa) ? '¿En qué comunidad?'
    : (tipo === 'ccaa' && ccaa && !categoria) ? '¿Qué área?'
    : (necesitaSubgrupo && !subgrupo) ? '¿Qué subgrupo?'
    : null;

  /* ================= UI HELPERS ================= */

  const Card = ({ children, onClick, activo, atenuado }: any) => (
    <motion.button
      whileTap={!activo && !atenuado ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={!!seleccionando}
      style={{
        width: '100%', textAlign: 'left', padding: '13px 14px',
        borderRadius: 12,
        border: activo ? '2px solid #1F7CFF' : '1px solid #F1F5F9',
        background: activo ? '#EAF0FF' : 'white',
        cursor: seleccionando ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
        transform: activo ? 'scale(1.015)' : 'scale(1)',
        opacity: atenuado ? 0.4 : 1,
        transition: 'transform 0.2s ease, opacity 0.2s ease, background 0.2s ease, border-color 0.2s ease',
      }}
    >
      {children}
    </motion.button>
  );

  const Chip = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <motion.button
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 10px 5px 12px', borderRadius: 999,
        background: '#EAF0FF', color: '#1F7CFF',
        fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
      }}
    >
      {label}
      <X size={12} />
    </motion.button>
  );

  const IconoCaja = ({ children, activo }: { children: React.ReactNode; activo?: boolean }) => (
    <div style={{
      width: 38, height: 38, borderRadius: 10,
      background: activo ? '#DCE9FF' : '#F4F5F7',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 17, flexShrink: 0, transition: 'background 0.2s',
    }}>
      {children}
    </div>
  );

  /* ================= RENDER ================= */

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <main style={{ background: 'white', borderRadius: 20, padding: '2.25rem 2rem', width: '100%', maxWidth: 440 }}>

        <header style={{ marginBottom: 20, textAlign: 'center' }}>
          <Image src="/prueba.svg" alt="Oplora" width={200} height={68} priority style={{ marginBottom: 2 }} />

          <div style={{ marginTop: 12, marginBottom: 14 }}>
            <div style={{ height: 4, width: '100%', background: '#E5E7EB', borderRadius: 999, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '40%' }}
                transition={{ duration: 0.4 }}
                style={{ height: '100%', background: '#1F7CFF', borderRadius: 999 }}
              />
            </div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 6 }}>Paso 2 de 5</div>
          </div>

          <h1 style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 4px' }}>
            Elige tu oposición
          </h1>
          <p style={{ fontSize: 13, color: TEXT_SECONDARY, margin: 0 }}>
            Te ayudaremos a encontrar la adecuada
          </p>
        </header>

        {(tipo || categoria || ccaa || subgrupo) && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {tipo && <Chip label={LABEL_TIPO[tipo]} onClick={clearTipo} />}
            {ccaa && <Chip label={ccaa} onClick={clearCcaa} />}
            {categoria && <Chip label={LABEL_CATEGORIA[categoria]} onClick={clearCategoria} />}
            {subgrupo && <Chip label={subgrupo} onClick={clearSubgrupo} />}
          </div>
        )}

        {tituloPaso && (
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 10 }}>
            {tituloPaso}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AnimatePresence mode="wait">

            {!tipo && (
              <motion.div key="tipos" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TIPOS.map((t) => {
                  const activo = seleccionando === t.id;
                  const atenuado = seleccionando !== null && !activo;
                  return (
                    <Card key={t.id} activo={activo} atenuado={atenuado} onClick={() => seleccionarConAnimacion(t.id, () => setTipo(t.id as Tipo))}>
                      <IconoCaja activo={activo}>{t.icon}</IconoCaja>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: activo ? '#1F7CFF' : TEXT_PRIMARY }}>{t.label}</div>
                      {activo ? <Check size={15} color="#1F7CFF" /> : <ChevronRight size={15} color="#D1D5DB" />}
                    </Card>
                  );
                })}
              </motion.div>
            )}

            {/* CCAA: primero elegir comunidad */}
            {tipo === 'ccaa' && !ccaa && (
              <motion.div key="mapa">
                <MapaCCAA selected={ccaa} onSelect={(c) => seleccionarConAnimacion(c, () => setCcaa(c))} />
              </motion.div>
            )}

            {/* Categoría: para Estado directo, o CCAA tras elegir comunidad */}
            {((tipo === 'estado') || (tipo === 'ccaa' && ccaa)) && !categoria && (
              <motion.div key="categorias" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {CATEGORIAS.map((c) => {
                  const activo = seleccionando === c.id;
                  const atenuado = seleccionando !== null && !activo;
                  return (
                    <Card key={c.id} activo={activo} atenuado={atenuado} onClick={() => seleccionarConAnimacion(c.id, () => setCategoria(c.id as Categoria))}>
                      <IconoCaja activo={activo}>{c.icon}</IconoCaja>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: activo ? '#1F7CFF' : TEXT_PRIMARY }}>{c.label}</div>
                      {activo ? <Check size={15} color="#1F7CFF" /> : <ChevronRight size={15} color="#D1D5DB" />}
                    </Card>
                  );
                })}
              </motion.div>
            )}

            {/* Subgrupo: solo si la categoría lo requiere */}
            {categoria && necesitaSubgrupo && !subgrupo && (
              <motion.div key="subgrupos" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(SUBGRUPOS_POR_CATEGORIA[categoria] ?? []).map((s) => {
                  const activo = seleccionando === s;
                  const atenuado = seleccionando !== null && !activo;
                  return (
                    <Card key={s} activo={activo} atenuado={atenuado} onClick={() => seleccionarConAnimacion(s, () => setSubgrupo(s))}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: activo ? '#DCE9FF' : '#F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#1F7CFF', flexShrink: 0, transition: 'background 0.2s' }}>{s}</div>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: activo ? '#1F7CFF' : TEXT_PRIMARY }}>Subgrupo {s}</div>
                      {activo ? <Check size={15} color="#1F7CFF" /> : <ChevronRight size={15} color="#D1D5DB" />}
                    </Card>
                  );
                })}
              </motion.div>
            )}

            {/* RESULTADO ÚNICO */}
            {filtroCompleto && !seleccionando && filtradas.length === 1 && (
              <motion.div key="resultado" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  style={{ fontSize: 13, fontWeight: 600, color: '#16A34A', textAlign: 'center', marginBottom: 12 }}
                >
                  ✓ Oposicion encontrada
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.25 }}
                  style={{ background: '#0f172a', borderRadius: 16, padding: '20px 18px', color: 'white', textAlign: 'center' }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>
                    {filtradas[0].categoria ? iconosCategoria[filtradas[0].categoria] : '📘'}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, marginBottom: 6 }}>
                    {filtradas[0].nombre}
                  </div>
                  {filtradas[0].subgrupo && (
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      {filtradas[0].subgrupo}
                    </div>
                  )}
                </motion.div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, delay: 0.6 }}
                  onClick={() => seleccionar(filtradas[0].id)}
                  style={{ width: '100%', marginTop: 12, padding: 13, background: '#1F7CFF', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  Esta es mi oposición →
                </motion.button>
              </motion.div>
            )}

            {filtroCompleto && !seleccionando && filtradas.length > 1 && (
              <motion.div key="lista-multiple" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 2 }}>
                  Hemos encontrado {filtradas.length} oposiciones
                </div>
                {filtradas.map((op) => (
                  <Card key={op.id} onClick={() => seleccionar(op.id)}>
                    <IconoCaja>{op.categoria ? iconosCategoria[op.categoria] : '📘'}</IconoCaja>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{op.nombre}</div>
                    <ChevronRight size={15} color="#D1D5DB" />
                  </Card>
                ))}
              </motion.div>
            )}

            {filtroCompleto && !seleccionando && filtradas.length === 0 && (
              <motion.div key="vacio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 14 }}>
                  No hay oposiciones disponibles con estos criterios
                </div>
                <button
                  onClick={() => { setCategoria(null); setCcaa(null); setSubgrupo(null); }}
                  style={{ padding: '10px 18px', background: '#111827', color: 'white', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                >
                  Reiniciar filtros
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}