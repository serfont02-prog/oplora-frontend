'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, ChevronRight, Brain, Lock, Swords } from 'lucide-react';
import { FooterNavegacion } from '@/app/app/dashboard/page';
import { FireIcon } from '@heroicons/react/24/outline';
import { AvatarPerfil } from '@/components/AvatarUsuarioPerfil';
import { getOploUrl } from '@/lib/oplo';


type TipoRetoUsuario = 'oposicion' | 'normativa' | 'tema';
type CategoriaReto = 'test' | 'fc' | 'psico';

import {
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  COLOR_RETOS,
  COLOR_RETOS_BG,
  COLOR_FC,
  COLOR_FC_BG,
  COLOR_PSICO,
  COLOR_PSICO_BG,
  COLOR_SEMANAL,
  COLOR_SEMANAL_BG,
} from '@/styles/tokens';

const BG_APP = '#FCEEE8';

// ⭐ Normaliza un RetoFC (duelo de flashcards, estructura propia con retador/retado/resultados)
// a la misma forma "participación" que ya usan las derivaciones y los widgets de retos de Test
// (reto.participaciones / reto.creador / p.completado / p.posicion / p.porcentaje), para poder
// mezclarlos, ordenarlos y renderizarlos con los mismos componentes (DueloReto, WidgetHistorialRetos).
function normalizarRetoFC(r: any, usuarioActualId: string | undefined) {
  const personas = [r.retador, r.retado].filter(Boolean);
  const totalFC = Array.isArray(r.flashcards) ? r.flashcards.length : 0;

  const participaciones = personas.map((u: any) => {
    const res = (r.resultados ?? []).find((x: any) => x.usuario?.id === u.id);
    const total = res ? res.aciertos + res.fallos : 0;
    const porcentaje = res && total > 0 ? Math.round((res.aciertos / total) * 100) : (res?.completado ? 0 : null);
    return {
      id: `${r.id}-${u.id}`,
      usuario: u,
      completado: !!res?.completado,
      posicion: res?.posicion ?? null,
      porcentaje,
    };
  });

  const retoNormalizado = {
    id: r.id,
    tipo: 'usuario',
    estado: r.estado,
    fechaFin: r.fechaFin,
    creadoEn: r.creadoEn,
    creador: r.retador,
    mensaje: r.mensaje,
    tema: r.tema,
    oposicion: r.oposicion,
    participaciones,
    flashcards: r.flashcards,
    totalFC,
    _esFC: true,
  };

  const miParticipacion = participaciones.find((p: any) => p.usuario?.id === usuarioActualId);

  return {
    id: `${r.id}-p`,
    reto: retoNormalizado,
    completado: !!miParticipacion?.completado,
    posicion: miParticipacion?.posicion ?? null,
    porcentaje: miParticipacion?.porcentaje ?? null,
  };
}


// ⭐ Espejo de normalizarRetoFC, pero para RetoPsicotecnico (duelo 1v1 de
// preguntas psicotécnicas congeladas en `preguntas`, con `resultados` en vez
// de `participaciones`). Se normaliza a la misma forma "participación" para
// poder mezclarse y renderizarse con los mismos componentes DueloReto /
// WidgetHistorialRetos que ya usan Test y FC.
function normalizarRetoPsico(r: any, usuarioActualId: string | undefined) {
  const personas = [r.retador, r.retado].filter(Boolean);
  const totalPreguntas = Array.isArray(r.preguntas) ? r.preguntas.length : 0;

  const participaciones = personas.map((u: any) => {
    const res = (r.resultados ?? []).find((x: any) => x.usuario?.id === u.id);
    const total = res ? res.aciertos + res.fallos : 0;
    const porcentaje = res && total > 0 ? Math.round((res.aciertos / total) * 100) : (res?.completado ? 0 : null);
    return {
      id: `${r.id}-${u.id}`,
      usuario: u,
      completado: !!res?.completado,
      posicion: res?.posicion ?? null,
      porcentaje,
    };
  });

  const retoNormalizado = {
    id: r.id,
    tipo: 'usuario',
    estado: r.estado,
    fechaFin: r.fechaFin,
    creadoEn: r.creadoEn,
    creador: r.retador,
    mensaje: r.mensaje,
    oposicion: r.oposicion,
    participaciones,
    preguntas: r.preguntas,
    tipoPsico: r.tipo,
    totalPreguntas,
    _esPsico: true,
  };

  const miParticipacion = participaciones.find((p: any) => p.usuario?.id === usuarioActualId);

  return {
    id: `${r.id}-p`,
    reto: retoNormalizado,
    completado: !!miParticipacion?.completado,
    posicion: miParticipacion?.posicion ?? null,
    porcentaje: miParticipacion?.porcentaje ?? null,
  };
}

// ⭐ Un reto está caducado si el backend ya lo marcó 'expirado' O si su plazo ya pasó y no
// llegó a completarse. Así Historial no depende de que el backend (cron/consulta) haya
// actualizado el estado antes de que el frontend pinte la lista.
function retoCaducado(reto: any): boolean {
  if (!reto) return false;
  if (reto.estado === 'expirado') return true;
  if (reto.estado === 'completado') return false;
  return !!reto.fechaFin && new Date(reto.fechaFin).getTime() < Date.now();
}

function tiempoRestante(fechaFin: string): string {
  const restante = new Date(fechaFin).getTime() - Date.now();
  if (restante <= 0) return 'Caducado';
  const horas = Math.floor(restante / (1000 * 60 * 60));
  if (horas < 1) return `${Math.floor(restante / (1000 * 60))} min restantes`;
  if (horas < 24) return `${horas}h restantes`;
  return `${Math.floor(horas / 24)}d restantes`;
}

// ⭐ Texto descriptivo unificado para todos los retos (sistema y duelos):
// "{Tipo} · {Tema N|Oposición} · {N preguntas|tarjetas}". Un único sitio para que
// diario, semanal, en curso e historial no vuelvan a divergir en redacción.
function descripcionReto(reto: any): string {
  const esFC = !!reto?._esFC;
  const esPsico = !!reto?._esPsico;
  const tipo = esFC ? 'Flashcards' : esPsico ? 'Psicotécnico' : 'Test';
  const n = esFC ? reto?.totalFC : esPsico ? reto?.totalPreguntas : reto?.preguntas?.length;
  const cantidad = n != null ? `${n} ${esFC ? 'tarjetas' : 'preguntas'}` : null;
  const modalidadPsico = reto?.tipoPsico
    ? String(reto.tipoPsico).replace(/_/g, ' ').replace(/^./, (c: string) => c.toUpperCase())
    : null;
  const ambito = esPsico
    ? modalidadPsico
    : (reto?.tema?.titulo ? `Tema ${reto.tema.numero}` : 'Oposición');
  return [tipo, ambito, cantidad].filter(Boolean).join(' · ');
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
    categoria: 'test' as CategoriaReto,
    numPreguntas: 10,
    numFC: 10,
    numPsico: 10,
    psicoTipo: '' as string,
    tipoReto: 'oposicion' as TipoRetoUsuario,
    temaId: '',
    versionLeyId: '',
    mensaje: '',
    horasPlazo: 48,
  });
  const [error, setError] = useState('');

  // ⭐ Wizard "Nuevo reto": un paso a pantalla completa por vez, en vez del
  // acordeón anterior. El orden es fijo para las 3 categorías (test/fc/psico);
  // lo que cambia es el contenido de "sobre-que-va" y "ajustes" según form.categoria.
  const PASOS = ['retado', 'tipo', 'sobre-que-va', 'ajustes', 'resumen'] as const;
  type PasoWizard = typeof PASOS[number];
  const [paso, setPaso] = useState<PasoWizard>('retado');

const [validacion, setValidacion] = useState<any>(null);
const [validando, setValidando] = useState(false);
const [modalInvitar, setModalInvitar] = useState(false);
const [toast, setToast] = useState<string | null>(null);

const mostrarToast = (mensaje: string) => {
  setToast(mensaje);
  setTimeout(() => setToast(null), 2500);
};

const compartirInvitacion = async () => {
  const url = `https://oplora.app/app/registro?ref=${usuario?.nick ?? ''}`;
  const texto = `¡Te reto a superarme en OPLORA! Únete y prepara tu oposición conmigo 💪`;

  if (navigator.share) {
    await navigator.share({ title: 'OPLORA', text: texto, url });
  } else {
    await navigator.clipboard.writeText(`${texto} ${url}`);
    mostrarToast('Enlace copiado al portapapeles');
  }
  setModalInvitar(false);
};
const puedeEnviar = validacion?.encontrado && !validacion?.error && validacion?.mismaOposicion && validacion?.mismaConvocatoria;
const oposicionId = usuario?.oposicionActiva?.id;

  useEffect(() => {
  if (!form.retadoNickOEmail || form.retadoNickOEmail.length < 2) {
    setValidacion(null);
    return;
  }

  setValidando(true);
  const timeout = setTimeout(async () => {
    try {
      const res = await api.get('/retos/validar-destinatario', {
        params: { nickOEmail: form.retadoNickOEmail, oposicionId },
      });
      setValidacion(res.data);
    } catch {
      setValidacion(null);
    } finally {
      setValidando(false);
    }
  }, 500); // 500ms de debounce

  return () => clearTimeout(timeout);
}, [form.retadoNickOEmail, oposicionId]);

  useEffect(() => {
    if (!cargando && !usuario) router.push('/app/login');
  }, [usuario, cargando, router]);

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

  const { data: misRetosFC = [] } = useQuery({
    queryKey: ['mis-retos-fc'],
    queryFn: async () => {
      const res = await api.get('/flashcards/mis-retos');
      return res.data;
    },
    enabled: !!usuario,
  });

  const { data: misRetosPsico = [] } = useQuery({
    queryKey: ['mis-retos-psico'],
    queryFn: async () => {
      const res = await api.get('/psicotecnicos/mis-retos');
      return res.data;
    },
    enabled: !!usuario,
  });

  // Config efectiva de psicotécnicos para la oposición/convocatoria activa —
  // mismo endpoint y forma que usa EntrenamientoHub para decidir si mostrar
  // la acción "Psicotécnicos" (array vacío = tienePsicotecnicos===false o sin
  // tipos habilitados para esta convocatoria).
  const { data: configPsicotecnicos = [] } = useQuery({
    queryKey: ['psicotecnicos-config', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/psicotecnicos/config/${oposicionId}`);
      return res.data;
    },
    enabled: !!oposicionId && modalAbierto,
  });

  const psicoDisponible = configPsicotecnicos.length > 0;

  // Pre-flight de disponibilidad para el tipo psicotécnico elegido — mismo
  // "avisar pero no bloquear" que ya usa Test para tema/ley.
  const { data: psicoDisponibles } = useQuery({
    queryKey: ['psicotecnicos-disponibles', oposicionId, form.psicoTipo],
    queryFn: async () => {
      const res = await api.get(`/psicotecnicos/disponibles/${oposicionId}`, {
        params: { tipo: form.psicoTipo },
      });
      return res.data;
    },
    enabled: !!oposicionId && !!form.psicoTipo && form.categoria === 'psico' && modalAbierto,
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

  const formInicial = {
    retadoNickOEmail: '',
    categoria: 'test' as CategoriaReto,
    numPreguntas: 10,
    numFC: 10,
    numPsico: 10,
    psicoTipo: '',
    tipoReto: 'oposicion' as TipoRetoUsuario,
    temaId: '',
    versionLeyId: '',
    mensaje: '',
    horasPlazo: 48,
  };

  const crearReto = useMutation({
    mutationFn: async () => {
      if (form.categoria === 'psico') {
        const res = await api.post('/psicotecnicos/duelo', {
          retadoNickOEmail: form.retadoNickOEmail,
          oposicionId,
          tipo: form.psicoTipo,
          numPreguntas: form.numPsico,
          convocatoriaId: convocatoriaReto?.id,
          mensaje: form.mensaje || undefined,
          horasPlazo: form.horasPlazo,
        });
        return { ...res.data, _esPsico: true };
      }
      if (form.categoria === 'fc') {
        const body: any = {
          retadoNickOEmail: form.retadoNickOEmail,
          oposicionId,
          numFC: form.numFC,
          mensaje: form.mensaje || undefined,
          horasPlazo: form.horasPlazo,
        };
        if (form.tipoReto === 'tema' && form.temaId) body.temaId = form.temaId;
        if (form.tipoReto === 'normativa' && form.versionLeyId) body.versionLeyId = form.versionLeyId;
        const res = await api.post('/flashcards/duelo', body);
        return { ...res.data, _esFC: true };
      }
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
      queryClient.invalidateQueries({ queryKey: ['mis-retos-fc'] });
      queryClient.invalidateQueries({ queryKey: ['mis-retos-psico'] });
      queryClient.invalidateQueries({ queryKey: ['contactos-recientes'] });
      setModalAbierto(false);
      setForm(formInicial);
      setError('');
      setPaso('retado');
      setRetoRecienCreado(data._esPsico ? `psico:${data.id}` : data._esFC ? `fc:${data.id}` : data.id);
    },
    onError: (e: any) => {
      setError(e?.response?.data?.message ?? 'Error creando el reto');
    },
  });

  const eliminarReto = useMutation({
    // ⭐ Cancelar/rechazar funciona igual para los tres tipos de reto; solo cambia el endpoint.
    mutationFn: async (reto: any) => {
      const ruta = reto._esFC ? `/flashcards/duelo/${reto.id}` : reto._esPsico ? `/psicotecnicos/duelo/${reto.id}` : `/retos/${reto.id}`;
      await api.delete(ruta);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-retos'] });
      queryClient.invalidateQueries({ queryKey: ['mis-retos-fc'] });
      queryClient.invalidateQueries({ queryKey: ['mis-retos-psico'] });
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

      const [confirmacion, setConfirmacion] = useState<{ reto: any; accion: 'cancelar' | 'rechazar' } | null>(null);
    const [errorAccion, setErrorAccion] = useState<string | null>(null);

    const confirmarAccion = (reto: any, accion: 'cancelar' | 'rechazar') => {
      setConfirmacion({ reto, accion });
      setErrorAccion(null);
    };

    const ejecutarAccion = () => {
      if (!confirmacion) return;
      eliminarReto.mutate(confirmacion.reto, {
        onSuccess: () => {
          setConfirmacion(null);
        },
        onError: (e: any) => {
          setErrorAccion(e?.response?.data?.message ?? 'No se pudo completar la acción');
        },
      });
    };

 const misRetosFCNormalizados = misRetosFC.map((r: any) => normalizarRetoFC(r, (usuario as any)?.id));
 const misRetosPsicoNormalizados = misRetosPsico.map((r: any) => normalizarRetoPsico(r, (usuario as any)?.id));
 const misRetosTodos = [...misRetos, ...misRetosFCNormalizados, ...misRetosPsicoNormalizados];

 const retosUsuarioPendientes = misRetosTodos.filter(
  (p: any) => p.reto?.tipo === 'usuario'
    && !retoCaducado(p.reto)
    && (!p.completado || p.posicion === null)
  );
  const retosUsuarioCompletados = misRetosTodos.filter(
    (p: any) => p.reto?.tipo === 'usuario' && p.completado && p.posicion !== null && !retoCaducado(p.reto)
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
    && (form.categoria !== 'psico' || !!form.psicoTipo)
    && (form.categoria === 'psico' || form.tipoReto !== 'normativa' || form.versionLeyId)
    && (form.categoria === 'psico' || form.tipoReto !== 'tema' || form.temaId);

  // ⭐ Validación por paso del wizard: gatea el botón "Continuar" con las
  // mismas reglas que ya existían para el envío final (puedeEnviar / los
  // selects obligatorios de tema-ley), solo que repartidas por paso.
  const pasoValido = (() => {
    if (paso === 'retado') return !!puedeEnviar;
    if (paso === 'tipo') return true;
    if (paso === 'sobre-que-va') {
      if (form.categoria === 'psico') return !!form.psicoTipo;
      return (form.tipoReto !== 'normativa' || !!form.versionLeyId) && (form.tipoReto !== 'tema' || !!form.temaId);
    }
    if (paso === 'ajustes') return true;
    return !!puedeEnviar; // resumen
  })();

  const colorPasoActivo = form.categoria === 'fc' ? COLOR_FC : form.categoria === 'psico' ? COLOR_PSICO : COLOR_RETOS;

  const { data: estadisticas } = useQuery({
    queryKey: ['estadisticas-retos'],
    queryFn: async () => {
      const res = await api.get('/retos/estadisticas');
      return res.data;
    },
    enabled: !!usuario,
  });

  if (cargando) return null;


    const retosExpirados = misRetosTodos.filter(
      (p: any) => p.reto?.tipo === 'usuario' && retoCaducado(p.reto)
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
                background: 'white', border: '1px solid #F1F5F9', borderLeft: `4px solid ${COLOR_RETOS}`,
                borderRadius: '14px',
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
                  {retoDiario?.preguntas?.length ?? '—'} preguntas · Nivel {usuario?.oposicionActiva?.nivel ?? 1} · Cierra hoy
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
                background: 'white', border: '1px solid #F1F5F9', borderLeft: `4px solid ${COLOR_SEMANAL}`,
                borderRadius: '14px',
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                cursor: 'pointer', minHeight: '68px', boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: COLOR_SEMANAL_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '16px' }}>🏆</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Reto semanal
                </div>
                <div style={{ fontSize: '11px', color: TEXT_MUTED, marginTop: '2px' }}>
                  {retoSemanal?.preguntas?.length ?? '—'} preguntas{retoSemanal?.tema?.titulo ? ` · Tema ${retoSemanal.tema.numero}` : ''} · Cierra el domingo
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
          onClick={() => { setModalAbierto(true); setPaso('retado'); }}
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

  if (retosEnCurso.length === 0) return null;

  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
        Retos en curso · {retosEnCurso.length}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {retosEnCurso.map((p: any) => {
          const esCreador = p.reto.creador?.id === (usuario as any)?.id;
          const esFC = !!p.reto._esFC;
          const esPsico = !!p.reto._esPsico;
          const colorCategoria = esPsico ? COLOR_PSICO : esFC ? COLOR_FC : COLOR_RETOS;
          return (
            <div key={p.id} style={{ background: 'white', border: '1px solid #F1F5F9', borderLeft: `4px solid ${colorCategoria}`, borderRadius: '14px', padding: '10px 12px', boxSizing: 'border-box' }}>
              <div
                onClick={() => esFC ? router.push(`/app/retos/fc/${p.reto.id}`) : esPsico ? router.push(`/app/retos/psico/${p.reto.id}`) : setRetoPreview(p.reto.id)}
                style={{ cursor: 'pointer' }}
              >
                <DueloReto reto={p.reto} usuarioActual={usuario} mostrarBarraTiempo tipo={esFC ? 'fc' : esPsico ? 'psico' : 'test'} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '11px', color: TEXT_MUTED }}>
                  {descripcionReto(p.reto)}
                </span>
                {(
                  <button
                    onClick={(e) => { e.stopPropagation(); confirmarAccion(p.reto, esCreador ? 'cancelar' : 'rechazar'); }}
                    style={{ background: 'white', border: '1px solid #FECACA', borderRadius: '999px', padding: '5px 12px', cursor: 'pointer', color: '#B91C1C', fontSize: '12px', fontWeight: 600, flexShrink: 0, lineHeight: 1 }}
                  >
                    {esCreador ? 'Cancelar' : 'Rechazar'}
                  </button>
                )}
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
            onVer={(p: any) => p.reto?._esFC ? router.push(`/app/retos/fc/${p.reto.id}`) : p.reto?._esPsico ? router.push(`/app/retos/psico/${p.reto.id}`) : setRetoPreview(p.reto.id)}
          />
        )}

      </div>

      {/* Modal crear reto — wizard paso a paso, pantalla completa por paso */}
      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ background: BG_APP, borderRadius: '20px', width: '100%', maxWidth: '400px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            <style>{`@keyframes oplora-paso-in { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }`}</style>

            {/* Header: volver + título + cerrar + barra de progreso */}
            <div style={{ padding: '1.5rem 1.5rem 0.9rem', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
                {paso !== 'retado' ? (
                  <button
                    onClick={() => setPaso(PASOS[PASOS.indexOf(paso) - 1])}
                    style={{ background: 'white', border: 'none', borderRadius: '10px', width: '32px', height: '32px', fontSize: '15px', cursor: 'pointer', color: TEXT_PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ←
                  </button>
                ) : (
                  <div style={{ width: '32px' }} />
                )}
                <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT_PRIMARY }}>Enviar reto</div>
                <button
                  onClick={() => { setModalAbierto(false); setError(''); setPaso('retado'); }}
                  style={{ background: 'white', border: 'none', borderRadius: '10px', width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer', color: TEXT_MUTED }}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {PASOS.map((p, i) => (
                  <div
                    key={p}
                    style={{
                      flex: 1, height: '4px', borderRadius: '999px',
                      background: i <= PASOS.indexOf(paso) ? colorPasoActivo : '#E5E7EB',
                      transition: 'background 0.25s ease',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Body: solo el contenido del paso actual, con transición horizontal suave */}
            <div style={{ padding: '0.25rem 1.5rem 1.25rem', overflowY: 'auto', flex: 1 }}>
              <div
                key={paso}
                style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'oplora-paso-in 0.22s ease' }}
              >

              {paso === 'retado' && (
              <>
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
                {validando && (
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>Comprobando...</div>
                )}

              {!validando && validacion && (
                <div style={{ marginTop: '6px' }}>
                  {!validacion.encontrado && (
                    <div style={{ fontSize: '12px', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span>😕 No hemos encontrado a ese usuario</span>
                      <button
                        onClick={() => setModalInvitar(true)}
                        style={{ fontSize: '12px', color: '#1F7CFF', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', flexShrink: 0 }}
                      >
                        Invitar
                      </button>
                    </div>
                  )}
                  {validacion.encontrado && validacion.error && (
                    <div style={{ fontSize: '12px', color: '#dc2626' }}>⚠ {validacion.error}</div>
                  )}
                  {validacion.encontrado && !validacion.error && !validacion.mismaOposicion && (
                    <div style={{ fontSize: '12px', color: '#dc2626' }}>⚠ {validacion.nombre} no está preparando esta oposición</div>
                  )}
                  {validacion.encontrado && !validacion.error && validacion.mismaOposicion && !validacion.mismaConvocatoria && (
                    <div style={{ fontSize: '12px', color: '#dc2626' }}>⚠ {validacion.nombre} está en otra convocatoria</div>
                  )}
                  {validacion.encontrado && !validacion.error && validacion.mismaOposicion && validacion.mismaConvocatoria && (
                    <div style={{ fontSize: '12px', color: '#15803d' }}>✓ {validacion.nombre} — listo para retar</div>
                  )}
                </div>
              )}
              </div>
              </>
              )}

              {paso === 'tipo' && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT_SECONDARY, marginBottom: '8px' }}>Tipo de reto</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { key: 'test', icon: '📝', label: 'Test' },
                    { key: 'fc', icon: '🃏', label: 'Flashcards' },
                    { key: 'psico', icon: '🧠', label: 'Psicotécnicos' },
                  ].map(({ key, icon, label }) => {
                    const bloqueadoPsico = key === 'psico' && !psicoDisponible;
                    return (
                    <button
                      key={key}
                      onClick={() => { if (bloqueadoPsico) return; setForm({ ...form, categoria: key as CategoriaReto, psicoTipo: '' }); }}
                      disabled={bloqueadoPsico}
                      style={{
                        flex: 1, padding: '10px 6px', borderRadius: '12px', cursor: bloqueadoPsico ? 'not-allowed' : 'pointer', textAlign: 'center',
                        border: form.categoria === key ? `2px solid ${key === 'fc' ? COLOR_FC : key === 'psico' ? COLOR_PSICO : '#111827'}` : 'none',
                        background: 'white',
                        opacity: bloqueadoPsico ? 0.45 : 1,
                      }}
                    >
                      <div style={{ fontSize: '16px', marginBottom: '3px' }}>{bloqueadoPsico ? <Lock size={16} color="#9ca3af" style={{ display: 'inline' }} /> : icon}</div>
                      <div style={{ fontSize: '11px', fontWeight: 500, color: TEXT_PRIMARY }}>{label}</div>
                      {bloqueadoPsico && (
                        <div style={{ fontSize: '9px', color: TEXT_MUTED, marginTop: '2px' }}>No disponible</div>
                      )}
                    </button>
                    );
                  })}
                </div>
              </div>
              )}

              {paso === 'sobre-que-va' && (
              <>
              {form.categoria === 'psico' && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT_SECONDARY, marginBottom: '8px' }}>Modalidad</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {configPsicotecnicos.map((m: any) => (
                      <button
                        key={m.tipo}
                        onClick={() => setForm({ ...form, psicoTipo: m.tipo })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                          border: form.psicoTipo === m.tipo ? `2px solid ${COLOR_PSICO}` : 'none',
                          background: 'white',
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>{m.icono ?? '🧠'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT_PRIMARY }}>{m.nombre}</div>
                          {m.descripcion && (
                            <div style={{ fontSize: '10px', color: TEXT_MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.descripcion}</div>
                          )}
                        </div>
                        <div style={{
                          width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${form.psicoTipo === m.tipo ? COLOR_PSICO : '#d1d5db'}`,
                          background: form.psicoTipo === m.tipo ? COLOR_PSICO : 'white',
                        }} />
                      </button>
                    ))}
                  </div>
                  {form.psicoTipo && psicoDisponibles && psicoDisponibles.total < form.numPsico && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '8px 10px' }}>
                      ⚠ Solo hay {psicoDisponibles.total} preguntas disponibles para esta modalidad (pediste {form.numPsico}). El duelo se creará igualmente con las que haya.
                    </div>
                  )}
                </div>
              )}

              {form.categoria !== 'psico' && (
              <>
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
              </>
              )}
              </>
              )}

              {paso === 'ajustes' && (
              <>
              {form.categoria === 'psico' && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT_SECONDARY, marginBottom: '8px' }}>Número de preguntas</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[5, 10, 20].map((n) => (
                      <button
                        key={n}
                        onClick={() => setForm({ ...form, numPsico: n })}
                        style={{ flex: 1, padding: '9px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', background: form.numPsico === n ? COLOR_PSICO : 'white', color: form.numPsico === n ? 'white' : '#6b7280' }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.categoria === 'fc' && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT_SECONDARY, marginBottom: '8px' }}>Número de flashcards</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[5, 10, 20].map((n) => (
                      <button
                        key={n}
                        onClick={() => setForm({ ...form, numFC: n })}
                        style={{ flex: 1, padding: '9px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', background: form.numFC === n ? COLOR_FC : 'white', color: form.numFC === n ? 'white' : '#6b7280' }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.categoria === 'test' && (
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
              )}

              {(
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
              )}

              </>
              )}

              {paso === 'resumen' && (
              <>
              <div style={{ background: 'white', borderRadius: '12px', padding: '14px', fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.5 }}>
                Retas a {validacion?.nombre ?? form.retadoNickOEmail}
                {' · '}
                {form.categoria === 'psico'
                  ? (configPsicotecnicos.find((m: any) => m.tipo === form.psicoTipo)?.nombre ?? 'Psicotécnico')
                  : form.categoria === 'fc'
                  ? 'Flashcards'
                  : 'Test'}
                {' · '}
                {form.categoria === 'psico' ? form.numPsico : form.categoria === 'fc' ? form.numFC : form.numPreguntas}
                {' '}
                {form.categoria === 'fc' ? 'flashcards' : 'preguntas'}
                {` · ${form.horasPlazo}h`}
              </div>

              {(
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
              )}

              {error && (
                <div style={{ fontSize: '12px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '8px 12px' }}>
                  {error}
                </div>
              )}

              <div style={{ background: 'white', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: TEXT_SECONDARY }}>
                {form.categoria === 'psico'
                  ? `🧠 El retado jugará el mismo duelo de ${form.numPsico} preguntas psicotécnicas`
                  : form.categoria === 'fc'
                  ? `🃏 El retado jugará el mismo duelo de ${form.numFC} flashcards`
                  : `⏱ El retado tiene ${form.horasPlazo}h para completar el mismo test`}
              </div>
              </>
              )}

              </div>
            </div>

            {/* Footer: Continuar / Enviar reto, fijo */}
            <div style={{ padding: '0.85rem 1.5rem 1.25rem', flexShrink: 0, borderTop: '1px solid rgba(17,24,39,0.06)' }}>
              <button
                onClick={() => {
                  if (paso === 'resumen') { crearReto.mutate(); return; }
                  setPaso(PASOS[PASOS.indexOf(paso) + 1]);
                }}
                disabled={!pasoValido || (paso === 'resumen' && crearReto.isPending)}
                style={{
                  width: '100%', padding: '13px', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                  cursor: (!pasoValido || (paso === 'resumen' && crearReto.isPending)) ? 'not-allowed' : 'pointer',
                  background: '#111827', color: 'white',
                  opacity: (!pasoValido || (paso === 'resumen' && crearReto.isPending)) ? 0.5 : 1,
                }}
              >
                {paso === 'resumen' ? (crearReto.isPending ? 'Enviando...' : 'Enviar reto') : 'Continuar'}
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
              background: retoRecienCreado.startsWith('fc:') ? COLOR_FC_BG : retoRecienCreado.startsWith('psico:') ? COLOR_PSICO_BG : COLOR_RETOS_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <FireIcon style={{ width: 26, height: 26, color: retoRecienCreado.startsWith('fc:') ? COLOR_FC : retoRecienCreado.startsWith('psico:') ? COLOR_PSICO : COLOR_RETOS }} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: TEXT_PRIMARY, marginBottom: '6px' }}>
              ¡Reto enviado!
            </div>
            <div style={{ fontSize: '13px', color: TEXT_SECONDARY, marginBottom: '20px' }}>
              Tu rival ya puede aceptarlo y jugar
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => {
                  const esFC = retoRecienCreado.startsWith('fc:');
                  const esPsico = retoRecienCreado.startsWith('psico:');
                  const idReal = esFC || esPsico ? retoRecienCreado.slice(retoRecienCreado.indexOf(':') + 1) : retoRecienCreado;
                  const ruta = esFC ? `/app/retos/fc/${idReal}?directo=true` : esPsico ? `/app/retos/psico/${idReal}?directo=true` : `/app/retos/${idReal}?directo=true`;
                  router.push(ruta);
                }}
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

      {/* Modal INVITAR */}

      {modalInvitar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>😕</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
              No hemos encontrado a "{form.retadoNickOEmail}"
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '18px' }}>
              ¿Quieres invitarle a OPLORA para poder retarle?
            </div>
            <button
              onClick={compartirInvitacion}
              style={{ width: '100%', padding: '12px', background: '#111827', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginBottom: '8px' }}
            >
              Compartir invitación
            </button>
            <button
              onClick={() => setModalInvitar(false)}
              style={{ width: '100%', padding: '12px', background: 'white', color: '#6b7280', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal preview / resultado */}
      {retoPreview && retoDetalle && (() => {
        const miParticipacion = retoDetalle.participaciones?.find((p: any) => p.usuario?.id === (usuario as any)?.id);
        const otraParticipacion = retoDetalle.participaciones?.find((p: any) => p.usuario?.id !== (usuario as any)?.id);
        // ⭐ El ganador/empate ya lo calcula y guarda el backend en `posicion`; no se recalcula
        // aquí a partir de porcentaje/tiempo para evitar que ambas lógicas puedan divergir.
        const ambosCompletados = miParticipacion?.completado && otraParticipacion?.completado;
        const empate = ambosCompletados && miParticipacion.posicion === otraParticipacion.posicion;
        const yoGane = ambosCompletados && !empate && miParticipacion.posicion === 1;

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

      {toast && (
        <div style={{
          position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)',
          background: '#111827', color: 'white', fontSize: '13px', fontWeight: 600,
          padding: '10px 18px', borderRadius: '999px', boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
          zIndex: 100, pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          {toast}
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
        src={getOploUrl(persona?.nivel ?? 1)}
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

export function DueloReto({ reto, usuarioActual, mostrarBarraTiempo = false, tipo = 'test' }: any) {
  const esFC = tipo === 'fc';
  const esPsico = tipo === 'psico';
  const colorGanador = esPsico ? COLOR_PSICO : esFC ? COLOR_FC : '#D97706';
  const participaciones = reto.participaciones ?? [];
  const yo = participaciones.find((p: any) => p.usuario?.id === usuarioActual?.id);
  const rival = participaciones.find((p: any) => p.usuario?.id !== usuarioActual?.id);

  // ⭐ Usamos la posición ya calculada por el backend (`posicion`) en vez de recomparar
  // porcentaje/tiempo aquí, para no duplicar (y poder desincronizar) la lógica de empate/victoria.
  const ambosCompletados = yo?.completado && rival?.completado;
  const empate = ambosCompletados && yo.posicion === rival.posicion;
  const yoGano = ambosCompletados && !empate && yo.posicion === 1;

  const yoSoyCreador = reto.creador?.id === usuarioActual?.id;
  const rivalEsCreador = reto.creador?.id === rival?.usuario?.id;
  const yoCompletado = yo?.completado;
  const iconoCategoria = esPsico ? '🧠' : esFC ? '🃏' : '🎯';
  const colorCategoriaBg = esPsico ? COLOR_PSICO_BG : esFC ? COLOR_FC_BG : COLOR_RETOS_BG;

  // ⭐ Diseño compacto: avatares pequeños en horizontal (avatar + nombre/estado a cada lado)
  // y la "línea de tiempo" en vertical entre los dos participantes, para que quepan más retos
  // en pantalla sin scroll.
  const mostrarTiempo = mostrarBarraTiempo && !ambosCompletados;
  const colorTiempo = colorPorTiempoRestante(reto.fechaFin, reto.creadoEn);
  const pctTiempo = Math.max(0, Math.min(100, ((new Date(reto.fechaFin).getTime() - Date.now()) / (new Date(reto.fechaFin).getTime() - new Date(reto.creadoEn).getTime())) * 100));
  const etiquetaTiempo = tiempoRestante(reto.fechaFin).replace(' restantes', '');

  const avatarCompacto = (persona: any, esCreadorDeEste: boolean, esGanador: boolean, esEmpate: boolean) => (
    <div style={{
      position: 'relative', width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
      border: esGanador ? `2px solid ${colorGanador}` : '2px solid transparent',
      boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <AvatarUsuario persona={persona} size={38} />
      {esGanador && <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', fontSize: '14px' }}>🏆</div>}
      {esEmpate && <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', fontSize: '14px' }}>🤝</div>}
      {esCreadorDeEste && (
        // ⭐ Identifica quién lanzó el reto: icono de espadas en la esquina de su avatar.
        <div style={{
          position: 'absolute', top: '-4px', left: '-4px', width: '16px', height: '16px',
          borderRadius: '50%', background: '#111827', border: '2px solid white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Swords size={9} color="white" />
        </div>
      )}
    </div>
  );

  const rivalGana = ambosCompletados && !yoGano && !empate;

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', gap: '8px' }}>

      {/* Lado YO: avatar + nombre + estado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
        {avatarCompacto(yo?.usuario, yoSoyCreador, !!(ambosCompletados && yoGano), !!empate)}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {yo?.usuario?.nick ?? yo?.usuario?.nombre ?? 'Tú'} <span style={{ color: TEXT_MUTED, fontWeight: 500 }}>(tú)</span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.2, color: (ambosCompletados && yoGano) ? colorGanador : TEXT_PRIMARY }}>
            {yo?.completado ? `${yo.porcentaje}%` : <span style={{ fontSize: '12px', color: TEXT_MUTED, fontWeight: 500 }}>Pendiente</span>}
          </div>
        </div>
      </div>

      {/* Centro: icono de categoría + línea de tiempo vertical */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', flexShrink: 0, width: '40px' }}>
        <div style={{
          width: '24px', height: '24px', borderRadius: '50%', background: colorCategoriaBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
        }}>
          {iconoCategoria}
        </div>
        {mostrarTiempo && (
          <>
            <div style={{ position: 'relative', width: '4px', height: '18px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, width: '100%', height: `${pctTiempo}%`,
                background: colorTiempo, borderRadius: '999px', transition: 'height 0.5s ease',
              }} />
            </div>
            <div style={{ fontSize: '9px', fontWeight: 600, color: colorTiempo, lineHeight: 1, whiteSpace: 'nowrap' }}>
              {etiquetaTiempo}
            </div>
          </>
        )}
      </div>

      {/* Lado RIVAL: nombre + estado + avatar (espejo) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', flex: 1, minWidth: 0 }}>
        <div style={{ minWidth: 0, textAlign: 'right' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {rival?.usuario?.nick ?? rival?.usuario?.nombre ?? 'Rival'}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.2, color: rivalGana ? colorGanador : TEXT_PRIMARY }}>
            {!rival?.completado ? (
              <span style={{ fontSize: '12px', color: TEXT_MUTED, fontWeight: 500 }}>Pendiente</span>
            ) : yoCompletado ? (
              `${rival.porcentaje}%`
            ) : (
              <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>Hecho</span>
            )}
          </div>
        </div>
        {avatarCompacto(rival?.usuario, rivalEsCreador, !!rivalGana, !!empate)}
      </div>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {aMostrar.map((p: any) => {
          const expirado = retoCaducado(p.reto);
          const rival = p.reto.creador?.id === usuario?.id
            ? p.reto.participaciones?.find((x: any) => x.usuario?.id !== usuario?.id)?.usuario
            : p.reto.creador;
          const rivalParticipacion = p.reto.participaciones?.find((x: any) => x.usuario?.id !== usuario?.id);
          // ⭐ Empate: ambos completaron y comparten posición.
          const empate = !expirado && !!rivalParticipacion?.completado && p.posicion != null && rivalParticipacion.posicion === p.posicion;
          const gane = !empate && p.posicion === 1;
          const esFC = !!p.reto._esFC;
          const esPsico = !!p.reto._esPsico;
          const colorCategoria = esPsico ? COLOR_PSICO : esFC ? COLOR_FC : COLOR_RETOS;

          return (
            <div
              key={p.id}
              onClick={() => onVer(p)}
              style={{ background: 'white', border: '1px solid #F1F5F9', borderLeft: expirado ? '1px solid #F1F5F9' : `4px solid ${colorCategoria}`, borderRadius: '14px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', minHeight: '52px', boxSizing: 'border-box' }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: expirado ? '#F4F5F7' : empate ? '#FEF3C7' : gane ? (esPsico ? COLOR_PSICO_BG : esFC ? COLOR_FC_BG : '#f0fdf4') : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {expirado ? <span style={{ fontSize: '17px' }}>⏱️</span> : esPsico ? <Brain size={17} color={gane || empate ? COLOR_PSICO : '#dc2626'} /> : <span style={{ fontSize: '17px' }}>{empate ? '🤝' : gane ? (esFC ? '🃏' : '🏆') : '😤'}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY }}>
                  {expirado ? 'Caducado' : empate ? 'Empate' : gane ? 'Victoria' : 'Derrota'} vs {rival?.nick ?? rival?.nombre ?? 'Usuario'}
                </div>
                <div style={{ fontSize: '12px', color: TEXT_MUTED, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {expirado ? 'Plazo terminado' : `${p.porcentaje}% — ${rivalParticipacion?.porcentaje ?? '?'}%`} · {descripcionReto(p.reto)}
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