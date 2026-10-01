# LineChart

Preset de línea sobre ChartCard para series temporales y tendencias: usuarios activos por mes, NPS por semana, avance de un indicador. Suaviza la curva por defecto y marca cada punto con un círculo pequeño; los ejemplos se remontan al cambiar de tema en esta docs.

Familia: Gráficos · Doc: `/docs#/components/line-chart` · Fuente: `src/components/charts/LineChart.tsx`

```ts
import { LineChart } from "@/components/charts"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `data` | `LineChartData[]` |  | Arreglo de `{ label, value }`, normalmente con etiquetas temporales ordenadas. |
| `smooth` | `boolean` | `true` | Suaviza la curva entre puntos. Desactívalo para mediciones discretas. |
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

- Sí: Usa líneas para mostrar cómo cambia un valor a lo largo del tiempo.
- Sí: Mantén las etiquetas del eje X en orden cronológico y con un formato corto (Ene, Sem 1).
- Sí: Describe la tendencia en el summary: es lo que un lector de pantalla necesita saber.
- No: No uses una línea para categorías sin orden natural; ahí va BarChart.
- No: No suavices datos de conteo exacto si la curva puede sugerir valores intermedios que no existen.

Relacionados: area-chart, bar-chart, sparkline-chart, chart-card, card

## Ejemplos

### Tendencia mensual

Doce puntos, curva suavizada. El tooltip y los ejes salen del tema sin configuración.

```tsx
const usuariosActivos = [
  { label: "Ene", value: 1180 },
  { label: "Feb", value: 1240 },
  { label: "Mar", value: 1310 },
  { label: "Abr", value: 1290 },
  { label: "May", value: 1420 },
  { label: "Jun", value: 1510 },
  { label: "Jul", value: 1470 },
  { label: "Ago", value: 1590 },
  { label: "Sep", value: 1680 },
  { label: "Oct", value: 1740 },
  { label: "Nov", value: 1810 },
  { label: "Dic", value: 1920 },
];

<LineChart
  title="Usuarios activos mensuales"
  description="Colaboradores con al menos una sesión en el mes"
  data={usuariosActivos}
  seriesName="Usuarios activos"
  height={260}
/>
```

### Sin suavizado

Con `smooth={false}` los segmentos son rectos: mejor cuando cada punto es una medición discreta y no una curva continua.

```tsx
const npsSemanal = [
  { label: "Sem 1", value: 42 },
  { label: "Sem 2", value: 45 },
  { label: "Sem 3", value: 41 },
  { label: "Sem 4", value: 48 },
  { label: "Sem 5", value: 52 },
  { label: "Sem 6", value: 50 },
  { label: "Sem 7", value: 55 },
  { label: "Sem 8", value: 58 },
];

<LineChart
  title="NPS semanal"
  description="Encuesta de satisfacción al cierre de cada semana"
  data={npsSemanal}
  seriesName="NPS"
  height={240}
  smooth={false}
/>
```

### Con resumen accesible y footer

El summary describe la tendencia en una frase; el footer indica la fuente y la fecha de corte.

```tsx
<LineChart
  title="Usuarios activos mensuales"
  data={usuariosActivos}
  seriesName="Usuarios activos"
  height={240}
  summary="Los usuarios activos crecieron de 1.180 en enero a 1.920 en diciembre, un 63 % más."
  footer="Fuente: analítica de plataforma · actualizado cada 24 horas"
/>
```

### Estado de error

Si `error` tiene valor gana sobre `loading` y `empty`.

```tsx
<LineChart
  title="Usuarios activos mensuales"
  data={usuariosActivos}
  height={180}
  error="El servicio de analítica no respondió a tiempo."
/>
```
