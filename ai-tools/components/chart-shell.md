# ChartShell

El contenedor estructural de todo gráfico: gestiona los cuatro estados (datos, cargando, vacío y error), anuncia el lienzo como region role="img" y expone un resumen solo para lectores de pantalla. Renderiza EChart por defecto o cualquier contenido que pases como hijos, y en esta docs se remonta al cambiar de tema.

Familia: Gráficos · Doc: `/docs#/components/chart-shell` · Fuente: `src/components/charts/ChartShell.tsx`

```ts
import { ChartShell } from "@/components/charts"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `option` | `EChartsOption` |  | Option para el EChart interno. Se ignora si hay hijos. |
| `height` | `number \| string` | `300` | Alto del área del gráfico; se aplica al region y al EChart. |
| `loading` | `boolean` | `false` | Overlay de Skeleton. |
| `empty` | `boolean` | `false` | Overlay de estado vacío. |
| `error` | `string \| null` | `null` | Mensaje de error; reemplaza el gráfico y tiene prioridad sobre loading y empty. |
| `ariaLabel` | `string` | `"Gráfico"` | Etiqueta del region role="img" y del section. |
| `summary` | `React.ReactNode` |  | Resumen sr-only con los datos del gráfico. |
| `footer` | `React.ReactNode` |  | Contenido bajo el gráfico, en texto secundario. |
| `children` | `React.ReactNode` |  | Sustituye al EChart por contenido propio. |
| `className` | `string` |  | Clases para el section raíz. |
| `onChartReady` | `(instance: EChartsInstance) => void` |  | Se reenvía al EChart interno. |

## Guías

- Sí: Pasa siempre un ariaLabel descriptivo: es lo único que lee un lector de pantalla del canvas.
- Sí: Aporta summary cuando los valores importan para tomar una decisión.
- Sí: Usa el footer para la fuente y la fecha de corte de los datos.
- No: No lo uses suelto en una pantalla: envuélvelo con ChartCard o una Card para darle título visible.
- No: No dupliques el estado de error con un toast; el shell ya lo muestra en contexto.

Relacionados: echart, chart-card, card

## Ejemplos

### Con resumen accesible

El summary se renderiza sr-only: un lector de pantalla obtiene los valores sin depender del canvas.

```tsx
<ChartShell
  option={option}
  height={260}
  ariaLabel="Objetivos cumplidos por equipo"
  summary={
    <ul>
      {equipos.map((equipo, i) => (
        <li key={equipo}>{equipo}: {cumplidos[i]} objetivos cumplidos</li>
      ))}
    </ul>
  }
/>
```

### Estado de error

Si error tiene valor gana sobre loading y empty. Es un bloque inline, no una Card, para no anidar bordes dentro de ChartCard.

```tsx
<ChartShell
  option={option}
  height={200}
  error="No se pudo conectar con el servicio de reportes."
/>
```

### Contenido propio

Con hijos, ChartShell ignora option y solo aporta la estructura, la altura y el footer. Útil para visualizaciones en HTML puro.

```tsx
<ChartShell
  height="auto"
  ariaLabel="Avance de objetivos por equipo"
  footer="Porcentaje de objetivos cumplidos sobre el total del trimestre"
>
  <ul className="flex flex-col gap-3">
    {equipos.map((equipo, i) => (
      <li key={equipo} className="grid grid-cols-[96px_1fr_40px] items-center gap-3 text-sm">
        <span>{equipo}</span>
        <Progress value={(cumplidos[i] / totales[i]) * 100} />
        <span className="text-right text-muted-foreground">{Math.round((cumplidos[i] / totales[i]) * 100)}%</span>
      </li>
    ))}
  </ul>
</ChartShell>
```
