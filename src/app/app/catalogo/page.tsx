import { redirect } from 'next/navigation';

// ⭐ Catálogo antiguo (estilo previo y sin enlaces desde la app): para elegir oposición está el
// selector del onboarding. Solo redirige; se puede borrar la carpeta app/app/catalogo.
export default function CatalogoRetirado() {
  redirect('/app/onboarding/oposicion');
}
