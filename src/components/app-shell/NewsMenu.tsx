import * as React from "react";
import { Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useT } from "@/i18n";
import { useLiquidOrigin } from "./useLiquidOrigin";
import type { NewsItem } from "./appShellData";

export interface NewsMenuProps {
  items: readonly NewsItem[];
  /**
   * Qué abre el panel. `icon` es el botón redondo de la cabecera; `row` es la
   * fila del pie del menú lateral, que es donde vive esto en móvil: ahí la
   * cabecera necesita su ancho para el contexto de la cuenta.
   */
  variant?: "icon" | "row";
  side?: "top" | "bottom";
  align?: "start" | "end";
  className?: string;
}

/**
 * «Novedades»: lo que ha cambiado en la plataforma.
 *
 * Un solo panel con dos puertas. En pantalla ancha cuelga de la cabecera, al
 * lado de las notificaciones; por debajo de `md` la cabecera se queda sin
 * sitio —el chip de la cuenta se lleva ese ancho— y la puerta pasa al pie del
 * cajón lateral, que es donde ya vive lo que no es de la pantalla actual.
 */
export function NewsMenu({ items, variant = "icon", side = "bottom", align = "end", className }: NewsMenuProps) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const origin = useLiquidOrigin();
  const newCount = items.filter((item) => item.isNew).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === "icon" ? (
          <button
            ref={origin.triggerRef}
            className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary",
              open && "bg-surface-muted text-text-primary",
              className
            )}
            title={t("shell.news")}
            aria-label={t("shell.news")}
          >
            <Megaphone className="h-4 w-4" strokeWidth={2} />
            {/* Punto de "hay novedades", igual que el de notificaciones: el
                botón ya no lleva texto que lo diga por sí solo. */}
            {newCount > 0 && (
              <span className="absolute right-1.5 top-1 h-2 w-2 rounded-full border-[1.5px] border-surface bg-primary" />
            )}
          </button>
        ) : (
          <button
            ref={origin.triggerRef}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-background hover:text-text-secondary",
              open && "bg-background text-text-secondary",
              className
            )}
            aria-label={t("shell.news")}
          >
            <Megaphone className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="flex-1 text-left">{t("shell.news")}</span>
            {newCount > 0 && (
              <span className="flex h-5 shrink-0 items-center rounded-full bg-primary/10 px-2 text-[10px] font-extrabold tabular-nums text-primary">
                {newCount}
              </span>
            )}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        ref={origin.contentRef}
        side={side}
        align={align}
        sideOffset={8}
        liquid
        style={origin.style}
        className="w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border/60 p-0 shadow-drawer ring-0"
      >
        {/* Cabecera propia de la plataforma, no de la IA: un avance de
            producto puede o no tocar IA, así que ni el icono ni el fondo se
            prestan del agente (`ai-mesh-agent`/`AI_GRADIENT` son para ese
            modo, no para "hay cosas nuevas"). */}
        <div className="flex items-center gap-2.5 border-b border-border/60 bg-surface-muted px-4 py-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Megaphone className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold leading-tight text-text-primary">{t("shell.news")}</div>
            <div className="text-[11px] text-text-muted">Agosto 2026</div>
          </div>
          {newCount > 0 && (
            <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-primary/10 px-2 text-[10px] font-extrabold text-primary">
              {newCount} nuevas
            </span>
          )}
        </div>

        {/* Items con stagger */}
        <div className="flex max-h-[min(420px,60vh)] flex-col gap-0.5 overflow-y-auto p-2">
          {items.map((item, index) => (
            <button
              key={item.title}
              className={cn(
                "w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-background",
                "translate-y-2 opacity-0",
                open && "translate-y-0 opacity-100"
              )}
              style={{
                transition: open
                  ? `opacity 280ms cubic-bezier(0.16,1,0.3,1) ${index * 50}ms, transform 280ms cubic-bezier(0.16,1,0.3,1) ${index * 50}ms`
                  : "none",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-text-primary">{item.title}</span>
                {item.isNew && (
                  <span className="flex h-4 items-center rounded-full bg-primary/10 px-2 text-[10px] font-extrabold text-primary">
                    Nuevo
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs leading-snug text-text-secondary">{item.description}</p>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
