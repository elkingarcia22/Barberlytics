# Thema

Sistema de diseño con temas intercambiables (estilo shadcn), documentación interactiva de cada
componente y un esqueleto de aplicación listo para conectar a un backend: enrutado, sesión,
capa de datos con caché, formularios validados, backend simulado, pruebas y CI.

## Empezar

```bash
npm ci --legacy-peer-deps
npm run dev            # http://localhost:5173 · login: admin@thema.dev / thema123 (backend simulado)
```

Rutas: `/login`, `/dashboard`, `/usuarios` (app) y `/docs` (sistema de diseño).

## Scripts

```bash
npm run dev        # documentación en http://localhost:5173
npm run build      # build de producción
npm run type-check # tsc -b
npm test           # unitarias e integración (Vitest + Testing Library + MSW)
npm run e2e        # end-to-end (Playwright; antes: npm run e2e:install)
npm run lint       # eslint
npm run check      # reglas del sistema de diseño (librerías, colores, iconos, letra, protegidos)
npm run catalog    # regenera ai-tools/ (el catálogo que lee la IA) desde el registro de la doc
npm run verify     # check + lint + tipos + pruebas + build
npm run build:lib  # la librería en dist-lib/ (ESM + styles.css)
```

## Qué incluye

- **159 componentes documentados** en 17 familias, cada uno con playground interactivo, ejemplos con código, tabla de props y guías de uso.
- **10 temas** (Azul, Índigo, Violeta, Esmeralda, Teal, Cian, Naranja, Rosa, Ámbar, Grafito), 4 escalas de radio, tipografía de cuerpo y títulos configurable (10 familias) y modo claro/oscuro/sistema, con exportación del tema como CSS estático. Cada tema deriva su propio gradiente de IA del color primario.
- Páginas de fundamentos: temas, colores y tokens, tipografía, radios y sombras, iconos y motion.
- Guías: **Empezar** (cómo usar el sistema, flujo de trabajo, trabajar con la IA) y **Patrones** (botones, modales y drawers, estados y feedback, formularios).
- Guía de theming en [docs/THEMING.md](docs/THEMING.md).

## Conectar un backend real

1. Implementa el contrato de [docs/API_CONTRACT.md](docs/API_CONTRACT.md) (el backend simulado en `src/mocks/` es la referencia ejecutable).
2. `VITE_API_URL=https://tu-api` y `VITE_USE_MOCKS=false`.
3. Si el backend emite cookies httpOnly, sustituye `sessionTokenStorage` en `src/features/auth`.

Arquitectura y reglas en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); despliegue y cabeceras en [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Trabajar con IA

Las reglas viven en el repo, no en la cabeza de nadie:

- `AGENTS.md` — las cinco reglas, dónde se trabaja, la receta de una pantalla y cómo se entrega. Las leen Claude, Cursor, Codex y Gemini.
- `CLAUDE.md` — el mapa del repo, las trampas conocidas y cómo cerrar un trabajo.
- `ai-tools/` — el catálogo generado del registro (`npm run catalog`): `CATALOG.md` es el índice (una línea por componente), `components/<id>.md` la ficha de cada uno (props, guías, ejemplos) y `catalog.json` todo junto para scripts. `npm run check` falla si queda viejo.
- `.claude/skills/` — procedimientos que se activan solos: elegir componentes, nueva pantalla, revisar contra el sistema, documentar un componente.
- `.claude/settings.json` — hooks: bloquea una escritura con librerías ajenas, colores o letra a mano, y repasa los cambios al terminar.
- `scripts/check-design-system.mjs` — `npm run check`: estricto en `src/features`, `src/app` y `src/lib`; aviso en el sistema.

## Estructura

- `src/styles/tokens.css` — tokens Thema (colores, radios, sombras, fuentes).
- `src/styles/globals.css` — mapa semántico shadcn + utilidades de motion.
- `src/themes/` — presets, derivación de tokens, `ThemeProvider`, `ThemeSelector`.
- `src/components/ui/` — primitivos shadcn/Radix afinados con los tokens.
- `src/components/<familia>/` — familias de componentes del producto.
- `src/docs/` — la página de documentación (registro, shell, páginas de fundamentos). Su shell **es** el del producto: `DocsShell` monta `AdminShell` con el árbol de `docsNavigation.ts`, así que el menú lateral, la cabecera, el pie y la atmósfera del tema son el mismo código que usa la aplicación.
- `src/app/` — router, providers, layout con el shell y páginas de error.
- `src/features/` — auth, users, dashboard: esquemas Zod, API, hooks de TanStack Query, pantallas y pruebas. El home (`features/dashboard`) es una **plantilla**: la estructura completa de una pantalla de gestión —plantillas de las que partir, métricas, alertas que filtran, pestañas y la tabla configurable con su barra de acciones— armada solo con piezas del sistema y con datos deterministas en `homeTemplate.tsx`. Para convertirla en una pantalla real se sustituye ese módulo por la consulta que toque.
- `src/lib/api/`, `src/lib/query/` — cliente HTTP tipado, modelo de error, `QueryBoundary`.
- `src/mocks/` — backend simulado con MSW (auth, dashboard, CRUD de personas).
- `src/index.ts` — punto de entrada de la librería (`npm run build:lib`).
- `src/components/typography/` — `Heading` y `Text`: la escala tipográfica como componentes.
- `src/docs/pages/guides/` — las guías (Empezar y Patrones); `src/docs/guidePages.ts` las registra.
- `ai-tools/`, `scripts/`, `.claude/` — la capa para trabajar con IA (ver arriba).

## Añadir un tema

Añade una entrada en `src/themes/presets.ts` con el primario en claro y oscuro. Todo lo demás se deriva.

## La doc consume el sistema

La documentación es la primera consumidora de lo que documenta, no una réplica:

- **Shell**: `src/docs/DocsShell.tsx` monta `AdminShell` con `config` (árbol de navegación, nodo activo, acciones del header, promo, modo oscuro delegado al `ThemeProvider`). No hay menú ni cabecera propios.
- **Navegación**: `src/docs/docsNavigation.ts` traduce el registro de la doc al modelo del shell (`NavEntry`). Ids con prefijo (`foundation:`, `section:`, `group:`, `component:`) para ir y volver entre ruta y nodo; el primer hijo de cada grupo abre su resumen, porque en ese modelo una raíz con hijos despliega en vez de navegar.
- **Migas**: el componente `Breadcrumbs` del sistema, renderizado en el hueco que el shell reserva a la pantalla montada (`ShellHeaderSlot`).
- **Búsqueda**: el `GlobalSearch` del sistema, que monta la propia cabecera del shell (⌘K). La doc solo le pasa su índice en `src/docs/docsSearchIndex.ts`: los componentes como objetos y los fundamentos y familias como destinos. Sin `onAsk` no ofrece preguntar, porque en la doc no hay agente.
- **Preview**: al final del header, un enlace a `/dashboard` para ver los mismos componentes funcionando en la aplicación de ejemplo (Inicio y Personas). Va tras la guarda de sesión, así que sin sesión pasa por el login y vuelve.
- **Contrato fijado por pruebas**: `e2e/docs-shell.spec.ts` falla si alguien vuelve a montar un shell aparte.

## La búsqueda general

`GlobalSearch` (`src/components/search/`) es un solo campo para las tres cosas que alguien quiere
cuando no sabe dónde está algo: abrir un registro, ir a una pantalla o preguntar al agente. Quien lo
monta le pasa el índice y él se encarga del filtrado sin tildes, de las pestañas de alcance, del
recuento, de los atajos y de la accesibilidad de cada fila.

`AdminShell` ya lo pone en la cabecera con los registros de demostración, los destinos derivados de
`navigation` y la pregunta enganchada al panel del agente. Para cambiarlo:

```tsx
<AdminShell config={{ search: { objects: misRegistros, scope: empresa.name } }}>…</AdminShell>
```

`chrome.search: false` lo quita. El grupo de preguntas solo aparece si el agente es alcanzable
(`chrome.modeSwitch`), para no prometer una respuesta que no llegaría a ningún panel.

## Documentar un componente

Crea `src/docs/registry/<grupo>/<componente>.tsx` con `defineEntry({...})` y súmalo al `index.ts` del grupo.
