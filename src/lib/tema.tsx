'use client';

// ⭐ Tema claro / oscuro / automático (sigue al móvil).
// La preferencia se guarda en este dispositivo (localStorage). El atributo data-tema de <html>
// ('claro' | 'oscuro') lo pone ya el script de app/layout.tsx antes de pintar (sin destello blanco);
// aquí se mantiene sincronizado al cambiar la preferencia o el modo del móvil.

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type PreferenciaTema = 'claro' | 'oscuro' | 'auto';
export const CLAVE_TEMA = 'oplora-tema';
// Mientras se pasan las pantallas al modo oscuro, por defecto todo el mundo ve el modo claro.
// Cuando esté toda la app convertida, cambiar a 'auto' (aquí y en SCRIPT_TEMA lo coge de esta constante).
export const TEMA_POR_DEFECTO: PreferenciaTema = 'claro';

type Ctx = { preferencia: PreferenciaTema; efectivo: 'claro' | 'oscuro'; cambiar: (p: PreferenciaTema) => void };
const TemaContext = createContext<Ctx>({ preferencia: 'claro', efectivo: 'claro', cambiar: () => {} });

function leerPreferencia(): PreferenciaTema {
  try {
    const v = localStorage.getItem(CLAVE_TEMA);
    if (v === 'claro' || v === 'oscuro' || v === 'auto') return v;
  } catch { /* sin almacenamiento */ }
  return TEMA_POR_DEFECTO;
}

function calcular(p: PreferenciaTema): 'claro' | 'oscuro' {
  if (p === 'auto') {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  }
  return p;
}

export function ProveedorTema({ children }: { children: React.ReactNode }) {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>(TEMA_POR_DEFECTO);
  const [efectivo, setEfectivo] = useState<'claro' | 'oscuro'>('claro');

  const aplicar = useCallback((p: PreferenciaTema) => {
    const e = calcular(p);
    setEfectivo(e);
    document.documentElement.setAttribute('data-tema', e);
  }, []);

  useEffect(() => {
    const p = leerPreferencia();
    setPreferencia(p);
    aplicar(p);
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const alCambiar = () => { if (leerPreferencia() === 'auto') aplicar('auto'); };
    mq?.addEventListener?.('change', alCambiar);
    return () => mq?.removeEventListener?.('change', alCambiar);
  }, [aplicar]);

  const cambiar = useCallback((p: PreferenciaTema) => {
    try { localStorage.setItem(CLAVE_TEMA, p); } catch { /* sin almacenamiento */ }
    setPreferencia(p);
    aplicar(p);
  }, [aplicar]);

  return <TemaContext.Provider value={{ preferencia, efectivo, cambiar }}>{children}</TemaContext.Provider>;
}

export const useTema = () => useContext(TemaContext);

/** Script que se ejecuta antes de pintar: pone data-tema según la preferencia guardada. */
export const SCRIPT_TEMA = `(function(){try{var p=localStorage.getItem('${CLAVE_TEMA}')||'${TEMA_POR_DEFECTO}';var o=p==='oscuro'||(p==='auto'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-tema',o?'oscuro':'claro');}catch(e){}})();`;
