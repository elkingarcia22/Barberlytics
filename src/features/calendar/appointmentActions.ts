import { Armchair, Ban, CalendarPlus, CheckCheck, HandCoins, LogIn, MessageSquareText, Pencil, Phone, UserX, type LucideIcon } from "lucide-react";
import type { AppMessageKey } from "@/app/i18n/types";
import type { AppointmentActionId } from "./appointmentPlaybook";

/** El icono y el texto de cada acción de una cita, los mismos en botones y menús. */

export const ACTION_ICON: Record<AppointmentActionId, LucideIcon> = { call: Phone, message: MessageSquareText, checkIn: LogIn, seat: Armchair, pay: HandCoins, ready: CheckCheck, rebook: CalendarPlus, edit: Pencil, noShow: UserX, cancel: Ban };

export const ACTION_LABEL: Record<AppointmentActionId, AppMessageKey> = {
  call: "calendar.detail.call",
  message: "calendar.detail.message",
  checkIn: "calendar.step.checkIn",
  seat: "calendar.step.seat",
  pay: "calendar.step.pay",
  ready: "calendar.step.ready",
  rebook: "calendar.detail.rebook",
  edit: "action.edit",
  noShow: "calendar.step.noShow",
  cancel: "calendar.step.cancel",
};
