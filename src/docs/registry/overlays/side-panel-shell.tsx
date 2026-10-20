import * as React from "react";
import { SidePanelShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { defineEntry } from "../types";

function Demo() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex flex-col items-center gap-3">
      <Button onClick={() => setOpen(true)}>Abrir panel</Button>
      <Text variant="muted">Con sitio (1024px o más) se abre al lado y estrecha la página; sin él (celular y tablet), como una hoja que sube desde abajo.</Text>
      <SidePanelShell
        open={open}
        onOpenChange={setOpen}
        title="Martín Martínez"
        description="Jueves 1 de octubre"
        actions={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={() => setOpen(false)}>Ingresar</Button>
          </>
        }
      >
        <Text>La página de atrás sigue a la vista y se puede seguir usando mientras el panel está abierto.</Text>
      </SidePanelShell>
    </div>
  );
}

export const sidePanelShellEntry = defineEntry({
  id: "side-panel-shell",
  name: "SidePanelShell",
  group: "overlays",
  description:
    "Un panel de trabajo que se abre al lado del contenido en vez de encima: entra por la derecha y empuja la página, que se estrecha y sigue usable. Es el gesto del panel del Agente IA, para tareas que se hacen mirando lo de atrás —el detalle de una cita con la agenda al lado, un cobro, un bloqueo—. Misma anatomía y props que DrawerShell, y cae sola a una hoja que sube desde abajo cuando no hay sitio para dos columnas (celular y tablet) o no hay shell alrededor, como las ventanas de la reserva en línea.",
  importPath: 'import { SidePanelShell } from "@/components/overlays"',
  sourcePath: "src/components/overlays/SidePanelShell.tsx",
  status: "beta",
  tags: ["panel", "drawer", "lateral", "push", "side panel", "no modal"],
  examples: [
    {
      id: "basic",
      title: "Panel al lado",
      description: "Mismo uso que `DrawerShell`: estado controlado, cabecera, cuerpo y pie.",
      code: `const [open, setOpen] = React.useState(false);

<SidePanelShell
  open={open}
  onOpenChange={setOpen}
  title="Martín Martínez"
  description="Jueves 1 de octubre"
  actions={<Button onClick={() => setOpen(false)}>Ingresar</Button>}
>
  …
</SidePanelShell>`,
      render: () => <Demo />,
    },
  ],
  props: [
    { name: "open / onOpenChange", type: "boolean / (open: boolean) => void", description: "Estado controlado del panel. Escape y la X llaman a `onOpenChange(false)`." },
    { name: "title / description", type: "string", description: "Cabecera; el título es también el nombre accesible del panel." },
    { name: "leading", type: "React.ReactNode", description: "Avatar o icono a la izquierda del título: quién o qué se abrió (el cliente de una cita, por ejemplo)." },
    { name: "headerActions", type: "React.ReactNode", description: "Botones de icono en la cabecera, antes del cierre: terciarios (`ghost`, `icon-sm`) y con su tooltip. El panel de una cita pone aquí la actividad y Clipper." },
    { name: "children", type: "React.ReactNode", description: "Cuerpo con scroll propio. Solo se monta mientras está abierto." },
    { name: "actions", type: "React.ReactNode", description: "Botones del pie, alineados a la derecha." },
    { name: "footer", type: "React.ReactNode", description: "Pie completamente personalizado; reemplaza a `actions`." },
    { name: "size", type: '"sm" … "full"', default: '"md"', description: "Solo cuenta cuando cae a `DrawerShell`; al lado el ancho es fijo (460px, o 42% de la ventana), pegado al borde y separado de la página por una línea." },
    { name: "showCloseButton", type: "boolean", default: "true", description: "Muestra la X de la cabecera." },
    { name: "disablePadding", type: "boolean", default: "false", description: "Quita el padding del cuerpo." },
  ],
  guidelines: {
    do: ["Úsalo cuando la tarea necesita ver la página de atrás: una agenda, una lista, un tablero.", "Mantén un solo panel abierto a la vez: abrir otro cierra el anterior y el hueco no salta.", "Compón el cuerpo con `DrawerSection`, igual que en un drawer.", "Envuelve la acción principal en `PanelFooter`: queda fija abajo, como pie, aunque viva dentro de una página del cuerpo."],
    dont: ["No lo uses para un formulario que pide toda la atención: ahí va `DrawerShell` o `ModalShell`.", "No pongas dentro confirmaciones destructivas: abre un `ConfirmDialog` encima.", "No fijes anchos propios: el panel decide cuánto le quita a la página.", "No dejes el botón principal al final del cuerpo con scroll: se pierde de vista."],
  },
  related: ["drawer-shell", "drawer-section", "ai-agent-drawer", "confirm-dialog"],
});
