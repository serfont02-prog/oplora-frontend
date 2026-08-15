const OPLO_BASE_URL = 'https://vvjvjbkjiwxwwiquskrp.supabase.co/storage/v1/object/public/oplo-mascota/oplo-1.jpg';

export function getOploUrl(nivel: number): string {
  const nivelValido = Math.min(5, Math.max(1, nivel || 1));
  return `${OPLO_BASE_URL}/oplo-${nivelValido}.jpg`;
}