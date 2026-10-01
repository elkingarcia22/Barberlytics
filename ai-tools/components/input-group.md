# InputGroup

Campo compacto (32px) con complementos integrados: iconos, texto, botones o incluso un textarea con pie. Úsalo cuando el campo necesita contexto o una acción pegada (buscar, limpiar, mostrar contraseña); para un campo simple basta con Input.

Familia: Primitivos · Doc: `/docs#/components/input-group` · Fuente: `src/components/ui/input-group.tsx`

```ts
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupTextarea, InputGroupButton, InputGroupText } from "@/components/ui/input-group"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `InputGroup` | `React.ComponentProps<"div">` |  | Contenedor `role="group"` de 32px que dibuja borde, foco y estado inválido de su control. |
| `InputGroupAddon.align` | `"inline-start" \| "inline-end" \| "block-start" \| "block-end"` | `"inline-start"` | Posición del complemento. Los `block-*` apilan el grupo en columna. |
| `InputGroupInput` | `React.ComponentProps<"input">` |  | Input sin borde propio; hereda el foco del grupo. |
| `InputGroupTextarea` | `React.ComponentProps<"textarea">` |  | Textarea sin borde propio; el grupo crece en altura. |
| `InputGroupButton.size` | `"xs" \| "sm" \| "icon-xs" \| "icon-sm"` | `"xs"` | Botón compacto (ghost por defecto) para acciones dentro del campo. |
| `InputGroupButton.variant` | `ButtonProps["variant"]` | `"ghost"` | Variante del botón. |
| `InputGroupText` | `React.ComponentProps<"span">` |  | Texto o icono+texto en color secundario. |

## Guías

- Sí: Pon `aria-label` en los botones de solo icono dentro del grupo.
- Sí: Usa `InputGroupText` para unidades y prefijos fijos en lugar de placeholder.
- Sí: Mantén un solo botón por lado.
- No: No mezcles InputGroup (32px) con Input (40px) en la misma fila sin ajustar alturas.
- No: No anides otro InputGroup dentro.
- No: No uses addons `block-*` con inputs de una línea; son para textarea.

Relacionados: input, textarea, button, command

## Ejemplos

### Búsqueda con limpiar

Icono al inicio y un botón de limpiar que aparece solo cuando hay texto. Clic en el addon enfoca el input.

```tsx
const [query, setQuery] = React.useState("");

<InputGroup>
  <InputGroupAddon><Search /></InputGroupAddon>
  <InputGroupInput placeholder="Buscar…" value={query} onChange={(event) => setQuery(event.target.value)} />
  {query && (
    <InputGroupAddon align="inline-end">
      <InputGroupButton size="icon-xs" aria-label="Limpiar" onClick={() => setQuery("")}><X /></InputGroupButton>
    </InputGroupAddon>
  )}
</InputGroup>
```

### Mostrar u ocultar contraseña

```tsx
const [visible, setVisible] = React.useState(false);

<InputGroup>
  <InputGroupInput type={visible ? "text" : "password"} placeholder="Mínimo 8 caracteres" />
  <InputGroupAddon align="inline-end">
    <InputGroupButton size="icon-xs" aria-label="Mostrar contraseña" onClick={() => setVisible((value) => !value)}>
      {visible ? <EyeOff /> : <Eye />}
    </InputGroupButton>
  </InputGroupAddon>
</InputGroup>
```

### Prefijo y sufijo de texto

`InputGroupText` para unidades, dominios o protocolos.

```tsx
<InputGroup>
  <InputGroupAddon><InputGroupText><Link2 /> https://</InputGroupText></InputGroupAddon>
  <InputGroupInput placeholder="mi-empresa" />
  <InputGroupAddon align="inline-end"><InputGroupText>.thema.co</InputGroupText></InputGroupAddon>
</InputGroup>
```

### Textarea con contador

`InputGroupTextarea` + un addon `block-end` como pie del campo.

```tsx
<InputGroup>
  <InputGroupTextarea placeholder="Escribe una descripción corta…" rows={3} value={text} onChange={…} />
  <InputGroupAddon align="block-end" className="justify-end border-t">
    <InputGroupText>{text.length}/140</InputGroupText>
  </InputGroupAddon>
</InputGroup>
```
