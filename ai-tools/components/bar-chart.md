# BarChart

Preset de barras sobre ChartCard para comparar magnitudes entre categorías: áreas, equipos, cursos. Acepta orientación vertical u horizontal y hereda encabezado, estados y accesibilidad de la tarjeta; en esta docs se remonta al cambiar de tema para reflejar la paleta activa.

Familia: Gráficos · Doc: `/docs#/components/bar-chart` · Fuente: `src/components/charts/BarChart.tsx`

```ts
import { BarChart } from "@/components/charts"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `data` | `BarChartData[]` |  | Arreglo de `{ label, value }`. Con un arreglo vacío el gráfico no se pinta; combínalo con `empty`. |
| `horizontal` | `boolean` | `false` | Intercambia los ejes: categorías en Y y valores en X. Útil para etiquetas largas o rankings. |
| `stacked` | `boolean` | `false` | Marca la serie con `stack: "total"`. Solo tiene efecto visible al combinar varias series vía onChartReady. |
| `title` | `string` |  | Título de la tarjeta. Obligatorio: también es la etiqueta accesible del gráfico. |
| `description` | `string` |  | Subtítulo bajo el título. |
| `seriesName` | `string` | `"Value"` | Nombre de la serie; aparece en el tooltip y la leyenda. |
| `height` | `number \| string` | `300` | Alto del área del gráfico en px o como valor CSS. |
| `loading` | `boolean` | `false` | Muestra un Skeleton sobre el lienzo mientras llegan los datos. |
| `empty` | `boolean` | `false` | Muestra el estado vacío en lugar del gráfico. |
| `error` | `string \| null` | `null` | Mensaje de error; si existe, reemplaza el gráfico por el estado de error. |
| `ariaLabel` | `string` | `title` | Etiqueta del region role="img". Por defecto usa el título. |
| `summary` | `React.ReactNode` |  | Resumen solo para lectores de pantalla (p. ej. una lista con los valores). |
| `actions` | `React.ReactNode` |  | Acciones alineadas a la derecha del encabezado. |
| `filters` | `React.ReactNode` |  | Controles debajo del encabezado (selects de periodo, segmentos). |
| `footer` | `React.ReactNode` |  | Notas al pie: fuente, aclaraciones, fecha de corte. |
| `className` | `string` |  | Clases extra para la Card. |
| `onChartReady` | `(instance: EChartsInstance) => void` |  | Recibe la instancia de ECharts una vez inicializada y con datos. |

## Guías

- Sí: Usa barras para comparar categorías discretas; para evolución en el tiempo prefiere LineChart.
- Sí: Pasa `horizontal` cuando las etiquetas superan dos palabras o hay más de seis categorías.
- Sí: Ordena los datos por valor cuando el objetivo es un ranking.
- No: No mezcles unidades distintas en una misma serie; el eje de valores es único.
- No: No dependas del color para distinguir categorías: la etiqueta del eje es el identificador.

Relacionados: line-chart, donut-chart, chart-card, echart, card

## Ejemplos

### Barras verticales

La orientación por defecto. Las categorías van en el eje X y el tema pinta la serie con --color-brand.

```tsx
const horasPorArea = [
  { label: "Tecnología", value: 1240 },
  { label: "Ventas", value: 980 },
  { label: "Operaciones", value: 1120 },
  { label: "Talento", value: 640 },
  { label: "Finanzas", value: 520 },
  { label: "Marketing", value: 710 },
];

<BarChart
  title="Horas de aprendizaje por área"
  description="Total acumulado en el trimestre"
  data={horasPorArea}
  seriesName="Horas"
  height={260}
/>
```

### Ranking horizontal

Con `horizontal` los ejes se intercambian. Ordena los datos antes de pasarlos: el preset no los reordena.

```tsx
const cursosPorEquipo = [
  { label: "Backend", value: 51 },
  { label: "Producto", value: 42 },
  { label: "Datos", value: 33 },
  { label: "Diseño", value: 27 },
  { label: "Soporte", value: 19 },
];

<BarChart
  title="Cursos completados por equipo"
  description="Ordenado de mayor a menor"
  data={cursosPorEquipo}
  seriesName="Cursos"
  height={260}
  horizontal
/>
```

### Con acciones, footer y resumen

Los slots del ChartCard viajan tal cual. El summary es sr-only y da los valores a lectores de pantalla.

```tsx
<BarChart
  title="Horas de aprendizaje por área"
  data={horasPorArea}
  seriesName="Horas"
  height={240}
  actions={<Button variant="ghost" size="icon-sm" aria-label="Descargar"><Download /></Button>}
  footer="Fuente: módulo de aprendizaje · corte al 30 de septiembre"
  summary={
    <ul>
      {horasPorArea.map((item) => (
        <li key={item.label}>{item.label}: {item.value} horas</li>
      ))}
    </ul>
  }
/>
```

### Cargando y vacío

El encabezado se mantiene en ambos estados para no perder el contexto de qué se está esperando.

```tsx
<BarChart title="Horas por área" data={horasPorArea} height={160} loading />
<BarChart title="Horas por área" data={[]} height={160} empty />
```
