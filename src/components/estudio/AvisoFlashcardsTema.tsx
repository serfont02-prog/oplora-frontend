'use client';

// ⭐ Empujón al terminar de leer un apunte: como las flashcards nuevas ya no salen en Inicio
// (allí solo se cuentan los repasos), aquí se recuerda que el tema tiene flashcards sin estrenar.
// Aparece al final del texto, así que solo lo ve quien llega hasta abajo. Se puede cerrar.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Layers, X } from 'lucide-react';
import { api } from '@/lib/api';
import { TEXT_PRIMARY, TEXT_MUTED, COLOR_FC, COLOR_FC_BG } from '@/styles/tokens';

const TANDA = 10;

export default function AvisoFlashcardsTema({ temaId, oposicionId, numeroTema }: { temaId?: string; oposicionId?: string; numeroTema?: number }) {
  const router = useRouter();
  const [cerrado, setCerrado] = useState(false);
  const { data: stats } = useQuery({
    queryKey: ['stats-fc-tema', temaId, oposicionId],
    queryFn: async () => (await api.get(`/flashcards/stats/${oposicionId}/${temaId}`)).data,
    enabled: !!temaId && !!oposicionId,
  });

  const sinVer = stats?.sinVer ?? 0;
  if (cerrado || !temaId || !oposicionId || sinVer <= 0) return null;
  const empezado = (stats?.total ?? 0) > sinVer;
  const n = Math.min(TANDA, sinVer);

  return (
    <div style={{ maxWidth: 600, margin: '14px auto 0', background: 'var(--c-superficie)', borderRadius: 18, boxShadow: 'var(--c-sombra)', padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: COLOR_FC_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Layers size={19} color={COLOR_FC} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.35 }}>
          {empezado
            ? `Te quedan ${sinVer} flashcards sin ver de este tema`
            : `Este tema tiene ${sinVer} flashcards. ¿Empiezas con ${n}?`}
        </div>
        <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2, lineHeight: 1.45 }}>
          Fijan lo que acabas de leer. Pocas cada día es lo que mejor funciona.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push(`/app/flashcards/repasar?temaId=${temaId}&oposicionId=${oposicionId}&numeroTema=${numeroTema ?? ''}&modo=nuevas&n=${n}&origen=flashcards`)}
            style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            {empezado ? `Seguir con ${n}` : `Empezar con ${n}`}
          </button>
          <button
            onClick={() => router.push(`/app/flashcards?tema=${temaId}`)}
            style={{ padding: '9px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: COLOR_FC, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Elegir cuántas
          </button>
        </div>
      </div>
      <button onClick={() => setCerrado(true)} aria-label="Cerrar aviso" style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        <X size={15} color={TEXT_MUTED} />
      </button>
    </div>
  );
}
