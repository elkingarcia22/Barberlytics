# DualDateRangePicker

Dos campos (inicio y cierre) que comparten un calendario de dos meses con pasos guiados, previsualización al pasar el ratón y confirmación explícita con Aplicar. Pensado para crear campañas o programas donde ambos extremos son obligatorios.

Familia: Fechas y rangos · Doc: `/docs#/components/dual-date-range-picker` · Fuente: `src/components/date/DualDateRangePicker.tsx`

```ts
import { DualDateRangePicker } from "@/components/date"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `startDate` | `Date \| null` |  | Fecha de inicio controlada. |
| `endDate` | `Date \| null` |  | Fecha de cierre controlada. |
| `onChange` | `(range: { startDate?: Date; endDate?: Date }) => void` |  | Se dispara en cada clic de día y al borrar o aplicar. |
| `onApply` | `() => void` |  | Se dispara al pulsar Aplicar, después de `onChange`. |
| `startLabel` | `string` | `"Fecha de inicio"` | Etiqueta del primer campo. |
| `endLabel` | `string` | `"Fecha de cierre"` | Etiqueta del segundo campo. |
| `startPlaceholder` | `string` | `"Selecciona fecha"` | Placeholder del campo de inicio. |
| `endPlaceholder` | `string` | `"Selecciona fecha"` | Placeholder del campo de cierre. |
| `startError` | `string` |  | Error bajo el campo de inicio. |
| `endError` | `string` |  | Error bajo el campo de cierre. |
| `minDate` | `Date` |  | Primer día seleccionable. |
| `maxDate` | `Date` |  | Último día seleccionable. |
| `autoCloseOnStartSelect` | `boolean` | `false` | Cierra el popover tras elegir el inicio en lugar de avanzar al cierre. |
| `open` | `boolean` |  | Estado abierto controlado; combínalo con `onOpenChange`. |
| `onOpenChange` | `(open: boolean) => void` |  | Notifica aperturas y cierres del popover. |
| `disabled` | `boolean` | `false` | Desactiva ambos campos. |
| `locale` | `string` | `"es"` | Locale para el formato `Mié. 9 sep. 2026` de los campos y el calendario. |
| `className` | `string` |  | Clases extra para el contenedor. |

## Guías

- Sí: Úsalo cuando inicio y cierre son campos de un formulario y cada uno puede tener su error.
- Sí: Dale al menos ~560px de ancho: el popover se alinea al ancho de los dos campos.
- Sí: Usa `onApply` para persistir y `onChange` solo para reflejar el estado.
- No: No lo uses como filtro rápido de tabla: ahí basta DateRangePicker.
- No: No cierres el popover desde fuera sin `open` controlado; el usuario espera confirmar con Aplicar.

Relacionados: date-range-picker, date-picker, calendar, popover

## Ejemplos

### Flujo inicio → cierre

Al elegir el inicio el calendario avanza solo al cierre; el popover se cierra con Aplicar o Borrar, no al hacer clic fuera.

```tsx
const [range, setRange] = React.useState({ startDate: undefined, endDate: undefined })

<DualDateRangePicker
  startDate={range.startDate}
  endDate={range.endDate}
  onChange={setRange}
  onApply={() => guardar(range)}
/>
```

### Apertura controlada desde un preset

Con `open`/`onOpenChange` un botón de duración fija las fechas y abre el calendario para confirmarlas. Los presets llevan `data-period-picker` para que su clic no quede bloqueado por el popover.

```tsx
const [open, setOpen] = React.useState(false)
const applyPreset = (days: number) => {
  const start = startOfToday()
  setRange({ startDate: start, endDate: addDays(start, days) })
  setOpen(true)
}

<div data-period-picker="">
  <Button onClick={() => applyPreset(7)}>7 días</Button>
</div>
<DualDateRangePicker
  startDate={range.startDate}
  endDate={range.endDate}
  onChange={setRange}
  open={open}
  onOpenChange={setOpen}
/>
```

### Con límites y placeholders

```tsx
<DualDateRangePicker
  startDate={range.startDate}
  endDate={range.endDate}
  onChange={setRange}
  minDate={today}
  maxDate={addDays(today, 60)}
  startPlaceholder="Desde hoy"
  endPlaceholder="Máx. 60 días"
/>
```
