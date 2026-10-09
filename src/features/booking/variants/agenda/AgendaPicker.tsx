import * as React from "react";
import { DrawerShell } from "@/components/overlays";
import { Text } from "@/components/typography";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon, type IconName } from "@/icons";
import { cn } from "@/lib/utils";
import { useBookingFlow } from "../../flow/BookingContext";
import { DRAWER_FIT_STYLE } from "../../flow/drawerFit";

/**
 * Las dos piezas de la Agenda con selector: un campo que se lee como un select
 * (foto, lo elegido y un detalle) y la ventana que abre la lista. La sede y los
 * servicios las comparten para verse y comportarse igual.
 */

interface PickerFieldProps {
  /** El id del rótulo de la sección: el campo se anuncia como «rótulo + valor». */
  labelledBy: string;
  imageUrl?: string | null;
  icon: IconName;
  /** Lo elegido; sin él se ve el `placeholder`. */
  value?: string;
  detail?: string;
  placeholder: string;
  open: boolean;
  onOpen: () => void;
  testId?: string;
}

export function PickerField({ labelledBy, imageUrl, icon, value, detail, placeholder, open, onOpen, testId }: PickerFieldProps) {
  const { touch } = useBookingFlow();
  const valueId = React.useId();
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-labelledby={`${labelledBy} ${valueId}`}
      onClick={onOpen}
      data-testid={testId}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl border border-input bg-background px-3 text-left shadow-xs outline-none transition-[border-color,box-shadow] duration-fast",
        "hover:border-primary/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        touch === "lg" ? "min-h-[4.5rem] py-3" : "min-h-16 py-2.5"
      )}
    >
      <IconTile size={touch === "lg" ? "lg" : "md"} src={imageUrl ?? undefined} icon={<ThemaIcon name={icon} />} tone={value ? "primary" : "neutral"} />
      <span id={valueId} className="flex min-w-0 flex-1 flex-col">
        {value ? (
          <>
            <Text as="span" weight="medium" className="truncate">
              {value}
            </Text>
            {detail && (
              <Text as="span" size="xs" tone="muted" tabular className="truncate">
                {detail}
              </Text>
            )}
          </>
        ) : (
          <Text as="span" tone="muted">
            {placeholder}
          </Text>
        )}
      </span>
      <ThemaIcon name="chevronDown" size="sm" tone="muted" className="shrink-0 transition-transform duration-fast group-aria-expanded:rotate-180" />
    </button>
  );
}

interface PickerOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** El pie fijo (resumen y botón); sin él, la ventana es solo la lista. */
  footer?: React.ReactNode;
  /** Dónde cae el foco al abrir: la lista, no un buscador (en táctil el teclado la taparía). */
  focusRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}

/**
 * Se abre donde se siente nativa en cada pantalla: en celular y en el widget
 * sube desde abajo, al alcance del pulgar; en tablet y monitor es un modal
 * centrado (una hoja a lo ancho de una tablet se ve estirada). En los dos casos
 * dentro de la reserva —el marco del dispositivo—, no de la ventana.
 */
export function PickerOverlay({ open, onOpenChange, title, description, footer, focusRef, children }: PickerOverlayProps) {
  const { layout, touch } = useBookingFlow();

  const focusList = (event: Event) => {
    event.preventDefault();
    const list = focusRef.current;
    const target = list?.querySelector<HTMLElement>('[aria-checked="true"]') ?? list?.querySelector<HTMLElement>("[role=checkbox],[role=radio]");
    target?.focus();
  };

  if (layout === "compact" && touch === "default") {
    return (
      <DrawerShell open={open} onOpenChange={onOpenChange} side="bottom" contentStyle={DRAWER_FIT_STYLE} title={title} description={description} actions={footer} onOpenAutoFocus={focusList} disablePadding>
        {children}
      </DrawerShell>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={focusList}
        aria-describedby={undefined}
        // Medido contra la reserva (el marco de la tablet o la pantalla), no contra la ventana.
        className={cn("flex max-h-[calc(100%-3rem)] flex-col gap-0 overflow-hidden p-0", touch === "lg" ? "sm:max-w-xl" : "sm:max-w-lg")}
      >
        <DialogHeader className="border-b bg-muted/30 p-4 pr-12">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">{children}</div>
        {footer && <DialogFooter className="m-0 rounded-b-xl bg-muted/30 p-4">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

interface PickerRowProps {
  role: "checkbox" | "radio";
  checked: boolean;
  label: string;
  imageUrl?: string | null;
  icon: IconName;
  onClick: () => void;
  children: React.ReactNode;
}

/** Una fila de la lista: foto, texto y la marca (casilla si se pueden varios, círculo si uno). */
export function PickerRow({ role, checked, label, imageUrl, icon, onClick, children }: PickerRowProps) {
  const { touch } = useBookingFlow();
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "group/row flex w-full items-center gap-3 rounded-xl px-2 text-left outline-none transition-colors duration-fast",
        "hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 active:bg-muted/80",
        checked && "bg-primary/5 hover:bg-primary/10",
        touch === "lg" ? "min-h-16 py-2.5" : "min-h-14 py-2"
      )}
    >
      <IconTile size={touch === "lg" ? "lg" : "md"} src={imageUrl ?? undefined} icon={<ThemaIcon name={icon} />} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">{children}</span>
      <span
        aria-hidden
        className={cn(
          "flex size-6 shrink-0 items-center justify-center border transition-colors duration-fast",
          role === "radio" ? "rounded-full" : "rounded-md",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background group-hover/row:border-primary/50"
        )}
      >
        {checked && <ThemaIcon name="check" size="xs" tone="inverse" />}
      </span>
    </button>
  );
}
