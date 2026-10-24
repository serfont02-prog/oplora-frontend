/**
 * Design tokens centralizados de OPLORA.
 *
 * Objetivo: evitar que cada `page.tsx` redeclare localmente las mismas
 * constantes de color (TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, y los
 * colores de categoría COLOR_RETOS / COLOR_FC / COLOR_PSICO / COLOR_SEMANAL),
 * de forma que un cambio de marca se haga en un único sitio.
 *
 * SISTEMA "COLOR POR ACTIVIDAD" (5 familias, documentado formalmente aquí y
 * en `src/design-system/OPLORA_DESIGN_SYSTEM.md`):
 *   1. Dashboard     → azul    (BG_DASHBOARD)
 *   2. Retos         → naranja/salmón (BG_RETOS)
 *   3. Flashcards    → lila/morado (BG_FLASHCARDS)
 *   4. Tema          → marrón pastel (BG_TEMA)
 *   5. Alertas       → amarillo pastel (BG_ALERTAS)
 *
 * Cada sección de la app debe usar el `BG_*` de su propia familia en todas
 * sus subpantallas (p. ej. todo lo que cuelga de Entrenamiento/Dashboard usa
 * BG_DASHBOARD, no un gris genérico suelto). Esto es intencional: no se
 * colapsan en un único valor porque la diferenciación visual por actividad
 * es parte del diseño.
 *
 * Para pantallas que NO pertenecen a ninguna de las 5 familias de actividad
 * (listados neutros, configuración, catálogos, resultados, etc.) se usa
 * BG_NEUTRAL en vez de literales sueltos como '#f9fafb', '#FAF9F6' o
 * '#f8fafc', que eran variaciones casi idénticas sin ninguna diferencia de
 * diseño intencional entre ellas.
 *
 * Ver también: `src/design-system/OPLORA_DESIGN_SYSTEM.md` para las
 * variables CSS globales (`--op-color-*`) usadas por componentes como
 * `EmptyState`. Estos tokens en TS son los que usan directamente los
 * `page.tsx` existentes vía `style={{ color: TEXT_MUTED }}`, etc.
 */

// ⭐ TEMA CLARO/OSCURO: los valores son variables CSS (definidas en app/globals.css con su
// versión clara y oscura). En claro se ven exactamente igual que antes. El modo oscuro solo
// se aplica dentro de las pantallas preparadas (contenedor con la clase `op-tema`).

// Superficies y elementos comunes
export const SUPERFICIE = 'var(--c-superficie)';
export const SUPERFICIE_2 = 'var(--c-superficie-2)';
export const BORDE = 'var(--c-borde)';
export const PISTA = 'var(--c-pista)';
export const CHEVRON = 'var(--c-chevron)';
export const SOMBRA = 'var(--c-sombra)';
export const PRIMARIO = 'var(--c-primario)';
export const PRIMARIO_TEXTO = 'var(--c-primario-texto)';
export const HERO = 'var(--c-hero)';
export const AZUL = 'var(--c-azul)';
export const AZUL_BG = 'var(--c-azul-bg)';
export const VERDE = 'var(--c-verde)';
export const VERDE_BG = 'var(--c-verde-bg)';

// Texto semántico (compartido por casi todas las pantallas)
export const TEXT_PRIMARY = 'var(--c-texto)';
export const TEXT_SECONDARY = 'var(--c-texto-2)';

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
export const TEXT_MUTED = 'var(--c-texto-3)';

// Colores de categoría (retos, flashcards, psicotécnicos, reto semanal)
export const COLOR_RETOS = 'var(--c-retos)';
export const COLOR_RETOS_BG = 'var(--c-retos-bg)';

export const COLOR_FC = 'var(--c-fc)';
export const COLOR_FC_BG = 'var(--c-fc-bg)';

export const COLOR_PSICO = 'var(--c-psico)';
export const COLOR_PSICO_BG = 'var(--c-psico-bg)';

export const COLOR_SEMANAL = 'var(--c-semanal)';
export const COLOR_SEMANAL_BG = 'var(--c-semanal-bg)';

export const COLOR_ALERTAS = 'var(--c-alertas)';
export const COLOR_ALERTAS_BG = 'var(--c-alertas-bg)';

// Fondos de pantalla ("BG_APP") por familia de actividad — las 5 familias
// documentadas arriba. Usar el que corresponda a la sección, no un gris
// suelto inventado en cada page.tsx.
export const BG_DASHBOARD = 'var(--c-bg-dashboard)';
export const BG_RETOS = 'var(--c-bg-retos)';
export const BG_FLASHCARDS = 'var(--c-bg-flashcards)';
export const BG_TEMA = 'var(--c-bg-tema)';
export const BG_ALERTAS = 'var(--c-bg-alertas)';

// Fondo neutro compartido para pantallas que no pertenecen a ninguna de las
// 5 familias de actividad (listados, configuración, resultados, catálogos...).
// Sustituye a los literales casi-duplicados '#f9fafb' / '#FAF9F6' / '#f8fafc'
// / '#F4F5F7' que estaban repartidos sin ninguna diferencia intencional.
export const BG_NEUTRAL = 'var(--c-bg-neutral)';
