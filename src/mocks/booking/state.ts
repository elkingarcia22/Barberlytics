/**
 * Lo que la reserva en línea guarda además de las citas (que viven en la
 * agenda, `db.calendar.appointments`, con `source: "online"`): el recibo de
 * cada reserva, lo que se cobró por cada cita y el saldo a favor que deja un
 * reembolso.
 */

export interface MockBookingLine {
  appointmentId: string;
  /** Para quién es la cita, si no es para quien reserva. */
  guestName: string | null;
  guestRelation: string | null;
  price: number;
  paid: number;
  noPreference: boolean;
}

export interface MockReservation {
  id: string;
  number: string;
  createdAt: string;
  customerId: string;
  branchId: string;
  lines: MockBookingLine[];
  products: { productId: string; name: string; qty: number; price: number }[];
  promoCode: string | null;
  totals: { services: number; products: number; discount: number; subtotal: number; tax: number; tip: number; total: number };
  payment: { method: "card" | "wallet" | "shop" | "credit"; status: "paid" | "pending"; last4: string | null; brand: string | null; paid: number };
}

export interface MockBookingState {
  reservations: MockReservation[];
  /** id de cliente → saldo a favor. */
  credits: Record<string, number>;
  /** id de cliente → cancelaciones hechas en línea. */
  cancellations: Record<string, number>;
}

export const emptyBooking = (): MockBookingState => ({ reservations: [], credits: {}, cancellations: {} });

/**
 * Celulares de la demo. Cualquier otro número es un cliente nuevo; uno de la
 * agenda (`db.calendar.clients`) también se reconoce.
 */
export const DEMO_PHONES: Readonly<Record<string, string>> = {
  "+573202172738": "cli_001",
  "+573005550101": "cli_001",
  "+573005550102": "cli_003",
};

/** Un número bloqueado por la barbería, para ver ese caso. */
export const BLOCKED_PHONE = "+573009999999";

/** El código que «llega» por SMS en la demo para entrar a «Mis citas». */
export const DEMO_OTP = "246810";

/** Tarjeta de prueba que el banco rechaza. */
export const DECLINED_CARD = "4000000000000002";
