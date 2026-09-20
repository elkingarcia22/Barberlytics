import * as React from "react";
import { BookOpen, Calendar, Check, CreditCard, Settings, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { defineEntry, definePlayground } from "../types";

const FRAME = "w-full max-w-md rounded-xl border border-border/60 shadow-card";

function PaletteItems({ withShortcuts = true }: { withShortcuts?: boolean }) {
  return (
    <>
      <CommandGroup heading="Sugerencias">
        <CommandItem>
          <Calendar /> Calendario
        </CommandItem>
        <CommandItem>
          <BookOpen /> Catálogo de cursos
        </CommandItem>
        <CommandItem>
          <Users /> Equipos
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Cuenta">
        <CommandItem>
          <User /> Perfil {withShortcuts && <CommandShortcut>⌘P</CommandShortcut>}
        </CommandItem>
        <CommandItem>
          <CreditCard /> Facturación {withShortcuts && <CommandShortcut>⌘B</CommandShortcut>}
        </CommandItem>
        <CommandItem>
          <Settings /> Ajustes {withShortcuts && <CommandShortcut>⌘,</CommandShortcut>}
        </CommandItem>
      </CommandGroup>
    </>
  );
}

function CommandPalette() {
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

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Abrir paleta
        <kbd className="ml-2 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-text-muted">⌘K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Paleta de comandos" description="Busca una acción o una página">
        <CommandInput placeholder="Escribe un comando o busca…" />
        <CommandList>
          <CommandEmpty>Sin resultados.</CommandEmpty>
          <PaletteItems />
        </CommandList>
      </CommandDialog>
    </>
  );
}

const SKILLS = ["Liderazgo", "Comunicación", "Análisis de datos", "Negociación", "Gestión del cambio"];

function MultiSelectCommand() {
  const [selected, setSelected] = React.useState<string[]>(["Liderazgo"]);
  const toggle = (skill: string) => setSelected((items) => (items.includes(skill) ? items.filter((item) => item !== skill) : [...items, skill]));
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Command className={FRAME}>
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
      <p className="text-[13px] text-text-secondary">
        <Check className="mr-1 inline size-3.5 text-success" />
        {selected.length ? selected.join(", ") : "Nada seleccionado"}
      </p>
    </div>
  );
}

export const commandEntry = defineEntry({
  id: "command",
  name: "Command",
  group: "ui",
  description:
    "Paleta de comandos con búsqueda difusa, grupos y atajos, basada en cmdk; el ítem activo se resalta con una píldora que se desliza entre opciones. Úsala como buscador global (⌘K) o como lista filtrable dentro de un Popover o Combobox.",
  importPath: 'import { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from "@/components/ui/command"',
  sourcePath: "src/components/ui/command.tsx",
  status: "stable",
  tags: ["cmdk", "fluid-highlight"],
  playground: definePlayground({
    controls: {
      placeholder: { type: "text", default: "Buscar…" },
      withShortcuts: { type: "boolean", label: "Con atajos", default: true },
      loop: { type: "boolean", label: "Navegación circular", default: false },
    },
    render: ({ placeholder, withShortcuts, loop }) => (
      <Command className={FRAME} loop={loop}>
        <CommandInput placeholder={placeholder} />
        <CommandList>
          <CommandEmpty>Sin resultados.</CommandEmpty>
          <PaletteItems withShortcuts={withShortcuts} />
        </CommandList>
      </Command>
    ),
    code: ({ placeholder, withShortcuts, loop }) => `<Command${loop ? " loop" : ""}>
  <CommandInput placeholder="${placeholder}" />
  <CommandList>
    <CommandEmpty>Sin resultados.</CommandEmpty>
    <CommandGroup heading="Sugerencias">
      <CommandItem><Calendar /> Calendario</CommandItem>
      <CommandItem><BookOpen /> Catálogo de cursos</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Cuenta">
      <CommandItem><User /> Perfil${withShortcuts ? " <CommandShortcut>⌘P</CommandShortcut>" : ""}</CommandItem>
      <CommandItem><Settings /> Ajustes${withShortcuts ? " <CommandShortcut>⌘,</CommandShortcut>" : ""}</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>`,
  }),
  examples: [
    {
      id: "inline",
      title: "En línea",
      description: "Escribe para filtrar; navega con las flechas y confirma con Enter.",
      frameClassName: "min-h-[360px]",
      code: `<Command className="rounded-xl border shadow-card">
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
</Command>`,
      render: () => (
        <Command className={FRAME}>
          <CommandInput placeholder="Escribe un comando o busca…" />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <PaletteItems />
          </CommandList>
        </Command>
      ),
    },
    {
      id: "dialog",
      title: "Como diálogo (⌘K)",
      description: "`CommandDialog` envuelve la paleta en un Dialog; el atajo global se registra con un listener de teclado.",
      code: `const [open, setOpen] = React.useState(false);

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
</CommandDialog>`,
      render: () => <CommandPalette />,
    },
    {
      id: "multi",
      title: "Selección múltiple",
      description: "`data-checked` en el ítem muestra la marca de verificación; `onSelect` alterna el valor.",
      frameClassName: "min-h-[360px]",
      code: `const [selected, setSelected] = React.useState<string[]>(["Liderazgo"]);

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
</Command>`,
      render: () => <MultiSelectCommand />,
    },
  ],
  props: [
    { name: "Command.loop", type: "boolean", default: "false", description: "Al llegar al final de la lista, las flechas vuelven al inicio." },
    { name: "Command.filter", type: "(value, search, keywords) => number", description: "Función de puntuación personalizada para el filtrado." },
    { name: "Command.shouldFilter", type: "boolean", default: "true", description: "Desactívalo si filtras en el servidor." },
    { name: "CommandDialog.open / onOpenChange", type: "boolean / (open) => void", description: "Estado del diálogo; hereda todas las props de Dialog." },
    { name: "CommandDialog.title / description", type: "string", description: "Texto accesible (visualmente oculto) del diálogo." },
    { name: "CommandDialog.showCloseButton", type: "boolean", default: "false", description: "Muestra la X de cierre del Dialog." },
    { name: "CommandItem.value", type: "string", description: "Valor usado para filtrar; por defecto es el texto del ítem." },
    { name: "CommandItem.onSelect", type: "(value: string) => void", description: "Se dispara con clic o Enter." },
    { name: "CommandItem.data-checked", type: "boolean", description: "Muestra el icono de check al final del ítem." },
    { name: "CommandGroup.heading", type: "string", description: "Título del grupo." },
  ],
  guidelines: {
    do: ["Agrupa los resultados por tipo y ordena los grupos por frecuencia de uso.", "Muestra un `CommandEmpty` con una acción alternativa cuando no hay coincidencias.", "Registra el atajo ⌘K/Ctrl+K si la paleta es global."],
    dont: ["No metas más de 7-8 ítems por grupo sin filtrar; el usuario se pierde.", "No uses Command para listas pequeñas sin búsqueda; usa DropdownMenu o Select.", "No dupliques atajos entre ítems."],
  },
  related: ["dialog", "popover", "dropdown-menu", "fluid-highlight"],
});
