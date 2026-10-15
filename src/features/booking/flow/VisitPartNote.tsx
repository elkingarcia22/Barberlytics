import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { ThemaIcon } from "@/icons";
import type { DraftItem } from "../bookingState";
import { visitPartOf } from "../visit";
import { useBookingFlow } from "./BookingContext";

/**
 * Al armar una parte de una visita, en Barbero y en Hora: cuál de las partes es y de qué
 * servicio, para que se sepa qué se está eligiendo. Fuera de una visita no se muestra.
 */
export function VisitPartNote({ items }: { /** El carrito sin la hora que se va a reemplazar (la Agenda). */ items?: readonly DraftItem[] } = {}) {
  const t = useAppT();
  const { state, catalog } = useBookingFlow();
  const draft = state.draft;
  const part = visitPartOf(state, items);
  if (!draft || !part) return null;
  const { current, total } = part;
  const services = draft.serviceIds.map((id) => catalog?.services.find((service) => service.id === id)?.name ?? id).join(" + ");

  return (
    <Text size="sm" tone="secondary" className="flex items-center gap-2">
      <ThemaIcon name="link" size="sm" tone="primary" />
      <span>
        {t("booking.visit.part", { current, total })} · <Text as="span" size="sm" weight="semibold" tone="primary">{services}</Text>
      </span>
    </Text>
  );
}
