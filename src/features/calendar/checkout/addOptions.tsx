import type { SearchableSelectOption } from "@/components/forms";
import { appointmentRange, findClient, priceFor, servicesOf, type ModelContext } from "../calendarModel";
import { ClientAvatar, ProductThumb, ServiceThumb } from "../calendarShared";
import type { Appointment } from "../types";
import type { CheckoutController } from "./useCheckout";

/** Lo que se puede sumar al cobro desde «Agregar», como opciones del buscador: servicios, productos y otras citas sin cobrar. */

export function serviceOptions(checkout: CheckoutController, appointment: Appointment, ctx: ModelContext): SearchableSelectOption[] {
  return ctx.catalog.services.map((item) => ({ value: item.id, label: item.name, description: checkout.t("calendar.create.durationPrice", { minutes: item.durationMin, price: ctx.formatMoney(priceFor(ctx.catalog, appointment.barberId, item)) }), leading: <ServiceThumb service={item} /> }));
}

export function productOptions(ctx: ModelContext): SearchableSelectOption[] {
  return ctx.catalog.products.map((item) => ({ value: item.id, label: item.name, description: `${item.category} · ${ctx.formatMoney(item.price)}`, leading: <ProductThumb product={item} /> }));
}

/** Las citas del día sin cobrar que todavía no están en el cobro. */
export function visitOptions(checkout: CheckoutController, ctx: ModelContext): SearchableSelectOption[] {
  return checkout.candidates
    .filter((item) => !checkout.extras.some((extra) => extra.id === item.id))
    .map((item) => {
      const client = findClient(ctx.catalog, item.clientId);
      return { value: item.id, label: client?.name ?? checkout.t("calendar.clientType.walkin"), description: `${appointmentRange(item, ctx.intl)} · ${servicesOf(ctx.catalog, item).map((service) => service.name).join(" + ")}`, leading: <ClientAvatar client={client} size="sm" /> };
    });
}
