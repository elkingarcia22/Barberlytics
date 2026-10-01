# DonutChart

Preset de dona o pastel sobre ChartCard para composiciones parte-todo: estado de los objetivos, modalidad de los cursos, distribución por sede. Funciona mejor con dos a ocho categorías y usa la paleta semántica del tema; se remonta al cambiar de tema en esta docs.

Familia: Gráficos · Doc: `/docs#/components/donut-chart` · Fuente: `src/components/charts/DonutChart.tsx`

```ts
import { DonutChart } from "@/components/charts"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `data` | `DonutChartData[]` |  | Arreglo de `{ label, value }`. Cada entrada es un sector; ECharts calcula el porcentaje. |
| `variant` | `"donut" \| "pie"` | `"donut"` | Dona con radio 40–70 % o pastel completo. |
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

- Sí: Limita la composición a ocho categorías; agrupa el resto en «Otros».
- Sí: Ordena los sectores de mayor a menor para que la lectura sea inmediata.
- Sí: Incluye los porcentajes en el summary o el footer: la dona no los muestra por defecto.
- No: No compares dos donas entre sí para ver cambios en el tiempo; usa barras o líneas.
- No: No lo uses cuando los valores son muy parecidos: los sectores se vuelven indistinguibles.

Relacionados: bar-chart, chart-card, echart, card

## Ejemplos

### Dona

La variante por defecto. Cuatro categorías toman los cuatro primeros colores del tema: brand, positive, warning y negative.

```tsx
const estadoObjetivos = [
  { label: "Cumplidos", value: 46 },
  { label: "En progreso", value: 31 },
  { label: "En riesgo", value: 12 },
  { label: "Sin iniciar", value: 11 },
];

<DonutChart
  title="Estado de los objetivos"
  description="Ciclo de desempeño Q3 2026"
  data={estadoObjetivos}
  seriesName="Objetivos"
  height={280}
/>
```

### Pastel

Con `variant="pie"` el radio interior es cero. Reserva esta forma para muy pocas categorías.

```tsx
const modalidad = [
  { label: "Virtual", value: 58 },
  { label: "Presencial", value: 24 },
  { label: "Híbrido", value: 18 },
];

<DonutChart
  title="Cursos por modalidad"
  data={modalidad}
  seriesName="Cursos"
  height={260}
  variant="pie"
/>
```

### Con acciones y resumen

El summary enumera los porcentajes para que la composición sea legible sin ver el lienzo.

```tsx
<DonutChart
  title="Estado de los objetivos"
  data={estadoObjetivos}
  seriesName="Objetivos"
  height={260}
  actions={<Button variant="ghost" size="icon-sm" aria-label="Descargar"><Download /></Button>}
  summary="Cumplidos 46 %, en progreso 31 %, en riesgo 12 %, sin iniciar 11 %."
  footer="Porcentaje sobre 214 objetivos activos"
/>
```
