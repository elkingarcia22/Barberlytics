import * as React from "react";
import { Archive, Copy, Download, Mail, Pencil, Send, Trash2, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { defineEntry, definePlayground } from "../types";

const TRIGGER_CLASS =
  "flex h-32 w-full max-w-sm select-none items-center justify-center rounded-xl border border-dashed border-border bg-surface-subtle text-sm text-text-muted";

const PEOPLE = [
  { name: "Ana Lucía Torres", role: "Analista de nómina", status: "Activo" },
  { name: "Carlos Mejía", role: "Coordinador de selección", status: "Vacaciones" },
  { name: "Diana Ruiz", role: "Líder de bienestar", status: "Activo" },
] as const;

function CollaboratorRows() {
  const [last, setLast] = React.useState<string | null>(null);
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-surface">
        {PEOPLE.map((person) => (
          <ContextMenu key={person.name}>
            <ContextMenuTrigger asChild>
              <div className="flex cursor-context-menu items-center gap-3 px-4 py-2.5 transition-colors data-[state=open]:bg-muted">
                <Avatar size="sm">
                  <AvatarFallback>
                    {person.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-text-primary">{person.name}</span>
                  <span className="truncate text-xs text-text-secondary">{person.role}</span>
                </div>
                <Badge variant={person.status === "Activo" ? "positive" : "neutral"}>{person.status}</Badge>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56">
              <ContextMenuLabel>{person.name}</ContextMenuLabel>
              <ContextMenuItem onSelect={() => setLast(`Editar ${person.name}`)}>
                <Pencil /> Editar perfil <ContextMenuShortcut>⌘E</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => setLast(`Copiar correo de ${person.name}`)}>
                <Copy /> Copiar correo <ContextMenuShortcut>⌘C</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <Send /> Enviar
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  <ContextMenuItem onSelect={() => setLast(`Encuesta a ${person.name}`)}>Encuesta de clima</ContextMenuItem>
                  <ContextMenuItem onSelect={() => setLast(`Recordatorio a ${person.name}`)}>Recordatorio de curso</ContextMenuItem>
                  <ContextMenuItem onSelect={() => setLast(`Mensaje a ${person.name}`)}>
                    <Mail /> Mensaje directo
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => setLast(`Archivar a ${person.name}`)}>
                <Archive /> Archivar
              </ContextMenuItem>
              <ContextMenuItem variant="destructive" onSelect={() => setLast(`Dar de baja a ${person.name}`)}>
                <Trash2 /> Dar de baja
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
      <p className="text-xs text-text-muted">
        Clic derecho sobre una fila. {last ? `Última acción: ${last}.` : "Aún no has elegido ninguna acción."}
      </p>
    </div>
  );
}

function ColumnsAndDensity() {
  const [columns, setColumns] = React.useState({ area: true, manager: false, seniority: true });
  const [density, setDensity] = React.useState("comfortable");
  const visible = Object.entries(columns)
    .filter(([, on]) => on)
    .map(([key]) => ({ area: "Área", manager: "Líder", seniority: "Antigüedad" })[key])
    .join(", ");
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <ContextMenu>
        <ContextMenuTrigger className={TRIGGER_CLASS}>Clic derecho en la cabecera de la tabla</ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuLabel>Columnas</ContextMenuLabel>
          <ContextMenuCheckboxItem checked={columns.area} onCheckedChange={(on) => setColumns((c) => ({ ...c, area: on }))}>
            Área
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem checked={columns.manager} onCheckedChange={(on) => setColumns((c) => ({ ...c, manager: on }))}>
            Líder
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem checked={columns.seniority} onCheckedChange={(on) => setColumns((c) => ({ ...c, seniority: on }))}>
            Antigüedad
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuLabel>Densidad</ContextMenuLabel>
          <ContextMenuRadioGroup value={density} onValueChange={setDensity}>
            <ContextMenuRadioItem value="comfortable">Cómoda</ContextMenuRadioItem>
            <ContextMenuRadioItem value="compact">Compacta</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>
      <p className="text-xs text-text-muted">
        Columnas: {visible || "ninguna"} · Densidad: {density === "compact" ? "compacta" : "cómoda"}
      </p>
    </div>
  );
}

export const contextMenuEntry = defineEntry({
  id: "context-menu",
  name: "ContextMenu",
  group: "ui",
  description:
    "Menú que se abre con clic derecho (o pulsación larga) sobre un elemento, con los mismos ítems, casillas, radios, atajos y submenús que DropdownMenu y la misma apariencia. Úsalo como atajo experto sobre filas, tarjetas y lienzos; nunca como único acceso a una acción.",
  importPath:
    'import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuGroup, ContextMenuCheckboxItem, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent } from "@/components/ui/context-menu"',
  sourcePath: "src/components/ui/context-menu.tsx",
  status: "stable",
  tags: ["radix", "fluid-highlight"],
  playground: definePlayground({
    controls: {
      withShortcuts: { type: "boolean", label: "Con atajos", default: true },
      withSubmenu: { type: "boolean", label: "Con submenú", default: true },
      withDestructive: { type: "boolean", label: "Ítem destructivo", default: true },
      disabled: { type: "boolean", label: "Trigger deshabilitado", default: false },
    },
    render: ({ withShortcuts, withSubmenu, withDestructive, disabled }) => (
      <ContextMenu>
        <ContextMenuTrigger disabled={disabled} className={TRIGGER_CLASS}>
          {disabled ? "Deshabilitado" : "Haz clic derecho aquí"}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuGroup>
            <ContextMenuItem>
              <Pencil /> Editar {withShortcuts && <ContextMenuShortcut>⌘E</ContextMenuShortcut>}
            </ContextMenuItem>
            <ContextMenuItem>
              <Copy /> Duplicar {withShortcuts && <ContextMenuShortcut>⌘D</ContextMenuShortcut>}
            </ContextMenuItem>
            <ContextMenuItem>
              <Download /> Exportar
            </ContextMenuItem>
          </ContextMenuGroup>
          {withSubmenu && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <UserPlus /> Asignar a
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-44">
                <ContextMenuItem>Ana Lucía Torres</ContextMenuItem>
                <ContextMenuItem>Carlos Mejía</ContextMenuItem>
                <ContextMenuItem>Diana Ruiz</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}
          {withDestructive && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem variant="destructive">
                <Trash2 /> Eliminar {withShortcuts && <ContextMenuShortcut>⌫</ContextMenuShortcut>}
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    ),
    code: ({ withShortcuts, withSubmenu, withDestructive, disabled }) => {
      const shortcut = (key: string) => (withShortcuts ? ` <ContextMenuShortcut>${key}</ContextMenuShortcut>` : "");
      const sub = withSubmenu
        ? `
    <ContextMenuSub>
      <ContextMenuSubTrigger><UserPlus /> Asignar a</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Ana Lucía Torres</ContextMenuItem>
        <ContextMenuItem>Carlos Mejía</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>`
        : "";
      const destructive = withDestructive
        ? `
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive"><Trash2 /> Eliminar${shortcut("⌫")}</ContextMenuItem>`
        : "";
      return `<ContextMenu>
  <ContextMenuTrigger${disabled ? " disabled" : ""}>Haz clic derecho aquí</ContextMenuTrigger>
  <ContextMenuContent className="w-56">
    <ContextMenuItem><Pencil /> Editar${shortcut("⌘E")}</ContextMenuItem>
    <ContextMenuItem><Copy /> Duplicar${shortcut("⌘D")}</ContextMenuItem>
    <ContextMenuItem><Download /> Exportar</ContextMenuItem>${sub}${destructive}
  </ContextMenuContent>
</ContextMenu>`;
    },
  }),
  examples: [
    {
      id: "collaborator-row",
      title: "Clic derecho sobre una fila de colaboradores",
      description: "Cada fila lleva su propio ContextMenu con `asChild`; `data-[state=open]` resalta la fila mientras el menú está abierto. Incluye submenú «Enviar» y una acción destructiva al final.",
      code: `<ContextMenu>
  <ContextMenuTrigger asChild>
    <div className="flex items-center gap-3 px-4 py-2.5 data-[state=open]:bg-muted">
      <Avatar size="sm"><AvatarFallback>AT</AvatarFallback></Avatar>
      <span>Ana Lucía Torres</span>
    </div>
  </ContextMenuTrigger>
  <ContextMenuContent className="w-56">
    <ContextMenuLabel>Ana Lucía Torres</ContextMenuLabel>
    <ContextMenuItem onSelect={edit}><Pencil /> Editar perfil <ContextMenuShortcut>⌘E</ContextMenuShortcut></ContextMenuItem>
    <ContextMenuItem onSelect={copyEmail}><Copy /> Copiar correo</ContextMenuItem>
    <ContextMenuSub>
      <ContextMenuSubTrigger><Send /> Enviar</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Encuesta de clima</ContextMenuItem>
        <ContextMenuItem>Recordatorio de curso</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive" onSelect={offboard}><Trash2 /> Dar de baja</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
      render: () => <CollaboratorRows />,
    },
    {
      id: "columns-density",
      title: "Casillas y radios",
      description: "CheckboxItem para columnas visibles (varias a la vez) y RadioGroup para la densidad (una sola), separados por etiquetas de grupo.",
      code: `<ContextMenuContent className="w-56">
  <ContextMenuLabel>Columnas</ContextMenuLabel>
  <ContextMenuCheckboxItem checked={columns.area} onCheckedChange={(on) => setColumns({ ...columns, area: on })}>Área</ContextMenuCheckboxItem>
  <ContextMenuCheckboxItem checked={columns.manager} onCheckedChange={(on) => setColumns({ ...columns, manager: on })}>Líder</ContextMenuCheckboxItem>
  <ContextMenuSeparator />
  <ContextMenuLabel>Densidad</ContextMenuLabel>
  <ContextMenuRadioGroup value={density} onValueChange={setDensity}>
    <ContextMenuRadioItem value="comfortable">Cómoda</ContextMenuRadioItem>
    <ContextMenuRadioItem value="compact">Compacta</ContextMenuRadioItem>
  </ContextMenuRadioGroup>
</ContextMenuContent>`,
      render: () => <ColumnsAndDensity />,
    },
    {
      id: "inset-and-disabled",
      title: "Ítems con sangría y deshabilitados",
      description: "`inset` alinea el texto con los ítems que llevan indicador; `disabled` deja la acción visible pero inactiva.",
      code: `<ContextMenuContent>
  <ContextMenuCheckboxItem checked>Mostrar archivados</ContextMenuCheckboxItem>
  <ContextMenuItem inset>Refrescar</ContextMenuItem>
  <ContextMenuItem inset disabled>Exportar (sin permisos)</ContextMenuItem>
</ContextMenuContent>`,
      render: () => (
        <ContextMenu>
          <ContextMenuTrigger className={TRIGGER_CLASS}>Clic derecho aquí</ContextMenuTrigger>
          <ContextMenuContent className="w-56">
            <ContextMenuCheckboxItem checked>Mostrar archivados</ContextMenuCheckboxItem>
            <ContextMenuItem inset>Refrescar</ContextMenuItem>
            <ContextMenuItem inset disabled>
              Exportar (sin permisos)
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ),
    },
  ],
  props: [
    { name: "onOpenChange", type: "(open: boolean) => void", description: "Se dispara al abrir o cerrar; la apertura la decide el clic derecho, no es controlable." },
    { name: "modal", type: "boolean", default: "true", description: "Bloquea la interacción con el resto de la página mientras está abierto." },
    { name: "ContextMenuTrigger.disabled", type: "boolean", default: "false", description: "El clic derecho vuelve a mostrar el menú del navegador." },
    { name: "ContextMenuTrigger.asChild", type: "boolean", description: "Convierte al hijo (una fila, una tarjeta) en la zona de clic derecho." },
    { name: "ContextMenuItem.variant", type: '"default" | "destructive"', default: '"default"', description: "Tiñe el ítem y la píldora de resaltado en rojo." },
    { name: "ContextMenuItem.inset", type: "boolean", description: "Sangría izquierda para alinear con ítems que tienen indicador." },
    { name: "ContextMenuItem.onSelect", type: "(event) => void", description: "Se dispara al elegir; `event.preventDefault()` mantiene el menú abierto." },
    { name: "ContextMenuCheckboxItem.checked / onCheckedChange", type: "boolean / (checked) => void", description: "Estado de la casilla." },
    { name: "ContextMenuRadioGroup.value / onValueChange", type: "string / (value) => void", description: "Valor activo del grupo de radios." },
    { name: "ContextMenuSubContent.sideOffset", type: "number", default: "12", description: "Separación del submenú respecto al ítem que lo abre." },
  ],
  guidelines: {
    do: [
      "Ofrece las mismas acciones también por un botón visible (un DropdownMenu de «⋯»): el clic derecho no se descubre solo.",
      "Resalta el trigger mientras el menú está abierto (`data-[state=open]`) para que se sepa sobre qué se actúa.",
      "Ordena igual que en el DropdownMenu equivalente; lo destructivo, al final y separado.",
    ],
    dont: [
      "No lo pongas sobre zonas donde el usuario espera el menú nativo (campos de texto, enlaces, imágenes).",
      "No superes ~10 ítems ni más de un nivel de submenú.",
      "No mezcles en un mismo menú acciones sobre la fila y ajustes globales de la tabla.",
    ],
  },
  related: ["dropdown-menu", "kbd", "table", "fluid-highlight"],
});
