import { redirect } from 'next/navigation';

// ⭐ El ranking se ha retirado hasta que se diseñe la "Liga Oplora".
// Esta página solo redirige; se puede borrar la carpeta app/app/ranking entera.
export default function RankingRetirado() {
  redirect('/app/dashboard');
}
