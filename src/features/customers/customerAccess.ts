import * as React from "react";
import { useAccess, type Access } from "@/features/access";
import type { Customer } from "./types";

/**
 * Qué puede ver y hacer en Clientes quien entra (docs/roles/03-clientes-catalogo.md).
 *
 * **Cliente suyo** (decisión 1 de docs/ROLES_PLAN.md): para el barbero B, un
 * cliente es suyo si
 * 1. **lo prefiere**: `preferredBarberId = B`, o
 * 2. **lo atiende**: tiene con B una cita por atender o una cobrada en los
 *    últimos 12 meses (`barberIds`, que calcula el servidor).
 * Nada más: un cliente que B atendió hace dos años y hoy va con otro deja de
 * ser suyo. La tercera vía de la propuesta —«lo trajo él» (`ownerBarberId`,
 * propiedad Barber-Owned)— queda pendiente: el contrato aún no la tiene.
 *
 * Quien ve «todo» (dueño, admin, recepción) no recorta.
 */

type OwnershipFields = Pick<Customer, "preferredBarberId" | "barberIds">;

export function isOwnCustomer(customer: OwnershipFields, memberId: string): boolean {
  return customer.preferredBarberId === memberId || customer.barberIds.includes(memberId);
}

/** Si quien mira puede ver a ese cliente: todo, o solo los suyos. */
export function canSeeCustomer(access: Access, customer: OwnershipFields): boolean {
  if (access.scope === "all") return true;
  return access.member !== null && isOwnCustomer(customer, access.member.id);
}

export interface CustomerPermissions {
  /** `own`: la lista, los segmentos y las fichas se recortan a sus clientes. */
  scope: Access["scope"];
  /** Su ficha de equipo, para recortar importes de citas a las suyas. */
  memberId: string | null;
  canSee: (customer: OwnershipFields) => boolean;
  canCreate: boolean;
  /** Editar datos y bloquear o desbloquear (`clients`·edit). */
  canEdit: boolean;
  canDelete: boolean;
  canImport: boolean;
  canExport: boolean;
  /** Teléfono, correo, dirección y notas médicas (`client-info`·active). */
  showContact: boolean;
  /** Valor de vida, ticket, pagos y pulso de dinero: recepción cobra pero no lleva los números. */
  showMoney: boolean;
  /** Anotar o retirar el permiso de datos de salud: todos menos el barbero (lo pide recepción o gerencia). */
  canHealthConsent: boolean;
  /** Anotar solicitudes de datos que llegan por teléfono, correo o en el local: recepción y gerencia. */
  canLogPrivacy: boolean;
  /** Exportar, borrar y cerrar solicitudes de datos: el dueño o un administrador. */
  canManagePrivacy: boolean;
}

export function customerPermissions(access: Access): CustomerPermissions {
  return {
    scope: access.scope,
    memberId: access.member?.id ?? null,
    canSee: (customer) => canSeeCustomer(access, customer),
    canCreate: access.can("clients", "create"),
    canEdit: access.can("clients", "edit"),
    canDelete: access.can("clients", "delete"),
    canImport: access.can("import-clients", "active"),
    canExport: access.can("export-clients", "active"),
    showContact: access.can("client-info", "active"),
    // Mismo criterio que Métricas: sin indicadores, salvo el barbero, que ve los suyos.
    showMoney: access.can("kpis", "active") || access.isBarber,
    canHealthConsent: !access.isBarber,
    canLogPrivacy: access.role === "owner" || access.role === "admin" || access.role === "recepcion",
    canManagePrivacy: access.role === "owner" || access.role === "admin",
  };
}

export function useCustomerPermissions(): CustomerPermissions {
  const access = useAccess();
  return React.useMemo(() => customerPermissions(access), [access]);
}
