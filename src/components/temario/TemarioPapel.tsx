'use client';

// ⭐ Temario en papel: el temario completo impreso se vende aparte (los apuntes se estudian
// dentro de la app y ya no se descargan). Aquí están las piezas que lo enlazan desde la app:
// - useTemarioPapel: ficha del temario de la oposición (solo si el admin la ha activado).
// - TarjetaTemarioPapel: tarjeta para la pestaña Material de los temas.
// - BotonEnPapel: botón pequeño para la cabecera del lector de apuntes.

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { BookCopy, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';

export type ProductoTemarioPapel = {
  activo: boolean;
  titulo: string;
  edicion: string;
  paginas: number | null;
  tomos: number | null;
  encuadernacion: string;
  precio: number | null;
  gastosEnvio: number | null;
  plazoEnvio: string;
  descripcion: string;
  imagenes: string[];
};

export function useTemarioPapel(oposicionId?: string) {
  return useQuery<{ producto: ProductoTemarioPapel | null; interesado: boolean }>({
    queryKey: ['temario-papel', oposicionId],
    queryFn: async () => (await api.get(`/temario-papel/oposicion/${oposicionId}`)).data,
    enabled: !!oposicionId,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export const formatoEuros = (n: number) =>
  n.toLocaleString('es-ES', { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }) + ' €';

export function resumenProducto(p: ProductoTemarioPapel) {
  return [
    p.paginas ? `${p.paginas} páginas` : null,
    p.tomos ? (p.tomos === 1 ? '1 tomo' : `${p.tomos} tomos`) : null,
    p.edicion || null,
  ].filter(Boolean).join(' · ');
}

export function TarjetaTemarioPapel({ oposicionId }: { oposicionId?: string }) {
  const router = useRouter();
  const { data } = useTemarioPapel(oposicionId);
  const p = data?.producto;
  if (!p) return null;
  const portada = p.imagenes[0];
  return (
    <button
      onClick={() => router.push('/app/temario-papel')}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 12, textAlign: 'left', cursor: 'pointer',
        background: 'var(--c-superficie)', border: 'none', borderRadius: 18, boxShadow: 'var(--c-sombra)',
      }}
    >
      {portada ? (
        <img src={portada} alt="" style={{ width: 46, height: 60, objectFit: 'cover', objectPosition: 'top', borderRadius: 5, flexShrink: 0, background: '#fff', boxShadow: '0 2px 6px rgba(15,23,42,0.18)' }} />
      ) : (
        <span style={{ width: 46, height: 60, borderRadius: 8, background: 'var(--c-azul-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BookCopy size={20} color="var(--c-azul)" />
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-azul)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>En papel</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-texto)', marginTop: 1 }}>{p.titulo}</div>
        <div style={{ fontSize: 12, color: 'var(--c-texto-3)', marginTop: 2 }}>
          {data?.interesado ? 'Te avisaremos cuando puedas pedirlo' : resumenProducto(p) || 'Impreso y encuadernado'}
        </div>
      </div>
      <ChevronRight size={16} color="var(--c-chevron)" style={{ flexShrink: 0 }} />
    </button>
  );
}

export function BotonEnPapel({ oposicionId }: { oposicionId?: string }) {
  const router = useRouter();
  const { data } = useTemarioPapel(oposicionId);
  if (!data?.producto) return null;
  return (
    <button
      onClick={() => router.push('/app/temario-papel')}
      aria-label="Temario en papel"
      style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 999, cursor: 'pointer',
        border: 'none', background: 'var(--c-azul-bg)', color: 'var(--c-azul)', fontSize: 12, fontWeight: 700,
      }}
    >
      <BookCopy size={14} />
      En papel
    </button>
  );
}
