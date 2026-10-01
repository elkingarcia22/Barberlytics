# AIButton

El botón que dispara una acción de IA. Envuelve a Button con forma de píldora, la chispa como icono por defecto, el degradado de IA en la variante primaria y un estado de carga con texto propio.

Familia: IA · Doc: `/docs#/components/ai-button` · Fuente: `src/components/ai-interaction/AIButton.tsx`

```ts
import { AIButton } from "@/components/ai-interaction"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `label` | `string` |  | Texto del botón. Alternativamente se puede pasar como `children`. |
| `variant` | `"primary" \| "secondary" \| "subtle" \| "outline"` | `"primary"` | Intención visual. `primary` rellena con el degradado de IA; `secondary` y `outline` bordean con él. |
| `size` | `"xs" \| "sm" \| "md" \| "lg"` | `"md"` | Altura de 28, 32, 40 o 48px. |
| `loading` | `boolean` | `false` | Muestra el spinner, desactiva el botón y marca `aria-busy`. |
| `disabled` | `boolean` | `false` | Desactiva el botón. |
| `leftIcon` | `IconName` | `"sparkles"` | Icono a la izquierda del texto. |
| `rightIcon` | `IconName` |  | Icono a la derecha del texto. |
| `helperText` | `string` |  | Línea pequeña en cursiva bajo el botón para explicar qué hará la IA. |
| `onClick` | `() => void` |  | Callback al pulsar. |
| `type` | `"button" \| "submit" \| "reset"` | `"button"` | Tipo nativo del botón. |
| `className` | `string` |  | Clases extra para el contenedor. |

## Guías

- Sí: Úsalo solo para acciones que invocan a la IA: generar, resumir, sugerir.
- Sí: Añade `helperText` cuando el usuario necesite saber qué datos usará la IA.
- Sí: Refleja el proceso con `loading` en vez de deshabilitar sin explicación.
- No: No lo uses para acciones normales: el degradado de IA está reservado para superficies de IA.
- No: No pongas más de un AIButton primario por vista.
- No: No cambies el texto durante `loading` a algo que no describa lo que pasa.

Relacionados: button, ai-loader, chip

## Ejemplos

### Variantes

Solo `primary` lleva el degradado relleno; `secondary` y `outline` usan el borde con degradado y `subtle` es fantasma.

```tsx
<AIButton label="Generar" />
<AIButton label="Generar" variant="secondary" />
<AIButton label="Generar" variant="subtle" />
<AIButton label="Generar" variant="outline" />
```

### Tamaños

De xs (28px) a lg (48px). En `xs` el icono baja a 14px.

```tsx
<AIButton label="Sugerir" size="xs" />
<AIButton label="Sugerir" size="sm" />
<AIButton label="Sugerir" />
<AIButton label="Sugerir" size="lg" />
```

### Flujo de generación

Al pulsar, `loading` bloquea el botón y muestra el spinner con el mismo texto; al terminar vuelve a la chispa.

```tsx
const [loading, setLoading] = React.useState(false);

<AIButton
  label="Generar resumen"
  loading={loading}
  helperText="Usa las respuestas abiertas de la encuesta."
  onClick={() => setLoading(true)}
/>
```

### Iconos personalizados

`leftIcon` reemplaza la chispa por defecto; `rightIcon` añade uno al final. Ambos son nombres del registro ThemaIcon.

```tsx
<AIButton label="Analizar resultados" leftIcon="analytics" />
<AIButton label="Continuar" variant="outline" rightIcon="arrowRight" />
```
