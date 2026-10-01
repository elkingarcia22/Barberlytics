# KpiCard

Tarjeta de indicador para dashboards: título, valor grande siempre en texto, delta coloreado por tendencia y un sparkline opcional como contexto visual. El valor nunca depende del canvas, así que la tarjeta es legible aunque el gráfico no cargue; el sparkline se remonta al cambiar de tema en esta docs.

Familia: Gráficos · Doc: `/docs#/components/kpi-card` · Fuente: `src/components/charts/KpiCard.tsx`

```ts
import { KpiCard } from "@/components/charts"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | Título en texto secundario. Obligatorio; es también el ariaLabel por defecto del valor. |
| `value` | `string \| number` |  | El valor principal, ya formateado (separadores, unidad, símbolo). Siempre visible como texto. |
| `delta` | `string` |  | Variación frente al periodo anterior, p. ej. «+8,5 %». Se colorea según `trend`. |
| `trend` | `"positive" \| "negative" \| "neutral"` | `"neutral"` | Color del delta (status-positive, status-negative o muted) y opacidad del sparkline. |
| `description` | `string` |  | Aclaración corta bajo el valor: contra qué se compara o qué periodo cubre. |
| `sparklineData` | `SparklineDatum[]` |  | Serie para el sparkline de 40 px con tooltip. Si falta o está vacía no se renderiza. |
| `actions` | `React.ReactNode` |  | Acciones a la derecha del título (menú, enlace). |
| `footer` | `React.ReactNode` |  | Contenido bajo una línea divisoria: fecha de corte, enlace al detalle. |
| `ariaLabel` | `string` | `title` | Etiqueta accesible del valor principal. |
| `className` | `string` |  | Clases para la Card. |

## Guías

- Sí: Formatea el valor antes de pasarlo: «1.740», «5,1 h», «72 %». La tarjeta no formatea.
- Sí: Elige `trend` por lo que significa el cambio, no por su signo: una rotación que sube es negativa.
- Sí: Mantén la misma altura en una fila pasando o no `sparklineData` a todas las tarjetas.
- No: No pongas el dato clave solo en el sparkline; el valor en texto es la información, la línea es contexto.
- No: No uses más de cuatro o cinco KpiCard seguidas; a partir de ahí el ojo deja de priorizar.

Relacionados: sparkline-chart, chart-card, card

## Ejemplos

### Fila de indicadores

Tres o cuatro KpiCard en una cuadrícula abren casi todo dashboard. La tendencia colorea solo el delta.

```tsx
<div className="grid gap-4 md:grid-cols-3">
  <KpiCard title="Colaboradores activos" value="1.740" delta="+8,5 %" trend="positive" description="Frente a la semana anterior" sparklineData={activosPorSemana} />
  <KpiCard title="Horas por colaborador" value="5,1 h" delta="+0,3 h" trend="positive" description="Promedio semanal" sparklineData={horasPorSemana} />
  <KpiCard title="Rotación voluntaria" value="4,8 %" delta="+1,7 pp" trend="negative" description="Acumulado del trimestre" sparklineData={rotacionPorSemana} />
</div>
```

### Sin sparkline

Cuando no hay serie histórica la tarjeta sigue funcionando: valor, delta y descripción bastan.

```tsx
<div className="grid gap-4 md:grid-cols-2">
  <KpiCard title="Objetivos activos" value={214} description="En 5 equipos" />
  <KpiCard title="Cumplimiento" value="72 %" delta="±0 pp" trend="neutral" description="Sin cambios frente al mes anterior" />
</div>
```

### Con acciones y footer

Las acciones van a la derecha del título; el footer, separado por una línea, sirve para la fecha de corte o un enlace al detalle.

```tsx
<KpiCard
  className="max-w-xs"
  title="Cumplimiento de objetivos"
  value="72 %"
  delta="+1 pp"
  trend="positive"
  description="Objetivos cerrados sobre el total"
  sparklineData={cumplimientoPorSemana}
  actions={<Button variant="ghost" size="icon-xs" aria-label="Más opciones"><MoreHorizontal /></Button>}
  footer="Corte al 30 de septiembre · ver detalle"
/>
```
