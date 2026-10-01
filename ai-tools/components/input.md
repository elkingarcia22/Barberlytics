# Input

Campo de texto de una línea (40px) con los estados de foco, deshabilitado y archivo del sistema. Úsalo para cualquier dato corto; para varias líneas usa Textarea y para iconos o botones integrados usa InputGroup.

Familia: Primitivos · Doc: `/docs#/components/input` · Fuente: `src/components/ui/input.tsx`

```ts
import { Input } from "@/components/ui/input"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `type` | `string` | `"text"` | Tipo nativo: text, email, password, number, search, date, file… |
| `value / defaultValue` | `string` |  | Valor controlado o inicial. |
| `onChange` | `(event) => void` |  | Se dispara con cada pulsación. |
| `placeholder` | `string` |  | Texto de ayuda dentro del campo; no sustituye a la etiqueta. |
| `disabled` | `boolean` | `false` | Bloquea la edición y baja la opacidad. |
| `aria-invalid` | `boolean` |  | Marca el campo como inválido para tecnologías de asistencia; combina con clases destructivas. |
| `ref` | `React.Ref<HTMLInputElement>` |  | Acceso al input nativo (forwardRef). |
| `...props` | `React.ComponentProps<"input">` |  | Cualquier atributo nativo de <input>. |

## Guías

- Sí: Acompaña siempre el campo de un Label asociado por `htmlFor`.
- Sí: Usa el `type` correcto para obtener el teclado adecuado en móvil.
- Sí: Muestra el error debajo del campo y enlázalo con `aria-describedby`.
- No: No uses el placeholder como única etiqueta.
- No: No cambies la altura por campo; mantén los 40px para alinear con botones `lg`.
- No: No pongas iconos dentro con posicionamiento manual; usa InputGroup.

Relacionados: label, input-group, textarea, select

## Ejemplos

### Con etiqueta, ayuda y validación

El padre controla el valor y marca `aria-invalid`; el texto de ayuda cambia de tono según el estado.

```tsx
const [value, setValue] = React.useState("");
const isValid = value === "" || EMAIL_RE.test(value);

<Label htmlFor="email">Correo corporativo</Label>
<Input
  id="email"
  type="email"
  value={value}
  onChange={(event) => setValue(event.target.value)}
  aria-invalid={!isValid}
  aria-describedby="email-hint"
  className={isValid ? undefined : "border-destructive focus-visible:ring-destructive/20"}
/>
<p id="email-hint" className={isValid ? "text-text-muted" : "text-destructive"}>…</p>
```

### Con botón

Input y Button en una fila; el botón se iguala a 40px con `className="h-10"`.

```tsx
<form className="flex gap-2" onSubmit={onSearch}>
  <Input type="search" placeholder="Buscar cursos…" aria-label="Buscar cursos" />
  <Button type="submit" className="h-10"><Search /> Buscar</Button>
</form>
```

### Tipos nativos

El navegador aporta teclado, validación y selector según el `type`.

```tsx
<Input type="number" placeholder="Cupos" min={1} />
<Input type="date" />
<Input type="password" placeholder="Contraseña" />
<Input type="file" />
```

### Deshabilitado y solo lectura

```tsx
<Input disabled placeholder="Deshabilitado" />
<Input readOnly value="Solo lectura" />
```
