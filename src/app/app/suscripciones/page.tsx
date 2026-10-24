'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { FooterNavegacion } from '@/app/app/dashboard/page';
import {
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

import {
  ArrowLeft,
  Check,
  X,
  Home,
  BookOpen,
  Bell,
  Flame,
  Crown,
} from 'lucide-react';
import { BG_NEUTRAL } from '@/styles/tokens';

/* =========================================================
   SUSCRIPCIONES
========================================================= */

const SUSCRIPCIONES = [
  {
    id: 'gratuito',
    nombre: 'Gratuito',
    precio: '0€',
    descripcion: 'Empieza a preparar tu oposición',
    recomendado: false,

    features: [
      { texto: '1 oposición activa', incluido: true },
      { texto: 'Tests diarios limitados', incluido: true },
      { texto: 'Flashcards limitadas', incluido: true },
      { texto: '1 reto diario', incluido: true },
      { texto: 'Alertas básicas', incluido: true },
      { texto: 'Progreso básico', incluido: true },

      { texto: 'IA avanzada', incluido: false },
      { texto: 'Simulacros completos', incluido: false },
      { texto: 'Varias oposiciones', incluido: false },
    ],
  },

  {
    id: 'esencial',
    nombre: 'Esencial',
    precio: '6,99€',
    descripcion: 'Para opositores constantes',
    recomendado: false,

    features: [
      { texto: '1 oposición activa', incluido: true },
      { texto: 'Tests amplios', incluido: true },
      { texto: 'Flashcards amplias', incluido: true },
      { texto: 'Retos diarios', incluido: true },
      { texto: 'Alertas completas', incluido: true },
      { texto: 'Rachas y progreso', incluido: true },
      { texto: 'IA básica', incluido: true },

      { texto: 'IA avanzada', incluido: false },
      { texto: 'Varias oposiciones', incluido: false },
    ],
  },

  {
    id: 'profesional',
    nombre: 'Profesional',
    precio: '14,99€',
    descripcion: 'Todo ilimitado para ir en serio',
    recomendado: true,

    features: [
      { texto: 'Oposiciones ilimitadas', incluido: true },
      { texto: 'Tests ilimitados', incluido: true },
      { texto: 'Flashcards ilimitadas', incluido: true },
      { texto: 'IA avanzada', incluido: true },
      { texto: 'Simulacros completos', incluido: true },
      { texto: 'Estadísticas avanzadas', incluido: true },
      { texto: 'Personalización inteligente', incluido: true },
      { texto: 'Retos avanzados', incluido: true },
      { texto: 'Alertas premium', incluido: true },
    ],
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function SuscripcionesPage() {
  const router = useRouter();

  const { usuario, cargando } = useAuth();

  const [suscripcionSeleccionada, setSuscripcionSeleccionada] = useState<string | null>(null);

  useEffect(() => {
    if (!cargando && !usuario) {
      router.push('/app/login');
    }
  }, [usuario, cargando, router]);

  if (cargando) return null;

  const suscripcionActual = usuario?.suscripcion || 'gratuito';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG_NEUTRAL,
        paddingBottom: 100,
      }}
    >
      {/* =========================================================
          TOP BAR
      ========================================================= */}

      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'color-mix(in srgb, var(--c-superficie) 92%, transparent)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--hx-e5e7eb)',
        }}
      >
        {/* VOLVER */}
        <div
          style={{
            height: 52,
            display: 'flex',
            alignItems: 'center',
            padding: '0 1rem',
          }}
        >
          <button
            onClick={() => router.push('/app/dashboard')}
            style={{
              border: 'none',
              background: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              color: 'var(--hx-6b7280)',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} />
            Volver
          </button>
        </div>

        {/* HERO */}
        <div
          style={{
            padding: '0 1.4rem 1.4rem',
          }}
        >
          {/* SUSCRIPCION ACTUAL */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              background: 'var(--hx-eef2ff)',
              color: 'var(--hx-4338ca)',
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 14,
            }}
          >
            <Crown size={14} />
            Suscripción actual:{' '}
            {SUSCRIPCIONES.find((s) => s.id === suscripcionActual)?.nombre || 'Gratuito'}
          </div>

          <h1
            style={{
              fontSize: 30,
              lineHeight: 1.1,
              fontWeight: 800,
              color: 'var(--hx-0f172a)',
              margin: 0,
              marginBottom: 10,
            }}
          >
            Elige cómo quieres preparar tu oposición
          </h1>

          <p
            style={{
              margin: 0,
              color: 'var(--hx-64748b)',
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            Sin permanencia · Cancela cuando quieras
          </p>
        </div>
      </div>

      {/* =========================================================
          CONTENIDO
      ========================================================= */}

      <div
        style={{
          maxWidth: 620,
          margin: '0 auto',
          padding: '1.4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {SUSCRIPCIONES.map((suscripcion) => {
          const esActual = suscripcion.id === suscripcionActual;
          const seleccionada = suscripcionSeleccionada === suscripcion.id;

          return (
            <div
              key={suscripcion.id}
              onClick={() => setSuscripcionSeleccionada(suscripcion.id)}
              style={{
                position: 'relative',
                background: 'var(--c-superficie)',
                borderRadius: 22,
                border: seleccionada
                  ? '2px solid var(--hx-0f172a)'
                  : suscripcion.recomendado
                  ? '2px solid var(--hx-1f7cff)'
                  : '1px solid var(--hx-e5e7eb)',
                padding: '1.4rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
              }}
            >
              {/* RECOMENDADO */}
              {suscripcion.recomendado && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1F7CFF',
                    color: 'white',
                    padding: '5px 14px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  RECOMENDADO
                </div>
              )}

              {/* SUSCRIPCION ACTUAL */}
              {esActual && (
                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    background: 'var(--hx-dcfce7)',
                    color: 'var(--hx-15803d)',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 999,
                  }}
                >
                  ACTUAL
                </div>
              )}

              {/* HEADER */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 18,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: 'var(--hx-0f172a)',
                    }}
                  >
                    {suscripcion.nombre}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--hx-64748b)',
                      marginTop: 4,
                    }}
                  >
                    {suscripcion.descripcion}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: 34,
                      fontWeight: 800,
                      color: 'var(--hx-0f172a)',
                      lineHeight: 1,
                    }}
                  >
                    {suscripcion.precio}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--hx-94a3b8)',
                      marginTop: 4,
                    }}
                  >
                    /mes
                  </div>
                </div>
              </div>

              {/* FEATURES */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {suscripcion.features.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      opacity: f.incluido ? 1 : 0.45,
                    }}
                  >
                    {f.incluido ? (
                      <Check size={15} color="var(--hx-16a34a)" />
                    ) : (
                      <X size={15} color="var(--hx-94a3b8)" />
                    )}

                    <span
                      style={{
                        fontSize: 14,
                        color: 'var(--hx-334155)',
                      }}
                    >
                      {f.texto}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                disabled={esActual}
                onClick={(e) => {
                  e.stopPropagation();

                  if (!esActual) {
                    alert(
                      `Stripe pendiente → suscripción seleccionada: ${suscripcion.nombre}`
                    );
                  }
                }}
                style={{
                  marginTop: 22,
                  width: '100%',
                  height: 48,
                  borderRadius: 14,
                  border: 'none',
                  background: esActual
                    ? 'var(--hx-e5e7eb)'
                    : suscripcion.recomendado
                    ? 'var(--hx-1f7cff)'
                    : 'var(--hxbg-0f172a)',
                  color: esActual ? 'var(--hx-64748b)' : 'var(--c-primario-texto)',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: esActual ? 'default' : 'pointer',
                }}
              >
                {esActual
                  ? 'Tu suscripción actual'
                  : suscripcion.id === 'gratuito'
                  ? 'Incluido al registrarte'
                  : `Elegir ${suscripcion.nombre}`}
              </button>
            </div>
          );
        })}

        {/* FAQ */}
        <div
          style={{
            background: 'var(--c-superficie)',
            border: '1px solid var(--hx-e5e7eb)',
            borderRadius: 18,
            padding: '1.2rem',
            marginTop: 4,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--hx-0f172a)',
              marginBottom: 14,
            }}
          >
            Preguntas frecuentes
          </div>

          {[
            {
              p: '¿Puedo cambiar de suscripción?',
              r: 'Sí. Puedes subir o bajar de suscripción cuando quieras.',
            },
            {
              p: '¿Puedo cancelar?',
              r: 'Sí. No hay permanencia.',
            },
            {
              p: '¿Qué pasa si bajo de suscripción?',
              r: 'Mantendrás tus datos y se aplicarán los nuevos límites.',
            },
          ].map((faq, i) => (
            <div
              key={i}
              style={{
                paddingBottom: 14,
                marginBottom: 14,
                borderBottom:
                  i !== 2 ? '1px solid var(--hx-f1f5f9)' : 'none',
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--hx-0f172a)',
                  marginBottom: 6,
                }}
              >
                {faq.p}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: 'var(--hx-64748b)',
                  lineHeight: 1.5,
                }}
              >
                {faq.r}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================
          FOOTER APP
      ========================================================= */}

      {/* ⭐ Barra inferior común (antes enlazaba a /app, /app/estudiar y /app/tests, que no existen) */}
      <FooterNavegacion usuario={usuario} oposicionId={usuario?.oposicionActiva?.id} />
    </div>
  );
}

/* =========================================================
   FOOTER BTN
========================================================= */

const footerBtn: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
};
