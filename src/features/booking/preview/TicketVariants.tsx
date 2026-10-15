import type { ReactNode } from "react";
import { Grain } from "@/components/atmosphere";
import { Text } from "@/components/typography";
import { cn } from "@/lib/utils";
import { ExitButton, PersonChips } from "./ProposalBits";
import { CURRENT, PARTS } from "./proposalData";

/*
 * Variaciones de la propuesta 2 («Talón»), solo en la vista previa: la misma estructura —el talón
 * con «Parte N de M», la perforación con sus muescas y el cuerpo con el servicio, lo que sigue,
 * «Juntar todo» y para quién— con otra piel: colores, filo, textura, tipografía.
 */

interface TicketSkin {
  /** La entrada entera: fondo, filo, sombra. */
  root: string;
  /** El talón (lo de la izquierda). */
  stub: string;
  /** «Parte» y «de 3». */
  label: string;
  /** El número grande. */
  number: string;
  /** La línea punteada entre talón y cuerpo. */
  perforation: string;
  /** «Juntar todo». */
  exit: string;
  /** Algo encima de todo (la textura del papel). */
  overlay?: ReactNode;
}

const STUB_WIDTH = "w-20";
/** Donde cae la perforación (el ancho del talón menos la mitad de la muesca). */
const NOTCH_AT = "left-[4.5rem]";

/** El talón de siempre, con la piel que le toque. */
function Ticket({ skin }: { skin: TicketSkin }) {
  return (
    <div className={cn("relative isolate flex overflow-hidden rounded-2xl", skin.root)}>
      {skin.overlay}
      <div className={cn("flex shrink-0 flex-col items-center justify-center gap-0.5 border-r-2 py-4", STUB_WIDTH, skin.stub, skin.perforation)}>
        <span className={cn("text-xs font-semibold uppercase tracking-wide", skin.label)}>Parte</span>
        <span className={cn("tabular-nums", skin.number)}>{CURRENT + 1}</span>
        <span className={cn("text-xs tabular-nums", skin.label)}>de {PARTS.length}</span>
      </div>
      <span className={cn("absolute -top-2 size-4 rounded-full bg-background", NOTCH_AT)} aria-hidden />
      <span className={cn("absolute -bottom-2 size-4 rounded-full bg-background", NOTCH_AT)} aria-hidden />
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
          <ExitButton className={cn("-mr-2 -mt-1", skin.exit)} />
        </div>
        <PersonChips size="sm" />
      </div>
    </div>
  );
}

const SKINS: readonly { id: string; title: string; lead: string; skin: TicketSkin }[] = [
  {
    id: "filled",
    title: "2a · Talón dorado",
    lead: "El talón relleno en el color de la marca; el cuerpo con el tinte suave.",
    skin: { root: "bg-primary/10", stub: "bg-primary", label: "text-primary-foreground/80", number: "text-3xl font-semibold text-primary-foreground", perforation: "border-dashed border-primary-foreground/40", exit: "text-primary" },
  },
  {
    id: "outline",
    title: "2b · Contorno",
    lead: "Solo el filo y la perforación en dorado, sin relleno: la más liviana.",
    skin: { root: "border-2 border-primary/60", stub: "", label: "text-primary", number: "text-3xl font-semibold text-primary", perforation: "border-dashed border-primary/60", exit: "text-primary" },
  },
  {
    id: "graphite",
    title: "2c · Grafito",
    lead: "Neutra y sobria: gris con el número como único acento.",
    skin: { root: "bg-surface-muted shadow-sm", stub: "bg-surface-subtle", label: "text-text-muted", number: "text-3xl font-semibold text-primary", perforation: "border-dashed border-border", exit: "text-text-secondary hover:text-text-primary" },
  },
  {
    id: "glow",
    title: "2d · Degradado",
    lead: "El dorado se funde hacia la derecha y el número brilla un poco.",
    skin: {
      root: "bg-gradient-to-r from-primary/35 via-primary/10 to-transparent ring-1 ring-inset ring-primary/25",
      stub: "",
      label: "text-primary",
      number: "text-4xl font-semibold text-primary [text-shadow:0_0_18px_hsl(var(--primary)/0.55)]",
      perforation: "border-dashed border-primary/40",
      exit: "text-primary",
    },
  },
  {
    id: "paper",
    title: "2e · Papel",
    lead: "Como un boleto impreso: textura, número en la letra de títulos y perforación de puntos.",
    skin: {
      root: "bg-surface shadow-md ring-1 ring-inset ring-border",
      stub: "bg-primary/5",
      label: "text-text-muted",
      number: "font-heading text-4xl text-text-primary",
      perforation: "border-dotted border-border-strong",
      exit: "text-primary",
      overlay: <Grain scope="container" className="-z-10" />,
    },
  },
];

/** Las variaciones del talón, debajo de la propuesta 2: misma estructura, otra piel. */
export function TicketVariants() {
  return (
    <div className="flex flex-col gap-6 border-l-2 border-primary/30 pl-4">
      <Text size="xs" weight="semibold" tone="primary" className="uppercase tracking-wide">
        Variaciones del talón · misma estructura, otra piel
      </Text>
      {SKINS.map(({ id, title, lead, skin }) => (
        <section key={id} aria-labelledby={`ticket-${id}`} className="flex flex-col gap-3">
          <div className="flex flex-col">
            <Text id={`ticket-${id}`} size="sm" weight="semibold">
              {title}
            </Text>
            <Text size="xs" tone="muted">
              {lead}
            </Text>
          </div>
          <Ticket skin={skin} />
        </section>
      ))}
    </div>
  );
}
