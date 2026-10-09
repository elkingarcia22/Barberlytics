import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Field } from "@/components/forms";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { personName, type DraftItem } from "../../bookingState";
import { formatPhone, parseStart } from "../../bookingFormat";
import { useBookingFlow } from "../../flow/BookingContext";
import { PaymentPanel } from "../../flow/PaymentPanel";
import { ReferencePhotoField } from "../../flow/ReferencePhotoField";
import { StepLayout } from "../../flow/StepLayout";
import { usePaymentController, type PaymentController } from "../../flow/usePaymentController";
import { itemPrice } from "../../useBookingTotals";
import { CheckoutFooter, CheckoutSection } from "./AgendaCheckout";
import { AgendaIdentity } from "./AgendaIdentity";
import { AgendaProductField } from "./AgendaProductField";

/** La cita en una tarjeta: qué, cuándo, con quién y dónde, con su precio; y a nombre de quién va. */
function AppointmentCard({ item }: { item: DraftItem }) {
  const t = useAppT();
  const { state, dispatch, shop, catalog, fmt } = useBookingFlow();
  const services = item.serviceIds.map((id) => catalog?.services.find((service) => service.id === id)).filter((service) => service !== undefined);
  const barber = catalog?.barbers.find((entry) => entry.id === item.barberId);
  const branch = shop.branches.find((entry) => entry.id === state.branchId);
  const forOther = item.person.kind !== "self";
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface">
      <div className="flex items-start gap-3 p-3">
        <IconTile size="lg" src={services[0]?.imageUrl} icon={<ThemaIcon name="scissors" />} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Text weight="semibold" className="truncate">
            {services.map((service) => service.name).join(" + ")}
          </Text>
          {item.start && (
            <Text size="sm" tabular className="first-letter:uppercase">
              {fmt.when(parseStart(item.start))}
            </Text>
          )}
          <Text size="xs" tone="muted" className="truncate">
            {[barber?.name ?? t("booking.review.noPreference"), branch?.name].filter(Boolean).join(" · ")}
          </Text>
          {forOther && (
            <Text size="xs" tone="secondary" className="truncate">
              {t("booking.agenda.checkout.forPerson", { name: personName(item.person, state.customer) })}
            </Text>
          )}
        </div>
        <Text weight="semibold" tabular>
          {fmt.money(itemPrice(item, catalog))}
        </Text>
      </div>
      {state.customer && (
        <div className="flex items-center gap-2 border-t border-border px-3 py-2">
          <ThemaIcon name="check" size="sm" tone="positive" />
          <Text size="sm" className="min-w-0 flex-1 truncate">
            {state.customer.name}
            <Text as="span" size="sm" tone="muted" tabular>
              {` · ${formatPhone(state.customer.phone)}`}
            </Text>
          </Text>
          <Button type="button" variant="ghost" size="sm" className="-mr-1.5" onClick={() => dispatch({ type: "signOut" })}>
            {t("booking.agenda.checkout.notYou")}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Nota y foto para el barbero, en una sola fila hasta que se usan; la tienda, como un campo más. */
function Extras() {
  const t = useAppT();
  const { state, dispatch } = useBookingFlow();
  const [isNoteOpen, setIsNoteOpen] = React.useState(state.notes.trim() !== "");
  return (
    <div className="flex flex-col gap-3">
      {isNoteOpen && (
        <Field label={t("booking.review.notes")}>
          <Textarea autoFocus value={state.notes} onChange={(event) => dispatch({ type: "setNotes", notes: event.target.value })} placeholder={t("booking.review.notesPlaceholder")} rows={2} />
        </Field>
      )}
      <div className="flex flex-wrap items-start gap-2">
        {!isNoteOpen && (
          <Button type="button" variant="outline" onClick={() => setIsNoteOpen(true)}>
            <ThemaIcon name="edit" />
            {t("booking.agenda.checkout.addNote")}
          </Button>
        )}
        <ReferencePhotoField />
      </div>
      <div className="flex flex-col gap-2">
        <Text id="checkout-shop" size="sm" weight="medium">
          {t("booking.agenda.checkout.shop")}
        </Text>
        <AgendaProductField labelledBy="checkout-shop" />
      </div>
    </div>
  );
}

function Body({ payment }: { payment: PaymentController | null }) {
  const t = useAppT();
  const { state } = useBookingFlow();
  let index = 0;
  const next = () => ++index;
  return (
    <>
      <CheckoutSection index={next()} title={t("booking.agenda.checkout.yourAppointment")}>
        {state.items.map((item) => (
          <AppointmentCard key={item.key} item={item} />
        ))}
      </CheckoutSection>
      {!state.customer && (
        <CheckoutSection index={next()} title={t("booking.agenda.checkout.yourDetails")}>
          <AgendaIdentity />
        </CheckoutSection>
      )}
      <CheckoutSection index={next()} title={t("booking.agenda.checkout.extras")}>
        <Extras />
      </CheckoutSection>
      <CheckoutSection index={next()} title={t("booking.agenda.checkout.pay")}>
        {payment ? (
          <div className="flex flex-col gap-5">
            <PaymentPanel payment={payment} compact />
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-3">
            <IconTile size="md" shape="circle" tone="neutral" icon={<ThemaIcon name="lock" />} />
            <Text size="sm" tone="muted">
              {t("booking.agenda.checkout.signInFirst")}
            </Text>
          </div>
        )}
      </CheckoutSection>
    </>
  );
}

function IdentifiedCheckout() {
  const t = useAppT();
  const payment = usePaymentController();
  return (
    <StepLayout title={t("booking.agenda.checkout.title")} lead={t("booking.agenda.checkout.selectLead")} footer={<CheckoutFooter payment={payment} />}>
      <Body payment={payment} />
    </StepLayout>
  );
}

/**
 * Confirmar y pagar en la Agenda con selector: una sola cita, así que va
 * arriba en una tarjeta (con a nombre de quién) y abajo solo las cuentas, sin
 * repetirla. Sin «Volver a la agenda»: la flecha de la cabecera ya lo hace.
 * Lo opcional (nota, foto, tienda) queda en una fila hasta que se usa, y el
 * pago va en su versión compacta.
 */
export function AgendaSelectCheckout() {
  const t = useAppT();
  const { state } = useBookingFlow();
  if (state.customer) return <IdentifiedCheckout key={state.customer.id} />;
  return (
    <StepLayout title={t("booking.agenda.checkout.title")} lead={t("booking.agenda.checkout.selectLead")} footer={<CheckoutFooter payment={null} />}>
      <Body payment={null} />
    </StepLayout>
  );
}
