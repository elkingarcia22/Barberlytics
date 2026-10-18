import { cartTotals } from "@/features/branches/tax";
import { db } from "../db";
import { itemTaxPercent, taxInclusive } from "../settings/branchRules";
import type { MockAppointment } from "./seed";

/**
 * La cuenta de una cita, igual para el cobro de la agenda y para
 * Transacciones: lo que vale (con el impuesto de su sucursal), lo que ya se
 * resolvió en la reserva en línea y lo que queda por cobrar en caja.
 */

export interface AppointmentAccount {
  /** Lo de lista: servicios y productos a su precio. */
  subtotal: number;
  /** Lo descontado en línea (cupón, cortesía, paquete). */
  discount: number;
  tax: number;
  /** Lo que vale la cuenta: con impuesto encima o, si va incluido, sin sumarlo. */
  total: number;
  /** Lo que ya se pagó en línea para esta cuenta (sin propina). */
  prepaid: number;
  /** La propina que ya se dejó en línea. */
  prepaidTip: number;
  /** Lo que falta cobrar en caja, sin propina nueva ni recargo. */
  due: number;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

const serviceOf = (id: string) => db.services.items.find((item) => item.id === id);

/** Lo que cobra ese barbero por el servicio (su precio en Equipo) o, si no tiene uno propio, el de la carta. */
export function barberServicePrice(barberId: string, serviceId: string): number {
  const own = db.team.members.find((member) => member.id === barberId)?.services.find((item) => item.serviceId === serviceId)?.price;
  return own ?? serviceOf(serviceId)?.price ?? 0;
}
const productOf = (id: string) => db.products.items.find((item) => item.id === id);

export function appointmentAccount(appointment: MockAppointment, serviceIds: readonly string[] = appointment.serviceIds, products: readonly { productId: string; qty: number }[] = appointment.products): AppointmentAccount {
  const branchId = appointment.branchId;
  const lines = [
    ...serviceIds.map((id) => ({ amount: barberServicePrice(appointment.barberId, id), percent: itemTaxPercent(serviceOf(id)?.taxRate, branchId) })),
    ...products.map((line) => ({ amount: (productOf(line.productId)?.price ?? 0) * line.qty, percent: itemTaxPercent(productOf(line.productId)?.taxRate, branchId) })),
  ];
  const online = appointment.online ?? null;
  const { subtotal, discount, tax, total } = cartTotals(lines, online?.discount ?? 0, taxInclusive());
  const prepaid = round2(Math.min(total, online?.paid ?? 0));
  return { subtotal, discount, tax, total, prepaid, prepaidTip: round2(online?.tip ?? 0), due: round2(total - prepaid) };
}
