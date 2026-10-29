'use client';

// ⭐ Antes era una segunda barra inferior distinta (sin usar). Ahora es solo un alias de la barra
// única de la app, por si algún archivo la importa. Se puede borrar este archivo.
import { useAuth } from '@/lib/auth';
import { FooterNavegacion, type SeccionFooter } from './FooterNavegacion';

export default function AppFooter({ oposicionId, activo }: { oposicionId?: string; activo?: SeccionFooter }) {
  const { usuario } = useAuth();
  return <FooterNavegacion usuario={usuario} oposicionId={oposicionId ?? usuario?.oposicionActiva?.id} activo={activo} />;
}
