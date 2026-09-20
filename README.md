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
npm run verify     # lint + tipos + pruebas + build
npm run build:lib  # la librería en dist-lib/ (ESM + styles.css)
```

## Qué incluye

- **131 componentes documentados** en 16 familias, cada uno con playground interactivo, ejemplos con código, tabla de props y guías de uso.
- **10 temas** (Azul, Índigo, Violeta, Esmeralda, Teal, Cian, Naranja, Rosa, Ámbar, Grafito), 4 escalas de radio, tipografía de cuerpo y títulos configurable (10 familias) y modo claro/oscuro/sistema, con exportación del tema como CSS estático. Cada tema deriva su propio gradiente de IA del color primario.
- Páginas de fundamentos: temas, colores y tokens, tipografía, radios y sombras, iconos y motion.
- Guía de theming en [docs/THEMING.md](docs/THEMING.md).

## Conectar un backend real

1. Implementa el contrato de [docs/API_CONTRACT.md](docs/API_CONTRACT.md) (el backend simulado en `src/mocks/` es la referencia ejecutable).
2. `VITE_API_URL=https://tu-api` y `VITE_USE_MOCKS=false`.
3. Si el backend emite cookies httpOnly, sustituye `sessionTokenStorage` en `src/features/auth`.

Arquitectura y reglas en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); despliegue y cabeceras en [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Estructura

- `src/styles/tokens.css` — tokens Thema (colores, radios, sombras, fuentes).
- `src/styles/globals.css` — mapa semántico shadcn + utilidades de motion.
- `src/themes/` — presets, derivación de tokens, `ThemeProvider`, `ThemeSelector`.
- `src/components/ui/` — primitivos shadcn/Radix afinados con los tokens.
- `src/components/<familia>/` — familias de componentes del producto.
- `src/docs/` — la página de documentación (registro, shell, páginas de fundamentos).
- `src/app/` — router, providers, layout con el shell y páginas de error.
- `src/features/` — auth, users, dashboard: esquemas Zod, API, hooks de TanStack Query, pantallas y pruebas.
- `src/lib/api/`, `src/lib/query/` — cliente HTTP tipado, modelo de error, `QueryBoundary`.
- `src/mocks/` — backend simulado con MSW (auth, dashboard, CRUD de personas).
- `src/index.ts` — punto de entrada de la librería (`npm run build:lib`).

## Añadir un tema

Añade una entrada en `src/themes/presets.ts` con el primario en claro y oscuro. Todo lo demás se deriva.

## Documentar un componente

Crea `src/docs/registry/<grupo>/<componente>.tsx` con `defineEntry({...})` y súmalo al `index.ts` del grupo.
