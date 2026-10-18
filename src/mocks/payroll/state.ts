/**
 * Lo que la nómina guarda. Calcular no se guarda —se recalcula sobre las citas cobradas—, pero
 * pagar sí: al aprobar un periodo queda una foto fija que ya no cambia aunque se edite una cita o
 * una regla. Los ajustes (bono, descuento, adelanto) son del periodo abierto y entran en esa foto.
 */

export type MockAdjustmentKind = "bonus" | "deduction" | "advance";

export interface MockPayrollAdjustment {
  id: string;
  branchId: string;
  /** El periodo al que pertenece (AAAA-MM-DD). */
  from: string;
  to: string;
  memberId: string;
  kind: MockAdjustmentKind;
  amount: number;
  note: string;
  createdAt: string;
  createdBy: string;
}

export type MockRunStatus = "approved" | "paid";

export interface MockPayrollRun {
  id: string;
  branchId: string;
  from: string;
  to: string;
  status: MockRunStatus;
  approvedAt: string;
  approvedBy: string;
  paidAt: string | null;
  paidBy: string | null;
  /** Cómo se pagó: efectivo, transferencia, Nequi… */
  method: string | null;
  reference: string | null;
  weeks: number;
  /** La nómina tal como quedó al aprobar. */
  members: unknown[];
}

export interface MockPayrollHistoryEntry {
  id: string;
  branchId: string;
  from: string;
  to: string;
  at: string;
  actor: string;
  event: "approved" | "paid" | "reopened";
  reason: string | null;
}

/** Un pago de renta de un barbero de renta: cuándo, cuánto y con qué. Se cuenta en el periodo de su fecha. */
export interface MockRentPayment {
  id: string;
  branchId: string;
  memberId: string;
  amount: number;
  method: string;
  /** AAAA-MM-DD. */
  date: string;
  note: string;
  by: string;
}

export interface MockPayrollState {
  runs: MockPayrollRun[];
  adjustments: MockPayrollAdjustment[];
  history: MockPayrollHistoryEntry[];
  rentPayments: MockRentPayment[];
}

export const emptyPayroll = (): MockPayrollState => ({ runs: [], adjustments: [], history: [], rentPayments: [] });
