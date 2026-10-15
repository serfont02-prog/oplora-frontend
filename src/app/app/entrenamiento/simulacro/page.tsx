'use client';

// ⭐ Elegir simulacro — mismo sistema que el resto de Practicar.

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Landmark, Shuffle, ChevronRight } from 'lucide-react';
import { FooterNavegacion } from '@/app/app/dashboard/page';
import CabeceraPractica, { SOMBRA } from '@/components/entrenamiento/CabeceraPractica';
import { COLOR_SIMULACRO, COLOR_SIMULACRO_BG } from '@/components/entrenamiento/ExamenSimulacro';
import { BG_DASHBOARD as BG_APP, TEXT_PRIMARY, TEXT_MUTED, TEXT_SECONDARY } from '@/styles/tokens';

export default function SeleccionarSimulacroPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  if (!usuario) return null;

  const opciones = [
    {
      Icon: Landmark, titulo: 'Simulacro oficial', href: '/app/entrenamiento/simulacro/oficial',
      texto: 'Un examen real de una convocatoria anterior, con sus preguntas tal como salieron ese día.',
    },
    {
      Icon: Shuffle, titulo: 'Simulacro OPLORA', href: '/app/entrenamiento/simulacro/generado',
      texto: 'Un examen nuevo con la estructura y el tiempo de tu convocatoria, con preguntas de todo el temario y la normativa.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 90 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <CabeceraPractica eyebrow="Practicar" titulo="Simulacro de examen" onVolver={() => router.push('/app/entrenamiento')} usuario={usuario} onPerfil={() => router.push('/app/perfil')} />

        <section>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 8, padding: '0 4px' }}>Elige el tipo de simulacro</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {opciones.map(({ Icon, titulo, texto, href }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', background: 'white', border: 'none', borderRadius: 18, padding: 16, boxShadow: SOMBRA, cursor: 'pointer' }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 13, background: COLOR_SIMULACRO_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={22} color={COLOR_SIMULACRO} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>{titulo}</div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2, lineHeight: 1.45 }}>{texto}</div>
                </div>
                <ChevronRight size={16} color="#C4C9D2" style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </section>
      </div>
      <FooterNavegacion usuario={usuario} oposicionId={usuario?.oposicionActiva?.id} activo="practicar" />
    </div>
  );
}
