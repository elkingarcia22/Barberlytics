# HeatmapChart

Preset de mapa de calor sobre ChartCard para cruzar dos dimensiones: día por franja horaria, equipo por competencia. La escala de cinco niveles va de --color-positive a --color-negative y se resuelve de los tokens al construir la option, por lo que en esta docs se remonta al cambiar de tema.

Familia: Gráficos · Doc: `/docs#/components/heatmap-chart` · Fuente: `src/components/charts/HeatmapChart.tsx`

```ts
import { HeatmapChart } from "@/components/charts"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `xLabels` | `string[]` |  | Categorías del eje X, en orden. Cada `data[].x` debe existir aquí. |
| `yLabels` | `string[]` |  | Categorías del eje Y, en orden. Cada `data[].y` debe existir aquí. |
| `data` | `HeatmapDatum[]` |  | Arreglo de `{ x, y, value }`. Las celdas sin dato quedan vacías. |
| `min` | `number` |  | Límite inferior de la escala de color. Si falta, se toma el mínimo de los datos. |
| `max` | `number` |  | Límite superior de la escala de color. Si falta, se toma el máximo de los datos. |
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

- Sí: Fija `min` y `max` cuando el mapa se compara con otro o se actualiza en el tiempo.
- Sí: Dale al menos 280 px de alto: el grid reserva 100 px a cada lado para etiquetas y leyenda.
- Sí: Explica en el footer qué significa cada extremo del color; verde–rojo no siempre es «bueno–malo».
- No: No superes unas 12 × 12 celdas; por debajo de 24 px por celda las etiquetas se pisan.
- No: No lo uses con una sola dimensión: para eso está BarChart.

Relacionados: bar-chart, chart-card, echart, card

## Ejemplos

### Actividad por día y franja

Siete columnas por cinco filas. Sin `min` ni `max` la escala se ajusta al rango de los datos.

```tsx
const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const franjas = ["06–09", "09–12", "12–15", "15–18", "18–21"];
const actividad = franjas.flatMap((franja, fila) =>
  dias.map((dia, columna) => ({ x: dia, y: franja, value: sesiones[fila][columna] }))
);

<HeatmapChart
  title="Actividad por día y franja horaria"
  description="Sesiones iniciadas, promedio de las últimas 4 semanas"
  xLabels={dias}
  yLabels={franjas}
  data={actividad}
  seriesName="Sesiones"
  height={320}
/>
```

### Escala fija por competencia

Con `min={0}` y `max={100}` dos mapas de distintos periodos se comparan con la misma leyenda de color.

```tsx
const equipos = ["Producto", "Diseño", "Backend", "Datos", "Soporte"];
const competencias = ["Liderazgo", "Comunicación", "Datos", "Ventas", "Idiomas"];

<HeatmapChart
  title="Nivel promedio por competencia"
  description="Resultado de la última evaluación, escala 0–100"
  xLabels={equipos}
  yLabels={competencias}
  data={nivelPorCompetencia}
  seriesName="Nivel"
  min={0}
  max={100}
  height={320}
/>
```

### Con resumen y footer

Un mapa de calor es difícil de verbalizar: el summary debe nombrar los extremos, no todas las celdas.

```tsx
<HeatmapChart
  title="Actividad por día y franja horaria"
  xLabels={dias}
  yLabels={franjas}
  data={actividad}
  seriesName="Sesiones"
  height={300}
  summary="El pico es jueves de 15 a 18 con 82 sesiones; el mínimo, domingo de 06 a 09 con 2."
  footer="Verde = baja actividad, rojo = alta. Promedio de las últimas 4 semanas."
/>
```
