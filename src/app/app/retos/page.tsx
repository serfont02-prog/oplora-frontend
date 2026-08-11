'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, ChevronRight } from 'lucide-react';
import { FooterNavegacion } from '@/app/app/dashboard/page';
import { FireIcon } from '@heroicons/react/24/outline';
import { AvatarPerfil } from '@/components/AvatarUsuarioPerfil';


type TipoRetoUsuario = 'oposicion' | 'normativa' | 'tema';

const BG_APP = '#FCEEE8';
const COLOR_RETOS = '#C2410C';
const COLOR_RETOS_BG = '#FACCC0';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';


function tiempoRestante(fechaFin: string): string {
  const restante = new Date(fechaFin).getTime() - Date.now();
  if (restante <= 0) return 'Caducado';
  const horas = Math.floor(restante / (1000 * 60 * 60));
  if (horas < 1) return `${Math.floor(restante / (1000 * 60))} min restantes`;
  if (horas < 24) return `${horas}h restantes`;
  return `${Math.floor(horas / 24)}d restantes`;
}

export default function RetosPage() {
  const router = useRouter();
  const { usuario, cargando } = useAuth();
  const queryClient = useQueryClient();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [retoPreview, setRetoPreview] = useState<string | null>(null);
  const [revanchaAbierta, setRevanchaAbierta] = useState(false);
  const [mensajeRevancha, setMensajeRevancha] = useState('');
  const [form, setForm] = useState({
    retadoNickOEmail: '',
    numPreguntas: 10,
    tipoReto: 'oposicion' as TipoRetoUsuario,
    temaId: '',
    versionLeyId: '',
    mensaje: '',
    horasPlazo: 48,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

  const oposicionId = usuario?.oposicionActiva?.id;

  const { data: retoDiario } = useQuery({
    queryKey: ['reto-diario', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/retos/diario/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId,
  });

  const { data: retoSemanal } = useQuery({
    queryKey: ['reto-semanal', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/retos/semanal/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId,
  });

  const { data: misRetos = [] } = useQuery({
    queryKey: ['mis-retos'],
    queryFn: async () => {
      const res = await api.get('/retos/mis-retos');
      return res.data;
    },
    enabled: !!usuario,
  });

  const { data: contactosRecientes = [] } = useQuery({
    queryKey: ['contactos-recientes'],
    queryFn: async () => {
      const res = await api.get('/retos/contactos-recientes');
      return res.data;
    },
    enabled: !!usuario && modalAbierto,
  });

  const { data: convocatoriasReto = [] } = useQuery({
    queryKey: ['convocatorias-reto', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId && modalAbierto,
  });

  const convocatoriaReto = convocatoriasReto.find((c: any) => c.estado === 'activa') ?? convocatoriasReto[0];

  const { data: temas = [] } = useQuery({
    queryKey: ['temas-reto', convocatoriaReto?.id],
    queryFn: async () => {
      const res = await api.get(`/temas/convocatoria/${convocatoriaReto.id}`);
      return res.data;
    },
    enabled: !!convocatoriaReto?.id && modalAbierto,
  });

  const { data: leyes = [] } = useQuery({
    queryKey: ['leyes-reto', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/leyes/oposicion/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId && modalAbierto,
  });

  const { data: retoDetalle } = useQuery({
    queryKey: ['reto-preview', retoPreview],
    queryFn: async () => {
      const res = await api.get(`/retos/${retoPreview}`);
      return res.data;
    },
    enabled: !!retoPreview,
  });

  const [retoRecienCreado, setRetoRecienCreado] = useState<string | null>(null);

  const crearReto = useMutation({
    mutationFn: async () => {
      const body: any = {
        retadoNickOEmail: form.retadoNickOEmail,
        oposicionId,
        numPreguntas: form.numPreguntas,
        mensaje: form.mensaje || undefined,
        horasPlazo: form.horasPlazo,
      };
      if (form.tipoReto === 'tema' && form.temaId) body.temaId = form.temaId;
      if (form.tipoReto === 'normativa' && form.versionLeyId) body.versionLeyId = form.versionLeyId;
      const res = await api.post('/retos/usuario', body);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mis-retos'] });
      queryClient.invalidateQueries({ queryKey: ['contactos-recientes'] });
      setModalAbierto(false);
      setForm({ retadoNickOEmail: '', numPreguntas: 10, tipoReto: 'oposicion', temaId: '', versionLeyId: '', mensaje: '', horasPlazo: 48 });
      setError('');
      setRetoRecienCreado(data.id);
    },
    onError: (e: any) => {
      setError(e?.response?.data?.message ?? 'Error creando el reto');
    },
  });

  const eliminarReto = useMutation({
    mutationFn: async (retoId: string) => {
      await api.delete(`/retos/${retoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-retos'] });
    },
  });

  const enviarRevancha = useMutation({
    mutationFn: async () => {
      const oponente = retoDetalle.participaciones.find((p: any) => p.usuario?.id !== (usuario as any)?.id);
      const horasOriginal = Math.round((new Date(retoDetalle.fechaFin).getTime() - new Date(retoDetalle.creadoEn).getTime()) / 3600000);
      const res = await api.post('/retos/usuario', {
        retadoNickOEmail: oponente?.usuario?.nick ?? oponente?.usuario?.email,
        oposicionId: retoDetalle.oposicion?.id,
        numPreguntas: retoDetalle.preguntas?.length ?? 10,
        temaId: retoDetalle.tema?.id ?? undefined,
        mensaje: mensajeRevancha || undefined,
        horasPlazo: horasOriginal > 0 ? horasOriginal : 48,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mis-retos'] });
      setRevanchaAbierta(false);
      setMensajeRevancha('');
      setRetoPreview(data.id);
    },
  });

      const getOtroParticipante = (reto: any, usuarioId: string) => {
        return reto.participaciones?.find((p: any) => p.usuario?.id !== usuarioId)?.usuario;
      };

      const [confirmacion, setConfirmacion] = useState<{ reto: any; accion: 'cancelar' | 'rechazar' } | null>(null);
    const [errorAccion, setErrorAccion] = useState<string | null>(null);

    const confirmarAccion = (reto: any, accion: 'cancelar' | 'rechazar') => {
      setConfirmacion({ reto, accion });
      setErrorAccion(null);
    };

    const ejecutarAccion = () => {
      if (!confirmacion) return;
      eliminarReto.mutate(confirmacion.reto.id, {
        onSuccess: () => {
          setConfirmacion(null);
        },
        onError: (e: any) => {
          setErrorAccion(e?.response?.data?.message ?? 'No se pudo completar la acción');
        },
      });
    };

 const retosUsuarioPendientes = misRetos.filter(
  (p: any) => p.reto?.tipo === 'usuario'
    && p.reto?.estado !== 'expirado'
    && (!p.completado || p.posicion === null)
  );
  const retosUsuarioCompletados = misRetos.filter(
    (p: any) => p.reto?.tipo === 'usuario' && p.completado && p.posicion !== null
  );

  const retosEnviados = retosUsuarioPendientes.filter((p: any) => p.reto.creador?.id === (usuario as any)?.id);
  const retosRecibidos = retosUsuarioPendientes.filter((p: any) => p.reto.creador?.id !== (usuario as any)?.id);

  const yaHizoRetoDiario = retoDiario?.participaciones?.some(
    (p: any) => p.usuario?.id === (usuario as any)?.id && p.completado
  );
  const yaHizoRetoSemanal = retoSemanal?.participaciones?.some(
    (p: any) => p.usuario?.id === (usuario as any)?.id && p.completado
  );

  const cerrarModalPreview = () => {
    setRetoPreview(null);
    setRevanchaAbierta(false);
    setMensajeRevancha('');
  };

  const formularioValido = form.retadoNickOEmail
    && (form.tipoReto !== 'normativa' || form.versionLeyId)
    && (form.tipoReto !== 'tema' || form.temaId);

  if (cargando) return null;

      const { data: estadisticas } = useQuery({
      queryKey: ['estadisticas-retos'],
      queryFn: async () => {
        const res = await api.get('/retos/estadisticas');
        return res.data;
      },
      enabled: !!usuario,
    });

    const retosExpirados = misRetos.filter(
      (p: any) => p.reto?.tipo === 'usuario' && p.reto?.estado === 'expirado'
    );

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: '90px' }}>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── HERO MINIMALISTA (título + subtítulo + avatar) ── */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                Retos
              </div>
              <div style={{ fontSize: '19px', fontWeight: 700, color: TEXT_PRIMARY }}>
                Pon a prueba lo aprendido
              </div>
            </div>
            <button
              onClick={() => router.push('/app/perfil')}
              style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}
            >
              <AvatarPerfil usuario={usuario} size={44} />
            </button>
          </div>

        {estadisticas && estadisticas.total > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { label: 'Victorias', value: estadisticas.victorias },
            { label: 'Retos jugados', value: estadisticas.total },
            { label: '% victoria', value: `${estadisticas.porcentajeVictoria}%` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: '14px', padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: TEXT_PRIMARY }}>{value}</div>
              <div style={{ fontSize: '10px', color: TEXT_MUTED, marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

        {/* ── 1. Retos del sistema ── */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            Retos del sistema
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            <div
              onClick={() => retoDiario && setRetoPreview(retoDiario.id)}
              style={{
                background: 'white', border: '1px solid #F1F5F9', borderRadius: '14px',
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                cursor: 'pointer', minHeight: '68px', boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: COLOR_RETOS_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '16px' }}>⚡</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT_PRIMARY }}>Reto diario</div>
                <div style={{ fontSize: '11px', color: TEXT_MUTED, marginTop: '2px' }}>
                  {retoDiario?.preguntas?.length ?? '—'} preguntas · Nivel {usuario?.nivel ?? 1} · Caduca hoy
                </div>
              </div>
              {yaHizoRetoDiario ? (
                <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: '#f0fdf4', color: '#15803d', fontWeight: 600, flexShrink: 0 }}>✓ Hecho</span>
              ) : (
                <ChevronRight size={16} color="#D1D5DB" style={{ flexShrink: 0 }} />
              )}
            </div>

            <div
              onClick={() => retoSemanal && setRetoPreview(retoSemanal.id)}
              style={{
                background: 'white', border: '1px solid #F1F5F9', borderRadius: '14px',
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                cursor: 'pointer', minHeight: '68px', boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F3F0FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '16px' }}>🏆</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {retoSemanal?.tema?.titulo ? `Tema ${retoSemanal.tema.numero}` : 'Reto semanal'}
                </div>
                <div style={{ fontSize: '11px', color: TEXT_MUTED, marginTop: '2px' }}>
                  {retoSemanal?.preguntas?.length ?? '—'} preguntas · Cierra el domingo
                </div>
              </div>
              {yaHizoRetoSemanal ? (
                <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: '#f0fdf4', color: '#15803d', fontWeight: 600, flexShrink: 0 }}>✓ Hecho</span>
              ) : (
                <ChevronRight size={16} color="#D1D5DB" style={{ flexShrink: 0 }} />
              )}
            </div>
          </div>
        </div>

        {/* Botón nuevo reto */}
        <button
          onClick={() => setModalAbierto(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            background: '#111827', color: 'white', border: 'none', borderRadius: '12px',
            padding: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', width: '100%',
          }}
        >
          <Plus size={14} />
          Nuevo reto
        </button>

 
{/* ── Retos en curso (lanzados + recibidos, ordenados por tiempo restante) ── */}
{(() => {
  const retosEnCurso = [...retosRecibidos, ...retosEnviados].sort((a, b) => {
    const tiempoA = new Date(a.reto.fechaFin).getTime() - Date.now();
    const tiempoB = new Date(b.reto.fechaFin).getTime() - Date.now();
    return tiempoA - tiempoB;
  });

  return (
    <div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {retosEnCurso.map((p: any) => {
          const esCreador = p.reto.creador?.id === (usuario as any)?.id;
          return (
            <div key={p.id} style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: '14px', padding: '14px 16px', boxSizing: 'border-box' }}>
              <div onClick={() => setRetoPreview(p.reto.id)} style={{ cursor: 'pointer' }}>
                <DueloReto reto={p.reto} usuarioActual={usuario} mostrarBarraTiempo />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '11px', color: TEXT_MUTED }}>
                  {esCreador ? 'Reto enviado' : `${p.reto.creador?.nick ?? p.reto.creador?.nombre} te retó`} · {p.reto.tema?.titulo ? `Tema ${p.reto.tema.numero}` : 'Oposición'}
                </span>
                <button
                onClick={(e) => { e.stopPropagation(); confirmarAccion(p.reto, esCreador ? 'cancelar' : 'rechazar'); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MUTED, fontSize: '11px', fontWeight: 600, flexShrink: 0 }}
              >
                {esCreador ? 'Cancelar' : 'Rechazar'}
              </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
})()}

{retosEnviados.length === 0 && retosRecibidos.length === 0 && (
  <div>
    <div style={{ fontSize: '11px', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
      Retos en curso
    </div>
    <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: '14px', padding: '1.25rem', textAlign: 'center' }}>
      <div style={{ fontSize: '13px', color: TEXT_MUTED }}>Sin retos entre usuarios todavía</div>
    </div>
  </div>
)}
        {(retosUsuarioCompletados.length > 0 || retosExpirados.length > 0) && (
          <WidgetHistorialRetos
            retosCompletados={[...retosUsuarioCompletados, ...retosExpirados].sort(
              (a, b) => new Date(b.reto.creadoEn).getTime() - new Date(a.reto.creadoEn).getTime()
            )}
            usuario={usuario}
            onVer={(id: string) => setRetoPreview(id)}
          />
        )}

      </div>

      {/* Modal crear reto */}
      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ background: BG_APP, borderRadius: '20px', padding: '1.5rem', width: '100%', maxWidth: '400px', maxHeight: '85vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT_PRIMARY }}>Enviar reto</div>
              <button
                onClick={() => { setModalAbierto(false); setError(''); }}
                style={{ background: 'white', border: 'none', borderRadius: '10px', width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer', color: TEXT_MUTED }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {contactosRecientes.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Recientes</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {contactosRecientes.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => setForm({ ...form, retadoNickOEmail: c.contacto?.nick ?? c.contacto?.email ?? '' })}
                        style={{ padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', background: form.retadoNickOEmail === (c.contacto?.nick ?? c.contacto?.email) ? '#111827' : 'white', color: form.retadoNickOEmail === (c.contacto?.nick ?? c.contacto?.email) ? 'white' : '#374151' }}
                      >
                        @{c.contacto?.nick ?? c.contacto?.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: TEXT_SECONDARY, display: 'block', marginBottom: '4px' }}>Nick o email del retado *</label>
                <input
                  type="text"
                  value={form.retadoNickOEmail}
                  onChange={(e) => setForm({ ...form, retadoNickOEmail: e.target.value })}
                  placeholder="nick_amigo o email@ejemplo.com"
                  style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: 'none', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                />
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT_SECONDARY, marginBottom: '8px' }}>Sobre qué va el reto</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { key: 'oposicion', icon: '🎯', label: 'Oposición' },
                    { key: 'normativa', icon: '📖', label: 'Normativa' },
                    { key: 'tema', icon: '📋', label: 'Tema' },
                  ].map(({ key, icon, label }) => (
                    <button
                      key={key}
                      onClick={() => setForm({ ...form, tipoReto: key as TipoRetoUsuario, temaId: '', versionLeyId: '' })}
                      style={{ flex: 1, padding: '10px 6px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center', border: form.tipoReto === key ? '2px solid #111827' : 'none', background: 'white' }}
                    >
                      <div style={{ fontSize: '16px', marginBottom: '3px' }}>{icon}</div>
                      <div style={{ fontSize: '11px', fontWeight: 500, color: TEXT_PRIMARY }}>{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {form.tipoReto === 'normativa' && (
                <select
                  value={form.versionLeyId}
                  onChange={(e) => setForm({ ...form, versionLeyId: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: 'none', borderRadius: '10px', fontSize: '13px', color: TEXT_PRIMARY, background: 'white' }}
                >
                  <option value="">Elige una ley...</option>
                  {leyes.map((ol: any) => (
                    <option key={ol.versionLey?.id} value={ol.versionLey?.id}>{ol.ley?.nombre}</option>
                  ))}
                </select>
              )}

              {form.tipoReto === 'tema' && (
                <select
                  value={form.temaId}
                  onChange={(e) => setForm({ ...form, temaId: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: 'none', borderRadius: '10px', fontSize: '13px', color: TEXT_PRIMARY, background: 'white' }}
                >
                  <option value="">Elige un tema...</option>
                  {temas.map((t: any) => (
                    <option key={t.id} value={t.id}>Tema {t.numero} — {t.titulo.slice(0, 40)}{t.titulo.length > 40 ? '...' : ''}</option>
                  ))}
                </select>
              )}

              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT_SECONDARY, marginBottom: '8px' }}>Número de preguntas</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[5, 10, 20].map((n) => (
                    <button
                      key={n}
                      onClick={() => setForm({ ...form, numPreguntas: n })}
                      style={{ flex: 1, padding: '9px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', background: form.numPreguntas === n ? '#111827' : 'white', color: form.numPreguntas === n ? 'white' : '#6b7280' }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT_SECONDARY, marginBottom: '8px' }}>Plazo para completarlo</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { label: '24h', horas: 24 },
                    { label: '48h', horas: 48 },
                    { label: '1 semana', horas: 168 },
                  ].map(({ label, horas }) => (
                    <button
                      key={horas}
                      onClick={() => setForm({ ...form, horasPlazo: horas })}
                      style={{ flex: 1, padding: '9px', borderRadius: '10px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', background: form.horasPlazo === horas ? '#111827' : 'white', color: form.horasPlazo === horas ? 'white' : '#6b7280' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: TEXT_SECONDARY, display: 'block', marginBottom: '4px' }}>
                  Mensaje <span style={{ color: TEXT_MUTED, fontWeight: 400 }}>(opcional)</span>
                </label>
                <textarea
                  value={form.mensaje}
                  onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                  placeholder="Escribe algo motivador para tu rival..."
                  maxLength={140}
                  style={{ width: '100%', minHeight: '60px', padding: '10px 12px', fontSize: '13px', border: 'none', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', background: 'white', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {error && (
                <div style={{ fontSize: '12px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '8px 12px' }}>
                  {error}
                </div>
              )}

              <div style={{ background: 'white', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: TEXT_SECONDARY }}>
                ⏱ El retado tiene {form.horasPlazo}h para completar el mismo test
              </div>

              <button
                onClick={() => crearReto.mutate()}
                disabled={!formularioValido || crearReto.isPending}
                style={{ width: '100%', padding: '13px', background: !formularioValido ? '#e5e7eb' : '#111827', color: !formularioValido ? '#9ca3af' : 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: !formularioValido ? 'not-allowed' : 'pointer' }}
              >
                {crearReto.isPending ? 'Generando reto' : '⚡ Enviar reto'}
              </button>

            </div>
          </div>
        </div>
      )}


      {retoRecienCreado && (
        <div
          onClick={() => setRetoRecienCreado(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: BG_APP, borderRadius: '20px', padding: '1.75rem 1.5rem', width: '100%', maxWidth: '360px', textAlign: 'center' }}
          >
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: COLOR_RETOS_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <FireIcon style={{ width: 26, height: 26, color: COLOR_RETOS }} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: TEXT_PRIMARY, marginBottom: '6px' }}>
              ¡Reto enviado!
            </div>
            <div style={{ fontSize: '13px', color: TEXT_SECONDARY, marginBottom: '20px' }}>
              Tu rival ya puede aceptarlo y jugar
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => router.push(`/app/retos/${retoRecienCreado}?directo=true`)}
                style={{ width: '100%', padding: '13px', background: '#111827', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                Hacer reto ahora
              </button>
              <button
                onClick={() => setRetoRecienCreado(null)}
                style={{ width: '100%', padding: '13px', background: 'white', color: TEXT_SECONDARY, border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Dejarlo para más adelante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal preview / resultado */}
      {retoPreview && retoDetalle && (() => {
        const miParticipacion = retoDetalle.participaciones?.find((p: any) => p.usuario?.id === (usuario as any)?.id);
        const otraParticipacion = retoDetalle.participaciones?.find((p: any) => p.usuario?.id !== (usuario as any)?.id);
        const ambosCompletados = miParticipacion?.completado && otraParticipacion?.completado;
        const yoGane = ambosCompletados && (
          miParticipacion.porcentaje > otraParticipacion.porcentaje ||
          (miParticipacion.porcentaje === otraParticipacion.porcentaje && miParticipacion.tiempoSegundos < otraParticipacion.tiempoSegundos)
        );
        const empate = ambosCompletados && miParticipacion.porcentaje === otraParticipacion.porcentaje && miParticipacion.tiempoSegundos === otraParticipacion.tiempoSegundos;

        return (
          <div onClick={cerrarModalPreview} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: BG_APP, borderRadius: '20px', padding: '1.5rem', width: '100%', maxWidth: '420px', maxHeight: '85vh', overflowY: 'auto' }}>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT_PRIMARY }}>
                  {retoDetalle.tipo === 'diario' ? 'Reto diario ⚡' : retoDetalle.tipo === 'semanal' ? 'Reto semanal 🏆' : 'Reto entre usuarios 🎯'}
                </div>
                <button onClick={cerrarModalPreview} style={{ background: 'white', border: 'none', borderRadius: '10px', width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer', color: TEXT_MUTED }}>✕</button>
              </div>

              {retoDetalle.creador && retoDetalle.creador.id !== (usuario as any)?.id && (
                <div style={{ background: 'white', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EFE9E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: TEXT_PRIMARY, flexShrink: 0 }}>
                    {(retoDetalle.creador.nick ?? retoDetalle.creador.nombre ?? '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: TEXT_MUTED }}>Te ha retado</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT_PRIMARY }}>{retoDetalle.creador.nick ?? retoDetalle.creador.nombre}</div>
                    {retoDetalle.mensaje && (
                      <div style={{ fontSize: '12px', color: '#374151', marginTop: '6px', fontStyle: 'italic', borderLeft: '2px solid #e5e7eb', paddingLeft: '8px' }}>
                        "{retoDetalle.mensaje}"
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ background: 'white', borderRadius: '12px', padding: '14px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: TEXT_MUTED }}>Contenido</span>
                  <span style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>{retoDetalle.tema ? `Tema ${retoDetalle.tema.numero}` : 'Oposición'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: TEXT_MUTED }}>Preguntas</span>
                  <span style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>{retoDetalle.preguntas?.length}</span>
                </div>
                
              </div>

              <div style={{ background: 'white', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                <DueloReto reto={retoDetalle} usuarioActual={usuario} mostrarBarraTiempo />
              </div>

              {ambosCompletados && !empate && !yoGane && !revanchaAbierta && (
                <button
                  onClick={() => setRevanchaAbierta(true)}
                  style={{ width: '100%', padding: '12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' }}
                >
                  🔥 Solicitar revancha
                </button>
              )}

              {revanchaAbierta && (
                <div style={{ background: 'white', borderRadius: '12px', padding: '12px', marginBottom: '10px' }}>
                  <textarea
                    value={mensajeRevancha}
                    onChange={(e) => setMensajeRevancha(e.target.value)}
                    placeholder="Escribe un mensaje para la revancha..."
                    maxLength={140}
                    style={{ width: '100%', minHeight: '50px', padding: '8px', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', marginBottom: '8px' }}
                  />
                  <button
                    onClick={() => enviarRevancha.mutate()}
                    disabled={enviarRevancha.isPending}
                    style={{ width: '100%', padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {enviarRevancha.isPending ? 'Enviando...' : 'Enviar revancha'}
                  </button>
                </div>
              )}

              {retoDetalle.estado === 'expirado' ? (
                <div style={{ textAlign: 'center', fontSize: '12px', color: TEXT_MUTED, padding: '10px' }}>
                  Este reto caducó sin completarse por ambos participantes
                </div>
              ) : !miParticipacion?.completado ? (
                <button
                  onClick={() => router.push(`/app/retos/${retoPreview}?directo=true`)}
                  style={{ width: '100%', padding: '13px', background: '#111827', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Empezar reto
                </button>
              ) : !ambosCompletados ? (
                <div style={{ textAlign: 'center', fontSize: '12px', color: TEXT_MUTED, padding: '10px' }}>
                  Esperando a que tu rival complete el reto
                </div>
              ) : null}

            </div>
          </div>
        );
      })()}

      {confirmacion && (
      <div
        onClick={() => { setConfirmacion(null); setErrorAccion(null); }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: '1rem' }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ background: BG_APP, borderRadius: '20px', padding: '1.5rem', width: '100%', maxWidth: '340px', textAlign: 'center' }}
        >
          {errorAccion ? (
            <>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚠️</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT_PRIMARY, marginBottom: '6px' }}>
                No se puede completar
              </div>
              <div style={{ fontSize: '13px', color: TEXT_SECONDARY, marginBottom: '18px' }}>
                {errorAccion}
              </div>
              <button
                onClick={() => { setConfirmacion(null); setErrorAccion(null); }}
                style={{ width: '100%', padding: '12px', background: '#111827', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                Entendido
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>{confirmacion.accion === 'cancelar' ? '🚫' : '👋'}</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT_PRIMARY, marginBottom: '6px' }}>
                {confirmacion.accion === 'cancelar' ? '¿Cancelar este reto?' : '¿Rechazar este reto?'}
              </div>
              <div style={{ fontSize: '13px', color: TEXT_SECONDARY, marginBottom: '18px' }}>
                Esta acción no se puede deshacer
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setConfirmacion(null)}
                  style={{ flex: 1, padding: '12px', background: 'white', color: TEXT_SECONDARY, border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Volver
                </button>
                <button
                  onClick={ejecutarAccion}
                  style={{ flex: 1, padding: '12px', background: '#111827', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {confirmacion.accion === 'cancelar' ? 'Cancelar reto' : 'Rechazar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}

      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} activo="retos" />

    </div>
  );
}

function AvatarUsuario({ persona, size = 64 }: { persona: any; size?: number }) {
  if (persona?.tipoAvatar === 'foto' && persona?.avatarUrl) {
    return (
      <img
        src={persona.avatarUrl}
        alt=""
        style={{ width: size, height: size, objectFit: 'cover', borderRadius: '50%' }}
      />
    );
  }

  if (persona?.tipoAvatar === 'oplo' || !persona?.tipoAvatar) {
    return (
      <img
        src={`/oplo/oplo-${persona?.nivel ?? 1}.jpg`}
        alt=""
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: '50%', background: '#EFE9E0' }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: '#EFE9E0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 700, color: TEXT_PRIMARY,
    }}>
      {(persona?.nick ?? persona?.nombre ?? '?')[0].toUpperCase()}
    </div>
  );
}

function colorPorTiempoRestante(fechaFin: string, fechaInicio: string): string {
  const total = new Date(fechaFin).getTime() - new Date(fechaInicio).getTime();
  const restante = new Date(fechaFin).getTime() - Date.now();
  const pct = Math.max(0, Math.min(100, (restante / total) * 100));
  if (pct > 50) return '#1F7CFF'; // azul — tiempo de sobra
  if (pct > 20) return '#D97706'; // ámbar — se acerca
  return '#DC2626'; // rojo — poco tiempo
}

export function DueloReto({ reto, usuarioActual, mostrarBarraTiempo = false }: any) {
  const participaciones = reto.participaciones ?? [];
  const yo = participaciones.find((p: any) => p.usuario?.id === usuarioActual?.id);
  const rival = participaciones.find((p: any) => p.usuario?.id !== usuarioActual?.id);

  const ambosCompletados = yo?.completado && rival?.completado;
  const empate = ambosCompletados && yo.porcentaje === rival.porcentaje && yo.tiempoSegundos === rival.tiempoSegundos;
  const yoGano = ambosCompletados && !empate && (
    yo.porcentaje > rival.porcentaje || (yo.porcentaje === rival.porcentaje && yo.tiempoSegundos < rival.tiempoSegundos)
  );

  const yoSoyCreador = reto.creador?.id === usuarioActual?.id;
  const yoCompletado = yo?.completado;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>

        {/* Columna YO */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
          <div style={{
            position: 'relative', width: '64px', height: '64px', borderRadius: '50%',
            border: (ambosCompletados && yoGano) ? '3px solid #D97706' : '3px solid transparent',
            boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AvatarUsuario persona={yo?.usuario} size={56} />
            {ambosCompletados && !empate && yoGano && (
              <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '18px' }}>🏆</div>
            )}
            {empate && (
              <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '18px' }}>🤝</div>
            )}
            {!yoSoyCreador && !ambosCompletados && (
              <div style={{ position: 'absolute', top: '-4px', left: '-4px', fontSize: '14px' }}>🎯</div>
            )}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT_PRIMARY }}>
            {yo?.usuario?.nick ?? yo?.usuario?.nombre ?? 'Tú'} (tú)
          </div>
          <div style={{ fontSize: '17px', fontWeight: 800, color: (ambosCompletados && yoGano) ? '#D97706' : TEXT_PRIMARY }}>
            {yo?.completado ? `${yo.porcentaje}%` : <span style={{ fontSize: '12px', color: TEXT_MUTED, fontWeight: 500 }}>Pendiente</span>}
          </div>

        </div>

        <div style={{ display: 'flex', alignItems: 'center', height: '64px', fontSize: '13px', color: TEXT_MUTED, fontWeight: 700 }}>
          VS
        </div>

        {/* Columna RIVAL */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
          <div style={{
            position: 'relative', width: '64px', height: '64px', borderRadius: '50%',
            border: (ambosCompletados && !yoGano && !empate) ? '3px solid #D97706' : '3px solid transparent',
            boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AvatarUsuario persona={rival?.usuario} size={56} />
            {ambosCompletados && !empate && !yoGano && (
              <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '18px' }}>🏆</div>
            )}
            {empate && (
              <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '18px' }}>🤝</div>
            )}
            {!yoSoyCreador && !ambosCompletados && ( // ⭐ nuevo: icono de retador
              <div style={{ position: 'absolute', top: '-4px', left: '-4px', fontSize: '14px' }}>⚡</div>
            )}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT_PRIMARY }}>
            {rival?.usuario?.nick ?? rival?.usuario?.nombre ?? 'Rival'}
          </div>
          <div style={{ fontSize: '17px', fontWeight: 800, color: (ambosCompletados && !yoGano && !empate) ? '#D97706' : TEXT_PRIMARY }}>
            {!rival?.completado ? (
              <span style={{ fontSize: '12px', color: TEXT_MUTED, fontWeight: 500 }}>Pendiente</span>
            ) : yoCompletado ? (
              `${rival.porcentaje}%`
            ) : (
              <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>Hecho</span>
            )}
          </div>
        </div>
      </div>

      {mostrarBarraTiempo && !ambosCompletados && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ height: '5px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.max(0, Math.min(100, ((new Date(reto.fechaFin).getTime() - Date.now()) / (new Date(reto.fechaFin).getTime() - new Date(reto.creadoEn).getTime())) * 100))}%`,
              height: '100%',
              background: colorPorTiempoRestante(reto.fechaFin, reto.creadoEn),
              borderRadius: '999px', transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ fontSize: '10px', color: TEXT_MUTED, marginTop: '4px', textAlign: 'center' }}>
            {tiempoRestante(reto.fechaFin)}
          </div>
        </div>
      )}
    </div>
  );
}

function WidgetHistorialRetos({ retosCompletados, usuario, onVer }: any) {
  const [expandido, setExpandido] = useState(false);
  const aMostrar = expandido ? retosCompletados : retosCompletados.slice(0, 1);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {expandido ? 'Historial' : 'Último resultado'}
        </span>
        <button
          onClick={() => setExpandido(!expandido)}
          style={{ fontSize: '11px', color: '#111827', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {expandido ? 'Ver menos' : 'Ver historial'}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {aMostrar.map((p: any) => {
          const expirado = p.reto.estado === 'expirado';
          const rival = p.reto.creador?.id === usuario?.id
            ? p.reto.participaciones?.find((x: any) => x.usuario?.id !== usuario?.id)?.usuario
            : p.reto.creador;
          const rivalParticipacion = p.reto.participaciones?.find((x: any) => x.usuario?.id !== usuario?.id);
          const gane = p.posicion === 1;

          return (
            <div
              key={p.id}
              onClick={() => onVer(p.reto.id)}
              style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', minHeight: '68px', boxSizing: 'border-box' }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: expirado ? '#F4F5F7' : gane ? '#f0fdf4' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '17px' }}>{expirado ? '⏱️' : gane ? '🏆' : '😤'}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY }}>
                  {expirado ? 'Cancelado por tiempo' : gane ? 'Victoria' : 'Derrota'} vs {rival?.nick ?? rival?.nombre ?? 'Usuario'}
                </div>
                <div style={{ fontSize: '12px', color: TEXT_MUTED, marginTop: '2px' }}>
                  {expirado ? 'El plazo terminó antes de completarse' : `${p.porcentaje}% — ${rivalParticipacion?.porcentaje ?? '?'}%`}
                </div>
              </div>
              <ChevronRight size={16} color="#D1D5DB" style={{ flexShrink: 0 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}