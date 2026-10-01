# ScrollArea

Contenedor con scroll y barra personalizada de 10px que aparece solo al desplazarse, coherente entre navegadores. Úsalo en listas y paneles con altura fija: sidebars, listas de resultados, carruseles de tarjetas.

Familia: Primitivos · Doc: `/docs#/components/scroll-area` · Fuente: `src/components/ui/scroll-area.tsx`

```ts
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `className` | `string` |  | Va en la raíz: aquí se fija la altura o el ancho máximos. |
| `children` | `React.ReactNode` |  | Contenido del viewport. |
| `type` | `"auto" \| "always" \| "scroll" \| "hover"` | `"hover"` | Cuándo se muestra la barra (prop de Radix). |
| `ScrollBar.orientation` | `"vertical" \| "horizontal"` | `"vertical"` | La vertical ya viene incluida; añade una horizontal cuando el contenido desborde en ancho. |

## Guías

- Sí: Fija la altura en el ScrollArea, no en el contenido.
- Sí: Usa `w-max` en el contenido cuando el scroll es horizontal.
- Sí: Redondea el ScrollArea y el viewport heredará el radio.
- No: No anides ScrollAreas: confunde el scroll con la rueda.
- No: No lo uses para la página entera; es para regiones.

Relacionados: separator, table, sheet

## Ejemplos

### Lista vertical

Fija la altura en el ScrollArea; el viewport hereda el radio del borde.

```tsx
<ScrollArea className="h-64 w-56 rounded-xl border border-border/60 bg-surface">
  <div className="p-3">
    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Versiones</h4>
    {versions.map((version) => (
      <React.Fragment key={version}>
        <div className="py-1.5 text-sm">{version}</div>
        <Separator />
      </React.Fragment>
    ))}
  </div>
</ScrollArea>
```

### Horizontal

Añade un `ScrollBar orientation="horizontal"` y deja que el contenido desborde en ancho.

```tsx
<ScrollArea className="w-full whitespace-nowrap rounded-xl border border-border/60 bg-surface">
  <div className="flex w-max gap-3 p-3">
    {courses.map((course) => (
      <figure key={course} className="w-40 shrink-0 rounded-lg border border-border/60 bg-background p-3">
        <div className="mb-2 h-20 rounded-md bg-primary/10" />
        <figcaption className="text-sm font-medium">{course}</figcaption>
      </figure>
    ))}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>
```

### Texto largo

Para términos, descripciones o logs dentro de un diálogo.

```tsx
<ScrollArea className="h-40 w-full max-w-md rounded-xl border border-border/60 bg-surface p-4 text-sm leading-relaxed">
  <p>…</p>
</ScrollArea>
```
