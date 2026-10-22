import * as React from "react";
import { Download, Trash2 } from "lucide-react";
import {
  RailButton,
  RailDivider,
  RailSettingsMenu,
  useRailAutoHide,
  useRailAxis,
  useRailOrientation,
  useRailPopoutSide,
  useRailPosition,
  type RailOrientation,
} from "@/components/action-rail";
import { defineEntry, definePlayground } from "../types";
import { RailOrientationKnob, ShellDemo } from "./actionRailShellDemo";
import { RAIL_ICON, RailBar } from "./railDemo";

const ORIENTATIONS = ["horizontal", "vertical"] as const;

/** Sincroniza un control del playground con la preferencia compartida de auto-ocultar; salta el primer montaje. */
function AutoHideKnob({ autoHide }: { autoHide: boolean }) {
  const [, setAutoHide] = useRailAutoHide();
  const previous = React.useRef<boolean | null>(null);
  React.useEffect(() => {
    if (previous.current !== null && previous.current !== autoHide) setAutoHide(autoHide);
    previous.current = autoHide;
  }, [autoHide, setAutoHide]);
  return null;
}

/** Una barra que sigue la preferencia compartida, con el menú de ajustes al frente y lo que dicen los hooks debajo. */
function PreferenceBarDemo() {
  const [orientation] = useRailOrientation();
  const [autoHide] = useRailAutoHide();
  return (
    <div className="flex flex-col items-center gap-3">
      <RailBar orientation={orientation}>
        <RailSettingsMenu />
        <RailDivider />
        <RailButton icon={<Download className={RAIL_ICON} strokeWidth={2} />} label="Exportar" onClick={() => undefined} />
        <RailButton icon={<Trash2 className={RAIL_ICON} strokeWidth={2} />} label="Eliminar" tone="danger" onClick={() => undefined} />
      </RailBar>
      <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 font-mono text-[12px]">
        <dt className="text-text-muted">useRailOrientation()[0]</dt>
        <dd className="text-text-primary">"{orientation}"</dd>
        <dt className="text-text-muted">useRailAutoHide()[0]</dt>
        <dd className="text-text-primary">{String(autoHide)}</dd>
      </dl>
    </div>
  );
}

/** Los hooks derivados: el eje que ve una pieza y hacia dónde abre su popover. */
function AxisReadout() {
  const axis = useRailAxis();
  const side = useRailPopoutSide();
  const [position] = useRailPosition();
  return (
    <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 font-mono text-[12px]">
      <dt className="text-text-muted">useRailAxis()</dt>
      <dd className="text-text-primary">"{axis}"</dd>
      <dt className="text-text-muted">useRailPopoutSide()</dt>
      <dd className="text-text-primary">"{side}"</dd>
      <dt className="text-text-muted">useRailPosition()[0]</dt>
      <dd className="text-text-primary">{position ? `{ x: ${Math.round(position.x)}, y: ${Math.round(position.y)} }` : "null"}</dd>
    </dl>
  );
}

/** Cambia las preferencias desde código, como haría un ajuste de la app. */
function ProgrammaticDemo() {
  const [orientation, setOrientation] = useRailOrientation();
  const [autoHide, setAutoHide] = useRailAutoHide();
  const button = "rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-subtle";
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className={button} onClick={() => setOrientation(orientation === "vertical" ? "horizontal" : "vertical")}>
          setOrientation("{orientation === "vertical" ? "horizontal" : "vertical"}")
        </button>
        <button type="button" className={button} onClick={() => setAutoHide(!autoHide)}>
          setAutoHide({String(!autoHide)})
        </button>
      </div>
      <AxisReadout />
    </div>
  );
}

export const railSettingsMenuEntry = defineEntry({
  id: "rail-settings-menu",
  name: "RailSettingsMenu",
  group: "action-rail",
  description:
    "Los ajustes propios de la barra —en qué eje se tiende y si se oculta sola— detrás de un solo botón, para no gastar dos huecos de icono en cosas que no tocan el contenido. En una barra de pantalla (`DataListActionRail`) suma «Editar acciones»: la persona elige la acción principal y hasta tres a la vista, de entre todas las acciones de la pantalla y sus filtros rápidos, y la elección se guarda por pantalla. Escribe en las preferencias compartidas que exponen useRailOrientation y useRailAutoHide, persistidas en localStorage para que la barra sea la misma en todas las pantallas.",
  importPath: 'import { RailSettingsMenu, useRailOrientation, useRailAutoHide, useRailPosition } from "@/components/action-rail"',
  sourcePath: "src/components/action-rail/RailSettingsMenu.tsx",
  status: "stable",
  tags: ["popover", "localStorage", "shared-store"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      orientation: { type: "select", label: "Orientación (preferencia)", options: ORIENTATIONS, default: "horizontal" },
      autoHide: { type: "boolean", label: "Ocultar sola (preferencia)", default: false },
    },
    render: ({ orientation, autoHide }) => (
      <>
        <RailOrientationKnob orientation={orientation as RailOrientation} />
        <AutoHideKnob autoHide={autoHide} />
        <ShellDemo height={300} />
      </>
    ),
    code: ({ orientation, autoHide }) => `// Lo que el menú escribe al elegir cada opción:
const [, setOrientation] = useRailOrientation();
const [, setAutoHide] = useRailAutoHide();
setOrientation("${orientation}");
setAutoHide(${autoHide});

// El shell lo monta por ti; no hace falta añadirlo a los slots:
<ActionRailShell persistent={<ScreenActions />} />`,
  }),
  examples: [
    {
      id: "menu",
      title: "El menú y lo que escribe",
      description: "Dos grupos con la opción activa marcada. Elige «Vertical» y la barra se pone de pie; elige «Ocultar sola» y la preferencia cambia para cualquier barra montada.",
      code: `const [orientation] = useRailOrientation(); // "horizontal" | "vertical"
const [autoHide] = useRailAutoHide();       // boolean

<RailSettingsMenu />`,
      render: () => <PreferenceBarDemo />,
    },
    {
      id: "hooks",
      title: "useRailOrientation, useRailAutoHide y useRailPosition",
      description:
        "Las tres preferencias viven fuera de React en pequeños stores con listeners: una barra que se monta después de otra no ve un valor viejo. Orientación y auto-ocultar persisten en localStorage; la posición arrastrada no, y una recarga devuelve la barra a su dock.",
      code: `const [orientation, setOrientation] = useRailOrientation(); // localStorage
const [autoHide, setAutoHide] = useRailAutoHide();            // localStorage
const [position, setPosition] = useRailPosition();            // solo en memoria

// Para las piezas dentro de una barra:
const axis = useRailAxis();          // la del shell o, sin shell, la preferencia
const side = useRailPopoutSide();    // "top" tumbada · "left" de pie`,
      render: () => <ProgrammaticDemo />,
    },
  ],
  props: [
    { name: "RailSettingsMenu", type: "() => JSX.Element", description: "Sin props. Lee y escribe las preferencias compartidas; ActionRailShell y DrawerActionRail lo montan solos al frente de la barra." },
    { name: "useRailOrientation()", type: 'readonly ["horizontal" | "vertical", (value) => void]', description: "Preferencia de eje, persistida en `thema.actionRail.orientation.v1`." },
    { name: "setRailOrientation(value)", type: "(value: RailOrientation) => void", description: "El setter suelto, para cambiar la preferencia fuera de un componente." },
    { name: "useRailAutoHide()", type: "readonly [boolean, (value: boolean) => void]", description: "Si la barra se recoge al salir el puntero, persistida en `thema.actionRail.autoHide.v1`." },
    { name: "useRailPosition()", type: "readonly [RailPosition | null, (value) => void]", description: "Dónde se soltó la barra tras arrastrarla; `null` es el dock. No se persiste." },
    { name: "useRailAxis() / useRailIsVertical()", type: "() => RailOrientation / () => boolean", description: "El eje que ve una pieza: el del shell que la envuelve o, sin shell, la preferencia." },
    { name: "«Editar acciones»", type: "RailLayoutContext", description: "Sale solo dentro de una barra que lo provee (`DataListActionRail`). Abre `RailActionsEditor`: principal + hasta 3 a la vista; lo demás se pliega y los filtros no elegidos no salen. Se guarda en `thema.actionRail.layout.v1:<ruta>`; «Restablecer» vuelve a lo que declaró la pantalla." },
    { name: "useRailPopoutSide()", type: '() => "top" | "left"', description: "Hacia dónde abrir tooltips y popovers, siempre lejos de la barra." },
  ],
  guidelines: {
    do: [
      "Deja que el shell monte el menú; una pantalla solo aporta acciones.",
      "Declara bien el peso de serie (`primary`, `overflow`): es lo que ve quien nunca abre «Editar acciones» y a lo que vuelve «Restablecer».",
      "Lee la orientación con `useRailAxis` en las piezas nuevas, así funcionan dentro y fuera del shell.",
      "Enciende `keepOpen` en el shell mientras haya selección: auto-ocultar no debe esconder una acción que se está a punto de usar.",
    ],
    dont: [
      "No dupliques los ajustes como botones sueltos en la barra: costarían dos huecos y perderían el rótulo.",
      "No guardes la orientación en el estado de una pantalla; se perdería al cambiar de tab.",
      "No persistas la posición arrastrada: una barra que aparece en un rincón tras recargar parece perdida.",
    ],
  },
  related: ["action-rail-shell", "rail-drag-handle", "rail-overflow-menu", "drawer-action-rail"],
});
