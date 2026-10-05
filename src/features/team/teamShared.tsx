import * as React from "react";
import { useAppT } from "@/app/i18n";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { SectionHeader } from "@/components/utility";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initialsOf } from "@/components/scheduling";
import { cn } from "@/lib/utils";
import { MEMBER_STATUS_KEYS, TEAM_ROLE_KEYS, memberName, type MemberStatus, type TeamMember, type TeamRole } from "./types";

/**
 * Las piezas chicas del módulo de equipo: la sucursal activa, el avatar, el
 * rol y el estado de una persona, y la tarjeta con la que se arman las
 * pestañas de la ficha en modo lectura.
 */

export function MemberAvatar({ member, size = "default" }: { member: Pick<TeamMember, "firstName" | "lastName" | "avatarUrl">; size?: "sm" | "default" | "lg" }) {
  return (
    <Avatar size={size}>
      {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt="" />}
      <AvatarFallback>{initialsOf(memberName(member))}</AvatarFallback>
    </Avatar>
  );
}

/** Lo mismo con el nombre ya armado («Andrés Beltrán»), para las listas que no traen nombre y apellido por separado. */
export function TeamPersonAvatar({ name, avatarUrl, size = "default" }: { name: string; avatarUrl: string | null | undefined; size?: "sm" | "default" | "lg" }) {
  return (
    <Avatar size={size}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
      <AvatarFallback>{initialsOf(name)}</AvatarFallback>
    </Avatar>
  );
}

const STATUS_BADGE: Record<MemberStatus, React.ComponentProps<typeof StatusBadge>["status"]> = { active: "active", invited: "pending", inactive: "inactive" };

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  const t = useAppT();
  return <StatusBadge status={STATUS_BADGE[status]} label={t(MEMBER_STATUS_KEYS[status])} />;
}

export function RoleBadge({ role }: { role: TeamRole }) {
  const t = useAppT();
  return <Badge variant="neutral">{t(TEAM_ROLE_KEYS[role])}</Badge>;
}

/** Una tarjeta de la ficha en modo lectura: título, línea de ayuda y su contenido. */
export function InfoCard({ title, description, actions, children, className }: { title: string; description?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-border/60 bg-surface p-card shadow-card", className)}>
      <SectionHeader title={title} description={description} actions={actions} />
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Una fila «etiqueta · valor» con icono opcional, para las fichas. */
export function InfoRow({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/60 py-3 last:border-b-0">
      {icon && <span className="mt-0.5 shrink-0 text-text-muted [&>svg]:size-4">{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <div className="text-sm text-text-secondary">{children}</div>
      </div>
    </div>
  );
}

/** Un dato con etiqueta pequeña encima, para rejillas de dos o tres columnas. */
export function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-surface-subtle p-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-text-primary">{children}</p>
    </div>
  );
}

