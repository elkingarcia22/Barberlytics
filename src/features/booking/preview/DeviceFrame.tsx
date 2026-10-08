import * as React from "react";
import { Text } from "@/components/typography";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";

export type PreviewDevice = "phone" | "tablet" | "monitor";

interface DeviceFrameProps {
  device: PreviewDevice;
  /** La dirección que se lee en la barra del navegador (monitor). */
  address?: string;
  children: React.ReactNode;
}

/**
 * La silueta de la pantalla donde el cliente ve la reserva: un celular, la
 * tablet del local o un monitor con su navegador. Solo es un marco; el
 * contenido se adapta por `layout`, no por el ancho de la ventana.
 */
export function DeviceFrame({ device, address, children }: DeviceFrameProps) {
  if (device === "monitor") {
    return (
      <div className="flex h-full w-full max-w-wide flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-500">
        <div className="flex h-10 shrink-0 items-center gap-3 border-b border-border bg-surface-subtle px-4">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-destructive/70" />
            <span className="size-2.5 rounded-full bg-warning/70" />
            <span className="size-2.5 rounded-full bg-success/70" />
          </span>
          <span className="mx-auto flex min-w-0 max-w-md flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 py-1">
            <ThemaIcon name="lock" size="xs" tone="muted" />
            <Text size="xs" tone="muted" truncate>
              {address}
            </Text>
          </span>
          <span className="w-12" aria-hidden />
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    );
  }

  const isPhone = device === "phone";
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden border-foreground/85 bg-foreground/85 shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-500",
        isPhone ? "h-[min(844px,100%)] w-[390px] rounded-[3rem] border-[10px]" : "h-[min(1112px,100%)] w-[min(834px,100%)] rounded-[2.25rem] border-[14px]"
      )}
    >
      {isPhone && <span className="absolute left-1/2 top-2 z-raised h-6 w-28 -translate-x-1/2 rounded-full bg-foreground" aria-hidden />}
      <div className={cn("h-full overflow-hidden bg-background", isPhone ? "rounded-[2.4rem] pt-7" : "rounded-[1.4rem]")}>{children}</div>
    </div>
  );
}
