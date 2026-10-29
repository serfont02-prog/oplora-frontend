'use client';

// ⭐ Onboarding · paso 2: elegir oposición (Estado / Comunidad / Empresa pública → área → subgrupo).
// Se reutiliza desde Ajustes > Cambiar de oposición (?modo=cambiar) sin el resto del embudo.
// - Solo se ofrecen oposiciones publicadas (antes salían también las que estaban en preparación).
// - Cada opción muestra cuántas oposiciones hay y las que no tienen ninguna salen desactivadas,
//   para no llevar al usuario a un "no hay oposiciones" al final.
// - Al cambiar de oposición (Ajustes) no se ofrece la que ya tienes: antes se podía "cambiar" a la misma.
// - El "mapa" de comunidades era una nube de puntos difícil de tocar en móvil: ahora es una lista.

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Landmark, MapPinned, Building2, FileText, Shield, Scale, HeartPulse, GraduationCap, X, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PantallaOnboarding, OpcionOnboarding, ListaOpciones } from '@/components/onboarding/PantallaOnboarding';
import { AvisoAuth, BotonAuth, SOMBRA } from '@/components/auth/PantallaAuth';
import { COLOR_MARCA } from '@/components/marca/LogoOplora';
import { BG_DASHBOARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '@/styles/tokens';

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

const TIPOS: { id: Tipo; label: string; sub: string; icono: any; color: string; fondo: string }[] = [
  { id: 'estado', label: 'Estado', sub: 'Policía Nacional, Guardia Civil, AGE…', icono: Landmark, color: 'var(--hx-1f7cff)', fondo: 'var(--hx-eaf0ff)' },
  { id: 'ccaa', label: 'Comunidad Autónoma', sub: 'Oposiciones de tu comunidad', icono: MapPinned, color: 'var(--hx-4d7c0f)', fondo: 'var(--hx-ecfccb)' },
  { id: 'empresa_publica', label: 'Empresa pública', sub: 'Correos, Renfe, Adif…', icono: Building2, color: 'var(--hx-6b5f3e)', fondo: 'var(--hx-ede9dd)' },
];

const CATEGORIAS: { id: Categoria; label: string; icono: any; color: string; fondo: string }[] = [
  { id: 'administracion_general', label: 'Administración', icono: FileText, color: 'var(--hx-4f46e5)', fondo: 'var(--hx-e0e7ff)' },
  { id: 'seguridad', label: 'Seguridad', icono: Shield, color: 'var(--hx-1f7cff)', fondo: 'var(--hx-eaf0ff)' },
  { id: 'justicia', label: 'Justicia', icono: Scale, color: 'var(--hx-6b5f3e)', fondo: 'var(--hx-ede9dd)' },
  { id: 'sanidad', label: 'Sanidad', icono: HeartPulse, color: 'var(--hx-be123c)', fondo: 'var(--hx-ffe4e6)' },
];
const ICONO_CATEGORIA: Record<string, any> = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c.icono]));

const SUBGRUPOS_POR_CATEGORIA: Record<string, Subgrupo[]> = {
  administracion_general: ['A1', 'A2', 'C1', 'C2'],
  sanidad: ['A1', 'A2', 'B', 'C1', 'C2'],
  justicia: ['A1', 'A2', 'C1', 'C2'],
};

const COMUNIDADES = [
  'Andalucía', 'Aragón', 'Asturias', 'Baleares', 'Canarias', 'Cantabria', 'Castilla y León', 'Castilla-La Mancha',
  'Cataluña', 'Comunidad Valenciana', 'Extremadura', 'Galicia', 'La Rioja', 'Madrid', 'Murcia', 'Navarra', 'País Vasco',
];

const LABEL_TIPO: Record<string, string> = { estado: 'Estado', ccaa: 'Comunidad Autónoma', empresa_publica: 'Empresa pública' };
const LABEL_CATEGORIA: Record<string, string> = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c.label]));

const normalizar = (v: any) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const textoNum = (n: number) => (n === 0 ? 'Sin oposiciones todavía' : n === 1 ? '1 oposición' : `${n} oposiciones`);

function OnboardingOposicionPage() {
  const router = useRouter();
  const modoCambio = useSearchParams().get('modo') === 'cambiar';
  const { usuario, actualizarUsuario } = useAuth();
  const actual = modoCambio ? usuario?.oposicionActiva : null;

  const [oposiciones, setOposiciones] = useState<Oposicion[] | null>(null);
  const [errorCarga, setErrorCarga] = useState(false);
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [subgrupo, setSubgrupo] = useState<Subgrupo | null>(null);
  const [ccaa, setCcaa] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [error, setError] = useState('');

  const cargar = () => {
    setErrorCarga(false);
    setOposiciones(null);
    api.get('/oposiciones', { params: { publicadas: 1 } })
      .then((res) => setOposiciones(res.data ?? []))
      .catch(() => setErrorCarga(true));
  };
  useEffect(cargar, []);

  const lista = useMemo(
    () => (oposiciones ?? []).filter((o) => !actual?.id || o.id !== actual.id),
    [oposiciones, actual?.id],
  );
  const sinAlternativas = modoCambio && !!oposiciones && lista.length === 0;
  const necesitaSubgrupo = categoria ? !!SUBGRUPOS_POR_CATEGORIA[categoria] : false;

  // Oposiciones que encajan con lo elegido hasta ahora (sin aplicar el paso que se está mostrando)
  const base = useMemo(() => {
    let l = lista;
    if (tipo) l = l.filter((o) => o.tipoAdministracion === tipo);
    if (tipo === 'ccaa' && ccaa) l = l.filter((o) => normalizar(o.administracion) === normalizar(ccaa));
    if (categoria) l = l.filter((o) => o.categoria === categoria);
    if (subgrupo) l = l.filter((o) => o.subgrupo === subgrupo);
    return l;
  }, [lista, tipo, ccaa, categoria, subgrupo]);

  const filtroCompleto = !tipo
    ? false
    : tipo === 'empresa_publica'
      ? true
      : tipo === 'estado'
        ? !!categoria && (!necesitaSubgrupo || !!subgrupo)
        : !!ccaa && !!categoria && (!necesitaSubgrupo || !!subgrupo);

  const pasoActual: 'tipo' | 'ccaa' | 'categoria' | 'subgrupo' | 'resultado' =
    !tipo ? 'tipo'
      : tipo === 'ccaa' && !ccaa ? 'ccaa'
        : tipo !== 'empresa_publica' && !categoria ? 'categoria'
          : necesitaSubgrupo && !subgrupo ? 'subgrupo'
            : 'resultado';

  const tituloPaso: Record<typeof pasoActual, string> = {
    tipo: '¿Dónde quieres trabajar?',
    ccaa: '¿En qué comunidad?',
    categoria: '¿En qué área?',
    subgrupo: '¿Qué subgrupo?',
    resultado: base.length === 1 ? 'Hemos encontrado tu oposición' : base.length > 1 ? 'Elige tu oposición' : 'Sin resultados',
  };

  const seleccionar = async (id: string) => {
    setGuardando(id);
    setError('');
    try {
      await api.post(`/usuarios/activar-oposicion/${id}`);
      const me = await api.get('/usuarios/me');
      actualizarUsuario(me.data);
      router.push(modoCambio ? '/app/dashboard' : '/app/onboarding/experiencia');
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'No se ha podido guardar tu oposición. Inténtalo de nuevo.');
      setGuardando(null);
    }
  };

  const limpiar = (desde: 'tipo' | 'ccaa' | 'categoria' | 'subgrupo') => {
    setError('');
    if (desde === 'tipo') { setTipo(null); setCcaa(null); setCategoria(null); setSubgrupo(null); }
    if (desde === 'ccaa') { setCcaa(null); setCategoria(null); setSubgrupo(null); }
    if (desde === 'categoria') { setCategoria(null); setSubgrupo(null); }
    if (desde === 'subgrupo') setSubgrupo(null);
  };

  const contenido = (
    <>
      {(tipo || ccaa || categoria || subgrupo) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {tipo && <Chip label={LABEL_TIPO[tipo]} onClick={() => limpiar('tipo')} />}
          {ccaa && <Chip label={ccaa} onClick={() => limpiar('ccaa')} />}
          {categoria && <Chip label={LABEL_CATEGORIA[categoria]} onClick={() => limpiar('categoria')} />}
          {subgrupo && <Chip label={subgrupo} onClick={() => limpiar('subgrupo')} />}
        </div>
      )}

      {errorCarga ? (
        <>
          <AvisoAuth>No se han podido cargar las oposiciones. Comprueba la conexión.</AvisoAuth>
          <div style={{ marginTop: 12 }}><BotonAuth type="button" onClick={cargar}>Reintentar</BotonAuth></div>
        </>
      ) : !oposiciones ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '28px 0', fontSize: 13, color: TEXT_SECONDARY }}>
          <Loader2 size={18} color={COLOR_MARCA} style={{ animation: 'oplora-girar 0.8s linear infinite' }} /> Cargando oposiciones…
        </div>
      ) : (
        <>
          {sinAlternativas ? (
            <div style={{ textAlign: 'center', padding: '10px 4px', fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
              Por ahora no hay otras oposiciones disponibles. Si la tuya no está, pídenosla desde Soporte.
            </div>
          ) : (
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 10 }}>{tituloPaso[pasoActual]}</div>
          )}

          {!sinAlternativas && pasoActual === 'tipo' && (
            <ListaOpciones>
              {TIPOS.map((t) => {
                const n = lista.filter((o) => o.tipoAdministracion === t.id).length;
                return (
                  <OpcionOnboarding key={t.id} icono={t.icono} color={t.color} fondo={t.fondo} titulo={t.label} subtitulo={n ? t.sub : textoNum(0)} atenuada={!n} disabled={!n} onClick={() => setTipo(t.id)} />
                );
              })}
            </ListaOpciones>
          )}

          {pasoActual === 'ccaa' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {COMUNIDADES.map((c) => {
                const n = base.filter((o) => normalizar(o.administracion) === normalizar(c)).length;
                return (
                  <button
                    key={c}
                    onClick={() => setCcaa(c)}
                    disabled={!n}
                    style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 12, border: '2px solid var(--hx-eef0f3)', background: 'var(--c-superficie)', cursor: n ? 'pointer' : 'default', opacity: n ? 1 : 0.45 }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.3 }}>{c}</div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{n ? textoNum(n) : 'Próximamente'}</div>
                  </button>
                );
              })}
            </div>
          )}

          {pasoActual === 'categoria' && (
            <ListaOpciones>
              {CATEGORIAS.map((c) => {
                const n = base.filter((o) => o.categoria === c.id).length;
                return <OpcionOnboarding key={c.id} icono={c.icono} color={c.color} fondo={c.fondo} titulo={c.label} subtitulo={textoNum(n)} atenuada={!n} disabled={!n} onClick={() => setCategoria(c.id)} />;
              })}
            </ListaOpciones>
          )}

          {pasoActual === 'subgrupo' && categoria && (
            <ListaOpciones>
              {(SUBGRUPOS_POR_CATEGORIA[categoria] ?? []).map((s) => {
                const n = base.filter((o) => o.subgrupo === s).length;
                return <OpcionOnboarding key={s} etiquetaCaja={s} titulo={`Subgrupo ${s}`} subtitulo={textoNum(n)} atenuada={!n} disabled={!n} onClick={() => setSubgrupo(s)} />;
              })}
            </ListaOpciones>
          )}

          {pasoActual === 'resultado' && filtroCompleto && base.length === 1 && (
            <div style={{ animation: 'oplora-aparecer 0.3s ease' }}>
              <div style={{ background: 'var(--hxhero-0f172a)', borderRadius: 18, padding: '18px 16px', color: 'white', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(31,124,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {(() => { const I = (base[0].categoria && ICONO_CATEGORIA[base[0].categoria]) || GraduationCap; return <I size={22} color="var(--hx-93c5fd)" />; })()}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{base[0].nombre}</div>
                  {(base[0].subgrupo || base[0].administracion) && (
                    <div style={{ fontSize: 12, color: 'var(--hx-94a3b8)', marginTop: 3 }}>
                      {[base[0].administracion, base[0].subgrupo && `Subgrupo ${base[0].subgrupo}`].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              </div>
              {error && <div style={{ marginTop: 12 }}><AvisoAuth>{error}</AvisoAuth></div>}
              <div style={{ marginTop: 12 }}>
                <BotonAuth type="button" onClick={() => seleccionar(base[0].id)} cargando={guardando === base[0].id} textoCargando="Guardando…">
                  Esta es mi oposición
                </BotonAuth>
              </div>
            </div>
          )}

          {pasoActual === 'resultado' && filtroCompleto && base.length > 1 && (
            <>
              <ListaOpciones>
                {base.map((o) => (
                  <OpcionOnboarding
                    key={o.id}
                    icono={(o.categoria && ICONO_CATEGORIA[o.categoria]) || GraduationCap}
                    titulo={o.nombre}
                    subtitulo={[o.administracion, o.subgrupo && `Subgrupo ${o.subgrupo}`].filter(Boolean).join(' · ') || undefined}
                    seleccionada={guardando === o.id}
                    atenuada={!!guardando && guardando !== o.id}
                    disabled={!!guardando}
                    onClick={() => seleccionar(o.id)}
                  />
                ))}
              </ListaOpciones>
              {error && <div style={{ marginTop: 12 }}><AvisoAuth>{error}</AvisoAuth></div>}
            </>
          )}

          {pasoActual === 'resultado' && filtroCompleto && base.length === 0 && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 14, lineHeight: 1.5 }}>
                Todavía no tenemos oposiciones con estos criterios. Prueba con otra combinación o pídenos la tuya.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <BotonAuth type="button" onClick={() => router.push('/app/soporte')}>Pedir mi oposición</BotonAuth>
                <BotonAuth type="button" variante="secundario" onClick={() => limpiar('tipo')}>Empezar de nuevo</BotonAuth>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  if (modoCambio) {
    return (
      <div style={{ minHeight: '100vh', background: BG_DASHBOARD, padding: '1.25rem' }}>
        <style>{`@keyframes oplora-girar { to { transform: rotate(360deg); } } @keyframes oplora-aparecer { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <button onClick={() => router.back()} aria-label="Volver" style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <ArrowLeft size={18} color={TEXT_PRIMARY} />
            </button>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>Cambiar de oposición</div>
              <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 1 }}>Tu progreso en la actual se conserva por si vuelves</div>
            </div>
          </div>
          {actual?.nombre && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--hxhero-0f172a)', color: 'white', borderRadius: 16, padding: '12px 14px', marginBottom: 12 }}>
              {(() => { const I = ((actual as any).categoria && ICONO_CATEGORIA[(actual as any).categoria]) || GraduationCap; return <I size={18} color="var(--hx-93c5fd)" />; })()}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--hx-94a3b8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ahora preparas</div>
                <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{actual.nombre}</div>
              </div>
            </div>
          )}
          <div style={{ background: 'var(--c-superficie)', borderRadius: 20, boxShadow: SOMBRA, padding: 16 }}>{contenido}</div>
        </div>
      </div>
    );
  }

  return (
    <PantallaOnboarding paso={2} atras="/app/onboarding/objetivo" titulo="Elige tu oposición" subtitulo="Te ayudamos a encontrarla en unos pocos toques.">
      {contenido}
    </PantallaOnboarding>
  );
}

function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Quitar ${label}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px 5px 12px', borderRadius: 999, background: 'var(--hx-eaf0ff)', color: COLOR_MARCA, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
    >
      {label}
      <X size={12} />
    </button>
  );
}

export default function OnboardingOposicionPageWrapper() {
  return (
    <Suspense>
      <OnboardingOposicionPage />
    </Suspense>
  );
}
