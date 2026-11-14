'use client';

// ⭐ Hoja inferior «Esto es de OPLORA». Aparece sola cuando el servidor responde que algo
// necesita suscripción (interceptor de api.ts) o cuando una pantalla llama a pedirSuscripcion().

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Check } from 'lucide-react';
import { EVENTO_SUSCRIPCION, TEMA_GRATIS } from '@/lib/acceso';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '@/styles/tokens';

const INCLUIDO = ['Todo el temario y todos los temas', 'Tests y simulacros sin límite', 'Flashcards, psicotécnicos, duelos y Liga'];

export default function HojaSuscripcion() {
  const router = useRouter();
  const [abierta, setAbierta] = useState<{ motivo: string; mensaje?: string } | null>(null);

  useEffect(() => {
    const abrir = (e: Event) => setAbierta((e as CustomEvent).detail ?? { motivo: 'requiere_suscripcion' });
    window.addEventListener(EVENTO_SUSCRIPCION, abrir);
    return () => window.removeEventListener(EVENTO_SUSCRIPCION, abrir);
  }, []);

  useEffect(() => {
    if (!abierta) return;
    const alPulsar = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierta(null); };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [abierta]);

  if (!abierta) return null;
  const tema = abierta.motivo === 'tema_bloqueado';

  return (
    <div role="dialog" aria-modal="true" aria-label="Hazte de OPLORA" style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <style>{`@keyframes hs-sube { from { transform: translateY(100%); } to { transform: none; } }`}</style>
      <div onClick={() => setAbierta(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.45)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 520, background: 'var(--c-superficie)', borderRadius: '22px 22px 0 0',
        padding: '10px 20px calc(20px + env(safe-area-inset-bottom))', boxShadow: '0 -8px 30px rgba(0,0,0,0.18)', animation: 'hs-sube .25s cubic-bezier(.2,.8,.2,1) both',
      }}>
        <div style={{ width: 38, height: 4, borderRadius: 999, background: 'var(--hx-d1d5db)', margin: '0 auto 16px' }} />
        <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--c-azul-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Lock size={22} color="var(--c-azul)" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 6 }}>
          {tema ? `Gratis tienes el Tema ${TEMA_GRATIS}` : 'Esto está incluido en OPLORA'}
        </div>
        <div style={{ fontSize: 13.5, color: TEXT_SECONDARY, lineHeight: 1.55, marginBottom: 14 }}>
          {tema
            ? `Sin suscripción puedes estudiar el Tema ${TEMA_GRATIS} de cualquier oposición. Con OPLORA tienes todos.`
            : 'Hazte de OPLORA para usarlo, junto con todo lo demás, sin límites.'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
          {INCLUIDO.map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: TEXT_PRIMARY }}>
              <Check size={15} color="var(--c-verde)" /> {t}
            </div>
          ))}
        </div>
        <button
          onClick={() => { setAbierta(null); router.push('/app/suscripciones'); }}
          style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          Ver OPLORA · desde 6,66 €/mes
        </button>
        <button onClick={() => setAbierta(null)} style={{ width: '100%', padding: 12, marginTop: 6, border: 'none', background: 'transparent', color: TEXT_MUTED, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Ahora no
        </button>
      </div>
    </div>
  );
}
