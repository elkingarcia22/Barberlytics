import * as React from "react";
import { ArrowLeft, ArrowRight, Check, Scale, Sparkles, Trash2, Wand2, X } from "lucide-react";
import { DrawerActionRail, DrawerRailButton } from "@/components/action-rail";
import { defineEntry, definePlayground } from "../types";
import { DemoTable, RailFrame, useDemoSelection } from "./railDemo";

interface StepDemoProps {
  minimal?: boolean;
  keepOpen?: boolean;
  isBlocked?: boolean;
  withHint?: boolean;
  withTools?: boolean;
  height?: number;
}

/** El cuerpo de un drawer de pasos con la barra en su franja del pie. */
function DrawerBody({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-5 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">{subtitle}</p>
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
      </header>
      {children}
    </div>
  );
}

function StepDemo({ minimal = false, keepOpen = false, isBlocked = false, withHint = true, withTools = true, height = 320 }: StepDemoProps) {
  const [step, setStep] = React.useState(2);
  const [balanced, setBalanced] = React.useState(false);
  return (
    <RailFrame height={height}>
      <DrawerBody title="Pesos por competencia" subtitle={`Paso ${step} de 3`}>
        <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4 text-[13px] text-text-secondary">
          {["Liderazgo", "Comunicación", "Análisis"].map((name, index) => (
            <div key={name} className="flex items-center justify-between rounded-lg border border-border/60 bg-surface px-3 py-2">
              <span className="font-medium text-text-primary">{name}</span>
              <span className="tabular-nums">{balanced ? "33 %" : `${[50, 30, 15][index]} %`}</span>
            </div>
          ))}
        </div>
        <DrawerActionRail
          minimal={minimal}
          keepOpen={keepOpen}
          isBlocked={isBlocked}
          hint={withHint ? (balanced ? "Los pesos suman 100 %" : "Los pesos suman 95 %: cuadra antes de continuar") : undefined}
          tools={
            withTools ? (
              <>
                <DrawerRailButton icon={Scale} label="Cuadrar pesos" iconOnly onClick={() => setBalanced(true)} />
                <DrawerRailButton icon={Wand2} label="Sugerir con IA" iconOnly onClick={() => setBalanced(true)} />
              </>
            ) : undefined
          }
          actions={
            <>
              <DrawerRailButton icon={ArrowLeft} label="Atrás" onClick={() => setStep((value) => Math.max(1, value - 1))} />
              <DrawerRailButton icon={ArrowRight} label="Continuar" variant="primary" disabled={!balanced} onClick={() => setStep((value) => Math.min(3, value + 1))} />
            </>
          }
        />
      </DrawerBody>
    </RailFrame>
  );
}

/** Revisión de una propuesta de IA: solo las dos decisiones, sin ajustes ni pista. */
function MinimalDemo() {
  const [decision, setDecision] = React.useState<string | null>(null);
  return (
    <RailFrame height={260}>
      <DrawerBody title="Propuesta de la IA" subtitle="Revisar">
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 text-center">
          <Sparkles className="size-5 text-primary" />
          <p className="text-[13px] text-text-secondary">La IA propone repartir los pesos 40 / 35 / 25 según el rol.</p>
          <p className="text-xs text-text-muted">{decision ?? "Decide con la barra"}</p>
        </div>
        <DrawerActionRail
          minimal
          keepOpen
          actions={
            <>
              <DrawerRailButton icon={X} label="Descartar" variant="danger" onClick={() => setDecision("Propuesta descartada")} />
              <DrawerRailButton icon={Check} label="Aplicar" variant="primary" onClick={() => setDecision("Propuesta aplicada")} />
            </>
          }
        />
      </DrawerBody>
    </RailFrame>
  );
}

/** Las acciones dependen de la selección: con nada marcado, `actions` es null y el grupo se cae entero. */
function SelectionDemo() {
  const { selected, toggle, clear } = useDemoSelection();
  const count = selected.length;
  return (
    <RailFrame height={320}>
      <DrawerBody title="Participantes" subtitle="Paso 3 de 3">
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <DemoTable selected={selected} onToggle={toggle} />
        </div>
        <DrawerActionRail
          hint={count === 0 ? "Marca filas para actuar sobre ellas" : `${count} marcada${count === 1 ? "" : "s"}`}
          keepOpen={count > 0}
          actions={count > 0 ? <DrawerRailButton icon={Trash2} label="Quitar de la lista" variant="danger" onClick={clear} /> : null}
        />
      </DrawerBody>
    </RailFrame>
  );
}

export const drawerActionRailEntry = defineEntry({
  id: "drawer-action-rail",
  name: "DrawerActionRail",
  group: "action-rail",
  description:
    "La barra flotante de un drawer de pasos: el pie que crecía con cada herramienta se convierte en el mismo dock que usa la pantalla de fondo, con pista del paso, herramientas puntuales y las acciones que lo cierran. Comparte asa, ajustes y preferencia de auto-ocultar con ActionRailShell, y DrawerRailButton es su botón con rótulo.",
  importPath: 'import { DrawerActionRail, DrawerRailButton } from "@/components/action-rail"',
  sourcePath: "src/components/action-rail/DrawerActionRail.tsx",
  status: "stable",
  tags: ["slots", "auto-hide", "draggable"],
  playground: definePlayground({
    layout: "stretch",
    controls: {
      withHint: { type: "boolean", label: "hint", default: true },
      withTools: { type: "boolean", label: "tools", default: true },
      keepOpen: { type: "boolean", label: "keepOpen", default: false },
      isBlocked: { type: "boolean", label: "isBlocked", default: false },
      minimal: { type: "boolean", label: "minimal", default: false },
    },
    render: ({ withHint, withTools, keepOpen, isBlocked, minimal }) => (
      <StepDemo withHint={withHint} withTools={withTools} keepOpen={keepOpen} isBlocked={isBlocked} minimal={minimal} />
    ),
    code: ({ withHint, withTools, keepOpen, isBlocked, minimal }) => {
      const attrs = [
        withHint ? 'hint="Los pesos suman 95 %: cuadra antes de continuar"' : "",
        withTools ? "tools={<><DrawerRailButton icon={Scale} label=\"Cuadrar pesos\" iconOnly onClick={balance} /></>}" : "",
        "actions={<><DrawerRailButton icon={ArrowLeft} label=\"Atrás\" onClick={back} /><DrawerRailButton icon={ArrowRight} label=\"Continuar\" variant=\"primary\" onClick={next} /></>}",
        keepOpen ? "keepOpen" : "",
        isBlocked ? "isBlocked" : "",
        minimal ? "minimal" : "",
      ]
        .filter(Boolean)
        .join("\n  ");
      return `<DrawerActionRail\n  ${attrs}\n/>`;
    },
  }),
  examples: [
    {
      id: "step",
      title: "Un paso con pista, herramientas y acciones",
      description: "La pista dice dónde está el paso; las herramientas lo arreglan (cuadrar pesos habilita «Continuar»); las acciones lo cierran. Cada grupo lleva su divisoria solo si existe.",
      layout: "stretch",
      code: `<DrawerActionRail
  hint={isBalanced ? "Los pesos suman 100 %" : "Los pesos suman 95 %: cuadra antes de continuar"}
  tools={
    <>
      <DrawerRailButton icon={Scale} label="Cuadrar pesos" iconOnly onClick={balance} />
      <DrawerRailButton icon={Wand2} label="Sugerir con IA" iconOnly onClick={suggest} />
    </>
  }
  actions={
    <>
      <DrawerRailButton icon={ArrowLeft} label="Atrás" onClick={back} />
      <DrawerRailButton icon={ArrowRight} label="Continuar" variant="primary" disabled={!isBalanced} onClick={next} />
    </>
  }
/>`,
      render: () => <StepDemo />,
    },
    {
      id: "minimal",
      title: "minimal: solo decidir",
      description: "Al revisar una propuesta de IA lo único seguro es aceptarla o descartarla: sin ajustes, sin pista, sin herramientas.",
      layout: "stretch",
      code: `<DrawerActionRail
  minimal
  keepOpen
  actions={
    <>
      <DrawerRailButton icon={X} label="Descartar" variant="danger" onClick={discard} />
      <DrawerRailButton icon={Check} label="Aplicar" variant="primary" onClick={apply} />
    </>
  }
/>`,
      render: () => <MinimalDemo />,
    },
    {
      id: "selection",
      title: "actions null hasta que haya selección",
      description: "Igual que el `contextual` del shell: con `null` el grupo y su divisoria se caen del todo, y `keepOpen` se enciende solo mientras haya algo marcado.",
      layout: "stretch",
      code: `<DrawerActionRail
  hint={count === 0 ? "Marca filas para actuar sobre ellas" : \`\${count} marcadas\`}
  keepOpen={count > 0}
  actions={count > 0 ? <DrawerRailButton icon={Trash2} label="Quitar de la lista" variant="danger" onClick={remove} /> : null}
/>`,
      render: () => <SelectionDemo />,
    },
    {
      id: "buttons",
      title: "DrawerRailButton",
      description: "Cuatro variantes y `iconOnly`, que reduce el botón a un cuadrado y mueve el rótulo al tooltip.",
      code: `<DrawerRailButton icon={ArrowLeft} label="Atrás" onClick={back} />
<DrawerRailButton icon={ArrowRight} label="Continuar" variant="primary" onClick={next} />
<DrawerRailButton icon={Scale} label="Revisar pesos" variant="warning" onClick={review} />
<DrawerRailButton icon={Trash2} label="Eliminar" variant="danger" onClick={remove} />
<DrawerRailButton icon={Wand2} label="Sugerir con IA" iconOnly onClick={suggest} />
<DrawerRailButton icon={Check} label="Guardar" variant="primary" disabled onClick={save} />`,
      render: () => (
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-3xl border border-white/10 bg-surface-nav px-3 py-2.5 shadow-rail">
          <DrawerRailButton icon={ArrowLeft} label="Atrás" onClick={() => undefined} />
          <DrawerRailButton icon={ArrowRight} label="Continuar" variant="primary" onClick={() => undefined} />
          <DrawerRailButton icon={Scale} label="Revisar pesos" variant="warning" onClick={() => undefined} />
          <DrawerRailButton icon={Trash2} label="Eliminar" variant="danger" onClick={() => undefined} />
          <DrawerRailButton icon={Wand2} label="Sugerir con IA" iconOnly onClick={() => undefined} />
          <DrawerRailButton icon={Check} label="Guardar" variant="primary" disabled onClick={() => undefined} />
        </div>
      ),
    },
  ],
  props: [
    { name: "actions", type: "React.ReactNode", description: "Lo que cierra el paso: continuar, guardar. `null` cuando depende de una selección vacía; el grupo desaparece entero." },
    { name: "hint", type: "React.ReactNode", description: "Dónde está el paso, en una línea. Se trunca a 34 caracteres." },
    { name: "tools", type: "React.ReactNode", description: "Acciones puntuales del paso: cuadrar pesos, resolver un conflicto." },
    { name: "keepOpen", type: "boolean", default: "false", description: "Mantiene la barra abierta pese a la preferencia de auto-ocultar; para avisos que solo se resuelven desde aquí." },
    { name: "isBlocked", type: "boolean", default: "false", description: "Recoge y bloquea la barra: no hay nada seguro que hacer todavía." },
    { name: "minimal", type: "boolean", default: "false", description: "Deja solo `actions`: sin asa, ajustes, pista ni herramientas." },
    { name: "DrawerRailButton.icon", type: "React.ComponentType<{ className?; strokeWidth? }>", description: "El componente de icono (no el elemento); se pinta a 16px." },
    { name: "DrawerRailButton.label / onClick / disabled", type: "string / () => void / boolean", description: "Rótulo (también `aria-label`), acción y estado." },
    { name: "DrawerRailButton.variant", type: '"ghost" | "primary" | "warning" | "danger"', default: '"ghost"', description: "Intención del botón; una sola `primary` por barra." },
    { name: "DrawerRailButton.iconOnly", type: "boolean", default: "false", description: "Cuadrado de 36px con el rótulo en tooltip." },
  ],
  guidelines: {
    do: [
      "Colócala en la franja del pie del drawer, no sobre el contenido: así nada queda tapado y la lista no salta al recogerse.",
      "Usa `iconOnly` para las herramientas y deja el rótulo a las acciones que cierran el paso.",
      "Enciende `keepOpen` cuando la pista sea un aviso que hay que resolver desde la barra.",
    ],
    dont: [
      "No pases más de dos acciones de cierre; el resto son herramientas.",
      "No uses `minimal` para ahorrar espacio: es para cuando decidir es lo único seguro.",
      "No mezcles DrawerRailButton con RailButton en la misma barra; son dos lenguajes (con rótulo y sin él).",
    ],
  },
  related: ["action-rail-shell", "confirm-action-popover", "rail-settings-menu", "drawer-shell"],
});
