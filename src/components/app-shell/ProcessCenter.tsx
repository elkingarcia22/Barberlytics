import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Text } from "@/components/typography";
import { GlassIcon, ThemaIcon, type IconName } from "@/icons";
import { useT } from "@/i18n";
import { SHELL_MENU_PANEL } from "./shellPanel";
import { useLiquidOrigin } from "./useLiquidOrigin";
import { processState, useShellProcesses, type ShellProcess, type ShellProcessState } from "./processStore";

export interface ProcessCenterProps {
  /**
   * Abre el historial completo. Sin esto el pie no ofrece «Historial»: los
   * procesos terminados siguen en la lista, que es todo lo que hay que ver.
   */
  onOpenHistory?: () => void;
  className?: string;
}

/** La baldosa dice el estado sin leer: con color si corre, verde si acabó, rojo si falló, gris si espera. */
const TILE_TONE: Record<ShellProcessState, string> = {
  running: "bg-primary/10 text-primary",
  waiting: "bg-surface-muted text-text-muted",
  done: "bg-success/15 text-success",
  failed: "bg-destructive/10 text-destructive",
};

const STATE_ICON: Partial<Record<ShellProcessState, IconName>> = { done: "success", failed: "error" };
const DEFAULT_ICON: IconName = "queue";

/**
 * ProcessCenter
 *
 * El Centro de procesos de la cabecera: lo que sigue trabajando aunque la
 * persona cambie de pantalla —importaciones, subidas, exportaciones—, con su
 * avance, y lo que ya terminó. No lanza nada: cada pantalla publica lo suyo
 * con `publishProcess` y aquí solo se mira y se actúa sobre ello.
 *
 * El botón lleva un punto mientras algo corre, para que se sepa sin abrirlo.
 *
 * @example
 * publishProcess({ id: "import-clientes", title: "Importando clientes", meta: "120 de 480", progress: 25 })
 */
export function ProcessCenter({ onOpenHistory, className }: ProcessCenterProps) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const origin = useLiquidOrigin();
  const processes = useShellProcesses();

  const count = (state: ShellProcessState) => processes.filter((process) => processState(process) === state).length;
  const running = count("running");
  const done = count("done");
  const failed = count("failed");
  // El resumen se cuenta solo, a partir de la lista. Lo terminado y lo fallido
  // solo se nombran si los hay: así, en el caso normal, cabe en una línea.
  const summary =
    processes.length === 0
      ? t("shell.processes.none")
      : [
          t("shell.processes.running", { count: running }),
          t("shell.processes.waiting", { count: count("waiting") }),
          ...(done ? [t(done === 1 ? "shell.processes.done" : "shell.processes.done_plural", { count: done })] : []),
          ...(failed ? [t(failed === 1 ? "shell.processes.failed" : "shell.processes.failed_plural", { count: failed })] : []),
        ].join(" · ");

  const openHistory = () => {
    setOpen(false);
    onOpenHistory?.();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={origin.triggerRef}
          type="button"
          className={cn(
            "relative flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary",
            open && "bg-surface-muted text-text-primary",
            className
          )}
          title={t("shell.processes")}
          aria-label={running > 0 ? `${t("shell.processes")}, ${t("shell.processes.running", { count: running })}` : t("shell.processes")}
          data-testid="shell-processes"
        >
          <ThemaIcon name={DEFAULT_ICON} size="sm" />
          {running > 0 && <span className="absolute right-1.5 top-1 h-2 w-2 rounded-full border-[1.5px] border-surface bg-primary motion-safe:animate-pulse" />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        ref={origin.contentRef}
        align="end"
        sideOffset={8}
        liquid
        style={origin.style}
        aria-label={t("shell.processes")}
        className={cn("w-[min(340px,calc(100vw-1rem))] overflow-hidden p-0", SHELL_MENU_PANEL)}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-muted text-text-secondary">
            <ThemaIcon name={DEFAULT_ICON} size="sm" />
          </span>
          <div className="min-w-0 flex-1">
            <Text weight="semibold" className="leading-tight">
              {t("shell.processes")}
            </Text>
            {/* Sin truncar: con algo terminado y algo fallido el resumen pasa a dos líneas antes que cortarse. */}
            <Text size="sm" tone="secondary" aria-live="polite" className="leading-snug">
              {summary}
            </Text>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-expanded={!isCollapsed}
            aria-label={t(isCollapsed ? "shell.processes.expand" : "shell.processes.collapse")}
            onClick={() => setIsCollapsed((value) => !value)}
          >
            <ThemaIcon name={isCollapsed ? "chevronDown" : "chevronUp"} size="sm" />
          </Button>
        </div>

        {!isCollapsed && processes.length === 0 && (
          <div className="flex flex-col items-center gap-1 border-t border-dashed border-border/70 px-6 py-8 text-center">
            <GlassIcon name="analytics" tone="brand" size={64} className="mb-2" />
            <Text weight="semibold">{t("shell.processes.emptyTitle")}</Text>
            <Text size="sm" tone="secondary">
              {t("shell.processes.emptyHint")}
            </Text>
          </div>
        )}

        {!isCollapsed && processes.length > 0 && (
          <ul className="max-h-[min(360px,55vh)] divide-y divide-border/60 overflow-y-auto border-t border-border/60">
            {processes.map((process) => (
              <ProcessRow key={process.id} process={process} onAfterAction={() => setOpen(false)} />
            ))}
          </ul>
        )}

        {!isCollapsed && (processes.length > 0 || onOpenHistory) && (
          <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-surface-subtle px-4 py-2">
            <Text size="xs" tone="muted" truncate>
              {processes.length > 0 ? t("shell.processes.keepRunning") : ""}
            </Text>
            {onOpenHistory && (
              <Button variant="ghost" size="sm" className="-mr-2 shrink-0" onClick={openHistory}>
                {t("shell.processes.history")}
              </Button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function ProcessRow({ process, onAfterAction }: { process: ShellProcess; onAfterAction: () => void }) {
  const t = useT();
  const state = processState(process);
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg", TILE_TONE[state])}>
        <ThemaIcon name={STATE_ICON[state] ?? process.icon ?? DEFAULT_ICON} size="sm" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <Text size="sm" weight="medium" truncate>
          {process.title}
        </Text>
        {state === "running" ? (
          // El detalle a la izquierda, el porcentaje a la derecha y el avance
          // debajo. El color de marca queda solo aquí: significa progreso.
          <>
            <div className="flex items-baseline justify-between gap-2">
              <Text size="xs" tone="secondary" truncate>
                {process.meta}
              </Text>
              <Text size="xs" weight="medium" tabular className="shrink-0">
                {Math.round(process.progress ?? 0)}%
              </Text>
            </div>
            <Progress value={process.progress ?? 0} aria-label={t("shell.processes.progressOf", { title: process.title })} className="h-1.5" />
          </>
        ) : (
          <Text size="xs" tone={state === "failed" ? "negative" : "secondary"} truncate>
            {process.meta}
          </Text>
        )}
      </div>
      {/* La acción tiene columna propia: el título puede truncar sin moverla. */}
      {process.actionLabel && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 self-center"
          onClick={() => {
            onAfterAction();
            process.onAction?.();
          }}
        >
          {process.actionLabel}
        </Button>
      )}
    </li>
  );
}
