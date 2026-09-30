import { Ban, CalendarPlus, Clock, ListChecks, ListOrdered, Footprints, ShoppingBag } from "lucide-react";
import type { RailActionSpec } from "@/components/action-rail";
import type { AppMessageKey } from "@/app/i18n/types";

/**
 * Lo que se puede hacer desde el calendario, declarado una vez con su peso.
 * Crear una cita es lo de cada rato y se lleva la principal; vender y cobrar
 * se quedan a la vista; bloquear la agenda y ajustar horarios se hacen de
 * vez en cuando y se pliegan en «más acciones». La barra flotante decide
 * cómo pintarlas y, en pantalla estrecha, se vuelve un solo botón.
 */
export interface CalendarRailHandlers {
  create: () => void;
  quickSale: () => void;
  walkInSale: () => void;
  collections: () => void;
  waitlist: () => void;
  block: () => void;
  workHours: () => void;
}

export function calendarRailActions(t: (key: AppMessageKey) => string, on: CalendarRailHandlers): readonly RailActionSpec[] {
  return [
    { id: "quick-sale", label: t("calendar.action.quickSale"), icon: <ShoppingBag className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: on.quickSale },
    { id: "walk-in-sale", label: t("calendar.action.walkInSale"), icon: <Footprints className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: on.walkInSale },
    { id: "collections", label: t("calendar.action.collections"), icon: <ListChecks className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: on.collections },
    { id: "waitlist", label: t("calendar.action.waitlist"), icon: <ListOrdered className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: on.waitlist },
    { id: "block", label: t("calendar.action.block"), icon: <Ban className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: on.block },
    { id: "work-hours", label: t("calendar.action.workHours"), icon: <Clock className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: on.workHours },
    { id: "create", label: t("calendar.action.create"), icon: <CalendarPlus className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true, onSelect: on.create },
  ];
}
