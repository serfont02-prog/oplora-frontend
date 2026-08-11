'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth'; 
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
        background: '#f8fafc',
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
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e5e7eb',
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
              color: '#6b7280',
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
              background: '#EEF2FF',
              color: '#4338CA',
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
              color: '#0f172a',
              margin: 0,
              marginBottom: 10,
            }}
          >
            Elige cómo quieres preparar tu oposición
          </h1>

          <p
            style={{
              margin: 0,
              color: '#64748b',
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
                background: 'white',
                borderRadius: 22,
                border: seleccionada
                  ? '2px solid #0f172a'
                  : suscripcion.recomendado
                  ? '2px solid #1F7CFF'
                  : '1px solid #e5e7eb',
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
                    background: '#DCFCE7',
                    color: '#15803D',
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
                      color: '#0f172a',
                    }}
                  >
                    {suscripcion.nombre}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: '#64748b',
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
                      color: '#0f172a',
                      lineHeight: 1,
                    }}
                  >
                    {suscripcion.precio}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: '#94a3b8',
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
                      <Check size={15} color="#16A34A" />
                    ) : (
                      <X size={15} color="#94A3B8" />
                    )}

                    <span
                      style={{
                        fontSize: 14,
                        color: '#334155',
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
                    ? '#e5e7eb'
                    : suscripcion.recomendado
                    ? '#1F7CFF'
                    : '#0f172a',
                  color: esActual ? '#64748b' : 'white',
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
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 18,
            padding: '1.2rem',
            marginTop: 4,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#0f172a',
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
                  i !== 2 ? '1px solid #f1f5f9' : 'none',
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#0f172a',
                  marginBottom: 6,
                }}
              >
                {faq.p}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: '#64748b',
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

      <footer
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          background: 'white',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -2px 6px rgba(0,0,0,0.06)',
          zIndex: 50,
        }}
      >
        <button
          onClick={() => router.push('/app')}
          style={footerBtn}
        >
          <Home size={24} color="#1F7CFF" />
          <span style={{ fontSize: 11, color: '#1F7CFF' }}>
            Inicio
          </span>
        </button>

        <button
          onClick={() => router.push('/app/estudiar')}
          style={footerBtn}
        >
          <BookOpen size={24} color="#B45309" />
          <span style={{ fontSize: 11, color: '#B45309' }}>
            Estudiar
          </span>
        </button>

        <button
          onClick={() => router.push('/app/retos')}
          style={footerBtn}
        >
          <Flame size={24} color="#EF4444" />
          <span style={{ fontSize: 11, color: '#EF4444' }}>
            Retos
          </span>
        </button>

        <button
          onClick={() => router.push('/app/tests')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <ClipboardDocumentCheckIcon
            style={{
              width: 26,
              height: 26,
              color: '#0EA5E9',
            }}
          />
          <span style={{ fontSize: 11, color: '#0EA5E9' }}>
            Tests
          </span>
        </button>

        <button
          onClick={() => router.push('/app/alertas')}
          style={footerBtn}
        >
          <Bell size={24} color="#FACC15" />
          <span style={{ fontSize: 11, color: '#FACC15' }}>
            Alertas
          </span>
        </button>
      </footer>
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
