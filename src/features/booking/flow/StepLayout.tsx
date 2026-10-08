import * as React from "react";
import { Heading, Text } from "@/components/typography";
import { cn } from "@/lib/utils";
import { useBookingFlow } from "./BookingContext";

interface StepLayoutProps {
  title: string;
  lead?: string;
  /** Lo que va a la derecha del título: un enlace secundario, un chip. */
  aside?: React.ReactNode;
  /** El pie fijo del paso: lo elegido hasta ahora y el botón para seguir. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * El molde de cada paso: título que dice qué se decide aquí, el contenido y
 * un pie pegado abajo con el botón principal, siempre en el mismo sitio para
 * que el pulgar lo encuentre sin buscar.
 */
export function StepLayout({ title, lead, aside, footer, children }: StepLayoutProps) {
  const { layout } = useBookingFlow();
  const headingRef = React.useRef<HTMLDivElement>(null);
  // Al cambiar de paso el foco va al título: quien navega con lector sabe dónde está.
  React.useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [title]);

  return (
    <div className="flex flex-1 flex-col">
      <div className={cn("flex flex-1 flex-col gap-6 px-5 pb-6 pt-6", layout === "wide" && "px-8 pt-8")}>
        <header className="flex items-start justify-between gap-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
          <div ref={headingRef} tabIndex={-1} className="flex min-w-0 flex-col gap-1.5 outline-none">
            <Heading level={layout === "wide" ? 2 : 3}>{title}</Heading>
            {lead && <Text tone="secondary">{lead}</Text>}
          </div>
          {aside}
        </header>
        <div className="flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">{children}</div>
      </div>
      {footer && (
        <div className="sticky bottom-0 z-sticky border-t border-border bg-surface/95 px-5 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
          {footer}
        </div>
      )}
    </div>
  );
}
