/**
 * Design tokens centralizados de OPLORA.
 *
 * Objetivo: evitar que cada `page.tsx` redeclare localmente las mismas
 * constantes de color (TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, y los
 * colores de categoría COLOR_RETOS / COLOR_FC / COLOR_PSICO / COLOR_SEMANAL),
 * de forma que un cambio de marca se haga en un único sitio.
 *
 * IMPORTANTE: los `BG_APP` de cada pantalla NO se centralizan aquí a
 * propósito: cada sección de la app usa un tono de fondo pastel propio por
 * diseño (dashboard azul, retos naranja/salmón, flashcards lila, tema
 * marrón pastel, etc.) y no son el mismo valor repetido, así que
 * centralizarlos perdería esa diferenciación visual intencional.
 *
 * Ver también: `src/design-system/OPLORA_DESIGN_SYSTEM.md` para las
 * variables CSS globales (`--op-color-*`) usadas por componentes como
 * `EmptyState`. Estos tokens en TS son los que usan directamente los
 * `page.tsx` existentes vía `style={{ color: TEXT_MUTED }}`, etc.
 */

// Texto semántico (compartido por casi todas las pantallas)
export const TEXT_PRIMARY = '#111827';
export const TEXT_SECONDARY = '#6B7280';

/**
 * TEXT_MUTED — corregido por auditoría de accesibilidad (WCAG AA).
 *
 * Antes: '#9CA3AF' sobre fondo blanco/casi blanco da un contraste ~2.8:1,
 * por debajo del mínimo AA (4.5:1 texto normal / 3:1 texto grande).
 *
 * Ahora: se usa el mismo gris que TEXT_SECONDARY ('#6B7280', gris Tailwind
 * 500, contraste ~4.6:1 sobre blanco), que ya está validado visualmente en
 * la app. Se prioriza shipear el fix de contraste sobre mantener dos tonos
 * de gris distintos.
 */
export const TEXT_MUTED = '#6B7280';

// Colores de categoría (retos, flashcards, psicotécnicos, reto semanal)
export const COLOR_RETOS = '#C2410C';
export const COLOR_RETOS_BG = '#FACCC0';

export const COLOR_FC = '#9333EA';
export const COLOR_FC_BG = '#F3E8FF';

export const COLOR_PSICO = '#4F46E5';
export const COLOR_PSICO_BG = '#E0E7FF';

export const COLOR_SEMANAL = '#7C3AED';
export const COLOR_SEMANAL_BG = '#F3F0FC';
