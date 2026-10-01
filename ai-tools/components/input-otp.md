# InputOtp

Código de un solo uso repartido en celdas. Pegar el código completo lo distribuye desde la primera celda, Backspace retrocede y las flechas mueven. Cada celda es un input real con `autoComplete="one-time-code"`, así que el autorrelleno del teléfono lo encuentra.

Familia: Formularios · Doc: `/docs#/components/input-otp` · Fuente: `src/components/forms/InputOtp.tsx`

```ts
import { InputOtp } from "@/components/forms"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `length` | `number` | `6` | Número de celdas. |
| `value / onChange` | `string / (value: string) => void` |  | Valor controlado. Siempre es una cadena compacta, sin huecos. |
| `onComplete` | `(value: string) => void` |  | Se dispara al llenar la última celda. |
| `mask` | `boolean` | `false` | Oculta los caracteres, como una contraseña. |
| `groups` | `number[]` |  | Separadores visuales: `[3, 3]` pinta una raya en la mitad. |
| `type` | `"numeric" \| "alphanumeric"` | `"numeric"` | Qué caracteres se aceptan. El alfanumérico pasa a mayúsculas. |
| `disabled` | `boolean` |  | Apaga todas las celdas. |
| `autoFocus` | `boolean` |  | Enfoca la primera celda al montar. |
| `aria-label` | `string` | `"Código de verificación"` | Etiqueta del grupo; cada celda anuncia su posición. |

## Guías

- Sí: Verifica en `onComplete`: quien escribe un código no espera tener que pulsar «Continuar».
- Sí: Di en la descripción a dónde se envió el código y ofrece reenviarlo.
- Sí: Usa `groups` a partir de 6 celdas: leer 482 915 es más fácil que 482915.
- No: No lo uses para contraseñas ni para códigos largos: a partir de 8 celdas, Input normal.
- No: No borres el código al fallar la verificación sin decirlo; deja el foco en la primera celda y explica el error.
- No: No pongas `mask` en un código de un solo uso que caduca en minutos: estorba más de lo que protege.

Relacionados: field, input, phone-input

## Ejemplos

### Verificación en dos pasos del login

`onComplete` se dispara al llenar la última celda: es el momento de verificar, sin botón de por medio.

```tsx
const [code, setCode] = React.useState("");

<Field label="Verificación en dos pasos" description="Escribe el código de 6 dígitos que enviamos a tu correo.">
  <InputOtp value={code} onChange={setCode} onComplete={verificar} groups={[3, 3]} />
</Field>
```

### PIN oculto de 4 celdas

`mask` convierte cada celda en un campo de contraseña. Úsalo solo si el código es reutilizable.

```tsx
<InputOtp length={4} value={code} onChange={setCode} mask aria-label="PIN de la sesión" />
```

### Código de invitación alfanumérico

Con `type="alphanumeric"` se aceptan letras y se guardan en mayúsculas.

```tsx
<InputOtp length={6} value={code} onChange={setCode} type="alphanumeric" groups={[3, 3]} aria-label="Código de invitación" />
```

### Deshabilitado

Mientras se verifica el código, apaga el campo en vez de dejarlo editable.

```tsx
<InputOtp value="482915" disabled groups={[3, 3]} />
```
