# Badge

Etiqueta compacta de 20px para clasificar, contar o señalar el estado de un elemento. Úsalo junto a títulos, filas de tabla o tarjetas cuando una palabra basta para dar contexto.

Familia: Primitivos · Doc: `/docs#/components/badge` · Fuente: `src/components/ui/badge.tsx`

```ts
import { Badge } from "@/components/ui/badge"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `variant` | `"default" \| "secondary" \| "outline" \| "neutral" \| "destructive" \| "ghost" \| "link"` | `"default"` | Estilo visual del badge. |
| `asChild` | `boolean` | `false` | Aplica los estilos al hijo (p. ej. un <a>) en lugar de renderizar un <span>. |
| `...props` | `React.ComponentProps<"span">` |  | Atributos nativos del span. |

## Guías

- Sí: Usa una o dos palabras; el badge no envuelve texto.
- Sí: Mantén un significado fijo por color en toda la aplicación.
- Sí: Acompaña los estados con icono para no depender solo del color.
- No: No uses badges como botones sin `asChild` y un control real.
- No: No pongas más de tres badges seguidos en la misma fila.
- No: No lo uses para contadores grandes; a partir de 99 muestra «99+».

Relacionados: button, alert, avatar

## Ejemplos

### Variantes

`default` y `secondary` para categorías; `outline` y `neutral` para metadatos; `destructive` para errores.

```tsx
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="neutral">Neutral</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="ghost">Ghost</Badge>
<Badge variant="link">Link</Badge>
```

### Estados con icono

El SVG se fija a 12px; combínalo con colores semánticos por `className` cuando la variante no baste.

```tsx
<Badge variant="outline" className="border-success/40 text-success"><CheckCircle2 /> Completado</Badge>
<Badge variant="outline" className="border-warning/40 text-warning"><Clock /> Pendiente</Badge>
<Badge variant="destructive"><X /> Vencido</Badge>
```

### Como enlace (asChild)

Con `asChild` el badge envuelve un `<a>` real y activa sus estados hover.

```tsx
<Badge asChild variant="secondary">
  <a href="#/components/button">Ver botón <ArrowUpRight /></a>
</Badge>
```

### Filtros removibles

Un botón interno con `aria-label` convierte el badge en un chip de filtro.

```tsx
const [active, setActive] = React.useState(["Diseño", "Liderazgo", "Datos"]);

{active.map((filter) => (
  <Badge key={filter} variant="secondary" className="pr-1">
    {filter}
    <button type="button" aria-label={`Quitar ${filter}`} onClick={() => setActive((items) => items.filter((item) => item !== filter))}>
      <X />
    </button>
  </Badge>
))}
```
