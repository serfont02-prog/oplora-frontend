'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';



/* ================= MAPA ================= */

type MapaProps = {
  selected: string | null;
  onSelect: (ccaa: string) => void;
};

const iconosCategoria = {
  administracion_general: '📄',
  seguridad: '👮',
  justicia: '⚖️',
  sanidad: '🏥',
};

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

const MapaCCAA = ({ selected, onSelect }: MapaProps) => (
  <div style={{ width: '100%', textAlign: 'center', marginTop: 10 }}>
    <svg viewBox="0 0 500 500" style={{ width: '100%' }}>
      {REGIONES.map((r) => (
        <motion.g
          key={r.name}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <circle
            cx={r.x}
            cy={r.y}
            r={selected === r.name ? 20 : 14}
            fill={selected === r.name ? '#1F7CFF' : '#BFDBFE'}
            onClick={() => onSelect(r.name)}
            style={{ cursor: 'pointer' }}
          />
          <text
            x={r.x}
            y={r.y - 22}
            textAnchor="middle"
            fontSize="11"
            fill="#0A2A43"
          >
            {r.name}
          </text>
        </motion.g>
      ))}
    </svg>
  </div>
);

/* ================= TYPES ================= */

type Tipo = 'estado' | 'ccaa' | 'empresa_publica';
type Categoria = 'administracion_general' | 'seguridad' | 'justicia' | 'sanidad';
type Turno = 'libre' | 'promocion_interna';
type Subgrupo = 'A1' | 'A2' | 'C1' | 'C2';

type Oposicion = {
  id: string;
  nombre: string;
  administracion?: string;
  tipoAdministracion: Tipo;
  categoria?: Categoria;
  subgrupo: Subgrupo;
  turno: Turno;
};

/* ================= CONFIG ================= */

const TIPOS = [
  { id: 'estado', label: 'Estado', icon: '🏛️' },
  { id: 'ccaa', label: 'CCAA', icon: '🗺️' },
  { id: 'empresa_publica', label: 'Empresa pública', icon: '🏤' },
];

const CATEGORIAS = [
  { id: 'administracion_general', label: 'Administración', icon: '📄' },
  { id: 'seguridad', label: 'Seguridad', icon: '👮' },
  { id: 'justicia', label: 'Justicia', icon: '⚖️' },
  { id: 'sanidad', label: 'Sanidad', icon: '🏥' },
];

const TURNOS = [
  { id: 'libre', label: 'Libre' },
  { id: 'promocion_interna', label: 'Promoción interna' },
];

const SUBGRUPOS: Subgrupo[] = ['A1', 'A2', 'C1', 'C2'];

const normalizar = (v: any) => (v || '').toLowerCase().trim();

/* ================= UI HELPERS ================= */

const Card = ({ children, onClick }: any) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.97 }}
    style={{
      width: '100%',
      textAlign: 'left',
      padding: '18px 20px',
      borderRadius: 14,
      border: '1px solid #e5e7eb',
      background: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      fontWeight: 600,
      boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
    }}
    onClick={onClick}
  >
    {children}
  </motion.button>
);

const Chip = ({ label, onClick }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    style={{
      padding: '6px 12px',
      borderRadius: 999,
      background: '#E0ECFF',
      color: '#1F7CFF',
      fontSize: 12,
      cursor: 'pointer',
      fontWeight: 600,
    }}
    onClick={onClick}
  >
    {label}
  </motion.div>
);

/* ================= PAGE ================= */

export default function OnboardingOposicionPage() {
  const router = useRouter();

  const [oposiciones, setOposiciones] = useState<Oposicion[]>([]);

  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [turno, setTurno] = useState<Turno | null>(null);
  const [subgrupo, setSubgrupo] = useState<Subgrupo | null>(null);
  const [ccaa, setCcaa] = useState<string | null>(null);

  /* ================= CASCADA ================= */

  const handleTipo = (t: Tipo) => {
    setTipo(t);

    if (t === 'estado') {
      setCcaa(null); // 🔥 CORRECCIÓN CRÍTICA
    }

    if (t !== 'estado') {
      setCategoria(null);
    }

    setTurno(null);
    setSubgrupo(null);
  };

  const clearTipo = () => {
    setTipo(null);
    setCategoria(null);
    setCcaa(null);
    setTurno(null);
    setSubgrupo(null);
  };

  const clearCategoria = () => {
    setCategoria(null);
    setCcaa(null);
    setTurno(null);
    setSubgrupo(null);
  };

  const clearCcaa = () => {
    setCcaa(null);
    setTurno(null);
    setSubgrupo(null);
  };

  const clearTurno = () => {
    setTurno(null);
    setSubgrupo(null);
  };

  const clearSubgrupo = () => {
    setSubgrupo(null);
  };


  const { usuario, actualizarUsuario } = useAuth();
  /* ================= DATA ================= */

  useEffect(() => {
    api.get('/oposiciones').then((res) => setOposiciones(res.data));
  }, []);

  const filtradas = useMemo(() => {
    let lista = oposiciones;
    if (tipo) lista = lista.filter(op => op.tipoAdministracion === tipo);
    if (tipo === 'estado' && categoria)
      lista = lista.filter(op => op.categoria === categoria);
    if (tipo === 'ccaa' && ccaa)
      lista = lista.filter(op => normalizar(op.administracion) === normalizar(ccaa));
    if (turno) lista = lista.filter(op => op.turno === turno);
    if (subgrupo) lista = lista.filter(op => op.subgrupo === subgrupo);

    return lista;
  }, [oposiciones, tipo, categoria, turno, subgrupo, ccaa]);


  //Una vez elegida oposicion vamos a la siguiente pantalla

  const seleccionar = async (id: string) => {
  // 1. Activar oposición en backend
  const res = await api.post(`/usuarios/activar-oposicion/${id}`);

  // 2. Volver a cargar el usuario actualizado
  const me = await api.get('/usuarios/me');

  // 3. Actualizar el contexto global
  actualizarUsuario(me.data);

  // 4. Continuar flujo
  if (me.data.objetivo === 'aprobar' || me.data.objetivo === 'trabajo') {
    router.push('/app/onboarding/experiencia');
    return;
  }

  router.push('/app/onboarding/compromiso');
};



  /* ================= UI ================= */

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0A2A43 0%, #0F3A63 100%)',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <main
        style={{
          background: 'white',
          borderRadius: 20,
          border: '1px solid #e5e7eb',
          padding: '3rem 2.5rem',
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
        }}
      >
        <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <Image
            src="/prueba.svg"
            alt="Oplora"
            width={200}
            height={70}
            priority
            style={{ marginBottom: 10 }}
          />

          {/* PROGRESS */}
          <div style={{ marginTop: 10, marginBottom: 14 }}>
            <div
              style={{
                height: 6,
                width: '100%',
                background: '#e5e7eb',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '40%' }} // Paso 2 de 5
                transition={{ duration: 0.4 }}
                style={{
                  height: '100%',
                  background: '#1F7CFF',
                }}
              />
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#9ca3af',
                marginTop: 6,
              }}
            >
              Paso 2 de 5
            </div>
          </div>

          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: '#0A2A43',
              margin: '10px 0 8px',
            }}
          >
            Elige tu oposición ideal
          </h1>
        </header>

        {/* CHIPS */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {tipo && <Chip label={tipo} onClick={clearTipo} />}
          {categoria && <Chip label={categoria} onClick={clearCategoria} />}
          {ccaa && <Chip label={ccaa} onClick={clearCcaa} />}
          {turno && <Chip label={turno} onClick={clearTurno} />}
          {subgrupo && <Chip label={subgrupo} onClick={clearSubgrupo} />}
        </div>

        {/* OPTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AnimatePresence>
            {!tipo &&
              TIPOS.map(t => (
                <Card key={t.id} onClick={() => handleTipo(t.id as Tipo)}>
                  <div style={{ fontSize: 26 }}>{t.icon}</div>
                  <div>{t.label}</div>
                </Card>
              ))}

            {tipo === 'estado' && !categoria &&
              CATEGORIAS.map(c => (
                <Card key={c.id} onClick={() => setCategoria(c.id as Categoria)}>
                  <div style={{ fontSize: 26 }}>{c.icon}</div>
                  <div>{c.label}</div>
                </Card>
              ))}

            {tipo === 'ccaa' && !ccaa && (
              <MapaCCAA selected={ccaa} onSelect={setCcaa} />
            )}

            {tipo && (tipo !== 'estado' ? ccaa : categoria) && !turno &&
              TURNOS.map(t => (
                <Card key={t.id} onClick={() => setTurno(t.id as Turno)}>
              <div style={{ fontSize: 22, marginRight: 8 }}>
                {t.id === 'libre' ? '🎯' : '📈'}
              </div>
              <div>{t.label}</div>
            </Card>
              ))}

            {turno && !subgrupo &&
              SUBGRUPOS.map(s => (
                <Card key={s} onClick={() => setSubgrupo(s)}>
                  <div>Subgrupo {s}</div>
                </Card>
              ))}

            {/* RESULTADOS */}
            {subgrupo && (
              filtradas.length > 0 ? (
                filtradas.map(op => (
                  <Card key={op.id} onClick={() => seleccionar(op.id)}>
                  <div style={{ fontSize: 22, marginRight: 10 }}>
                    {op.categoria
                      ? iconosCategoria[op.categoria]
                      : '📘'}
                  </div>

                  <div>{op.nombre}</div>
                </Card>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    textAlign: 'center',
                    padding: '20px 10px',
                    color: '#6b7280',
                    fontSize: 15,
                    fontWeight: 500,
                  }}
                >
                  No hay oposiciones disponibles con estos criterios

                  <button
                    onClick={() => {
                      setCategoria(null);
                      setCcaa(null);
                      setTurno(null);
                      setSubgrupo(null);
                    }}
                    style={{
                      marginTop: 16,
                      padding: '10px 16px',
                      background: '#1F7CFF',
                      color: 'white',
                      borderRadius: 10,
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Reiniciar filtros
                  </button>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
