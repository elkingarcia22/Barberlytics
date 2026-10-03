# BarList

Un ranking: qué se vendió más, de dónde salió el ingreso, qué servicio se pidió. Cada fila lleva su nombre, una barra proporcional al máximo y su valor escrito; la barra compara y el número informa. Con título trae su propia Card; sin él es solo la lista, para meterla dentro de otro panel sin caja dentro de caja.

Familia: Gráficos · Doc: `/docs#/components/bar-list` · Fuente: `src/components/charts/BarList.tsx`

```ts
import { BarList } from "@/components/charts"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | Con título el componente se envuelve en su Card con `PanelHeading`; sin él es solo la lista. |
| `description` | `string` |  | Una línea apagada bajo el título. |
| `count` | `ReactNode` |  | Una cifra junto al título: cuántos elementos suman las filas, cuánto es el total. |
| `items` | `BarListItem[]` |  | Las filas: `{ id, label, value, tone?, meta? }`. `meta` es un segundo dato apagado junto al valor. |
| `formatValue` | `(value: number) => string` |  | Cómo se escribe el valor de cada fila; por defecto en es-ES. |
| `tone` | `"brand" \| "positive" \| "warning" \| "negative" \| "neutral"` | `"brand"` | El tono de las barras. Una fila puede traer el suyo. |
| `sorted` | `boolean` | `true` | Ordena de mayor a menor antes de pintar. |
| `limit` | `number` |  | Deja fuera las filas a partir de esta posición. |
| `actions` | `ReactNode` |  | Controles a la derecha del título. |
| `emptyLabel` | `string` |  | Qué decir cuando no hay filas. |

## Guías

- Sí: Deja que la barra compare y el número informe: el valor va siempre escrito.
- Sí: Apaga `sorted` cuando el orden significa algo (un desglose contable, los pasos de un embudo).
- Sí: Usa `meta` para el importe cuando la barra mide unidades, o al revés; nunca dos barras para el mismo concepto.
- No: No pases más de diez filas sin `limit`: a partir de ahí es una tabla, no un ranking.
- No: No mezcles tonos por fila sin motivo; el color por fila es para señalar una (la que está en riesgo), no para decorar.

Relacionados: bar-chart, composition-donut, distribution-bar, table-shell

## Ejemplos

### Ranking con importe al lado

`meta` pone un segundo dato apagado junto al valor: las unidades mandan en la barra y el importe acompaña. El título lleva la cifra total en su badge.

```tsx
const servicios = [
  { id: "maintenance", label: "Corte de mantenimiento", value: 148, meta: "US$ 6.660" },
  { id: "cut-beard", label: "Corte + barba", value: 68, meta: "US$ 4.420" },
  { id: "kids", label: "Corte infantil", value: 17, meta: "US$ 544" },
];

<BarList title="Servicios más vendidos" count={247} items={servicios} tone="positive" />
```

### Desglose en el orden del negocio

Con `sorted={false}` las filas se quedan como llegan: un desglose del ingreso se lee en el orden contable —servicios, productos, impuestos—, no de mayor a menor. `formatValue` escribe la moneda.

```tsx
<BarList
  title="Origen del ingreso"
  count="US$ 15.642"
  items={ingreso}
  formatValue={money}
  sorted={false}
/>
```

### Dentro de otro panel

Sin `title` el componente es solo la lista. Así entra en una Card que ya tiene cabecera propia sin duplicar el marco.

```tsx
<Card className="p-card">
  <h3 className="mb-stack text-sm font-semibold">Top 3 del mes</h3>
  <BarList items={servicios} limit={3} />
</Card>
```
