import * as React from "react";
import { useAppT } from "@/app/i18n";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initialsOf } from "@/components/scheduling";
import type { ScheduleTone } from "@/components/scheduling";
import { clientTypeTone } from "./calendarModel";
import { CLIENT_TYPE_KEYS, STATUS_KEYS, type AppointmentStatus, type ClientType } from "./types";

/**
 * Las piezas chicas que se repiten en toda la pantalla del calendario —el
 * badge del estado de una cita, la píldora del tipo de cliente, el avatar de
 * una persona— y el formateador de dinero de la sucursal. Viven juntas para
 * que la tarjeta, la agenda y los drawers digan «VIP» y «$35» de la misma
 * forma.
 */

const STATUS_BADGE: Record<AppointmentStatus, React.ComponentProps<typeof StatusBadge>["status"]> = {
  scheduled: "pending",
  arrived: "info",
  seated: "warning",
  paid: "completed",
  no_show: "error",
  cancelled: "inactive",
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const t = useAppT();
  return <StatusBadge status={STATUS_BADGE[status]} label={t(STATUS_KEYS[status])} />;
}

const TYPE_VARIANT: Record<ScheduleTone, React.ComponentProps<typeof Badge>["variant"]> = {
  primary: "default",
  positive: "secondary",
  warning: "default",
  negative: "destructive",
  info: "outline",
  neutral: "neutral",
};

export function ClientTypeBadge({ type }: { type: ClientType }) {
  const t = useAppT();
  return <Badge variant={TYPE_VARIANT[clientTypeTone(type)]}>{t(CLIENT_TYPE_KEYS[type])}</Badge>;
}

export function PersonAvatar({ name, avatarUrl, size = "default" }: { name: string; avatarUrl?: string | null; size?: "sm" | "default" | "lg" }) {
  return (
    <Avatar size={size}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
      <AvatarFallback>{initialsOf(name)}</AvatarFallback>
    </Avatar>
  );
}

/** Una fila «etiqueta · valor» de las fichas de los drawers. */
export function DetailRow({ label, children, strong, plain }: { label: string; children: React.ReactNode; strong?: boolean; /** Sin filete entre filas y con la etiqueta más legible: para el panel de la cita. */ plain?: boolean }) {
  return (
    <div className={plain ? "flex items-center justify-between gap-4 py-1.5" : "flex items-center justify-between gap-4 border-b border-border/60 py-2 last:border-b-0"}>
      <span className={plain ? "text-sm text-text-secondary" : "text-sm text-text-muted"}>{label}</span>
      <span className={strong ? "text-sm font-semibold text-text-primary tabular-nums" : "text-sm text-text-primary tabular-nums"}>{children}</span>
    </div>
  );
}

