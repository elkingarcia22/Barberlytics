import { Ban, CalendarPlus, CalendarSearch, Clock, ListChecks, ListOrdered, Footprints, Palmtree, ShoppingBag, UsersRound } from "lucide-react";
import { ClipperIcon } from "@/components/ai-interaction";
import type { RailActionSpec } from "@/components/action-rail";
import type { AppMessageKey } from "@/app/i18n/types";

/**
 * Lo que se puede hacer desde el calendario, declarado una vez con su peso.
 * Crear una cita es lo de cada rato y se lleva la principal; atender a quien
 * llega sin cita y cobrar se quedan a la vista; la venta suelta, la lista de
 * espera, bloquear la agenda y ajustar horarios se hacen de
 * vez en cuando y se pliegan en «más acciones». La barra flotante decide
 * cómo pintarlas y, en pantalla estrecha, se vuelve un solo botón.
 */
export interface CalendarRailHandlers {
  create: () => void;
  quickSale: () => void;
  walkInSale: () => void;
  /** La fila de quien llega sin cita (kiosco y recepción), con la espera de cada uno. */
  walkInQueue: () => void;
  collections: () => void;
  waitlist: () => void;
  block: () => void;
  workHours: () => void;
  assistant: () => void;
  gaps: () => void;
  /** Ausencias y bloqueos del equipo, con lo que falta aprobar. */
  timeOff: () => void;
}

export function calendarRailActions(t: (key: AppMessageKey) => string, on: CalendarRailHandlers): readonly RailActionSpec[] {
  return [
    { id: "quick-sale", label: t("calendar.action.quickSale"), icon: <ShoppingBag className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: on.quickSale },
    { id: "walk-in-queue", label: t("frontDesk.queue.title"), icon: <UsersRound className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: on.walkInQueue },
    { id: "walk-in-sale", label: t("calendar.action.walkInSale"), icon: <Footprints className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: on.walkInSale },
    { id: "collections", label: t("calendar.action.collections"), icon: <ListChecks className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: on.collections },
    { id: "gaps", label: t("calendar.action.gaps"), icon: <CalendarSearch className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: on.gaps },
    { id: "time-off", label: t("calendar.action.timeOff"), icon: <Palmtree className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: on.timeOff },
    { id: "waitlist", label: t("calendar.action.waitlist"), icon: <ListOrdered className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: on.waitlist },
    { id: "block", label: t("calendar.action.block"), icon: <Ban className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: on.block },
    { id: "work-hours", label: t("calendar.action.workHours"), icon: <Clock className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: on.workHours },
    { id: "assistant", label: t("calendar.action.assistant"), icon: <ClipperIcon className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: on.assistant },
    { id: "create", label: t("calendar.action.create"), icon: <CalendarPlus className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true, onSelect: on.create },
  ];
}
