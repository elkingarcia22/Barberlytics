---
name: nueva-pantalla
description: Crear una pantalla nueva en la aplicación Thema siguiendo la receta del sistema (dominio en src/features, datos con Zod + TanStack Query + mock MSW, ruta, menú, validación). Se activa al pedir "una pantalla de…", "un módulo de…", "una página para…".
---

# Nueva pantalla

Sigue `/docs#/guides/flujo-de-trabajo`. En resumen:

1. **Ubícate** con `ai-tools/CODEMAP.md`: rutas que ya existen, endpoints simulados y qué exporta
   cada dominio. Abre solo los archivos que vayas a tocar o copiar.
2. **Elige las piezas** con la skill `elegir-componentes`.
3. **Dominio**: `src/features/<dominio>/` con `<Nombre>Page.tsx`, `types.ts` (esquemas Zod y tipos
   inferidos), `api.ts` (una función por endpoint sobre `api` de `@/lib/api`), `queries.ts`
   (hooks de TanStack Query con `queryKey` estable), `index.ts` (barrel). Mira `src/features/users/`
   como modelo completo (lista paginada con búsqueda en URL, drawer de alta y edición).
4. **Backend simulado**: añade el handler en `src/mocks/handlers.ts` respetando
   `docs/API_CONTRACT.md` (sobre `{ data, meta }`, errores `{ code, message }`). Si el contrato
   cambia, actualiza el doc en el mismo cambio.
5. **Página**: `PageShell maxWidth="normal"` (narrow para formularios, wide para tableros) +
   `PageHeader` + `QueryBoundary` alrededor de la consulta. Estado compartible (filtros, pestaña,
   página) en la URL con `useSearchParams`.
6. **Ruta y menú**: `src/app/lazyPages.ts`, `src/app/router.tsx` (hijo de `AppLayout`),
   `src/app/navigation.ts` (solo si va en el menú).
7. **Pruebas**: `<dominio>.test.tsx` con Testing Library + MSW (render con `src/test/render.tsx`);
   si es un recorrido crítico, `e2e/<flujo>.spec.ts` con el helper de login de `e2e/helpers.ts`.
8. **Cierre**: `npm run codemap && npm run check && npm run verify`. Revisa en claro, oscuro y a 375px.
