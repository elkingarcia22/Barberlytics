# ListItem

Fila de lista con `leading` (avatar, icono o IconTile), título, descripción, `meta` a la derecha y acciones. Con `href` u `onClick` la fila entera se vuelve clicable sin anidar controles: las acciones quedan fuera del área del enlace. `ListItemGroup` apila las filas con espacio entre ellas; cada una lleva su propio borde y radio.

Familia: Datos · Doc: `/docs#/components/list-item` · Fuente: `src/components/data-display/ListItem.tsx`

```ts
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `leading` | `React.ReactNode` |  | Avatar, icono o IconTile a la izquierda, con 12px hasta el texto. |
| `title` | `React.ReactNode` |  | Una línea; se trunca con elipsis. |
| `description` | `React.ReactNode` |  | Línea secundaria, 4px bajo el título. |
| `meta` | `React.ReactNode` |  | Texto o badge alineado a la derecha, con dígitos tabulares. |
| `actions` | `React.ReactNode` |  | Botones a la derecha. Quedan fuera del área clicable. |
| `href` | `string` |  | Convierte la fila en un `<a>` estirado. |
| `onClick` | `React.MouseEventHandler` |  | Convierte la fila en un `<button>` (o se añade al `<a>` si hay `href`). |
| `selected` | `boolean` | `false` | Tinte primario y barra a la izquierda; `aria-pressed` / `aria-current` en el control. |
| `size` | `"sm" \| "default"` | `"default"` | Alto de ~40px o ~56px. |
| `ListItemGroup` | `React.HTMLAttributes<"div">` |  | Contenedor con `role="list"` que apila las filas con espacio entre ellas (cada fila trae su propio borde y radio `xl`). No pone padding lateral: las tarjetas llegan hasta donde llegue su contenedor. |

## Guías

- Sí: Elige una convención de `leading` por lista: todos avatares o todos IconTile.
- Sí: Usa `meta` para un dato corto y `actions` para como máximo dos iconos.
- Sí: Da a los botones de `actions` un `aria-label` que incluya el nombre de la fila.
- No: No metas un enlace dentro de `title` si la fila ya es clicable.
- No: No uses ListItem para tablas con más de tres columnas: ahí va TableShell.
- No: No combines `selected` con `href` salvo para marcar la ruta actual.

Relacionados: icon-tile, avatar, status-badge, table-shell

## Ejemplos

### Lista de planes de formación

Filas clicables con `onClick` y `selected`: la fila activa recibe un tinte primario y una barra a la izquierda.

```tsx
<ListItemGroup>
  {plans.map((plan) => (
    <ListItem
      key={plan.id}
      leading={<IconTile icon={<BookOpen />} tone={plan.tone} />}
      title={plan.title}
      description={plan.description}
      meta={`${plan.people} personas`}
      selected={selected === plan.id}
      onClick={() => setSelected(plan.id)}
    />
  ))}
</ListItemGroup>
```

### Con acciones y estado

Los botones de `actions` se renderizan fuera del enlace estirado, así la fila navega y los iconos actúan sin conflicto. `meta` admite cualquier nodo, aquí un StatusBadge.

```tsx
<ListItem
  href="#/candidatos/ana-morales"
  leading={<Avatar><AvatarFallback>AM</AvatarFallback></Avatar>}
  title="Ana Morales"
  description="Diseñadora de producto"
  meta={<StatusBadge status="active" label="En proceso" />}
  actions={
    <>
      <Button variant="ghost" size="icon-xs" aria-label="Editar"><Pencil /></Button>
      <Button variant="ghost" size="icon-xs" aria-label="Más opciones"><MoreHorizontal /></Button>
    </>
  }
/>
```

### Estática, sin grupo

Sin `href` ni `onClick` la fila no tiene hover ni foco. Fuera de `ListItemGroup` no lleva `role="listitem"`, así puede vivir dentro de una tarjeta.

```tsx
<ListItem
  leading={<IconTile icon={<Users />} tone="neutral" />}
  title="Equipo de Producto"
  description="14 personas · Bogotá"
  meta="Actualizado hoy"
/>
```

### Tamaño sm con chevron

Filas de 40px para menús y paneles laterales; un ChevronRight en `actions` indica navegación.

```tsx
<ListItem size="sm" href="…" title="Vacantes abiertas" meta="12" actions={<ChevronRight className="size-4 text-text-muted" />} />
```

### Como cuerpo de un marco

En la vista de lista de una tabla las filas ocupan todo el ancho y el marco se descarga: sin fondo ni borde bajo la cabecera. Cada fila conserva su borde —es lo que la separa de la siguiente— y el grupo no pone padding lateral, así las tarjetas llegan de lado a lado.

```tsx
<TableShell title="Lista de procesos" surface="header">
  <ListItemGroup className="py-2">
    <ListItem title="Plan trimestral 2026" description="Trimestre · 3 elementos" meta="7%" onClick={…} />
    <ListItem title="Seguimiento mensual 2026" description="Año · 10 elementos" meta="30%" onClick={…} />
  </ListItemGroup>
</TableShell>
```
