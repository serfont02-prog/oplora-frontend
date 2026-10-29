import { redirect } from 'next/navigation';

// ⭐ Pantalla antigua (barra con emojis y todas las oposiciones mezcladas) que ya no enlaza nada:
// el progreso está en Inicio y en cada tema. Solo redirige; se puede borrar la carpeta app/app/progreso.
export default function ProgresoRetirado() {
  redirect('/app/dashboard');
}
