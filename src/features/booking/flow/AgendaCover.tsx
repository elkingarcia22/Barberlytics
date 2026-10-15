import * as React from "react";
import { Heading, Text } from "@/components/typography";
import { cn } from "@/lib/utils";
import { useBookingFlow } from "./BookingContext";
import { STEP_WIDTH } from "./stepWidth";

/**
 * La portada de la Agenda: la foto de la barbería arriba, que se funde hacia abajo, y la columna del
 * contenido montada sobre ella. La usan el tablero de la Agenda y, en «Según el cliente», los pasos
 * de elegir del cliente nuevo: así las dos mitades de la experiencia se ven iguales.
 */
export function AgendaCover({ className, children }: { className?: string; children: React.ReactNode }) {
  const { shop, layout } = useBookingFlow();
  const cover = shop.coverUrl ?? shop.branches.find((branch) => branch.imageUrl)?.imageUrl ?? null;
  return (
    <>
      {/* Encuadrada arriba (donde está la cara) y desvanecida por máscara, para fundirse con cualquier fondo de debajo. */}
      <div className={cn("relative shrink-0 overflow-hidden dark:[mask-image:linear-gradient(to_bottom,black_55%,transparent)]", layout === "wide" ? "h-72" : "h-48 dark:h-56")} aria-hidden>
        {cover && <img src={cover} alt="" className="size-full object-cover object-[50%_15%] brightness-[1.2] dark:brightness-100 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700" />}
        {/* En claro la foto va entera, sin velo ni desvanecido y algo más clara: cualquier fundido la lavaba de
            blanco. En oscuro el velo la cubre entera y el título se lee sobre ella. */}
        <div className="absolute inset-0 hidden bg-gradient-to-t from-background via-background/85 via-50% to-background/45 dark:block" />
      </div>
      {/* Se lee como Paso a paso: una columna centrada, del mismo ancho, montada sobre la foto. */}
      <div className={cn("relative mx-auto flex w-full flex-col gap-6 px-5 pb-8 pt-6", STEP_WIDTH[layout], layout === "wide" ? "-mt-60 px-8 pt-8" : "-mt-40 dark:-mt-48", className)}>{children}</div>
    </>
  );
}

/**
 * El título sobre la foto. En claro va en vidrio ahumado: la foto desenfocada y más viva detrás, un
 * canto de luz arriba y texto blanco (un vidrio claro sobre una foto oscura salía gris). En oscuro
 * basta la sombra del fondo.
 */
export function AgendaCoverTitle({ title, lead, aside }: { title: string; lead?: string; aside?: React.ReactNode }) {
  const { layout } = useBookingFlow();
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
      <div className="flex min-w-0 flex-col gap-1.5 rounded-2xl border border-white/25 bg-black/30 px-4 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_10px_28px_-14px_rgb(0_0_0/0.6)] backdrop-blur-xl backdrop-saturate-150 dark:rounded-none dark:border-0 dark:bg-transparent dark:p-0 dark:shadow-none dark:backdrop-blur-none dark:backdrop-saturate-100">
        <Heading level={layout === "wide" ? 2 : 3} tone="inverse" className="dark:text-text-primary dark:[text-shadow:0_1px_16px_hsl(var(--background))]">
          {title}
        </Heading>
        {lead && (
          <Text tone="inverse" className="dark:text-text-primary dark:[text-shadow:0_1px_10px_hsl(var(--background))]">
            {lead}
          </Text>
        )}
      </div>
      {aside}
    </header>
  );
}
