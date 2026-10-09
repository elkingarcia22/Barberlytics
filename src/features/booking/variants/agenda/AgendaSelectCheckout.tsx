import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { type DraftItem } from "../../bookingState";
import { formatPhone, parseStart } from "../../bookingFormat";
import { useBookingFlow } from "../../flow/BookingContext";
import { BookingSheet } from "../../flow/BookingSheet";
import { PersonSheet } from "../../flow/PersonPicker";
import { PaymentPanel } from "../../flow/PaymentPanel";
import { StepLayout } from "../../flow/StepLayout";
import { useAsideFooter } from "../../flow/asideSlot";
import { usePaymentController, type PaymentController } from "../../flow/usePaymentController";
import { itemPrice } from "../../useBookingTotals";
import { CheckoutFooter, CheckoutSection } from "./AgendaCheckout";
import { AgendaIdentity, ProfileForm } from "./AgendaIdentity";
import { AgendaProductField } from "./AgendaProductField";

/** La cita en una tarjeta: qué, cuándo, con quién y dónde, con su precio; y a nombre de quién va. */
function AppointmentCard({ item }: { item: DraftItem }) {
  const t = useAppT();
  const { state, dispatch, shop, catalog, fmt } = useBookingFlow();
  const services = item.serviceIds.map((id) => catalog?.services.find((service) => service.id === id)).filter((service) => service !== undefined);
  const barber = catalog?.barbers.find((entry) => entry.id === item.barberId);
  const branch = shop.branches.find((entry) => entry.id === state.branchId);
  const forOther = item.person.kind !== "self";
  const [isPersonOpen, setIsPersonOpen] = React.useState(false);
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
        </div>
        <Text weight="semibold" tabular>
          {fmt.money(itemPrice(item, catalog))}
        </Text>
      </div>
      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        <ThemaIcon name="users" size="sm" tone="muted" />
        <Text size="sm" className="min-w-0 flex-1 truncate">
          {forOther ? t("booking.agenda.checkout.forPerson", { name: item.person.kind === "self" ? "" : item.person.name }) : t("booking.person.self")}
          {forOther && item.person.kind !== "self" && item.person.relation && (
            <Text as="span" size="sm" tone="muted">
              {` · ${item.person.relation}`}
            </Text>
          )}
        </Text>
        <Button type="button" variant="ghost" size="sm" className="-mr-1.5" onClick={() => setIsPersonOpen(true)}>
          {t(forOther ? "booking.person.change" : "booking.person.add")}
        </Button>
      </div>
      <PersonSheet open={isPersonOpen} onOpenChange={setIsPersonOpen} person={item.person} onChoose={(person) => dispatch({ type: "setItemPerson", key: item.key, person })} />
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

/** Los productos; la nota y la foto para el barbero se piden ya confirmada la cita. */
function Extras() {
  const t = useAppT();
  return (
    <>
      <span id="checkout-products" className="sr-only">
        {t("booking.agenda.checkout.products")}
      </span>
      <AgendaProductField labelledBy="checkout-products" />
    </>
  );
}

/**
 * Cliente nuevo (ya verificó su celular): sus datos se piden en una hoja que
 * se abre sola. Si la cierra, el botón la vuelve a abrir.
 */
function NewCustomerDetails() {
  const t = useAppT();
  const [isOpen, setIsOpen] = React.useState(true);
  return (
    <>
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border p-3">
        <Text size="sm" tone="secondary">
          {t("booking.agenda.id.newLead")}
        </Text>
        <Button type="button" onClick={() => setIsOpen(true)}>
          <ThemaIcon name="edit" />
          {t("booking.agenda.id.completeCta")}
        </Button>
      </div>
      <BookingSheet open={isOpen} onOpenChange={setIsOpen} title={t("booking.profile.title")} description={t("booking.profile.lead")}>
        <ProfileForm />
      </BookingSheet>
    </>
  );
}

function Body({ payment }: { payment: PaymentController | null }) {
  const t = useAppT();
  const { state, layout } = useBookingFlow();
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
          {state.token ? <NewCustomerDetails /> : <AgendaIdentity />}
        </CheckoutSection>
      )}
      {state.customer && (
        <CheckoutSection index={next()} title={t("booking.agenda.checkout.products")}>
          <Extras />
        </CheckoutSection>
      )}
      <CheckoutSection index={next()} title={t("booking.agenda.checkout.pay")}>
        {payment ? (
          <div className="flex flex-col gap-5">
            <PaymentPanel payment={payment} compact showOrder={layout !== "wide"} />
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
  const { footer, portal } = useAsideFooter(<CheckoutFooter payment={payment} />);
  return (
    <StepLayout title={t("booking.agenda.checkout.title")} lead={t("booking.agenda.checkout.selectLead")} footer={footer}>
      <Body payment={payment} />
      {portal}
    </StepLayout>
  );
}

/**
 * Confirmar y pagar en la Agenda con selector: una sola cita, así que va
 * arriba en una tarjeta (con a nombre de quién) y abajo solo las cuentas, sin
 * repetirla. Sin «Volver a la agenda»: la flecha de la cabecera ya lo hace.
 * La tienda es un campo más y el pago va en su versión compacta.
 */
export function AgendaSelectCheckout() {
  const t = useAppT();
  const { state } = useBookingFlow();
  const { footer, portal } = useAsideFooter(<CheckoutFooter payment={null} />, { asideOnly: true });
  if (state.customer) return <IdentifiedCheckout key={state.customer.id} />;
  return (
    <StepLayout title={t("booking.agenda.checkout.title")} lead={t("booking.agenda.checkout.selectLead")} footer={footer}>
      <Body payment={null} />
      {portal}
    </StepLayout>
  );
}
