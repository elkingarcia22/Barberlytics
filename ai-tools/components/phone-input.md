# PhoneInput

Teléfono con selector de país y prefijo. Hacia dentro se escribe agrupado («300 123 4567»); hacia fuera siempre emite E.164 («+573001234567»), que es el formato que guarda el backend.

Familia: Formularios · Doc: `/docs#/components/phone-input` · Fuente: `src/components/forms/PhoneInput.tsx`

```ts
import { PhoneInput } from "@/components/forms"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `string` |  | Valor controlado en E.164, p. ej. «+573001234567». |
| `onValueChange` | `(value: string) => void` |  | Se llama con el número en E.164; cadena vacía si no hay dígitos. |
| `defaultCountry` | `CountryCode` | `"CO"` | País preseleccionado cuando el campo empieza vacío (sin `value`). |
| `countries` | `readonly Country[]` | `PHONE_COUNTRIES` | Lista de países a ofrecer en el selector; por defecto LATAM + España + EE. UU. |
| `placeholder` | `string` |  | Si no se pasa, se arma con ceros agrupados según el país (p. ej. «300 123 4567»). |
| `disabled` | `boolean` |  | Apaga el selector de país y el input. |
| `id / className` | `string` |  | Se aplican al contenedor externo del selector y el input. |
| `...props` | `React.ComponentProps<"input">` |  | Resto de atributos nativos del input (excepto `value`, `defaultValue`, `onChange`, `type` y `prefix`, que controla el propio componente). |

## Guías

- Sí: Guarda siempre el E.164 que emite `onValueChange`; no reconstruyas el número a mano concatenando el prefijo.
- Sí: Deja `defaultCountry` en el país donde opera la mayoría de tus usuarios para no obligarlos a cambiarlo.
- Sí: Valida sobre el número nacional (longitud según el país), no sobre el string completo con el prefijo.
- No: No lo uses para documentos o códigos que no sean un teléfono real (cédula, NIT): ahí va `Input` o `NumberField`.
- No: No fuerces `type="tel"` ni un patrón propio por encima del componente; ya normaliza dígitos y formato.
- No: No amplíes `countries` con un catálogo mundial completo si el producto solo opera en un puñado de países: la lista corta agiliza el selector.

Relacionados: field, input, single-select

## Ejemplos

### Teléfono de contacto de un candidato

Controlado: `onValueChange` entrega el número en E.164, listo para guardar tal cual.

```tsx
const [phone, setPhone] = React.useState("");

<PhoneInput value={phone} onValueChange={setPhone} defaultCountry="CO" aria-label="Teléfono del candidato" />
```

### Dentro de Field, con error de validación

El error se calcula sobre el número nacional; `Field` inyecta la descripción y el error por `aria-describedby`.

```tsx
<Field
  label="Teléfono de contacto"
  description="Lo usamos para confirmar la entrevista por WhatsApp."
  error={incompleto ? "Verifica el número: faltan dígitos." : undefined}
>
  <PhoneInput value={phone} onValueChange={setPhone} defaultCountry="CO" />
</Field>
```

### Otro país por defecto

`defaultCountry` fija el prefijo inicial cuando el campo empieza vacío; la persona puede cambiarlo desde el selector.

```tsx
<PhoneInput defaultCountry="MX" aria-label="Teléfono" />
```

### Deshabilitado, en un resumen de perfil

`disabled` con un valor ya cargado, para mostrar el dato guardado sin permitir edición.

```tsx
<PhoneInput value="+573001234567" disabled aria-label="Teléfono registrado" />
```
