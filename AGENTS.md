# Reglas para agentes de IA (Claude, Cursor, Codex, Gemini)

Este repo es **Thema**: un sistema de diseño en React 19 + Tailwind 3.4 + Radix con su
documentación (`/docs`) y un esqueleto de aplicación (`/dashboard`, `/usuarios`). Toda pantalla
nueva se arma con lo que ya existe. Estas reglas valen para cualquier IA y para cualquier persona.

## Las cinco reglas

1. **Todo sale del sistema.** Botones, tablas, formularios, avisos, drawers: todo viene de
   `@/components/<familia>`. Consulta `ai-tools/CATALOG.md` (o `catalog.json`) antes de escribir.
   Si no existe la pieza, pregunta; si hay que crearla, es un componente documentado en
   `src/components/<familia>/` + entrada en `src/docs/registry/<grupo>/`, nunca un `div` en la
   pantalla. Ninguna otra librería de interfaz (MUI, Chakra, Ant, Mantine, Headless UI suelto…).
2. **Iconos del registro.** `<ThemaIcon name="search" />` (Hugeicons vía `src/icons/iconRegistry.ts`).
   `lucide-react` solo para nombres que el registro no tiene, y siempre con tamaño heredado o
   `size-4`. Nada de SVG pegados ni iconos exportados de Figma.
3. **Colores y letra del tema.** Solo clases del tema: `bg-primary`, `text-text-secondary`,
   `border-border`, `bg-surface-subtle`, `text-success`, `text-destructive`, `text-warning`.
   Prohibido: hex a mano (`#0C5BEF`), paleta cruda de Tailwind (`bg-blue-500`, `text-gray-600`,
   `bg-neutral-100`), tamaños de letra fijados (`text-[13px]`) fuera de `src/docs`, y `z-[999]`.
   Títulos con `<Heading level>`; texto con `<Text size|variant>` (`@/components/typography`).
4. **Las piezas se ven como vienen.** `className` es para el layout de afuera (márgenes, orden,
   truncado), no para cambiar colores, bordes, radios ni tipografía de un componente.
   Espaciado con la escala (`gap-2`, `gap-4`, `p-card`, `gap-inline`, `space-y-stack`).
   El **ancho de la página lo pone el marco**: `AdminShell config={{ contentWidth }}` con
   `narrow` 720px, `normal` 1140px (por defecto), `wide` 1600px o `full`. Una pantalla nunca
   escribe su propio `max-w-` de página.
5. **Se cierra con la validación.** Antes de dar algo por listo: `npm run check` (reglas del
   sistema) y `npm run verify` (lint + tipos + pruebas + build). Si falla, se arregla; no se
   desactiva la regla ni se pone `eslint-disable`.

## Dónde se trabaja

| Zona | Qué hay | Cuidado |
|---|---|---|
| `src/features/<dominio>/` | Pantallas, `api.ts`, `queries.ts`, `types.ts` (Zod), pruebas | Libre. Aquí va tu pantalla. |
| `src/app/{router.tsx,lazyPages.ts,navigation.ts}` | Rutas y menú | Solo para sumar una pantalla. |
| `src/mocks/` | Backend simulado (MSW) que implementa `docs/API_CONTRACT.md` | Añade el handler de tu endpoint. |
| `src/components/`, `src/docs/registry/` | El sistema y su doc | Solo para crear/documentar un componente reutilizable. |
| `src/styles/`, `src/themes/`, `src/components/app-shell/`, `tailwind.config.js`, `vite*.ts`, `scripts/`, `.github/` | Tokens, temas, shell, configuración | **Protegido.** Lo aprueba ingeniería; `npm run check` avisa si lo tocas. |

## Receta de una pantalla nueva

1. `src/features/<dominio>/<Nombre>Page.tsx` con `PageShell maxWidth="normal"` + `PageHeader`.
2. Datos: `types.ts` (Zod) → `api.ts` (una función por endpoint sobre `api` de `@/lib/api`) →
   `queries.ts` (TanStack Query) → handler en `src/mocks/handlers.ts`. La pantalla envuelve la
   consulta con `QueryBoundary` (carga → error → vacío → datos).
3. Ruta en `src/app/lazyPages.ts` + `src/app/router.tsx`; menú en `src/app/navigation.ts`.
4. Maqueta con los patrones de la doc: `/docs#/guides/estados`, `formularios`, `ventanas`, `botones`.
5. Prueba: unitaria junto al feature (`*.test.tsx`, Vitest + Testing Library + MSW) y, si es un
   recorrido crítico, `e2e/<flujo>.spec.ts` (Playwright).
6. `npm run check && npm run verify`.

## Backend

El frontend espera lo que dice `docs/API_CONTRACT.md` (sobre de respuesta, paginación, errores con
`code` estable). `src/mocks/handlers.ts` es la implementación de referencia: si cambias el contrato,
cambia el doc, el mock y el esquema Zod a la vez. Cliente en `src/lib/api/`, errores en
`ApiError`, caché en `src/lib/query/queryClient.ts`.

## Cómo se entrega

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- Rama por cambio y PR con resumen y plan de pruebas. La CI corre lint, tipos, pruebas, build y e2e.
- Probar en claro, oscuro (`ThemeModeToggle`) y en pantalla angosta (375px).
- Si creaste o cambiaste un componente: entrada en el registry al día y `npm run catalog`.
