import * as React from "react";
import { Check, Ellipsis, Pencil, Pill, TriangleAlert, UserRound } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { cn } from "@/lib/utils";
import { Stepper } from "@/components/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Text } from "@/components/typography";
import { formatClock, ScheduleColorDot } from "@/components/scheduling";
import { ClientTypeBadge, DetailRow, PersonAvatar } from "../calendarShared";
import { appointmentEnd, appointmentRange, durationLabel, findBarber, findClient, isUnpaid, lateMinutes, serviceColor, servicesOf, servicesPrice, type ModelContext } from "../calendarModel";
import { appointmentPlaybook, type AppointmentActionId } from "../appointmentPlaybook";
import type { CreateAppointmentInitial } from "../CreateAppointmentDrawer";
import { AppointmentEditForm } from "./AppointmentEditForm";
import { ACTION_ICON, ACTION_LABEL } from "../appointmentActions";
import { StageHeadline } from "./AppointmentPanelParts";
import { AppointmentVisitSection } from "./AppointmentVisitSection";
import { PAYMENT_METHOD_KEYS, STATUS_KEYS, type Appointment, type AppointmentPatch, type AppointmentStatus } from "../types";

/**
 * Resumen: en qué va la cita y su avance, lo que no se puede pasar por alto
 * (alergias), la cita en filas —lo mismo que dice su tarjeta— y, debajo de
 * todo eso, lo que toca hacer ahora. Las sugerencias de la IA van en la
 * pestaña de Clipper.
 */

export interface AppointmentSummaryTabProps {
  appointment: Appointment;
  ctx: ModelContext;
  onStatus: (appointment: Appointment, status: AppointmentStatus) => void;
  onBarberReady: (appointment: Appointment) => void;
  onPay: (appointment: Appointment) => void;
  onPatch: (appointment: Appointment, patch: AppointmentPatch) => void;
  onRebook: (initial: CreateAppointmentInitial) => void;
  onCancel: (appointment: Appointment) => void;
  onNoShow: (appointment: Appointment) => void;
  onOpenClient: (clientId: string) => void;
  /** Las citas de su visita (servicios añadidos), en orden; vacío o sin él si va suelta. */
  visit?: readonly Appointment[];
  /** Mirar otra cita de la misma visita. */
  onSelectAppointment?: (appointment: Appointment) => void;
  /** Separar la visita en citas independientes. */
  onSeparateVisit?: (visit: readonly Appointment[]) => void;
}

const TRACK: readonly AppointmentStatus[] = ["scheduled", "arrived", "seated", "paid"];
const CONTACT_ACTIONS: readonly AppointmentActionId[] = ["call", "whatsapp"];
const ACTION_TEST_ID: Partial<Record<AppointmentActionId, string>> = { checkIn: "appointment-next-step", seat: "appointment-next-step", pay: "appointment-pay", rebook: "appointment-rebook" };
/** Solo los dígitos de un teléfono, para los enlaces de llamada y WhatsApp. */
const digits = (phone: string) => phone.replace(/[^\d+]/g, "");

export function AppointmentSummaryTab({ appointment, ctx, onStatus, onBarberReady, onPay, onPatch, onRebook, onCancel, onNoShow, onOpenClient, visit = [], onSelectAppointment, onSeparateVisit }: AppointmentSummaryTabProps) {
  const t = useAppT();
  // Lo de todos los días es ver la cita; cambiarla es la excepción y se pide.
  const [editing, setEditing] = React.useState(false);

  const client = findClient(ctx.catalog, appointment.clientId);
  const known = client && client.type !== "walkin" ? client : undefined;
  const barber = findBarber(ctx.catalog, appointment.barberId);
  const firstName = (client?.name ?? t("calendar.clientType.walkin")).split(" ")[0];
  const unpaid = isUnpaid(appointment);
  const services = servicesOf(ctx.catalog, appointment);
  const serviceDot = services[0] ? serviceColor(ctx.catalog, services[0].id) : undefined;
  const price = appointment.payment?.total ?? servicesPrice(services);
  const critical = client?.notes.filter((note) => note.kind !== "note") ?? [];
  // Sin «Información del cliente» ni se enseña el teléfono ni se ofrece llamar o escribir.
  const canContact = ctx.access?.canContact ?? true;
  const phone = known?.phone && canContact ? digits(known.phone) : "";
  const playbook = appointmentPlaybook(appointment, ctx.now, { hasPhone: phone !== "" });
  const trackIndex = TRACK.indexOf(appointment.status);

  // Lo secundario que no tiene sitio propio: editar va en la cabecera de «La cita» y el contacto, en la fila del cliente.
  const secondary = playbook.secondary.filter((action) => action !== "edit" && !(known && CONTACT_ACTIONS.includes(action)));
  const contactInline = phone !== "" ? CONTACT_ACTIONS.filter((action) => !playbook.primary.includes(action)) : [];

  const headline = (): string => {
    switch (playbook.stage) {
      case "late":
        return t("calendar.stage.late", { time: durationLabel(lateMinutes(appointment, ctx.now) ?? 0) });
      case "upcoming":
        return t("calendar.next.notArrived", { name: firstName });
      case "waiting":
        return t("calendar.next.arrived", { name: firstName });
      case "seated":
        return t("calendar.stage.seated", { time: formatClock(appointmentEnd(appointment), ctx.intl) });
      case "toCollect":
        return t("calendar.stage.toCollect");
      case "paid":
        return t("calendar.stage.paid", { method: appointment.payment ? t(PAYMENT_METHOD_KEYS[appointment.payment.method]) : "—" });
      case "noShow":
        return t("calendar.next.noShow");
      case "cancelled":
        return t("calendar.next.cancelled");
    }
  };

  const run = (action: AppointmentActionId) => {
    if (action === "checkIn") onStatus(appointment, "arrived");
    if (action === "seat") onStatus(appointment, "seated");
    if (action === "pay") onPay(appointment);
    if (action === "ready") onBarberReady(appointment);
    if (action === "rebook") onRebook({ clientId: appointment.clientId, serviceId: appointment.serviceIds[0], barberId: appointment.barberId });
    if (action === "noShow") onNoShow(appointment);
    if (action === "cancel") onCancel(appointment);
  };

  const href = (action: AppointmentActionId) => (action === "call" ? `tel:${phone}` : action === "whatsapp" ? `https://wa.me/${phone.replace("+", "")}` : null);

  const actionButton = (action: AppointmentActionId, variant: "default" | "secondary" | "ghost", grow = false) => {
    const Icon = ACTION_ICON[action];
    const label = action === "pay" && variant === "default" ? t("calendar.detail.payAmount", { price: ctx.formatMoney(price) }) : t(ACTION_LABEL[action]);
    const link = href(action);
    const className = cn(grow && "flex-1");
    return link ? (
      <Button key={action} asChild variant={variant} size={grow ? "default" : "sm"} className={className}>
        <a href={link} target={action === "whatsapp" ? "_blank" : undefined} rel="noreferrer">
          <Icon /> {label}
        </a>
      </Button>
    ) : (
      <Button key={action} variant={variant} size={grow ? "default" : "sm"} className={className} onClick={() => run(action)} data-testid={ACTION_TEST_ID[action]}>
        <Icon /> {label}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Ahora: en qué va la cita y por dónde va del recorrido. */}
      <section aria-label={t("calendar.section.nextStep")} className="space-y-4" data-stage={playbook.stage}>
        <StageHeadline stage={playbook.stage}>{headline()}</StageHeadline>
        {trackIndex >= 0 && (
          <Stepper
            size="sm"
            aria-label={t("calendar.detail.track")}
            // Cobrada es el final: todos los pasos quedan hechos, no «en curso».
            current={appointment.status === "paid" ? TRACK.length : trackIndex}
            steps={TRACK.map((status) => ({ id: status, label: t(status === "scheduled" ? "calendar.detail.trackScheduled" : STATUS_KEYS[status]) }))}
          />
        )}
      </section>

      {critical.length > 0 && (
        <div className="space-y-2" aria-label={t("calendar.detail.alerts")} data-testid="appointment-alerts">
          {critical.map((note) => (
            <Alert key={note.id} variant="warning">
              {note.kind === "allergy" ? <TriangleAlert /> : <Pill />}
              <AlertTitle>{t(note.kind === "allergy" ? "calendar.detail.allergy" : "calendar.detail.medication")}</AlertTitle>
              <AlertDescription>{note.text}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Una visita con servicios añadidos: todas sus citas, cuál se mira y el total. */}
      {visit.length > 1 && onSelectAppointment && (
        <AppointmentVisitSection visit={visit} current={appointment} ctx={ctx} onSelect={onSelectAppointment} onSeparate={onSeparateVisit} />
      )}

      {/* La cita: las mismas cosas que dice su tarjeta, en filas. */}
      <section aria-label={t("calendar.detail.edit.title")}>
        <div className="mb-1 flex items-center justify-between gap-2">
          <Text variant="label" weight="semibold">
            {t("calendar.detail.edit.title")}
          </Text>
          {unpaid && (
            <Button variant="ghost" size="xs" onClick={() => setEditing((value) => !value)} data-testid="appointment-edit-toggle">
              {editing ? <Check /> : <Pencil />} {editing ? t("calendar.detail.edit.done") : t("action.edit")}
            </Button>
          )}
        </div>
        {unpaid && editing ? (
          <AppointmentEditForm appointment={appointment} ctx={ctx} onPatch={onPatch} />
        ) : (
          <div>
            <DetailRow plain label={t("calendar.field.service")}>
              <span className="inline-flex min-w-0 items-center gap-2">
                {serviceDot !== undefined && <ScheduleColorDot color={serviceDot} className="size-2.5" />}
                <span className="truncate">{services.map((service) => service.name).join(" + ") || "—"}</span>
              </span>
            </DetailRow>
            <DetailRow plain label={t("calendar.field.barber")}>
              <span className="inline-flex items-center gap-2">
                {barber && <PersonAvatar name={barber.name} avatarUrl={barber.avatarUrl} size="sm" />}
                {barber?.name ?? "—"}
              </span>
            </DetailRow>
            <DetailRow plain label={t("calendar.detail.edit.time")}>
              {appointmentRange(appointment, ctx.intl)} · {durationLabel(appointment.durationMin)}
            </DetailRow>
            {known && (
              <DetailRow plain label={t("calendar.field.client")}>
                <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
                  <ClientTypeBadge type={known.type} />
                  {appointment.walkIn && <Badge variant="neutral">{t("calendar.card.walkIn")}</Badge>}
                  {known.phone && canContact && <span className="whitespace-nowrap text-text-secondary">{known.phone}</span>}
                  {contactInline.map((action) => {
                    const Icon = ACTION_ICON[action];
                    return (
                      <Button key={action} asChild variant="ghost" size="icon-xs" aria-label={t(ACTION_LABEL[action])}>
                        <a href={href(action) ?? undefined} target={action === "whatsapp" ? "_blank" : undefined} rel="noreferrer">
                          <Icon />
                        </a>
                      </Button>
                    );
                  })}
                  <Button variant="ghost" size="icon-xs" aria-label={t("calendar.client.openProfile")} onClick={() => onOpenClient(known.id)}>
                    <UserRound />
                  </Button>
                </span>
              </DetailRow>
            )}
            <DetailRow plain label={appointment.payment ? t("calendar.detail.paid") : t("calendar.field.price")} strong>
              <span data-testid="appointment-price">{ctx.formatMoney(price)}</span>
            </DetailRow>
          </div>
        )}
      </section>

      {appointment.notes && (
        <div className="rounded-lg bg-surface-subtle px-3 py-2">
          <Text variant="caption">{t("calendar.create.notes")}</Text>
          <Text>{appointment.notes}</Text>
        </div>
      )}

      {/* Lo que toca hacer, debajo de lo que hay que saber para hacerlo. */}
      <section aria-label={t("calendar.detail.actions")} className="space-y-2">
        <div className="flex flex-wrap gap-2" data-testid="appointment-primary">
          {playbook.primary.map((action, index) => actionButton(action, index === playbook.primary.length - 1 ? "default" : "secondary", true))}
        </div>
        {(secondary.length > 0 || playbook.more.length > 0) && (
          <div className="-mx-1 flex flex-wrap items-center gap-1">
            {secondary.map((action) => actionButton(action, "ghost"))}
            {playbook.more.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={t("calendar.detail.actions")} className="ml-auto" data-testid="appointment-actions">
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {playbook.more.map((action) => {
                    const Icon = ACTION_ICON[action];
                    return (
                      <DropdownMenuItem key={action} variant={action === "cancel" ? "destructive" : undefined} onSelect={() => run(action)}>
                        <Icon className="size-4" /> {t(ACTION_LABEL[action])}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
