# Table

La tabla semántica base: contenedor con scroll horizontal, cabecera, cuerpo, pie y caption con la tipografía del sistema. Al montarse, las filas del cuerpo entran en cascada (fade + leve ascenso escalonado por fila, definido en globals.css).

Familia: Primitivos · Doc: `/docs#/components/table` · Fuente: `src/components/ui/table.tsx`

```ts
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from "@/components/ui/table"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `Table` | `componente` |  | Envuelve la <table> en un contenedor `overflow-x-auto`; la tabla mide `w-full`. |
| `TableHeader / TableBody / TableFooter` | `componente` |  | thead, tbody y tfoot. El cuerpo lleva `data-slot="table-body"`, que activa la cascada. |
| `TableRow` | `componente` |  | Borde inferior, hover en `bg-muted/50` y `data-state="selected"` para la selección. |
| `TableHead / TableCell` | `componente` |  | Celda de cabecera (h-10, medium) y de cuerpo (p-2). `whitespace-nowrap` por defecto. |
| `TableCaption` | `componente` |  | Texto secundario debajo de la tabla. |
| `className / ...props` | `atributos nativos` |  | Cada pieza acepta las props de su elemento HTML. |

## Guías

- Sí: Alinea los números a la derecha con `tabular-nums`.
- Sí: Usa Badge para estados en vez de texto coloreado.
- Sí: Para tablas con ordenación, paginación o columnas fijas usa TableShell, que se apoya en estas piezas.
- No: No metas la tabla en otro contenedor con scroll horizontal; Table ya trae el suyo.
- No: No animes las filas por tu cuenta: la cascada ya está en globals.css y se activa sola.

Relacionados: table-shell, table-header-controls, pagination, checkbox, badge

## Ejemplos

### Básica con caption

El caption va al final (`caption-bottom`) y explica qué muestra la tabla.

```tsx
<Table>
  <TableCaption>Equipos con asientos asignados en el ciclo 2026.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Nombre</TableHead>
      <TableHead>Área</TableHead>
      <TableHead>Estado</TableHead>
      <TableHead className="text-right">Asientos</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>…</TableBody>
</Table>
```

### Filas seleccionables

`data-state="selected"` en la fila pinta el fondo; las celdas con checkbox pierden el padding derecho.

```tsx
<TableRow data-state={isSelected ? "selected" : undefined}>
  <TableCell>
    <Checkbox checked={isSelected} onCheckedChange={(v) => toggle(person.id, v === true)} aria-label={`Seleccionar ${person.name}`} />
  </TableCell>
  <TableCell className="font-medium">{person.name}</TableCell>
  <TableCell>{person.area}</TableCell>
</TableRow>
```

### Cascada de entrada

Cada `<tr>` del cuerpo entra 55ms después del anterior (hasta la fila 20). Cambia la `key` para repetirla.

```tsx
/* globals.css */
[data-slot="table-body"] > tr { animation: table-row-in 780ms cubic-bezier(0.16, 1, 0.3, 1) both; }
[data-slot="table-body"] > tr:nth-child(2) { animation-delay: 55ms; }
/* … hasta nth-child(20) */

<PeopleTable key={reloadCount} rows={people} />
```
