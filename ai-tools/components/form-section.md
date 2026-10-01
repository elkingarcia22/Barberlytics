# FormSection

Una tarjeta que agrupa campos relacionados bajo un título, una descripción y un slot de acciones. Úsala para dividir formularios largos en bloques con sentido propio: datos generales, configuración, permisos.

Familia: Formularios · Doc: `/docs#/components/form-section` · Fuente: `src/components/forms/FormSection.tsx`

```ts
import { FormSection } from "@/components/forms"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | Título del bloque, en 18px bold. |
| `description` | `string` |  | Texto secundario bajo el título. |
| `actions` | `React.ReactNode` |  | Botones o menús alineados a la derecha del encabezado. |
| `children` | `React.ReactNode` |  | Los campos; se separan con space-y-6. |
| `...props` | `React.HTMLAttributes<HTMLDivElement>` |  | Atributos de la Card contenedora. |

## Guías

- Sí: Agrupa de 2 a 6 campos por sección; más de eso, divide.
- Sí: Usa el título para nombrar el bloque, no la pantalla completa.
- Sí: Reserva las acciones para operaciones locales al bloque (añadir fila, restablecer).
- No: No anides FormSection dentro de FormSection.
- No: No pongas el botón de envío global dentro de una sección: va al pie del formulario.

Relacionados: field, card, section-header, button

## Ejemplos

### Con acción de guardado

El slot de acciones queda alineado con el título. Edita un campo para habilitar el botón.

```tsx
<FormSection
  title="Información general"
  description="Estos datos se muestran a los colaboradores invitados."
  actions={<Button size="sm" disabled={saved} onClick={save}>{saved ? "Guardado" : "Guardar"}</Button>}
>
  <Field label="Nombre del programa" required>
    <Input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
  </Field>
  <Field label="Descripción" description="Máximo 280 caracteres.">
    <Textarea placeholder="¿De qué trata este programa?" />
  </Field>
</FormSection>
```

### Filas de configuración

El contenido no tiene por qué ser inputs: cualquier fila con space-y-6 encaja.

```tsx
<FormSection title="Preferencias">
  <label className="flex items-center justify-between text-sm">
    Recordatorios automáticos
    <Switch checked={remind} onCheckedChange={setRemind} />
  </label>
  <label className="flex items-center justify-between text-sm">
    Certificado al finalizar
    <Switch checked={certificate} onCheckedChange={setCertificate} />
  </label>
</FormSection>
```

### Sin encabezado

Sin título ni acciones, la tarjeta añade el padding superior por sí sola.

```tsx
<FormSection>
  <Field label="Código de acceso">
    <Input placeholder="UB-2024-…" />
  </Field>
</FormSection>
```
