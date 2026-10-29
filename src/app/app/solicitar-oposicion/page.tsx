import { redirect } from 'next/navigation';

// ⭐ El formulario antiguo no enviaba nada (prometía un email que nunca llegaba). Las peticiones
// de oposiciones nuevas llegan por Soporte. Solo redirige; se puede borrar la carpeta.
export default function SolicitarOposicionRetirado() {
  redirect('/app/soporte');
}
