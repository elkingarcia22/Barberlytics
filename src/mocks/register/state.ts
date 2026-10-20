/** Un cierre de caja: lo que se contó al final del día frente a lo que debía haber. */
export interface MockRegisterClosure {
  id: string;
  branchId: string;
  /** AAAA-MM-DD. */
  date: string;
  /** Con cuánto efectivo abrió la caja. */
  opening: number;
  /** El efectivo que entró en el día según las cuentas (cobros, ventas, devoluciones). */
  expectedCash: number;
  /** El efectivo que se contó al cerrar. */
  counted: number;
  /** Contado − (base + esperado): positivo sobra, negativo falta. */
  difference: number;
  note: string;
  closedAt: string;
  closedBy: string;
  /** Lo contado por denominación («20» → 3 billetes), si se contó así. */
  denominations?: Record<string, number> | null;
  /** Se contó sin ver lo esperado (recepción): la diferencia la revisa gerencia. */
  blind?: boolean;
  /** A quién se le descontó el faltante en la nómina (y el ajuste que lo hace). */
  shortage?: { memberId: string; adjustmentId: string; by: string; at: string } | null;
}

/** Efectivo que entra o sale del cajón durante el día sin ser un cobro: sencillo, un pago a un proveedor, un retiro. */
export interface MockCashMovement {
  id: string;
  branchId: string;
  date: string;
  type: "in" | "out";
  amount: number;
  reason: string;
  at: string;
  by: string;
}

export interface MockRegisterState {
  closures: MockRegisterClosure[];
  movements?: MockCashMovement[];
}

export const emptyRegister = (): MockRegisterState => ({ closures: [], movements: [] });
