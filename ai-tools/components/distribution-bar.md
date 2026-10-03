# DistributionBar

Un total repartido en pocos tramos contiguos —mañana, tarde y noche; con cita, sin cita— como una sola barra donde cada tramo ocupa lo que le toca, y debajo la leyenda con cada parte, su valor y su porcentaje. Es el hermano lineal de CompositionDonut: la misma pregunta cuando las partes tienen un orden natural que en un anillo se pierde.

Familia: Gráficos · Doc: `/docs#/components/distribution-bar` · Fuente: `src/components/charts/DistributionBar.tsx`

```ts
import { DistributionBar } from "@/components/charts"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | Con título se envuelve en su Card con `PanelHeading`; sin él es solo la barra con su leyenda. |
| `description` | `string` |  | Una línea apagada bajo el título. |
| `segments` | `DistributionSegment[]` |  | Los tramos, en el orden en que se pintan: `{ id, label, value, tone?, hint? }`. |
| `formatValue` | `(value: number) => string` |  | Cómo se escribe cada valor; por defecto en es-ES. |
| `unit` | `string` |  | La unidad que acompaña al valor en la leyenda: «citas», «ventas». |
| `actions` | `ReactNode` |  | Controles a la derecha del título. |
| `emptyLabel` | `string` |  | Qué decir cuando todos los tramos valen cero. |
| `ariaLabel` | `string` |  | Cómo se anuncia la barra; por defecto, el título con cada tramo y su valor. |

## Guías

- Sí: Úsalo cuando los tramos tienen un orden natural (horas del día, pasos de un embudo, tallas).
- Sí: Mantén los tramos entre dos y cinco: más allá la barra se llena de rayas que no se distinguen.
- Sí: Da el mismo tono a la misma franja en todo el producto: la mañana es siempre ámbar, la tarde siempre marca.
- No: No lo uses para comparar magnitudes independientes; eso es un `BarList`.
- No: No lo pintes con todos los tramos en el mismo tono: sin contraste no hay reparto.

Relacionados: composition-donut, bar-list, progress

## Ejemplos

### Franjas del día

Los tramos van en el orden de la barra —mañana, tarde, noche— y cada uno lleva su franja como `hint`. Los tonos son los del sistema.

```tsx
const franjas = [
  { id: "morning", label: "Mañana", hint: "hasta las 12", value: 105, tone: "warning" },
  { id: "afternoon", label: "Tarde", hint: "12 a 17", value: 138, tone: "brand" },
  { id: "evening", label: "Noche", hint: "desde las 17", value: 126, tone: "neutral" },
];

<DistributionBar title="Cuándo se reservan" unit="citas" segments={franjas} />
```

### Sin tono ni tarjeta

Sin `tone` el ciclo del tema reparte los colores; sin `title` es solo la barra con su leyenda, para meterla en otro panel.

```tsx
<DistributionBar unit="citas" segments={canales} />
```
