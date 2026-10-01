# Pagination

Navegación entre páginas de una lista, compuesta con enlaces que heredan los estilos de Button (ghost por defecto, outline para la activa). Úsala al pie de tablas y listados largos con URL por página.

Familia: Primitivos · Doc: `/docs#/components/pagination` · Fuente: `src/components/ui/pagination.tsx`

```ts
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `PaginationLink.isActive` | `boolean` | `false` | Marca la página actual: variante outline y `aria-current="page"`. |
| `PaginationLink.size` | `ButtonProps["size"]` | `"icon"` | Tamaño heredado de Button; los enlaces numéricos son cuadrados. |
| `PaginationPrevious.text / PaginationNext.text` | `string` | `"Previous" / "Next"` | Etiqueta visible (oculta en móvil, solo queda el chevron). Pásala en español. |
| `...props` | `React.ComponentProps<"a">` |  | PaginationLink es un <a>: href, onClick, etc. Pagination es un <nav>, PaginationContent un <ul>. |

## Guías

- Sí: Pasa siempre `text` en español a Previous/Next.
- Sí: Usa elipsis cuando hay más de 7 páginas; muestra primera, última y vecinas.
- Sí: Sincroniza la página con la URL para que sea compartible.
- No: No la uses para menos de 2 páginas: oculta el componente.
- No: No renderices todas las páginas de una lista larga.

Relacionados: button, table

## Ejemplos

### Con estado

Ventana de páginas con elipsis; los extremos se desactivan en la primera y la última.

```tsx
const [page, setPage] = React.useState(3);

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" text="Anterior" onClick={go(page - 1)} />
    </PaginationItem>
    {pageWindow(page, total).map((token) =>
      token === "ellipsis" ? (
        <PaginationItem><PaginationEllipsis /></PaginationItem>
      ) : (
        <PaginationItem key={token}>
          <PaginationLink href="#" isActive={token === page} onClick={go(token)}>{token}</PaginationLink>
        </PaginationItem>
      )
    )}
    <PaginationItem>
      <PaginationNext href="#" text="Siguiente" onClick={go(page + 1)} />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

### Marcado básico

Los enlaces son <a> reales: enlaza cada página a su URL.

```tsx
<Pagination>
  <PaginationContent>
    <PaginationItem><PaginationPrevious href="#/page/1" text="Anterior" /></PaginationItem>
    <PaginationItem><PaginationLink href="#/page/1">1</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink href="#/page/2" isActive>2</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink href="#/page/3">3</PaginationLink></PaginationItem>
    <PaginationItem><PaginationEllipsis /></PaginationItem>
    <PaginationItem><PaginationNext href="#/page/3" text="Siguiente" /></PaginationItem>
  </PaginationContent>
</Pagination>
```

### Solo anterior / siguiente

Para feeds o cuando el total de páginas no se conoce.

```tsx
<Pagination>
  <PaginationContent>
    <PaginationItem><PaginationPrevious href="#" text="Más recientes" /></PaginationItem>
    <PaginationItem><PaginationNext href="#" text="Más antiguas" /></PaginationItem>
  </PaginationContent>
</Pagination>
```
