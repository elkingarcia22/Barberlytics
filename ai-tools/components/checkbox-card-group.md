# CheckboxCardGroup

La grilla de tarjetas para selección múltiple: cada una alterna su presencia en un arreglo y muestra un checkbox cuadrado en la esquina. Úsala para activar módulos, permisos o funcionalidades cuando cada opción merece una descripción.

Familia: Selección · Doc: `/docs#/components/checkbox-card-group` · Fuente: `src/components/selection/CheckboxCardGroup.tsx`

```ts
import { CheckboxCardGroup } from "@/components/selection"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `options` | `SelectionOption[]` |  | value, label, description, eyebrow, badge, icon y disabled por opción. |
| `value` | `string[]` | `[]` | Valores marcados (controlado). |
| `onChange` | `(value: string[]) => void` |  | Recibe el arreglo resultante tras alternar una tarjeta. |
| `columns` | `1 \| 2 \| 3 \| 4` | `2` | Columnas en desktop. |
| `disabled` | `boolean` | `false` | Deshabilita todo el grupo. |
| `label` | `string` |  | Etiqueta del Field envolvente. |
| `description` | `string` |  | Ayuda bajo la grilla. |
| `error` | `string` |  | Mensaje de error del Field. |
| `className` | `string` |  | Clases para el contenedor. |

## Guías

- Sí: Úsalo para 2 a 8 opciones con descripción.
- Sí: Valida mínimos y máximos en el consumidor y comunícalos con `error`.
- No: No lo uses para una sola elección: RadioCardGroup o CardSelection.
- No: No superes cuatro columnas: las tarjetas pierden legibilidad.

Relacionados: card-selection, radio-card-group, selectable-card, checkbox, multi-select

## Ejemplos

### Controlado

onChange recibe el arreglo completo ya actualizado.

```tsx
const [value, setValue] = React.useState<string[]>(["reports", "reminders"]);

<CheckboxCardGroup
  label="Módulos activos"
  description="Puedes activar varios."
  options={[
    { value: "reports", label: "Reportes", description: "Avance por persona y por equipo.", icon: FileBarChart },
    { value: "reminders", label: "Recordatorios", description: "Notificaciones automáticas.", icon: Bell, badge: "Incluido" },
    { value: "integrations", label: "Integraciones", description: "Slack, Teams y calendario.", icon: Link2 },
    { value: "sso", label: "SSO", description: "Solo en plan Enterprise.", icon: ShieldCheck, disabled: true },
  ]}
  value={value}
  onChange={setValue}
/>
```

### Con mínimo requerido

Desmarca todas para ver el error del Field.

```tsx
<CheckboxCardGroup
  label="Elige al menos un módulo"
  columns={3}
  options={modules}
  value={value}
  onChange={setValue}
  error={value.length === 0 ? "Selecciona al menos uno." : undefined}
/>
```
