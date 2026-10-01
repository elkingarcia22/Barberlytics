# AreaChart

Preset de área sobre ChartCard para tendencias donde importa el volumen acumulado: cursos completados en el año, minutos de aprendizaje por semana. Es un LineChart con relleno al 15 % de opacidad, sin degradados; se remonta al cambiar de tema en esta docs.

Familia: Gráficos · Doc: `/docs#/components/area-chart` · Fuente: `src/components/charts/AreaChart.tsx`

```ts
import { AreaChart } from "@/components/charts"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `data` | `AreaChartData[]` |  | Arreglo de `{ label, value }` en orden cronológico. |
| `smooth` | `boolean` | `true` | Suaviza la curva. El relleno bajo la línea se mantiene en ambos casos. |
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

- Sí: Úsalo para series acumulativas o de volumen (totales, minutos, ingresos).
- Sí: Empieza el eje de valores en cero: el área pierde sentido si se recorta.
- Sí: Mantén una sola serie; con varias, las áreas se tapan entre sí.
- No: No lo uses para porcentajes o tasas que no se acumulan; ahí una línea es más honesta.
- No: No cambies la opacidad del relleno por option: el 15 % es el estándar del sistema.

Relacionados: line-chart, sparkline-chart, chart-card, card

## Ejemplos

### Acumulado anual

El caso típico: una serie que solo crece. El área refuerza la idea de volumen alcanzado.

```tsx
const completadosAcumulados = [
  { label: "Ene", value: 180 },
  { label: "Feb", value: 390 },
  { label: "Mar", value: 650 },
  { label: "Abr", value: 900 },
  { label: "May", value: 1200 },
  { label: "Jun", value: 1540 },
  { label: "Jul", value: 1870 },
  { label: "Ago", value: 2250 },
  { label: "Sep", value: 2670 },
  { label: "Oct", value: 3120 },
  { label: "Nov", value: 3600 },
  { label: "Dic", value: 4120 },
];

<AreaChart
  title="Cursos completados acumulados"
  description="Suma progresiva a lo largo del año"
  data={completadosAcumulados}
  seriesName="Completados"
  height={260}
/>
```

### Volumen semanal sin suavizar

Siete mediciones discretas con `smooth={false}`: el área sigue mostrando el volumen, pero los picos quedan donde ocurrieron.

```tsx
const minutosSemana = [
  { label: "Lun", value: 38 },
  { label: "Mar", value: 44 },
  { label: "Mié", value: 41 },
  { label: "Jue", value: 52 },
  { label: "Vie", value: 36 },
  { label: "Sáb", value: 12 },
  { label: "Dom", value: 8 },
];

<AreaChart
  title="Minutos de aprendizaje por día"
  description="Promedio por colaborador, última semana"
  data={minutosSemana}
  seriesName="Minutos"
  height={240}
  smooth={false}
/>
```

### Área frente a línea

Mismos datos en ambos presets. Elige área cuando quieras subrayar cuánto se acumuló; línea cuando importa la forma del cambio.

```tsx
<div className="grid gap-4 md:grid-cols-2">
  <AreaChart title="Como área" data={completadosAcumulados} seriesName="Completados" height={200} />
  <LineChart title="Como línea" data={completadosAcumulados} seriesName="Completados" height={200} />
</div>
```
