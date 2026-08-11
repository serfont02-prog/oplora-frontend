# OPLORA Design System

## Filosofia
OPLORA debe sentirse como una mesa de estudio despejada: calma, clara y preparada para sesiones largas. La interfaz reduce ruido, evita decisiones innecesarias y muestra siempre la siguiente accion con confianza.

## Paleta
- Fondo app: `--op-color-bg` `#f7f4ee`, un blanco calido que cansa menos que el blanco puro.
- Superficie: `--op-color-surface` `#fffdf8` y `--op-color-surface-raised` `#ffffff`.
- Texto principal: `--op-color-ink` `#0d1b2a`.
- Texto secundario: `--op-color-ink-soft` `#39465a` y `--op-color-muted` `#667085`.
- Bordes: `--op-color-border` `#e5dfd4`.
- Accion/progreso: `--op-color-primary` `#1f7cff`.
- Estados: exito `#12805c`, aviso `#b45309`, error `#c24135`.

## Tipografia
- Sans: `--op-font-sans`, para navegacion, controles y UI densa.
- Lectura: `--op-font-reading`, reservada para textos juridicos largos o apuntes.
- Escala recomendada: 12 ayuda, 13 meta, 14 UI compacta, 15 cuerpo, 18 subtitulo, 24 titulo de pantalla, 32 hero de producto.
- Mantener `letter-spacing: 0` salvo pequenos kickers en mayusculas.

## Espaciado
La escala base vive en `globals.css`: 4, 8, 12, 16, 20, 24, 32, 40 y 48 px. Usar 16-24 px para grupos frecuentes y 32-48 px para separar bloques de pantalla.

## Radio y elevacion
- `--op-radius-sm` 8 px para chips y elementos pequenos.
- `--op-radius-md` 12 px para botones y controles.
- `--op-radius-lg` 16 px para paneles.
- `--op-radius-xl` 20 px para estados vacios o superficies destacadas.
- Sombras suaves: elevar solo superficies que necesitan separarse del fondo.

## Componentes
- `Button`: usar `primary` para la accion principal, `secondary` para alternativas claras y `ghost` para navegacion o acciones de baja friccion.
- `EmptyState`: debe explicar que ocurre, por que importa y cual es el siguiente paso. Evitar culpar al usuario.
- `AppFooter`: navegacion inferior fija con `Inicio`, `Estudiar`, `Retos`, `Practicar`, `Alertas`. `Practicar` agrupa tests, flashcards y entrenamiento.

## Guia Por Pantalla
- Inicio: resumen escaneable, accion de continuidad visible y pocos modulos compitiendo.
- Temario: jerarquia por temas, progreso claro y acceso rapido a lectura o practica.
- Leyes: lectura comoda, controles persistentes pero discretos y ancho de linea contenido.
- Tests: foco total en la pregunta, estados de respuesta inequivocos y feedback calmado.
- Flashcards: ritmo rapido, botones grandes y baja carga visual.
- Retos: energia moderada, progreso y recompensa visibles sin convertir la pantalla en juego ruidoso.
- Reader/apuntes: usar ancho de lectura, contraste suave y controles secundarios fuera del flujo del texto.

## Migracion
1. Mantener tokens globales y utilidades en `src/app/globals.css`.
2. Crear primitives en `src/components/ui` antes de migrar pantallas completas.
3. Sustituir estados vacios, botones y footers repetidos de forma gradual.
4. Extraer CSS Modules por pantalla cuando una ruta tenga demasiados estilos inline.
5. Evitar una conversion completa a Tailwind en fase uno; el riesgo es mayor que el beneficio inmediato.
