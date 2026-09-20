import * as React from "react";
import { Copy, Download, FileText, Filter, Plus, Sparkles, Trash2 } from "lucide-react";
import {
  ActionRailShell,
  AnimatedActionItem,
  RailButton,
  RailCreateOption,
  RailGroupShimmer,
  RailPrimaryAction,
  RailSelectionChip,
  setRailOrientation,
  useContextChangeKey,
  useRailPopoutSide,
  type RailOrientation,
} from "@/components/action-rail";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DemoTable, RailFrame, useDemoSelection } from "./railDemo";

const ICON = "h-[20px] w-[20px]";

/**
 * Una barra completa, como la montaría una pantalla de lista: el grupo
 * contextual aparece con la selección (chip, duplicar, eliminar) y el
 * persistente vive siempre (exportar, filtrar, crear).
 */
export function ShellDemo({
  isBlocked = false,
  keepOpen = false,
  startSelected = false,
  height = 300,
}: {
  isBlocked?: boolean;
  keepOpen?: boolean;
  startSelected?: boolean;
  height?: number;
}) {
  const { selected, toggle, clear } = useDemoSelection(startSelected ? ["r1"] : []);
  const [createOpen, setCreateOpen] = React.useState(false);
  const hasSelection = selected.length > 0;
  const animKey = useContextChangeKey(hasSelection ? "selection" : "none");
  const popoutSide = useRailPopoutSide();

  const contextual = hasSelection ? (
    <>
      <RailGroupShimmer animKey={animKey} />
      <AnimatedActionItem animKey={animKey} staggerIndex={0} skipColorFlash>
        <RailSelectionChip count={selected.length} onClear={clear} />
      </AnimatedActionItem>
      <AnimatedActionItem animKey={animKey} staggerIndex={1}>
        <RailButton icon={<Copy className={ICON} strokeWidth={2} />} label="Duplicar" onClick={clear} />
      </AnimatedActionItem>
      <AnimatedActionItem animKey={animKey} staggerIndex={2}>
        <RailButton icon={<Trash2 className={ICON} strokeWidth={2} />} label="Eliminar" tone="danger" onClick={clear} />
      </AnimatedActionItem>
    </>
  ) : null;

  const persistent = (
    <>
      <RailButton icon={<Download className={ICON} strokeWidth={2} />} label="Exportar" onClick={() => undefined} />
      <RailButton
        icon={<Filter className={ICON} strokeWidth={2} />}
        label="Filtrar"
        blockedReason="No hay filtros para esta vista"
        onClick={() => undefined}
      />
      <Popover open={createOpen} onOpenChange={setCreateOpen}>
        <PopoverTrigger asChild>
          <RailPrimaryAction icon={<Plus className="size-4" strokeWidth={2.5} />} label="Crear encuesta" />
        </PopoverTrigger>
        <PopoverContent
          side={popoutSide}
          align="end"
          sideOffset={12}
          collisionPadding={16}
          className="w-72 flex-col gap-0 rounded-2xl border-white/10 bg-surface-nav p-2 shadow-rail"
        >
          <RailCreateOption
            icon={<FileText className={ICON} strokeWidth={2} />}
            title="Desde cero"
            description="Una encuesta en blanco, pregunta a pregunta."
            onClick={() => setCreateOpen(false)}
          />
          <RailCreateOption
            icon={<Sparkles className={ICON} strokeWidth={2} />}
            title="Con IA"
            description="Describe el objetivo y la IA propone las preguntas."
            onClick={() => setCreateOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </>
  );

  return (
    <RailFrame height={height}>
      <DemoTable selected={selected} onToggle={toggle} className="p-4" />
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <ActionRailShell
          contextual={contextual}
          persistent={persistent}
          keepOpen={keepOpen || hasSelection}
          isBlocked={isBlocked}
        />
      </div>
    </RailFrame>
  );
}

/**
 * Sincroniza un control del playground con la preferencia compartida de
 * orientación. Salta el primer montaje para no pisar lo que la persona ya
 * eligió desde el menú de ajustes.
 */
export function RailOrientationKnob({ orientation }: { orientation: RailOrientation }) {
  const previous = React.useRef<RailOrientation | null>(null);
  React.useEffect(() => {
    if (previous.current !== null && previous.current !== orientation) setRailOrientation(orientation);
    previous.current = orientation;
  }, [orientation]);
  return null;
}

/** Simula un panel modal que bloquea la barra: al abrirse, la barra se recoge sola. */
export function BlockedShellDemo() {
  const [panelOpen, setPanelOpen] = React.useState(false);
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setPanelOpen((value) => !value)}
        className="rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-subtle"
      >
        {panelOpen ? "Cerrar panel" : "Abrir panel modal"}
      </button>
      <ShellDemo isBlocked={panelOpen} startSelected height={240} />
    </div>
  );
}

/** El contador que re-dispara el stagger: cada cambio de contexto suma uno a la clave. */
export function ContextKeyDemo() {
  const contexts = ["lista", "selección", "filtro"] as const;
  const [index, setIndex] = React.useState(0);
  const animKey = useContextChangeKey(contexts[index]);
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => setIndex((value) => (value + 1) % contexts.length)}
        className="rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-subtle"
      >
        Cambiar contexto ({contexts[index]})
      </button>
      <div className="relative flex h-14 items-center gap-2 rounded-3xl border border-white/10 bg-surface-nav px-3 shadow-rail">
        <RailGroupShimmer animKey={animKey} />
        {[Download, Copy, Trash2].map((Icon, staggerIndex) => (
          <AnimatedActionItem key={staggerIndex} animKey={animKey} staggerIndex={staggerIndex}>
            <RailButton icon={<Icon className={ICON} strokeWidth={2} />} label={`Acción ${staggerIndex + 1}`} onClick={() => undefined} />
          </AnimatedActionItem>
        ))}
      </div>
      <p className="text-xs text-text-muted">
        animKey = <span className="font-mono text-text-primary">{animKey}</span>
      </p>
    </div>
  );
}
