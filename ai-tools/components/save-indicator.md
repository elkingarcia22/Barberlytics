# SaveIndicator

Indicador discreto del estado de autoguardado: en la nube, guardando, guardado, error o sin conexión. Icono y color cambian por estado, y con `timestamp` muestra la hora del último guardado.

Familia: IA · Doc: `/docs#/components/save-indicator` · Fuente: `src/components/ai-interaction/SaveIndicator.tsx`

```ts
import { SaveIndicator } from "@/components/ai-interaction"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `status` | `"idle" \| "saving" \| "saved" \| "error" \| "offline"` |  | Estado actual. Obligatorio. |
| `label` | `string` |  | Texto que reemplaza al del estado. |
| `timestamp` | `string` |  | Hora del último guardado; solo se muestra con `status="saved"`. |
| `compact` | `boolean` | `false` | Oculta el texto y deja solo el icono. |
| `className` | `string` |  | Clases extra para el contenedor. |

## Guías

- Sí: Colócalo cerca de lo que se guarda: en la cabecera del formulario o del editor.
- Sí: Pasa `timestamp` ya formateado en el idioma del usuario.
- Sí: Mantén el estado `saved` visible; no lo escondas al segundo.
- No: No lo uses como confirmación de acciones explícitas (para eso está el toast).
- No: No muestres `error` sin ofrecer una vía de reintento cerca.

Relacionados: badge, toast, input

## Ejemplos

### Estados

Cada estado trae icono, color y texto por defecto.

```tsx
<SaveIndicator status="idle" />
<SaveIndicator status="saving" />
<SaveIndicator status="saved" timestamp="10:42" />
<SaveIndicator status="error" />
<SaveIndicator status="offline" />
```

### Ciclo de autoguardado

Escribe en el campo: tras una pausa pasa a «Guardando…» y luego a «Guardado» con la hora.

```tsx
const [status, setStatus] = React.useState<SaveStatus>("idle");
const [savedAt, setSavedAt] = React.useState<string>();

// Al cambiar el valor (con debounce):
setStatus("saving");
await save();
setStatus("saved");
setSavedAt(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));

<SaveIndicator status={status} timestamp={savedAt} />
```

### Compacto

Solo el icono, para barras de herramientas o cabeceras estrechas.

```tsx
<SaveIndicator status="saving" compact />
<SaveIndicator status="saved" compact />
<SaveIndicator status="error" compact />
```
