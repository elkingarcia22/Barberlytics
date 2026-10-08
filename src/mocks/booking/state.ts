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
  totals: { services: number; products: number; discount: number; subtotal: number; tax: number; tip: number; fee: number; feeName: string | null; total: number };
  payment: { method: "card" | "wallet" | "shop" | "credit"; status: "paid" | "pending"; last4: string | null; brand: string | null; paid: number };
}

export interface MockSavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  holder: string;
}

export interface MockBookingState {
  reservations: MockReservation[];
  /** id de cliente → saldo a favor. */
  credits: Record<string, number>;
  /** id de cliente → cancelaciones hechas en línea. */
  cancellations: Record<string, number>;
  /** id de cliente → sus tarjetas tokenizadas. Sin entrada, la clienta de la demo trae las suyas (`DEMO_CARDS`). */
  cards?: Record<string, MockSavedCard[]>;
  /** Ya se le pusieron a la clienta de la demo sus personas guardadas (una sola vez). */
  demoGuestsSeeded?: boolean;
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

/** La gente ligada al perfil de la clienta de la demo: para ver «Tu gente» al reservar para otro. */
export const DEMO_GUESTS = [
  { id: "gst_demo_santi", name: "Santiago", relation: "Hijo o hija", visits: 4 },
  { id: "gst_demo_laura", name: "Laura", relation: "Pareja", visits: 2 },
];
export const DEMO_GUESTS_CLIENT = "cli_001";

/** Las tarjetas que la clienta de la demo ya guardó en otras reservas. */
export const DEMO_CARDS: readonly MockSavedCard[] = [
  { id: "card_demo_visa", brand: "Visa", last4: "4242", expMonth: 12, expYear: 2028, holder: "Marcela Gómez" },
  { id: "card_demo_mc", brand: "Mastercard", last4: "4444", expMonth: 9, expYear: 2027, holder: "Marcela Gómez" },
];

/** Un número bloqueado por la barbería, para ver ese caso. */
export const BLOCKED_PHONE = "+573009999999";

/** El código que «llega» por SMS en la demo para entrar a «Mis citas». */
export const DEMO_OTP = "246810";

/** Tarjeta de prueba que el banco rechaza. */
export const DECLINED_CARD = "4000000000000002";
