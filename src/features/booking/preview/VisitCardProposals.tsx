import * as React from "react";
import { Chip } from "@/components/ai-interaction";
import { ProgressRing } from "@/components/data-display/ProgressRing";
import { Heading, Text } from "@/components/typography";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";

/*
 * Exploración de diseño (solo en la vista previa): cinco formas de la tarjeta de la parte de una
 * visita «por separado». Mismos datos en todas: la parte 2 de 3, con el corte ya apartado.
 */

type PartState = "done" | "current" | "pending";

interface DemoPart {
  service: string;
  state: PartState;
  /** Lo apartado: hora y barbero. */
  detail?: string;
}

const PARTS: readonly DemoPart[] = [
  { service: "Corte clásico", state: "done", detail: "10:00 a. m. · Emilio · Para mí" },
  { service: "Fade", state: "current" },
  { service: "Corte niño", state: "pending" },
];
const CURRENT = PARTS.findIndex((part) => part.state === "current");
const PEOPLE = ["Para mí", "Santiago · Hijo"] as const;

/** «¿Para quién?»: las mismas fichas en todas, con su elección propia. */
function PersonChips({ size = "md" }: { size?: "sm" | "md" }) {
  const [person, setPerson] = React.useState<string>(PEOPLE[0]);
  return (
    <div className="flex flex-wrap gap-2">
      {PEOPLE.map((name) => (
        <Chip key={name} label={name} icon={name === PEOPLE[0] ? "users" : undefined} size={size} selected={person === name} onClick={() => setPerson(name)} />
      ))}
      <Chip label="Otra persona" icon="userAdd" tone="primary" size={size} onClick={() => setPerson(PEOPLE[0])} />
    </div>
  );
}

function ExitButton({ className }: { className?: string }) {
  return (
    <Button type="button" variant="ghost" size="sm" className={cn("h-7 shrink-0", className)}>
      Juntar todo
    </Button>
  );
}

/** 1 · Tira de pasos: sin caja, como el progreso de la reserva; los servicios son las etapas. */
function StripProposal() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Text size="xs" weight="semibold" tone="primary" className="uppercase tracking-wide">
          Por separado · {CURRENT + 1} de {PARTS.length}
        </Text>
        <ExitButton className="-mr-2 text-primary" />
      </div>
      <ol className="flex gap-1 rounded-full bg-surface-muted p-1">
        {PARTS.map((part) => (
          <li
            key={part.service}
            className={cn(
              "flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full px-2 py-1.5 text-xs",
              part.state === "current" && "bg-primary font-semibold text-primary-foreground shadow-sm",
              part.state === "done" && "text-primary",
              part.state === "pending" && "text-text-muted"
            )}
          >
            {part.state === "done" && <ThemaIcon name="check" size="xs" />}
            <span className="truncate">{part.service}</span>
          </li>
        ))}
      </ol>
      <PersonChips size="sm" />
    </div>
  );
}

/** 2 · Talón: una entrada con su número grande a la izquierda y la línea punteada. */
function TicketProposal() {
  return (
    <div className="relative flex overflow-hidden rounded-2xl bg-primary/10">
      <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 border-r-2 border-dashed border-primary/40 py-4">
        <Text size="xs" tone="primary" weight="semibold" className="uppercase tracking-wide">
          Parte
        </Text>
        <span className="text-3xl font-semibold tabular-nums text-primary">{CURRENT + 1}</span>
        <Text size="xs" tone="muted" tabular>
          de {PARTS.length}
        </Text>
      </div>
      {/* Las muescas del talón, del color del fondo. */}
      <span className="absolute -top-2 left-[4.5rem] size-4 rounded-full bg-background" aria-hidden />
      <span className="absolute -bottom-2 left-[4.5rem] size-4 rounded-full bg-background" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <Text size="lg" weight="semibold" truncate>
              {PARTS[CURRENT].service}
            </Text>
            <Text size="xs" tone="muted" truncate>
              Luego: {PARTS.slice(CURRENT + 1).map((part) => part.service).join(", ")}
            </Text>
          </div>
          <ExitButton className="-mr-2 -mt-1 text-primary" />
        </div>
        <PersonChips size="sm" />
      </div>
    </div>
  );
}

/** 3 · Pila: la parte de ahora delante y las que faltan asomando detrás, con profundidad. */
function StackProposal() {
  const pending = PARTS.filter((part) => part.state === "pending").length;
  return (
    // `isolate`: las de atrás (z negativo) quedan sobre el fondo de la página, no debajo.
    <div className="relative isolate pb-4">
      {Array.from({ length: pending }, (_, index) => (
        <span key={index} className="absolute inset-x-0 bottom-0 mx-auto h-full rounded-2xl border border-border bg-surface shadow-sm" style={{ width: `${92 - index * 6}%`, transform: `translateY(${(index + 1) * 8}px)`, zIndex: -1 - index }} aria-hidden />
      ))}
      <div className="relative flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-md">
        <div className="flex items-center gap-3">
          <ProgressRing size="sm" value={CURRENT} pending={1} max={PARTS.length}>
            <Text as="span" size="xs" weight="semibold" tabular>
              {CURRENT + 1}
            </Text>
          </ProgressRing>
          <div className="flex min-w-0 flex-1 flex-col">
            <Text size="lg" weight="semibold" truncate>
              {PARTS[CURRENT].service}
            </Text>
            <Text size="xs" tone="muted">
              {pending === 1 ? "Queda 1 servicio detrás" : `Quedan ${pending} servicios detrás`}
            </Text>
          </div>
          <ExitButton className="-mr-2 text-primary" />
        </div>
        <PersonChips size="sm" />
      </div>
    </div>
  );
}

/** 4 · Línea de tiempo: toda la visita en vertical; la parte de ahora se abre y las otras se leen. */
function TimelineProposal() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Text size="sm" weight="semibold">
          Tu visita, servicio por servicio
        </Text>
        <ExitButton className="-mr-2 text-primary" />
      </div>
      <ol className="flex flex-col">
        {PARTS.map((part, index) => (
          <li key={part.service} className="relative flex gap-3 pb-4 last:pb-0">
            {index < PARTS.length - 1 && <span className={cn("absolute left-3 top-7 h-[calc(100%-1.75rem)] w-0.5 rounded-full", part.state === "done" ? "bg-primary" : "bg-border")} aria-hidden />}
            <span
              className={cn(
                "relative flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                part.state === "done" && "bg-primary text-primary-foreground",
                part.state === "current" && "bg-surface text-primary ring-2 ring-primary",
                part.state === "pending" && "border border-border bg-surface text-text-muted"
              )}
              aria-hidden
            >
              {part.state === "done" ? <ThemaIcon name="check" size="xs" /> : index + 1}
            </span>
            <div className={cn("flex min-w-0 flex-1 flex-col gap-2", part.state === "current" && "rounded-xl bg-primary/10 p-3 -mt-1.5")}>
              <Text size="sm" weight={part.state === "current" ? "semibold" : "medium"} tone={part.state === "pending" ? "muted" : "default"}>
                {part.service}
              </Text>
              {part.detail && (
                <Text size="xs" tone="muted">
                  {part.detail}
                </Text>
              )}
              {part.state === "current" && <PersonChips size="sm" />}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** 5 · Quién manda: la persona es lo primero que se ve (su avatar), con el anillo de la visita. */
function PersonFirstProposal() {
  const [isOther, setIsOther] = React.useState(false);
  const who = isOther ? "Santiago" : "Marcela";
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setIsOther((value) => !value)} className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Cambiar para quién es">
          <Avatar size="lg" className="ring-2 ring-primary ring-offset-2 ring-offset-background">
            <AvatarFallback>{who.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform duration-fast ease-out-expo group-hover:scale-110 motion-reduce:transition-none">
            <ThemaIcon name="edit" size="xs" tone="inverse" />
          </span>
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <Text size="xs" tone="secondary">
            Para {isOther ? "Santiago · Hijo" : "ti"}
          </Text>
          <Text size="lg" weight="semibold" truncate>
            {PARTS[CURRENT].service}
          </Text>
        </div>
        <ProgressRing size="md" value={CURRENT} pending={1} max={PARTS.length}>
          <Text as="span" size="xs" weight="semibold" tabular>
            {CURRENT + 1}/{PARTS.length}
          </Text>
        </ProgressRing>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-primary/20 pt-3">
        <Text size="xs" tone="muted" truncate>
          Toca la foto para cambiar de persona
        </Text>
        <ExitButton className="-mr-2 text-primary" />
      </div>
    </div>
  );
}

const PROPOSALS: readonly { id: string; title: string; lead: string; render: () => React.ReactNode }[] = [
  { id: "strip", title: "1 · Tira de pasos", lead: "Sin caja: los servicios son las etapas, como el progreso de la reserva.", render: () => <StripProposal /> },
  { id: "ticket", title: "2 · Talón", lead: "Una entrada con el número de la parte en grande y su muesca.", render: () => <TicketProposal /> },
  { id: "stack", title: "3 · Pila", lead: "La parte de ahora delante; las que faltan asoman detrás.", render: () => <StackProposal /> },
  { id: "timeline", title: "4 · Línea de tiempo", lead: "Toda la visita en vertical: lo apartado con su hora, lo de ahora abierto.", render: () => <TimelineProposal /> },
  { id: "person", title: "5 · La persona primero", lead: "El avatar de para quién es manda; el anillo dice cuánto va.", render: () => <PersonFirstProposal /> },
];

/**
 * «Propuestas» en la vista previa: las cinco tarjetas una debajo de otra, con su nombre y en qué
 * se distinguen, sobre el fondo de la reserva. Se tocan (persona) para ver cómo responden.
 */
export function VisitCardProposals() {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto flex max-w-md flex-col gap-8 px-5 py-8">
        <header className="flex flex-col gap-1">
          <IconTile size="md" icon={<ThemaIcon name="layers" />} />
          <Heading level={3} className="mt-2">
            La tarjeta de cada parte
          </Heading>
          <Text size="sm" tone="secondary">
            Cinco formas de decir «estás en la parte 2 de 3, el Fade, ¿para quién?» y cómo salir. Mismos datos en todas.
          </Text>
        </header>
        {PROPOSALS.map((proposal) => (
          <section key={proposal.id} aria-labelledby={`proposal-${proposal.id}`} className="flex flex-col gap-3">
            <div className="flex flex-col">
              <Text id={`proposal-${proposal.id}`} size="sm" weight="semibold">
                {proposal.title}
              </Text>
              <Text size="xs" tone="muted">
                {proposal.lead}
              </Text>
            </div>
            {proposal.render()}
          </section>
        ))}
      </div>
    </div>
  );
}
