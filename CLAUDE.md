# CLAUDE.md

Lee primero `AGENTS.md`: ahí están las reglas (qué librería, qué iconos, qué colores, qué no se
toca y cómo se entrega). Este archivo añade el mapa del repo, las trampas conocidas y cómo cerrar
un trabajo.

## Comandos

```bash
npm ci --legacy-peer-deps   # instalar (react 19 + radix-ui único; sin el flag falla)
npm run dev                 # app + doc en http://localhost:5173 (login: celular 3001234567, código 246810)
npm run dev:main            # lo mismo, pero trae `main` de GitHub cada 30 s (es el que usa el 5195)
npm run check               # reglas del sistema de diseño (scripts/check-design-system.mjs)
npm run verify              # lint + type-check + test + build
npm run catalog             # regenera el catálogo de componentes en ai-tools/ desde el registry
npm run codemap             # regenera ai-tools/CODEMAP.md (rutas, endpoints, exports) desde src/
npm run e2e                 # Playwright (antes: npm run e2e:install)
npm run estado              # qué copias (worktrees) tienen trabajo que main no tiene
```

En la app de escritorio el dev server se levanta con `.claude/launch.json`. **`thema-dev` (5195) sirve
siempre `main` desde la carpeta principal del repo**, no la copia de la sesión: es «lo último».
Corre con `npm run dev:main` (`scripts/dev-main.mjs`): cada 30 s trae `main` de GitHub y Vite recarga
solo, así lo que otra sesión sube se ve sin hacer `git pull`. Solo avanza hacia adelante: si la carpeta
está en otra rama, tiene commits sin subir o cambios sin guardar que chocarían, no toca nada y lo
avisa en la consola. Para ver
tu copia antes de fusionar usa `thema-dev-2` (5196).
Para el centro de ayuda en local: `ayuda-contenido` (sirve el `dist/` del repo vecino en 8787) y
`thema-help` (la app en 5198 apuntando a él); `thema-shots` (5197) es el que usan las capturas.

## Mapa del repo

- `src/styles/tokens.css` — tokens: color, radio, espaciado, sombras, **motion, capas (z), anchos**.
- `src/styles/globals.css` — mapa semántico shadcn (`--primary`, `--muted`…), `.dark`, utilidades de motion.
- `src/styles/atmosphere.css` — la capa de marca (cabello, poste, tijeras, grano, halo, reveal); sus
  componentes viven en `src/components/atmosphere/` y su doc en `/docs#/group/atmosphere`.
- `src/themes/` — 14 presets, `buildTokens.ts`, `ThemeProvider`, `ThemeSelector`.
- `src/components/ui/` — primitivos shadcn/Radix; `src/components/<familia>/` — piezas del producto
  (forms, selection, navigation, overlays, feedback, data-display, date, upload, charts, ai,
  ai-interaction, action-rail, app-shell, layout, media, utility, typography, filters, search).
- `src/icons/` — `iconRegistry.ts` (concepto → Hugeicons) y `ThemaIcon`.
- `src/help/` — el **centro de ayuda** (`/ayuda`): lee el contenido publicado por el repo
  `centro-de-ayuda` (GitHub Pages; en local `VITE_HELP_BASE_URL`), lo renderiza con Thema
  (`markdown/HelpMarkdown.tsx`), el cajón contextual del botón «Ayuda» (`HelpDrawer.tsx`) y la
  búsqueda (`src/lib/help/search.ts`). Plan y arquitectura en `docs/HELP_CENTER_PLAN.md`.
- `src/docs/` — la doc: `registry/<grupo>/<componente>.tsx` (`defineEntry`), `pages/` (fundamentos),
  `pages/guides/` (Empezar y Patrones), `router.ts` (hash), `docsNavigation.ts`, `docsSearchIndex.ts`.
  La doc monta el `AdminShell` real; no tiene shell propio.
- `src/app/` — router, providers, layout, páginas de error. `src/features/` — auth, users, dashboard.
- `src/lib/api/` (cliente, `ApiError`), `src/lib/query/` (`QueryBoundary`, `queryClient`).
- `src/mocks/` — MSW; implementa `docs/API_CONTRACT.md`.
- `ai-tools/` — catálogo generado: `CATALOG.md` (índice, lo único que se lee entero),
  `components/<id>.md` (ficha por componente) y `catalog.json` (para scripts). `CODEMAP.md` es el
  mapa del código de producto: rutas, endpoints simulados y, por archivo, qué exporta y qué usa.
  **Antes de buscar con grep dónde vive algo de `src/app`, `features`, `lib`, `mocks`, `i18n` o
  `themes`, lee `CODEMAP.md`.** `.claude/skills/` — procedimientos. `scripts/` — check y catálogo.
- `docs/` — ARCHITECTURE, API_CONTRACT, THEMING, DEPLOYMENT, DESIGN y las decisiones de cada fase.

## Documentar un componente

`src/docs/registry/<grupo>/<id>.tsx` exporta `xxxEntry = defineEntry({ id, name, group, description,
importPath, sourcePath, status, tags, playground?, examples, props, guidelines, related })` y se suma
al `index.ts` del grupo. Un grupo nuevo se declara en `registry/types.ts` (`DocGroupId` +
`DOC_GROUPS`), en `registry/index.ts` y en `docsNavigation.ts` (`GROUP_ICONS`). Luego `npm run catalog`.
Las páginas de guía viven en `docs/guidePages.ts` + `pages/guides/`.

## Orientarse en el código

Tres niveles, del más barato al más caro; sube solo si el anterior no basta:

1. `ai-tools/CODEMAP.md` — dónde vive algo (rutas, endpoints, qué exporta cada archivo). Va en el repo.
2. **CodeGraph** (`codegraph_explore`, opcional: cada quien corre `codegraph install -t claude -l global -y`
   una vez y `codegraph init` en su checkout; el índice `.codegraph/` es local y está en `.gitignore`).
   Úsalo antes de editar un símbolo: devuelve su código, quién lo llama y el radio de impacto.
   Sin `.codegraph/`, sáltatelo y usa grep.
3. Leer o buscar archivos a mano, solo para lo que los dos anteriores no cubren.

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
- **El catálogo caduca**: `npm run check` compara la huella del registro, los iconos y los tokens
  con la de `ai-tools/catalog.json` y falla con `catalogo-viejo` si no coinciden. Se arregla con
  `npm run catalog`, nunca editando `ai-tools/` a mano. Lo mismo el mapa: `mapa-viejo` se arregla
  con `npm run codemap`.
- **`npm run check` compara contra `main`** para detectar archivos protegidos tocados; sin `main`
  local solo mira el árbol de trabajo. Es estricto (error) en `src/features`, `src/app`, `src/lib`
  y `src/mocks`, y avisa (deuda heredada) en el resto de `src/`; `--strict` sube todo a error.
- **El ancho de la página es del marco**: `AdminShell` aplica `config.contentWidth`
  (`narrow` 720 · `normal` 1140 · `wide` 1600 · `full`). Antes era un `max-w-7xl` fijo. Una
  pantalla que escriba su propio `max-w-` de página falla el check.

## Cómo cerrar un trabajo

**`main` es la única fuente de verdad.** Cada sesión trabaja en su propia copia (worktree, en
`.claude/worktrees/`) que nace de `main`; lo que no llega a `main` no lo ve la siguiente sesión ni el
5195. El 2026-10-05 dos sesiones dejaron su trabajo sin commit en dos copias y ningún localhost tenía
todo. Por eso:

1. `npm run check` y `npm run verify` en verde. Si tocaste el registry, `npm run catalog`; si
   cambiaste rutas, exports o endpoints, `npm run codemap`.
2. Revisa la pantalla en claro y oscuro y a 375px (`resize_window` en el navegador integrado).
3. Commit con conventional commits en la rama de la sesión.
4. **Fusiona en `main`** (`git -C <carpeta principal> merge --ff-only <rama>`; si no es fast-forward,
   trae `main` a tu rama, resuelve y repite) **y súbelo** (`git push origin main`).
5. Si cambiaste una regla o una pieza general, actualiza la página de la doc que la cuenta
   (`pages/guides/*` o `pages/*`) en el mismo cambio.

`npm run estado` lista las copias con trabajo que `main` no tiene (`-- --detalle` dice qué archivos).
Dos hooks lo vigilan (`.claude/settings.json`): al abrir sesión avisa de trabajo pendiente en otras
copias, y al terminar no deja cerrar con cambios sin commit sin decirlo. No escribas en la copia de
otra sesión; si hace falta algo de allí, pídeselo al usuario.
