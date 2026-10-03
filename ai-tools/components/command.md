# Command

Paleta de comandos con búsqueda difusa, grupos y atajos, basada en cmdk; el ítem activo se resalta con una píldora que se desliza entre opciones. Úsala como buscador global (⌘K) o como lista filtrable dentro de un Popover o Combobox.

Familia: Primitivos · Doc: `/docs#/components/command` · Fuente: `src/components/ui/command.tsx`

```ts
import { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from "@/components/ui/command"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `Command.loop` | `boolean` | `false` | Al llegar al final de la lista, las flechas vuelven al inicio. |
| `Command.filter` | `(value, search, keywords) => number` |  | Función de puntuación personalizada para el filtrado. |
| `Command.shouldFilter` | `boolean` | `true` | Desactívalo si filtras en el servidor. |
| `CommandDialog.open / onOpenChange` | `boolean / (open) => void` |  | Estado del diálogo; hereda todas las props de Dialog. |
| `CommandDialog.title / description` | `string` |  | Texto accesible (visualmente oculto) del diálogo. |
| `CommandDialog.showCloseButton` | `boolean` | `false` | Muestra la X de cierre del Dialog. |
| `CommandItem.value` | `string` |  | Valor usado para filtrar; por defecto es el texto del ítem. |
| `CommandItem.onSelect` | `(value: string) => void` |  | Se dispara con clic o Enter. |
| `CommandItem.data-checked` | `boolean` |  | Muestra el icono de check al final del ítem. |
| `CommandGroup.heading` | `string` |  | Título del grupo. |

## Guías

- Sí: Agrupa los resultados por tipo y ordena los grupos por frecuencia de uso.
- Sí: Muestra un `CommandEmpty` con una acción alternativa cuando no hay coincidencias.
- Sí: Registra el atajo ⌘K/Ctrl+K si la paleta es global.
- No: No metas más de 7-8 ítems por grupo sin filtrar; el usuario se pierde.
- No: No uses Command para listas pequeñas sin búsqueda; usa DropdownMenu o Select.
- No: No dupliques atajos entre ítems.

Relacionados: dialog, popover, dropdown-menu, fluid-highlight

## Ejemplos

### En línea

Escribe para filtrar; navega con las flechas y confirma con Enter.

```tsx
<Command className="rounded-xl border shadow-card">
  <CommandInput placeholder="Escribe un comando o busca…" />
  <CommandList>
    <CommandEmpty>Sin resultados.</CommandEmpty>
    <CommandGroup heading="Sugerencias">
      <CommandItem><Calendar /> Calendario</CommandItem>
      <CommandItem><BookOpen /> Catálogo de cursos</CommandItem>
      <CommandItem><Users /> Equipos</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Cuenta">
      <CommandItem><User /> Perfil <CommandShortcut>⌘P</CommandShortcut></CommandItem>
      <CommandItem><Settings /> Ajustes <CommandShortcut>⌘,</CommandShortcut></CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```

### Como diálogo (⌘K)

`CommandDialog` envuelve la paleta en un Dialog; el atajo global se registra con un listener de teclado.

```tsx
const [open, setOpen] = React.useState(false);

React.useEffect(() => {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      setOpen((value) => !value);
    }
  };
  document.addEventListener("keydown", onKeyDown);
  return () => document.removeEventListener("keydown", onKeyDown);
}, []);

<Button variant="outline" onClick={() => setOpen(true)}>Abrir paleta <kbd>⌘K</kbd></Button>
<CommandDialog open={open} onOpenChange={setOpen} title="Paleta de comandos" description="Busca una acción o una página">
  <CommandInput placeholder="Escribe un comando o busca…" />
  <CommandList>
    <CommandEmpty>Sin resultados.</CommandEmpty>
    …
  </CommandList>
</CommandDialog>
```

### Selección múltiple

`data-checked` en el ítem muestra la marca de verificación; `onSelect` alterna el valor.

```tsx
const [selected, setSelected] = React.useState<string[]>(["Liderazgo"]);

<Command>
  <CommandInput placeholder="Filtrar habilidades…" />
  <CommandList>
    <CommandEmpty>Ninguna habilidad coincide.</CommandEmpty>
    <CommandGroup heading="Habilidades">
      {SKILLS.map((skill) => (
        <CommandItem key={skill} value={skill} data-checked={selected.includes(skill)} onSelect={() => toggle(skill)}>
          {skill}
        </CommandItem>
      ))}
    </CommandGroup>
  </CommandList>
</Command>
```
