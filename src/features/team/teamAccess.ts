import type { Access } from "@/features/access";
import { isBarberRole, memberTabs, teamRoleSchema, type MemberTab, type TeamMember, type TeamRole } from "./types";

/**
 * Qué puede hacer quien mira con el equipo y con la ficha de cada persona.
 *
 * Las casillas salen de la matriz (`useAccess().can`); encima van las tres
 * decisiones del capítulo de equipo (docs/roles/04-equipo-sucursales-cuenta.md):
 * - solo el dueño crea y gestiona dueños y administradores; el resto gestiona
 *   únicamente los roles por debajo del suyo;
 * - entre colegas no se ven correo, teléfono, código ni cuenta bancaria;
 * - el dinero de cada barbero (compensación, pagos) es de «Sección de pagos de barberos».
 */

/** Cuanto más bajo, más arriba en la barbería. Los dos barberos están al mismo nivel. */
const ROLE_RANK: Readonly<Record<TeamRole, number>> = { owner: 0, admin: 1, recepcion: 2, "barbero-comision": 3, "barbero-renta": 3 };

/** Si quien mira gestiona a alguien de ese rol: el dueño a todos; el resto, a los de debajo. */
export function managesRole(access: Access, role: TeamRole): boolean {
  return access.role === "owner" || ROLE_RANK[role] > ROLE_RANK[access.role];
}

/** Los roles que quien mira puede dar de alta (los gerentes piden además «Gerentes · Crear»). */
export function creatableRoles(access: Access): TeamRole[] {
  if (!access.can("team", "create")) return [];
  return teamRoleSchema.options.filter((role) => managesRole(access, role) && (isBarberRole(role) || access.can("managers", "create")));
}

/** Si ve el dinero de los barberos: compensación, pagos de renta, lo generado y lo liquidado. */
export const seesBarberMoney = (access: Access): boolean => access.can("barber-payments");

/** Si ve a los gerentes (dueños, administradores, recepción) en la lista del equipo. */
export const seesManagers = (access: Access): boolean => access.can("managers");

export interface MemberAccess {
  /** La ficha es la de quien mira. */
  isSelf: boolean;
  /** Correo, teléfono y código: de uno mismo o para quien gestiona al equipo. */
  seesPrivate: boolean;
  /** Las pestañas que se le enseñan, en el orden de la ficha. */
  tabs: MemberTab[];
  /** Si esa pestaña se puede pasar a edición. */
  canEdit: (tab: MemberTab) => boolean;
  /** Edita su propia ficha sin gestionar al equipo: nivel, visibilidad y «también atiende» quedan bloqueados. */
  selfService: boolean;
  /** Activar o inactivar a la persona. */
  canChangeStatus: boolean;
  canDelete: boolean;
  /** «Ver agenda» lleva al calendario filtrado por ella. */
  canSeeAgenda: boolean;
}

/**
 * La ficha según quién la mira. A un colega se le enseña solo lo público
 * (perfil sin contacto ni código); la propia ficha de un barbero es de lectura;
 * el dinero pide «Sección de pagos de barberos» y los permisos, «Permisos».
 */
export function memberAccess(access: Access, member: TeamMember): MemberAccess {
  const isSelf = access.member?.id === member.id;
  const selfManages = access.role === "owner" || access.role === "admin";
  const manages = access.can("team", "edit") && managesRole(access, member.role);
  const seesPrivate = isSelf || manages;
  const seesMoney = seesBarberMoney(access) || isSelf;

  const tabs = memberTabs(member.role, member.isAlsoBarber).filter((tab) => {
    if (tab === "profile") return true;
    if (!seesPrivate) return false;
    if (tab === "compensation" || tab === "payments") return seesMoney;
    if (tab === "permissions") return isSelf || access.can("permissions");
    return true;
  });

  const canEdit = (tab: MemberTab): boolean => {
    if (!tabs.includes(tab)) return false;
    // En su propia ficha, quien no gestiona al equipo (barbero, recepción) cambia cómo se presenta y su
    // contacto; nivel, servicios, dinero, horario y permisos se los pide a gerencia (el servidor lo exige).
    if (isSelf && !selfManages) return tab === "profile";
    if (tab === "permissions") return !isSelf && access.can("permissions", "edit") && managesRole(access, member.role);
    if (tab === "compensation" || tab === "payments") return seesBarberMoney(access) && (manages || isSelf);
    // Su propio perfil lo edita quien no es barbero (el barbero ya salió arriba).
    return manages || isSelf;
  };

  return {
    isSelf,
    seesPrivate,
    tabs,
    canEdit,
    selfService: isSelf && !selfManages,
    canChangeStatus: !isSelf && access.can("team", "delete") && managesRole(access, member.role),
    canDelete: !isSelf && access.can("team", "delete") && managesRole(access, member.role),
    canSeeAgenda: isSelf || manages,
  };
}
