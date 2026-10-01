# TableShell

La tarjeta que envuelve una tabla: título, descripción y acciones en la cabecera, y el estado vacío resuelto por defecto. La tabla en sí va como `children`; el shell solo pone el marco, el scroll horizontal y, si se pide, el encabezado pegajoso.

Familia: Datos · Doc: `/docs#/components/table-shell` · Fuente: `src/components/data-display/TableShell.tsx`

```ts
import { TableShell } from "@/components/data-display/TableShell"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `React.ReactNode` |  | Título de la cabecera. Acepta un nodo para lo que va pegado al nombre: el total en un `Badge`, una insignia de estado. |
| `description` | `string` |  | Línea secundaria bajo el título. |
| `actions` | `React.ReactNode` |  | Botones o controles alineados a la derecha de la cabecera. |
| `children` | `React.ReactNode` |  | La tabla; se envuelve en una caja con scroll horizontal. |
| `empty` | `boolean` | `false` | Si es cierto, se pinta el estado vacío en lugar de la tabla. |
| `emptyState` | `React.ReactNode` |  | Estado vacío propio; por defecto un `EmptyState` genérico. |
| `stickyHeader` | `boolean` | `false` | Fija el `<thead>` arriba mientras la caja interior hace scroll. |
| `surface` | `"card" \| "header"` | `"card"` | Dónde pinta superficie el marco. `header` la deja solo en la barra de título y descarga el cuerpo, para cuando las filas ya se sostienen solas —una lista a sangre— y una segunda superficie sería una caja dentro de otra. |
| `footer` | `React.ReactNode` |  | El pie del marco, separado por su línea: la paginación, el resumen de «x de y». Dentro de la tarjeta, no flotando debajo. |
| `className` | `string` |  | Clases extra sobre la `Card`. |

## Guías

- Sí: Calcula `empty` desde los datos ya filtrados, no desde la carga inicial.
- Sí: Pon en `actions` solo lo que actúa sobre toda la tabla: exportar, crear, buscar.
- Sí: Manda la paginación a `footer`: pertenece a la lista, así que va dentro de su marco.
- Sí: Deja que la tabla vaya a sangre: el marco ya pone el borde y el texto de la primera columna se alinea solo con el título.
- No: No anides otra `Card` ni una caja con borde dentro: el shell ya es la tarjeta.
- No: No uses `stickyHeader` sin acotar la altura de la caja interior; sin scroll no hay nada que pegar.

Relacionados: table, empty-state, table-config, table-header-controls, card

## Ejemplos

### Con búsqueda y vacío propio

`empty` se calcula desde los datos filtrados; `emptyState` reemplaza el mensaje por defecto con uno que deshace el filtro.

```tsx
const rows = PEOPLE.filter((person) => person.name.toLowerCase().includes(query.toLowerCase()));

<TableShell
  title="Colaboradores"
  description={`${rows.length} de ${PEOPLE.length}`}
  empty={rows.length === 0}
  emptyState={<EmptyState icon={Search} title="Nadie coincide" className="border-none bg-transparent shadow-none" action={<Button variant="outline" size="sm" onClick={() => setQuery("")}>Limpiar</Button>} />}
  actions={<Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar…" className="h-8 w-44" />}
>
  <Table>…</Table>
</TableShell>
```

### Vacío por defecto

Sin `emptyState`, el shell pinta un `EmptyState` genérico con el icono de base de datos.

```tsx
<TableShell title="Objetivos" empty>
  <Table>…</Table>
</TableShell>
```

### Encabezado pegajoso

Con `stickyHeader` el `<thead>` se queda arriba mientras la caja hace scroll. Usa un `<table>` plano: el wrapper de `Table` crearía su propio contexto de scroll.

```tsx
<TableShell stickyHeader className="[&_.overflow-x-auto]:max-h-64">
  <table className="w-full text-sm">
    <TableHeader>…</TableHeader>
    <TableBody>…</TableBody>
  </table>
</TableShell>
```
