# PaginationShell

Paginación lista para tablas y listados: resumen de resultados a la izquierda, controles a la derecha y elipsis automáticas alrededor de la página actual. Es controlada, sin routing ni lógica de datos: recibe la página y avisa del cambio.

Familia: Navegación · Doc: `/docs#/components/pagination-shell` · Fuente: `src/components/navigation/PaginationShell.tsx`

```ts
import { PaginationShell } from "@/components/navigation"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `page` | `number` |  | Página actual, empezando en 1. |
| `pageCount` | `number` |  | Total de páginas. Los controles se desactivan en los extremos. |
| `totalItems` | `number` |  | Total de resultados. Si se indica, el resumen muestra el rango «x - y de n». |
| `pageSize` | `number` |  | Resultados por página; necesario para calcular el rango del resumen. |
| `onPageChange` | `(page: number) => void` |  | Se llama con la página destino; nunca fuera de [1, pageCount]. |
| `showSummary` | `boolean` | `true` | Muestra u oculta el texto de resumen a la izquierda. |
| `className` | `string` |  | Clases para el contenedor (trae `py-4` por defecto). |

## Guías

- Sí: Guarda la página en la URL cuando el listado sea compartible.
- Sí: Pasa `totalItems` y `pageSize` siempre que los conozcas: el rango orienta más que «Página 3 de 14».
- Sí: Vuelve a la página 1 al cambiar filtros o búsqueda.
- No: No lo uses para scroll infinito ni para «cargar más».
- No: No calcules `pageCount` dentro del render en cada cambio de página si el total viene del servidor: cachéalo.

Relacionados: pagination, configurable-table, button

## Ejemplos

### Al pie de una tabla

Con `totalItems` y `pageSize` el resumen dice qué rango se está viendo; las filas cambian con la página.

```tsx
const [page, setPage] = React.useState(1);
const pageCount = Math.ceil(total / pageSize);

<table>…</table>
<PaginationShell
  page={page}
  pageCount={pageCount}
  totalItems={total}
  pageSize={pageSize}
  onPageChange={setPage}
/>
```

### Solo controles

Sin resumen, para un carrusel de tarjetas o un panel estrecho.

```tsx
const [page, setPage] = React.useState(3);

<PaginationShell page={page} pageCount={5} showSummary={false} onPageChange={setPage} />
```
