import * as React from "react";
import { Filter, Target, Users } from "lucide-react";
import { DrawerSection, DrawerShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defineEntry, definePlayground } from "../types";

const SIDES = ["right", "left", "top", "bottom"] as const;
const SIZES = ["sm", "md", "lg", "xl", "2xl", "3xl", "full"] as const;
type Side = (typeof SIDES)[number];
type Size = (typeof SIZES)[number];

function Field({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-[12px] font-medium text-text-secondary">
      {label}
      <Input defaultValue={defaultValue} className="h-9" />
    </label>
  );
}

function PlaygroundDemo({ side, size, showCloseButton, withActions }: { side: Side; size: Size; showCloseButton: boolean; withActions: boolean }) {
  const [open, setOpen] = React.useState(false);
  return (
    <DrawerShell
      open={open}
      onOpenChange={setOpen}
      trigger={<Button>Abrir drawer</Button>}
      side={side}
      size={size}
      showCloseButton={showCloseButton}
      title="Editar objetivo"
      description="Los cambios se guardan al confirmar."
      actions={withActions ? (<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => setOpen(false)}>Guardar</Button></>) : undefined}
    >
      <div className="space-y-4">
        <Field label="Nombre" defaultValue="Reducir el tiempo de onboarding" />
        <Field label="Responsable" defaultValue="Elena Martínez" />
      </div>
    </DrawerShell>
  );
}

function FormDemo() {
  const [open, setOpen] = React.useState(false);
  const [saved, setSaved] = React.useState<string | null>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <DrawerShell
        open={open}
        onOpenChange={setOpen}
        trigger={<Button>Nuevo objetivo</Button>}
        title="Nuevo objetivo"
        description="Define qué se quiere lograr y quién responde por ello."
        actions={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => { setSaved(new Date().toLocaleTimeString()); setOpen(false); }}>Crear objetivo</Button></>}
      >
        <div className="space-y-4">
          <Field label="Nombre" />
          <Field label="Responsable" defaultValue="Elena Martínez" />
          <Field label="Fecha límite" defaultValue="30/06/2026" />
        </div>
      </DrawerShell>
      {saved && <p className="text-[12px] text-text-muted">Objetivo creado a las {saved}</p>}
    </div>
  );
}

function SectionsDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <DrawerShell
      open={open}
      onOpenChange={setOpen}
      trigger={<Button variant="outline">Ver detalle</Button>}
      size="lg"
      title="Reducir el tiempo de onboarding"
      description="Objetivo del equipo de People · 2026-Q2"
      className="bg-surface-subtle"
      actions={<Button onClick={() => setOpen(false)}>Cerrar</Button>}
    >
      <div className="space-y-3">
        <DrawerSection icon={Target} tone="brand" title="Resultado clave" hint="Cómo sabremos que se cumplió.">
          <p className="text-[13px] text-text-secondary">De 30 a 20 días con satisfacción ≥ 4,5.</p>
        </DrawerSection>
        <DrawerSection icon={Users} tone="neutral" title="Equipo" hint="Quién participa." badge="3">
          <p className="text-[13px] text-text-secondary">Elena Martínez, Carlos Ruiz y Ana Torres.</p>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

function BottomDemo() {
  const [open, setOpen] = React.useState(false);
  const [sort, setSort] = React.useState("Más recientes");
  const options = ["Más recientes", "Alfabético", "Mayor avance"];
  return (
    <div className="flex flex-col items-center gap-3">
      <DrawerShell open={open} onOpenChange={setOpen} trigger={<Button variant="outline"><Filter /> Ordenar: {sort}</Button>} side="bottom" title="Ordenar por">
        <ul className="space-y-1">
          {options.map((option) => (
            <li key={option}>
              <button type="button" onClick={() => { setSort(option); setOpen(false); }} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] text-text-primary hover:bg-accent">
                {option}
                {option === sort && <span className="text-[11px] font-semibold text-primary">Actual</span>}
              </button>
            </li>
          ))}
        </ul>
      </DrawerShell>
    </div>
  );
}

export const drawerShellEntry = defineEntry({
  id: "drawer-shell",
  name: "DrawerShell",
  group: "overlays",
  description:
    "El panel lateral del producto sobre `Sheet`: cabecera con título, cuerpo con scroll propio y pie con acciones, en once tamaños y desde cualquier lado. Admite modo no modal y recorte del velo para convivir con paneles externos como el del Agente IA.",
  importPath: 'import { DrawerShell } from "@/components/overlays"',
  sourcePath: "src/components/overlays/DrawerShell.tsx",
  status: "stable",
  tags: ["radix-dialog", "sheet", "controlled"],
  playground: definePlayground({
    controls: {
      side: { type: "select", options: SIDES, default: "right" },
      size: { type: "select", options: SIZES, default: "md" },
      showCloseButton: { type: "boolean", label: "Botón cerrar", default: true },
      withActions: { type: "boolean", label: "Con acciones", default: true },
    },
    render: ({ side, size, showCloseButton, withActions }) => <PlaygroundDemo side={side as Side} size={size as Size} showCloseButton={showCloseButton} withActions={withActions} />,
    code: ({ side, size, showCloseButton, withActions }) => {
      const attrs = [
        "open={open}",
        "onOpenChange={setOpen}",
        "trigger={<Button>Abrir drawer</Button>}",
        side !== "right" ? `side="${side}"` : "",
        size !== "md" ? `size="${size}"` : "",
        !showCloseButton ? "showCloseButton={false}" : "",
        'title="Editar objetivo"',
        'description="Los cambios se guardan al confirmar."',
        withActions ? "actions={<><Button variant=\"outline\" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={save}>Guardar</Button></>}" : "",
      ].filter(Boolean);
      return `const [open, setOpen] = React.useState(false);\n\n<DrawerShell\n  ${attrs.join("\n  ")}\n>\n  <form>…</form>\n</DrawerShell>`;
    },
  }),
  examples: [
    {
      id: "form",
      title: "Formulario con acciones",
      description: "`actions` va al pie con fondo atenuado; ambos botones cierran desde el estado del padre.",
      code: `const [open, setOpen] = React.useState(false);

<DrawerShell
  open={open}
  onOpenChange={setOpen}
  trigger={<Button>Nuevo objetivo</Button>}
  title="Nuevo objetivo"
  description="Define qué se quiere lograr y quién responde por ello."
  actions={<>
    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
    <Button onClick={() => { create(); setOpen(false); }}>Crear objetivo</Button>
  </>}
>
  <Field label="Nombre" />
  <Field label="Responsable" />
</DrawerShell>`,
      render: () => <FormDemo />,
    },
    {
      id: "sections",
      title: "Con DrawerSection",
      description: "Un drawer de detalle: fondo sutil y tarjetas apiladas, cada una con su tono.",
      code: `<DrawerShell open={open} onOpenChange={setOpen} trigger={<Button variant="outline">Ver detalle</Button>} size="lg" title="…" className="bg-surface-subtle">
  <div className="space-y-3">
    <DrawerSection icon={Target} tone="brand" title="Resultado clave" hint="…">…</DrawerSection>
    <DrawerSection icon={Users} tone="neutral" title="Equipo" hint="…" badge="3">…</DrawerSection>
  </div>
</DrawerShell>`,
      render: () => <SectionsDemo />,
    },
    {
      id: "bottom",
      title: "Hoja inferior",
      description: "`side=\"bottom\"` para una lista corta de opciones en móvil; elegir una cierra la hoja.",
      code: `<DrawerShell open={open} onOpenChange={setOpen} trigger={<Button variant="outline"><Filter /> Ordenar</Button>} side="bottom" title="Ordenar por">
  {options.map((option) => (
    <button onClick={() => { setSort(option); setOpen(false); }}>{option}</button>
  ))}
</DrawerShell>`,
      render: () => <BottomDemo />,
    },
  ],
  props: [
    { name: "open / onOpenChange", type: "boolean / (open: boolean) => void", description: "Estado controlado del panel." },
    { name: "trigger", type: "React.ReactNode", description: "Elemento que abre el drawer (`asChild`)." },
    { name: "title / description", type: "string", description: "Cabecera con borde inferior; si ambos faltan, no se pinta." },
    { name: "children", type: "React.ReactNode", description: "Cuerpo con scroll propio y `scrollbar-gutter: stable`." },
    { name: "actions", type: "React.ReactNode", description: "Botones del pie, en un `SheetFooter` con borde superior." },
    { name: "footer", type: "React.ReactNode", description: "Pie completamente personalizado; reemplaza a `actions`." },
    { name: "side", type: '"left" | "right" | "top" | "bottom"', default: '"right"', description: "Lado desde el que entra." },
    { name: "size", type: '"sm" … "7xl" | "full"', default: '"md"', description: "Ancho máximo en `sm+` (de 384px a 1280px o completo). No aplica a top/bottom." },
    { name: "showCloseButton", type: "boolean", default: "true", description: "Muestra la X en la esquina." },
    { name: "disablePadding / disableScrollbarGutter", type: "boolean", default: "false", description: "Quitan el padding del cuerpo o la reserva de la barra de scroll." },
    { name: "modal", type: "boolean", default: "true", description: "En `false` el fondo sigue vivo (para convivir con un panel externo); el velo se sigue dibujando." },
    { name: "overlayClassName / overlayStyle", type: "string / CSSProperties", description: "Recortan o animan el velo." },
    { name: "contentStyle", type: "CSSProperties", description: "Estilo en línea del cajón, para sincronizar su movimiento con otro panel." },
    { name: "onInteractOutside", type: "(e: Event) => void", description: "Intercepta el clic fuera; llama a `e.preventDefault()` para no cerrar." },
  ],
  guidelines: {
    do: ["Compón el cuerpo con `DrawerSection` para que todos los paneles se lean igual.", "Una acción primaria en el pie y la secundaria como `outline`.", "Usa `lg` o más solo para vistas de detalle con varias columnas."],
    dont: ["No apagues `modal` salvo para convivir con un panel fuera del portal.", "No pongas la confirmación de borrado dentro del drawer: abre un `ConfirmDialog` encima."],
  },
  related: ["sheet", "drawer-section", "modal-shell", "confirm-dialog"],
});
