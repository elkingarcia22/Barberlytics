import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Heading, Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { ActionTile } from "@/components/utility";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon, type IconName } from "@/icons";
import { cn } from "@/lib/utils";

/**
 * Las piezas del panel de la cita con la cara de la reserva en línea
 * (`features/booking/variants/agenda/AgendaPicker.tsx`): el campo que se lee
 * como un select con foto, lo elegido y un detalle; la lista que se abre en
 * su sitio; la pregunta con su campo debajo; y la subpágina que entra desde el
 * lado con «Volver», para navegar dentro del panel sin perder la agenda.
 */

const FIELD_BASE =
  "group w-full rounded-xl border border-input bg-surface text-left shadow-xs outline-none transition-[border-color,box-shadow,background-color] duration-fast hover:border-primary/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
/** Solo la que está abierta lleva el filo y el tinte de marca: en reposo, todas neutras. */
const FIELD_OPEN = "aria-expanded:border-primary/60 aria-expanded:bg-[linear-gradient(hsl(var(--primary)/0.06),hsl(var(--primary)/0.06))]";

export interface PanelFieldProps {
  /** El nombre del campo, encima de lo elegido: «Servicios». */
  eyebrow: string;
  value: string;
  detail?: string;
  imageUrl?: string | null;
  icon?: IconName;
  leading?: React.ReactNode;
  /** Foto redonda: es una persona. */
  round?: boolean;
  open?: boolean;
  onOpen?: () => void;
  /** Ya no se puede cambiar (la cita ya ingresó): sin flecha, con candado y su porqué. */
  locked?: boolean;
  lockedHint?: string;
  testId?: string;
}

/** El campo de la reserva: foto, nombre del campo, lo elegido y un detalle; abre su lista. */
export function PanelField({ eyebrow, value, detail, imageUrl, icon = "scissors", leading, round = false, open = false, onOpen, locked = false, lockedHint, testId }: PanelFieldProps) {
  const body = (
    <>
      {leading ?? <IconTile size="md" shape={round ? "circle" : "rounded"} src={imageUrl ?? undefined} icon={<ThemaIcon name={icon} />} tone="primary" />}
      <span className="flex min-w-0 flex-1 flex-col">
        <Text as="span" size="xs" tone="muted" truncate>
          {eyebrow}
        </Text>
        <Text as="span" weight="medium" truncate>
          {value}
        </Text>
        {(locked ? lockedHint : detail) && (
          <Text as="span" size="xs" tone="muted" tabular truncate>
            {locked ? lockedHint : detail}
          </Text>
        )}
      </span>
    </>
  );
  if (locked || !onOpen) {
    return (
      <div className="flex min-h-16 w-full items-center gap-3 rounded-xl border border-input bg-surface px-3 py-2.5" data-testid={testId} data-locked={locked || undefined}>
        {body}
        {locked && <ThemaIcon name="lock" size="sm" tone="muted" className="shrink-0" />}
      </div>
    );
  }
  return (
    <button type="button" aria-expanded={open} onClick={onOpen} data-testid={testId} className={cn(FIELD_BASE, FIELD_OPEN, "flex min-h-16 items-center gap-3 px-3 py-2.5")}>
      {body}
      <ThemaIcon name="chevronDown" size="sm" tone="muted" className="shrink-0 transition-transform duration-fast group-aria-expanded:rotate-180" />
    </button>
  );
}

/** La lista abierta en su sitio, bajo su campo: cabecera con cierre, la lista y un pie con la acción. */
export function InlineList({ title, description, onClose, footer, children }: { title: string; description?: string; onClose: () => void; footer?: React.ReactNode; children: React.ReactNode }) {
  const t = useAppT();
  const ref = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);
  return (
    <section ref={ref} aria-label={title} className="flex scroll-mt-4 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200">
      <header className="flex items-start gap-3 border-b border-border bg-muted/30 px-4 py-3">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Heading level={4}>{title}</Heading>
          {description && (
            <Text as="span" size="xs" tone="muted">
              {description}
            </Text>
          )}
        </span>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label={t("common.close")} className="-mr-1 shrink-0">
          <ThemaIcon name="close" />
        </Button>
      </header>
      <div className="max-h-[26rem] overflow-y-auto overscroll-contain p-3">{children}</div>
      {footer && <footer className="flex items-center gap-3 border-t border-border bg-muted/30 px-4 py-3">{footer}</footer>}
    </section>
  );
}

/** Una pregunta con lo suyo debajo, con el mismo título para todas («¿Qué se va a hacer?»). */
export function PanelQuestion({ title, aside, children, className }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  const id = React.useId();
  return (
    <section aria-labelledby={id} className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex min-h-8 items-center justify-between gap-3">
        <Text id={id} size="sm" weight="medium" truncate>
          {title}
        </Text>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Una fila que lleva a otra página del panel: icono, qué es, un resumen y la flecha. */
export function NavRow({ icon, leading, title, description, onClick, testId }: { icon?: IconName; leading?: React.ReactNode; title: string; description?: React.ReactNode; onClick: () => void; testId?: string }) {
  return <ActionTile layout="row" chevron leading={leading ?? <IconTile size="md" shape="circle" tone="neutral" icon={<ThemaIcon name={icon ?? "info"} />} />} title={title} description={description} onClick={onClick} data-testid={testId} />;
}

/** Una página dentro del panel: entra desde el lado, con «Volver» y su título con la letra de la reserva. */
export function PanelSubpage({ title, onBack, aside, children }: { title: string; onBack: () => void; aside?: React.ReactNode; children: React.ReactNode }) {
  const t = useAppT();
  const backRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    backRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="flex flex-col gap-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-4 motion-safe:duration-200" data-testid="panel-subpage">
      <div className="flex items-center gap-2">
        <Button ref={backRef} type="button" variant="ghost" size="icon-sm" onClick={onBack} aria-label={t("common.back")} className="-ml-2 shrink-0">
          <ThemaIcon name="arrowLeft" />
        </Button>
        <Heading level={3} className="min-w-0 flex-1 truncate">
          {title}
        </Heading>
        {aside}
      </div>
      {children}
    </div>
  );
}
