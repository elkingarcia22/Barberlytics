# CLAUDE.md

Lee primero `AGENTS.md`: ahí están las reglas (qué librería, qué iconos, qué colores, qué no se
toca y cómo se entrega). Este archivo añade el mapa del repo, las trampas conocidas y cómo cerrar
un trabajo.

## Comandos

```bash
npm ci --legacy-peer-deps   # instalar (react 19 + radix-ui único; sin el flag falla)
npm run dev                 # app + doc en http://localhost:5173 (login admin@thema.dev / thema123)
npm run check               # reglas del sistema de diseño (scripts/check-design-system.mjs)
npm run verify              # lint + type-check + test + build
npm run catalog             # regenera ai-tools/catalog.json y CATALOG.md desde el registry
npm run e2e                 # Playwright (antes: npm run e2e:install)
```

En la app de escritorio el dev server se levanta con `.claude/launch.json` (`thema-dev`, puerto 5195).

## Mapa del repo

- `src/styles/tokens.css` — tokens: color, radio, espaciado, sombras, **motion, capas (z), anchos**.
- `src/styles/globals.css` — mapa semántico shadcn (`--primary`, `--muted`…), `.dark`, utilidades de motion.
- `src/themes/` — 14 presets, `buildTokens.ts`, `ThemeProvider`, `ThemeSelector`.
- `src/components/ui/` — primitivos shadcn/Radix; `src/components/<familia>/` — piezas del producto
  (forms, selection, navigation, overlays, feedback, data-display, date, upload, charts, ai,
  ai-interaction, action-rail, app-shell, layout, media, utility, typography, filters, search).
- `src/icons/` — `iconRegistry.ts` (concepto → Hugeicons) y `ThemaIcon`.
- `src/docs/` — la doc: `registry/<grupo>/<componente>.tsx` (`defineEntry`), `pages/` (fundamentos),
  `pages/guides/` (Empezar y Patrones), `router.ts` (hash), `docsNavigation.ts`, `docsSearchIndex.ts`.
  La doc monta el `AdminShell` real; no tiene shell propio.
- `src/app/` — router, providers, layout, páginas de error. `src/features/` — auth, users, dashboard.
- `src/lib/api/` (cliente, `ApiError`), `src/lib/query/` (`QueryBoundary`, `queryClient`).
- `src/mocks/` — MSW; implementa `docs/API_CONTRACT.md`.
- `ai-tools/` — catálogo generado. `.claude/skills/` — procedimientos. `scripts/` — check y catálogo.
- `docs/` — ARCHITECTURE, API_CONTRACT, THEMING, DEPLOYMENT, DESIGN y las decisiones de cada fase.

## Documentar un componente

`src/docs/registry/<grupo>/<id>.tsx` exporta `xxxEntry = defineEntry({ id, name, group, description,
importPath, sourcePath, status, tags, playground?, examples, props, guidelines, related })` y se suma
al `index.ts` del grupo. Un grupo nuevo se declara en `registry/types.ts` (`DocGroupId` +
`DOC_GROUPS`), en `registry/index.ts` y en `docsNavigation.ts` (`GROUP_ICONS`). Luego `npm run catalog`.
Las páginas de guía viven en `docs/guidePages.ts` + `pages/guides/`.

## Trampas conocidas

- **Tailwind es v3** aunque muchos componentes usan sintaxis v4 (`data-open:`, `in-data-[…]`). Las
  variantes `data-open`/`data-closed` están declaradas a mano en `tailwind.config.js`; una clave
  nueva del tema no llega a un dev server ya arrancado: reinícialo.
- **`radix-ui` es un paquete único**: `import { Dialog as DialogPrimitive } from "radix-ui"`, no
  `@radix-ui/react-dialog`.
- **Motion es `framer-motion`**, no `motion`. Reduced motion se respeta con `motion-reduce:` y en
  `globals.css`.
- **Dos StatusBadge**: `src/components/status-badge.tsx` (animado, legacy) y
  `data-display/StatusBadge.tsx`. Usa el segundo salvo que necesites la animación.
- **Sesión en e2e**: el dev server de Playwright corre en 5197 con `VITE_USE_MOCKS=true`; el
  helper de login está en `e2e/helpers.ts`.
- **Cobertura**: Vitest solo cuenta `src/lib`, `src/features`, `src/themes`, `src/app`. Los
  componentes se prueban con Testing Library junto al archivo y con e2e.
- **`npm run check` compara contra `main`** para detectar archivos protegidos tocados; sin `main`
  local solo mira el árbol de trabajo. Es estricto (error) en `src/features`, `src/app`, `src/lib`
  y `src/mocks`, y avisa (deuda heredada) en el resto de `src/`; `--strict` sube todo a error.
- **El ancho de la página es del marco**: `AdminShell` aplica `config.contentWidth`
  (`narrow` 720 · `normal` 1140 · `wide` 1600 · `full`). Antes era un `max-w-7xl` fijo. Una
  pantalla que escriba su propio `max-w-` de página falla el check.

## Cómo cerrar un trabajo

1. `npm run check` y `npm run verify` en verde. Si tocaste el registry, `npm run catalog`.
2. Revisa la pantalla en claro y oscuro y a 375px (`resize_window` en el navegador integrado).
3. Commit con conventional commits; resumen de PR con qué cambió, por qué y cómo se probó.
4. Si cambiaste una regla o una pieza general, actualiza la página de la doc que la cuenta
   (`pages/guides/*` o `pages/*`) en el mismo cambio.
