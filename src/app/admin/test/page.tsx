'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, Database, Upload, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { BG_NEUTRAL } from '@/styles/tokens';
import ImportarTestPage from '../importar-test/page';

/**
 * ⭐ Módulo «Test» del panel (nov 2026). Reúne en un solo sitio todo lo del test, igual que el
 * módulo de Flashcards: banco de preguntas, exámenes oficiales e importación masiva.
 * Las preguntas siguen ligadas a oposición + tema (+ artículo) y la copia de convocatoria las
 * sigue vinculando sin duplicarlas: este módulo solo cambia por dónde se entra, no los datos.
 * Acepta ?oposicion=…&convocatoria=…&tab=banco|examenes|importar (lo usan los accesos de la
 * ficha de la oposición).
 */

type Tab = 'banco' | 'examenes' | 'importar';

const ESTADO: Record<string, { bg: string; color: string; label: string }> = {
  activa: { bg: '#f0fdf4', color: '#15803d', label: 'Activa' },
  cerrada: { bg: '#f3f4f6', color: '#6b7280', label: 'Cerrada' },
  borrador: { bg: '#fffbeb', color: '#92400e', label: 'Borrador' },
};

export default function TestAdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('banco');
  const [oposicionId, setOposicionId] = useState('');
  const [convocatoriaId, setConvocatoriaId] = useState('');

  // Leer la pestaña y la selección de la URL (sin useSearchParams para no exigir Suspense).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get('tab');
    if (t === 'banco' || t === 'examenes' || t === 'importar') setTab(t);
    if (q.get('oposicion')) setOposicionId(q.get('oposicion') as string);
    if (q.get('convocatoria')) setConvocatoriaId(q.get('convocatoria') as string);
  }, []);

  // Mantener la URL al día para poder volver o compartir el enlace.
  useEffect(() => {
    const q = new URLSearchParams();
    q.set('tab', tab);
    if (oposicionId) q.set('oposicion', oposicionId);
    if (convocatoriaId) q.set('convocatoria', convocatoriaId);
    window.history.replaceState(null, '', `/admin/test?${q.toString()}`);
  }, [tab, oposicionId, convocatoriaId]);

  const { data: oposiciones = [] } = useQuery({
    queryKey: ['oposiciones-admin'],
    queryFn: async () => (await api.get('/oposiciones')).data as any[],
  });

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias', oposicionId],
    queryFn: async () => (await api.get(`/convocatorias/oposicion/${oposicionId}`)).data as any[],
    enabled: !!oposicionId,
  });

  const { data: examenesOposicion = [] } = useQuery({
    queryKey: ['examenes-oposicion-admin', oposicionId],
    queryFn: async () => (await api.get(`/temas/examenes/oposicion/${oposicionId}`)).data as any[],
    enabled: !!oposicionId,
  });

  const examenesPorConvocatoria = (examenesOposicion as any[]).reduce(
    (m: Record<string, { examenes: number; preguntas: number }>, ex: any) => {
      const cid = ex.convocatoria?.id;
      if (!cid) return m;
      const acc = m[cid] ?? { examenes: 0, preguntas: 0 };
      acc.examenes += 1;
      acc.preguntas += ex.totalPreguntas ?? 0;
      m[cid] = acc;
      return m;
    }, {});

  // Si la oposición solo tiene una convocatoria (o una activa), se elige sola.
  useEffect(() => {
    if (!oposicionId || convocatoriaId || !(convocatorias as any[]).length) return;
    const lista = convocatorias as any[];
    const activa = lista.filter((c) => c.estado === 'activa');
    if (lista.length === 1) setConvocatoriaId(lista[0].id);
    else if (activa.length === 1) setConvocatoriaId(activa[0].id);
  }, [oposicionId, convocatorias, convocatoriaId]);

  const abrir = (destino: 'banco-preguntas' | 'examenes', cid: string) =>
    router.push(`/admin/oposiciones/${oposicionId}/convocatorias/${cid}/${destino}`);

  const caja: React.CSSProperties = { background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem' };
  const select: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'banco', label: 'Banco de preguntas', icon: Database },
    { key: 'examenes', label: 'Exámenes oficiales', icon: ClipboardCheck },
    { key: 'importar', label: 'Importar', icon: Upload },
  ];

  const selectorOposicion = (
    <div style={{ ...caja, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '4px' }}>Oposición</div>
        <select value={oposicionId} onChange={(e) => { setOposicionId(e.target.value); setConvocatoriaId(''); }} style={select}>
          <option value="">Elige una oposición…</option>
          {(oposiciones as any[]).map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
        </select>
      </div>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '4px' }}>Convocatoria</div>
        <select value={convocatoriaId} onChange={(e) => setConvocatoriaId(e.target.value)} style={select} disabled={!oposicionId}>
          <option value="">{oposicionId ? 'Elige una convocatoria…' : '—'}</option>
          {(convocatorias as any[]).map((c) => (
            <option key={c.id} value={c.id}>{c.anyo}{c.turno ? ` · ${c.turno}` : ''}{c.estado ? ` (${ESTADO[c.estado]?.label ?? c.estado})` : ''}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const listaConvocatorias = (destino: 'banco-preguntas' | 'examenes') => (
    <div style={{ ...caja, padding: 0, overflow: 'hidden' }}>
      {(convocatorias as any[]).length === 0 && (
        <div style={{ padding: '1.25rem', fontSize: '13px', color: '#9ca3af' }}>
          {oposicionId ? 'Esta oposición no tiene convocatorias.' : 'Elige una oposición para ver sus convocatorias.'}
        </div>
      )}
      {(convocatorias as any[]).map((c, i) => {
        const ex = examenesPorConvocatoria[c.id];
        const badge = ESTADO[c.estado] ?? ESTADO.borrador;
        const marcada = c.id === convocatoriaId;
        return (
          <button key={c.id} onClick={() => abrir(destino, c.id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
              border: 'none', borderTop: i ? '1px solid #f3f4f6' : 'none', cursor: 'pointer', textAlign: 'left',
              background: marcada ? '#f9fafb' : 'white',
            }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', minWidth: '52px' }}>{c.anyo}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500, background: badge.bg, color: badge.color }}>{badge.label}</span>
            {destino === 'examenes' && (
              <span style={{ fontSize: '12px', color: ex?.preguntas ? '#15803d' : '#9ca3af' }}>
                {ex ? `${ex.examenes} examen${ex.examenes > 1 ? 'es' : ''} · ${ex.preguntas} preguntas` : 'Sin examen'}
              </span>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {destino === 'examenes' ? 'Abrir exámenes' : 'Abrir banco'} <ChevronRight size={13} />
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Test</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
          Banco de preguntas, exámenes oficiales e importación masiva del test, por oposición y convocatoria
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', background: 'white', padding: '0 1.5rem' }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '13px', fontWeight: tab === key ? 600 : 400,
              color: tab === key ? '#111827' : '#9ca3af',
              borderBottom: tab === key ? '2px solid #111827' : '2px solid transparent',
            }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'importar' ? (
        <ImportarTestPage />
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: BG_NEUTRAL }}>
          <div style={{ maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectorOposicion}
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {tab === 'banco'
                ? 'El banco reúne las preguntas de test de la convocatoria, vinculadas a su tema y, si las tiene, a su artículo. Al copiar una convocatoria se vinculan las mismas preguntas a los temas nuevos, sin duplicarlas.'
                : 'Exámenes oficiales de cada convocatoria: crear el examen, cargar sus preguntas y la plantilla.'}
            </div>
            {listaConvocatorias(tab === 'banco' ? 'banco-preguntas' : 'examenes')}
          </div>
        </div>
      )}
    </div>
  );
}
