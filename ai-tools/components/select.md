# Select

Desplegable de una sola opción con chevron que gira al abrir, píldora de resaltado que se desliza entre ítems y entrada en cascada. Úsalo para listas de 5 a ~30 opciones conocidas; para buscar entre muchas, usa Command.

Familia: Primitivos · Doc: `/docs#/components/select` · Fuente: `src/components/ui/select.tsx`

```ts
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value / defaultValue` | `string` |  | Opción elegida (controlado / inicial), en `Select`. |
| `onValueChange` | `(value: string) => void` |  | Se dispara al elegir. |
| `disabled` | `boolean` | `false` | En `Select` desactiva el control; en `SelectItem`, esa opción. |
| `SelectTrigger.size` | `"sm" \| "default"` | `"default"` | Marca `data-size`; combina con `h-8 text-xs` para la versión compacta. |
| `SelectValue.placeholder` | `string` |  | Texto cuando no hay valor. |
| `SelectContent.position` | `"item-aligned" \| "popper"` | `"item-aligned"` | Alineado al ítem activo (nativo) o colgando del disparador. |
| `SelectContent.collisionPadding` | `number` | `16` | Margen con los bordes del viewport. |

## Guías

- Sí: Pon un placeholder que diga qué se elige, no «Seleccionar».
- Sí: Agrupa con SelectLabel cuando hay más de ~8 opciones.
- Sí: Asocia un Label con `htmlFor` al id del SelectTrigger.
- No: No lo uses para 2–4 opciones visibles: usa RadioGroup o Tabs.
- No: No lo uses para selección múltiple.
- No: No pongas acciones en la lista: es para elegir un valor.

Relacionados: radio-group, command, dropdown-menu, input, label

## Ejemplos

### Controlado con Label

```tsx
const [area, setArea] = React.useState("Personas");

<Label htmlFor="area">Área</Label>
<Select value={area} onValueChange={setArea}>
  <SelectTrigger id="area"><SelectValue placeholder="Elige un área" /></SelectTrigger>
  <SelectContent>
    {areas.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
  </SelectContent>
</Select>
```

### Grupos y separador

SelectLabel titula cada grupo; SelectSeparator dibuja la línea entre ellos.

```tsx
<Select defaultValue="bogota">
  <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Colombia</SelectLabel>
      <SelectItem value="bogota">Bogotá</SelectItem>
      <SelectItem value="medellin">Medellín</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>México</SelectLabel>
      <SelectItem value="cdmx">Ciudad de México</SelectItem>
      <SelectItem value="gdl">Guadalajara</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

### Posición popper y opción deshabilitada

`position="popper"` cuelga el panel bajo el disparador con su mismo ancho, en vez de alinear el ítem activo.

```tsx
<Select>
  <SelectTrigger className="w-64"><SelectValue placeholder="Plantilla" /></SelectTrigger>
  <SelectContent position="popper">
    <SelectItem value="pulse">Pulso semanal</SelectItem>
    <SelectItem value="climate">Clima organizacional</SelectItem>
    <SelectItem value="exit" disabled>Salida (próximamente)</SelectItem>
  </SelectContent>
</Select>
```
