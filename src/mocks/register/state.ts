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
}

export interface MockRegisterState {
  closures: MockRegisterClosure[];
}

export const emptyRegister = (): MockRegisterState => ({ closures: [] });
