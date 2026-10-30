'use client';

// ⭐ Selección propia para subrayar en el móvil (apuntes y artículos).
// Con la selección del navegador, Chrome muestra siempre su menú (Copiar, Seleccionar todo…)
// encima del texto y no hay forma de quitarlo. Aquí, en pantallas táctiles, el texto no se
// selecciona con el sistema: se mantiene pulsada una palabra (~0,45 s), se arrastra para
// alargar y al soltar la app recibe el rango y enseña su propio botón "Subrayar".
// La selección se pinta con la API de resaltados de CSS (::highlight(oplora-seleccion)).

import { useEffect, useRef } from 'react';
import { esPantallaTactil } from './BotonSubrayar';

const NOMBRE_RESALTADO = 'oplora-seleccion';
const ESPERA_MS = 450;
const TOLERANCIA_PX = 10;

type Punto = { node: Node; offset: number };

function caretEn(x: number, y: number): Punto | null {
  const d = document as any;
  if (typeof d.caretPositionFromPoint === 'function') {
    const p = d.caretPositionFromPoint(x, y);
    if (p?.offsetNode) return { node: p.offsetNode, offset: p.offset };
  }
  if (typeof d.caretRangeFromPoint === 'function') {
    const r: Range | null = d.caretRangeFromPoint(x, y);
    if (r) return { node: r.startContainer, offset: r.startOffset };
  }
  return null;
}

const esLetra = (c: string | undefined) => !!c && /[\p{L}\p{N}ºª'’-]/u.test(c);

function palabraEn(p: Punto): { inicio: Punto; fin: Punto } | null {
  if (p.node.nodeType !== Node.TEXT_NODE) return null;
  const t = p.node.textContent ?? '';
  let s = Math.min(p.offset, t.length);
  let e = s;
  while (s > 0 && esLetra(t[s - 1])) s--;
  while (e < t.length && esLetra(t[e])) e++;
  if (s === e) {
    if (p.offset < t.length && t[p.offset].trim()) e = p.offset + 1;
    else return null;
  }
  return { inicio: { node: p.node, offset: s }, fin: { node: p.node, offset: e } };
}

function antes(a: Punto, b: Punto): boolean {
  const r = document.createRange();
  r.setStart(a.node, a.offset);
  r.setEnd(b.node, b.offset);
  return !r.collapsed || (a.node === b.node && a.offset === b.offset);
}

function pintar(rango: Range | null) {
  const css = (window as any).CSS;
  const H = (window as any).Highlight;
  if (!css?.highlights || !H) return;
  if (rango) css.highlights.set(NOMBRE_RESALTADO, new H(rango));
  else css.highlights.delete(NOMBRE_RESALTADO);
}

export function useSeleccionTactil({
  obtenerContenedor,
  onSeleccion,
  onLimpiar,
}: {
  /** Elemento dentro del cual se puede seleccionar a partir del nodo tocado (o null). */
  obtenerContenedor: (nodo: Element) => Element | null;
  onSeleccion: (rango: Range) => void;
  onLimpiar: () => void;
}) {
  const cb = useRef({ obtenerContenedor, onSeleccion, onLimpiar });
  cb.current = { obtenerContenedor, onSeleccion, onLimpiar };
  /** true mientras se está seleccionando (para que, p. ej., el deslizar entre artículos no actúe). */
  const seleccionando = useRef(false);

  useEffect(() => {
    if (!esPantallaTactil()) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let origen: { x: number; y: number } | null = null;
    let contenedor: Element | null = null;
    let ancla: { inicio: Punto; fin: Punto } | null = null;
    let rango: Range | null = null;
    let hayRango = false;

    const limpiar = () => {
      pintar(null);
      rango = null;
      if (hayRango) { hayRango = false; cb.current.onLimpiar(); }
    };

    const alTocar = (e: TouchEvent) => {
      if (e.touches.length !== 1) { clearTimeout(timer); return; }
      const objetivo = e.target as Element | null;
      if (objetivo?.closest?.('[data-menu-subrayado]')) return;
      if (hayRango) limpiar();
      const c = objetivo ? cb.current.obtenerContenedor(objetivo) : null;
      if (!c) return;
      const t = e.touches[0];
      origen = { x: t.clientX, y: t.clientY };
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!origen) return;
        const p = caretEn(origen.x, origen.y);
        if (!p || !c.contains(p.node)) return;
        const w = palabraEn(p);
        if (!w) return;
        contenedor = c;
        ancla = w;
        seleccionando.current = true;
        rango = document.createRange();
        rango.setStart(w.inicio.node, w.inicio.offset);
        rango.setEnd(w.fin.node, w.fin.offset);
        pintar(rango);
        try { navigator.vibrate?.(12); } catch { /* sin vibración */ }
      }, ESPERA_MS);
    };

    const alMover = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!seleccionando.current) {
        if (origen && t && (Math.abs(t.clientX - origen.x) > TOLERANCIA_PX || Math.abs(t.clientY - origen.y) > TOLERANCIA_PX)) {
          clearTimeout(timer);
          origen = null;
        }
        return;
      }
      e.preventDefault(); // mientras se selecciona, el dedo no desplaza la página
      if (!t || !contenedor || !ancla) return;
      const p = caretEn(t.clientX, t.clientY);
      if (!p || !contenedor.contains(p.node)) return;
      const w = palabraEn(p) ?? { inicio: p, fin: p };
      const r = document.createRange();
      if (antes(w.inicio, ancla.inicio) && !(w.inicio.node === ancla.inicio.node && w.inicio.offset === ancla.inicio.offset)) {
        r.setStart(w.inicio.node, w.inicio.offset);
        r.setEnd(ancla.fin.node, ancla.fin.offset);
      } else {
        r.setStart(ancla.inicio.node, ancla.inicio.offset);
        r.setEnd(w.fin.node, w.fin.offset);
      }
      rango = r;
      pintar(rango);
    };

    const alSoltar = (e: TouchEvent) => {
      clearTimeout(timer);
      origen = null;
      if (!seleccionando.current) return;
      seleccionando.current = false;
      e.preventDefault(); // que el toque largo no acabe en "clic" sobre un subrayado o un enlace
      if (rango && rango.toString().trim().length >= 2) {
        hayRango = true;
        cb.current.onSeleccion(rango);
      } else {
        limpiar();
      }
    };

    // Sin menú contextual del sistema dentro del texto seleccionable
    const alMenuContextual = (e: Event) => {
      const objetivo = e.target as Element | null;
      if (objetivo && cb.current.obtenerContenedor(objetivo)) e.preventDefault();
    };

    document.addEventListener('touchstart', alTocar, { passive: true });
    document.addEventListener('touchmove', alMover, { passive: false });
    document.addEventListener('touchend', alSoltar, { passive: false });
    document.addEventListener('touchcancel', alSoltar, { passive: false });
    document.addEventListener('contextmenu', alMenuContextual);
    return () => {
      clearTimeout(timer);
      pintar(null);
      document.removeEventListener('touchstart', alTocar);
      document.removeEventListener('touchmove', alMover);
      document.removeEventListener('touchend', alSoltar);
      document.removeEventListener('touchcancel', alSoltar);
      document.removeEventListener('contextmenu', alMenuContextual);
    };
  }, []);

  return { seleccionando, quitarResaltado: () => pintar(null) };
}
