import * as React from "react";
import { Text } from "@/components/typography";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { ExitButton, PersonChips } from "./ProposalBits";
import { CURRENT, PARTS } from "./proposalData";

/*
 * Variaciones de la propuesta 2 («Talón»), solo en la vista previa. Comparten la idea —una entrada
 * con su perforación— y cambian dónde va el talón y qué lleva.
 */

const current = PARTS[CURRENT];
const next = PARTS.slice(CURRENT + 1).map((part) => part.service).join(", ");

/** Las dos muescas de la perforación, del color del fondo de la página. */
function Notches({ axis, at }: { axis: "vertical" | "horizontal"; /** Dónde corta la perforación, en clases de Tailwind. */ at: string }) {
  const dot = "absolute size-4 rounded-full bg-background";
  return axis === "vertical" ? (
    <>
      <span className={cn(dot, "-top-2", at)} aria-hidden />
      <span className={cn(dot, "-bottom-2", at)} aria-hidden />
    </>
  ) : (
    <>
      <span className={cn(dot, "-left-2", at)} aria-hidden />
      <span className={cn(dot, "-right-2", at)} aria-hidden />
    </>
  );
}

/** 2a · Talón arriba: la perforación es horizontal y el talón, una franja con la parte y la salida. */
function TopStub() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary/10">
      <div className="flex items-center gap-2 border-b-2 border-dashed border-primary/40 py-2 pl-4 pr-2">
        <Text size="xs" weight="semibold" tone="primary" className="flex-1 uppercase tracking-wide">
          Parte {CURRENT + 1} de {PARTS.length}
        </Text>
        <ExitButton className="text-primary" />
      </div>
      <Notches axis="horizontal" at="top-[2.375rem]" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-col">
          <Text size="lg" weight="semibold">
            {current.service}
          </Text>
          <Text size="xs" tone="muted">
            Luego: {next}
          </Text>
        </div>
        <PersonChips size="sm" />
      </div>
    </div>
  );
}

/** 2b · Talón con los pasos: en vez de un número, los tres servicios apilados en el talón. */
function StepsStub() {
  return (
    <div className="relative flex overflow-hidden rounded-2xl bg-primary/10">
      <ol className="flex w-16 shrink-0 flex-col items-center justify-center gap-2 border-r-2 border-dashed border-primary/40 py-4">
        {PARTS.map((part, index) => (
          <li
            key={part.service}
            aria-current={part.state === "current" ? "step" : undefined}
            className={cn(
              "flex items-center justify-center rounded-full font-semibold tabular-nums",
              part.state === "current" ? "size-9 bg-primary text-base text-primary-foreground shadow-sm" : "size-6 text-xs",
              part.state === "done" && "bg-primary/20 text-primary",
              part.state === "pending" && "border border-border text-text-muted"
            )}
          >
            {part.state === "done" ? <ThemaIcon name="check" size="xs" /> : index + 1}
          </li>
        ))}
      </ol>
      <Notches axis="vertical" at="left-[3.5rem]" />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <Text size="lg" weight="semibold" truncate>
              {current.service}
            </Text>
            <Text size="xs" tone="muted" truncate>
              Parte {CURRENT + 1} de {PARTS.length} · luego {next}
            </Text>
          </div>
          <ExitButton className="-mr-2 -mt-1 text-primary" />
        </div>
        <PersonChips size="sm" />
      </div>
    </div>
  );
}

/** 2c · Talón relleno: el talón en el color de la marca, el cuerpo neutro con su filo. */
function FilledStub() {
  return (
    <div className="relative flex overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 bg-primary py-4 text-primary-foreground">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-80">Parte</span>
        <span className="text-3xl font-semibold tabular-nums">{CURRENT + 1}</span>
        <span className="text-xs tabular-nums opacity-80">de {PARTS.length}</span>
      </div>
      <Notches axis="vertical" at="left-[4.5rem]" />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <Text size="lg" weight="semibold" truncate>
              {current.service}
            </Text>
            <Text size="xs" tone="muted" truncate>
              Luego: {next}
            </Text>
          </div>
          <ExitButton className="-mr-2 -mt-1 text-primary" />
        </div>
        <PersonChips size="sm" />
      </div>
    </div>
  );
}

/** 2d · Talón con la persona: el talón dice para quién (su inicial) y la parte; tocarlo la cambia. */
function PersonStub() {
  const [isOther, setIsOther] = React.useState(false);
  const who = isOther ? "Santiago" : "Marcela";
  return (
    <div className="relative flex overflow-hidden rounded-2xl bg-primary/10">
      <button
        type="button"
        onClick={() => setIsOther((value) => !value)}
        className="flex w-20 shrink-0 flex-col items-center justify-center gap-1.5 border-r-2 border-dashed border-primary/40 py-4 transition-colors duration-fast ease-out-expo hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none"
        aria-label={`Para ${who}. Cambiar de persona`}
      >
        <Avatar size="lg" className="ring-2 ring-primary">
          <AvatarFallback>{who.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <Text size="xs" weight="semibold" tone="primary" tabular>
          {CURRENT + 1}/{PARTS.length}
        </Text>
      </button>
      <Notches axis="vertical" at="left-[4.5rem]" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Text size="xs" tone="secondary">
            Para {isOther ? "Santiago · Hijo" : "ti"}
          </Text>
          <ExitButton className="-mr-2 -mt-1.5 text-primary" />
        </div>
        <Text size="lg" weight="semibold" truncate>
          {current.service}
        </Text>
        <Text size="xs" tone="muted" truncate>
          Toca el talón para cambiar de persona · luego {next}
        </Text>
      </div>
    </div>
  );
}

/** 2e · Boleto completo: talón con el número, el cuerpo y, al otro lado, la tira que se arranca para salir. */
function FullTicket() {
  return (
    <div className="relative flex overflow-hidden rounded-2xl bg-primary/10">
      <div className="flex w-16 shrink-0 flex-col items-center justify-center border-r-2 border-dashed border-primary/40 py-4">
        <span className="text-3xl font-semibold tabular-nums text-primary">{CURRENT + 1}</span>
        <Text size="xs" tone="muted" tabular>
          de {PARTS.length}
        </Text>
      </div>
      <Notches axis="vertical" at="left-[3.5rem]" />
      <div className="flex min-w-0 flex-1 flex-col gap-3 py-4 pl-4 pr-3">
        <div className="flex min-w-0 flex-col">
          <Text size="lg" weight="semibold" truncate>
            {current.service}
          </Text>
          <Text size="xs" tone="muted" truncate>
            Luego: {next}
          </Text>
        </div>
        <PersonChips size="sm" />
      </div>
      <Notches axis="vertical" at="right-[1.75rem]" />
      {/* La tira de salida: arrancarla junta todo de nuevo. */}
      <Button
        type="button"
        variant="ghost"
        className="h-auto w-10 shrink-0 rounded-none border-l-2 border-dashed border-primary/40 px-0 text-primary hover:bg-primary/15 hover:text-primary"
        aria-label="Juntar todo"
      >
        <span className="flex rotate-180 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide [writing-mode:vertical-rl]">
          <ThemaIcon name="close" size="xs" />
          Juntar todo
        </span>
      </Button>
    </div>
  );
}

const VARIANTS: readonly { id: string; title: string; lead: string; Render: () => React.ReactNode }[] = [
  { id: "top", title: "2a · Talón arriba", lead: "La perforación en horizontal: la parte y la salida en el talón, todo el ancho para el servicio.", Render: TopStub },
  { id: "steps", title: "2b · Talón con los pasos", lead: "El talón muestra los tres servicios; el de ahora, grande.", Render: StepsStub },
  { id: "filled", title: "2c · Talón relleno", lead: "El talón en el color de la marca; el cuerpo neutro, con su filo.", Render: FilledStub },
  { id: "person", title: "2d · Talón con la persona", lead: "Para quién es va en el talón: tocarlo cambia de persona.", Render: PersonStub },
  { id: "full", title: "2e · Boleto completo", lead: "Con la tira para arrancar al otro lado: arrancarla es «Juntar todo».", Render: FullTicket },
];

/** Las variaciones del talón, debajo de la propuesta 2, con su nombre y en qué cambian. */
export function TicketVariants() {
  return (
    <div className="flex flex-col gap-6 border-l-2 border-primary/30 pl-4">
      <Text size="xs" weight="semibold" tone="primary" className="uppercase tracking-wide">
        Variaciones del talón
      </Text>
      {VARIANTS.map(({ id, title, lead, Render }) => (
        <section key={id} aria-labelledby={`ticket-${id}`} className="flex flex-col gap-3">
          <div className="flex flex-col">
            <Text id={`ticket-${id}`} size="sm" weight="semibold">
              {title}
            </Text>
            <Text size="xs" tone="muted">
              {lead}
            </Text>
          </div>
          <Render />
        </section>
      ))}
    </div>
  );
}
