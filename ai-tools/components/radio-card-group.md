# RadioCardGroup

Las mismas tarjetas de CardSelection, pero montadas sobre Radix RadioGroup: navegación con flechas, roving tabindex y un input oculto con name para formularios nativos. Es la opción a elegir cuando el grupo vive dentro de un form o necesita accesibilidad de radio real.

Familia: Selección · Doc: `/docs#/components/radio-card-group` · Fuente: `src/components/selection/RadioCardGroup.tsx`

```ts
import { RadioCardGroup } from "@/components/selection"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `options` | `SelectionOption[]` |  | value, label, description, eyebrow, badge, icon y disabled por opción. |
| `value` | `string` |  | Valor elegido (controlado). |
| `onChange` | `(value: string) => void` |  | Recibe el nuevo valor desde Radix. |
| `name` | `string` |  | Nombre del input oculto para envíos nativos de formulario. |
| `columns` | `1 \| 2 \| 3 \| 4` | `2` | Columnas en desktop. |
| `disabled` | `boolean` | `false` | Deshabilita todo el grupo. |
| `label` | `string` |  | Etiqueta del Field envolvente. |
| `description` | `string` |  | Ayuda bajo la grilla. |
| `error` | `string` |  | Mensaje de error del Field. |
| `className` | `string` |  | Clases para el contenedor. |

## Guías

- Sí: Prefiérelo sobre CardSelection dentro de formularios o cuando importa la navegación con teclado.
- Sí: Pasa `name` si el formulario se envía de forma nativa.
- No: No lo uses para selección múltiple: usa CheckboxCardGroup.
- No: No dejes el grupo sin valor inicial si hay una opción por defecto razonable.

Relacionados: card-selection, radio-group, checkbox-card-group, field

## Ejemplos

### Navegación con teclado

Enfoca una tarjeta y usa las flechas: Radix mueve la selección y salta las deshabilitadas.

```tsx
const [value, setValue] = React.useState<string>("chat");

<RadioCardGroup
  name="channel"
  label="Canal de recordatorios"
  options={[
    { value: "email", label: "Correo", description: "Un resumen por correo cada semana.", icon: Mail },
    { value: "chat", label: "Chat interno", description: "Mensaje directo.", icon: MessageSquare, badge: "Nuevo" },
    { value: "push", label: "Notificación push", description: "Aviso inmediato.", icon: Zap },
    { value: "digest", label: "Agenda", description: "Se integra con tu calendario.", icon: CalendarClock, disabled: true },
  ]}
  value={value}
  onChange={setValue}
/>
```

### Dentro de un formulario

Envía sin elegir para ver el error del Field.

```tsx
<form onSubmit={handleSubmit}>
  <RadioCardGroup
    name="channel"
    columns={3}
    label="Canal"
    options={channels}
    value={value}
    onChange={setValue}
    error={submitted && !value ? "Selecciona un canal." : undefined}
  />
  <Button type="submit" size="sm">Guardar preferencia</Button>
</form>
```
