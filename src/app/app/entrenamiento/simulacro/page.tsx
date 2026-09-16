'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ArrowLeft } from 'lucide-react';

const BG_APP = '#F4F5F7';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';

export default function SeleccionarSimulacroPage() {
  const router = useRouter();
  const { usuario } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: BG_APP }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '1.5rem' }}>

        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY, fontSize: 13, marginBottom: 24 }}>
          <ArrowLeft size={15} />
          Volver
        </button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🎯</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY }}>Elige tu simulacro</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <button
            onClick={() => router.push('/app/entrenamiento/simulacro/oficial')}
            style={{ textAlign: 'left', background: 'white', border: '1px solid #F1F5F9', borderRadius: 18, padding: 20, cursor: 'pointer' }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 4 }}>Simulacro oficial</div>
            <div style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
              Haz un examen real de una convocatoria anterior, con sus preguntas exactas tal como salieron ese día.
            </div>
          </button>

          <button
            onClick={() => router.push('/app/entrenamiento/simulacro/generado')}
            style={{ textAlign: 'left', background: 'white', border: '1px solid #F1F5F9', borderRadius: 18, padding: 20, cursor: 'pointer' }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 4 }}>Simulacro OPLORA</div>
            <div style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
              Examen generado con la misma estructura y tiempo real, mezclando preguntas de todo el temario y la normativa.
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}