import type { CustomerSource } from "./loyalty";
import type { AppMessageKey } from "@/app/i18n/types";
import type * as React from "react";
import { Ban, Crown, Flame, Hourglass, Repeat, Sparkles, Undo2, UserX, type LucideIcon } from "lucide-react";
import type { Badge } from "@/components/ui/badge";
import type { StatusBadge } from "@/components/data-display/StatusBadge";
import { BRANCHES } from "@/features/branches";
import { toCsv } from "@/features/payroll/payrollUtils";
import type { CustomerAppointmentStatus, CustomerSegment } from "./types";

/** Las ayudas sin JSX del módulo de clientes: estilos por segmento, fechas y teléfono. */

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

/** Un color por momento de la relación: del más valioso al que ya no está. */
export const SEGMENT_STYLE: Readonly<Record<CustomerSegment, { icon: LucideIcon; badge: BadgeVariant }>> = {
  new: { icon: Sparkles, badge: "neutral" },
  retained: { icon: Repeat, badge: "info" },
  frequent: { icon: Flame, badge: "positive" },
  vip: { icon: Crown, badge: "default" },
  atRisk: { icon: Hourglass, badge: "warning" },
  lost: { icon: UserX, badge: "negative" },
  recovered: { icon: Undo2, badge: "positive" },
  blocked: { icon: Ban, badge: "destructive" },
};

type BadgeStatus = React.ComponentProps<typeof StatusBadge>["status"];

export const APPOINTMENT_STATUS_BADGE: Readonly<Record<CustomerAppointmentStatus, BadgeStatus>> = { scheduled: "pending", completed: "completed", cancelled: "inactive", no_show: "error" };

export const branchName = (id: string): string => BRANCHES.find((branch) => branch.id === id)?.name ?? id;

const DAY_MS = 86_400_000;

export const daysSince = (iso: string, now = new Date()): number => Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS);

/**
 * El celular se enseña a medias —prefijo y los cuatro últimos— como en
 * producción: alcanza para reconocer a quién se llama sin dejar el número
 * entero a la vista de quien pase por detrás de la pantalla.
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return phone;
  const head = phone.trim().split(/\s+/)[0];
  const prefix = head.startsWith("+") && head.length <= 4 ? head : phone.trim().startsWith("+") ? `+${digits.slice(0, 2)}` : digits.slice(0, 3);
  return `${prefix} ••• ••${digits.slice(-4)}`;
}

/** Cuántos días faltan para el próximo cumpleaños; `null` sin fecha. */
export function daysToBirthday(birthDate: string | null, now = new Date()): number | null {
  if (!birthDate) return null;
  const [, month, day] = birthDate.split("-").map(Number);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(today.getFullYear(), month - 1, day);
  if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day);
  return Math.round((next.getTime() - today.getTime()) / DAY_MS);
}

type RelativeFormatter = (value: number, unit: Intl.RelativeTimeFormatUnit) => string;

/** «hace 3 días», «hace 2 meses»: la unidad sube sola para que el número se lea. */
export function formatAgo(iso: string, formatRelativeTime: RelativeFormatter, now = new Date()): string {
  const days = Math.max(0, daysSince(iso, now));
  if (days < 14) return formatRelativeTime(-days, "day");
  if (days < 60) return formatRelativeTime(-Math.round(days / 7), "week");
  return formatRelativeTime(-Math.round(days / 30), "month");
}

/** Marca de orden de bytes: sin ella Excel abre el CSV con las tildes rotas. */
const BOM = String.fromCharCode(0xfeff);

/** Baja un CSV al equipo de quien lo pide. */
export function downloadCsv(filename: string, header: readonly string[], rows: readonly (readonly (string | number)[])[]): void {
  const url = URL.createObjectURL(new Blob([`${BOM}${toCsv(header, rows)}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Cómo llegó cada cliente, para el formulario, la ficha y el filtro. */
export const SOURCE_KEYS: Readonly<Record<CustomerSource, AppMessageKey>> = {
  instagram: "customers.origin.instagram",
  google: "customers.origin.google",
  facebook: "customers.origin.facebook",
  tiktok: "customers.origin.tiktok",
  referral: "customers.origin.referral",
  walkin: "customers.origin.walkin",
  other: "customers.origin.other",
};
