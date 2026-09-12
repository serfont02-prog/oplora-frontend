'use client';

import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useState } from 'react';


const BG_APP = '#F4F5F7';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';

const LABEL_TURNO: Record<string, string> = {
  libre: 'Libre',
  promocion_interna: 'Promoción interna',
};

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ConvocatoriaFichaPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { usuario } = useAuth();
  const oposicionId = params.id as string;
const convocatoriaIdParam = searchParams.get('convocatoriaId');
const [modalTemas, setModalTemas] = useState(false);

const convocatoriaActivaId = usuario?.oposicionActiva?.convocatoriaActiva?.id;

const { data: convocatorias = [], isLoading } = useQuery({
  queryKey: ['convocatorias-ficha', oposicionId],
  queryFn: async () => {
    const res = await api.get(`/convocatorias/oposicion/${oposicionId}`);
    return res.data;
  },
});

const convocatoria = convocatoriaIdParam
  ? convocatorias.find((c: any) => c.id === convocatoriaIdParam)
  : (convocatoriaActivaId
      ? convocatorias.find((c: any) => c.id === convocatoriaActivaId)
      : convocatorias.find((c: any) => c.estado === 'activa') ?? convocatorias[0]);

const { data: temasModal = [] } = useQuery({
  queryKey: ['temas-convocatoria-ficha', convocatoria?.id],
  queryFn: async () => {
    const res = await api.get(`/temas/convocatoria/${convocatoria.id}`);
    return res.data;
  },
  enabled: !!convocatoria?.id && modalTemas,
});

if (isLoading) return null;

if (!convocatoria) {
  return (
    <div style={{ minHeight: '100vh', background: BG_APP, padding: '2rem 1.25rem', textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: TEXT_MUTED }}>No hay convocatoria disponible</div>
    </div>
  );
}

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 90 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem' }}>

        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY, fontSize: 13, marginBottom: 16 }}>
          <ArrowLeft size={15} />
          Atrás
        </button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Convocatoria
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>
            {convocatoria.anyo}
            {convocatoria.estado === 'activa' && (
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#DCFCE7', color: '#15803D' }}>
                Activa
              </span>
            )}
          </div>
        </div>

        {modalTemas && (
        <div
            onClick={() => setModalTemas(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 60 }}
        >
            <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: BG_APP, borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%', maxWidth: 560, maxHeight: '75vh', overflowY: 'auto' }}
            >
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 14 }}>Temas de la convocatoria</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {temasModal.map((t: any) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'white', borderRadius: 12 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#EAF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#1F7CFF', flexShrink: 0 }}>
                    {t.numero}
                    </div>
                    <div style={{ fontSize: 13, color: TEXT_PRIMARY }}>{t.titulo}</div>
                </div>
                ))}
            </div>
            </div>
        </div>
        )}

        {/* Datos generales */}
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {convocatoria.plazas && <Fila label="Plazas" valor={convocatoria.plazas} />}
            {convocatoria.turno && <Fila label="Turno" valor={LABEL_TURNO[convocatoria.turno] ?? convocatoria.turno} />}
            {convocatoria.fechaConvocatoria && <Fila label="Fecha de convocatoria" valor={formatearFecha(convocatoria.fechaConvocatoria)} />}
            {convocatoria.fechaExamen && <Fila label="Fecha de examen" valor={formatearFecha(convocatoria.fechaExamen)} />}
            {(convocatoria.plazoInscripcionInicio || convocatoria.plazoInscripcionFin) && (
              <Fila
                label="Plazo de inscripción"
                valor={`${convocatoria.plazoInscripcionInicio ? formatearFecha(convocatoria.plazoInscripcionInicio) : '—'} a ${convocatoria.plazoInscripcionFin ? formatearFecha(convocatoria.plazoInscripcionFin) : '—'}`}
              />
            )}
            {convocatoria.numeroSolicitudes && <Fila label="Solicitudes" valor={convocatoria.numeroSolicitudes} />}
            {convocatoria.numeroPresentados && <Fila label="Presentados" valor={convocatoria.numeroPresentados} />}
          </div>
        </div>

        {/* Desglose de plazas */}
        {convocatoria.plazasDesglose && Object.values(convocatoria.plazasDesglose).some((v: any) => v) && (
          <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 10 }}>Desglose de plazas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {convocatoria.plazasDesglose.libres && <Fila label="Libres" valor={convocatoria.plazasDesglose.libres} />}
              {convocatoria.plazasDesglose.promocionInterna && <Fila label="Promoción interna" valor={convocatoria.plazasDesglose.promocionInterna} />}
              {convocatoria.plazasDesglose.militares && <Fila label="Militares" valor={convocatoria.plazasDesglose.militares} />}
              {convocatoria.plazasDesglose.discapacidad && <Fila label="Discapacidad" valor={convocatoria.plazasDesglose.discapacidad} />}
            </div>
          </div>
        )}

            {/* Ejercicios */}
            {convocatoria.ejercicios?.length > 0 && (
            <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 10 }}>Ejercicios</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {convocatoria.ejercicios.map((ej: any, i: number) => (
                    <div key={i} style={{ padding: '10px 12px', background: '#F9FAFB', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, textTransform: 'capitalize' }}>
                        Ejercicio {ej.numero} — {ej.tipo}
                        </div>
                        <button
                        onClick={() => router.push(`/app/entrenamiento?modo=simulacro&ejercicio=${ej.numero}`)}
                        style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', background: '#F3E8FF', border: 'none', borderRadius: 999, padding: '3px 10px', cursor: 'pointer', flexShrink: 0 }}
                        >
                        🎯 Simulacro
                        </button>
                    </div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED }}>
                        {ej.numPreguntas ? `${ej.numPreguntas} preguntas` : ''}
                        {ej.numPreguntas && ej.tiempoMinutos ? ' · ' : ''}
                        {ej.tiempoMinutos ? `${ej.tiempoMinutos} min` : ''}
                    </div>
                    {ej.descripcion && <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginTop: 4 }}>{ej.descripcion}</div>}
                    </div>
                ))}
                </div>
                {convocatoria.fraccionPenalizacion && (
                <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 10 }}>
                    Penalización por error: {convocatoria.fraccionPenalizacion}
                </div>
                )}
                {convocatoria.notaMinimaAprobado && (
                <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>
                    Nota mínima: {convocatoria.notaMinimaAprobado}
                </div>
                )}
            </div>
            )}

        {/* Bloques del temario */}
        {convocatoria.bloquesTemario?.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>Bloques del temario</div>
            <button
                onClick={() => setModalTemas(true)}
                style={{ fontSize: 12, color: '#1F7CFF', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                Ver temas →
            </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {convocatoria.bloquesTemario.map((b: any, i: number) => (
                <div key={i}>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>{b.nombre}</div>
                {b.descripcion && <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{b.descripcion}</div>}
                </div>
            ))}
            </div>
        </div>
        )}

        {/* Requisitos */}
        {convocatoria.requisitos && (
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8 }}>Requisitos</div>
            <div style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.7 }}>
            {convocatoria.requisitos.split('\n').filter((l: string) => l.trim()).map((linea: string, i: number) => (
                <p key={i} style={{ margin: i === 0 ? 0 : '6px 0 0' }}>{linea}</p>
            ))}
            </div>
        </div>
        )}

        {/* Fases adicionales */}
                {convocatoria.fasesAdicionales.map((f: any, i: number) => (
                <div key={i} style={{ padding: '10px 12px', background: '#F9FAFB', borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY, textTransform: 'capitalize' }}>{f.tipo}</div>
                        {f.nombre && <div style={{ fontSize: 11, fontWeight: 400, color: TEXT_MUTED, marginTop: 1 }}>{f.nombre}</div>}
                    </div>
                    {f.eliminatoria && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', flexShrink: 0 }}>Eliminatoria</span>
                    )}
                    </div>
                    {f.descripcion && <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginTop: 6 }}>{f.descripcion}</div>}
                </div>
                ))}

        {/* Bolsa de empleo */}
        {convocatoria.generaBolsaEmpleo && (
          <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6 }}>Bolsa de empleo</div>
            <div style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.6 }}>{convocatoria.bolsaEmpleoDescripcion}</div>
          </div>
        )}

        {/* Formación posterior */}
        {convocatoria.formacionPosterior && (
          <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6 }}>Formación posterior</div>
            <div style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.6 }}>{convocatoria.formacionPosterior}</div>
          </div>
        )}

        {/* Notas adicionales */}
        {convocatoria.descripcionAdicional && (
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6 }}>Notas adicionales</div>
            <div style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.7 }}>
            {convocatoria.descripcionAdicional.split('\n').filter((l: string) => l.trim()).map((linea: string, i: number) => (
                <p key={i} style={{ margin: i === 0 ? 0 : '6px 0 0' }}>{linea}</p>
            ))}
            </div>
        </div>
        )}

        {/* Documentación oficial */}
        {convocatoria.urlOficial && (
          <a
            href={convocatoria.urlOficial}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: 16, textDecoration: 'none', marginBottom: 12 }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1F7CFF' }}>Ver documentación oficial</span>
            <ExternalLink size={16} color="#1F7CFF" />
          </a>
        )}

        {convocatoria.documentos?.length > 0 && (
          <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 10 }}>Documentos ({convocatoria.documentos.length})</div>
            <button
              onClick={() => router.push(`/app/oposicion/${oposicionId}/noticias`)}
              style={{ fontSize: 12, color: '#1F7CFF', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Ver en Noticias →
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

function Fila({ label, valor }: { label: string; valor: any }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
      <span style={{ color: TEXT_MUTED }}>{label}</span>
      <span style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>{valor}</span>
    </div>
  );
}