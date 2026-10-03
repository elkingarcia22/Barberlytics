# DatePicker

Selector de una sola fecha que combina Popover y Calendar en un campo con etiqueta, ayuda y error. Trabaja con Date nativo y formatea el valor con Intl según el locale indicado.

Familia: Fechas y rangos · Doc: `/docs#/components/date-picker` · Fuente: `src/components/date/DatePicker.tsx`

```ts
import { DatePicker } from "@/components/date"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `Date \| null` |  | Fecha seleccionada. Las fechas inválidas o fuera de rango se muestran como vacías. |
| `onChange` | `(date: Date \| undefined) => void` |  | Se dispara al elegir un día; `undefined` al deseleccionarlo. |
| `placeholder` | `string` | `"Select a date"` | Texto del campo cuando no hay valor. |
| `label` | `string` |  | Etiqueta visible enlazada al botón por `aria-labelledby`. |
| `description` | `string` |  | Texto de ayuda bajo el campo. |
| `error` | `string` |  | Mensaje de error; activa el estado destructivo del campo. |
| `minDate` | `Date` |  | Primer día seleccionable (inclusive). |
| `maxDate` | `Date` |  | Último día seleccionable (inclusive). |
| `disabled` | `boolean` | `false` | Desactiva el campo y baja la opacidad de la etiqueta. |
| `locale` | `string` | `"en-US"` | Código Intl para formatear el valor; con `es*` el calendario también se traduce. |
| `className` | `string` |  | Clases extra para el contenedor. |

## Guías

- Sí: Pasa `locale="es-ES"` en producto para que campo y calendario hablen el mismo idioma.
- Sí: Limita con `minDate`/`maxDate` cuando el dominio lo exige (fechas futuras, cierre de periodo).
- Sí: Usa `error` con un mensaje accionable, no solo un borde rojo.
- No: No lo uses para rangos: existe DateRangePicker.
- No: No mezcles el formato Intl del campo con otro formato en el resto de la pantalla.

Relacionados: date-range-picker, calendar, popover, date-utils

## Ejemplos

### Controlado

El valor vive en el padre; el picker solo notifica la fecha elegida (o `undefined` al deseleccionar).

```tsx
const [date, setDate] = React.useState<Date | undefined>()

<DatePicker
  value={date}
  onChange={setDate}
  label="Fecha de entrega"
  placeholder="Elige una fecha"
  locale="es-ES"
/>
```

### Con fechas mínima y máxima

Los días fuera de `minDate`/`maxDate` se deshabilitan en el calendario y se ignoran si llegan por props.

```tsx
const today = startOfToday()
const [date, setDate] = React.useState<Date | undefined>(addDays(today, 3))

<DatePicker
  value={date}
  onChange={setDate}
  label="Fecha de inicio"
  description="Solo dentro de los próximos 30 días."
  minDate={today}
  maxDate={addDays(today, 30)}
  locale="es-ES"
/>
```

### Descripción, error y deshabilitado

```tsx
<DatePicker value={date} onChange={setDate} label="Con descripción" description="Formato dd/mm/aaaa." locale="es-ES" />
<DatePicker value={date} onChange={setDate} label="Con error" error="La fecha es obligatoria." locale="es-ES" />
<DatePicker value={date} onChange={setDate} label="Deshabilitado" disabled locale="es-ES" />
```

### Locale

`locale` cambia el formato del campo y, si empieza por `es`, también los nombres de meses y días del calendario.

```tsx
<DatePicker value={date} onChange={setDate} label="es-ES" locale="es-ES" />
<DatePicker value={date} onChange={setDate} label="en-US (por defecto)" />
```
