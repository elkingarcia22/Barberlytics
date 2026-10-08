import type { Promo } from "./pricing";
import type { BookingCustomer, LastVisit, PayMethod, Reservation } from "./types";

/**
 * El recorrido de la reserva como datos: en qué paso está, quién reserva, la
 * cita que se está armando y las que ya están en el carrito. Sin interfaz,
 * para poder probarlo entero; la pantalla solo despacha acciones.
 *
 * Una reserva tiene una sede y una o varias citas. Cada cita es de una
 * persona —quien reserva, un invitado guardado (su hijo, su pareja) o alguien
 * nuevo por nombre— con uno o varios servicios, un barbero (o sin
 * preferencia) y una hora.
 */

export type BookingStep = "phone" | "profile" | "welcome" | "blocked" | "branch" | "services" | "barber" | "time" | "review" | "payment" | "confirmed" | "manage";

export type BookingPerson = { kind: "self" } | { kind: "guest"; guestId: string; name: string; relation: string } | { kind: "new"; name: string; relation: string };

export interface DraftItem {
  key: string;
  person: BookingPerson;
  serviceIds: string[];
  /** `null` = sin preferencia. */
  barberId: string | null;
  /** «AAAA-MM-DDTHH:mm», o nada mientras no se elige. */
  start: string | null;
}

export interface BookingState {
  step: BookingStep;
  phone: string;
  customer: BookingCustomer | null;
  branchId: string | null;
  items: DraftItem[];
  /** La cita que se está armando; `editingIndex` dice si reemplaza una del carrito. */
  draft: DraftItem | null;
  editingIndex: number | null;
  products: Readonly<Record<string, number>>;
  tipId: string | null;
  promo: Promo | null;
  method: PayMethod | null;
  notes: string;
  reservation: Reservation | null;
}

export type BookingAction =
  | { type: "phoneEntered"; phone: string }
  | { type: "customerFound"; customer: BookingCustomer }
  | { type: "customerIsNew" }
  | { type: "customerBlocked" }
  | { type: "profileSaved"; customer: BookingCustomer; onlyBranchId: string | null }
  | { type: "startFresh"; onlyBranchId: string | null }
  | { type: "repeatLastVisit"; lastVisit: LastVisit }
  | { type: "acceptSuggestion"; branchId: string; serviceIds: string[]; barberId: string; start: string }
  | { type: "chooseBranch"; branchId: string }
  | { type: "setPerson"; person: BookingPerson }
  | { type: "toggleService"; serviceId: string }
  | { type: "chooseBarber"; barberId: string | null }
  | { type: "chooseTime"; start: string }
  | { type: "addAnother"; person: BookingPerson }
  | { type: "editItem"; index: number }
  | { type: "removeItem"; index: number }
  | { type: "restoreItem"; index: number; item: DraftItem }
  | { type: "discardDraft" }
  | { type: "setProduct"; productId: string; qty: number }
  | { type: "setTip"; tipId: string | null }
  | { type: "setPromo"; promo: Promo | null }
  | { type: "setMethod"; method: PayMethod }
  | { type: "setNotes"; notes: string }
  | { type: "goTo"; step: BookingStep }
  | { type: "reserved"; reservation: Reservation }
  | { type: "bookAgain" }
  | { type: "openManage" }
  | { type: "signedIn"; customer: BookingCustomer }
  | { type: "restart" };

let keySeed = 0;
const nextKey = (): string => {
  keySeed += 1;
  return `item_${keySeed}`;
};

const emptyDraft = (person: BookingPerson = { kind: "self" }): DraftItem => ({ key: nextKey(), person, serviceIds: [], barberId: null, start: null });

export function initialBookingState(defaultTipId: string | null = null): BookingState {
  return { step: "phone", phone: "", customer: null, branchId: null, items: [], draft: null, editingIndex: null, products: {}, tipId: defaultTipId, promo: null, method: null, notes: "", reservation: null };
}

/** Con una sola sede se salta el paso: se elige sola. */
const afterIdentity = (state: BookingState, onlyBranchId: string | null): BookingState =>
  onlyBranchId ? { ...state, branchId: onlyBranchId, draft: emptyDraft(), editingIndex: null, step: "services" } : { ...state, draft: emptyDraft(), editingIndex: null, step: "branch" };

/** Guarda la cita armada en el carrito (o reemplaza la que se editaba) y va al resumen. */
function commitDraft(state: BookingState, draft: DraftItem): BookingState {
  const items = state.editingIndex === null ? [...state.items, draft] : state.items.map((item, index) => (index === state.editingIndex ? draft : item));
  return { ...state, items, draft: null, editingIndex: null, step: "review" };
}

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "phoneEntered":
      return { ...state, phone: action.phone };
    case "customerFound":
      return { ...state, customer: action.customer, step: "welcome" };
    case "customerIsNew":
      return { ...state, customer: null, step: "profile" };
    case "customerBlocked":
      return { ...state, customer: null, step: "blocked" };
    case "profileSaved":
      return afterIdentity({ ...state, customer: action.customer }, action.onlyBranchId);
    case "startFresh":
      return afterIdentity(state, action.onlyBranchId);
    case "repeatLastVisit":
      return {
        ...state,
        branchId: action.lastVisit.branchId,
        draft: { ...emptyDraft(), serviceIds: [...action.lastVisit.serviceIds], barberId: action.lastVisit.barberId },
        editingIndex: null,
        step: "time",
      };
    case "acceptSuggestion":
      // La hora que le toca, propuesta por su frecuencia de visita: la cita queda armada y va al resumen.
      return {
        ...state,
        branchId: action.branchId,
        items: [{ ...emptyDraft(), serviceIds: [...action.serviceIds], barberId: action.barberId, start: action.start }],
        draft: null,
        editingIndex: null,
        step: "review",
      };
    case "chooseBranch":
      // Cambiar de sede vacía el carrito: los barberos y los precios son de cada sede.
      return { ...state, branchId: action.branchId, items: action.branchId === state.branchId ? state.items : [], products: action.branchId === state.branchId ? state.products : {}, draft: state.draft ?? emptyDraft(), step: "services" };
    case "setPerson":
      return state.draft ? { ...state, draft: { ...state.draft, person: action.person } } : state;
    case "toggleService": {
      if (!state.draft) return state;
      const has = state.draft.serviceIds.includes(action.serviceId);
      const serviceIds = has ? state.draft.serviceIds.filter((id) => id !== action.serviceId) : [...state.draft.serviceIds, action.serviceId];
      // Otros servicios pueden no hacerlos el mismo barbero ni caber en la misma hora: se vuelven a elegir.
      return { ...state, draft: { ...state.draft, serviceIds, start: null } };
    }
    case "chooseBarber":
      return state.draft ? { ...state, draft: { ...state.draft, barberId: action.barberId, start: null }, step: "time" } : state;
    case "chooseTime":
      return state.draft ? commitDraft(state, { ...state.draft, start: action.start }) : state;
    case "addAnother":
      return { ...state, draft: emptyDraft(action.person), editingIndex: null, step: "services" };
    case "editItem": {
      const item = state.items[action.index];
      return item ? { ...state, draft: { ...item }, editingIndex: action.index, step: "services" } : state;
    }
    case "removeItem": {
      const items = state.items.filter((_, index) => index !== action.index);
      return { ...state, items, promo: items.length === 0 ? null : state.promo };
    }
    case "restoreItem": {
      const items = [...state.items.slice(0, action.index), action.item, ...state.items.slice(action.index)];
      return { ...state, items };
    }
    case "discardDraft":
      return { ...state, draft: null, editingIndex: null, step: state.items.length > 0 ? "review" : state.step };
    case "setProduct": {
      const rest = Object.fromEntries(Object.entries(state.products).filter(([id]) => id !== action.productId));
      return { ...state, products: action.qty > 0 ? { ...rest, [action.productId]: action.qty } : rest };
    }
    case "setTip":
      return { ...state, tipId: action.tipId };
    case "setPromo":
      return { ...state, promo: action.promo };
    case "setMethod":
      return { ...state, method: action.method };
    case "setNotes":
      return { ...state, notes: action.notes };
    case "goTo":
      return { ...state, step: action.step };
    case "reserved":
      return { ...state, reservation: action.reservation, step: "confirmed" };
    case "bookAgain":
      // Otra reserva para la misma persona: se queda quién es y en qué sede, lo demás vuelve a empezar.
      return { ...initialBookingState(state.tipId), phone: state.phone, customer: state.customer, branchId: state.branchId, draft: emptyDraft(), step: state.branchId ? "services" : "branch" };
    case "openManage":
      return { ...state, step: "manage" };
    case "signedIn":
      // Entró a «Mis citas» con su código: ya se sabe quién es, sin moverlo de pantalla.
      return { ...state, customer: action.customer, phone: action.customer.phone.replace(/[^\d+]/g, "") || state.phone };
    case "restart":
      return initialBookingState(state.tipId);
  }
}

/** Los pasos que enseña la barra de progreso y en cuál de ellos cae cada pantalla. */
export const PROGRESS_STEPS = ["branch", "services", "barber", "time", "review", "payment"] as const;
export type ProgressStep = (typeof PROGRESS_STEPS)[number];

export function progressIndex(step: BookingStep): number {
  const index = PROGRESS_STEPS.indexOf(step as ProgressStep);
  if (index !== -1) return index;
  return step === "confirmed" ? PROGRESS_STEPS.length : -1;
}

/** El nombre de quien va a la cita, como lo leen el resumen y el recibo. */
export function personName(person: BookingPerson, customer: BookingCustomer | null): string {
  if (person.kind === "self") return customer?.name ?? "";
  return person.name;
}
