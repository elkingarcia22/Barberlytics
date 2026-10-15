import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import type { DraftItem } from "../bookingState";
import { visitPartOf } from "../visit";
import { useBookingFlow } from "./BookingContext";
import { PersonPicker } from "./PersonPicker";

type PartState = "done" | "current" | "pending";

interface VisitPartNoteProps {
  /** El carrito sin la hora que se va a reemplazar (la Agenda). */
  items?: readonly DraftItem[];
  /** Preguntar aquí para quién es esta parte (con cuenta: sin ella no hay a quién más elegir). */
  withPerson?: boolean;
}

/**
 * Al armar una parte de una visita: qué parte es («1 de 3»), de qué servicio, cómo va la visita
 * (las hechas, esta y las que faltan) y, en la misma tarjeta, para quién es: cada parte puede ser
 * de alguien distinto (yo el corte, mi hijo el suyo). «Juntar todo» sale del «por separado» y vuelve
 * a una sola cita. Fuera de una visita no se muestra.
 */
export function VisitPartNote({ items, withPerson = false }: VisitPartNoteProps) {
  const t = useAppT();
  const { state, dispatch, catalog } = useBookingFlow();
  const draft = state.draft;
  const part = visitPartOf(state, items);
  // Cada parte nueva se trae a la vista: el interruptor queda abajo y el cambio pasa arriba (la Agenda).
  const ref = React.useRef<HTMLElement>(null);
  const partKey = part ? draft?.key : undefined;
  React.useEffect(() => {
    if (!partKey) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    ref.current?.scrollIntoView?.({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  }, [partKey]);
  if (!draft || !part) return null;
  const nameOf = (ids: readonly string[]) => ids.map((id) => catalog?.services.find((service) => service.id === id)?.name ?? id).join(" + ");
  const service = nameOf(draft.serviceIds);
  const done = (items ?? state.items)
    .filter((item, index) => item.visitId === draft.visitId && index !== state.editingIndex)
    .sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
  const steps: { key: string; name: string; state: PartState }[] = [
    ...done.map((item) => ({ key: item.key, name: nameOf(item.serviceIds), state: "done" as const })),
    { key: draft.key, name: service, state: "current" as const },
    ...(state.pendingParts ?? []).map((id) => ({ key: `pending-${id}`, name: nameOf([id]), state: "pending" as const })),
  ];

  return (
    <section ref={ref} aria-label={t("booking.visit.part", part)} className="overflow-hidden rounded-2xl bg-surface shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-300">
      {/* Una franja de color, no otra tarjeta como Sede o Barbero: dice que se está en «por separado» y cómo salir. */}
      <header className="flex items-center gap-2 bg-primary py-1.5 pl-4 pr-1.5">
        <ThemaIcon name="link" size="sm" tone="inverse" />
        <Text size="sm" weight="semibold" tone="inverse" className="min-w-0 flex-1" truncate>
          {t("booking.visit.part", part)}
        </Text>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
          onClick={() => dispatch({ type: "exitVisit" })}
          aria-label={t("booking.visit.exitAria")}
        >
          {t("booking.visit.exit")}
        </Button>
      </header>

      <div className="flex flex-col gap-4 bg-primary/5 p-4">
        <Text size="lg" weight="semibold" truncate>
          {service}
        </Text>

        {/* Cómo va la visita: cada servicio con su número; los hechos con su marca. */}
        <ol className="flex gap-3">
          {steps.map((step, position) => (
            <li key={step.key} className="flex min-w-0 flex-1 items-center gap-2" aria-current={step.state === "current" ? "step" : undefined}>
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                  step.state === "current" && "bg-primary text-primary-foreground",
                  step.state === "done" && "bg-primary/15 text-primary",
                  step.state === "pending" && "border border-border text-text-muted"
                )}
                aria-hidden
              >
                {step.state === "done" ? <ThemaIcon name="check" size="xs" /> : position + 1}
              </span>
              <Text size="xs" tone={step.state === "current" ? "default" : "muted"} weight={step.state === "current" ? "semibold" : undefined} truncate>
                {step.name}
              </Text>
            </li>
          ))}
        </ol>

        {withPerson && <PersonPicker label={t("booking.visit.forWho")} />}
      </div>
    </section>
  );
}
