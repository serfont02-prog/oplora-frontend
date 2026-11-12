'use client';

// ⭐ Flashcards — mismo sistema que Inicio y Practicar: botón para volver a Practicar, tarjetas
// blancas con la sombra común directamente sobre el fondo, estadísticas en círculos flotantes,
// títulos suaves y solo iconos lucide (Layers = flashcards en toda la app).
//
// ⭐ Cómo se organiza (estilo Anki, adaptado a estudiar por temas):
//  · "Repaso de hoy" (y el botón de Inicio) solo cuenta las tarjetas YA VISTAS a las que les toca.
//  · Las nuevas se empiezan desde cada tema, eligiendo cuántas. Si ese día se pasan de 15, se
//    avisa (no se bloquea): cada nueva vuelve al día siguiente y el trabajo se amontona.

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, ChevronRight, ChevronDown, Layers, CheckCircle2, X, Sparkles, AlertTriangle } from 'lucide-react';
import { FooterNavegacion } from '@/components/ui/FooterNavegacion';
import { AvatarPerfil } from '@/components/AvatarUsuarioPerfil';

import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, COLOR_FC, COLOR_FC_BG, BG_FLASHCARDS } from '@/styles/tokens';

const SOMBRA = 'var(--c-sombra)';
const BORDER = 'var(--hx-f3eef5)';
const COLOR_DUDOSA = 'var(--hx-d97706)';
const TEMAS_VISIBLES = 6;
const MAX_SESION = 30;
const MAX_CONTEO = 99; // el endpoint devuelve 10 si no se le pasa límite
const AVISO_NUEVAS = 15; // a partir de aquí se avisa de que el repaso se amontona
const OPCIONES_NUEVAS = [5, 10, 15, 20, 30];

type ResumenTema = { temaId: string; total: number; vistas: number; dominadas: number; porRepasar: number };

function TituloSeccion({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 8, padding: '0 4px' }}>{children}</div>;
}

function Donut({ porcentaje, color, size, grosor }: { porcentaje: number; color: string; size: number; grosor: number }) {
  const radio = (size - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia - (Math.max(0, Math.min(100, porcentaje)) / 100) * circunferencia;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={radio} fill="none" stroke="var(--hx-eef0f3)" strokeWidth={grosor} />
      {porcentaje > 0 && (
        <circle cx={size / 2} cy={size / 2} r={radio} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round"
          strokeDasharray={circunferencia} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      )}
    </svg>
  );
}

/** Círculo flotante con aro (igual que las estadísticas de Practicar). */
function CirculoDato({ valor, porcentaje, color, label, sub }: { valor: string; porcentaje: number; color: string; label: string; sub: string }) {
  const D = 78;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <div style={{ position: 'relative', width: D, height: D, borderRadius: '50%', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 6 }}>
          <Donut porcentaje={porcentaje} color={color} size={D - 12} grosor={6} />
        </div>
        <span style={{ position: 'relative', fontSize: 16, fontWeight: 800, color: TEXT_PRIMARY }}>{valor}</span>
      </div>
      <span style={{ fontSize: 12, color: TEXT_PRIMARY, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
      <span style={{ fontSize: 10, color: TEXT_MUTED, marginTop: -3, textAlign: 'center' }}>{sub}</span>
    </div>
  );
}

export default function FlashcardsPage() {
  return <Suspense fallback={null}><Flashcards /></Suspense>;
}

function Flashcards() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { usuario, cargando } = useAuth();
  const [verTodos, setVerTodos] = useState(false);
  const [temaAbierto, setTemaAbierto] = useState<any>(null);
  const oposicionId = usuario?.oposicionActiva?.id;

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias-fc', oposicionId],
    queryFn: async () => (await api.get(`/convocatorias/oposicion/${oposicionId}`)).data,
    enabled: !!oposicionId,
  });
  const convocatoria = convocatorias.find((c: any) => c.estado === 'activa') ?? convocatorias[0];

  const { data: temas = [], isLoading: cargandoTemas } = useQuery({
    queryKey: ['temas-fc', convocatoria?.id],
    queryFn: async () => (await api.get(`/temas/convocatoria/${convocatoria.id}`)).data,
    enabled: !!convocatoria?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['stats-fc', oposicionId],
    queryFn: async () => (await api.get(`/flashcards/stats/${oposicionId}`)).data,
    enabled: !!oposicionId,
  });

  const { data: pendientes = [] } = useQuery({
    queryKey: ['pendientes-fc', oposicionId],
    queryFn: async () => (await api.get(`/flashcards/pendientes/${oposicionId}?limite=${MAX_CONTEO}`)).data,
    enabled: !!oposicionId,
  });

  const { data: resumen, isLoading: cargandoResumen } = useQuery({
    queryKey: ['resumen-temas-fc', convocatoria?.id],
    queryFn: async () => (await api.get(`/flashcards/resumen-temas/${convocatoria.id}`)).data as { temas: ResumenTema[]; nuevasHoy: number },
    enabled: !!convocatoria?.id,
  });

  const { data: limites } = useQuery({
    queryKey: ['limites', usuario?.id],
    queryFn: async () => (await api.get('/usuarios/limites')).data,
    enabled: !!usuario,
  });

  // Al entrar desde un tema (/app/flashcards?tema=<id>) se abre directamente su ficha
  const temaUrl = searchParams.get('tema');
  useEffect(() => {
    if (!temaUrl || !temas.length) return;
    const t = temas.find((x: any) => x.id === temaUrl);
    if (t) setTemaAbierto(t);
  }, [temaUrl, temas]);

  if (cargando || !usuario) return null;

  // Límite diario de flashcards del plan (null = sin límite)
  const limiteDia = limites?.limites?.flashcardsDia;
  const hechasHoy = limites?.consumo?.flashcardsHoy ?? 0;
  const conLimite = limiteDia !== null && limiteDia !== undefined;
  const restantesHoy = conLimite ? Math.max(0, limiteDia - hechasHoy) : Infinity;
  const limiteAgotado = conLimite && restantesHoy === 0;

  const nPendientes = Array.isArray(pendientes) ? pendientes.length : 0;
  // La sesión pide exactamente las que se anuncian en el botón (antes decía "Repasar 37" y salían 10).
  const nSesion = Math.min(nPendientes, MAX_SESION, restantesHoy);

  const totalFC = stats?.total ?? 0;
  const dominadas = Math.min(stats?.dominadas ?? 0, totalFC);
  const dudosas = stats?.dudosas ?? 0;
  const sinVer = stats?.sinVer ?? 0;
  const pct = (n: number) => (totalFC > 0 ? Math.min(100, Math.round((n / totalFC) * 100)) : 0);

  // Solo los temas que tienen flashcards, con su resumen
  const porTema = new Map((resumen?.temas ?? []).map((r) => [r.temaId, r]));
  const temasConFC = temas.filter((t: any) => (porTema.get(t.id)?.total ?? 0) > 0);
  const temasSinFC = temas.length - temasConFC.length;
  const nuevasHoy = resumen?.nuevasHoy ?? 0;
  const cargandoLista = cargandoTemas || (!!convocatoria?.id && cargandoResumen);

  const temasVisibles = verTodos ? temasConFC : temasConFC.slice(0, TEMAS_VISIBLES);

  return (
    <div style={{ minHeight: '100vh', background: BG_FLASHCARDS, paddingBottom: 90 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Cabecera con vuelta a Practicar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
          <button
            onClick={() => router.push('/app/entrenamiento')}
            aria-label="Volver a Practicar"
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={18} color={TEXT_PRIMARY} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
              Practicar
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>Flashcards</div>
          </div>
          <button
            onClick={() => router.push('/app/perfil')}
            aria-label="Mi perfil"
            style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', overflow: 'visible', flexShrink: 0 }}
          >
            <AvatarPerfil usuario={usuario} size={44} />
          </button>
        </div>

        {/* Repaso de hoy — acción principal */}
        <section>
          <TituloSeccion>Repaso de hoy</TituloSeccion>
          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, padding: 16, boxShadow: SOMBRA, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: COLOR_FC_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {nPendientes > 0 ? <Layers size={20} color={COLOR_FC} /> : <CheckCircle2 size={20} color="var(--hx-16a34a)" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>
                  {nPendientes > 0
                    ? `${nPendientes >= MAX_CONTEO ? `Más de ${MAX_CONTEO}` : nPendientes} ${nPendientes === 1 ? 'tarjeta' : 'tarjetas'} por repasar`
                    : 'Estás al día'}
                </div>
                <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>
                  {nPendientes > 0
                    ? 'Las que toca repasar hoy para no olvidarlas'
                    : 'No te toca repasar ninguna. Si quieres, empieza nuevas en un tema.'}
                </div>
              </div>
            </div>

            {conLimite && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: TEXT_MUTED }}>Flashcards de hoy</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: limiteAgotado ? 'var(--hx-dc2626)' : TEXT_PRIMARY }}>
                    {hechasHoy} de {limiteDia}
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--hx-eef0f3)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${limiteDia > 0 ? Math.min(100, (hechasHoy / limiteDia) * 100) : 0}%`, height: '100%', background: limiteAgotado ? '#DC2626' : COLOR_FC, borderRadius: 999, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            )}

            {nPendientes > 0 && (
              <button
                onClick={() => (limiteAgotado
                  ? router.push('/app/suscripciones')
                  : router.push(`/app/flashcards/repasar?oposicionId=${oposicionId}&n=${nSesion}`))}
                style={{ width: '100%', padding: 12, borderRadius: 12, border: 'none', background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                {limiteAgotado
                  ? 'Límite de hoy alcanzado · Ver planes'
                  : `Repasar ${nSesion} ${nSesion === 1 ? 'tarjeta' : 'tarjetas'}`}
              </button>
            )}
          </div>
        </section>

        {/* Mi progreso — círculos flotantes */}
        {totalFC > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY }}>Mi progreso</span>
              <span style={{ fontSize: 11, color: TEXT_MUTED }}>{totalFC.toLocaleString('es-ES')} flashcards en total</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '0 4px' }}>
              <CirculoDato valor={`${pct(dominadas)}%`} porcentaje={pct(dominadas)} color={COLOR_FC} label="Dominadas" sub={`${dominadas.toLocaleString('es-ES')} tarjetas`} />
              <CirculoDato valor={dudosas.toLocaleString('es-ES')} porcentaje={pct(dudosas)} color={COLOR_DUDOSA} label="Dudosas" sub="Necesitan repaso" />
              <CirculoDato valor={sinVer.toLocaleString('es-ES')} porcentaje={pct(sinVer)} color="var(--hx-94a3b8)" label="Sin ver" sub="Aún por estrenar" />
            </div>
          </section>
        )}

        {/* Practicar por tema */}
        <section>
          <TituloSeccion>Por temas</TituloSeccion>
          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
            {cargandoLista && (
              <div style={{ padding: 16, fontSize: 13, color: TEXT_MUTED }}>Cargando temas…</div>
            )}
            {!cargandoLista && temasConFC.length === 0 && (
              <div style={{ padding: 16, fontSize: 13, color: TEXT_MUTED }}>Todavía no hay temas con flashcards en tu convocatoria.</div>
            )}
            {!cargandoLista && temasVisibles.map((t: any, i: number) => {
              const r = porTema.get(t.id)!;
              const sinVer = Math.max(0, r.total - r.vistas);
              return (
                <button
                  key={t.id}
                  onClick={() => setTemaAbierto(t)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    border: 'none', borderBottom: i < temasVisibles.length - 1 || temasConFC.length > TEMAS_VISIBLES ? `1px solid ${BORDER}` : 'none',
                    background: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: COLOR_FC_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: COLOR_FC, flexShrink: 0 }}>
                    {t.numero}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.titulo}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                      {r.porRepasar > 0 && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: COLOR_FC, background: COLOR_FC_BG, borderRadius: 999, padding: '2px 7px' }}>
                          {r.porRepasar} por repasar
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: TEXT_MUTED }}>
                        {sinVer > 0 ? `${sinVer} sin ver · ` : ''}{r.dominadas} de {r.total} dominadas
                      </span>
                    </div>
                    <div style={{ height: 3, background: 'var(--hx-eef0f3)', borderRadius: 999, overflow: 'hidden', marginTop: 6 }}>
                      <div style={{ width: `${Math.round((r.dominadas / r.total) * 100)}%`, height: '100%', background: COLOR_FC, borderRadius: 999 }} />
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--hx-c4c9d2)" style={{ flexShrink: 0 }} />
                </button>
              );
            })}
            {!cargandoLista && temasConFC.length > TEMAS_VISIBLES && (
              <button
                onClick={() => setVerTodos(v => !v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: COLOR_FC }}
              >
                {verTodos ? 'Ver menos' : `Ver todos los temas (${temasConFC.length})`}
                <ChevronDown size={14} style={{ transform: verTodos ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
              </button>
            )}
          </div>
          {!cargandoLista && temasConFC.length > 0 && temasSinFC > 0 && (
            <div style={{ fontSize: 11, color: TEXT_MUTED, padding: '8px 4px 0' }}>
              {temasSinFC} {temasSinFC === 1 ? 'tema aún no tiene' : 'temas aún no tienen'} flashcards.
            </div>
          )}
        </section>

      </div>

      {temaAbierto && porTema.get(temaAbierto.id) && (
        <FichaTema
          tema={temaAbierto}
          resumen={porTema.get(temaAbierto.id)!}
          nuevasHoy={nuevasHoy}
          restantesHoy={restantesHoy}
          onCerrar={() => setTemaAbierto(null)}
          onIr={(url) => { setTemaAbierto(null); router.push(url); }}
          urlBase={`/app/flashcards/repasar?temaId=${temaAbierto.id}&oposicionId=${oposicionId}&numeroTema=${temaAbierto.numero}&origen=flashcards`}
        />
      )}

      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} activo="practicar" />
    </div>
  );
}

/** Hoja inferior de un tema: repasar lo que toca y empezar nuevas eligiendo cuántas. */
function FichaTema({ tema, resumen, nuevasHoy, restantesHoy, onCerrar, onIr, urlBase }: {
  tema: any; resumen: ResumenTema; nuevasHoy: number; restantesHoy: number;
  onCerrar: () => void; onIr: (url: string) => void; urlBase: string;
}) {
  const sinVer = Math.max(0, resumen.total - resumen.vistas);
  const opciones = OPCIONES_NUEVAS.filter((n) => n < sinVer);
  if (sinVer > 0 && sinVer <= 30) opciones.push(sinVer); // "todas", si son pocas
  const [elegidas, setElegidas] = useState(Math.min(10, sinVer));
  const limiteAgotado = restantesHoy <= 0;
  const nNuevas = Math.min(elegidas, restantesHoy);
  const totalHoy = nuevasHoy + nNuevas;

  // Cerrar con Escape y bloquear el scroll del fondo
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', alPulsar);
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', alPulsar); document.body.style.overflow = antes; };
  }, [onCerrar]);

  const dato = (valor: number, label: string, color: string) => (
    <div style={{ flex: 1, textAlign: 'center', padding: '10px 4px', background: 'var(--c-superficie-2, var(--hx-f8f9fa))', borderRadius: 12 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{valor.toLocaleString('es-ES')}</div>
      <div style={{ fontSize: 10.5, color: TEXT_MUTED, marginTop: 1 }}>{label}</div>
    </div>
  );

  return (
    <div role="dialog" aria-modal="true" aria-label={`Flashcards del tema ${tema.numero}`}
      style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <style>{`@keyframes fc-hoja { from { transform: translateY(100%); } to { transform: none; } } @keyframes fc-velo { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div onClick={onCerrar} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.45)', animation: 'fc-velo .2s ease both' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto',
        background: 'var(--c-superficie)', borderRadius: '22px 22px 0 0', boxShadow: '0 -8px 30px rgba(0,0,0,0.18)',
        padding: '10px 18px calc(18px + env(safe-area-inset-bottom))', animation: 'fc-hoja .25s cubic-bezier(.2,.8,.2,1) both',
      }}>
        <div style={{ width: 38, height: 4, borderRadius: 999, background: 'var(--hx-d1d5db)', margin: '0 auto 12px' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: COLOR_FC_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: COLOR_FC, flexShrink: 0 }}>
            {tema.numero}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tema {tema.numero}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tema.titulo}</div>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--c-superficie-2, var(--hx-f3f4f6))', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <X size={16} color={TEXT_SECONDARY} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {dato(resumen.porRepasar, 'Por repasar', COLOR_FC)}
          {dato(sinVer, 'Sin ver', TEXT_PRIMARY)}
          {dato(resumen.dominadas, `Dominadas de ${resumen.total}`, 'var(--hx-16a34a)')}
        </div>

        {limiteAgotado ? (
          <button onClick={() => onIr('/app/suscripciones')}
            style={{ width: '100%', padding: 13, borderRadius: 12, border: 'none', background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Límite de hoy alcanzado · Ver planes
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Repasar lo que toca de este tema */}
            {resumen.porRepasar > 0 && (
              <button onClick={() => onIr(`${urlBase}&modo=repasar&n=${Math.min(resumen.porRepasar, MAX_CONTEO, restantesHoy)}`)}
                style={{ width: '100%', padding: 13, borderRadius: 12, border: 'none', background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Repasar {resumen.porRepasar} {resumen.porRepasar === 1 ? 'tarjeta' : 'tarjetas'}
              </button>
            )}

            {/* Empezar nuevas, eligiendo cuántas */}
            {sinVer > 0 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 8 }}>
                  <Sparkles size={15} color={COLOR_FC} /> Aprender nuevas
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {opciones.map((n) => {
                    const activa = n === elegidas;
                    return (
                      <button key={n} onClick={() => setElegidas(n)} aria-pressed={activa}
                        style={{
                          minWidth: 46, padding: '8px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          border: `1.5px solid ${activa ? COLOR_FC : 'var(--hx-e5e7eb)'}`,
                          background: activa ? COLOR_FC_BG : 'transparent', color: activa ? COLOR_FC : TEXT_SECONDARY,
                        }}>
                        {n === sinVer && sinVer <= 30 && n > 5 && !OPCIONES_NUEVAS.includes(n) ? `Todas (${n})` : n}
                      </button>
                    );
                  })}
                </div>

                {totalHoy > AVISO_NUEVAS && (
                  <div style={{ display: 'flex', gap: 8, fontSize: 12, lineHeight: 1.5, color: 'var(--hx-92400e)', background: 'var(--hx-fffbeb)', border: '1px solid var(--hx-fde68a)', borderRadius: 12, padding: '9px 11px', marginBottom: 10 }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>
                      {nuevasHoy > 0 ? `Hoy ya llevas ${nuevasHoy} nuevas. ` : ''}
                      Cada tarjeta nueva vuelve mañana para repasarla, así que mañana tendrás unas {totalHoy} de repaso.
                      No hace falta hacer muchas: con 10–15 al día se avanza mejor y no se amontona.
                    </span>
                  </div>
                )}

                <button onClick={() => onIr(`${urlBase}&modo=nuevas&n=${nNuevas}`)}
                  style={{
                    width: '100%', padding: 13, borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    border: resumen.porRepasar > 0 ? `1.5px solid ${COLOR_FC}` : 'none',
                    background: resumen.porRepasar > 0 ? 'transparent' : 'var(--hxbg-0f172a)',
                    color: resumen.porRepasar > 0 ? COLOR_FC : 'var(--c-primario-texto)',
                  }}>
                  Empezar {nNuevas} {nNuevas === 1 ? 'nueva' : 'nuevas'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: TEXT_MUTED, textAlign: 'center', marginBottom: 10 }}>
                  Ya has visto todas las flashcards de este tema.
                </div>
                {/* Con todo visto, se puede repasar el tema entero antes de un examen */}
                <button onClick={() => onIr(urlBase)}
                  style={{ width: '100%', padding: 12, borderRadius: 12, border: `1.5px solid ${COLOR_FC}`, background: 'transparent', color: COLOR_FC, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Repasar todo el tema ({resumen.total})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
