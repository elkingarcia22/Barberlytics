# ChartCard

La Card pensada para alojar un gráfico: encabezado con eyebrow, título, descripción, acciones y un slot de filtros, y debajo un ChartShell que hereda todos los estados. Es la base de los presets BarChart, LineChart, AreaChart, DonutChart y HeatmapChart; los ejemplos se remontan al cambiar de tema en esta docs.

Familia: Gráficos · Doc: `/docs#/components/chart-card` · Fuente: `src/components/charts/ChartCard.tsx`

```ts
import { ChartCard } from "@/components/charts"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | Título visible de la tarjeta. Obligatorio; por defecto es también el ariaLabel. |
| `description` | `string` |  | Subtítulo bajo el título. |
| `meta` | `string` |  | Eyebrow en mayúsculas sobre el título (sección, rango de fechas). |
| `actions` | `React.ReactNode` |  | Acciones alineadas a la derecha del título. |
| `filters` | `React.ReactNode` |  | Slot bajo el encabezado para selects o segmentos. |
| `footer` | `React.ReactNode` |  | Notas al pie del gráfico. |
| `summary` | `React.ReactNode` |  | Resumen sr-only delegado a ChartShell. |
| `option` | `EChartsOption` |  | Option del gráfico. Se ignora si hay hijos. |
| `height` | `number \| string` | `300` | Alto del área del gráfico. |
| `loading` | `boolean` | `false` | Estado de carga. |
| `empty` | `boolean` | `false` | Estado vacío. |
| `error` | `string \| null` | `null` | Mensaje de error. |
| `ariaLabel` | `string` | `title` | Etiqueta accesible del region del gráfico. |
| `children` | `React.ReactNode` |  | Sustituye al EChart por contenido propio. |
| `className` | `string` |  | Clases para la Card. |
| `onChartReady` | `(instance: EChartsInstance) => void` |  | Se reenvía hasta el EChart. |

## Guías

- Sí: Escribe títulos que digan qué se mide y en qué unidad: «Horas de aprendizaje por área».
- Sí: Reserva actions para exportar o abrir el detalle; los filtros van en el slot filters.
- Sí: Mantén el mismo height entre tarjetas de una misma fila del dashboard.
- No: No pongas otra Card dentro como hijo: los bordes se duplican.
- No: No uses meta para texto largo; es un eyebrow de una o dos palabras.

Relacionados: chart-shell, bar-chart, line-chart, donut-chart, card

## Ejemplos

### Encabezado completo

Eyebrow, título, descripción, acciones, filtros y footer. El title también es el ariaLabel del gráfico.

```tsx
<ChartCard
  meta="Adopción"
  title="Colaboradores activos por área"
  description="Usuarios con al menos una sesión en el periodo"
  option={option}
  height={240}
  actions={
    <>
      <Button variant="ghost" size="icon-sm" aria-label="Descargar"><Download /></Button>
      <Button variant="ghost" size="icon-sm" aria-label="Más opciones"><MoreHorizontal /></Button>
    </>
  }
  filters={
    <Select defaultValue="q3">
      <SelectTrigger size="sm" className="w-[160px]"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="q2">Q2 2026</SelectItem>
        <SelectItem value="q3">Q3 2026</SelectItem>
        <SelectItem value="ytd">Año en curso</SelectItem>
      </SelectContent>
    </Select>
  }
  footer="Fuente: analítica de plataforma · actualizado hace 2 horas"
/>
```

### Estados

Cargando, vacío y error se delegan a ChartShell; el encabezado se mantiene para no perder contexto.

```tsx
<ChartCard title="Cargando" option={option} height={160} loading />
<ChartCard title="Sin datos" option={option} height={160} empty />
<ChartCard title="Con error" option={option} height={160} error="El reporte tardó demasiado en responder." />
```

### Contenido propio

Los hijos reemplazan al EChart, así puedes reutilizar el encabezado para una tabla o una lista de ranking.

```tsx
<ChartCard title="Ranking por área" description="Colaboradores activos" height="auto">
  <ol className="flex flex-col gap-2 text-sm">
    {ranking.map((item, i) => (
      <li key={item.area} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
        <span><span className="mr-2 text-muted-foreground">{i + 1}.</span>{item.area}</span>
        <span className="font-medium tabular-nums">{item.activos}</span>
      </li>
    ))}
  </ol>
</ChartCard>
```
