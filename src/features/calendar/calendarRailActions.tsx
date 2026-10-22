import { CalendarPlus, CalendarSearch, Clock, Link2, ListChecks, Footprints, MessageCircleQuestion, Palmtree, ShoppingBag, SquareDashed, UsersRound } from "lucide-react";
import type { RailActionSpec } from "@/components/action-rail";
import type { AppMessageKey } from "@/app/i18n/types";

/**
 * Lo que se puede hacer desde el calendario, declarado una vez con su peso.
 * Crear una cita es lo de cada rato y se lleva la principal; atender a quien
 * llega sin cita y cobrar se quedan a la vista; la venta suelta, los huecos
 * (y desde ellos la lista de espera), las ausencias y ajustar horarios se hacen de
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
  workHours: () => void;
  gaps: () => void;
  /** Ausencias y bloqueos del equipo, con lo que falta aprobar. */
  timeOff: () => void;
}

/** Un filtro rápido de la agenda: si está puesto y cómo cambiarlo. `blockedReason` cuando la vista no lo usa. */
export interface CalendarQuickFilter {
  active: boolean;
  toggle: () => void;
  blockedReason?: string | null;
}

/**
 * Los filtros que se pueden poner a la vista en la barra («Editar acciones»).
 * No salen hasta que alguien los elige; siguen también en «Filtros».
 */
export interface CalendarRailFilters {
  unconfirmed: CalendarQuickFilter;
  freeOnly: CalendarQuickFilter;
  linked: CalendarQuickFilter;
}

export function calendarRailActions(t: (key: AppMessageKey) => string, on: CalendarRailHandlers, filters?: CalendarRailFilters): readonly RailActionSpec[] {
  const quick = (id: string, label: string, icon: RailActionSpec["icon"], filter: CalendarQuickFilter): RailActionSpec => ({
    id,
    label,
    icon,
    scope: ["screen"],
    filter: true,
    active: filter.active,
    blockedReason: filter.blockedReason ?? null,
    onSelect: filter.toggle,
  });
  return [
    ...(filters
      ? [
          quick("filter-unconfirmed", t("calendar.filters.unconfirmed"), <MessageCircleQuestion className="size-5" strokeWidth={2} />, filters.unconfirmed),
          quick("filter-free", t("calendar.filters.freeOnly"), <SquareDashed className="size-5" strokeWidth={2} />, filters.freeOnly),
          quick("filter-linked", t("calendar.filters.linked"), <Link2 className="size-5" strokeWidth={2} />, filters.linked),
        ]
      : []),
    { id: "quick-sale", label: t("calendar.action.quickSale"), icon: <ShoppingBag className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: on.quickSale },
    { id: "walk-in-queue", label: t("frontDesk.queue.title"), icon: <UsersRound className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: on.walkInQueue },
    { id: "walk-in-sale", label: t("calendar.action.walkInSale"), icon: <Footprints className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: on.walkInSale },
    { id: "collections", label: t("calendar.action.collections"), icon: <ListChecks className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: on.collections },
    { id: "gaps", label: t("calendar.action.gaps"), icon: <CalendarSearch className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: on.gaps },
    { id: "time-off", label: t("calendar.action.timeOff"), icon: <Palmtree className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: on.timeOff },
    { id: "work-hours", label: t("calendar.action.workHours"), icon: <Clock className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: on.workHours },
    { id: "create", label: t("calendar.action.create"), icon: <CalendarPlus className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true, onSelect: on.create },
  ];
}
