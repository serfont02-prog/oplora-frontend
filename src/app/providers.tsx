'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AvisoConexion, { EVENTO_ERROR_CARGA } from '@/components/ui/AvisoConexion';
import { useState } from 'react';
import { AuthProvider } from '@/lib/auth';
import { ProveedorTema } from '@/lib/tema';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30000, retry: 1 },
    },
    // ⭐ En la app: si una carga falla por la red o porque el servidor no responde (5xx) y no hay
    // datos anteriores que enseñar, se muestra el aviso con "Reintentar" (AvisoConexion).
    queryCache: new QueryCache({
      onError: (error: any, query) => {
        if (typeof window === 'undefined' || !window.location.pathname.startsWith('/app')) return;
        if (query.state.data !== undefined) return;
        const status = error?.response?.status;
        if (status && status < 500) return; // 4xx: lo gestiona cada pantalla (límites, permisos…)
        window.dispatchEvent(new Event(EVENTO_ERROR_CARGA));
      },
    }),
    // ⭐ En el panel de admin muchas acciones fallaban en silencio. Si una acción del admin
    // falla y su pantalla no gestiona el error, se muestra un aviso con el motivo.
    mutationCache: new MutationCache({
      onError: (error: any, _vars, _ctx, mutation) => {
        if (typeof window === 'undefined' || !window.location.pathname.startsWith('/admin')) return;
        if (mutation.options.onError) return;
        const m = error?.response?.data?.message;
        avisoAdmin(Array.isArray(m) ? m.join('. ') : m || 'La acción no se ha podido completar');
      },
    }),
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ProveedorTema>
        <AuthProvider>
          {children}
          <AvisoConexion />
        </AuthProvider>
      </ProveedorTema>
    </QueryClientProvider>
  );
}

/** Aviso flotante sencillo para errores del panel de admin (sin dependencias). */
function avisoAdmin(texto: string) {
  const el = document.createElement('div');
  el.textContent = texto;
  el.setAttribute('role', 'alert');
  Object.assign(el.style, {
    position: 'fixed', right: '20px', bottom: '20px', zIndex: '9999', maxWidth: '420px',
    background: '#991b1b', color: 'white', padding: '10px 14px', borderRadius: '10px',
    fontSize: '13px', lineHeight: '1.4', boxShadow: '0 6px 20px rgba(0,0,0,0.2)', cursor: 'pointer',
  } as CSSStyleDeclaration);
  el.onclick = () => el.remove();
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 6000);
}
