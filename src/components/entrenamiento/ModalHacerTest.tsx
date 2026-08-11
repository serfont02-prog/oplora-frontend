'use client';

import { useState  } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { X, ChevronLeft, Lock } from 'lucide-react';

const BG_MODAL_TEST = '#F3FAE9';
const BORDER = '#E9EAEC';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

type TipoTest = 'general' | 'tema' | 'ley' | null;
type Paso = 'tipo' | 'seleccion' | 'ajustes';

export default function ModalHacerTest({
  oposicion,
  convocatoria,
  limites,
  router,
  onClose,
  temaPreseleccionado,
}: any) {
  const [paso, setPaso] = useState<Paso>(temaPreseleccionado ? 'ajustes' : 'tipo');
const [tipoTest, setTipoTest] = useState<TipoTest>(temaPreseleccionado ? 'tema' : null);
const [temasSeleccionados, setTemasSeleccionados] = useState<string[]>(
  temaPreseleccionado ? [temaPreseleccionado.id] : []
);
  const [leySeleccionada, setLeySeleccionada] = useState<string | null>(null);

  const [numPreguntas, setNumPreguntas] = useState(5);
  const [modoTiempo, setModoTiempo] = useState<'sin_tiempo' | '30s' | '60s'>('sin_tiempo');
  const [mostrarExplicaciones, setMostrarExplicaciones] = useState(true);
  const [permitirBlancos, setPermitirBlancos] = useState(true);
  
  const [inputManual, setInputManual] = useState('');

  const maxPorTest = tipoTest === 'general'
  ? (limites?.limites?.preguntasPorTest ?? 5)
  : tipoTest === 'tema' && temasSeleccionados.length > 1
    ? (limites?.limites?.preguntasPorTest ?? 5) // ⭐ varios temas → límite de test general
    : (limites?.limites?.preguntasPorTema ?? 5); // ⭐ un solo tema (o ley) → límite por tema

  const limiteDiario = limites?.limites?.preguntasTestDia;
  const preguntasHoy = limites?.consumo?.preguntasTestHoy ?? 0;
  const restantesDia = (limiteDiario !== null && limiteDiario !== undefined)
    ? Math.max(0, limiteDiario - preguntasHoy)
    : null;
  
const excedeMaxPorTest = numPreguntas > maxPorTest;
const excedeRestante = restantesDia !== null && numPreguntas > restantesDia;
const numeroInvalido = excedeMaxPorTest || excedeRestante;

  const { data: temas = [] } = useQuery({
    queryKey: ['temas-modal-test', convocatoria?.id],
    queryFn: async () => {
      const res = await api.get(`/temas/convocatoria/${convocatoria.id}`);
      return res.data;
    },
    enabled: !!convocatoria?.id && tipoTest === 'tema',
  });

  const { data: leyes = [] } = useQuery({
    queryKey: ['leyes-modal-test', oposicion?.id],
    queryFn: async () => {
      const res = await api.get(`/leyes/oposicion/${oposicion.id}`);
      return res.data;
    },
    enabled: !!oposicion?.id && tipoTest === 'ley',
  });

  const elegirTipo = (tipo: TipoTest) => {
    setTipoTest(tipo);
    if (tipo === 'general') {
      setPaso('ajustes');
    } else {
      setPaso('seleccion');
    }
  };

  const continuarASeleccion = () => {
    if (tipoTest === 'tema' && temasSeleccionados.length === 0) return;
    if (tipoTest === 'ley' && !leySeleccionada) return;
    setPaso('ajustes');
  };

  const volver = () => {
    if (paso === 'ajustes' && tipoTest !== 'general') {
      setPaso('seleccion');
    } else if (paso === 'ajustes' && tipoTest === 'general') {
      setPaso('tipo');
      setTipoTest(null);
    } else if (paso === 'seleccion') {
      setPaso('tipo');
      setTipoTest(null);
    }
  };

  const empezarTest = () => {
    const tiempo = modoTiempo !== 'sin_tiempo' ? `&tiempo=${modoTiempo}` : '';
    const base = `explicaciones=${mostrarExplicaciones}&blancos=${permitirBlancos}${tiempo}`;

    if (tipoTest === 'general') {
      router.push(`/app/test/${oposicion.id}?modo=rapido&n=${numPreguntas}&${base}`);
    } else if (tipoTest === 'tema') {
      const temasParam = temasSeleccionados.join(',');
      router.push(`/app/test/${oposicion.id}?modo=tema&n=${numPreguntas}&${base}&temas=${temasParam}`);
    } else if (tipoTest === 'ley') {
      router.push(`/app/test/${oposicion.id}?modo=ley&n=${numPreguntas}&${base}&versionLeyId=${leySeleccionada}`);
    }
    onClose();
  };

  const numerosTemasSeleccionados = temas
  .filter((t: any) => temasSeleccionados.includes(t.id))
  .map((t: any) => t.numero)
  .sort((a: number, b: number) => a - b);
  const formatearListaTemas = (numeros: number[]): string => {
  if (numeros.length === 0) return '';
  if (numeros.length === 1) return `Tema ${numeros[0]}`;
  if (numeros.length === 2) return `Temas ${numeros[0]} y ${numeros[1]}`;
  return `Temas ${numeros.slice(0, -1).join(', ')} y ${numeros[numeros.length - 1]}`;
};

  const titulo = paso === 'tipo' ? 'Elige el tipo de test'
  : paso === 'seleccion' ? (tipoTest === 'tema' ? 'Elige los temas' : 'Elige la ley')
  : temaPreseleccionado ? `Test — Tema ${temaPreseleccionado.numero}`
  : tipoTest === 'tema' ? `Test — ${formatearListaTemas(numerosTemasSeleccionados)}`
  : 'Ajustes del test';
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
      <div style={{ background: BG_MODAL_TEST, borderRadius: '20px', padding: '1.5rem', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {paso !== 'tipo' && !temaPreseleccionado && (
              <button onClick={volver} style={{ background: 'white', border: 'none', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ChevronLeft size={16} color={TEXT_PRIMARY} />
              </button>
            )}
            <div style={{ fontSize: '15px', fontWeight: 600, color: TEXT_PRIMARY }}>{titulo}</div>
          </div>
          <button
            onClick={onClose}
            style={{
                background: 'white', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY,
                width: '32px', height: '32px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
            >
            <X size={16} />
          </button>
        </div>

        {/* PASO 1 — Tipo de test */}
        {paso === 'tipo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { tipo: 'general' as TipoTest, label: 'Test general', desc: 'Preguntas de todo el temario' },
              { tipo: 'tema' as TipoTest, label: 'Test por temas', desc: 'Elige uno o varios temas' },
              { tipo: 'ley' as TipoTest, label: 'Test por ley', desc: 'Elige una ley concreta' },
            ].map(({ tipo, label, desc }) => (
              <button
                key={tipo}
                onClick={() => elegirTipo(tipo)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: '2px',
                  padding: '14px 16px', borderRadius: '14px', textAlign: 'left',
                  border: 'none', background: 'white', cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 600, color: TEXT_PRIMARY }}>{label}</span>
                <span style={{ fontSize: '12px', color: TEXT_MUTED }}>{desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* PASO 2 — Selección de tema(s) */}
        {paso === 'seleccion' && tipoTest === 'tema' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem', maxHeight: '340px', overflowY: 'auto' }}>
              {temas.map((t: any) => {
                const seleccionado = temasSeleccionados.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTemasSeleccionados(prev =>
                        seleccionado ? prev.filter(id => id !== t.id) : [...prev, t.id]
                      );
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '11px 13px', borderRadius: '12px', textAlign: 'left',
                      border: seleccionado ? '2px solid #111827' : 'none',
                      background: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                      border: seleccionado ? 'none' : '2px solid #d1d5db',
                      background: seleccionado ? '#111827' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {seleccionado && <span style={{ color: 'white', fontSize: '11px' }}>✓</span>}
                    </div>
                    <span style={{ fontSize: '13px', color: TEXT_PRIMARY, fontWeight: 500 }}>
                      T{t.numero} — {t.titulo}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={continuarASeleccion}
              disabled={temasSeleccionados.length === 0}
              style={{ width: '100%', padding: '13px', background: temasSeleccionados.length > 0 ? '#0f172a' : '#e5e7eb', color: temasSeleccionados.length > 0 ? 'white' : '#9ca3af', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: temasSeleccionados.length > 0 ? 'pointer' : 'not-allowed' }}
            >
              Continuar ({temasSeleccionados.length} seleccionados)
            </button>
          </>
        )}

        {/* PASO 2 — Selección de ley */}
        {paso === 'seleccion' && tipoTest === 'ley' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem', maxHeight: '340px', overflowY: 'auto' }}>
              {leyes.map((ol: any) => {
                const seleccionado = leySeleccionada === ol.versionLey?.id;
                return (
                  <button
                    key={ol.id}
                    onClick={() => setLeySeleccionada(ol.versionLey?.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '11px 13px', borderRadius: '12px', textAlign: 'left',
                      border: seleccionado ? '2px solid #111827' : 'none',
                      background: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '999px', flexShrink: 0,
                      border: seleccionado ? 'none' : '2px solid #d1d5db',
                      background: seleccionado ? '#111827' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {seleccionado && <span style={{ color: 'white', fontSize: '10px' }}>●</span>}
                    </div>
                    <span style={{ fontSize: '13px', color: TEXT_PRIMARY, fontWeight: 500 }}>
                      {ol.ley?.nombre}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={continuarASeleccion}
              disabled={!leySeleccionada}
              style={{ width: '100%', padding: '13px', background: leySeleccionada ? '#0f172a' : '#e5e7eb', color: leySeleccionada ? 'white' : '#9ca3af', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: leySeleccionada ? 'pointer' : 'not-allowed' }}
            >
              Continuar
            </button>
          </>
        )}

        {/* PASO 3 — Ajustes generales (común a los 3 tipos) */}
        {paso === 'ajustes' && (
          <>

{tipoTest === 'tema' && temasSeleccionados.length > 1 && (
  <div style={{ marginBottom: '12px', padding: '10px 12px', background: 'white', borderRadius: '10px', fontSize: '11px', color: TEXT_MUTED }}>
    Al combinar varios temas, se aplica el límite de test general ({maxPorTest} preguntas)
  </div>
)}
<div style={{ marginBottom: '1.25rem' }}>
  <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT_SECONDARY, marginBottom: '8px' }}>
    Número de preguntas
  </div>
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
    {[5, 10, 20, 50].map(n => {
      const disponible = n <= maxPorTest;
      return (
        <button
          key={n}
          onClick={() => {
            if (!disponible) return;
            setNumPreguntas(n);
            setInputManual('');
          }}
          style={{
            padding: '8px 16px', borderRadius: '999px', border: 'none',
            background: numPreguntas === n && !inputManual ? '#0f172a' : disponible ? 'white' : '#f0f0f0',
            color: numPreguntas === n && !inputManual ? 'white' : disponible ? TEXT_SECONDARY : '#c0c0c0',
            fontSize: '13px', fontWeight: numPreguntas === n && !inputManual ? 600 : 400,
            cursor: disponible ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          {n}
          {!disponible && <Lock size={10} />}
        </button>
      );
    })}

    <input
      type="number"
      min={1}
      placeholder="Otro"
      value={inputManual}
      onChange={(e) => {
        const val = e.target.value;
        setInputManual(val);
        const num = parseInt(val, 10);
        if (!isNaN(num) && num > 0) {
          setNumPreguntas(num);
        }
      }}
      style={{
        width: '70px', padding: '8px 10px', borderRadius: '999px',
        border: inputManual ? '2px solid #0f172a' : `1px solid ${BORDER}`,
        fontSize: '13px', color: TEXT_PRIMARY, outline: 'none', textAlign: 'center',
      }}
    />
  </div>

  {excedeMaxPorTest && (
    <div style={{ marginTop: '10px', padding: '12px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
      <div style={{ fontSize: '12px', color: TEXT_SECONDARY }}>
        Ese número supera el máximo de tu plan ({maxPorTest} preguntas por test)
      </div>
      <button
        onClick={() => router.push('/app/suscripciones')}
        style={{ flexShrink: 0, padding: '8px 14px', borderRadius: '999px', border: 'none', background: '#111827', color: 'white', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
      >
        Cambiar plan
      </button>
    </div>
  )}

  {!excedeMaxPorTest && excedeRestante && (
    <div style={{ marginTop: '10px', padding: '12px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
      <div style={{ fontSize: '12px', color: TEXT_SECONDARY }}>
        Solo te quedan {restantesDia} preguntas hoy
      </div>
      <button
        onClick={() => router.push('/app/suscripciones')}
        style={{ flexShrink: 0, padding: '8px 14px', borderRadius: '999px', border: 'none', background: '#111827', color: 'white', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
      >
        Cambiar plan
      </button>
    </div>
  )}
</div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT_SECONDARY, marginBottom: '8px' }}>Modo tiempo</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { value: 'sin_tiempo', label: 'Sin límite de tiempo', desc: 'Responde a tu ritmo' },
                  { value: '30s', label: '30 segundos por pregunta', desc: 'Ritmo rápido' },
                  { value: '60s', label: '60 segundos por pregunta', desc: 'Ritmo moderado' },
                ].map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setModoTiempo(value as any)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 14px', borderRadius: '12px', textAlign: 'left',
                      border: modoTiempo === value ? '2px solid #0f172a' : 'none',
                      background: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY }}>{label}</div>
                      <div style={{ fontSize: '11px', color: TEXT_MUTED, marginTop: '1px' }}>{desc}</div>
                    </div>
                    <div style={{
                        width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                        border: modoTiempo === value ? 'none' : '2px solid #d1d5db',
                        background: modoTiempo === value ? '#0f172a' : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                        {modoTiempo === value && <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>✓</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT_SECONDARY, marginBottom: '8px' }}>Explicaciones</div>
              <button
                onClick={() => setMostrarExplicaciones(!mostrarExplicaciones)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 14px', borderRadius: '12px', border: 'none', background: 'white', cursor: 'pointer' }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY }}>Mostrar explicación tras cada pregunta</div>
                  <div style={{ fontSize: '11px', color: TEXT_MUTED, marginTop: '1px' }}>Aprende mientras practicas</div>
                </div>
                <div style={{ width: '40px', height: '22px', borderRadius: '999px', flexShrink: 0, background: mostrarExplicaciones ? '#0f172a' : '#e5e7eb', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: mostrarExplicaciones ? '21px' : '3px', transition: 'left 0.2s' }} />
                </div>
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT_SECONDARY, marginBottom: '8px' }}>Respuestas en blanco</div>
              <button
                onClick={() => setPermitirBlancos(!permitirBlancos)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 14px', borderRadius: '12px', border: 'none', background: 'white', cursor: 'pointer' }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY }}>Permitir dejar en blanco</div>
                  <div style={{ fontSize: '11px', color: TEXT_MUTED, marginTop: '1px' }}>
                    {convocatoria?.penalizacion
                      ? `Esta convocatoria penaliza ${convocatoria.fraccionPenalizacion ?? ''} por error`
                      : 'Esta convocatoria no penaliza respuestas incorrectas'}
                  </div>
                </div>
                <div style={{ width: '40px', height: '22px', borderRadius: '999px', flexShrink: 0, background: permitirBlancos ? '#0f172a' : '#e5e7eb', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: permitirBlancos ? '21px' : '3px', transition: 'left 0.2s' }} />
                </div>
              </button>
            </div>

            <button
            onClick={empezarTest}
            disabled={numeroInvalido || numPreguntas < 1}
            style={{
                width: '100%', padding: '13px',
                background: (numeroInvalido || numPreguntas < 1) ? '#e5e7eb' : '#0f172a',
                color: (numeroInvalido || numPreguntas < 1) ? '#9ca3af' : 'white',
                border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                cursor: (numeroInvalido || numPreguntas < 1) ? 'not-allowed' : 'pointer',
            }}
            >
            Empezar test ({numPreguntas} preguntas)
            </button>
          </>
        )}

      </div>
    </div>
  );
}