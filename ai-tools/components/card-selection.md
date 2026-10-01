# CardSelection

Una grilla de tarjetas donde solo una puede estar elegida, con icono, eyebrow, badge y descripción por opción. Úsala cuando la decisión merece contexto visual, como elegir un formato, un plan o una plantilla.

Familia: Selección · Doc: `/docs#/components/card-selection` · Fuente: `src/components/selection/CardSelection.tsx`

```ts
import { CardSelection } from "@/components/selection"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `options` | `SelectionOption[]` |  | value, label, description, eyebrow, badge, icon y disabled por opción. |
| `value` | `string` |  | Valor elegido (controlado). |
| `onChange` | `(value: string) => void` |  | Se llama al pulsar una tarjeta. |
| `columns` | `1 \| 2 \| 3 \| 4` | `3` | Columnas en desktop; en móvil siempre es una. |
| `disabled` | `boolean` | `false` | Deshabilita todas las tarjetas. |
| `label` | `string` |  | Etiqueta del Field envolvente. |
| `description` | `string` |  | Ayuda bajo la grilla. |
| `error` | `string` |  | Mensaje de error del Field. |
| `className` | `string` |  | Clases para el contenedor. |

## Guías

- Sí: Úsala para 2 a 6 opciones con descripción; más de eso, pasa a OptionTile.
- Sí: Da a cada opción un icono o un eyebrow para que se distingan de un vistazo.
- Sí: Reserva el badge para una sola tarjeta (Recomendado, Popular).
- No: No la uses cuando el label basta: un RadioGroup normal es más liviano.
- No: No mezcles tarjetas con y sin descripción en la misma grilla.

Relacionados: radio-card-group, selectable-card, option-tile, radio-group, checkbox-card-group

## Ejemplos

### Con iconos y etiqueta

Cada opción es un botón con role=radio; el check aparece en la esquina de la elegida.

```tsx
const [value, setValue] = React.useState<string>();

<CardSelection
  label="Formato del contenido"
  description="Podrás cambiarlo antes de publicar."
  options={[
    { value: "course", label: "Curso", description: "Lecciones en video con evaluación final.", icon: BookOpen },
    { value: "path", label: "Ruta", description: "Varios cursos encadenados con un objetivo.", icon: Compass, badge: "Popular" },
    { value: "cohort", label: "Cohorte", description: "Sesiones en vivo con un facilitador.", icon: Users },
  ]}
  value={value}
  onChange={setValue}
/>
```

### Eyebrow, badge, error y opción deshabilitada

El error viene del Field interno y desaparece al elegir.

```tsx
<CardSelection
  label="Plan"
  columns={3}
  error={value ? undefined : "Elige un plan para continuar."}
  options={[
    { value: "starter", eyebrow: "Equipos pequeños", label: "Starter", description: "Hasta 50 colaboradores.", badge: "Gratis" },
    { value: "growth", eyebrow: "Empresas", label: "Growth", description: "Hasta 500 colaboradores.", badge: "Recomendado", icon: Sparkles },
    { value: "enterprise", eyebrow: "Corporativo", label: "Enterprise", description: "Ilimitado, SSO.", disabled: true },
  ]}
  value={value}
  onChange={setValue}
/>
```

### Una columna

En una columna las tarjetas se apilan; útil en drawers estrechos.

```tsx
<CardSelection columns={1} options={formats.slice(0, 2)} value="course" />
```
