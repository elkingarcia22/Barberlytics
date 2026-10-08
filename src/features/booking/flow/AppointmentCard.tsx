import * as React from "react";
import { Text } from "@/components/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { initialsOf } from "../bookingFormat";

export interface AppointmentCardData {
  personName: string;
  relation?: string | null;
  services: readonly string[];
  barberName: string | null;
  barberAvatarUrl?: string | null;
  /** Ya formateado: «jue 9 oct · 10:30 a. m.». */
  when: string;
  duration: string;
  price: string;
  branchName?: string;
}

interface AppointmentCardProps {
  data: AppointmentCardData;
  /** Estado o etiqueta arriba a la derecha (Confirmada, Pagada…). */
  status?: React.ReactNode;
  actions?: React.ReactNode;
  /** Atenuada: cancelada o pasada. */
  muted?: boolean;
}

/**
 * Una cita como la lee el cliente, la misma en el resumen, en la confirmación
 * y en «Mis citas»: cuándo primero —es lo que se busca—, luego para quién,
 * qué y con quién.
 */
export function AppointmentCard({ data, status, actions, muted = false }: AppointmentCardProps) {
  return (
    <article className={cn("flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs", muted && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <IconTile size="md" icon={<ThemaIcon name="calendar" />} />
          <div className="flex min-w-0 flex-col">
            <Text weight="semibold" className="first-letter:uppercase" truncate>
              {data.when}
            </Text>
            <Text size="xs" tone="muted" truncate>
              {data.duration}
              {data.branchName ? ` · ${data.branchName}` : ""}
            </Text>
          </div>
        </div>
        {status}
      </div>
      <div className="flex flex-col gap-1">
        <Text size="sm" weight="medium">
          {data.services.join(" + ")}
        </Text>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Text size="xs" tone="secondary" className="flex items-center gap-1.5" as="span">
            <ThemaIcon name="users" size="xs" />
            {data.personName}
            {data.relation && <Badge variant="outline">{data.relation}</Badge>}
          </Text>
          <Text size="xs" tone="secondary" className="flex items-center gap-1.5" as="span">
            {data.barberName ? (
              <Avatar size="sm">
                {data.barberAvatarUrl && <AvatarImage src={data.barberAvatarUrl} alt="" />}
                <AvatarFallback>{initialsOf(data.barberName)}</AvatarFallback>
              </Avatar>
            ) : (
              <ThemaIcon name="scissors" size="xs" />
            )}
            {data.barberName}
          </Text>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <Text weight="semibold" tabular>
          {data.price}
        </Text>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
    </article>
  );
}
