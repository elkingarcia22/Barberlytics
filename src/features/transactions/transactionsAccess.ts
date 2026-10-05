import type { Access } from "@/features/access";
import type { Account } from "./types";

/**
 * Qué cuentas y qué cifras ve quien entra a Transacciones
 * (docs/roles/02-metricas-caja-nomina.md, «Transacciones»).
 */

/** Las cuentas que le tocan a quien mira: todas, o solo las que atendió el barbero. */
export function accountsFor(access: Pick<Access, "scope" | "member">, accounts: readonly Account[]): readonly Account[] {
  if (access.scope === "all") return accounts;
  const memberId = access.member?.id;
  return memberId ? accounts.filter((account) => account.barberId === memberId) : [];
}

/** Recepción cobra pero no lleva los números del negocio: sin indicadores, sin totales del periodo. */
export const showsPeriodTotals = (access: Pick<Access, "can" | "isBarber">): boolean => access.can("kpis", "active") || access.isBarber;
