---
name: revisar-contra-el-sistema
description: Revisar una pantalla o un cambio contra las reglas del sistema de diseño Thema. Busca lo que se dibujó a mano pudiendo salir del sistema, colores y letra fuera del tema, iconos fuera del registro, y documenta lo que sí hubo que forzar. Se activa al pedir "revisa esto", "¿está bien?", antes de entregar o de abrir un PR.
---

# Revisar contra el sistema

1. `npm run check --changed` (o sin `--changed` para todo `src/`). Cada hallazgo trae archivo,
   línea y regla. Arregla los errores; los avisos de archivos protegidos se comentan en el PR.
2. Lee el diff (`git diff main...HEAD -- src/`) y busca lo que el check no ve:
   - `div` con borde, fondo y padding que ya es `Card`, `ListItem`, `EmptyState`, `Alert` o `Badge`.
   - `<h1>`–`<h4>` o `<p>` con clases de tamaño en vez de `Heading`/`Text`.
   - `Label` suelto en vez de `Field`. `Select` con más de ~8 opciones (→ `SearchableSelect`).
   - Un `Dialog` para crear/editar (→ `DrawerShell`); un `Sheet` para confirmar (→ `ConfirmDialog`).
   - Dos primarios en la misma vista; botón de solo icono sin `aria-label`.
   - Estados vacío/carga/error dibujados a mano en vez de `QueryBoundary` + `EmptyState`.
   - `className` que cambia color, radio o tipografía de un componente del sistema.
   - Iconos con `size` fuera de 14/16/20 o SVG pegado. Colores de estado usados para decorar.
3. Comprueba en el navegador integrado: claro y oscuro (`ThemeModeToggle`), 375px y 1440px,
   teclado (Tab por todos los controles, Esc cierra overlays).
4. Reporta en tres listas: **arreglar** (rompe una regla), **decidir** (dos formas válidas de hacer
   lo mismo; propón una) y **forzado** (lo que el sistema no cubre; candidato a componente nuevo).
