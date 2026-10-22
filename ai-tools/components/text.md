# Text

Todo el texto que no es un título: cuerpo, etiquetas, ayudas, cifras y código inline. Tres ejes (`size`, `weight`, `tone`) y unos `variant` que los combinan. Por defecto es un párrafo de 14px, el tamaño de la interfaz.

Familia: Tipografía · Doc: `/docs#/components/text` · Fuente: `src/components/typography/Text.tsx`

```ts
import { Text } from "@/components/typography"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `size` | `"xs" \| "sm" \| "base" \| "lg" \| "xl"` | `"sm"` | 12, 14, 16, 18 o 20px con su interlínea. |
| `weight` | `"normal" \| "medium" \| "semibold" \| "bold"` | `"normal"` | Peso de la fuente. |
| `tone` | `"default" \| "secondary" \| "muted" \| "inverse" \| "primary" \| "positive" \| "negative" \| "warning"` | `"default"` | Color desde tokens. Gana al tono que fije el `variant`. |
| `variant` | `"body" \| "lead" \| "muted" \| "small" \| "label" \| "caption" \| "code"` | `"body"` | Combinación lista de tamaño, peso y tono. `code` además usa `span` y monoespaciada. |
| `as` | `keyof JSX.IntrinsicElements` | `"p"` | Etiqueta a renderizar. Usa `span` para texto en línea. |
| `truncate` | `boolean` | `false` | Una sola línea con elipsis. Si se corta, el texto completo sale en un tooltip sin hacer nada más. |
| `tabular` | `boolean` | `false` | `tabular-nums`: dígitos de ancho fijo para cifras alineadas. |
| `...props` | `React.HTMLAttributes<HTMLElement>` |  | Atributos nativos, incluido `className`. |

## Guías

- Sí: Deja el tamaño por defecto (`sm`) para la interfaz; sube a `base` solo en lectura larga.
- Sí: Usa `tabular` en cualquier cifra que viva en una columna o cambie en vivo.
- Sí: Pasa `as="span"` cuando el texto va en línea con otros elementos; un `<p>` dentro de un botón o una celda no es válido.
- No: No escribas `text-[13px]`, `font-light` ni `text-gray-500`: cada eje tiene una prop.
- No: No uses Text para títulos: la jerarquía es de Heading.
- No: No combines más de dos tonos semánticos en la misma frase.

Relacionados: heading, label, badge

## Ejemplos

### Tamaños

Cinco pasos. `sm` es el cuerpo de la interfaz y el valor por defecto; `base` solo para lectura larga.

```tsx
<Text size="xs">12px</Text>
<Text>14px (sm, por defecto)</Text>
<Text size="base">16px</Text>
<Text size="lg">18px</Text>
<Text size="xl">20px</Text>
```

### Pesos

`normal` para cuerpo, `medium` para etiquetas y botones, `semibold` para énfasis y cifras. `bold` casi nunca fuera de un Heading.

```tsx
<Text weight="normal">Normal</Text>
<Text weight="medium">Medium</Text>
<Text weight="semibold">Semibold</Text>
<Text weight="bold">Bold</Text>
```

### Variantes listas

Cada `variant` fija una combinación habitual. Un eje explícito (`tone`, `size`, `weight`) la sobreescribe.

```tsx
<Text>Cuerpo por defecto</Text>
<Text variant="lead">Introducción de página</Text>
<Text variant="muted">Meta y ayudas</Text>
<Text variant="small">Contadores y chips</Text>
<Text variant="label">Etiqueta de campo</Text>
<Text variant="caption">Nota al pie</Text>
<Text variant="code">npm run dev</Text>
```

### Tonos semánticos

`positive`, `negative` y `warning` mapean a los tokens de estado; `primary` al color de marca. No dependas solo del color para el significado.

```tsx
<Text tone="positive">Completado a tiempo</Text>
<Text tone="warning">Vence en 2 días</Text>
<Text tone="negative">Sin respuesta</Text>
<Text tone="primary">Ver detalle</Text>
```

### Cifras tabulares en una fila de KPI

`size="xl" weight="semibold" tabular` es la cifra de KPI. Con `tabular` los dígitos ocupan el mismo ancho y las columnas no bailan al cambiar de valor.

```tsx
<div className="grid grid-cols-3 divide-x">
  {kpis.map((kpi) => (
    <div key={kpi.label} className="px-4">
      <Text variant="caption">{kpi.label}</Text>
      <Text as="span" size="xl" weight="semibold" tabular className="block">{kpi.value}</Text>
      <Text as="span" variant="small" tone={kpi.tone} tabular>{kpi.delta}</Text>
    </div>
  ))}
</div>
```

### Párrafo con truncado

`truncate` corta en una línea con elipsis. Para varias líneas usa `line-clamp-N` por `className`. En los dos casos, si el texto no cabe, pasar el ratón o llegar con el teclado muestra el texto completo en un tooltip (`TruncationTooltip`, global).

```tsx
<Text truncate className="w-64">
  Ana María Ospina completó la autoevaluación y envió comentarios a tres pares.
</Text>
<Text className="w-64 line-clamp-2">
  Ana María Ospina completó la autoevaluación y envió comentarios a tres pares.
</Text>
```
