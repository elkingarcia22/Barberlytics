/**
 * Los gastos del backend simulado: lo que sale de caja en cada sucursal. Un
 * gasto fijo se repite con una frecuencia; uno variable pasó una vez. Las
 * fechas son relativas a hoy para que «este mes» siempre tenga algo.
 */

export type MockExpenseKind = "fixed" | "variable";
export type MockExpenseFrequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "semiannual" | "annual";

export interface MockExpense {
  id: string;
  branchId: string;
  kind: MockExpenseKind;
  name: string;
  amount: number;
  /** Solo en los fijos. */
  frequency: MockExpenseFrequency | null;
  description: string;
  createdAt: string;
}

const DAY_MS = 86_400_000;
const MID_MONTH = 15;

interface Draft {
  branchId?: string;
  kind: MockExpenseKind;
  name: string;
  amount: number;
  frequency?: MockExpenseFrequency;
  description?: string;
  /** Hace cuántos días se registró. */
  daysAgo?: number;
  /** O bien: a mediados de hace tantos meses, para que «el mes pasado» no dependa del día de hoy. */
  monthsAgo?: number;
}

const DRAFTS: readonly Draft[] = [
  { kind: "fixed", name: "Renta del local", amount: 3200, frequency: "monthly", description: "88 Newbury St. Se paga el día 1.", daysAgo: 210 },
  { kind: "fixed", name: "Servicios públicos", amount: 420, frequency: "monthly", description: "Luz, agua y gas.", daysAgo: 210 },
  { kind: "fixed", name: "Limpieza", amount: 120, frequency: "weekly", description: "Dos visitas por semana.", daysAgo: 180 },
  { kind: "fixed", name: "Internet y teléfono", amount: 75, frequency: "monthly", daysAgo: 200 },
  { kind: "fixed", name: "Seguro del local", amount: 1800, frequency: "annual", description: "Póliza contra daños y responsabilidad civil.", daysAgo: 150 },
  { kind: "fixed", name: "Lavandería de toallas", amount: 90, frequency: "biweekly", daysAgo: 120 },
  { kind: "fixed", name: "Mantenimiento de aire acondicionado", amount: 240, frequency: "quarterly", daysAgo: 100 },
  { kind: "variable", name: "Reparación de silla 3", amount: 180, description: "Cambio de la bomba hidráulica.", daysAgo: 0 },
  { kind: "variable", name: "Café e insumos de la sala", amount: 64, daysAgo: 0 },
  { kind: "variable", name: "Publicidad en redes", amount: 150, description: "Campaña de reapertura.", daysAgo: 0 },
  { kind: "variable", name: "Afilado de tijeras", amount: 90, monthsAgo: 1 },
  { kind: "variable", name: "Pintura de la fachada", amount: 460, monthsAgo: 1 },
  { branchId: "nc", kind: "fixed", name: "Renta del local", amount: 2400, frequency: "monthly", daysAgo: 190 },
  { branchId: "nc", kind: "variable", name: "Letrero nuevo", amount: 320, daysAgo: 0 },
];

export function seedExpenses(now = new Date()): MockExpense[] {
  return DRAFTS.map((draft, index) => ({
    id: `exp_${String(index + 1).padStart(3, "0")}`,
    branchId: draft.branchId ?? "ma",
    kind: draft.kind,
    name: draft.name,
    amount: draft.amount,
    frequency: draft.kind === "fixed" ? (draft.frequency ?? "monthly") : null,
    description: draft.description ?? "",
    createdAt: (draft.monthsAgo === undefined ? new Date(now.getTime() - (draft.daysAgo ?? 0) * DAY_MS) : new Date(now.getFullYear(), now.getMonth() - draft.monthsAgo, MID_MONTH, 12)).toISOString(),
  }));
}
