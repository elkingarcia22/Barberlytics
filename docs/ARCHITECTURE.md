# Arquitectura de la aplicación

```
src/
├── app/            Esqueleto: router, providers, layout, páginas de error
├── features/       Un directorio por dominio: auth, users, dashboard
│   └── users/      types (zod) · api · queries (TanStack) · páginas · formularios · tests
├── lib/
│   ├── api/        Cliente HTTP, modelo de error, sobre de paginación, env
│   └── query/      QueryClient, QueryBoundary (carga/error/vacío), ErrorState
├── mocks/          Backend simulado (MSW): db en memoria + handlers
├── components/     Sistema de diseño (presentacional, sin datos)
├── themes/         Presets, tokens derivados, tipografía, ThemeProvider
├── docs/           Documentación interactiva del sistema (ruta /docs)
└── test/           setup de Vitest y `renderWithProviders`
```

## Capas y reglas

1. **Componentes** (`src/components`) no conocen la API ni el router. Reciben datos por props. El shell recibe su configuración por `ShellConfig`.
2. **Features** son la única capa que habla con la API. Cada una expone `api.ts` (funciones puras sobre `api`), `queries.ts` (hooks con claves de caché jerárquicas) y sus pantallas.
3. **Estado de servidor** vive en TanStack Query; nunca se copia a un store. **Estado de URL** (filtros, página, orden) vive en `useSearchParams`. **Estado de cliente** (drawers abiertos, selección) vive en el componente.
4. **Validación** con Zod en la frontera: cada respuesta se valida con `schema` y cada formulario con el mismo esquema que espera el backend.
5. **Errores**: todo fallo se convierte en `ApiError` y se muestra con `ErrorState`, `toast` o en el campo del formulario (`fieldErrors`). `RouteError` atrapa lo que reviente al renderizar.
6. **Carga diferida**: cada pantalla es un `React.lazy`; ECharts y xlsx solo se descargan donde se usan.

## Flujo de una petición

`CustomersPage` → `useCustomersQuery()` → `customersApi.list` → `api.get("/customers", { schema })` → `fetch` con `Authorization` → respuesta validada → caché por `customerKeys` → `QueryBoundary` decide qué pintar.

Un `401` en cualquier punto dispara `apiAuth.onUnauthorized` → `AuthProvider` limpia token y caché → `RequireAuth` redirige a `/login` guardando `from`.

## Añadir una feature

1. `src/features/<nombre>/types.ts`: esquemas Zod y tipos.
2. `api.ts`: funciones sobre `api` con `schema`.
3. `queries.ts`: `keys` + hooks (`useQuery`, `useMutation` con invalidación u optimista).
4. Pantalla con `QueryBoundary`; formularios con React Hook Form + `zodResolver`.
5. Handler en `src/mocks/handlers.ts` con la misma forma; pruebas en `*.test.tsx` con `renderWithProviders`; ruta en `src/app/router.tsx` y nodo en `src/app/navigation.ts`.

## Entornos

| Variable | Dev | Build |
|---|---|---|
| `VITE_API_URL` | `/api` | URL real |
| `VITE_USE_MOCKS` | `true` por defecto | `false` por defecto |

Con mocks, `main.tsx` arranca el service worker de MSW antes del primer render; sin mocks, el worker ni se descarga.

## Calidad

- `npm run verify`: lint, tipos, pruebas y build.
- `npm run e2e`: Playwright contra el servidor de desarrollo con mocks.
- CI (`.github/workflows/ci.yml`) ejecuta todo en cada push y PR.
