'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, ChevronRight, ChevronLeft, ChevronDown, Brain, Lock, Swords, Shuffle, Loader2, ClipboardCheck, Layers, Landmark, Scale, BookOpen, Clock, Handshake, Crown, X, AlertTriangle, Check, UserX, Ban, RotateCcw, Hourglass } from 'lucide-react';
import { FooterNavegacion } from '@/components/ui/FooterNavegacion';
import { AvatarPerfil } from '@/components/AvatarUsuarioPerfil';
import { IconoModalidad } from '@/components/psicotecnicos/iconos';
import { ModalInvitar } from '@/components/invitar/FormInvitar';
import { getOploUrl } from '@/lib/oplo';
import TarjetaLiga from '@/components/liga/TarjetaLiga';
import { CopaEnAvatar } from '@/components/liga/ligaUtils';


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

const BG_APP = 'var(--c-bg-retos)';
const SOMBRA = 'var(--c-sombra)';
const COLOR_TEST = 'var(--hx-4d7c0f)';

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
// ⭐ Reto al azar: rival sorteado entre quienes aceptan retos de desconocidos en tu convocatoria.
const [rivalAzar, setRivalAzar] = useState<any>(null);
const [sorteando, setSorteando] = useState(false);
const [errorAzar, setErrorAzar] = useState('');
const [modalInvitar, setModalInvitar] = useState(false);
const [toast, setToast] = useState<string | null>(null);

const mostrarToast = (mensaje: string) => {
  setToast(mensaje);
  setTimeout(() => setToast(null), 2500);
};


const sortearRival = async () => {
  if (sorteando) return;
  setSorteando(true);
  setErrorAzar('');
  try {
    const res = await api.post('/retos/sortear-rival', { oposicionId: usuario?.oposicionActiva?.id });
    setRivalAzar(res.data);
    setForm((f) => ({ ...f, retadoNickOEmail: res.data.nick }));
  } catch (e: any) {
    const m = e?.response?.data?.message;
    setErrorAzar(Array.isArray(m) ? m[0] : m || 'No se ha podido buscar rival. Inténtalo de nuevo.');
  } finally {
    setSorteando(false);
  }
};

const quitarRivalAzar = () => {
  setRivalAzar(null);
  setErrorAzar('');
  setForm((f) => ({ ...f, retadoNickOEmail: '' }));
};

// Al cerrar el asistente se olvida el rival sorteado.
useEffect(() => {
  if (!modalAbierto) { setRivalAzar(null); setErrorAzar(''); }
}, [modalAbierto]);

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

  const { data: misRetos = [] } = useQuery({
    queryKey: ['mis-retos'],
    queryFn: async () => {
      const res = await api.get('/retos/mis-retos');
      return res.data;
    },
    enabled: !!usuario,
  });

  // ⭐ Desde el Inicio ("Retos · N por jugar") se llega con ?vista=pendientes: bajar a la lista
  useEffect(() => {
    let ir = false;
    try { ir = new URLSearchParams(window.location.search).get('vista') === 'pendientes'; } catch { /* sin query */ }
    if (!ir) return;
    const t = setTimeout(() => document.getElementById('retos-te-toca') ?? document.getElementById('retos-en-curso')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
    return () => clearTimeout(t);
  }, [misRetos]);

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
      queryClient.invalidateQueries({ queryKey: ['retos-pendientes'] });
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

  // ⭐ En curso se divide en lo que te toca jugar (lo importante) y lo que espera a tu rival.
  const porTiempo = (a: any, b: any) => new Date(a.reto.fechaFin).getTime() - new Date(b.reto.fechaFin).getTime();
  const teToca = retosUsuarioPendientes.filter((p: any) => !p.completado).sort(porTiempo);
  const esperandoRival = retosUsuarioPendientes.filter((p: any) => p.completado).sort(porTiempo);

  // ⭐ Estadísticas calculadas con los tres tipos de reto (antes solo contaban los de test, también
  // los antiguos retos diarios/semanales, y un empate contaba como victoria para los dos).
  const statsRetos = (() => {
    let victorias = 0, empates = 0, derrotas = 0;
    for (const p of retosUsuarioCompletados) {
      const rivalP = p.reto.participaciones?.find((x: any) => x.usuario?.id !== (usuario as any)?.id);
      if (!rivalP?.completado) continue;
      if (rivalP.posicion === p.posicion) empates++;
      else if (p.posicion === 1) victorias++;
      else derrotas++;
    }
    const total = victorias + empates + derrotas;
    return { victorias, empates, derrotas, total, pct: total > 0 ? Math.round((victorias / total) * 100) : 0 };
  })();


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
              style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', overflow: 'visible', flexShrink: 0 }}
            >
              <AvatarPerfil usuario={usuario} size={44} />
            </button>
          </div>

        {/* Mis números — círculos flotantes */}
        {statsRetos.total > 0 && (
          <section>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 12, padding: '0 4px' }}>Mis duelos</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '0 4px' }}>
              <CirculoReto valor={`${statsRetos.victorias}`} porcentaje={(statsRetos.victorias / statsRetos.total) * 100} color="var(--hx-16a34a)" label="Victorias" sub={`de ${statsRetos.total} duelos`} />
              <CirculoReto valor={`${statsRetos.pct}%`} porcentaje={statsRetos.pct} color={COLOR_RETOS} label="% victorias" sub={statsRetos.empates > 0 ? `${statsRetos.empates} ${statsRetos.empates === 1 ? 'empate' : 'empates'}` : 'Sin empates'} />
              <CirculoReto valor={`${teToca.length}`} porcentaje={teToca.length > 0 ? 100 : 0} color="var(--hx-d97706)" label="Te toca" sub={teToca.length === 1 ? 'reto por jugar' : 'retos por jugar'} />
            </div>
          </section>
        )}

        {/* Liga Oplora */}
        <TarjetaLiga />

        {/* Nuevo reto */}
        <button
          onClick={() => { setModalAbierto(true); setPaso('retado'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--c-superficie)', border: 'none', borderRadius: 18, padding: 14, boxShadow: SOMBRA, cursor: 'pointer', width: '100%', textAlign: 'left' }}
        >
          <div style={{ width: 42, height: 42, borderRadius: 12, background: COLOR_RETOS_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Swords size={21} color={COLOR_RETOS} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Retar a alguien</div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>Test, flashcards o psicotécnicos contra otro opositor</div>
          </div>
          <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--hxbg-0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Plus size={18} color="var(--c-primario-texto)" />
          </span>
        </button>

        {/* Te toca jugar */}
        <section id="retos-en-curso" style={{ scrollMarginTop: 16 }}>
          <div id="retos-te-toca" style={{ scrollMarginTop: 16, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY }}>Te toca jugar</span>
            {teToca.length > 0 && <span style={{ fontSize: 11, color: TEXT_MUTED }}>{teToca.length}</span>}
          </div>
          {teToca.length === 0 ? (
            <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: '16px', fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5 }}>
              {retosUsuarioPendientes.length === 0 && retosUsuarioCompletados.length === 0
                ? 'Todavía no tienes duelos. Reta a otro opositor de tu convocatoria y compara quién sabe más.'
                : 'No tienes ningún reto pendiente de jugar.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {teToca.map((p: any) => (
                <TarjetaDuelo
                  key={p.id} p={p} usuario={usuario}
                  onAbrir={() => p.reto._esFC ? router.push(`/app/retos/fc/${p.reto.id}`) : p.reto._esPsico ? router.push(`/app/retos/psico/${p.reto.id}`) : setRetoPreview(p.reto.id)}
                  onJugar={() => p.reto._esFC ? router.push(`/app/retos/fc/${p.reto.id}?directo=true`) : p.reto._esPsico ? router.push(`/app/retos/psico/${p.reto.id}?directo=true`) : router.push(`/app/retos/${p.reto.id}?directo=true`)}
                  onQuitar={() => confirmarAccion(p.reto, p.reto.creador?.id === (usuario as any)?.id ? 'cancelar' : 'rechazar')}
                />
              ))}
            </div>
          )}
        </section>

        {/* Esperando al rival */}
        {esperandoRival.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY }}>Esperando a tu rival</span>
              <span style={{ fontSize: 11, color: TEXT_MUTED }}>{esperandoRival.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {esperandoRival.map((p: any) => (
                <TarjetaDuelo
                  key={p.id} p={p} usuario={usuario}
                  onAbrir={() => p.reto._esFC ? router.push(`/app/retos/fc/${p.reto.id}`) : p.reto._esPsico ? router.push(`/app/retos/psico/${p.reto.id}`) : setRetoPreview(p.reto.id)}
                  // Solo quien lo lanzó puede cancelarlo mientras el rival no lo haya jugado
                  onQuitar={p.reto.creador?.id === (usuario as any)?.id ? () => confirmarAccion(p.reto, 'cancelar') : undefined}
                />
              ))}
            </div>
          </section>
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
        <div onClick={() => { setModalAbierto(false); setError(''); setPaso('retado'); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: BG_APP, borderRadius: '20px', width: '100%', maxWidth: '400px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            <style>{`@keyframes oplora-paso-in { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } } @keyframes oplora-girar { to { transform: rotate(360deg); } }`}</style>

            {/* Header: volver + título + cerrar + barra de progreso */}
            <div style={{ padding: '1.5rem 1.5rem 0.9rem', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
                {paso !== 'retado' ? (
                  <button
                    onClick={() => setPaso(PASOS[PASOS.indexOf(paso) - 1])}
                    aria-label="Paso anterior"
                    style={{ background: 'var(--c-superficie)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', color: TEXT_PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: SOMBRA }}
                  >
                    <ChevronLeft size={17} />
                  </button>
                ) : (
                  <div style={{ width: '34px' }} />
                )}
                <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT_PRIMARY }}>Nuevo reto</div>
                <button
                  onClick={() => { setModalAbierto(false); setError(''); setPaso('retado'); }}
                  aria-label="Cerrar"
                  style={{ background: 'var(--c-superficie)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', color: TEXT_SECONDARY, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: SOMBRA }}
                >
                  <X size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {PASOS.map((p, i) => (
                  <div
                    key={p}
                    style={{
                      flex: 1, height: '4px', borderRadius: '999px',
                      background: i <= PASOS.indexOf(paso) ? colorPasoActivo : 'var(--hx-e5e7eb)',
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
              {/* ⭐ Reto al azar */}
              {rivalAzar ? (
                <div style={{ background: 'var(--c-superficie)', borderRadius: 16, boxShadow: SOMBRA, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AvatarUsuario persona={rivalAzar} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600 }}>Te ha tocado</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{rivalAzar.nick}</div>
                    <div style={{ fontSize: 11, color: TEXT_SECONDARY }}>Nivel {rivalAzar.nivel ?? 1} · tu convocatoria</div>
                  </div>
                  <button
                    onClick={sortearRival}
                    disabled={sorteando}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: COLOR_RETOS, background: COLOR_RETOS_BG, border: 'none', borderRadius: 999, padding: '7px 12px', cursor: 'pointer', flexShrink: 0 }}
                  >
                    {sorteando ? <Loader2 size={13} style={{ animation: 'oplora-girar 0.8s linear infinite' }} /> : <Shuffle size={13} />} Otro
                  </button>
                </div>
              ) : (
                <button
                  onClick={sortearRival}
                  disabled={sorteando || !oposicionId}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--c-superficie)', border: 'none', borderRadius: 16, padding: 12, boxShadow: SOMBRA, cursor: 'pointer', width: '100%', textAlign: 'left' }}
                >
                  <span style={{ width: 40, height: 40, borderRadius: 12, background: COLOR_RETOS_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {sorteando ? <Loader2 size={19} color={COLOR_RETOS} style={{ animation: 'oplora-girar 0.8s linear infinite' }} /> : <Shuffle size={19} color={COLOR_RETOS} />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Reto al azar</span>
                    <span style={{ display: 'block', fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>Te emparejamos con otro opositor de tu convocatoria</span>
                  </span>
                  <ChevronRight size={16} color="var(--hx-c4c9d2)" />
                </button>
              )}
              {errorAzar && (
                <div style={{ fontSize: 12, color: 'var(--hx-b91c1c)', display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.45 }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {errorAzar}
                </div>
              )}

              {rivalAzar && (
                <button onClick={quitarRivalAzar} style={{ alignSelf: 'center', fontSize: 12, fontWeight: 600, color: TEXT_SECONDARY, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Prefiero elegir yo a quién retar
                </button>
              )}

              {!rivalAzar && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: TEXT_MUTED, fontWeight: 600 }}>
                <span style={{ flex: 1, height: 1, background: 'var(--hx-e8dcd2)' }} /> o reta a alguien que conozcas <span style={{ flex: 1, height: 1, background: 'var(--hx-e8dcd2)' }} />
              </div>
              )}

              {!rivalAzar && (<>
              {contactosRecientes.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT_SECONDARY, marginBottom: '8px' }}>Con quién has jugado</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {contactosRecientes.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => setForm({ ...form, retadoNickOEmail: c.contacto?.nick ?? c.contacto?.email ?? '' })}
                        style={{ padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', background: form.retadoNickOEmail === (c.contacto?.nick ?? c.contacto?.email) ? 'var(--hxbg-111827)' : 'var(--c-superficie)', color: form.retadoNickOEmail === (c.contacto?.nick ?? c.contacto?.email) ? 'var(--c-primario-texto)' : 'var(--hx-374151)' }}
                      >
                        @{c.contacto?.nick ?? c.contacto?.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: TEXT_SECONDARY, display: 'block', marginBottom: '6px' }}>¿A quién quieres retar?</label>
                <input
                  type="text"
                  value={form.retadoNickOEmail}
                  onChange={(e) => setForm({ ...form, retadoNickOEmail: e.target.value })}
                  placeholder="Su nick o su email"
                  style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: 'none', borderRadius: '12px', outline: 'none', boxSizing: 'border-box', background: 'var(--c-superficie)', boxShadow: SOMBRA }}
                />
                {validando && (
                  <div style={{ fontSize: '12px', color: 'var(--hx-9ca3af)', marginTop: '6px' }}>Comprobando...</div>
                )}

              {!validando && validacion && (
                <div style={{ marginTop: '6px' }}>
                  {!validacion.encontrado && (
                    <div style={{ fontSize: '12px', color: 'var(--hx-dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><UserX size={14} /> No hemos encontrado a ese usuario</span>
                      <button
                        onClick={() => setModalInvitar(true)}
                        style={{ fontSize: '12px', color: 'var(--hx-1f7cff)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', flexShrink: 0 }}
                      >
                        Invitar por email
                      </button>
                    </div>
                  )}
                  {validacion.encontrado && validacion.error && (
                    <div style={{ fontSize: '12px', color: 'var(--hx-dc2626)', display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={13} /> {validacion.error}</div>
                  )}
                  {validacion.encontrado && !validacion.error && !validacion.mismaOposicion && (
                    <div style={{ fontSize: '12px', color: 'var(--hx-dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={13} /> {validacion.nombre} no prepara esta oposición</span>
                      <button onClick={() => setModalInvitar(true)} style={{ fontSize: '12px', color: 'var(--hx-1f7cff)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', flexShrink: 0 }}>Invitarle</button>
                    </div>
                  )}
                  {validacion.encontrado && !validacion.error && validacion.mismaOposicion && !validacion.mismaConvocatoria && (
                    <div style={{ fontSize: '12px', color: 'var(--hx-dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={13} /> {validacion.nombre} está en otra convocatoria</span>
                      <button onClick={() => setModalInvitar(true)} style={{ fontSize: '12px', color: 'var(--hx-1f7cff)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', flexShrink: 0 }}>Avisarle</button>
                    </div>
                  )}
                  {validacion.encontrado && !validacion.error && validacion.mismaOposicion && validacion.mismaConvocatoria && (
                    <div style={{ fontSize: '12px', color: 'var(--hx-15803d)', display: 'flex', alignItems: 'center', gap: 5 }}><Check size={14} /> {validacion.nombre} — listo para retar</div>
                  )}
                </div>
              )}
              </div>
              </>)}
              </>
              )}

              {paso === 'tipo' && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT_SECONDARY, marginBottom: '8px' }}>Tipo de reto</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { key: 'test', Icon: ClipboardCheck, color: 'var(--hx-4d7c0f)', label: 'Test' },
                    { key: 'fc', Icon: Layers, color: COLOR_FC, label: 'Flashcards' },
                    { key: 'psico', Icon: Brain, color: COLOR_PSICO, label: 'Psicotécnicos' },
                  ].map(({ key, Icon, color, label }) => {
                    const bloqueadoPsico = key === 'psico' && !psicoDisponible;
                    return (
                    <button
                      key={key}
                      onClick={() => { if (bloqueadoPsico) return; setForm({ ...form, categoria: key as CategoriaReto, psicoTipo: '' }); }}
                      disabled={bloqueadoPsico}
                      style={{
                        flex: 1, padding: '10px 6px', borderRadius: '12px', cursor: bloqueadoPsico ? 'not-allowed' : 'pointer', textAlign: 'center',
                        border: form.categoria === key ? `2px solid ${key === 'fc' ? COLOR_FC : key === 'psico' ? COLOR_PSICO : 'var(--hx-111827)'}` : 'none',
                        background: 'var(--c-superficie)',
                        opacity: bloqueadoPsico ? 0.45 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>{bloqueadoPsico ? <Lock size={18} color="var(--hx-9ca3af)" /> : <Icon size={18} color={color} />}</div>
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
                          background: 'var(--c-superficie)',
                        }}
                      >
                        <IconoModalidad tipo={m.tipo} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT_PRIMARY }}>{m.nombre}</div>
                          {m.descripcion && (
                            <div style={{ fontSize: '10px', color: TEXT_MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.descripcion}</div>
                          )}
                        </div>
                        <div style={{
                          width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${form.psicoTipo === m.tipo ? COLOR_PSICO : 'var(--hx-d1d5db)'}`,
                          background: form.psicoTipo === m.tipo ? COLOR_PSICO : 'var(--c-superficie)',
                        }} />
                      </button>
                    ))}
                  </div>
                  {form.psicoTipo && psicoDisponibles && psicoDisponibles.total < form.numPsico && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--hx-b45309)', background: 'var(--hx-fffbeb)', border: '1px solid var(--hx-fde68a)', borderRadius: '10px', padding: '8px 10px' }}>
                      Solo hay {psicoDisponibles.total} preguntas disponibles para esta modalidad (pediste {form.numPsico}). El duelo se creará igualmente con las que haya.
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
                    { key: 'oposicion', Icon: Landmark, label: 'Oposición' },
                    { key: 'normativa', Icon: Scale, label: 'Normativa' },
                    { key: 'tema', Icon: BookOpen, label: 'Tema' },
                  ].map(({ key, Icon, label }) => (
                    <button
                      key={key}
                      onClick={() => setForm({ ...form, tipoReto: key as TipoRetoUsuario, temaId: '', versionLeyId: '' })}
                      style={{ flex: 1, padding: '10px 6px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center', border: form.tipoReto === key ? '2px solid var(--hx-111827)' : 'none', background: 'var(--c-superficie)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}><Icon size={18} color={TEXT_PRIMARY} /></div>
                      <div style={{ fontSize: '11px', fontWeight: 500, color: TEXT_PRIMARY }}>{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {form.tipoReto === 'normativa' && (
                <select
                  value={form.versionLeyId}
                  onChange={(e) => setForm({ ...form, versionLeyId: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: 'none', borderRadius: '10px', fontSize: '13px', color: TEXT_PRIMARY, background: 'var(--c-superficie)' }}
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
                  style={{ width: '100%', padding: '10px 12px', border: 'none', borderRadius: '10px', fontSize: '13px', color: TEXT_PRIMARY, background: 'var(--c-superficie)' }}
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
                        style={{ flex: 1, padding: '9px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', background: form.numPsico === n ? COLOR_PSICO : 'var(--c-superficie)', color: form.numPsico === n ? 'white' : 'var(--hx-6b7280)' }}
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
                        style={{ flex: 1, padding: '9px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', background: form.numFC === n ? COLOR_FC : 'var(--c-superficie)', color: form.numFC === n ? 'white' : 'var(--hx-6b7280)' }}
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
                        style={{ flex: 1, padding: '9px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', background: form.numPreguntas === n ? 'var(--hxbg-111827)' : 'var(--c-superficie)', color: form.numPreguntas === n ? 'var(--c-primario-texto)' : 'var(--hx-6b7280)' }}
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
                        style={{ flex: 1, padding: '9px', borderRadius: '10px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', background: form.horasPlazo === horas ? 'var(--hxbg-111827)' : 'var(--c-superficie)', color: form.horasPlazo === horas ? 'var(--c-primario-texto)' : 'var(--hx-6b7280)' }}
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
              <div style={{ background: 'var(--c-superficie)', borderRadius: '12px', padding: '14px', fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.5 }}>
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
                {` · ${form.horasPlazo === 168 ? '1 semana' : `${form.horasPlazo} h`}`}
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
                    style={{ width: '100%', minHeight: '60px', padding: '10px 12px', fontSize: '13px', border: 'none', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', background: 'var(--c-superficie)', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>
              )}

              {error && (
                <div style={{ fontSize: '12px', color: 'var(--hx-dc2626)', background: 'var(--hx-fef2f2)', border: '1px solid var(--hx-fecaca)', borderRadius: '10px', padding: '8px 12px' }}>
                  {error}
                </div>
              )}

              <div style={{ background: 'var(--c-superficie)', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: TEXT_SECONDARY }}>
                {form.categoria === 'psico'
                  ? `Tu rival jugará las mismas ${form.numPsico} preguntas psicotécnicas y tendrá ${form.horasPlazo === 168 ? '1 semana' : `${form.horasPlazo} h`} para hacerlo.`
                  : form.categoria === 'fc'
                  ? `Tu rival jugará las mismas ${form.numFC} flashcards y tendrá ${form.horasPlazo === 168 ? '1 semana' : `${form.horasPlazo} h`} para hacerlo.`
                  : `Tu rival hará el mismo test y tendrá ${form.horasPlazo === 168 ? '1 semana' : `${form.horasPlazo} h`} para hacerlo.`}
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
                  background: 'var(--hxbg-111827)', color: 'var(--c-primario-texto)',
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
              <Swords size={26} color={retoRecienCreado.startsWith('fc:') ? COLOR_FC : retoRecienCreado.startsWith('psico:') ? COLOR_PSICO : COLOR_RETOS} />
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
                style={{ width: '100%', padding: '13px', background: 'var(--hxbg-111827)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                Hacer reto ahora
              </button>
              <button
                onClick={() => setRetoRecienCreado(null)}
                style={{ width: '100%', padding: '13px', background: 'var(--c-superficie)', color: TEXT_SECONDARY, border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Dejarlo para más adelante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal INVITAR */}

      {modalInvitar && (
        <ModalInvitar
          onClose={() => setModalInvitar(false)}
          oposicionId={oposicionId}
          oposicionNombre={usuario?.oposicionActiva?.nombre}
          destinoInicial={form.retadoNickOEmail}
          motivo="reto"
        />
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

        const rival = otraParticipacion?.usuario;
        const meRetaron = !!retoDetalle.creador && retoDetalle.creador.id !== (usuario as any)?.id;
        const caducadoPreview = retoCaducado(retoDetalle) && !ambosCompletados;
        const ambito = retoDetalle.tema
          ? `Tema ${retoDetalle.tema.numero}`
          : 'Toda la oposición';
        const estadoTexto = ambosCompletados
          ? (empate ? 'Empate' : yoGane ? 'Has ganado' : `Ha ganado ${rival?.nick ?? rival?.nombre ?? 'tu rival'}`)
          : caducadoPreview ? 'Caducado'
            : !miParticipacion?.completado ? 'Te toca jugar' : 'Esperando a tu rival';
        const colorEstado = ambosCompletados
          ? (empate ? 'var(--hx-b45309)' : yoGane ? 'var(--hx-15803d)' : 'var(--hx-b91c1c)')
          : caducadoPreview ? 'var(--hx-b91c1c)' : !miParticipacion?.completado ? COLOR_RETOS : TEXT_SECONDARY;
        const fondoEstado = ambosCompletados
          ? (empate ? 'var(--hx-fef3c7)' : yoGane ? 'var(--hx-dcfce7)' : 'var(--hx-fee2e2)')
          : caducadoPreview ? 'var(--hx-fee2e2)' : !miParticipacion?.completado ? COLOR_RETOS_BG : 'var(--hx-f1f5f9)';

        return (
          <div onClick={cerrarModalPreview} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: BG_APP, borderRadius: 24, width: '100%', maxWidth: 420, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(15,23,42,0.25)' }}>

              {/* Cabecera */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 18px 14px' }}>
                <span style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--c-superficie)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: SOMBRA }}>
                  <Swords size={20} color={COLOR_RETOS} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>Duelo de test</div>
                  <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 1 }}>
                    {ambito} · {retoDetalle.preguntas?.length ?? 0} preguntas
                  </div>
                </div>
                <button onClick={cerrarModalPreview} aria-label="Cerrar" style={{ background: 'var(--c-superficie)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: TEXT_SECONDARY, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: SOMBRA, flexShrink: 0 }}><X size={17} /></button>
              </div>

              <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Marcador */}
                <div style={{ background: 'var(--c-superficie)', borderRadius: 20, boxShadow: SOMBRA, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: fondoEstado, color: colorEstado }}>
                      {ambosCompletados ? (empate ? <Handshake size={12} /> : <Crown size={12} />) : <Hourglass size={12} />}
                      {estadoTexto}
                    </span>
                    {!ambosCompletados && !caducadoPreview && retoDetalle.fechaFin && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: TEXT_SECONDARY }}>
                        <Clock size={12} /> {tiempoRestante(retoDetalle.fechaFin)}
                      </span>
                    )}
                  </div>
                  <DueloReto reto={retoDetalle} usuarioActual={usuario} />
                </div>

                {/* Mensaje del retador */}
                {meRetaron && retoDetalle.mensaje && (
                  <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, marginBottom: 4 }}>
                      Mensaje de {retoDetalle.creador.nick ?? retoDetalle.creador.nombre}
                    </div>
                    <div style={{ fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.5 }}>“{retoDetalle.mensaje}”</div>
                  </div>
                )}

                {/* Revancha */}
                {ambosCompletados && !empate && !yoGane && !revanchaAbierta && (
                  <button
                    onClick={() => setRevanchaAbierta(true)}
                    style={{ width: '100%', padding: 13, background: COLOR_RETOS, color: 'white', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                  >
                    <RotateCcw size={16} /> Pedir la revancha
                  </button>
                )}

                {revanchaAbierta && (
                  <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8 }}>Revancha</div>
                    <textarea
                      value={mensajeRevancha}
                      onChange={(e) => setMensajeRevancha(e.target.value)}
                      placeholder="Añade un mensaje (opcional)"
                      maxLength={140}
                      style={{ width: '100%', minHeight: 60, padding: '10px 12px', fontSize: 13, border: '2px solid var(--hx-eef0f3)', borderRadius: 12, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', marginBottom: 10 }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => { setRevanchaAbierta(false); setMensajeRevancha(''); }}
                        style={{ flex: 1, padding: 12, background: 'var(--hx-f1f5f9)', color: TEXT_SECONDARY, border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => enviarRevancha.mutate()}
                        disabled={enviarRevancha.isPending}
                        style={{ flex: 2, padding: 12, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: enviarRevancha.isPending ? 0.7 : 1 }}
                      >
                        {enviarRevancha.isPending ? 'Enviando…' : 'Enviar revancha'}
                      </button>
                    </div>
                    {enviarRevancha.isError && (
                      <div style={{ fontSize: 12, color: 'var(--hx-b91c1c)', marginTop: 8 }}>
                        {(enviarRevancha.error as any)?.response?.data?.message ?? 'No se ha podido enviar la revancha.'}
                      </div>
                    )}
                  </div>
                )}

                {/* Acción principal */}
                {caducadoPreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, color: TEXT_SECONDARY, padding: '6px 0' }}>
                    <Ban size={14} /> Este duelo caducó sin que jugarais los dos
                  </div>
                ) : !miParticipacion?.completado ? (
                  <button
                    onClick={() => router.push(`/app/retos/${retoPreview}?directo=true`)}
                    style={{ width: '100%', padding: 14, background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                  >
                    <Swords size={16} /> Jugar el duelo
                  </button>
                ) : !ambosCompletados ? (
                  <div style={{ textAlign: 'center', fontSize: 13, color: TEXT_SECONDARY, padding: '4px 0', lineHeight: 1.5 }}>
                    Ya has jugado. Te avisaremos cuando {rival?.nick ?? rival?.nombre ?? 'tu rival'} termine.
                  </div>
                ) : (
                  <button
                    onClick={() => router.push(`/app/retos/${retoPreview}`)}
                    style={{ width: '100%', padding: 13, background: 'var(--c-superficie)', color: TEXT_PRIMARY, border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    Ver resultado completo <ChevronRight size={15} />
                  </button>
                )}
              </div>
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
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--hx-fef2f2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><AlertTriangle size={24} color="var(--hx-dc2626)" /></div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT_PRIMARY, marginBottom: '6px' }}>
                No se puede completar
              </div>
              <div style={{ fontSize: '13px', color: TEXT_SECONDARY, marginBottom: '18px' }}>
                {errorAccion}
              </div>
              <button
                onClick={() => { setConfirmacion(null); setErrorAccion(null); }}
                style={{ width: '100%', padding: '12px', background: 'var(--hxbg-111827)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                Entendido
              </button>
            </>
          ) : (
            <>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--hx-fef2f2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>{confirmacion.accion === 'cancelar' ? <Ban size={24} color="var(--hx-dc2626)" /> : <UserX size={24} color="var(--hx-dc2626)" />}</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT_PRIMARY, marginBottom: '6px' }}>
                {confirmacion.accion === 'cancelar' ? '¿Cancelar este reto?' : '¿Rechazar este reto?'}
              </div>
              <div style={{ fontSize: '13px', color: TEXT_SECONDARY, marginBottom: '18px' }}>
                {confirmacion.accion === 'cancelar' ? 'Tu rival dejará de verlo. No se puede deshacer.' : 'Avisaremos a quien te retó. No se puede deshacer.'}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setConfirmacion(null)}
                  style={{ flex: 1, padding: '12px', background: 'var(--c-superficie)', color: TEXT_SECONDARY, border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Volver
                </button>
                <button
                  onClick={ejecutarAccion}
                  disabled={eliminarReto.isPending}
                  style={{ flex: 1, padding: '12px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
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
          background: 'var(--hxbg-111827)', color: 'var(--c-primario-texto)', fontSize: '13px', fontWeight: 600,
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



// ⭐ Con la copa de la Liga Oplora encima si la tiene (persona.copaLiga).
function AvatarUsuario({ persona, size = 64 }: { persona: any; size?: number }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <AvatarUsuarioBase persona={persona} size={size} />
      <CopaEnAvatar copa={persona?.copaLiga} size={size} />
    </span>
  );
}

function AvatarUsuarioBase({ persona, size = 64 }: { persona: any; size?: number }) {
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
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: '50%', background: 'var(--hx-efe9e0)' }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: 'var(--hx-efe9e0)',
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
  if (pct > 50) return 'var(--hx-1f7cff)'; // azul — tiempo de sobra
  if (pct > 20) return 'var(--hx-d97706)'; // ámbar — se acerca
  return 'var(--hx-dc2626)'; // rojo — poco tiempo
}

export function DueloReto({ reto, usuarioActual, mostrarBarraTiempo = false, tipo = 'test' }: any) {
  const esFC = tipo === 'fc';
  const esPsico = tipo === 'psico';
  const colorGanador = esPsico ? COLOR_PSICO : esFC ? COLOR_FC : 'var(--hx-d97706)';
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
  const IconoCategoria = esPsico ? Brain : esFC ? Layers : ClipboardCheck;
  const colorCategoria = esPsico ? COLOR_PSICO : esFC ? COLOR_FC : COLOR_TEST;
  const colorCategoriaBg = esPsico ? COLOR_PSICO_BG : esFC ? COLOR_FC_BG : 'var(--hx-f3fae9)';

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
      {esGanador && (
        <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', width: 18, height: 18, borderRadius: '50%', background: colorGanador, border: '2px solid var(--c-superficie)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Crown size={10} color="white" />
        </div>
      )}
      {esEmpate && (
        <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', width: 18, height: 18, borderRadius: '50%', background: '#B45309', border: '2px solid var(--c-superficie)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Handshake size={10} color="white" />
        </div>
      )}
      {esCreadorDeEste && (
        // ⭐ Identifica quién lanzó el reto: icono de espadas en la esquina de su avatar.
        <div style={{
          position: 'absolute', top: '-4px', left: '-4px', width: '16px', height: '16px',
          borderRadius: '50%', background: 'var(--hxbg-111827)', border: '2px solid var(--c-superficie)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Swords size={9} color="var(--c-primario-texto)" />
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
          <IconoCategoria size={13} color={colorCategoria} />
        </div>
        {mostrarTiempo && (
          <>
            <div style={{ position: 'relative', width: '4px', height: '18px', background: 'var(--hx-f1f5f9)', borderRadius: '999px', overflow: 'hidden' }}>
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
              <span style={{ fontSize: '12px', color: 'var(--hx-15803d)', fontWeight: 600 }}>Hecho</span>
            )}
          </div>
        </div>
        {avatarCompacto(rival?.usuario, rivalEsCreador, !!rivalGana, !!empate)}
      </div>
    </div>
  );
}

function WidgetHistorialRetos({ retosCompletados, usuario, onVer }: any) {
  // ⭐ Paginado: se ven 3 y "Ver más" va añadiendo de 20 en 20 (antes se pintaban todos de golpe).
  const [visibles, setVisibles] = useState(3);
  const expandido = visibles > 3;
  const aMostrar = retosCompletados.slice(0, visibles);
  const quedan = retosCompletados.length - aMostrar.length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, paddingLeft: 4 }}>Últimos resultados</span>
        {expandido && (
          <button
            onClick={() => setVisibles(3)}
            style={{ fontSize: 12, color: COLOR_RETOS, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, minHeight: 32 }}
          >
            Ver menos
            <ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} />
          </button>
        )}
      </div>
      <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
        {aMostrar.map((p: any, idx: number) => {
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
          return (
            <div
              key={p.id}
              onClick={() => onVer(p)}
              style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderBottom: idx < aMostrar.length - 1 ? '1px solid var(--hx-f5eeea)' : 'none' }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: expirado ? 'var(--hx-f4f5f7)' : empate ? 'var(--hx-fef3c7)' : gane ? (esPsico ? COLOR_PSICO_BG : esFC ? COLOR_FC_BG : 'var(--hx-f0fdf4)') : 'var(--hx-fef2f2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {(() => {
                  // ⭐ Icono de la actividad (el mismo que en el resto de la app), coloreado por resultado.
                  if (expirado) return <Clock size={17} color="var(--hx-9ca3af)" />;
                  if (empate) return <Handshake size={17} color="var(--hx-b45309)" />;
                  const IconoAct = esPsico ? Brain : esFC ? Layers : ClipboardCheck;
                  return <IconoAct size={17} color={gane ? (esPsico ? COLOR_PSICO : esFC ? COLOR_FC : 'var(--hx-16a34a)') : 'var(--hx-dc2626)'} />;
                })()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY }}>
                  {expirado ? 'Caducado' : empate ? 'Empate' : gane ? 'Victoria' : 'Derrota'} vs {rival?.nick ?? rival?.nombre ?? 'Usuario'}
                </div>
                <div style={{ fontSize: '12px', color: TEXT_MUTED, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {expirado ? 'Se acabó el plazo' : `${p.porcentaje ?? 0}% · ${rivalParticipacion?.porcentaje ?? '?'}%`} · {descripcionReto(p.reto)}
                </div>
              </div>
              <ChevronRight size={16} color="var(--hx-c4c9d2)" style={{ flexShrink: 0 }} />
            </div>
          );
        })}
        {quedan > 0 && (
          <button
            onClick={() => setVisibles((v) => (v === 3 ? 20 : v + 20))}
            style={{ width: '100%', minHeight: 46, border: 'none', borderTop: '1px solid var(--hx-f5eeea)', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: COLOR_RETOS, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            Ver más ({quedan})
            <ChevronDown size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function CirculoReto({ valor, porcentaje, color, label, sub }: { valor: string; porcentaje: number; color: string; label: string; sub: string }) {
  const D = 78;
  const g = 6;
  const r = (D - 12 - g) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <div style={{ position: 'relative', width: D, height: D, borderRadius: '50%', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={D - 12} height={D - 12} style={{ position: 'absolute', top: 6, left: 6, transform: 'rotate(-90deg)' }}>
          <circle cx={(D - 12) / 2} cy={(D - 12) / 2} r={r} fill="none" stroke="var(--hx-f3ece8)" strokeWidth={g} />
          {porcentaje > 0 && (
            <circle cx={(D - 12) / 2} cy={(D - 12) / 2} r={r} fill="none" stroke={color} strokeWidth={g} strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c - (Math.min(100, porcentaje) / 100) * c} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
          )}
        </svg>
        <span style={{ position: 'relative', fontSize: 16, fontWeight: 800, color: TEXT_PRIMARY }}>{valor}</span>
      </div>
      <span style={{ fontSize: 12, color: TEXT_PRIMARY, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
      <span style={{ fontSize: 10, color: TEXT_MUTED, marginTop: -3, textAlign: 'center' }}>{sub}</span>
    </div>
  );
}

/** Tarjeta de un duelo en curso: enfrentamiento, qué es, plazo y acciones. */
function TarjetaDuelo({ p, usuario, onAbrir, onJugar, onQuitar }: { p: any; usuario: any; onAbrir: () => void; onJugar?: () => void; onQuitar?: () => void }) {
  const esFC = !!p.reto._esFC;
  const esPsico = !!p.reto._esPsico;
  const esCreador = p.reto.creador?.id === usuario?.id;
  const rival = p.reto.participaciones?.find((x: any) => x.usuario?.id !== usuario?.id)?.usuario ?? p.reto.creador;
  const restante = p.reto.fechaFin ? tiempoRestante(p.reto.fechaFin).replace(' restantes', '') : null;
  const urgente = p.reto.fechaFin && new Date(p.reto.fechaFin).getTime() - Date.now() < 6 * 3600 * 1000;
  return (
    <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, overflow: 'hidden' }}>
      <div onClick={onAbrir} style={{ padding: '12px 14px', cursor: 'pointer' }}>
        <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600, color: TEXT_SECONDARY }}>{esCreador ? `Retaste a ${rival?.nick ?? rival?.nombre ?? 'tu rival'}` : `${p.reto.creador?.nick ?? p.reto.creador?.nombre ?? 'Alguien'} te ha retado`}</span>
          <span>·</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{descripcionReto(p.reto)}</span>
        </div>
        <DueloReto reto={p.reto} usuarioActual={usuario} tipo={esFC ? 'fc' : esPsico ? 'psico' : 'test'} />
        {p.reto.mensaje && !esCreador && (
          <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 10, fontStyle: 'italic', background: 'var(--hx-fbf7f5)', borderRadius: 10, padding: '7px 10px' }}>
            “{p.reto.mensaje}”
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderTop: '1px solid var(--hx-f5eeea)' }}>
        {restante && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: urgente ? 'var(--hx-dc2626)' : TEXT_MUTED, flex: 1 }}>
            {onJugar ? <Clock size={13} /> : <Hourglass size={13} />}
            {onJugar ? `Quedan ${restante}` : `Tu rival tiene ${restante}`}
          </span>
        )}
        {onQuitar && (
          <button
            onClick={(e) => { e.stopPropagation(); onQuitar(); }}
            style={{ background: 'none', border: 'none', padding: '6px 8px', cursor: 'pointer', color: 'var(--hx-b91c1c)', fontSize: 12, fontWeight: 600 }}
          >
            {esCreador ? 'Cancelar' : 'Rechazar'}
          </button>
        )}
        {onJugar && (
          <button
            onClick={(e) => { e.stopPropagation(); onJugar(); }}
            style={{ background: 'var(--hxbg-0f172a)', color: 'var(--c-primario-texto)', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
          >
            Jugar
          </button>
        )}
      </div>
    </div>
  );
}