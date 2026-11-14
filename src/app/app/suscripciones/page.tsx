'use client';

// ⭐ OPLORA (planes de nov 2026): un único plan con todo y sin límites diarios.
//  · Prueba de 5 días sin tarjeta; después, gratis el Tema 1 de cada oposición.
//  · Pago único por periodo (1, 6 o 12 meses) con tarjeta o Bizum, sin renovación automática.
//  · O mensual con renovación automática (tarjeta), cancelable desde el portal de Stripe.

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Crown, ShieldCheck, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAcceso, diasHasta, TEMA_GRATIS } from '@/lib/acceso';
import { FooterNavegacion } from '@/components/ui/FooterNavegacion';
import { ConfirmacionInferior } from '@/components/test/SalirTest';
import { BG_NEUTRAL, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SOMBRA } from '@/styles/tokens';

type IdPlan = 'mes' | 'semestre' | 'anual' | 'mensual_auto';

const UNICOS: { id: IdPlan; titulo: string; precio: string; detalle: string; etiqueta?: string }[] = [
  { id: 'mes', titulo: '1 mes', precio: '9,95 €', detalle: 'Pago único' },
  { id: 'semestre', titulo: '6 meses', precio: '49,95 €', detalle: '8,33 €/mes · ahorras un 16 %' },
  { id: 'anual', titulo: '12 meses', precio: '79,95 €', detalle: '6,66 €/mes · ahorras un 33 %', etiqueta: 'Mejor precio' },
];

const INCLUIDO = [
  'Todo el temario de tu oposición, tema a tema',
  'Tests sin límite, simulacros y exámenes oficiales',
  'Flashcards con repaso inteligente',
  'Psicotécnicos',
  'Duelos con otros opositores y la Liga OPLORA',
  'Cambia de oposición cuando quieras',
];

const fechaLarga = (f: string | null | undefined) =>
  f ? new Date(f).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

export default function SuscripcionesPage() {
  return <Suspense fallback={null}><Suscripciones /></Suspense>;
}

function Suscripciones() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { usuario, cargando } = useAuth();
  const { acceso, refetch } = useAcceso(!!usuario);
  const [elegido, setElegido] = useState<IdPlan>('anual');
  const [prontoAbierto, setProntoAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultadoPago = searchParams.get('pago');

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  const { data: infoPlanes } = useQuery({
    queryKey: ['pagos-planes'],
    queryFn: async () => (await api.get('/pagos/planes')).data as { activos: boolean },
  });

  const { data: pagos = [] } = useQuery({
    queryKey: ['pagos-mios'],
    queryFn: async () => (await api.get('/pagos/mios')).data as any[],
    enabled: !!usuario && !!infoPlanes?.activos,
  });

  // ⭐ Al volver de Stripe, el aviso del pago puede tardar unos segundos: se vuelve a mirar
  useEffect(() => {
    if (resultadoPago !== 'ok') return;
    let veces = 0;
    const id = setInterval(async () => {
      veces++;
      const r = await refetch();
      qc.invalidateQueries({ queryKey: ['pagos-mios'] });
      if (r.data?.acceso?.motivo === 'pago' || veces >= 10) clearInterval(id);
    }, 2000);
    return () => clearInterval(id);
  }, [resultadoPago, refetch, qc]);

  const pagar = useMutation({
    mutationFn: async (plan: IdPlan) => (await api.post('/pagos/checkout', { plan })).data as { url: string },
    onSuccess: (r) => { if (r?.url) window.location.href = r.url; },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'No se ha podido iniciar el pago'),
  });
  const portal = useMutation({
    mutationFn: async () => (await api.post('/pagos/portal')).data as { url: string },
    onSuccess: (r) => { if (r?.url) window.location.href = r.url; },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'No se ha podido abrir la gestión de tu suscripción'),
  });

  const empezarPago = (plan: IdPlan) => {
    setError(null);
    if (!infoPlanes?.activos) { setProntoAbierto(true); return; }
    pagar.mutate(plan);
  };

  if (cargando || !usuario) return null;

  const motivo = acceso?.motivo;
  const diasPrueba = diasHasta(acceso?.pruebaHasta);

  return (
    <div style={{ minHeight: '100vh', background: BG_NEUTRAL, paddingBottom: 110 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center' }}>
          <button onClick={() => router.push('/app/perfil')} aria-label="Volver"
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={17} color={TEXT_SECONDARY} />
          </button>
        </div>

        {/* Vuelta de Stripe */}
        {resultadoPago === 'ok' && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--hx-f0fdf4)', border: '1px solid var(--hx-86efac)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
            <CheckCircle2 size={18} color="var(--hx-15803d)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: 'var(--hx-15803d)', lineHeight: 1.5 }}>
              <b>¡Gracias!</b> {motivo === 'pago' ? 'Tu acceso a OPLORA ya está activo.' : 'Estamos confirmando el pago; tardará unos segundos.'}
            </div>
          </div>
        )}
        {resultadoPago === 'cancelado' && (
          <div style={{ fontSize: 13, color: TEXT_SECONDARY, background: 'var(--c-superficie)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
            No se ha hecho ningún cargo. Cuando quieras, puedes volver a intentarlo.
          </div>
        )}

        {/* Estado */}
        <div style={{ background: 'var(--c-hero, var(--hxbg-0f172a))', color: 'var(--c-primario-texto)', borderRadius: 22, padding: '20px 18px', marginBottom: 16, boxShadow: SOMBRA }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Crown size={15} /> OPLORA
          </div>
          <div style={{ fontSize: 21, fontWeight: 800, marginTop: 8, lineHeight: 1.25 }}>
            {motivo === 'pago' && 'Tienes OPLORA activo'}
            {motivo === 'prueba' && (diasPrueba <= 1 ? 'Tu prueba termina hoy' : `Te quedan ${diasPrueba} días de prueba`)}
            {(motivo === 'regalo' || motivo === 'admin') && 'Tienes acceso completo'}
            {motivo === 'gratis' && 'Tu prueba ha terminado'}
            {!motivo && 'Todo para aprobar, en una app'}
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6, lineHeight: 1.5 }}>
            {motivo === 'pago' && (acceso?.renovacionAutomatica
              ? `Se renueva cada mes. Próximo cobro alrededor del ${fechaLarga(acceso?.accesoHasta)}.`
              : `Hasta el ${fechaLarga(acceso?.accesoHasta)}. No se renueva sola: te avisaremos antes.`)}
            {motivo === 'prueba' && `Tienes todo desbloqueado hasta el ${fechaLarga(acceso?.pruebaHasta)}. Sin tarjeta y sin compromiso.`}
            {motivo === 'gratis' && `Sigues teniendo gratis el Tema ${TEMA_GRATIS} de cada oposición. Con OPLORA, todo lo demás.`}
          </div>
          {motivo === 'pago' && acceso?.renovacionAutomatica && (
            <button onClick={() => portal.mutate()} disabled={portal.isPending}
              style={{ marginTop: 14, padding: '9px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.35)', background: 'transparent', color: 'inherit', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              {portal.isPending ? 'Abriendo…' : 'Gestionar o cancelar la suscripción'}
            </button>
          )}
        </div>

        {/* Qué incluye */}
        <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: '16px 16px 14px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: TEXT_PRIMARY }}>Todo incluido, sin límites</div>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--c-azul)', background: 'var(--c-azul-bg)', borderRadius: 999, padding: '3px 8px', whiteSpace: 'nowrap' }}>
              Precio de lanzamiento
            </span>
          </div>
          {INCLUIDO.map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13.5, color: TEXT_PRIMARY, padding: '5px 0', lineHeight: 1.4 }}>
              <Check size={16} color="var(--c-verde)" style={{ flexShrink: 0, marginTop: 1 }} /> {t}
            </div>
          ))}
          {/* ⭐ Precio de lanzamiento: que quede claro que no cambia durante la suscripción */}
          <div style={{ display: 'flex', gap: 10, marginTop: 12, padding: '11px 12px', borderRadius: 12, background: 'var(--c-azul-bg)' }}>
            <ShieldCheck size={17} color="var(--c-azul)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12.5, color: TEXT_PRIMARY, lineHeight: 1.45 }}>
              <div style={{ fontWeight: 800, marginBottom: 2 }}>Precio de lanzamiento garantizado</div>
              El precio que pagas hoy no cambia mientras dure tu suscripción. Con el mensual automático sigues pagando 9,95 € al mes mientras no lo canceles, aunque el precio suba para quien llegue después.
            </div>
          </div>
        </div>

        {/* Pago único */}
        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_SECONDARY, margin: '4px 4px 8px' }}>
          {motivo === 'pago' ? 'Añadir más tiempo' : 'Elige tu plan'} · tarjeta o Bizum
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
          {UNICOS.map((p) => {
            const activo = elegido === p.id;
            return (
              <button key={p.id} onClick={() => setElegido(p.id)} aria-pressed={activo}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                  background: 'var(--c-superficie)', boxShadow: SOMBRA, border: `2px solid ${activo ? 'var(--c-azul)' : 'transparent'}`,
                }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${activo ? 'var(--c-azul)' : 'var(--hx-d1d5db)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {activo && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--c-azul)' }} />}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: TEXT_PRIMARY }}>{p.titulo}</span>
                    {p.etiqueta && <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--c-verde)', background: 'var(--c-verde-bg)', borderRadius: 999, padding: '2px 7px' }}>{p.etiqueta}</span>}
                  </span>
                  <span style={{ display: 'block', fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{p.detalle}</span>
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: TEXT_PRIMARY }}>{p.precio}</span>
              </button>
            );
          })}
        </div>
        <button onClick={() => empezarPago(elegido)} disabled={pagar.isPending}
          style={{ width: '100%', padding: 15, borderRadius: 14, border: 'none', background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', fontSize: 14.5, fontWeight: 800, cursor: pagar.isPending ? 'wait' : 'pointer', opacity: pagar.isPending ? 0.7 : 1 }}>
          {pagar.isPending ? 'Abriendo el pago…' : `Pagar ${UNICOS.find((p) => p.id === elegido)?.precio} con tarjeta o Bizum`}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11.5, color: TEXT_MUTED, margin: '8px 0 22px' }}>
          <ShieldCheck size={13} /> Sin permanencia y sin renovaciones automáticas · IVA incluido
        </div>

        {/* Mensual automático */}
        {!(motivo === 'pago' && acceso?.renovacionAutomatica) && (
          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: TEXT_PRIMARY }}>
              <RefreshCw size={16} color="var(--c-azul)" /> Mensual con renovación automática
            </div>
            <div style={{ fontSize: 12.5, color: TEXT_SECONDARY, lineHeight: 1.5, margin: '6px 0 12px' }}>
              9,95 €/mes con tarjeta, precio de lanzamiento fijo mientras no canceles. Para no tener que acordarte de renovar. Cancelas en un clic desde aquí y mantienes el acceso hasta final de mes.
            </div>
            <button onClick={() => empezarPago('mensual_auto')} disabled={pagar.isPending}
              style={{ width: '100%', padding: 12, borderRadius: 12, border: '1.5px solid var(--c-azul)', background: 'transparent', color: 'var(--c-azul)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
              Suscribirme por 9,95 €/mes
            </button>
          </div>
        )}

        {error && (
          <div style={{ fontSize: 12.5, color: 'var(--hx-b91c1c)', background: 'var(--hx-fef2f2)', borderRadius: 12, padding: '10px 12px', marginBottom: 14 }}>{error}</div>
        )}

        {pagos.length > 0 && (
          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 8 }}>Tus pagos</div>
            {pagos.map((p: any) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, color: TEXT_SECONDARY, padding: '6px 0', borderTop: '1px solid var(--hx-f1f5f9)' }}>
                <span>{new Date(p.creadoEn).toLocaleDateString('es-ES')} · {p.tipo === 'suscripcion' ? 'Mensual' : `${p.meses} ${p.meses === 1 ? 'mes' : 'meses'}`}</span>
                <span style={{ fontWeight: 700, color: TEXT_PRIMARY }}>{(p.importeCentimos / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
              </div>
            ))}
            <button onClick={() => portal.mutate()} style={{ marginTop: 8, border: 'none', background: 'none', color: 'var(--c-azul)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
              Ver facturas
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, fontSize: 12, color: TEXT_MUTED, lineHeight: 1.5, padding: '0 4px' }}>
          <Sparkles size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>Los pagos únicos no se renuevan solos: te avisamos 5 días y 1 día antes de que terminen. El pago lo gestiona Stripe: OPLORA no ve ni guarda los datos de tu tarjeta.</span>
        </div>
      </div>

      <ConfirmacionInferior
        abierta={prontoAbierto}
        titulo="Los pagos llegan muy pronto"
        texto="Estamos terminando de activar el pago con tarjeta y Bizum. Si quieres OPLORA ya, escríbenos y te lo activamos."
        textoConfirmar="Escribir a Soporte"
        textoCancelar="Vale"
        peligro={false}
        onCancelar={() => setProntoAbierto(false)}
        onConfirmar={() => { setProntoAbierto(false); router.push('/app/soporte'); }}
      />

      <FooterNavegacion usuario={usuario} oposicionId={usuario?.oposicionActiva?.id} />
    </div>
  );
}
