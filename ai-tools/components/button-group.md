# ButtonGroup

Une varios Button (o un botón y un trigger) en un solo control: quita los radios internos y solapa los bordes un píxel. Úsalo para acciones hermanas (Exportar / Importar), botones divididos y paginadores compactos.

Familia: Primitivos · Doc: `/docs#/components/button-group` · Fuente: `src/components/ui/button-group.tsx`

```ts
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Dirección del grupo. En vertical los hijos ocupan el ancho completo. |
| `...props` | `React.ComponentProps<"div">` |  | Se renderiza con `role="group"`; añade `aria-label` para nombrarlo. |
| `ButtonGroupSeparator.orientation` | `"horizontal" \| "vertical"` | `"vertical"` | Usa `horizontal` dentro de un grupo vertical. Es un Separator decorativo con color `border`. |

## Guías

- Sí: Agrupa solo acciones relacionadas y del mismo tamaño.
- Sí: Usa `outline` o `secondary` para grupos de iguales; reserva `default` para el botón dividido.
- Sí: Nombra el grupo con `aria-label` cuando los botones sean solo iconos.
- No: No mezcles tamaños ni variantes dentro del grupo: el solape de bordes deja de cuadrar.
- No: No lo uses como selector de estado (vista tabla / tablero): eso es ToggleGroup.
- No: No pases de cuatro botones; a partir de ahí, un menú.

Relacionados: button, toggle-group, dropdown-menu, input-group

## Ejemplos

### Botón dividido

Acción principal más un trigger de DropdownMenu con los formatos secundarios. Con la variante `default` hace falta ButtonGroupSeparator, porque los botones sin borde no dibujan línea entre sí.

```tsx
<ButtonGroup>
  <Button><Download data-icon="inline-start" /> Exportar</Button>
  <ButtonGroupSeparator className="bg-primary-foreground/30" />
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button size="icon" aria-label="Más formatos de exportación"><ChevronDown /></Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem><FileDown /> Exportar CSV</DropdownMenuItem>
      <DropdownMenuItem><FileDown /> Exportar Excel</DropdownMenuItem>
      <DropdownMenuItem><Mail /> Enviar por correo</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</ButtonGroup>
```

### Acciones hermanas

Dos o tres acciones del mismo peso, con `outline`: el solape de bordes hace el trabajo sin separador.

```tsx
<ButtonGroup>
  <Button variant="outline"><Download data-icon="inline-start" /> Exportar</Button>
  <Button variant="outline"><Upload data-icon="inline-start" /> Importar</Button>
</ButtonGroup>
```

### Contador con valor en medio

Cualquier hijo entra en el grupo: aquí un `<span>` con borde propio entre dos botones de icono.

```tsx
<ButtonGroup aria-label="Cupos del curso">
  <Button variant="outline" size="icon" aria-label="Quitar un cupo" onClick={() => setSeats((n) => n - 1)}><Minus /></Button>
  <span className="flex min-w-12 items-center justify-center border border-border bg-surface text-sm tabular-nums">{seats}</span>
  <Button variant="outline" size="icon" aria-label="Añadir un cupo" onClick={() => setSeats((n) => n + 1)}><Plus /></Button>
</ButtonGroup>
```

### Paginador compacto y orientación vertical

Los botones de icono forman un paginador; en vertical, cada botón ocupa el ancho del grupo.

```tsx
<ButtonGroup aria-label="Paginación">
  <Button variant="outline" size="icon" aria-label="Anterior"><ChevronLeft /></Button>
  <Button variant="outline" size="icon" aria-label="Siguiente"><ChevronRight /></Button>
</ButtonGroup>

<ButtonGroup orientation="vertical">
  <Button variant="secondary" size="sm"><FileUp data-icon="inline-start" /> Subir plantilla</Button>
  <Button variant="secondary" size="sm"><FileDown data-icon="inline-start" /> Descargar ejemplo</Button>
</ButtonGroup>
```
