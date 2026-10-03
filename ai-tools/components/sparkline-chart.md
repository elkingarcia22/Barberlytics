# SparklineChart

Línea ultracompacta sin ejes, leyenda ni cuadrícula, pensada para acompañar un número: dentro de un KpiCard, en una celda de tabla o al lado de un texto. Nunca es la única fuente de información y, en esta docs, se remonta al cambiar de tema para tomar el color de --color-brand.

Familia: Gráficos · Doc: `/docs#/components/sparkline-chart` · Fuente: `src/components/charts/SparklineChart.tsx`

```ts
import { SparklineChart } from "@/components/charts"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `data` | `SparklineDatum[]` |  | Arreglo de `{ label, value }`. Las etiquetas solo se ven en el tooltip. |
| `height` | `number \| string` | `32` | Alto del lienzo. El ancho siempre es el 100 % del contenedor. |
| `trend` | `"positive" \| "negative" \| "neutral"` |  | Intención semántica. Sube la opacidad del área a 0.15; el color de la línea sigue saliendo del tema. |
| `showTooltip` | `boolean` | `false` | Activa el tooltip de eje al pasar el cursor. |
| `loading` | `boolean` | `false` | Overlay con Skeleton. |
| `empty` | `boolean` | `false` | Overlay con estado vacío. A alturas pequeñas queda recortado: prefiere ocultar el sparkline. |
| `ariaLabel` | `string` | `"Sparkline chart"` | Etiqueta del region role="img". Escríbela en español y con contexto. |
| `summary` | `React.ReactNode` |  | Resumen sr-only con los valores. |
| `className` | `string` |  | Clases para el contenedor flex externo. |

## Guías

- Sí: Acompáñalo siempre de un número o etiqueta visible: la línea sola no informa.
- Sí: Dale un contenedor con ancho definido (una celda, un `w-40`); si no, no hay nada que medir.
- Sí: Usa entre 8 y 60 puntos; con menos parece un garabato y con más el detalle se pierde.
- No: No pongas `empty` a 24 px de alto: el EmptyState no cabe. Oculta el componente en su lugar.
- No: No lo uses como gráfico principal de una tarjeta; para eso está LineChart.

Relacionados: kpi-card, line-chart, area-chart, echart

## Ejemplos

### Junto a un valor

El patrón base: número grande, etiqueta y la línea como contexto. El área bajo la curva sube al 15 % de opacidad cuando hay `trend`.

```tsx
<div className="flex items-center gap-6">
  <div>
    <p className="text-xs text-muted-foreground">Sesiones · últimos 30 días</p>
    <p className="text-2xl font-bold tabular-nums">152 <span className="text-sm font-medium text-status-positive">+18 %</span></p>
  </div>
  <div className="w-40">
    <SparklineChart data={sesiones} height={32} trend="positive" ariaLabel="Sesiones diarias" />
  </div>
</div>
```

### En filas de tabla

Una columna de tendencia por equipo. Fija el ancho de la celda: el sparkline ocupa el 100 % del contenedor.

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Equipo</TableHead>
      <TableHead className="text-right">Avance</TableHead>
      <TableHead className="w-36">Últimas 8 semanas</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {progresoEquipos.map((row) => (
      <TableRow key={row.equipo}>
        <TableCell>{row.equipo}</TableCell>
        <TableCell className="text-right tabular-nums">{row.avance} %</TableCell>
        <TableCell>
          <SparklineChart data={row.serie} height={24} trend={row.trend} ariaLabel={`Tendencia de ${row.equipo}`} />
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Con tooltip

`showTooltip` activa el tooltip de eje: útil cuando el sparkline es más alto y hay espacio para leer valores.

```tsx
const serie = [
  { label: "Sem 1", value: 40 },
  { label: "Sem 2", value: 46 },
  { label: "Sem 3", value: 52 },
  { label: "Sem 4", value: 55 },
  { label: "Sem 5", value: 61 },
  { label: "Sem 6", value: 68 },
  { label: "Sem 7", value: 72 },
  { label: "Sem 8", value: 78 },
];

<SparklineChart data={serie} height={64} trend="positive" showTooltip ariaLabel="Avance semanal de Producto" />
```
