'use client';

// ⭐ Ajustes de la oposición — mismo sistema que el resto de la app: botón redondo, listas en
// tarjetas blancas con la sombra común, títulos suaves, iconos lucide y sin emojis. Lo que no se
// puede deshacer va al final, con "Abandonar esta oposición" como última opción.

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  ArrowLeft, ChevronRight, RefreshCw, Download, LogOut, RotateCcw, CalendarRange, Repeat, UserPlus, AlertTriangle, Check,
} from 'lucide-react';
import { BG_NEUTRAL as BG_APP, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '@/styles/tokens';

const SOMBRA = '0 6px 18px rgba(15, 23, 42, 0.08)';
const BORDER = '#EEF0F3';

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 8, padding: '0 4px' }}>{titulo}</div>
      <div style={{ background: 'white', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>{children}</div>
    </section>
  );
}

function Fila({ Icon, color, bg, titulo, sub, onClick, ultima = false, peligro = false, subColor }: {
  Icon: any; color: string; bg: string; titulo: string; sub?: string; onClick: () => void; ultima?: boolean; peligro?: boolean; subColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'none', border: 'none', borderBottom: ultima ? 'none' : `1px solid ${BORDER}`, cursor: 'pointer', textAlign: 'left' }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={19} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: peligro ? '#B91C1C' : TEXT_PRIMARY }}>{titulo}</div>
        {sub && <div style={{ fontSize: 12, color: subColor ?? TEXT_MUTED, marginTop: 1 }}>{sub}</div>}
      </div>
      <ChevronRight size={16} color="#C4C9D2" style={{ flexShrink: 0 }} />
    </button>
  );
}

const CONSERVAR: { key: string; label: string }[] = [
  { key: 'puntosYNivel', label: 'Puntos y nivel' },
  { key: 'racha', label: 'Racha actual' },
  { key: 'flashcards', label: 'Flashcards dominadas' },
  { key: 'lectura', label: 'Progreso de lectura de apuntes' },
  { key: 'historialTests', label: 'Historial de tests' },
  { key: 'notas', label: 'Notas personales' },
];

export default function AjustesOposicionPage() {
  const params = useParams();
  const router = useRouter();
  const { usuario, actualizarUsuario } = useAuth();
  const queryClient = useQueryClient();
  const oposicionId = params.id as string;

  const [errorExportar, setErrorExportar] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [modalAbandonar, setModalAbandonar] = useState(false);
  const [modalResetear, setModalResetear] = useState(false);
  const [entiendo, setEntiendo] = useState(false);
  const [conservar, setConservar] = useState<Record<string, boolean>>({
    puntosYNivel: false, racha: false, flashcards: false, lectura: false, historialTests: false, notas: false,
  });

  const { data: oposicion } = useQuery({
    queryKey: ['oposicion', oposicionId],
    queryFn: async () => (await api.get(`/oposiciones/${oposicionId}`)).data,
  });

  const convActiva = usuario?.oposicionActiva?.id === oposicionId ? usuario?.oposicionActiva?.convocatoriaActiva : null;

  const resetear = useMutation({
    mutationFn: async () => { await api.post('/usuarios/resetear-progreso', { oposicionId, conservar }); },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setModalResetear(false);
      router.push('/app/dashboard');
    },
  });

  const abandonar = useMutation({
    mutationFn: async () => {
      await api.delete(`/usuarios/desactivar-oposicion/${oposicionId}`);
      return (await api.get('/usuarios/me')).data;
    },
    onSuccess: (me) => {
      if (me) actualizarUsuario(me);
      queryClient.invalidateQueries();
      router.push(me?.oposicionActiva ? '/app/dashboard' : '/app/onboarding/oposicion?modo=cambiar');
    },
  });

  // Descarga un CSV (se abre con Excel) con el resumen y todos los tests de la oposición.
  const exportarProgreso = async () => {
    if (exportando) return;
    setErrorExportar(null);
    setExportando(true);
    try {
      const res = await api.get(`/usuarios/exportar-progreso/${oposicionId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      const nombre = (oposicion?.nombre ?? 'oplora').toLowerCase().replace(/[^a-z0-9áéíóúñü]+/gi, '-').replace(/^-|-$/g, '');
      a.download = `progreso-${nombre || 'oplora'}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch {
      setErrorExportar('No se ha podido exportar. Inténtalo de nuevo.');
    } finally {
      setExportando(false);
    }
  };

  const nadaConservado = Object.values(conservar).every((v) => !v);

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 40 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
          <button
            onClick={() => router.push('/app/dashboard')}
            aria-label="Volver a Inicio"
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'white', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={18} color={TEXT_PRIMARY} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Ajustes</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>{oposicion?.nombre ?? 'Tu oposición'}</div>
            {convActiva?.anyo && <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>Convocatoria {convActiva.anyo}</div>}
          </div>
        </div>

        <Seccion titulo="Tu oposición">
          <Fila
            Icon={CalendarRange} color="#1F7CFF" bg="#EAF0FF"
            titulo="Mi convocatoria" sub="Fechas, plazas, ejercicios y temario"
            onClick={() => router.push(`/app/oposicion/${oposicionId}/convocatoria`)}
          />
          <Fila
            Icon={RefreshCw} color="#1F7CFF" bg="#EAF0FF"
            titulo="Cambiar de convocatoria" sub="Solo a convocatorias más recientes"
            onClick={() => router.push(`/app/oposicion/${oposicionId}/cambiar-convocatoria`)}
          />
          <Fila
            Icon={Repeat} color="#1F7CFF" bg="#EAF0FF"
            titulo="Cambiar de oposición" sub="Tu progreso en esta se guarda"
            onClick={() => router.push('/app/onboarding/oposicion?modo=cambiar')}
            ultima
          />
        </Seccion>

        {/* ⭐ "Notificaciones y avisos" se ha movido a Perfil: es de la cuenta, no de la convocatoria. */}

        <Seccion titulo="Comparte">
          <Fila
            Icon={UserPlus} color="#C2410C" bg="#FCEEE8"
            titulo="Invitar a un amigo" sub="Por email o compartiendo un enlace"
            onClick={() => router.push('/app/invitar')}
            ultima
          />
        </Seccion>

        <Seccion titulo="Tus datos">
          <Fila
            Icon={Download} color="#4D7C0F" bg="#F3FAE9"
            titulo="Exportar mi progreso"
            sub={exportando ? 'Preparando…' : errorExportar ?? 'Tus tests y aciertos en una hoja de cálculo'}
            subColor={errorExportar ? '#B91C1C' : undefined}
            onClick={exportarProgreso}
            ultima
          />
        </Seccion>

        <Seccion titulo="Zona delicada">
          <Fila
            Icon={RotateCcw} color="#D97706" bg="#FEF6E4"
            titulo="Reiniciar mi progreso" sub="Empieza de cero conservando lo que elijas"
            onClick={() => { setEntiendo(false); setModalResetear(true); }}
          />
          <Fila
            Icon={LogOut} color="#DC2626" bg="#FEF2F2"
            titulo="Abandonar esta oposición" sub="Dejará de aparecer en tu inicio"
            onClick={() => setModalAbandonar(true)}
            peligro
            ultima
          />
        </Seccion>
      </div>

      {/* Reiniciar progreso */}
      {modalResetear && (
        <div onClick={() => setModalResetear(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 60 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: BG_APP, borderRadius: '20px 20px 0 0', padding: '1.25rem', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#FEF6E4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <RotateCcw size={20} color="#D97706" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Reiniciar progreso</div>
                <div style={{ fontSize: 12, color: TEXT_MUTED }}>Marca lo que quieres conservar. Lo demás se borrará.</div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 16, boxShadow: SOMBRA, overflow: 'hidden', marginBottom: 14 }}>
              {CONSERVAR.map(({ key, label }, i) => {
                const on = conservar[key];
                return (
                  <button
                    key={key}
                    onClick={() => setConservar({ ...conservar, [key]: !on })}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'none', border: 'none', borderBottom: i < CONSERVAR.length - 1 ? `1px solid ${BORDER}` : 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ width: 22, height: 22, borderRadius: 7, background: on ? '#0f172a' : 'white', border: on ? 'none' : '2px solid #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {on && <Check size={14} color="white" strokeWidth={3} />}
                    </span>
                    <span style={{ flex: 1, fontSize: 14, color: TEXT_PRIMARY }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: on ? '#16A34A' : '#B91C1C' }}>{on ? 'Se conserva' : 'Se borra'}</span>
                  </button>
                );
              })}
            </div>

            {/* ⭐ Confirmación explícita: antes un solo toque borraba todo (nada venía marcado) */}
            <button
              onClick={() => setEntiendo(!entiendo)}
              style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FEF2F2', border: 'none', borderRadius: 12, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', marginBottom: 14 }}
            >
              <span style={{ width: 20, height: 20, borderRadius: 6, background: entiendo ? '#DC2626' : 'white', border: entiendo ? 'none' : '2px solid #FCA5A5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                {entiendo && <Check size={13} color="white" strokeWidth={3} />}
              </span>
              <span style={{ fontSize: 12, color: '#991B1B', lineHeight: 1.45 }}>
                Entiendo que {nadaConservado ? 'se borrará todo mi progreso' : 'lo que no he marcado se borrará'} y que no se puede deshacer.
              </span>
            </button>

            {resetear.isError && <div style={{ fontSize: 12, color: '#B91C1C', marginBottom: 10 }}>No se ha podido reiniciar. Inténtalo de nuevo.</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setModalResetear(false)} style={{ flex: 1, padding: 13, background: 'white', color: TEXT_SECONDARY, border: 'none', boxShadow: SOMBRA, borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                onClick={() => resetear.mutate()}
                disabled={!entiendo || resetear.isPending}
                style={{ flex: 1, padding: 13, background: '#DC2626', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: entiendo ? 'pointer' : 'default', opacity: entiendo ? 1 : 0.45 }}
              >
                {resetear.isPending ? 'Reiniciando…' : 'Reiniciar progreso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abandonar oposición */}
      {modalAbandonar && (
        <div onClick={() => setModalAbandonar(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: '1.5rem', width: '100%', maxWidth: 360, textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <AlertTriangle size={24} color="#DC2626" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>¿Abandonar {oposicion?.nombre ?? 'esta oposición'}?</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 18, lineHeight: 1.5 }}>
              Tu progreso se guarda, pero dejará de aparecer en tu inicio. Podrás volver a añadirla cuando quieras.
            </div>
            {abandonar.isError && <div style={{ fontSize: 12, color: '#B91C1C', marginBottom: 10 }}>No se ha podido completar. Inténtalo de nuevo.</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setModalAbandonar(false)} style={{ flex: 1, padding: 12, background: '#F3F4F6', color: TEXT_SECONDARY, border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={() => abandonar.mutate()} disabled={abandonar.isPending} style={{ flex: 1, padding: 12, background: '#DC2626', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {abandonar.isPending ? 'Saliendo…' : 'Abandonar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
