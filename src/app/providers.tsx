'use client';

import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/lib/auth';
import { ProveedorTema } from '@/lib/tema';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30000, retry: 1 },
    },
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
