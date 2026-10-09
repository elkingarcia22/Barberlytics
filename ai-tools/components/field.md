# Field

El envoltorio de un control de formulario: etiqueta, descripción, error y estado deshabilitado, con los ids y aria-describedby inyectados en el hijo. Úsalo alrededor de cualquier Input, Textarea o Select para que todos los campos compartan la misma jerarquía y accesibilidad.

Familia: Formularios · Doc: `/docs#/components/field` · Fuente: `src/components/forms/Field.tsx`

```ts
import { Field } from "@/components/forms"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `label` | `string` |  | Texto de la etiqueta. Se enlaza al hijo mediante htmlFor/id. |
| `description` | `string` |  | Ayuda contextual bajo el control. Se oculta mientras haya error. |
| `error` | `string` |  | Mensaje de error; se anuncia vía aria-describedby y marca el control con aria-invalid, que Input, Textarea y PhoneInput pintan con borde y anillo destructivos. |
| `required` | `boolean` | `false` | Añade el asterisco rojo a la etiqueta. |
| `disabled` | `boolean` | `false` | Atenúa la etiqueta y propaga disabled al hijo. |
| `children` | `React.ReactNode` |  | El control. Si es un elemento válido recibe id, disabled y aria-describedby. |
| `...props` | `React.HTMLAttributes<HTMLDivElement>` |  | Atributos del contenedor. |

## Guías

- Sí: Envuelve cada control de un formulario en un Field, incluso sin descripción.
- Sí: Escribe errores accionables: qué pasó y cómo corregirlo.
- Sí: Al intentar seguir con datos que faltan, marca el campo y repite el mensaje en un toast (en la reserva: toastMissing).
- Sí: Marca como requeridos solo los campos que bloquean el envío.
- No: No pongas varios controles dentro de un mismo Field: el id solo llega al primero.
- No: No uses la descripción para repetir la etiqueta.

Relacionados: input, textarea, label, form-section, single-select

## Ejemplos

### Etiqueta y descripción

El hijo recibe el id de la etiqueta y el aria-describedby de la descripción sin configurar nada.

```tsx
<Field label="Nombre del equipo" description="Aparece en los reportes y en la sidebar.">
  <Input placeholder="Ej. Producto LATAM" />
</Field>
```

### Error en vivo

Cuando hay error, la descripción se oculta y el mensaje toma su lugar. Edita el correo para verlo.

```tsx
const [value, setValue] = React.useState("ana@thema");
const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

<Field
  label="Correo corporativo"
  required
  description="Usaremos este correo para enviarte las invitaciones."
  error={isValid ? undefined : "Escribe un correo válido, por ejemplo ana@empresa.com"}
>
  <Input type="email" value={value} onChange={(e) => setValue(e.target.value)} />
</Field>
```

### Con Textarea y deshabilitado

```tsx
<Field label="Objetivo del programa" disabled description="Solo un administrador puede editar este campo.">
  <Textarea defaultValue="Fortalecer las habilidades de liderazgo del equipo comercial." />
</Field>
```

### Piezas sueltas

FieldLabel, FieldDescription y FieldError sirven para layouts que Field no cubre, como un switch alineado a la derecha.

```tsx
<div className="flex items-start justify-between gap-6 rounded-xl border border-border/60 bg-surface p-4">
  <div className="space-y-1">
    <FieldLabel htmlFor="notify">Notificaciones semanales</FieldLabel>
    <FieldDescription>Resumen de avances cada lunes a las 8:00.</FieldDescription>
    {!enabled && <FieldError>Sin notificaciones no recibirás recordatorios.</FieldError>}
  </div>
  <Switch id="notify" checked={enabled} onCheckedChange={setEnabled} />
</div>
```
