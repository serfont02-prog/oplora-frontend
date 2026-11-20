'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, Database, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { BG_NEUTRAL } from '@/styles/tokens';
import BancoPreguntas from '@/components/admin/test/BancoPreguntas';
import ExamenesOficiales from '@/components/admin/test/ExamenesOficiales';
import ImportarTestPage from '../importar-test/page';

/**
 * ⭐ Módulo «Test» del panel (nov 2026). Reúne en un solo sitio todo lo del test, igual que el
 * módulo de Flashcards: banco de preguntas, exámenes oficiales e importación masiva.
 * Las preguntas siguen ligadas a oposición + tema (+ artículo) y la copia de convocatoria las
 * sigue vinculando sin duplicarlas: el módulo solo cambia por dónde se entra, no los datos.
 * Las rutas antiguas de la convocatoria (…/banco-preguntas y …/examenes) usan los mismos
 * componentes. Acepta ?tab=banco|examenes|importar&oposicion=…&convocatoria=…
 */

type Tab = 'banco' | 'examenes' | 'importar';

const ESTADO: Record<string, string> = { activa: 'Activa', cerrada: 'Cerrada', borrador: 'Borrador' };

export default function TestAdminPage() {
  const [tab, setTab] = useState<Tab>('banco');
  const [oposicionId, setOposicionId] = useState('');
  const [convocatoriaId, setConvocatoriaId] = useState('');
  const [listo, setListo] = useState(false);

  // Leer pestaña y selección de la URL (sin useSearchParams para no exigir Suspense).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get('tab');
    if (t === 'banco' || t === 'examenes' || t === 'importar') setTab(t);
    if (q.get('oposicion')) setOposicionId(q.get('oposicion') as string);
    if (q.get('convocatoria')) setConvocatoriaId(q.get('convocatoria') as string);
    setListo(true);
  }, []);

  // Mantener la URL al día (volver atrás o compartir el enlace deja la misma vista).
  useEffect(() => {
    if (!listo) return;
    const q = new URLSearchParams();
    q.set('tab', tab);
    if (oposicionId) q.set('oposicion', oposicionId);
    if (convocatoriaId) q.set('convocatoria', convocatoriaId);
    window.history.replaceState(null, '', `/admin/test?${q.toString()}`);
  }, [listo, tab, oposicionId, convocatoriaId]);

  const { data: oposiciones = [] } = useQuery({
    queryKey: ['oposiciones-admin'],
    queryFn: async () => (await api.get('/oposiciones')).data as any[],
  });

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias', oposicionId],
    queryFn: async () => (await api.get(`/convocatorias/oposicion/${oposicionId}`)).data as any[],
    enabled: !!oposicionId,
  });

  // Con una sola convocatoria (o una sola activa), se elige sola.
  useEffect(() => {
    if (!oposicionId || convocatoriaId) return;
    const lista = convocatorias as any[];
    if (!lista.length) return;
    const activas = lista.filter((c) => c.estado === 'activa');
    if (lista.length === 1) setConvocatoriaId(lista[0].id);
    else if (activas.length === 1) setConvocatoriaId(activas[0].id);
  }, [oposicionId, convocatorias, convocatoriaId]);

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'banco', label: 'Banco de preguntas', icon: Database },
    { key: 'examenes', label: 'Exámenes oficiales', icon: ClipboardCheck },
    { key: 'importar', label: 'Importar', icon: Upload },
  ];

  const select: React.CSSProperties = { padding: '6px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', minWidth: '220px' };
  const seleccionCompleta = !!oposicionId && !!convocatoriaId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Test</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
          Banco de preguntas, exámenes oficiales e importación masiva del test
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
        <>
          {/* Selector común de oposición y convocatoria */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', padding: '10px 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white' }}>
            <select value={oposicionId} onChange={(e) => { setOposicionId(e.target.value); setConvocatoriaId(''); }} style={select}>
              <option value="">Elige una oposición…</option>
              {(oposiciones as any[]).map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
            </select>
            <select value={convocatoriaId} onChange={(e) => setConvocatoriaId(e.target.value)} style={select} disabled={!oposicionId}>
              <option value="">{oposicionId ? 'Elige una convocatoria…' : 'Convocatoria'}</option>
              {[...(convocatorias as any[])].sort((a, b) => b.anyo - a.anyo).map((c) => (
                <option key={c.id} value={c.id}>{c.anyo}{c.turno ? ` · ${c.turno}` : ''}{c.estado ? ` (${ESTADO[c.estado] ?? c.estado})` : ''}</option>
              ))}
            </select>
          </div>

          {!seleccionCompleta ? (
            <div style={{ flex: 1, padding: '1.5rem', background: BG_NEUTRAL, fontSize: '13px', color: '#6b7280' }}>
              Elige la oposición y la convocatoria para ver {tab === 'banco' ? 'su banco de preguntas' : 'sus exámenes oficiales'}.
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {tab === 'banco' && <BancoPreguntas key={convocatoriaId} oposicionId={oposicionId} convocatoriaId={convocatoriaId} embebido />}
              {tab === 'examenes' && <ExamenesOficiales key={convocatoriaId} oposicionId={oposicionId} convocatoriaId={convocatoriaId} embebido />}
            </div>
          )}
        </>
      )}
    </div>
  );
}
