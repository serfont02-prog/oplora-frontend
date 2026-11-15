// ⭐ Auditoría A5: una sola regla para saber con qué convocatoria trabaja el usuario.
// Antes cada pantalla cogía la convocatoria «activa» de la lista de la oposición; con dos
// convocatorias en la misma oposición, Temario y Flashcards podían enseñar los temas de una
// mientras tests, liga y duelos usaban la otra.
// Regla: la convocatoria en la que está inscrito el usuario (si es de esta oposición y sigue en
// la lista); si no, la que esté activa; si no hay ninguna activa, la más reciente.

type ConvocatoriaMinima = { id: string; estado?: string; anyo?: number };

export function elegirConvocatoria<T extends ConvocatoriaMinima>(
  convocatorias: T[] | null | undefined,
  usuario: any,
  oposicionId?: string | null,
): T | null {
  const lista = Array.isArray(convocatorias) ? convocatorias : [];
  if (!lista.length) return null;

  const activaUsuario = usuario?.oposicionActiva;
  const mismaOposicion = !oposicionId || !activaUsuario?.id || activaUsuario.id === oposicionId;
  const idUsuario = mismaOposicion ? activaUsuario?.convocatoriaActiva?.id : null;
  const delUsuario = idUsuario ? lista.find((c) => c.id === idUsuario) : null;
  if (delUsuario) return delUsuario;

  return (
    lista.find((c) => c.estado === 'activa') ??
    [...lista].sort((a, b) => (b.anyo ?? 0) - (a.anyo ?? 0))[0] ??
    null
  );
}
