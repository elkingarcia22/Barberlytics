import { Eye, Trash2, UserRound } from "lucide-react";
import type { RowAction } from "@/components/data-display";
import { ACTION_ICON, ACTION_LABEL } from "./appointmentActions";
import { appointmentPlaybook, type AppointmentActionId } from "./appointmentPlaybook";
import { findClient, type ModelContext } from "./calendarModel";
import { canRemoveBlock, FULL_CALENDAR_ACCESS } from "./calendarAccess";
import type { Appointment, TimeBlock } from "./types";

/**
 * El clic derecho de la agenda: lo que se puede hacer con una cita o un
 * bloqueo sin abrirlos. Sale del mismo guion que el panel de la cita
 * (`appointmentPlaybook`), así que el menú ofrece justo lo que toca en cada
 * momento —«Check-in» a una agendada, «Cobrar» a una en silla— y nunca algo
 * que el panel no permitiría. Lo irreversible (no vino, cancelar) va al final.
 */

export interface AppointmentContextHandlers {
  open: (appointment: Appointment) => void;
  run: (action: AppointmentActionId, appointment: Appointment) => void;
  openClient: (clientId: string) => void;
}

/** Lo que no tiene vuelta atrás: va separado, al final y en rojo. */
const DANGER: readonly AppointmentActionId[] = ["noShow", "cancel"];

const phoneDigits = (phone: string) => phone.replace(/[^\d+]/g, "");

export function appointmentContextActions(appointment: Appointment, ctx: ModelContext, handlers: AppointmentContextHandlers): RowAction[] {
  const client = findClient(ctx.catalog, appointment.clientId);
  const known = client && client.type !== "walkin" ? client : undefined;
  // Sin «Información del cliente» no se ofrece llamar ni escribir: el enlace revelaría el número.
  const phone = known?.phone && (ctx.access?.canContact ?? true) ? phoneDigits(known.phone) : "";
  const playbook = appointmentPlaybook(appointment, ctx.now, { hasPhone: phone !== "" });
  // «Editar» es abrir la cita: el menú ya empieza por ahí.
  const steps = [...new Set([...playbook.primary, ...playbook.secondary, ...playbook.more])].filter((action) => action !== "edit");

  const toAction = (action: AppointmentActionId): RowAction => {
    const Icon = ACTION_ICON[action];
    return {
      id: action,
      label: ctx.t(ACTION_LABEL[action]),
      icon: <Icon />,
      tone: DANGER.includes(action) ? "danger" : "default",
      onSelect: () => {
        if (action === "call") window.location.href = `tel:${phone}`;
        else if (action === "whatsapp") window.open(`https://wa.me/${phone.replace("+", "")}`, "_blank", "noopener");
        else handlers.run(action, appointment);
      },
    };
  };

  return [
    { id: "open", label: ctx.t("calendar.context.open"), icon: <Eye />, onSelect: () => handlers.open(appointment) },
    ...steps.filter((action) => !DANGER.includes(action)).map(toAction),
    ...(known ? [{ id: "client", label: ctx.t("calendar.context.client"), icon: <UserRound />, onSelect: () => handlers.openClient(known.id) }] : []),
    ...steps.filter((action) => DANGER.includes(action)).map(toAction),
  ];
}

/** Un bloqueo (almuerzo, reunión…) solo se puede quitar, y solo con permiso; se confirma antes. */
export function blockContextActions(block: TimeBlock, ctx: ModelContext, onRemove: (block: TimeBlock) => void): RowAction[] {
  if (!canRemoveBlock(ctx.access ?? FULL_CALENDAR_ACCESS, block)) return [];
  return [{ id: "removeBlock", label: ctx.t("calendar.block.remove"), icon: <Trash2 />, tone: "danger", onSelect: () => onRemove(block) }];
}
