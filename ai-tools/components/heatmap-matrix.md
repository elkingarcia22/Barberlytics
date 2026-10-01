# HeatmapMatrix

Matriz de calor en tabla: filas jerárquicas y desplegables contra columnas, con la primera columna fija al hacer scroll horizontal. Cada celda se pinta con la banda de la escala de favorabilidad (tokens --fav-*, definidos para claro y oscuro), y las celdas sin dato quedan fuera de escala en gris. Es una tabla semántica, no una imagen: un lector de pantalla la recorre por filas y columnas.

Familia: Gráficos · Doc: `/docs#/components/heatmap-matrix` · Fuente: `src/components/charts/HeatmapMatrix.tsx`

```ts
import { HeatmapMatrix } from "@/components/charts"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `columns` | `HeatmapColumn[]` |  | Columnas de la matriz: `{ id, label }`. El `id` es la clave que se busca en `row.values`. |
| `rows` | `HeatmapRow[]` |  | Filas: `{ id, label, caption?, children?, values }`. Anidar por `children` crea la jerarquía desplegable. |
| `bands` | `HeatBand[]` | `FAVORABILITY_BANDS` | Bandas de color, ascendentes por `min`. Se cambia para escalas que no van de 0 a 100. |
| `defaultExpanded` | `string[]` | `todas` | Ids de las filas abiertas al montar. `[]` arranca todo cerrado. |
| `rowHeaderLabel` | `string` |  | Cabecera de la primera columna. Nombra qué es cada fila. |
| `formatValue` | `(value: number) => string` | `v => `${Math.round(v)} %`` | Cómo se escribe el valor dentro de la celda y en el tooltip. |
| `legend` | `boolean` | `true` | Muestra las bandas con su rango bajo la tabla. |
| `onCellClick` | `(row, column, value) => void` |  | Hace la celda accionable: pasa a ser un `<button>` enfocable. Las celdas sin dato nunca lo son. |
| `caption` | `string` |  | Resumen de la tabla para lectores de pantalla. Se renderiza como `<caption>` oculto. |

## Guías

- Sí: Nombra la primera columna con `rowHeaderLabel`: sin ella nadie sabe qué es cada fila.
- Sí: Usa `null` para lo que no aplica y reserva el 0 para lo que de verdad vale cero.
- Sí: Deja la leyenda visible mientras la escala no sea obvia para quien lee.
- Sí: Cierra con `defaultExpanded={[]}` cuando la matriz pase de unas 20 filas visibles.
- No: No lo uses para cruzar dos dimensiones anónimas sin jerarquía: para eso está HeatmapChart, que escala mejor.
- No: No cambies `bands` por colores de marca; la escala es semántica y se comparte con el resto del sistema.
- No: No metas más de unas 12 columnas: a partir de ahí la primera columna fija deja de bastar para orientarse.

Relacionados: heatmap-chart, metric-card, table-shell, status-badge

## Ejemplos

### Objetivos por área

Las filas con `children` traen un botón de desplegar. Al montar se abren todas; con `defaultExpanded` se elige cuáles.

```tsx
const areas = [
  { id: "ventas", label: "Ventas" },
  { id: "marketing", label: "Marketing" },
  // …
];

const objetivos = [
  {
    id: "crecer",
    label: "Crecer en cuentas grandes",
    caption: "Objetivo de empresa",
    values: { ventas: 82, marketing: 71, producto: 64 },
    children: [
      { id: "crecer-pipeline", label: "Duplicar el pipeline enterprise",
        values: { ventas: 96, marketing: 88, producto: null } },
    ],
  },
];

<HeatmapMatrix columns={areas} rows={objetivos} rowHeaderLabel="Objetivo" />
```

### Solo el primer nivel

Con `defaultExpanded={[]}` la matriz arranca cerrada: se lee el resumen por objetivo de empresa y se abre lo que interese.

```tsx
<HeatmapMatrix
  columns={areas}
  rows={objetivos}
  rowHeaderLabel="Objetivo"
  defaultExpanded={[]}
/>
```

### Celdas sin dato

Un `null` en `values` no es un cero: la celda sale gris y fuera de escala, con un guion. Distinguirlas evita leer «no aplica» como «va mal».

```tsx
const objetivos = [{
  id: "crecer-pipeline",
  label: "Duplicar el pipeline enterprise",
  values: { ventas: 96, marketing: 88, producto: null, operaciones: null },
}];
```
