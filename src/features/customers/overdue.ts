/**
 * «Le toca volver»: ya pasó su ritmo habitual de visita sin volver, pero todavía no está en riesgo
 * ni perdido. Es la misma regla en Clientes (el aviso) y en Métricas (el conteo), así la cifra de
 * una lleva a la lista de la otra.
 */
const DAY_MS = 86_400_000;

export interface OverdueFacts {
  segment: string;
  lastVisitAt: string | null;
  visitEveryDays: number | null;
}

export function isOverdue(customer: OverdueFacts, now: Date = new Date()): boolean {
  if (["atRisk", "lost", "blocked", "new"].includes(customer.segment)) return false;
  if (customer.lastVisitAt === null || customer.visitEveryDays === null) return false;
  return now.getTime() - new Date(customer.lastVisitAt).getTime() > customer.visitEveryDays * DAY_MS;
}
