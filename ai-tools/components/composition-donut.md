# CompositionDonut

El reparto de un total en pocas partes como panel de tablero: un anillo mudo con el total escrito en el centro y una leyenda al lado con cada parte, su valor y su porcentaje. A diferencia de DonutChart, el dato es la leyenda y el anillo es contexto; el texto lo pone el DOM, así que sigue al tema y a la densidad sin pasar por el canvas.

Familia: Gráficos · Doc: `/docs#/components/composition-donut` · Fuente: `src/components/charts/CompositionDonut.tsx`

```ts
import { CompositionDonut } from "@/components/charts"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | Qué reparte el panel. Va en la cabecera compartida de los paneles (`PanelHeading`). |
| `description` | `string` |  | Una línea apagada bajo el título. |
| `slices` | `CompositionSlice[]` |  | Las partes: `{ id, label, value, tone? }`. El tono es uno de los del sistema; sin él, el color sale por posición del ciclo del tema. |
| `center` | `{ value: ReactNode; label?: string }` |  | Lo que va escrito en el centro. Por defecto, la suma de las porciones formateada. Una cifra larga baja de tamaño sola. |
| `formatValue` | `(value: number) => string` |  | Cómo se escribe cada valor de la leyenda; por defecto en es-ES. |
| `showShare` | `boolean` | `false` | Añade el porcentaje sobre el total a cada fila. |
| `size` | `number` | `136` | Diámetro del anillo en píxeles. |
| `actions` | `ReactNode` |  | Controles a la derecha del título. |
| `emptyLabel` | `string` |  | Qué decir cuando no hay porciones o todas valen cero. |
| `ariaLabel` | `string` |  | Cómo se anuncia el anillo; por defecto, el título con cada parte y su valor. |

## Guías

- Sí: Úsalo para un reparto de dos a cinco partes; a partir de seis, la leyenda deja de caber al lado y el anillo deja de leerse.
- Sí: Da tono a las porciones que son estados (positivo, aviso, negativo) y déjalo vacío cuando solo son «otra parte».
- Sí: Pasa `center` cuando el total tiene otra unidad o nombre que la suma: 303 clientes sobre 369 citas.
- Sí: Formatea el valor con la misma función que el resto del tablero, para que «US$ 14.641» se escriba igual en la tarjeta y en la leyenda.
- No: No lo uses para analizar una distribución con etiquetas sobre las porciones: para eso está `DonutChart`.
- No: No pintes un 0 como un anillo lleno de gris con una leyenda de ceros; deja que muestre su vacío.
- No: No lo metas dentro de otra `Card`: ya trae la suya.

Relacionados: donut-chart, distribution-bar, bar-list, metric-card

## Ejemplos

### Tres repartos en una fila

La forma natural del panel: tres tercios de fila con la misma anatomía. Con tono por porción cuando las partes son estados (completada, cancelada); sin tono cuando no significan nada más que «otra parte», y entonces el ciclo del tema reparte los colores.

```tsx
const citas = [
  { id: "completed", label: "Completadas", value: 247, tone: "positive" },
  { id: "pending", label: "Por cobrar", value: 23, tone: "warning" },
  { id: "cancelled", label: "Canceladas", value: 86, tone: "negative" },
  { id: "noShow", label: "No-show", value: 13, tone: "neutral" },
];

<div className="grid gap-3 lg:grid-cols-2">
  <CompositionDonut title="En qué acabaron las citas" center={{ value: 303, label: "clientes" }} slices={citas} showShare />
  <CompositionDonut title="Cómo se pagó" center={{ value: money(14641), label: "cobrado" }} slices={pagos} formatValue={money} showShare />
</div>
```

### Sin datos

Con todas las porciones a cero el anillo baja a un aro neutro y la leyenda cede el sitio a una línea que lo dice. Nunca un anillo pintado sobre nada.

```tsx
<CompositionDonut title="Cómo se agendaron" slices={[]} emptyLabel="Sin citas en este periodo" />
```
