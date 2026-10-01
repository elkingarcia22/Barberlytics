# EChart

El wrapper base de Apache ECharts: inicializa la instancia una sola vez, la redimensiona con ResizeObserver y la destruye al desmontar. Al montar resuelve el tema con getChartTheme(), que lee los tokens del <html> con getComputedStyle porque el canvas no entiende var(--token); en esta docs los ejemplos se remontan al cambiar de tema para reflejar los colores actuales.

Familia: Gráficos · Doc: `/docs#/components/echart` · Fuente: `src/components/charts/EChart.tsx`

```ts
import { EChart, getChartTheme } from "@/components/charts"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `option` | `EChartsOption` |  | El objeto de configuración de ECharts. Se aplica con notMerge en cada cambio. |
| `height` | `number \| string` | `300` | Alto del contenedor en px o valor CSS. El ancho siempre es 100%. |
| `loading` | `boolean` | `false` | Overlay con Skeleton mientras se cargan los datos. |
| `empty` | `boolean` | `false` | Overlay con EmptyState cuando no hay datos. |
| `className` | `string` |  | Clases para el contenedor externo. |
| `style` | `React.CSSProperties` |  | Estilos inline del contenedor; height se sobreescribe con la prop. |
| `onChartReady` | `(instance: EChartsInstance) => void` |  | Se llama tras el primer setOption con la instancia lista. |

## Guías

- Sí: Usa los presets (BarChart, LineChart…) para lo habitual y reserva EChart para options que no cubren.
- Sí: Deja que el tema pinte ejes, leyenda y tooltip: no repitas colores que ya salen de los tokens.
- Sí: Registra en registerECharts.ts cualquier serie o componente nuevo antes de usarlo en una option.
- No: No pases var(--token) dentro de la option: el canvas no lo resuelve y se pinta negro.
- No: No fijes el alto por CSS externo; usa la prop height para que ResizeObserver mida bien.

Relacionados: chart-shell, chart-card, bar-chart, line-chart

## Ejemplos

### Cómo se resuelve el tema

getChartTheme() se ejecuta en el momento del init. Las series usan los HEX de --color-brand, positive, warning, negative y text-secondary; los ejes, la leyenda y el tooltip envuelven los canales HSL de shadcn (--foreground, --muted-foreground, --border, --background) en hsl(). Cambia el tema arriba: estos valores se recalculan.

```tsx
import { getChartTheme } from "@/components/charts";

// Se llama al montar el gráfico. Lee <html> con getComputedStyle, así que
// el resultado depende del preset y del modo activos en ese instante.
const theme = getChartTheme();

theme.color;
// → ["#0c5bef", "#059669", "#ff7b0d", "#e9343c", "#5c646f"]
//    brand      positive   warning    negative   neutral

theme.textStyle.color;
// → "hsl(214, 19%, 23%)"  ← "214 19% 23%" de --foreground, con comas para zrender

// EChart lo pasa como tema de init:
echarts.init(el, theme);
```

### Option libre

Cualquier option de ECharts. Los ejes, la leyenda y el tooltip heredan el tema sin configurarlos.

```tsx
<EChart
  option={{
    tooltip: { trigger: "axis" },
    legend: { top: 0 },
    xAxis: { type: "category", data: meses },
    yAxis: { type: "value" },
    series: [
      { name: "Inscripciones", type: "bar", data: inscripciones },
      { name: "Completados", type: "line", smooth: true, data: completados },
    ],
  }}
  height={280}
/>
```

### Paleta propia

El tema trae cinco colores semánticos. Si necesitas más series, declara option.color y el tema deja de aplicar su paleta (los ejes y el tooltip siguen tematizados).

```tsx
<EChart
  option={{
    color: ["#0c5bef", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe", "#eff6ff"],
    tooltip: { trigger: "item" },
    series: [{ type: "pie", radius: ["45%", "72%"], data: areas }],
  }}
  height={280}
/>
```

### Cargando y vacío

Ambos estados son overlays: el div del canvas sigue en el DOM con visibility hidden, así el ResizeObserver conserva las medidas.

```tsx
<EChart option={option} height={180} loading />
<EChart option={option} height={180} empty />
```
