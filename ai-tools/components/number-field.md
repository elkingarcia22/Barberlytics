# NumberField

Campo numérico con botones de − y +. Va con `inputMode="decimal"` y no con `type="number"`: así la rueda del ratón no cambia el valor al desplazar la página. Las flechas suben y bajan, Shift multiplica por diez y el valor se recorta a min/max al salir del campo.

Familia: Formularios · Doc: `/docs#/components/number-field` · Fuente: `src/components/forms/NumberField.tsx`

```ts
import { NumberField } from "@/components/forms"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `number \| null` |  | Valor controlado. `null` deja el campo vacío. |
| `defaultValue` | `number` |  | Valor inicial cuando no está controlado. |
| `onValueChange` | `(value: number \| null) => void` |  | Se llama con el valor saneado; `null` si el campo queda vacío. |
| `min / max` | `number` |  | Límites. El valor se recorta al salir del campo y apagan el botón correspondiente. |
| `step` | `number` | `1` | Salto de flechas y botones. Con Shift se multiplica por 10; PageUp/PageDown también. |
| `precision` | `number` |  | Decimales fijos al mostrar. Si no se pasa, se deducen del `step`. |
| `size` | `"sm" \| "default"` | `"default"` | Alto de 32px o de 40px, el mismo que Input. |
| `prefix / suffix` | `React.ReactNode` |  | Adornos dentro del campo: «$», «horas», «%». Son decorativos (`aria-hidden`). |
| `stepper` | `"inline" \| "sides" \| "none"` | `"inline"` | Botones pegados a la derecha, a cada lado, o sin botones. |
| `disabled / readOnly` | `boolean` |  | `readOnly` deja leer y copiar; `disabled` apaga el campo entero. |
| `aria-label` | `string` |  | Obligatorio si el campo no va dentro de un `Field` con etiqueta. |

## Guías

- Sí: Pon `min` y `max` siempre que existan: es lo que apaga los botones y evita el error después de enviar.
- Sí: Usa `suffix` para la unidad («horas», «%») en vez de meterla en la etiqueta.
- Sí: Deja que `Field` inyecte el `id` y la descripción; el campo los propaga al input.
- No: No lo uses para cantidades largas sin sentido aritmético (cédula, teléfono, código): ahí va Input o PhoneInput.
- No: No pongas `step` decimal sin `precision`: el valor acaba mostrando 0.30000000000000004.
- No: No escondas los límites en la ayuda si puedes expresarlos con `min`/`max`.

Relacionados: field, input, slider, rating

## Ejemplos

### Cupos de un plan de formación

Con min y max: los botones se apagan solos al tocar el límite y escribir 500 se recorta al salir del campo.

```tsx
const [seats, setSeats] = React.useState<number | null>(24);

<Field label="Cupos del plan de formación" error={seats < 19 ? "Hay 19 personas inscritas." : undefined}>
  <NumberField value={seats} onValueChange={setSeats} min={1} max={200} />
</Field>
```

### Duración en horas, con medios pasos

`step={0.5}` y `precision={1}` fijan el formato; `stepper="sides"` separa − y + a los lados.

```tsx
<NumberField
  value={hours}
  onValueChange={setHours}
  min={0.5}
  max={40}
  step={0.5}
  precision={1}
  suffix="horas"
  stepper="sides"
/>
```

### Porcentaje y moneda

`suffix` y `prefix` aceptan cualquier nodo. Sin botones (`stepper="none"`) el campo sigue respondiendo a las flechas.

```tsx
<NumberField value={progress} onValueChange={setProgress} min={0} max={100} step={5} suffix="%" />

<NumberField defaultValue={180000} min={0} step={10000} prefix="$" stepper="none" />
```

### Tamaño sm, solo lectura y deshabilitado

```tsx
<NumberField defaultValue={3} size="sm" />
<NumberField value={12} readOnly />
<NumberField value={12} disabled />
```
