import { redirect } from 'next/navigation';

// ⭐ Ficha pública antigua de una oposición (con "temas de ejemplo"). Solo redirige.
export default function FichaCatalogoRetirada() {
  redirect('/app/onboarding/oposicion');
}
