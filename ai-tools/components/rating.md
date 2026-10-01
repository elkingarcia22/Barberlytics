# Rating

Puntuación con estrellas para encuestas de satisfacción y evaluaciones. Editable es un radiogroup con una sola parada de tabulación y flechas; de solo lectura es un dato (`role="img"`), no un control, así que úsalo así en tablas y resúmenes.

Familia: Formularios · Doc: `/docs#/components/rating` · Fuente: `src/components/forms/Rating.tsx`

```ts
import { Rating } from "@/components/forms"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `number` |  | Valor controlado, de 0 a `max`. |
| `defaultValue` | `number` |  | Valor inicial cuando no está controlado. |
| `onValueChange` | `(value: number) => void` |  | Se llama al elegir una estrella (o media, con `allowHalf`). |
| `max` | `number` | `5` | Número de estrellas. |
| `allowHalf` | `boolean` | `false` | Permite medias estrellas (pasos de 0,5). |
| `readOnly` | `boolean` | `false` | Lo convierte en un dato (`role="img"`): sin botones, sin foco, con el puntaje en el `aria-label`. |
| `disabled` | `boolean` | `false` | Apaga la interacción y baja la opacidad. |
| `size` | `"sm" \| "default" \| "lg"` | `"default"` | Tamaño del icono, el texto del valor y el espaciado entre estrellas. |
| `tone` | `"warning" \| "primary"` | `"warning"` | Color de relleno de las estrellas activas. |
| `icon` | `React.ReactNode` |  | Reemplaza la estrella por otro icono (p. ej. un corazón). |
| `label` | `string` |  | Nombre accesible del grupo. Sin él, se anuncia «Puntuación» (editable) o el puntaje leído (solo lectura). |
| `showValue` | `boolean` | `false` | Muestra «4,2 de 5» junto a las estrellas, con formato numérico es-CO. |
| `id / className` | `string` |  | Se aplican al contenedor externo. |

## Guías

- Sí: Usa `readOnly` para mostrar un dato ya calculado (promedios, evaluaciones cerradas): no es un botón.
- Sí: Pon `allowHalf` solo si el dato realmente tiene precisión de 0,5; si no, el radiogroup ofrece pasos que no existen en tus datos.
- Sí: Da un `label` descriptivo («Satisfacción con la sesión», no «Rating») para que el lector de pantalla anuncie algo útil.
- No: No lo uses como un «me gusta» binario: para eso está un botón o un Switch.
- No: No mezcles tamaños de Rating en la misma tabla o listado.
- No: No dupliques el número si ya usas `showValue`; una sola fuente de verdad por fila.

Relacionados: field, number-field, badge

## Ejemplos

### Satisfacción de una sesión de formación

De solo lectura, con `showValue` para leer «4,2 de 5» sin contar estrellas a ojo.

```tsx
<Rating value={4.2} allowHalf readOnly showValue label="Satisfacción con la sesión" />
```

### Evaluación de desempeño en una fila de tabla

Tamaño `sm` de solo lectura, alineado con el resto de la fila; no lleva `showValue` porque el número ya está en la columna de al lado.

```tsx
<div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
  <span className="text-text-primary">Renata Gómez · Líder de equipo</span>
  <div className="flex items-center gap-3">
    <Rating value={3} size="sm" tone="primary" readOnly label="Evaluación de desempeño" />
    <span className="tabular-nums text-text-secondary">3,0</span>
  </div>
</div>
```

### Promedio general con media estrella

Tamaño `lg` para un dato destacado, como el resumen de una escuela o un programa completo.

```tsx
<Rating value={4.6} allowHalf readOnly showValue size="lg" label="Promedio del programa" />
```

### Calificar una sesión (editable)

Controlado con `Field`: la nota se emite en cada clic o con las flechas del teclado sobre el radiogroup.

```tsx
const [value, setValue] = React.useState(0);

<Field label="Califica esta sesión de formación">
  <Rating value={value} onValueChange={setValue} allowHalf label="Calificación de la sesión" />
</Field>
```
