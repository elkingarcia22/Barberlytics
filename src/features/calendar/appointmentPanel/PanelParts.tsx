import { Ellipsis, Pill, TriangleAlert } from "lucide-react";
import { addWeeks } from "date-fns";
import { useAppT } from "@/app/i18n";
import { cn } from "@/lib/utils";
import { Text } from "@/components/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgressRing } from "@/components/data-display/ProgressRing";
import { Chip } from "@/components/ai-interaction";
import { Tag } from "@/components/utility";
import { ThemaIcon } from "@/icons";
import { ACTION_ICON } from "../appointmentActions";
import { appointmentStart } from "../calendarModel";
import type { AppointmentActionId } from "../appointmentPlaybook";
import { LOYALTY_EVERY, type AppointmentModel } from "./useAppointmentModel";
import { clientTags } from "./panelLogic";
import { PANEL_VERSIONS, PANEL_VERSION_HINT, PANEL_VERSION_LABEL, isPanelVersion, usePanelVersion } from "./panelVersion";

/**
 * Las piezas que comparten las versiones del panel de una cita: el selector
 * de diseño, las etiquetas del cliente, las alertas, la membresía, las notas
 * y los botones de acción. Una alergia, un plantón o «Cobrar» se ven igual
 * en todas; lo que cambia entre versiones es el orden y el peso.
 */

/** El selector para comparar los diseños del panel, con una línea de qué propone cada uno. */
export function PanelVersionPicker({ className }: { className?: string }) {
  const t = useAppT();
  const [version, setVersion] = usePanelVersion();
  return (
    <div className={cn("flex flex-col gap-1", className)} data-testid="panel-version">
      <Select value={version} onValueChange={(value) => isPanelVersion(value) && setVersion(value)}>
        <SelectTrigger size="sm" className="w-full" aria-label={t("calendar.panel.version.label")}>
          <ThemaIcon name="layers" size="sm" decorative />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PANEL_VERSIONS.map((id) => (
            <SelectItem key={id} value={id}>
              {t(PANEL_VERSION_LABEL[id])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Text size="xs" tone="muted">
        {t(PANEL_VERSION_HINT[version])}
      </Text>
    </div>
  );
}

export function ClientTags({ model, operational, className }: { model: AppointmentModel; operational?: boolean; className?: string }) {
  const t = useAppT();
  const tags = clientTags(model, t, { operational });
  if (tags.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label={t("calendar.detail.alerts")} data-testid="panel-tags">
      {tags.map((tag) => (
        <li key={tag.id}>
          <Tag label={tag.label} tone={tag.tone} />
        </li>
      ))}
    </ul>
  );
}

/** Alergias y medicación: siempre con su texto, nunca solo un icono. `compact` las deja en una franja. */
export function CriticalAlerts({ model, compact = false }: { model: AppointmentModel; compact?: boolean }) {
  const t = useAppT();
  if (model.critical.length === 0) return null;
  return (
    <div className="space-y-2" aria-label={t("calendar.detail.alerts")} data-testid="appointment-alerts">
      {model.critical.map((note) => (
        <Alert key={note.id} variant="warning" className={compact ? "px-3 py-2" : undefined}>
          {note.kind === "allergy" ? <TriangleAlert /> : <Pill />}
          <AlertTitle>{t(note.kind === "allergy" ? "calendar.detail.allergy" : "calendar.detail.medication")}</AlertTitle>
          <AlertDescription>{note.text}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

/** La membresía con su anillo, como en el pago de la reserva en línea. */
export function LoyaltyStrip({ model }: { model: AppointmentModel }) {
  const t = useAppT();
  if (!model.known) return null;
  const reward = model.rewardName.toLowerCase();
  const left = LOYALTY_EVERY - model.loyaltyProgress;
  return (
    <section aria-label={t("calendar.panel.loyalty.title")} className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-3 py-2.5" data-testid="panel-loyalty">
      <ProgressRing size="sm" value={model.loyaltyProgress - (model.unpaid ? 1 : 0)} pending={model.unpaid ? 1 : 0} max={LOYALTY_EVERY} aria-label={t("calendar.panel.loyalty.count", { count: model.loyaltyProgress, total: LOYALTY_EVERY })}>
        <Text as="span" size="xs" weight="semibold" tabular>
          {model.loyaltyProgress}
        </Text>
      </ProgressRing>
      <span className="flex min-w-0 flex-1 flex-col">
        <Text as="span" size="xs" weight="semibold" tone="primary" className="uppercase tracking-wide">
          {t("calendar.panel.loyalty.title")}
        </Text>
        <Text as="span" size="sm" weight="medium" truncate>
          {t("calendar.panel.loyalty.count", { count: model.loyaltyProgress, total: LOYALTY_EVERY })}
        </Text>
        <Text as="span" size="xs" tone="muted" truncate>
          {left === 0 ? t("calendar.panel.loyalty.earns", { reward }) : t("calendar.panel.loyalty.left", { count: left, reward })}
        </Text>
      </span>
    </section>
  );
}

/** La nota de esta visita aparte de las del cliente (Resy, Cliniko): no es lo mismo «viene con su hijo» que «piel sensible». */
export function NotesSplit({ model }: { model: AppointmentModel }) {
  const t = useAppT();
  const visitNote = model.appointment.notes;
  if (!visitNote && model.notes.length === 0) return null;
  return (
    <div className="grid gap-2" data-testid="panel-notes">
      <div className="space-y-1 rounded-lg bg-surface-subtle px-3 py-2">
        <Text variant="caption">{t("calendar.panel.visitNote")}</Text>
        <Text size="sm">{visitNote ?? t("calendar.panel.noNotes")}</Text>
      </div>
      <div className="space-y-1 rounded-lg bg-surface-subtle px-3 py-2">
        <Text variant="caption">{t("calendar.panel.clientNotes")}</Text>
        {model.notes.length > 0 ? (
          model.notes.map((note) => (
            <Text key={note.id} size="sm">
              {note.text}
            </Text>
          ))
        ) : (
          <Text size="sm" tone="muted">
            {t("calendar.panel.noNotes")}
          </Text>
        )}
      </div>
    </div>
  );
}

/** Las fotos del corte que pidió al reservar en línea. */
export function ReferencePhotos({ model, large = false }: { model: AppointmentModel; large?: boolean }) {
  const t = useAppT();
  const photos = model.appointment.referencePhotos ?? [];
  if (photos.length === 0) return null;
  return (
    <div className={cn("grid gap-2", photos.length > 1 && "grid-cols-2")}>
      {photos.map((photo, index) => (
        <img key={index} src={photo} alt={t("calendar.detail.referencePhoto")} className={cn("w-full rounded-xl object-cover", photos.length > 1 ? "aspect-square" : large ? "max-h-80" : "max-h-56")} data-testid="appointment-reference-photo" />
      ))}
    </div>
  );
}

const ACTION_TEST_ID: Partial<Record<AppointmentActionId, string>> = { checkIn: "appointment-next-step", seat: "appointment-next-step", pay: "appointment-pay", rebook: "appointment-rebook" };

export interface ActionButtonProps {
  model: AppointmentModel;
  action: AppointmentActionId;
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
  /** Solo el icono, con el texto como etiqueta accesible. */
  iconOnly?: boolean;
  /** «Cobrar» sin el importe: donde el dinero no es asunto de quien mira (la silla). */
  hidePrice?: boolean;
}

/** Un botón de acción de la cita: un enlace si es llamar o escribir, si no un botón que corre la acción. */
export function ActionButton({ model, action, variant = "secondary", size = "default", className, iconOnly = false, hidePrice = false }: ActionButtonProps) {
  const t = useAppT();
  const Icon = ACTION_ICON[action];
  const label = hidePrice && action === "pay" ? t("calendar.step.pay") : model.label(action);
  const link = model.href(action);
  const body = iconOnly ? <Icon /> : (
    <>
      <Icon /> {label}
    </>
  );
  const buttonSize = iconOnly ? (size === "sm" ? "icon-sm" : "icon") : size;
  return link ? (
    <Button asChild variant={variant} size={buttonSize} className={className} aria-label={iconOnly ? label : undefined}>
      <a href={link} target={action === "whatsapp" ? "_blank" : undefined} rel="noreferrer">
        {body}
      </a>
    </Button>
  ) : (
    <Button variant={variant} size={buttonSize} className={className} onClick={() => model.run(action)} data-testid={ACTION_TEST_ID[action]} aria-label={iconOnly ? label : undefined}>
      {body}
    </Button>
  );
}

/** Lo que no tiene sitio a la vista: al menú de los tres puntos. Cancelar va en rojo. */
export function MoreActionsMenu({ model, actions, className }: { model: AppointmentModel; actions: readonly AppointmentActionId[]; className?: string }) {
  const t = useAppT();
  if (actions.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("calendar.panel.more")} className={className} data-testid="appointment-actions">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {actions.map((action) => {
          const Icon = ACTION_ICON[action];
          return (
            <DropdownMenuItem key={action} variant={action === "cancel" ? "destructive" : undefined} onSelect={() => model.run(action)}>
              <Icon className="size-4" /> {model.label(action)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


const REBOOK_WEEKS = [3, 4, 6] as const;

/** Agendar la próxima en un toque: por su ritmo o a 3, 4 o 6 semanas (el «4w / 6w / 8w» de Boulevard). */
export function RebookShortcuts({ model }: { model: AppointmentModel }) {
  const t = useAppT();
  const from = appointmentStart(model.appointment);
  return (
    <div className="flex flex-wrap gap-1.5" data-testid="panel-rebook">
      {model.nextVisit && <Chip size="sm" tone="primary" icon="calendarAdd" label={t("calendar.panel.rebook.rhythm")} onClick={() => model.nextVisit && model.rebookOn(model.nextVisit)} />}
      {REBOOK_WEEKS.map((weeks) => (
        <Chip key={weeks} size="sm" label={t("calendar.panel.rebook.weeks", { count: weeks })} onClick={() => model.rebookOn(addWeeks(from, weeks))} />
      ))}
    </div>
  );
}
